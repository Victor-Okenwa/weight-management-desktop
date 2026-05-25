import type { Transform } from 'node:stream';
import type { SerialOptions, SerialStatus, WeightReading } from '@weight/shared/types/index';
import { SerialPort } from 'serialport';
import { logger } from '../logger.js';
import {
  createStreamParser,
  createWeightParser,
  type IndicatorType,
  type IWeightParser,
} from '../parser/index.js';
export class SerialManager {
  private port: SerialPort | null = null;
  private streamParser: Transform | null = null;
  private weightParser: IWeightParser;
  private indicatorType: IndicatorType;
  private onWeight?: (reading: WeightReading) => void;
  private currentStatus: SerialStatus = 'idle';
  private onStatus?: (status: SerialStatus) => void;
  private unit = 'kg';

  private noDataTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly NO_DATA_DELAY = 5000; // 5 seconds

  // Reconnection state
  private serialOptions: SerialOptions | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 10; // adjust as needed
  private readonly reconnectInterval = 3000; // 3 seconds between tries
  private manualDisconnect = false; // set to true when disconnect() is called by user

  constructor(
    indicatorType: IndicatorType,
    onWeight?: (reading: WeightReading) => void,
    onStatus?: (status: SerialStatus) => void,
  ) {
    this.indicatorType = indicatorType;
    this.weightParser = createWeightParser(indicatorType);
    this.onWeight = onWeight;
    this.onStatus = onStatus;
  }

  public getStatus(): SerialStatus {
    return this.currentStatus;
  }

  connect(serialOptions: SerialOptions) {
    logger.info(
      `Attempting to open serial port ${serialOptions.port} at ${serialOptions.baudRate} baud`,
    );
    if (this.port?.isOpen) {
      logger.info(`Serial port already opened`);
      return;
    }

    // Store options for potential reconnects
    this.serialOptions = serialOptions;
    this.manualDisconnect = false; // reset because we're trying to connect again
    this.currentStatus = 'connecting';
    this.onStatus?.('connecting');

    this.port = new SerialPort({
      path: serialOptions.port,
      baudRate: serialOptions.baudRate,
      dataBits: serialOptions.dataBits,
      parity: serialOptions.parity,
      stopBits: serialOptions.stopBits,
      autoOpen: false,
    });

    // Build stream pipeline
    this.streamParser = this.port.pipe(createStreamParser(this.indicatorType));

    this.streamParser.on('data', (chunk: string | Buffer) => {
      const line = typeof chunk === 'string' ? chunk : chunk.toString();
      const reading = this.weightParser.parse(line.trim(), this.unit);
      if (reading) {
        this.clearNoDataTimer();
        if (this.currentStatus !== 'connected') {
          this.currentStatus = 'connected';
          this.onStatus?.('connected');
        }

        logger.debug(
          `[${this.indicatorType}] Weight: ${reading.weight} ${reading.unit} ${reading.isStable ? 'STABLE' : ''}`,
        );

        this.onWeight?.(reading);
      } else {
        logger.warn(`[${this.indicatorType}] Unparsed: ${line.trim()}`);
      }
    });

    this.streamParser.on('error', (err) => logger.error('Stream parser error:', err.message));

    // Handle unexpected port close (e.g., physical unplug)
    this.port.on('close', () => {
      logger.info('Serial port closed');
      this.cleanupPort();
      if (!this.manualDisconnect) {
        this.currentStatus = 'disconnected';
        this.onStatus?.('disconnected');
        this.startReconnectLoop();
      }
    });

    // Handle errors, including permission denied, device removal, etc.
    this.port.on('error', (err) => {
      logger.error(`Serial port error: ${err.message}`);
      // Specific error codes that mean the port is gone
      if (
        err.message.includes('ENXIO') ||
        err.message.includes('EIO') ||
        err.message.includes('ENOENT') ||
        err.message.includes('Access denied')
      ) {
        this.cleanupPort();
        if (!this.manualDisconnect) {
          this.currentStatus = 'disconnected';
          this.onStatus?.('disconnected');
          this.startReconnectLoop();
        }
      } else {
        // Other errors – still usable maybe, just report error
        this.currentStatus = 'error';
        this.onStatus?.('error');
      }
    });

    // Attempt to open
    this.port.open((err) => {
      if (err) {
        logger.error(`Failed to open port: ${err.message}`);
        this.cleanupPort();
        this.currentStatus = 'error';
        this.onStatus?.('error');
        // Start reconnect loop only if not manual
        if (!this.manualDisconnect) {
          this.startReconnectLoop();
        }
        return;
      }
      // Successfully opened
      logger.info(`Serial port ${serialOptions.port} opened at ${serialOptions.baudRate} baud`);

      this.currentStatus = 'connected';
      this.onStatus?.('connected');
      this.clearReconnectTimer();
      this.reconnectAttempts = 0;

      // Start watching for initial weight data
      this.startNoDataTimer();
    });
  }

  // Public method to explicitly disconnect (e.g., when the user changes settings)
  disconnect() {
    this.clearNoDataTimer();

    this.manualDisconnect = true;
    this.clearReconnectTimer();
    if (this.port?.isOpen) {
      this.port.close((err) => {
        if (err) {
          logger.error(`Error closing port: ${err.message}`);
        } else logger.info('Serial port closed by user');
      });
    }
    this.port = null;
    this.streamParser = null;
    this.currentStatus = 'disconnected';
    this.onStatus?.('disconnected');
  }

  // --- Private helpers ---

  private cleanupPort() {
    this.clearNoDataTimer();

    // Remove listeners to avoid memory leaks, then null references
    if (this.port) {
      this.port.removeAllListeners();
      this.port = null;
    }
    if (this.streamParser) {
      this.streamParser.removeAllListeners();
      this.streamParser = null;
    }
  }

  private startReconnectLoop() {
    // Don't stack multiple loops
    if (this.reconnectTimer) return;
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.warn(`Max reconnect attempts (${this.maxReconnectAttempts}) reached. Giving up.`);
      this.currentStatus = 'error';
      this.onStatus?.('error');
      return;
    }

    logger.info(
      `Reconnect attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts} in ${this.reconnectInterval}ms`,
    );

    this.currentStatus = 'reconnecting';
    this.onStatus?.('reconnecting');

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.reconnectAttempts++;
      // Only reconnect if we still have the stored options and haven't been manually disconnected
      if (this.serialOptions && !this.manualDisconnect) {
        this.connect(this.serialOptions);
      }
    }, this.reconnectInterval);
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Start a timer that will set the status to 'no_data' if no weight reading
   * arrives before the timeout expires.
   */
  private startNoDataTimer() {
    this.clearNoDataTimer();
    this.noDataTimer = setTimeout(() => {
      // If we are still in 'connected' state (i.e., no data arrived), change to no_data
      if (this.currentStatus === 'connected') {
        this.currentStatus = 'error'; // or 'idle' – whatever you prefer
        this.onStatus?.('error');
      }
    }, this.NO_DATA_DELAY);
  }

  /**
   * Cancel the no‑data timer (called when a valid weight is received).
   */
  private clearNoDataTimer() {
    if (this.noDataTimer) {
      clearTimeout(this.noDataTimer);
      this.noDataTimer = null;
    }
  }

  /**
   * Disconnect from the current port (if any) and connect with new options.
   * Does NOT mark the disconnection as "manual", so auto‑reconnect logic remains active.
   */
  public reconnect(serialOptions: SerialOptions): void {
    // Stop any pending reconnect timer
    this.clearReconnectTimer();

    // Close the current port without triggering manualDisconnect
    if (this.port?.isOpen) {
      // Remove listeners so the 'close' event doesn't start the reconnect loop
      this.port.removeAllListeners();
      this.port.close((err) => {
        if (err) logger.error('Error closing port during reconnect:', err.message);
        else logger.log('Port closed for reconfiguration');
      });
    }
    this.cleanupPort();

    // Reset reconnect attempts and proceed with fresh connect
    this.reconnectAttempts = 0;
    this.manualDisconnect = false; // allow future auto‑reconnection
    this.connect(serialOptions);
  }
}

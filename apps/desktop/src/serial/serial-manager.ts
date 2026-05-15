import {  SerialPort } from "serialport";
import { createStreamParser, IndicatorType, parseWeight } from "../parser/index.js";
import { Transform } from 'node:stream';

type COMPorts = `COM${number}`;
type BaudRate = 
  | 300 
  | 600 
  | 1200 
  | 2400 
  | 4800 
  | 9600 
  | 14400 
  | 19200 
  | 38400 
  | 57600 
  | 115200 
  | 230400 
  | 460800 
  | 921600;
  type Parity = "none" | "even" | "mark" | "odd" | "space";
  type StopBits = 1 | 1.5 | 2;
  type FlowControl = "none" | "hardware" | "software";
  type DataBits = 5 | 6 | 7 | 8;

export interface SerialOptions {
  port: COMPorts;
  baudRate: BaudRate;
  dataBits: DataBits;
  stopBits: StopBits;
  parity: Parity;
  flowControl: FlowControl;
  autoOpen: boolean;
}
export class SerialManager {
 private port: SerialPort | null = null;
  private streamParser: Transform | null = null;
  private indicatorType: IndicatorType;
    private onWeight?: (reading: { weight: number; unit: string; raw: string }) => void;
  
 constructor(indicatorType: IndicatorType, onWeight?: (reading: any) => void) {
    this.indicatorType = indicatorType;
        this.onWeight = onWeight;
  }

    connect(serialOptions: SerialOptions) {
    if (this.port?.isOpen) {
      console.warn('Serial port already open');
      return;
    }

      this.port = new SerialPort({
      path: serialOptions.port,
      baudRate: serialOptions.baudRate || 2400,
      dataBits: serialOptions.dataBits || 8,
      parity: serialOptions.parity || 'none',
      stopBits: serialOptions.stopBits || 1,
      autoOpen: serialOptions.autoOpen || false,
    });

    this.streamParser = this.port.pipe(createStreamParser(this.indicatorType));

   this.streamParser.on('data', (line: string | Buffer) => {
      this.handleData(line);
    });


     this.port.on('error', (err) => {
      console.error('Serial port error:', err.message);
    });

    this.port.open((err) => {
      if (err) {
        console.error('Failed to open port:', err.message);
        return;
      }
   
      console.log(`Serial port ${serialOptions.port} opened at ${serialOptions.baudRate} baud`);
    });
  }

   disconnect() {
    if (this.port?.isOpen) {
      this.port.close((err) => {
        if (err) console.error('Error closing port:', err.message);
        else console.log('Serial port closed');
      });
      this.port = null;
    }
  }

    private handleData(rawLine: string | Buffer) {
const line = typeof rawLine === 'string' ? rawLine : rawLine.toString();
  const cleanLine = line.trim();

    if (!cleanLine) return; // skip empty lines

    const reading = parseWeight(this.indicatorType, cleanLine)
   if (reading) {
      console.log(`[${this.indicatorType}] Weight: ${reading.weight} ${reading.unit} (raw: ${cleanLine})`);

       if (this.onWeight) {
        this.onWeight(reading);
      }
   }else {
      console.log(`[${this.indicatorType}] Unparsed: ${cleanLine}`);
    }
}
}
import {  SerialPort } from "serialport";
import { IndicatorType, parseWeight } from "../parser/index.js";
import { ReadlineParser } from '@serialport/parser-readline';
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

class AnyLineParser extends Transform {
  private buffer = '';

  _transform(chunk: Buffer, encoding: string, callback: () => void) {
    const str = this.buffer + chunk.toString();
    const lines = str.split(/[\r\n]+/);
    // The last element may be incomplete if it doesn't end with newline
    this.buffer = lines.pop() || '';
    for (const line of lines) {
      if (line) this.push(line);
    }
    callback();
  }

  _flush(callback: () => void) {
    if (this.buffer) this.push(this.buffer);
    callback();
  }
}
export class SerialManager {

 private port: SerialPort | null = null;
  private parser: Transform | null = null;   // <-- changed to Transform
  private indicatorType: IndicatorType;

  
 constructor(indicatorType: IndicatorType) {
    this.indicatorType = indicatorType;
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

    // Use a Readline parser to split data on newline (or carriage return)
    this.parser = this.port.pipe(new AnyLineParser());

     this.parser.on('data', (line: string) => {
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

    private handleData(rawLine: string) {
    const cleanLine = rawLine.trim();
    if (!cleanLine) return; // skip empty lines

    const reading = parseWeight(this.indicatorType, cleanLine)
   if (reading) {
      console.log(`[${this.indicatorType}] Weight: ${reading.weight} ${reading.unit} (raw: ${cleanLine})`);
   }else {
      console.log(`[${this.indicatorType}] Unparsed: ${cleanLine}`);
    }
}
}
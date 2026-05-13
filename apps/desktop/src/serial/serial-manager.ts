import {  SerialPort } from "serialport";
import { IndicatorType, parseWeight } from "../parser/index.js";
import { ReadlineParser } from '@serialport/parser-readline';
export class SerialManager {

private port: SerialPort | null = null
private parser: ReadlineParser | null = null;
private indicatorType: IndicatorType;

 constructor(indicatorType: IndicatorType) {
    this.indicatorType = indicatorType;
  }

    connect(portPath: string, baudRate: number) {
    if (this.port?.isOpen) {
      console.warn('Serial port already open');
      return;
    }

      this.port = new SerialPort({
      path: portPath,
      baudRate,
      dataBits: 8,
      parity: 'none',
      stopBits: 1,
      autoOpen: false,
    });

    // Use a Readline parser to split data on newline (or carriage return)
    this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

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
      console.log(`Serial port ${portPath} opened at ${baudRate} baud`);
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
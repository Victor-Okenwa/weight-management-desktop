import { Transform } from 'node:stream';

export class D300StreamParser extends Transform {
  private state: 'IDLE' | 'COLLECTING' | 'AFTER_ETX' = 'IDLE';
  private buffer = '';

  _transform(chunk: Buffer, encoding: string, callback: () => void) {
    const data = chunk.toString('binary');

    for (const char of data) {
      switch (this.state) {
        case 'IDLE':
          if (char === '\x15') {
            this.state = 'COLLECTING';
            this.buffer = '';
          }
          break;
        case 'COLLECTING':
          if (char === '\x03') {
            this.state = 'AFTER_ETX';
          } else {
            this.buffer += char;
          }
          break;
        case 'AFTER_ETX':
          // status/checksum byte – ignore
          const match = this.buffer.match(/Wt:\s*(\d+(?:\.\d+)?)/);
          if (match) {
            // Emit the clean string your parseD300 expects
            this.push(match[1] + 'Wt', 'utf8');
          }
          this.state = 'IDLE';
          this.buffer = '';
          break;
      }
    }
    callback();
  }
}

export function parseD300(data: string, unit: string = "kg") {
const trimmed = data.trim();
const match = trimmed.match(/^(-?\d+(\.\d+)?)\s*Wt$/); // e.g., "100Wt"

  if (!match) return null;
  const weight = Number.parseFloat(match[1]);

    return {
    weight,
    unit,    
    raw: data,
  };
}
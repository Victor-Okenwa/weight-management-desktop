import { Transform } from 'node:stream';

/**
 * Splits the D300 serial protocol into individual weight strings.
 * Input:  raw bytes like <15>Wt:  100<03>0<15>...
 * Output: strings like "100Wt"
 */
export class D300StreamParser extends Transform {
  private state: 'IDLE' | 'COLLECTING' | 'AFTER_ETX' = 'IDLE';
  private buffer = '';

  // No objectMode – we push strings
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
        case 'AFTER_ETX': {
          // status byte – ignore
          const match = this.buffer.match(/Wt:\s*(\d+(?:\.\d+)?)/);
          if (match) {
            this.push(match[1] + 'Wt');  // push string, e.g., "100Wt"
          }
          this.state = 'IDLE';
          this.buffer = '';
          break;
        }
      }
    }
    callback();
  }
}

/**
 * Parses a D300 weight string and detects stability.
 * Example input: "100Wt"
 */
export class D300WeightParser {
  private lastWeight: number | null = null;

  parse(data: string, unit: string = 'kg'): { weight: number; unit: string; raw: string; isStable: boolean } | null {
    const trimmed = data.trim();
    const match = trimmed.match(/^(-?\d+(\.\d+)?)\s*Wt$/);
    if (!match) return null;
    const weight = Number.parseFloat(match[1]);
    const isStable = this.lastWeight !== null && weight === this.lastWeight;
    this.lastWeight = weight;
    return { weight, unit, raw: trimmed, isStable };
  }
}
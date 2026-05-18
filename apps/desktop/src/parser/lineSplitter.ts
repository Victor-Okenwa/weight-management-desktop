import { Transform } from 'node:stream';

/**
 * Splits a stream on newline characters and outputs trimmed lines.
 * Used for indicators that send simple text lines.
 */
export class LineSplitter extends Transform {
  private buffer = '';

  _transform(chunk: Buffer, encoding: string, callback: () => void) {
    const str = this.buffer + chunk.toString();
    const lines = str.split(/[\r\n]+/);
    this.buffer = lines.pop() || '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed) this.push(trimmed);
    }
    callback();
  }

  _flush(callback: () => void) {
    if (this.buffer.trim()) this.push(this.buffer.trim());
    callback();
  }
}

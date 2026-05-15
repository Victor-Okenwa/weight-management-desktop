import { D300StreamParser, parseD300 } from './d300.js';
import { parseAveryZMor } from './averyzmor.js';
import { parseCardinal225 } from './cardinal225.js';
import { parseGeneric } from './generic.js';
import { Transform } from 'node:stream';

export type IndicatorType = 'd300' | 'averyZMor' | 'cardinal225' | 'generic';

// Default line splitter (works for Avery, Cardinal, generic, etc.)
class LineSplitter extends Transform {
  private buffer = '';
  _transform(chunk: Buffer, _encoding: string, callback: () => void) {
    const str = this.buffer + chunk.toString();
    const lines = str.split(/[\r\n]+/);
    this.buffer = lines.pop() || '';

 for (const line of lines) {
  if (line) this.push(line);   // add encoding
}

    callback();
  }
  _flush(callback: () => void) {
    if (this.buffer) this.push(this.buffer, 'utf8');
    callback();
  }
}

export function createStreamParser(type: IndicatorType): Transform {
  switch (type) {
    case 'd300':
      return new D300StreamParser();   // custom protocol
    case 'averyZMor':
    case 'cardinal225':
    case 'generic':
    default:
      return new LineSplitter();       // standard newline text
  }
}


export function parseWeight(indicatorType: IndicatorType, data: string, unit?:string) {
    switch (indicatorType){
        case 'd300': 
            return parseD300(data, unit)
        case 'averyZMor':
            return parseAveryZMor(data, unit)
        case 'cardinal225':
            return parseCardinal225(data, unit)
        default :
            parseGeneric(data, unit)
    }
}

import { parseD300 } from './d300.js';
import { parseAveryZMor } from './averyzmor.js';
import { parseCardinal225 } from './cardinal225.js';
import { parseGeneric } from './generic.js';

export type IndicatorType = 'd300' | 'averyZMor' | 'cardinal225' | 'generic';

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

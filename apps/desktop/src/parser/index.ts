import { Transform } from "node:stream";
import type { WeightReading } from "@weight/shared/types/index";
import { AveryWeightParser } from "./averyzmor.js";
import { Cardinal225WeightParser } from "./cardinal225.js";
import { D300StreamParser, D300WeightParser } from "./d300.js";
import { GenericWeightParser } from "./generic.js";
import { LineSplitter } from "./lineSplitter.js";

export type IndicatorType = "d300" | "averyZMor" | "cardinal225" | "generic";
export interface IWeightParser {
	parse(data: string, unit?: string): WeightReading | null;
}

type LineParserFn = (
	line: string,
) => { weight: number; unit: string; raw: string } | null;

export class LineBasedWeightParser extends Transform {
	private buffer = "";
	private lastWeight: number | null = null;
	private readonly parseFn: LineParserFn;

	constructor(parseFn: LineParserFn) {
		super({ objectMode: true }); // we will push objects
		this.parseFn = parseFn;
	}

	_transform(chunk: Buffer, encoding: string, callback: () => void) {
		const str = this.buffer + chunk.toString();
		const lines = str.split(/[\r\n]+/);
		this.buffer = lines.pop() || "";

		for (const line of lines) {
			if (!line.trim()) continue;
			const parsed = this.parseFn(line.trim());
			if (parsed) {
				const { weight, unit, raw } = parsed;
				const isStable = this.lastWeight !== null && weight === this.lastWeight;
				const reading: WeightReading = { weight, unit, raw, isStable };
				this.push(reading);
				this.lastWeight = weight;
			}
		}
		callback();
	}

	_flush(callback: () => void) {
		if (this.buffer.trim()) {
			const parsed = this.parseFn(this.buffer.trim());
			if (parsed) {
				const { weight, unit, raw } = parsed;
				const isStable = this.lastWeight !== null && weight === this.lastWeight;
				this.push({ weight, unit, raw, isStable });
			}
		}
		callback();
	}
}

export function createStreamParser(type: IndicatorType): Transform {
	switch (type) {
		case "d300":
			return new D300StreamParser();
		case "averyZMor":
		case "cardinal225":
		case "generic":
		default:
			return new LineSplitter();
	}
}

export function createWeightParser(type: IndicatorType): IWeightParser {
	switch (type) {
		case "d300":
			return new D300WeightParser();
		case "averyZMor":
			return new AveryWeightParser();
		case "cardinal225":
			return new Cardinal225WeightParser();
		case "generic":
		default:
			return new GenericWeightParser();
	}
}

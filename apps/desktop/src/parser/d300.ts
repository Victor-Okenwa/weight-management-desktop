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
export function parseCardinal225(data: string, unit: string = "kg") {
  const trimmed = data.trim();
  // Match: optional sign, digits, dot, digits, optional spaces, letters
  const match = trimmed.match(/^(-?\d+\.?\d*)\s*(\w+)$/);
  if (!match) return null;

  return {
    weight: Number.parseFloat(match[1]),
    unit: match[2].toLowerCase(),
    raw: data,
  };
}

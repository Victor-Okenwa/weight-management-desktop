export function parseGeneric(data: string, unit: string = "kg") {
  const trimmed = data.trim();
  // Attempt to parse something like "123.45 kg"
  const match = trimmed.match(/^(-?\d+\.?\d*)\s*(.*)$/);
  if (!match) return null;
  const readUnit = match[2].trim() || 'kg'; // fallback
  return {
    weight: Number.parseFloat(match[1]),
    unit: readUnit || unit,
    raw: data,
  };
}
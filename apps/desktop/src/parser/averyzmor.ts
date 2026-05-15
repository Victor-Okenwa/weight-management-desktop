export function parseAveryZMor(data: string, unit: string = "kg") {
 const trimmed = data.trim();
  // Example: "ST,GS,   12.3,kg"

  const parts = trimmed.split(',');
    if (parts.length !== 4) return null;

    const weightStr = parts[2].trim();
  const weight = Number.parseFloat(weightStr);
      if (Number.isNaN(weight)) return null;
  const readUnit = parts[3].trim().toLowerCase();
  return {
    weight,
    unit: readUnit || unit,
    raw: data,
    isStable: false
  };
}
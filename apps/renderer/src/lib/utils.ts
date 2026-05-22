import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getTicketPrefix(name: string): string {
  // Split the name into words (by whitespace)
  const words = name.trim().split(/\s+/);
  // Take up to the first 3 words, get their first letter, join and uppercase
  return words
    .slice(0, 3)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase();
}

/**
 * Converts a camelCase object into snake_case keys, preserving values.
 * Recursively transforms keys up to a depth of 3.
 * Example: { mySimpleKey: { innerValue: 5 } } => { my_simple_key: { inner_value: 5 } }
 */
export function toSnakeCaseObject<T extends Record<string, unknown>>(
  obj: T,
  depth = 1,
): Record<string, unknown> {
  function camelToSnake(str: string): string {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase();
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const newKey = camelToSnake(key);
    if (depth < 3 && value !== null && typeof value === 'object' && !Array.isArray(value)) {
      // Recurse for nested plain objects, increase depth
      result[newKey] = toSnakeCaseObject(value as Record<string, unknown>, depth + 1);
    } else if (depth < 3 && Array.isArray(value)) {
      // If value is array and its elements are objects, map recursively
      result[newKey] = value.map((item) =>
        item && typeof item === 'object' && !Array.isArray(item)
          ? toSnakeCaseObject(item as Record<string, unknown>, depth + 1)
          : item,
      );
    } else {
      result[newKey] = value;
    }
  }
  return result;
}

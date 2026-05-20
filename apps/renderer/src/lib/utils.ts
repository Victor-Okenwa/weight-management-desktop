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
 * Example: { mySimpleKey: 5 } => { my_simple_key: 5 }
 */
export function toSnakeCaseObject<T extends Record<string, any>>(obj: T): Record<string, any> {
  function camelToSnake(str: string) {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase();
  }

  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const newKey = camelToSnake(key);
    result[newKey] = value;
  }
  return result;
}

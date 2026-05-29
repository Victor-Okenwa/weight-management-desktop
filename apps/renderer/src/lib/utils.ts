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

export function getPortNumber(port: string): number {
  const match = typeof port === 'string' ? /COM(\d+)/i.exec(port) : null;
  console.log(match?.[1]);
  return parseInt(String(match?.[1]), 10) ?? '';
}

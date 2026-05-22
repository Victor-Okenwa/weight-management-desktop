import type { LogLevel } from '@weight/shared/types/index';

export function logger(level: LogLevel, ...args: never[] | string[]) {
  const message = args
    .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg)))
    .join(' ');
  // Keep console for dev convenience
  console[level](...args);
  // Send to main process
  window.electronAPI?.log(level, message);
}

export const rendererLogger = {
  error: (...args: never[]) => logger('error', ...args),
  warn: (...args: never[]) => logger('warn', ...args),
  info: (...args: never[]) => logger('info', ...args),
  debug: (...args: never[]) => logger('debug', ...args),
};

import type { LogLevel } from '@weight/shared/types/index';

function log(level: LogLevel, ...args: never[]) {
  const message = args
    .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg)))
    .join(' ');
  // Keep console for dev convenience
  console[level](...args);
  // Send to main process
  window.electronAPI?.log(level, message);
}

export const rendererLogger = {
  error: (...args: never[]) => log('error', ...args),
  warn: (...args: never[]) => log('warn', ...args),
  info: (...args: never[]) => log('info', ...args),
  debug: (...args: never[]) => log('debug', ...args),
};

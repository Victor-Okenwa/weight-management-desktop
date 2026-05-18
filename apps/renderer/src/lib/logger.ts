import type { LogLevel } from '@weight/shared/types/index';

function log(level: LogLevel, ...args: any[]) {
  const message = args
    .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg)))
    .join(' ');
  // Keep console for dev convenience
  console[level](...args);
  // Send to main process
  window.electronAPI?.log(level, message);
}

export const rendererLogger = {
  error: (...args: any[]) => log('error', ...args),
  warn: (...args: any[]) => log('warn', ...args),
  info: (...args: any[]) => log('info', ...args),
  debug: (...args: any[]) => log('debug', ...args),
};

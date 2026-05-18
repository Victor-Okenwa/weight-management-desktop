import path from 'node:path';
import { app } from 'electron';
import logger from 'electron-log';

// Set log file location to <userData>/logs/main.log
const logDir = path.join(app.getPath('userData'), 'logs');
logger.transports.file.resolvePathFn = () => {
  return path.join(logDir, 'main.log');
};

// Set log level (you can control this via settings later)
logger.transports.file.level = 'info'; // production: 'info', development: 'debug'
logger.transports.console.level = 'debug';

// Limit file size to 5 MB and keep up to 5 backup files
logger.transports.file.maxSize = 5 * 1024 * 1024; // 5 MB

// Optional: customize line format
logger.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';

// Export the configured logger
export { logger };

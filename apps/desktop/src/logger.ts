import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';
import logger from 'electron-log';

// Configure the log file path
const logDir = path.join(app.getPath('userData'), 'logs');
logger.transports.file.resolvePathFn = () => {
  return path.join(logDir, 'main.log');
};

// Set the maximum size of a log file (e.g., 5 MB)
logger.transports.file.maxSize = 5 * 1024 * 1024;

// Custom archive function for rotating log files
logger.transports.file.archiveLogFn = (oldLogFile) => {
  const file = oldLogFile.toString();
  const info = path.parse(file);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  try {
    // Rename the old log file with a timestamp and sequence number
    const rotatedFile = path.join(info.dir, `${info.name}.${timestamp}.old${info.ext}`);
    fs.renameSync(file, rotatedFile);

    // Optional: Keep only the last 5 rotated files
    const dir = info.dir;
    const files = fs
      .readdirSync(dir)
      .filter((f) => f.startsWith(info.name) && f.endsWith('.old' + info.ext))
      .map((f) => ({ name: f, time: fs.statSync(path.join(dir, f)).mtime.getTime() }))
      .sort((a, b) => a.time - b.time); // oldest first

    while (files.length > 5) {
      fs.unlinkSync(path.join(dir, files[0].name));
      files.shift();
    }
  } catch (e) {
    console.warn('Could not rotate log', e);
  }
};

export { logger };

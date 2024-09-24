import log4js from 'log4js';

// Directory and file settings for logs
const logDir = 'logs';
const logFile = 'app.log';

// Set up log4js configuration
log4js.configure({
  appenders: {
    console: { type: 'stdout', layout: { type: 'colored' } },  // Log to console
    file: {
      type: 'file',
      filename: `${logDir}/${logFile}`,
      layout: { type: 'basic' },
      maxLogSize: 10485760,  // 10 MB
      backups: 3,            // Keep 3 backup files
      compress: true         // Compress the backups
    }
  },
  categories: {
    default: { appenders: ['console', 'file'], level: 'debug' }
  }
});

// Export the logger
export const logger = log4js.getLogger();

// errorLogger.js
const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info'
};

class ErrorLogger {
  constructor(context) {
    this.context = context;
  }

  formatError(error, additionalInfo = {}) {
    return {
      timestamp: new Date().toISOString(),
      context: this.context,
      message: error.message,
      code: error.code,
      stack: error.stack,
      ...additionalInfo
    };
  }

  log(level, error, additionalInfo = {}) {
    const formattedError = this.formatError(error, additionalInfo);
    
    // Log to console with appropriate styling
    const styles = {
      error: 'background: #ff0033; color: white; padding: 2px 5px; border-radius: 2px;',
      warn: 'background: #ffcc00; color: black; padding: 2px 5px; border-radius: 2px;',
      info: 'background: #0099ff; color: white; padding: 2px 5px; border-radius: 2px;'
    };

    console.groupCollapsed(`%c${level.toUpperCase()}: ${this.context}`, styles[level]);
    console.log('Timestamp:', formattedError.timestamp);
    console.log('Message:', formattedError.message);
    console.log('Additional Info:', additionalInfo);
    if (formattedError.stack) {
      console.log('Stack Trace:', formattedError.stack);
    }
    console.groupEnd();

    // Here you could add additional logging services
    // e.g., send to a logging service, analytics, etc.
  }

  error(error, additionalInfo = {}) {
    this.log(LOG_LEVELS.ERROR, error, additionalInfo);
  }

  warn(error, additionalInfo = {}) {
    this.log(LOG_LEVELS.WARN, error, additionalInfo);
  }

  info(error, additionalInfo = {}) {
    this.log(LOG_LEVELS.INFO, error, additionalInfo);
  }
}

export const createLogger = (context) => new ErrorLogger(context);
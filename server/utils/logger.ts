/**
 * Logger utility for TerraBuild platform
 * 
 * This provides a consistent logging interface throughout the application.
 * It supports different log levels and can be extended to include additional
 * functionality like remote logging or log rotation.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private prefix: string;

  constructor(prefix: string = 'TerraBuild') {
    this.prefix = prefix;
  }

  /**
   * Format a log message with timestamp and prefix
   */
  private format(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}] [${this.prefix}] ${message}`;
  }

  /**
   * Log a debug message
   */
  debug(message: string, ...args: any[]): void {
    console.debug(this.format('debug', message), ...args);
  }

  /**
   * Log an info message
   */
  info(message: string, ...args: any[]): void {
    console.info(this.format('info', message), ...args);
  }

  /**
   * Log a warning message
   */
  warn(message: string, ...args: any[]): void {
    console.warn(this.format('warn', message), ...args);
  }

  /**
   * Log an error message
   */
  error(message: string, ...args: any[]): void {
    console.error(this.format('error', message), ...args);
  }

  /**
   * Create a child logger with a specific prefix
   */
  child(prefix: string): Logger {
    return new Logger(`${this.prefix}:${prefix}`);
  }
}

// Export a default instance
export const logger = new Logger();

// Also export the class for custom instances
export default Logger;
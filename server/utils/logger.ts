/**
 * Logger Utility
 * 
 * This file provides a simple logging utility for the application.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = 'info';

  private constructor() {}

  /**
   * Get the logger instance (singleton)
   * 
   * @returns The logger instance
   */
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Set the log level
   * 
   * @param level The log level to set
   */
  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * Log a debug message
   * 
   * @param message The message to log
   */
  public debug(message: string): void {
    if (this.shouldLog('debug')) {
      console.debug(`[DEBUG] ${message}`);
    }
  }

  /**
   * Log an info message
   * 
   * @param message The message to log
   */
  public info(message: string): void {
    if (this.shouldLog('info')) {
      console.info(`[INFO] ${message}`);
    }
  }

  /**
   * Log a warning message
   * 
   * @param message The message to log
   */
  public warn(message: string): void {
    if (this.shouldLog('warn')) {
      console.warn(`[WARN] ${message}`);
    }
  }

  /**
   * Log an error message
   * 
   * @param message The message to log
   */
  public error(message: string): void {
    if (this.shouldLog('error')) {
      console.error(`[ERROR] ${message}`);
    }
  }

  /**
   * Check if the current log level allows logging
   * 
   * @param level The level to check
   * @returns Whether the level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: {[key in LogLevel]: number} = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };

    return levels[level] >= levels[this.logLevel];
  }
}
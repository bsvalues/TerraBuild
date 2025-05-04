/**
 * Logger Utility for Benton County Building System
 * 
 * This module provides a standardized logging interface for the application.
 */

/**
 * Simple logger for the application
 */
class Logger {
  /**
   * Log an informational message
   * @param message The main message to log
   * @param meta Optional metadata to include
   */
  info(message: string, meta?: any): void {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, meta ? meta : '');
  }

  /**
   * Log a warning message
   * @param message The warning message to log
   * @param meta Optional metadata to include
   */
  warn(message: string, meta?: any): void {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, meta ? meta : '');
  }

  /**
   * Log an error message
   * @param message The error message to log
   * @param error Optional error object to include
   */
  error(message: string, error?: any): void {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error ? error : '');
  }

  /**
   * Log a debug message (only in development)
   * @param message The debug message to log
   * @param meta Optional metadata to include
   */
  debug(message: string, meta?: any): void {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, meta ? meta : '');
    }
  }

  /**
   * Log a success message
   * @param message The success message to log
   * @param meta Optional metadata to include
   */
  success(message: string, meta?: any): void {
    console.log(`[SUCCESS] ${new Date().toISOString()} - ${message}`, meta ? meta : '');
  }
}

// Export a singleton instance
export const logger = new Logger();
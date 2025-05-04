/**
 * Standardized error handling framework for the TerraBuild application
 * 
 * This module provides a consistent approach to error handling across
 * the application, with specific error types for different components.
 */

// Base application error class
export class AppError extends Error {
  public statusCode: number;
  public errorCode: string;
  public isOperational: boolean;
  
  constructor(
    message: string, 
    statusCode = 500, 
    errorCode = 'INTERNAL_SERVER_ERROR',
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    
    // Correctly capture stack trace
    Error.captureStackTrace(this, this.constructor);
    
    // Set prototype explicitly for better instanceof support
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// Geographic service specific errors
export class GeographicServiceError extends AppError {
  constructor(
    message: string,
    statusCode = 500,
    errorCode = 'GEO_SERVICE_ERROR',
    isOperational = true
  ) {
    super(message, statusCode, errorCode, isOperational);
    Object.setPrototypeOf(this, GeographicServiceError.prototype);
  }
  
  // Factory methods for common geographic errors
  static entityNotFound(entityType: string, identifier: string | number): GeographicServiceError {
    return new GeographicServiceError(
      `${entityType} not found with identifier: ${identifier}`,
      404,
      'GEO_ENTITY_NOT_FOUND',
      true
    );
  }
  
  static invalidGeographicData(details: string): GeographicServiceError {
    return new GeographicServiceError(
      `Invalid geographic data: ${details}`,
      400,
      'GEO_INVALID_DATA',
      true
    );
  }
  
  static duplicateEntity(entityType: string, identifier: string | number): GeographicServiceError {
    return new GeographicServiceError(
      `${entityType} with identifier ${identifier} already exists`,
      409,
      'GEO_DUPLICATE_ENTITY',
      true
    );
  }
  
  static relationshipError(details: string): GeographicServiceError {
    return new GeographicServiceError(
      `Geographic relationship error: ${details}`,
      400,
      'GEO_RELATIONSHIP_ERROR',
      true
    );
  }
  
  static databaseError(details: string): GeographicServiceError {
    return new GeographicServiceError(
      `Geographic database error: ${details}`,
      500,
      'GEO_DATABASE_ERROR',
      true
    );
  }
}

// Error handling middleware for Express
export const errorHandler = (err: any, req: any, res: any, next: any) => {
  // Default values
  let statusCode = 500;
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected error occurred';
  let isOperational = false;
  
  // Handle our custom error types
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorCode = err.errorCode;
    message = err.message;
    isOperational = err.isOperational;
  }
  
  // Log the error (operational errors less verbosely)
  if (!isOperational) {
    console.error('NON-OPERATIONAL ERROR:', err);
  } else {
    console.log(`OPERATIONAL ERROR: ${errorCode} - ${message}`);
  }
  
  // Send standardized response
  res.status(statusCode).json({
    status: 'error',
    errorCode,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
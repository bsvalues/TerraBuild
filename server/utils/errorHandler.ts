/**
 * Error Handler Utility for Building Cost Building System
 * 
 * This file contains utility functions for standardized error handling
 * across the application.
 */

import { Response } from 'express';

// Structured error response interface
export interface ErrorResponse {
  message: string;
  code?: string;
  details?: any;
}

/**
 * Standardized error codes for the application
 */
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  CALCULATION_ERROR = 'CALCULATION_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  GENERAL_ERROR = 'GENERAL_ERROR'
}

/**
 * Send a standardized error response
 * @param res Express response object
 * @param statusCode HTTP status code
 * @param message Error message
 * @param code Error code
 * @param details Additional error details
 */
export function sendErrorResponse(
  res: Response, 
  statusCode: number, 
  message: string, 
  code: string = ErrorCode.GENERAL_ERROR,
  details?: any
): void {
  const response: ErrorResponse = { message, code };
  
  if (details) {
    response.details = details;
  }
  
  res.status(statusCode).json(response);
}

/**
 * Handle validation errors
 * @param res Express response object
 * @param error Error object
 */
export function handleValidationError(res: Response, error: any): void {
  console.log('Validation error:', error);
  
  sendErrorResponse(
    res,
    400,
    'Invalid input data',
    ErrorCode.VALIDATION_ERROR,
    error.errors || error.message
  );
}

/**
 * Handle database errors
 * @param res Express response object
 * @param error Error object
 */
export function handleDatabaseError(res: Response, error: any): void {
  console.error('Database error:', error);
  
  sendErrorResponse(
    res,
    500,
    'Database operation failed',
    ErrorCode.DATABASE_ERROR,
    process.env.NODE_ENV === 'development' ? error.message : undefined
  );
}

/**
 * Handle calculation errors
 * @param res Express response object
 * @param error Error object
 */
export function handleCalculationError(res: Response, error: any): void {
  console.error('Calculation error:', error);
  
  sendErrorResponse(
    res,
    500,
    'Error in cost calculation',
    ErrorCode.CALCULATION_ERROR,
    process.env.NODE_ENV === 'development' ? error.message : undefined
  );
}

/**
 * Handle not found errors
 * @param res Express response object
 * @param resourceType Type of resource not found
 * @param id ID of the resource
 */
export function handleNotFoundError(res: Response, resourceType: string, id?: number | string): void {
  sendErrorResponse(
    res,
    404,
    `${resourceType} not found${id ? ` (ID: ${id})` : ''}`,
    ErrorCode.NOT_FOUND
  );
}

/**
 * Create a generic error handler for Express routes
 * @param handler The route handler function to wrap
 * @returns A wrapped route handler with error handling
 */
export function withErrorHandling(handler: Function) {
  return async (req: any, res: any, next: any) => {
    try {
      await handler(req, res, next);
    } catch (error: any) {
      console.error('Unhandled error in route:', error);
      sendErrorResponse(
        res,
        500,
        'An unexpected error occurred',
        ErrorCode.GENERAL_ERROR,
        process.env.NODE_ENV === 'development' ? error.message : undefined
      );
    }
  };
}
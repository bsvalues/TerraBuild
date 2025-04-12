/**
 * ID Generator Utility
 * 
 * This utility generates unique identifiers for various parts of the application.
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a unique ID using UUID v4
 * @returns {string} A unique identifier
 */
export function generateUniqueId(): string {
  return uuidv4();
}

/**
 * Generate a sequential ID with a prefix
 * @param {string} prefix - Prefix for the ID 
 * @param {number} sequence - Sequence number
 * @returns {string} A sequential ID with prefix
 */
export function generateSequentialId(prefix: string, sequence: number): string {
  return `${prefix}-${sequence.toString().padStart(6, '0')}`;
}

/**
 * Generate a timestamp-based ID
 * @param {string} prefix - Optional prefix for the ID
 * @returns {string} A timestamp-based ID
 */
export function generateTimestampId(prefix: string = ''): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${prefix ? '-' : ''}${timestamp}-${random}`;
}

/**
 * Generate a short ID for user-friendly references
 * @returns {string} A short, user-friendly ID
 */
export function generateShortId(): string {
  // Use a mix of characters that are easy to read and type
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  
  // Generate a 6-character ID
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}
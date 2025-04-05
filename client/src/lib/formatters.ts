/**
 * Utility functions for formatting data for display
 */

/**
 * Format a number as currency (USD)
 * @param value The number to format
 * @param options Intl.NumberFormat options
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number,
  options: Intl.NumberFormatOptions = {}
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  }).format(value);
}

/**
 * Format a number as a percentage
 * @param value The number to format (0-1)
 * @param options Intl.NumberFormat options
 * @returns Formatted percentage string
 */
export function formatPercent(
  value: number,
  options: Intl.NumberFormatOptions = {}
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  }).format(value);
}

/**
 * Format a date string as a localized date string
 * @param dateString The date string to format
 * @param options Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export function formatDate(
  dateString: string | Date,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const date = dateString instanceof Date ? dateString : new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  }).format(date);
}

/**
 * Format a number with specified decimal places
 * @param value The number to format
 * @param places Number of decimal places
 * @returns Formatted number string
 */
export function formatNumber(value: number, places: number = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: places,
  }).format(value);
}

/**
 * Truncate a string to a specified length with ellipsis
 * @param text The string to truncate
 * @param length Maximum length before truncation
 * @returns Truncated string
 */
export function truncateText(text: string, length: number = 100): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

/**
 * Format a number as square feet
 * @param value The number to format
 * @returns Formatted square feet string
 */
export function formatSquareFeet(value: number): string {
  return `${formatNumber(value)} sq ft`;
}

/**
 * Format a number as cost per square foot
 * @param value The number to format
 * @returns Formatted cost per square foot string
 */
export function formatCostPerSqFt(value: number): string {
  return `${formatCurrency(value)}/sq ft`;
}
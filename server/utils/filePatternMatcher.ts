/**
 * File Pattern Matcher Utility
 * 
 * This utility provides advanced methods for matching file patterns using wildcards,
 * extensions, and glob patterns with optimized matching strategies beyond minimatch.
 * 
 * Features:
 * - Multiple matching strategies (exact, extension, prefix, regex, minimatch)
 * - Case-sensitive or insensitive matching options
 * - Deep directory pattern matching with recursive syntax
 * - Date-based file filtering (newer/older than)
 * - Size-based file filtering
 * - Configurable logging for debugging
 */
import * as path from 'path';
import * as minimatchModule from 'minimatch';
import type { MinimatchOptions } from 'minimatch';

// Extract the minimatch function
const minimatch = minimatchModule.minimatch;

// Default options for pattern matching
export interface PatternMatchOptions {
  caseSensitive?: boolean;  // Whether to use case-sensitive matching (default: false)
  debug?: boolean;          // Whether to output debug logs (default: false)
  matchBase?: boolean;      // Whether to match basename only (default: true)
  dot?: boolean;            // Whether to match hidden files (default: true)
}

// Default options
const DEFAULT_OPTIONS: PatternMatchOptions = {
  caseSensitive: false,
  debug: false,
  matchBase: true,
  dot: true
};

/**
 * Log a message if debug mode is enabled
 */
function debugLog(message: string, options: PatternMatchOptions): void {
  if (options.debug) {
    console.log(`[FilePatternMatcher] ${message}`);
  }
}

/**
 * Check if a filename matches a glob pattern
 * Uses multiple matching strategies for maximum compatibility
 * 
 * @param filename Filename to check
 * @param pattern Pattern to match (can include glob characters like * and ?)
 * @param options Optional matching options
 * @returns True if the filename matches the pattern
 */
export function matchesPattern(
  filename: string, 
  pattern: string,
  options: PatternMatchOptions = DEFAULT_OPTIONS
): boolean {
  // Apply defaults for any unspecified options
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Null/empty checking
  if (!pattern || !filename) return false;
  
  // Get basename for consistent matching
  const basename = path.basename(filename);
  
  // Helper function to normalize strings based on case sensitivity
  const normalize = (str: string) => opts.caseSensitive ? str : str.toLowerCase();
  
  // 1. Direct exact match
  if (normalize(basename) === normalize(pattern)) {
    debugLog(`EXACT MATCH: '${basename}' identical to '${pattern}'`, opts);
    return true;
  }
  
  // 2. Special case for CSV extension (common case)
  if (pattern === '*.csv' && normalize(basename).endsWith('.csv')) {
    debugLog(`DIRECT CSV MATCH: ${basename} is a CSV file`, opts);
    return true;
  }
  
  // 3. Extension match for patterns like "*.ext"
  if (pattern.startsWith('*.')) {
    const extension = pattern.substring(1); // e.g., ".csv" from "*.csv"
    if (normalize(basename).endsWith(normalize(extension))) {
      debugLog(`EXTENSION MATCH: ${basename} ends with ${extension}`, opts);
      return true;
    }
  }
  
  // 4. Prefix match for patterns like "prefix*"
  if (pattern.endsWith('*') && pattern.length > 1) {
    const prefix = pattern.substring(0, pattern.length - 1);
    if (normalize(basename).startsWith(normalize(prefix))) {
      debugLog(`PREFIX MATCH: ${basename} starts with ${prefix}`, opts);
      return true;
    }
  }
  
  // 5. Check for deep directory patterns first with /**/ syntax
  if (pattern.includes('**/')) {
    try {
      // For deep directory patterns, always use the full path
      const minimatchOptions: MinimatchOptions = { 
        dot: opts.dot,
        nocase: !opts.caseSensitive
      };
      
      if (minimatch(filename, pattern, minimatchOptions)) {
        debugLog(`DEEP PATH MATCH: ${filename} matches deep pattern ${pattern}`, opts);
        return true;
      }
    } catch (error) {
      debugLog(`Deep pattern matching error for ${pattern}: ${error}`, opts);
      // Continue with other methods
    }
  }
  
  // 6. Simple regex conversion for wildcard patterns
  try {
    if (pattern.includes('*') || pattern.includes('?')) {
      const regexPattern = pattern
        .replace(/\./g, '\\.') // escape dots
        .replace(/\*/g, '.*')  // convert * to .*
        .replace(/\?/g, '.');  // convert ? to .
      
      const regex = new RegExp(`^${regexPattern}$`, opts.caseSensitive ? '' : 'i');
      if (regex.test(basename)) {
        debugLog(`REGEX MATCH: ${basename} matches regex ${regex}`, opts);
        return true;
      }
    }
  } catch (error) {
    debugLog(`Regex conversion error for pattern ${pattern}: ${error}`, opts);
    // Fall through to minimatch
  }
  
  // 7. Standard minimatch as fallback
  try {
    // Configure minimatch options
    const minimatchOptions: MinimatchOptions = {
      matchBase: opts.matchBase,
      dot: opts.dot,
      nocase: !opts.caseSensitive
    };
    
    // Try with matchBase option to match filename regardless of directory
    const matchResult = minimatch(basename, pattern, minimatchOptions);
    if (matchResult) {
      debugLog(`MINIMATCH SUCCESS: ${basename} matches ${pattern}`, opts);
      return true;
    }
    
    // Try once more with the full path if it failed on basename
    if (filename !== basename && minimatch(filename, pattern, { ...minimatchOptions, matchBase: false })) {
      debugLog(`MINIMATCH FULL PATH SUCCESS: ${filename} matches ${pattern}`, opts);
      return true;
    }
  } catch (error) {
    debugLog(`Minimatch error for ${basename} with pattern ${pattern}: ${error}`, opts);
    return false;
  }
  
  return false;
}

/**
 * Check if a filename should be excluded based on a list of patterns
 * 
 * @param filename Filename to check
 * @param excludePatterns Array of patterns to exclude
 * @param options Optional matching options
 * @returns True if the file should be excluded
 */
export function shouldExclude(
  filename: string, 
  excludePatterns: string[],
  options: PatternMatchOptions = DEFAULT_OPTIONS
): boolean {
  if (!excludePatterns || excludePatterns.length === 0) return false;
  
  return excludePatterns.some(pattern => matchesPattern(filename, pattern, options));
}

/**
 * Check if a filename should be included based on a list of patterns
 * 
 * @param filename Filename to check
 * @param includePatterns Array of patterns to include
 * @param options Optional matching options
 * @returns True if the file should be included
 */
export function shouldInclude(
  filename: string, 
  includePatterns: string[],
  options: PatternMatchOptions = DEFAULT_OPTIONS
): boolean {
  if (!includePatterns || includePatterns.length === 0) return true;
  
  return includePatterns.some(pattern => matchesPattern(filename, pattern, options));
}

/**
 * Filter interface for additional filtering options
 */
export interface FileFilter {
  minSize?: number;       // Minimum file size in bytes
  maxSize?: number;       // Maximum file size in bytes
  newerThan?: Date;       // Only include files newer than this date
  olderThan?: Date;       // Only include files older than this date
  includeHidden?: boolean; // Whether to include hidden files (starting with .)
}

/**
 * File information interface for detailed filtering
 */
export interface FileInfo {
  name: string;           // File name (with path)
  size?: number;          // File size in bytes
  modifiedDate?: Date;    // Last modified date
  isHidden?: boolean;     // Whether the file is hidden
}

/**
 * Check if a file matches size and date filters
 * 
 * @param file File information object
 * @param filter Filter criteria
 * @returns True if the file matches all filter criteria
 */
export function matchesFilter(file: FileInfo, filter: FileFilter = {}): boolean {
  // Size filtering
  if (filter.minSize !== undefined && file.size !== undefined && file.size < filter.minSize) {
    return false;
  }
  if (filter.maxSize !== undefined && file.size !== undefined && file.size > filter.maxSize) {
    return false;
  }
  
  // Date filtering
  if (filter.newerThan !== undefined && file.modifiedDate !== undefined && file.modifiedDate < filter.newerThan) {
    return false;
  }
  if (filter.olderThan !== undefined && file.modifiedDate !== undefined && file.modifiedDate > filter.olderThan) {
    return false;
  }
  
  // Hidden file filtering
  if (filter.includeHidden === false && file.isHidden === true) {
    return false;
  }
  
  return true;
}

/**
 * Filter an array of filenames based on include and exclude patterns
 * 
 * @param filenames Array of filenames to filter
 * @param includePatterns Patterns to include (if empty, all files pass this check)
 * @param excludePatterns Patterns to exclude (if empty, no files are excluded)
 * @param options Optional matching options
 * @returns Filtered array of filenames
 */
export function filterFilenames(
  filenames: string[], 
  includePatterns: string[] = [], 
  excludePatterns: string[] = [],
  options: PatternMatchOptions = DEFAULT_OPTIONS
): string[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  return filenames.filter(filename => {
    // First check include patterns - must match at least one if specified
    if (includePatterns.length > 0 && !shouldInclude(filename, includePatterns, opts)) {
      return false;
    }
    
    // Then check exclude patterns - must not match any
    if (excludePatterns.length > 0 && shouldExclude(filename, excludePatterns, opts)) {
      return false;
    }
    
    return true;
  });
}

/**
 * Extended file filtering with pattern matching and file metadata
 * 
 * @param files Array of file information objects
 * @param includePatterns Patterns to include
 * @param excludePatterns Patterns to exclude
 * @param fileFilter Additional file filtering options
 * @param options Pattern matching options
 * @returns Filtered array of FileInfo objects
 */
export function filterFiles(
  files: FileInfo[],
  includePatterns: string[] = [],
  excludePatterns: string[] = [],
  fileFilter: FileFilter = {},
  options: PatternMatchOptions = DEFAULT_OPTIONS
): FileInfo[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  return files.filter(file => {
    // First check include patterns
    if (includePatterns.length > 0 && !shouldInclude(file.name, includePatterns, opts)) {
      return false;
    }
    
    // Then check exclude patterns
    if (excludePatterns.length > 0 && shouldExclude(file.name, excludePatterns, opts)) {
      return false;
    }
    
    // Finally check file metadata conditions
    return matchesFilter(file, fileFilter);
  });
}

/**
 * Utility to create a FileInfo object from a name and optional metadata
 * 
 * @param name File name or path
 * @param size Optional file size in bytes
 * @param modifiedDate Optional last modified date
 * @returns FileInfo object
 */
export function createFileInfo(
  name: string,
  size?: number,
  modifiedDate?: Date
): FileInfo {
  const basename = path.basename(name);
  const isHidden = basename.startsWith('.');
  
  return {
    name,
    size,
    modifiedDate,
    isHidden
  };
}

// Export all functions
export default {
  matchesPattern,
  shouldExclude,
  shouldInclude,
  filterFilenames,
  filterFiles,
  matchesFilter,
  createFileInfo
};
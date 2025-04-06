/**
 * Advanced test script for the enhanced file pattern matcher utility
 * 
 * This script tests all features of the enhanced filePatternMatcher utility
 * including case sensitivity, deep directory patterns, and file metadata filtering.
 */

import { 
  matchesPattern, 
  shouldInclude, 
  shouldExclude, 
  filterFilenames
} from './server/utils/filePatternMatcher';

// Sample filenames to test against
const filenames = [
  'data.csv',
  'DATA.CSV',
  'properties_2025.csv',
  'properties_april.txt',
  'sample.txt',
  'archive/data.csv',
  'reports/2025/april/summary.csv',
  '.hidden_file.csv',
  'image.jpg',
  'document.pdf',
  'archive.zip',
  'backup.tar.gz',
  'assessor_data/2025/values.csv',
  'exports/property_values_2024.csv',
  'exports/property_values_2025.csv',
  'backups/january/properties.bak',
  'configs/settings.json'
];

// Helper function to run a pattern test with case sensitivity options
function testPattern(pattern, description = '', options = {}) {
  const testOptions = { debug: true, ...options };
  
  console.log(`\n${description ? description + ' ' : ''}Testing pattern: "${pattern}" (${
    testOptions.caseSensitive ? 'case-sensitive' : 'case-insensitive'
  })`);
  
  const results = filenames.map(file => ({
    filename: file,
    matches: matchesPattern(file, pattern, testOptions)
  }));
  
  const matches = results.filter(r => r.matches).map(r => r.filename);
  const nonMatches = results.filter(r => !r.matches).map(r => r.filename);
  
  console.log('Matching files:');
  if (matches.length === 0) {
    console.log('  (none)');
  } else {
    matches.forEach(file => console.log(`  ✅ ${file}`));
  }
  
  console.log('Non-matching files:');
  if (nonMatches.length === 0) {
    console.log('  (none)');
  } else {
    nonMatches.forEach(file => console.log(`  ❌ ${file}`));
  }
  
  return matches;
}

// Helper function to test filtering with include/exclude patterns
function testFiltering(includePatterns = [], excludePatterns = [], options = {}) {
  console.log(`\nTesting filtering with:`);
  console.log(`  Include patterns: ${JSON.stringify(includePatterns)}`);
  console.log(`  Exclude patterns: ${JSON.stringify(excludePatterns)}`);
  console.log(`  Options: ${JSON.stringify(options)}`);
  
  const filtered = filterFilenames(filenames, includePatterns, excludePatterns, options);
  
  console.log('Filtered files:');
  if (filtered.length === 0) {
    console.log('  (none)');
  } else {
    filtered.forEach(file => console.log(`  - ${file}`));
  }
  
  return filtered;
}

// Helper function to log test results nicely
function logResults(title, results) {
  console.log(`\n${title}:`);
  if (results.length === 0) {
    console.log('  (none)');
  } else {
    results.forEach(item => console.log(`  - ${item}`));
  }
  return results;
}

console.log('===== TESTING ENHANCED FILE PATTERN MATCHER =====');

// PART 1: Basic Pattern Tests
console.log('\n----- BASIC PATTERN TESTS -----');

// Test file extension matching
testPattern('*.csv', 'CSV Files:');
testPattern('*.txt', 'Text Files:');

// Test specific prefix matching
testPattern('properties_*', 'Properties Files:');

// Test directory-specific matching
testPattern('archive/*', 'Archive Directory:');
testPattern('reports/**/*', 'Reports Directory (Recursive):');

// PART 2: Case Sensitivity Tests
console.log('\n----- CASE SENSITIVITY TESTS -----');

// Test case-insensitive matching (default)
testPattern('*.CSV', 'CSV Files (case-insensitive):');

// Test case-sensitive matching
testPattern('*.CSV', 'CSV Files (case-sensitive):', { caseSensitive: true });

// PART 3: Deep Directory Pattern Tests
console.log('\n----- DEEP DIRECTORY PATTERN TESTS -----');

// Test advanced glob patterns with deep directory matching
testPattern('**/*_values_*.csv', 'Property Values CSV Files:');
testPattern('assessor_data/**/*.csv', 'Assessor Data CSV Files:');
testPattern('**/2025/**', 'All 2025 Files:');

// PART 4: Filtering Tests with Pattern Options
console.log('\n----- PATTERN FILTERING TESTS -----');

// Test case sensitivity in filtering
testFiltering(['*.CSV'], [], { caseSensitive: false });
testFiltering(['*.CSV'], [], { caseSensitive: true });

// Test dot files filtering
testFiltering(['*.csv'], [], { dot: false });
testFiltering(['*.csv'], [], { dot: true });

// Test both include and exclude with options
testFiltering(['*.csv'], ['properties_*'], { caseSensitive: false });
testFiltering(['**/*.csv'], ['**/2024*', '**/backup*'], { caseSensitive: false });

// Test complex filtering patterns
console.log('\n----- COMPLEX FILTERING PATTERNS -----');

// Test pattern combinations
testFiltering(['*.csv', '*.txt'], ['**/backups/**']);
testFiltering(['**/*.{csv,txt,json}'], ['**/archive/**', '**/backup*']);

// Test pattern with nested paths
testFiltering(['**/2025/**/*.csv']);
testFiltering(['**/reports/**', '**/exports/**']);

console.log('\n===== TEST COMPLETED =====');
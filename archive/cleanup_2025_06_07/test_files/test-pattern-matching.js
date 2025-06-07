import { minimatch } from 'minimatch';

function testPattern(filename, pattern) {
  console.log(`Testing ${filename} against pattern ${pattern}`);
  
  // Direct match
  const direct = minimatch(filename, pattern);
  console.log(`Direct match: ${direct}`);
  
  // Match with matchBase option
  const matchBase = minimatch(filename, pattern, { matchBase: true });
  console.log(`With matchBase: ${matchBase}`);
  
  // Regex test
  const escapedPattern = pattern.replace(/([.+^${}()|[\]\\])/g, '\\$1').replace(/\*/g, '.*');
  const regex = new RegExp(`^${escapedPattern}$`);
  const regexMatch = regex.test(filename);
  console.log(`Regex match (${regex}): ${regexMatch}`);
  
  // Simple startsWith for prefix patterns
  if (pattern.endsWith('*')) {
    const prefix = pattern.substring(0, pattern.length - 1);
    const startsWithMatch = filename.startsWith(prefix);
    console.log(`StartsWith match (${prefix}): ${startsWithMatch}`);
  }
  
  console.log('-'.repeat(50));
}

// Test with various patterns and filenames
const testCases = [
  { filename: 'properties_20250213.csv', pattern: 'properties_*' },
  { filename: 'properties_20250213.csv', pattern: 'properties_*.csv' },
  { filename: 'properties_20250213.csv', pattern: '*_20250213.csv' },
  { filename: 'properties_20250213.csv', pattern: 'propert*' },
  { filename: '/uploads/properties_20250213.csv', pattern: 'properties_*' },
  { filename: '/uploads/properties_20250213.csv', pattern: '*/properties_*.csv' }
];

for (const testCase of testCases) {
  testPattern(testCase.filename, testCase.pattern);
}

// Also test a couple specific files from our FTP listing
console.log('\nTesting with full paths from FTP listing:');
testPattern('/uploads/properties_20250213.csv', 'properties_*');
testPattern('properties_20250213.csv', 'properties_*');
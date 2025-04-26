/**
 * Performance Testing Script for BCBS Application
 * 
 * This script runs performance tests against the application using
 * autocannon, a high-performance HTTP benchmarking tool.
 * 
 * Usage:
 *   node scripts/performance-test.js [options]
 * 
 * Options:
 *   --url        Test URL (default: http://localhost:5000)
 *   --duration   Test duration in seconds (default: 30)
 *   --connections Number of concurrent connections (default: 10)
 *   --pipelining Number of pipelined requests (default: 1)
 *   --threshold  Maximum acceptable latency in ms (default: 500)
 *   --report     Output file for JSON report (default: performance-report.json)
 *   --path       API path to test (default: /)
 *   --method     HTTP method to use (default: GET)
 */

const autocannon = require('autocannon');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  if (arg.includes('=')) {
    const [key, value] = arg.split('=');
    acc[key.replace('--', '')] = value;
  } else if (arg.startsWith('--')) {
    acc[arg.replace('--', '')] = true;
  }
  return acc;
}, {});

// Default configuration
const config = {
  url: args.url || 'http://localhost:5000',
  duration: parseInt(args.duration || '30', 10),
  connections: parseInt(args.connections || '10', 10),
  pipelining: parseInt(args.pipelining || '1', 10),
  threshold: parseInt(args.threshold || '500', 10),
  report: args.report || 'performance-report.json',
  path: args.path || '/',
  method: args.method || 'GET',
};

// Full URL for the test
const fullUrl = `${config.url}${config.path}`;

console.log(`
Performance Test Configuration:
------------------------------
URL:              ${fullUrl}
Duration:         ${config.duration} seconds
Connections:      ${config.connections}
Pipelining:       ${config.pipelining}
Latency Threshold: ${config.threshold} ms
Report File:      ${config.report}
Method:           ${config.method}
`);

// Run the performance test
console.log(`Starting performance test against ${fullUrl}...`);

const instance = autocannon({
  url: fullUrl,
  connections: config.connections,
  pipelining: config.pipelining,
  duration: config.duration,
  method: config.method,
  headers: {
    'Content-Type': 'application/json',
  },
  // Add body for POST requests if needed
  // body: JSON.stringify({ /* data */ }),
});

// Track progress
autocannon.track(instance, { renderProgressBar: true });

// Handle results
instance.on('done', (results) => {
  console.log('\nPerformance Test Results:');
  console.log('------------------------');
  console.log(`Requests: ${results.requests.total}`);
  console.log(`Throughput: ${Math.round(results.requests.average)} req/sec`);
  console.log(`Latency (avg): ${Math.round(results.latency.average)} ms`);
  console.log(`Latency (p99): ${Math.round(results.latency.p99)} ms`);
  console.log(`Errors: ${results.errors}`);
  console.log(`Timeouts: ${results.timeouts}`);
  console.log(`Duration: ${results.duration} sec`);
  
  // Check against threshold
  const failed = results.latency.p99 > config.threshold;
  console.log(`\nThreshold Check (${config.threshold} ms): ${failed ? '❌ FAILED' : '✅ PASSED'}`);
  
  // Add timestamp and metadata
  const reportData = {
    timestamp: new Date().toISOString(),
    configuration: config,
    results: results,
    passed: !failed,
  };
  
  // Save report
  fs.writeFileSync(
    config.report,
    JSON.stringify(reportData, null, 2)
  );
  
  console.log(`\nDetailed report saved to ${config.report}`);
  
  // Exit with appropriate code
  process.exit(failed ? 1 : 0);
});

// Handle errors
process.on('uncaughtException', (err) => {
  console.error(`Error running performance test: ${err.message}`);
  process.exit(1);
});
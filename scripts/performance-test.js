/**
 * Performance Testing Script for BCBS Application
 * 
 * This script uses autocannon to run performance tests against
 * various endpoints of the application.
 * 
 * Usage:
 *   node scripts/performance-test.js [options]
 * 
 * Options:
 *   --duration=X    Test duration in seconds (default: 10)
 *   --connections=X Number of concurrent connections (default: 10)
 *   --pipelining=X  Number of pipelined requests (default: 1)
 *   --threshold=X   Response time threshold in ms for pass/fail (default: 500)
 *   --url=X         Base URL to test (default: http://localhost:5000)
 *   --json          Output results as JSON
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
  duration: parseInt(args.duration || '10', 10),
  connections: parseInt(args.connections || '10', 10),
  pipelining: parseInt(args.pipelining || '1', 10),
  threshold: parseInt(args.threshold || '500', 10),
  baseUrl: args.url || 'http://localhost:5000',
  json: args.json || false,
  output: args.output || 'performance-results.json',
};

// Endpoints to test with their expected status codes
const endpoints = [
  { path: '/', method: 'GET', name: 'Homepage', expectedStatus: 200 },
  { path: '/api/health', method: 'GET', name: 'Health Check', expectedStatus: 200 },
  // Add more endpoints as needed
];

/**
 * Run a performance test for a specific endpoint
 * @param {Object} endpoint Endpoint configuration
 * @returns {Promise<Object>} Test results
 */
function runTest(endpoint) {
  return new Promise((resolve, reject) => {
    console.log(`\nTesting ${endpoint.name} (${endpoint.method} ${endpoint.path})...`);
    
    const url = `${config.baseUrl}${endpoint.path}`;
    
    const instance = autocannon({
      url,
      method: endpoint.method,
      duration: config.duration,
      connections: config.connections,
      pipelining: config.pipelining,
      headers: {
        'Accept': 'application/json'
      }
    }, (err, results) => {
      if (err) {
        reject(err);
        return;
      }
      
      resolve({
        endpoint: endpoint.name,
        path: endpoint.path,
        method: endpoint.method,
        results
      });
    });
    
    // Log progress to console
    autocannon.track(instance, {
      renderProgressBar: true,
      renderResultsTable: true,
      renderLatencyTable: true
    });
  });
}

/**
 * Format results for display
 * @param {Array<Object>} results Test results
 * @returns {Object} Formatted results
 */
function formatResults(results) {
  const formatted = {
    timestamp: new Date().toISOString(),
    summary: {
      totalRequests: 0,
      avgLatency: 0,
      avgThroughput: 0,
      successRate: 0,
      p99Latency: 0,
      errorCount: 0,
      passedThreshold: true
    },
    endpoints: []
  };
  
  let totalLatency = 0;
  let totalThroughput = 0;
  let totalErrors = 0;
  let totalRequests = 0;
  let maxP99Latency = 0;
  
  results.forEach(result => {
    const stats = result.results;
    const endpoint = {
      name: result.endpoint,
      path: result.path,
      method: result.method,
      requests: stats.requests.total,
      throughput: stats.throughput.average,
      latency: {
        average: stats.latency.average,
        min: stats.latency.min,
        max: stats.latency.max,
        p50: stats.latency.p50,
        p90: stats.latency.p90,
        p99: stats.latency.p99
      },
      errors: stats.errors,
      timeouts: stats.timeouts,
      non2xx: stats.non2xx,
      passedThreshold: stats.latency.p99 < config.threshold
    };
    
    totalLatency += stats.latency.average;
    totalThroughput += stats.throughput.average;
    totalErrors += stats.errors + stats.timeouts + stats.non2xx;
    totalRequests += stats.requests.total;
    maxP99Latency = Math.max(maxP99Latency, stats.latency.p99);
    
    if (!endpoint.passedThreshold) {
      formatted.summary.passedThreshold = false;
    }
    
    formatted.endpoints.push(endpoint);
  });
  
  formatted.summary.totalRequests = totalRequests;
  formatted.summary.avgLatency = totalLatency / results.length;
  formatted.summary.avgThroughput = totalThroughput / results.length;
  formatted.summary.successRate = (totalRequests - totalErrors) / totalRequests * 100;
  formatted.summary.p99Latency = maxP99Latency;
  formatted.summary.errorCount = totalErrors;
  
  return formatted;
}

/**
 * Print test results
 * @param {Object} formatted Formatted test results
 */
function printResults(formatted) {
  console.log('\n=======================================');
  console.log('PERFORMANCE TEST RESULTS');
  console.log('=======================================');
  console.log(`Timestamp: ${formatted.timestamp}`);
  console.log(`Duration: ${config.duration} seconds`);
  console.log(`Connections: ${config.connections}`);
  console.log(`Threshold: ${config.threshold}ms (p99 latency)`);
  console.log('---------------------------------------');
  console.log('SUMMARY:');
  console.log(`Total Requests: ${formatted.summary.totalRequests}`);
  console.log(`Average Latency: ${formatted.summary.avgLatency.toFixed(2)}ms`);
  console.log(`Average Throughput: ${formatted.summary.avgThroughput.toFixed(2)} req/sec`);
  console.log(`Success Rate: ${formatted.summary.successRate.toFixed(2)}%`);
  console.log(`P99 Latency: ${formatted.summary.p99Latency.toFixed(2)}ms`);
  console.log(`Error Count: ${formatted.summary.errorCount}`);
  console.log(`Threshold Pass: ${formatted.summary.passedThreshold ? 'YES' : 'NO'}`);
  console.log('---------------------------------------');
  console.log('ENDPOINTS:');
  
  formatted.endpoints.forEach(endpoint => {
    console.log(`\n${endpoint.name} (${endpoint.method} ${endpoint.path}):`);
    console.log(`Requests: ${endpoint.requests}`);
    console.log(`Throughput: ${endpoint.throughput.toFixed(2)} req/sec`);
    console.log(`Latency (avg): ${endpoint.latency.average.toFixed(2)}ms`);
    console.log(`Latency (p99): ${endpoint.latency.p99.toFixed(2)}ms`);
    console.log(`Errors: ${endpoint.errors}`);
    console.log(`Threshold Pass: ${endpoint.passedThreshold ? 'YES' : 'NO'}`);
  });
  
  console.log('\n=======================================');
  console.log(`OVERALL RESULT: ${formatted.summary.passedThreshold ? 'PASS' : 'FAIL'}`);
  console.log('=======================================\n');
}

/**
 * Main execution function
 */
async function main() {
  try {
    console.log('Starting performance tests...');
    console.log(`Configuration: ${config.duration}s duration, ${config.connections} connections, ${config.threshold}ms threshold`);
    
    const results = [];
    
    // Run tests sequentially
    for (const endpoint of endpoints) {
      const result = await runTest(endpoint);
      results.push(result);
    }
    
    // Format and display results
    const formatted = formatResults(results);
    
    if (!config.json) {
      printResults(formatted);
    }
    
    // Save results to file
    fs.writeFileSync(
      config.output,
      JSON.stringify(formatted, null, 2)
    );
    console.log(`Results saved to ${config.output}`);
    
    // Exit with appropriate code
    process.exit(formatted.summary.passedThreshold ? 0 : 1);
  } catch (error) {
    console.error('Error running performance tests:', error);
    process.exit(1);
  }
}

// Run the main function
main();
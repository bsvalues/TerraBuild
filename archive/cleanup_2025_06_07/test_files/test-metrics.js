/**
 * Test script for Prometheus metrics endpoint
 */
import { request } from 'http';

// Options for the HTTP request
const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/metrics',
  method: 'GET',
  headers: {
    'Accept': 'text/plain'
  }
};

// Make the request
const req = request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  
  // A chunk of data has been received
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  // The whole response has been received
  res.on('end', () => {
    console.log('RESPONSE DATA:');
    console.log(data.substring(0, 500) + '...');
  });
});

// Error handling
req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

// End the request
req.end();
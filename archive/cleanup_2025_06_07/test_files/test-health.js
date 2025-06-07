/**
 * Test script for health check endpoint
 */
import { request } from 'http';

// Options for the HTTP request
const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/health',
  method: 'GET',
  headers: {
    'Accept': 'application/json'
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
    try {
      const parsed = JSON.parse(data);
      console.log('RESPONSE DATA:', JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.error('Error parsing JSON response:', e);
      console.log('Raw response data:', data.substring(0, 200) + '...');
    }
  });
});

// Error handling
req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

// End the request
req.end();
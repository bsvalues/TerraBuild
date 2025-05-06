#!/usr/bin/env node
/**
 * TerraFusion AI Agent Healthcheck Script
 * 
 * This script is used by Docker's HEALTHCHECK to verify the agent is running correctly.
 * It tests the agent's health endpoint and reports success or failure.
 */

// Standard modules
const http = require('http');

// Constants
const PORT = process.env.PORT || 4000;
const AGENT_ID = process.env.AGENT_ID || 'unknown-agent';
const HOSTNAME = 'localhost';
const PATH = '/health';
const TIMEOUT = 5000; // 5 seconds

/**
 * Perform the health check by making an HTTP request to the agent's health endpoint
 */
async function checkHealth() {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      host: HOSTNAME,
      port: PORT,
      path: PATH,
      method: 'GET',
      timeout: TIMEOUT,
      headers: {
        'Accept': 'application/json'
      }
    };

    const request = http.request(requestOptions, (response) => {
      let responseData = '';

      response.on('data', (chunk) => {
        responseData += chunk;
      });

      response.on('end', () => {
        try {
          if (response.statusCode >= 200 && response.statusCode < 300) {
            const data = JSON.parse(responseData);
            
            // Check for the expected properties
            if (data.status === 'ok' && data.agent === AGENT_ID) {
              resolve({ 
                success: true, 
                message: `Agent ${AGENT_ID} is healthy` 
              });
            } else {
              resolve({ 
                success: false, 
                message: `Agent reported incorrect status: ${JSON.stringify(data)}` 
              });
            }
          } else {
            resolve({ 
              success: false, 
              message: `Agent returned status code ${response.statusCode}` 
            });
          }
        } catch (error) {
          resolve({ 
            success: false, 
            message: `Failed to parse agent response: ${error.message}` 
          });
        }
      });
    });

    request.on('error', (error) => {
      resolve({ 
        success: false, 
        message: `Error connecting to agent: ${error.message}` 
      });
    });

    request.on('timeout', () => {
      request.destroy();
      resolve({ 
        success: false, 
        message: 'Health check timed out' 
      });
    });

    request.end();
  });
}

/**
 * Main function to execute the health check
 */
async function main() {
  try {
    const result = await checkHealth();
    
    if (result.success) {
      console.log(result.message);
      process.exit(0); // Success
    } else {
      console.error(result.message);
      process.exit(1); // Failure
    }
  } catch (error) {
    console.error(`Unexpected error in health check: ${error.message}`);
    process.exit(1); // Failure
  }
}

// Execute the health check
main();
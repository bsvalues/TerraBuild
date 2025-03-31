/**
 * Auth API Tests
 * 
 * Tests for authentication API endpoints
 */

const assert = require('assert');
const fetch = require('node-fetch');

async function testLoginAPI() {
  console.log('Testing login API...');
  
  const validCredentials = {
    username: 'admin',
    password: 'password'
  };
  
  const invalidCredentials = {
    username: 'invalid',
    password: 'wrong'
  };
  
  // Test with valid credentials
  try {
    const response = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validCredentials),
    });
    
    assert.strictEqual(response.status, 200, 'Status should be 200 for valid login');
    const data = await response.json();
    assert.strictEqual(typeof data.id, 'number', 'Response should contain user ID');
    assert.strictEqual(data.username, validCredentials.username, 'Response should contain username');
    console.log('✅ Valid login test passed');
  } catch (error) {
    console.error('❌ Valid login test failed:', error.message);
  }
  
  // Test with invalid credentials
  try {
    const response = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidCredentials),
    });
    
    assert.strictEqual(response.status, 401, 'Status should be 401 for invalid login');
    console.log('✅ Invalid login test passed');
  } catch (error) {
    console.error('❌ Invalid login test failed:', error.message);
  }
}

async function testAutoLoginAPI() {
  console.log('\nTesting auto-login API...');
  
  try {
    // First check the auto-login status endpoint
    const statusResponse = await fetch('http://localhost:5000/api/auth/autologin');
    const statusData = await statusResponse.json();
    
    console.log(`Auto-login status: ${statusData.enabled ? 'Enabled' : 'Disabled'}`);
    
    // Test auto-login with token (if available)
    if (statusData.token) {
      const response = await fetch('http://localhost:5000/api/auth/autologin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: statusData.token }),
        credentials: 'include'
      });
      
      if (statusData.enabled) {
        assert.strictEqual(response.status, 200, 'Status should be 200 for autologin when enabled');
        const data = await response.json();
        assert.strictEqual(typeof data.user, 'object', 'Response should contain user object');
        console.log('✅ Auto-login test passed');
      } else {
        assert.strictEqual(response.status, 403, 'Status should be 403 when autologin is disabled');
        console.log('✅ Auto-login disabled test passed');
      }
    } else {
      console.log('⚠️ No token available for testing auto-login');
    }
  } catch (error) {
    console.error('❌ Auto-login test failed:', error.message);
  }
}

async function runTests() {
  await testLoginAPI();
  await testAutoLoginAPI();
}

// Only run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testLoginAPI, testAutoLoginAPI };
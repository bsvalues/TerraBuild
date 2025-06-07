/**
 * AI Service Enhancement Tests
 * 
 * This file contains tests for the enhanced AI service including:
 * - Request caching
 * - Retry logic
 * - Prompt optimization
 * - Cache management
 */

const { expect } = require('chai');
const sinon = require('sinon');
const fetchMock = require('fetch-mock');
const openai = require('openai');

// Import the AI service for testing
const { 
  generateCostPrediction, 
  checkOpenAIApiKeyStatus,
  clearAICache 
} = require('../../server/services/aiService');

// Mock the OpenAI API response
const mockOpenAIResponse = {
  id: 'chatcmpl-123',
  object: 'chat.completion',
  created: 1677858242,
  model: 'gpt-4-turbo',
  usage: {
    prompt_tokens: 85,
    completion_tokens: 128,
    total_tokens: 213
  },
  choices: [{
    message: {
      role: 'assistant',
      content: JSON.stringify({
        predictedCost: 215.75,
        confidenceInterval: { lower: 198.50, upper: 232.10 },
        factors: [
          { name: 'Material Cost Trends', impact: 'high', description: 'Rising lumber prices in Q2 2025' },
          { name: 'Labor Market', impact: 'medium', description: 'Skilled labor shortage in Benton County' },
          { name: 'Regulatory Changes', impact: 'low', description: 'Updated building codes effective March 2025' }
        ],
        summary: 'Based on historical trends and current market conditions, expect a 7% increase in building costs for residential construction in Benton County by mid-2025.'
      })
    },
    finish_reason: 'stop',
    index: 0
  }]
};

// Mock OpenAI error responses
const rateLimitErrorResponse = {
  error: {
    message: "Rate limit exceeded",
    type: "rate_limit_error",
    param: null,
    code: "rate_limit_exceeded"
  }
};

const timeoutErrorResponse = {
  error: {
    message: "Request timed out",
    type: "timeout_error",
    param: null,
    code: "timeout"
  }
};

describe('AI Service Enhancements', () => {
  let openaiStub;
  let clockStub;
  
  beforeEach(() => {
    // Create a stub for the OpenAI client
    openaiStub = {
      chat: {
        completions: {
          create: sinon.stub()
        }
      }
    };
    
    // Mock the clock for testing timeouts and delays
    clockStub = sinon.useFakeTimers();
  });
  
  afterEach(() => {
    // Restore all stubs and mocks
    sinon.restore();
    clockStub.restore();
    
    // Clear the cache between tests
    if (typeof global.clearAICache === 'function') {
      global.clearAICache();
    }
  });
  
  describe('Request Caching', () => {
    it('should return cached result for identical prediction parameters', async () => {
      // This test will need the actual implementation to be in place
      // It should verify that identical requests use cached results
    });
    
    it('should invalidate cache after TTL expiration', async () => {
      // This test will need the actual implementation to be in place
      // It should verify that cache expires correctly after TTL
    });
    
    it('should bypass cache when force refresh is requested', async () => {
      // This test will need the actual implementation to be in place
      // It should verify that cache can be bypassed when needed
    });
  });
  
  describe('Retry Logic', () => {
    it('should retry failed requests up to maximum attempts', async () => {
      // This test will need the actual implementation to be in place
      // It should verify retry behavior with mocked API failures
    });
    
    it('should implement exponential backoff between retries', async () => {
      // This test will need the actual implementation to be in place
      // It should verify timing between retry attempts
    });
    
    it('should return friendly error after all retries fail', async () => {
      // This test will need the actual implementation to be in place
      // It should verify user-friendly error messages
    });
  });
  
  describe('Prompt Optimization', () => {
    it('should generate valid predictions with optimized prompts', async () => {
      // This test will need the actual implementation to be in place
      // It should verify prediction quality with new prompts
    });
    
    it('should use fewer tokens than previous implementation', async () => {
      // This test will need the actual implementation to be in place
      // It should compare token usage before and after optimization
    });
  });
  
  describe('Cache Management', () => {
    it('should successfully clear all cache entries', async () => {
      // Mock node-cache with a spy
      const cacheSpy = {
        get: sinon.spy(),
        set: sinon.spy(),
        flushAll: sinon.spy()
      };
      
      // Replace the internal aiCache with our spy
      global.aiCache = cacheSpy;
      
      // Call the clearAICache function
      clearAICache();
      
      // Verify that flushAll was called
      expect(cacheSpy.flushAll.calledOnce).to.be.true;
    });
    
    it('should allow forced refresh through parameter', async () => {
      // Set up mocks
      const originalEnv = process.env.OPENAI_API_KEY;
      process.env.OPENAI_API_KEY = 'sk-test-key';
      
      // Mock the create method to return our mock response
      const createStub = sinon.stub().resolves(mockOpenAIResponse);
      const openaiClientStub = {
        chat: { completions: { create: createStub } }
      };
      
      // Replace the real OpenAI client with our stub
      sinon.stub(openai, 'OpenAI').returns(openaiClientStub);
      
      // Replace storage methods
      const storageStub = {
        getCostFactorsByRegionAndType: sinon.stub().resolves({}),
        getAllBuildingCosts: sinon.stub().resolves([])
      };
      sinon.stub(global, 'storage').value(storageStub);
      
      // Create test prediction parameters
      const predictionParams = {
        buildingType: 'RESIDENTIAL',
        region: 'Benton County',
        targetYear: 2025
      };
      
      // First call - should trigger API request
      await generateCostPrediction(predictionParams);
      
      // Second call with same params - should use cache
      await generateCostPrediction(predictionParams);
      
      // Third call with forceRefresh - should bypass cache and make API call again
      await generateCostPrediction({...predictionParams, forceRefresh: true});
      
      // Verify OpenAI API was called twice (first call and forced refresh)
      expect(createStub.callCount).to.equal(2);
      
      // Restore the original environment
      process.env.OPENAI_API_KEY = originalEnv;
    });
  });
});
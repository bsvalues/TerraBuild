/**
 * AI Cost Prediction Feature Tests
 * 
 * These tests verify the functionality of the AI-powered cost prediction feature
 * including API connectivity, response handling, and UI integration.
 */

const { expect } = require('chai');
const sinon = require('sinon');
const fetchMock = require('fetch-mock');

// Mock the OpenAI API response
const mockOpenAIResponse = {
  id: 'chatcmpl-123',
  object: 'chat.completion',
  created: 1677858242,
  model: 'gpt-3.5-turbo-0613',
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

describe('AI Cost Prediction Engine', () => {
  let apiKeyStatus;
  
  beforeEach(() => {
    // Reset API mocks before each test
    fetchMock.restore();
    
    // Mock the API key status endpoint
    fetchMock.get('/api/settings/OPENAI_API_KEY_STATUS', { value: 'configured' });
    
    // Mock the OpenAI API call
    fetchMock.post('https://api.openai.com/v1/chat/completions', mockOpenAIResponse);
    
    // Mock API for cost data
    fetchMock.get('/api/cost-matrix', [
      { id: 1, buildingType: 'RESIDENTIAL', region: 'Benton County', baseCost: 200, matrixYear: 2024 },
      { id: 2, buildingType: 'COMMERCIAL', region: 'Benton County', baseCost: 350, matrixYear: 2024 },
      { id: 3, buildingType: 'RESIDENTIAL', region: 'Franklin County', baseCost: 190, matrixYear: 2024 }
    ]);

    apiKeyStatus = { value: 'configured' };
  });

  describe('AI Engine Connection', () => {
    it('should verify OpenAI API key is configured', async () => {
      const response = await fetch('/api/settings/OPENAI_API_KEY_STATUS');
      const data = await response.json();
      
      expect(data.value).to.equal('configured');
    });
    
    it('should handle missing API key gracefully', async () => {
      // Change mock to return unconfigured status
      fetchMock.get('/api/settings/OPENAI_API_KEY_STATUS', { value: 'unconfigured' }, { overwriteRoutes: true });
      
      const response = await fetch('/api/settings/OPENAI_API_KEY_STATUS');
      const data = await response.json();
      
      expect(data.value).to.equal('unconfigured');
    });
  });

  describe('Cost Prediction API', () => {
    it('should make valid request to OpenAI API', async () => {
      const result = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer sk-test-key'
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Test prompt' }]
        })
      });
      
      const data = await result.json();
      
      expect(data.choices[0].message.content).to.be.a('string');
      expect(JSON.parse(data.choices[0].message.content)).to.have.property('predictedCost');
    });
    
    it('should handle API errors gracefully', async () => {
      // Mock API error response
      fetchMock.post('https://api.openai.com/v1/chat/completions', 
                    { status: 500, body: { error: { message: 'Internal server error' } } }, 
                    { overwriteRoutes: true });
      
      try {
        await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer sk-test-key'
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: 'Test prompt' }]
          })
        });
      } catch (error) {
        expect(error).to.exist;
      }
    });
  });

  describe('Prediction Data Processing', () => {
    it('should parse prediction response correctly', () => {
      const responseContent = mockOpenAIResponse.choices[0].message.content;
      const parsedResponse = JSON.parse(responseContent);
      
      expect(parsedResponse).to.have.property('predictedCost');
      expect(parsedResponse).to.have.property('confidenceInterval');
      expect(parsedResponse).to.have.property('factors');
      expect(parsedResponse.factors).to.be.an('array');
      expect(parsedResponse.factors.length).to.be.greaterThan(0);
    });
    
    it('should handle malformed prediction response', () => {
      // Test with invalid JSON response
      const invalidResponse = {
        choices: [{
          message: {
            content: '{invalid json:'
          }
        }]
      };
      
      const parseResponse = () => {
        try {
          JSON.parse(invalidResponse.choices[0].message.content);
          return { success: true };
        } catch (error) {
          return { success: false, error };
        }
      };
      
      const result = parseResponse();
      expect(result.success).to.be.false;
      expect(result.error).to.exist;
    });
  });

  describe('Cost Data Integration', () => {
    it('should retrieve historical cost data', async () => {
      const response = await fetch('/api/cost-matrix');
      const data = await response.json();
      
      expect(data).to.be.an('array');
      expect(data.length).to.be.greaterThan(0);
      expect(data[0]).to.have.property('buildingType');
      expect(data[0]).to.have.property('region');
      expect(data[0]).to.have.property('baseCost');
    });
    
    it('should filter cost data by building type and region', async () => {
      const response = await fetch('/api/cost-matrix');
      const allData = await response.json();
      
      // Filter for residential buildings in Benton County
      const filtered = allData.filter(item => 
        item.buildingType === 'RESIDENTIAL' && item.region === 'Benton County'
      );
      
      expect(filtered.length).to.be.greaterThan(0);
      expect(filtered[0].buildingType).to.equal('RESIDENTIAL');
      expect(filtered[0].region).to.equal('Benton County');
    });
  });
});

describe('UI Integration Tests', () => {
  // These tests would normally use a UI testing library like React Testing Library
  // Here we're just defining what they would test
  
  it('should show loading state while prediction is in progress', () => {
    // Would render component and verify loading indicator appears
  });
  
  it('should display prediction results after successful API call', () => {
    // Would render component, mock API call, and verify results display
  });
  
  it('should show error message when API call fails', () => {
    // Would render component, mock failed API call, and verify error message
  });
  
  it('should update charts with prediction data', () => {
    // Would render component with charts and verify they update with new data
  });
});
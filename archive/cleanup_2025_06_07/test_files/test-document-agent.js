/**
 * Simple test for the Document Processing Agent
 */

// ES Module import 
import { documentProcessingAgent } from './server/mcp/agents/documentProcessingAgent.js';

console.log('Testing Document Processing Agent functionality...');

// Verify the agent exists and is properly initialized
console.log('Agent ID:', documentProcessingAgent.agentId);
console.log('Agent Name:', documentProcessingAgent.name);

// Test document analysis functionality with permit document
const permitRequest = {
  documentId: 'DOC001',
  extractionMode: 'full',
  includeConfidence: true,
  includeRawText: true
};

// Test document analysis functionality with assessment document
const assessmentRequest = {
  documentId: 'DOC002',
  extractionMode: 'key-values',
  includeConfidence: true,
  includeRawText: false
};

// Test document analysis functionality with deed document
const deedRequest = {
  documentId: 'DOC003',
  extractionMode: 'summary',
  includeConfidence: false,
  includeRawText: false
};

// Test document analysis with custom content
const customRequest = {
  documentContent: `PROPERTY APPRAISAL
Benton County Appraisal Services
Effective Date: 06/01/2023
Property ID: PROP005
Owner: Thomas Wilson
Address: 123 Vineyard Way, West Richland, WA 99353
Land Size: 1.35 acres
Building Size: 2,850 sq.ft.
Year Built: 2015
Condition: Excellent
Appraised Value: $525,000
Appraiser: James Rodriguez
License: WA-AP-12345`,
  documentType: 'appraisal',
  extractionMode: 'full',
  includeConfidence: true,
  includeRawText: false
};

// Create mock events
const mockPermitEvent = {
  source: 'test-script',
  correlationId: 'test-permit-id',
  type: 'document:analyze:request',
  data: {
    request: permitRequest,
    requestId: 'test-permit-123'
  }
};

const mockAssessmentEvent = {
  source: 'test-script',
  correlationId: 'test-assessment-id',
  type: 'document:analyze:request',
  data: {
    request: assessmentRequest,
    requestId: 'test-assessment-123'
  }
};

const mockDeedEvent = {
  source: 'test-script',
  correlationId: 'test-deed-id',
  type: 'document:analyze:request',
  data: {
    request: deedRequest,
    requestId: 'test-deed-123'
  }
};

const mockCustomEvent = {
  source: 'test-script',
  correlationId: 'test-custom-id',
  type: 'document:analyze:request',
  data: {
    request: customRequest,
    requestId: 'test-custom-123'
  }
};

// Capture emitted events
const emittedEvents = [];
const originalEmitEvent = documentProcessingAgent.emitEvent;

// @ts-ignore - Override emitEvent for testing
documentProcessingAgent.emitEvent = function(type, data) {
  console.log(`Event emitted: ${type}`);
  emittedEvents.push({ type, data });
  return Promise.resolve();
};

// @ts-ignore - Override recordMemory for testing
documentProcessingAgent.recordMemory = function(item) {
  console.log(`Memory recorded: ${item.type}`);
};

// Function to print document analysis results
function printAnalysisResults(eventIndex) {
  const event = emittedEvents[eventIndex];
  if (!event) {
    console.error('No event found at index', eventIndex);
    return;
  }
  
  const analysisResult = event.data.data.analysisResult;
  console.log('\nAnalysis ID:', analysisResult.analysisId);
  console.log('Document ID:', analysisResult.documentId);
  console.log('Document Type:', analysisResult.documentType);
  console.log('Confidence Level:', analysisResult.metadata.confidenceLevel);
  
  console.log('\nExtracted Data:');
  console.log(JSON.stringify(analysisResult.extractedData, null, 2));
  
  if (analysisResult.summary) {
    console.log('\nSummary:');
    console.log(analysisResult.summary);
  }
  
  if (analysisResult.entities && analysisResult.entities.length > 0) {
    console.log('\nEntities Found:', analysisResult.entities.length);
    console.log('Sample Entity:', analysisResult.entities[0]);
  }
  
  if (analysisResult.warnings && analysisResult.warnings.length > 0) {
    console.log('\nWarnings:');
    analysisResult.warnings.forEach(warning => console.log(`- ${warning}`));
  }
}

// Run the tests
const runTest = async () => {
  try {
    console.log('\n----- Testing Permit Document Analysis -----');
    // @ts-ignore - Call private method
    await documentProcessingAgent.handleDocumentAnalysisRequest(mockPermitEvent, {});
    
    console.log('\n----- Testing Assessment Document Analysis -----');
    // @ts-ignore - Call private method
    await documentProcessingAgent.handleDocumentAnalysisRequest(mockAssessmentEvent, {});
    
    console.log('\n----- Testing Deed Document Analysis -----');
    // @ts-ignore - Call private method
    await documentProcessingAgent.handleDocumentAnalysisRequest(mockDeedEvent, {});
    
    console.log('\n----- Testing Custom Document Analysis -----');
    // @ts-ignore - Call private method
    await documentProcessingAgent.handleDocumentAnalysisRequest(mockCustomEvent, {});
    
    // Print results
    console.log('\n\n===== ANALYSIS RESULTS =====');
    
    console.log('\n----- Permit Document Analysis Results -----');
    printAnalysisResults(0);
    
    console.log('\n----- Assessment Document Analysis Results -----');
    printAnalysisResults(1);
    
    console.log('\n----- Deed Document Analysis Results -----');
    printAnalysisResults(2);
    
    console.log('\n----- Custom Document Analysis Results -----');
    printAnalysisResults(3);
    
    console.log('\n\n✅ All Document Processing Agent tests completed!');
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    // Restore original methods
    // @ts-ignore
    documentProcessingAgent.emitEvent = originalEmitEvent;
  }
};

runTest();
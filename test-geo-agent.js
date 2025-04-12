/**
 * Simple test for the Geospatial Analysis Agent
 */

// ES Module import 
import { geospatialAnalysisAgent } from './server/mcp/agents/geospatialAnalysisAgent.js';

console.log('Testing Geospatial Analysis Agent functionality...');

// Verify the agent exists and is properly initialized
console.log('Agent ID:', geospatialAnalysisAgent.agentId);
console.log('Agent Name:', geospatialAnalysisAgent.name);

// Test proximity analysis functionality
const proximityRequest = {
  analysisType: 'proximity',
  coordinates: {
    latitude: 46.2167,
    longitude: -119.1372 // Richland area
  },
  radiusInMeters: 2000,
  includeDetails: true,
  filters: {
    propertyTypes: ['residential', 'commercial']
  }
};

// Test cluster analysis functionality
const clusterRequest = {
  analysisType: 'cluster',
  radiusInMeters: 5000,
  includeDetails: true
};

// Test heatmap analysis functionality
const heatmapRequest = {
  analysisType: 'heatmap',
  includeDetails: true,
  boundingBox: {
    minLat: 46.1,
    maxLat: 46.3,
    minLng: -119.3,
    maxLng: -119.0
  }
};

// Test anomaly analysis functionality
const anomalyRequest = {
  analysisType: 'anomaly',
  includeDetails: true
};

// Create a mock event for proximity analysis
const mockProximityEvent = {
  source: 'test-script',
  correlationId: 'test-proximity-id',
  type: 'geospatial:analyze:request',
  data: {
    request: proximityRequest,
    requestId: 'test-proximity-123'
  }
};

// Create a mock event for cluster analysis
const mockClusterEvent = {
  source: 'test-script',
  correlationId: 'test-cluster-id',
  type: 'geospatial:analyze:request',
  data: {
    request: clusterRequest,
    requestId: 'test-cluster-123'
  }
};

// Create a mock event for heatmap analysis
const mockHeatmapEvent = {
  source: 'test-script',
  correlationId: 'test-heatmap-id',
  type: 'geospatial:analyze:request',
  data: {
    request: heatmapRequest,
    requestId: 'test-heatmap-123'
  }
};

// Create a mock event for anomaly analysis
const mockAnomalyEvent = {
  source: 'test-script',
  correlationId: 'test-anomaly-id',
  type: 'geospatial:analyze:request',
  data: {
    request: anomalyRequest,
    requestId: 'test-anomaly-123'
  }
};

// Capture emitted events
const emittedEvents = [];
const originalEmitEvent = geospatialAnalysisAgent.emitEvent;

// @ts-ignore - Override emitEvent for testing
geospatialAnalysisAgent.emitEvent = function(type, data) {
  console.log(`Event emitted: ${type}`);
  emittedEvents.push({ type, data });
  return Promise.resolve();
};

// @ts-ignore - Override recordMemory for testing
geospatialAnalysisAgent.recordMemory = function(item) {
  console.log(`Memory recorded: ${item.type}`);
};

// Function to print basic analysis results
function printAnalysisResults(eventIndex) {
  const event = emittedEvents[eventIndex];
  if (!event) {
    console.error('No event found at index', eventIndex);
    return;
  }
  
  const analysisResult = event.data.data.analysisResult;
  console.log('\nAnalysis ID:', analysisResult.analysisId);
  console.log('Analysis Type:', analysisResult.analysisType);
  console.log('Properties Count:', analysisResult.properties.count);
  console.log('Confidence Level:', analysisResult.metadata.confidenceLevel);
  
  console.log('\nInsights:');
  analysisResult.insights.forEach((insight, i) => {
    console.log(`${i + 1}. ${insight}`);
  });
  
  // Print type-specific results
  console.log('\nSpecific Results:');
  switch (analysisResult.analysisType) {
    case 'proximity':
      if (analysisResult.proximityResults && analysisResult.proximityResults.length > 0) {
        console.log('Nearest property:', analysisResult.proximityResults[0].propertyId);
        console.log('Distance:', analysisResult.proximityResults[0].distance, 'meters');
        console.log('Bearing:', analysisResult.proximityResults[0].bearing);
      }
      break;
      
    case 'cluster':
      if (analysisResult.clusters && analysisResult.clusters.length > 0) {
        console.log('Number of clusters:', analysisResult.clusters.length);
        console.log('Largest cluster size:', Math.max(...analysisResult.clusters.map(c => c.propertyCount)));
      }
      break;
      
    case 'heatmap':
      if (analysisResult.heatmapData) {
        console.log('Heatmap type:', analysisResult.heatmapData.type);
        console.log('Number of points:', analysisResult.heatmapData.points.length);
      }
      break;
      
    case 'anomaly':
      if (analysisResult.anomalies && analysisResult.anomalies.length > 0) {
        console.log('Number of anomalies:', analysisResult.anomalies.length);
        console.log('Example anomaly:', analysisResult.anomalies[0].description);
      }
      break;
  }
}

// Run the tests
const runTest = async () => {
  try {
    console.log('\n----- Testing Proximity Analysis -----');
    // @ts-ignore - Call private method
    await geospatialAnalysisAgent.handleGeospatialAnalysisRequest(mockProximityEvent, {});
    
    console.log('\n----- Testing Cluster Analysis -----');
    // @ts-ignore - Call private method
    await geospatialAnalysisAgent.handleGeospatialAnalysisRequest(mockClusterEvent, {});
    
    console.log('\n----- Testing Heatmap Analysis -----');
    // @ts-ignore - Call private method
    await geospatialAnalysisAgent.handleGeospatialAnalysisRequest(mockHeatmapEvent, {});
    
    console.log('\n----- Testing Anomaly Analysis -----');
    // @ts-ignore - Call private method
    await geospatialAnalysisAgent.handleGeospatialAnalysisRequest(mockAnomalyEvent, {});
    
    // Print results
    console.log('\n\n===== ANALYSIS RESULTS =====');
    
    console.log('\n----- Proximity Analysis Results -----');
    printAnalysisResults(0);
    
    console.log('\n----- Cluster Analysis Results -----');
    printAnalysisResults(1);
    
    console.log('\n----- Heatmap Analysis Results -----');
    printAnalysisResults(2);
    
    console.log('\n----- Anomaly Analysis Results -----');
    printAnalysisResults(3);
    
    console.log('\n\n✅ All Geospatial Analysis Agent tests completed!');
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    // Restore original methods
    // @ts-ignore
    geospatialAnalysisAgent.emitEvent = originalEmitEvent;
  }
};

runTest();
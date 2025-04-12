/**
 * Geospatial Analysis Agent for Benton County Building Cost System
 * 
 * This specialized agent handles geospatial property analysis, including:
 * - Analyzing property locations and spatial relationships
 * - Detecting geographic anomalies and clusters
 * - Providing regional insights based on location data
 * - Supporting map-based visualizations and reports
 */

import { v4 as uuidv4 } from 'uuid';
import { CustomAgentBase } from './customAgentBase';

// Define AgentMemoryItem interface
interface AgentMemoryItem {
  type: string;
  timestamp: Date;
  input?: any;
  output?: any;
  metadata?: Record<string, any>;
  tags: string[];
}

/**
 * Interface for Geospatial Analysis Request
 */
interface GeospatialAnalysisRequest {
  propertyId?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  boundingBox?: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
  analysisType: 'proximity' | 'cluster' | 'heatmap' | 'anomaly';
  radiusInMeters?: number;
  includeDetails?: boolean;
  filters?: {
    propertyTypes?: string[];
    yearBuiltRange?: {
      min: number;
      max: number;
    };
    valueRange?: {
      min: number;
      max: number;
    };
  };
}

/**
 * Interface for Geospatial Analysis Result
 */
interface GeospatialAnalysisResult {
  analysisId: string;
  analysisType: string;
  timestamp: Date;
  properties: {
    count: number;
    ids: string[];
  };
  center?: {
    latitude: number;
    longitude: number;
  };
  clusters?: Array<{
    id: string;
    center: {
      latitude: number;
      longitude: number;
    };
    radius: number;
    propertyCount: number;
    averageValue: number;
  }>;
  proximityResults?: Array<{
    propertyId: string;
    distance: number;
    bearing: string;
  }>;
  anomalies?: Array<{
    propertyId: string;
    anomalyType: string;
    confidence: number;
    description: string;
  }>;
  heatmapData?: {
    type: 'value' | 'density' | 'age';
    points: Array<{
      latitude: number;
      longitude: number;
      weight: number;
    }>;
  };
  metadata: {
    executionTimeMs: number;
    dataVersion: string;
    confidenceLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  insights: string[];
}

/**
 * Geospatial Analysis Agent class
 */
export class GeospatialAnalysisAgent extends CustomAgentBase {
  private readonly defaultRadius = 1000; // meters
  private readonly earthRadius = 6371000; // meters
  private readonly bearings = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  
  // Sample property data for testing (would be retrieved from database in production)
  private readonly sampleProperties = [
    {
      id: 'PROP001',
      coordinates: { latitude: 46.2167, longitude: -119.1372 }, // Richland
      type: 'residential',
      yearBuilt: 2010,
      value: 350000
    },
    {
      id: 'PROP002',
      coordinates: { latitude: 46.2305, longitude: -119.1163 }, // Richland
      type: 'residential',
      yearBuilt: 2015,
      value: 420000
    },
    {
      id: 'PROP003',
      coordinates: { latitude: 46.2124, longitude: -119.1351 }, // Richland
      type: 'commercial',
      yearBuilt: 2005,
      value: 1200000
    },
    {
      id: 'PROP004',
      coordinates: { latitude: 46.2671, longitude: -119.2780 }, // Kennewick
      type: 'residential',
      yearBuilt: 1995,
      value: 280000
    },
    {
      id: 'PROP005',
      coordinates: { latitude: 46.2528, longitude: -119.2544 }, // Kennewick
      type: 'commercial',
      yearBuilt: 2008,
      value: 950000
    },
    {
      id: 'PROP006',
      coordinates: { latitude: 46.2955, longitude: -119.2987 }, // Kennewick
      type: 'industrial',
      yearBuilt: 2000,
      value: 1800000
    },
    {
      id: 'PROP007',
      coordinates: { latitude: 46.2910, longitude: -119.1368 }, // West Richland
      type: 'residential',
      yearBuilt: 2018,
      value: 520000
    },
    {
      id: 'PROP008',
      coordinates: { latitude: 46.3225, longitude: -119.5245 }, // Prosser
      type: 'agricultural',
      yearBuilt: 1980,
      value: 750000
    },
    {
      id: 'PROP009',
      coordinates: { latitude: 46.1843, longitude: -119.1707 }, // Richland outskirts
      type: 'residential',
      yearBuilt: 2022,
      value: 650000
    },
    {
      id: 'PROP010',
      coordinates: { latitude: 46.2021, longitude: -119.4269 }, // Benton City
      type: 'agricultural',
      yearBuilt: 1992,
      value: 420000
    }
  ];
  
  constructor() {
    super('geospatial-analysis-agent', 'Geospatial Analysis Agent');
    
    // Register event handlers
    this.registerEventHandler('geospatial:analyze:request', this.handleGeospatialAnalysisRequest.bind(this));
    this.registerEventHandler('geospatial:data:update', this.handleDataUpdate.bind(this));
  }
  
  private recordMemory(item: AgentMemoryItem) {
    // For now just log the memory item
    console.log(`Memory recorded: ${item.type}`);
  }
  
  /**
   * Handle a geospatial analysis request
   * 
   * @param event The event containing the request details
   * @param context Additional context for event handling
   */
  private async handleGeospatialAnalysisRequest(event: any, context: any): Promise<void> {
    console.log(`Geospatial Analysis Agent received request with ID: ${event.correlationId}`);
    const startTime = Date.now();
    
    try {
      // Support both payload and data formats for the request
      const request: GeospatialAnalysisRequest = event.payload?.request || event.data?.request;
      
      if (!request || !request.analysisType) {
        throw new Error('Invalid geospatial analysis request. Missing required parameters.');
      }
      
      // Standardize inputs
      const standardizedRequest = this.standardizeRequest(request);
      
      // Perform the requested analysis
      const analysisResult = this.performAnalysis(standardizedRequest);
      
      // Add execution time to metadata
      analysisResult.metadata.executionTimeMs = Date.now() - startTime;
      
      // Emit the result
      this.emitEvent('geospatial:analyze:completed', {
        source: this.agentId,
        timestamp: new Date(),
        data: {
          sourceAgentId: this.agentId,
          targetAgentId: event.source || event.sourceAgentId,
          correlationId: event.correlationId,
          analysisResult,
          success: true,
          requestId: (event.data?.requestId || event.payload?.requestId || uuidv4())
        }
      });
      
      console.log(`Geospatial analysis completed for request ID: ${event.correlationId}`);
      
      // Record this interaction in the agent's memory
      this.recordMemory({
        type: 'geospatial_analysis',
        timestamp: new Date(),
        input: standardizedRequest,
        output: analysisResult,
        tags: ['analysis', 'geospatial', 'success']
      });
    } catch (error) {
      console.error('Error in geospatial analysis:', error instanceof Error ? error.message : String(error));
      
      // Emit error event
      this.emitEvent('geospatial:analyze:error', {
        source: this.agentId,
        timestamp: new Date(),
        data: {
          sourceAgentId: this.agentId,
          targetAgentId: event.source || event.sourceAgentId,
          correlationId: event.correlationId,
          errorMessage: error instanceof Error ? error.message : String(error),
          requestId: (event.data?.requestId || event.payload?.requestId || uuidv4())
        }
      });
      
      // Record the failure in memory
      this.recordMemory({
        type: 'geospatial_analysis_failure',
        timestamp: new Date(),
        input: event.data?.request || event.payload?.request,
        metadata: {
          error: error instanceof Error ? error.message : String(error)
        },
        tags: ['analysis', 'geospatial', 'error']
      });
    }
  }
  
  /**
   * Handle a data update event
   * 
   * @param event The event containing the updated data
   * @param context Additional context for event handling
   */
  private async handleDataUpdate(event: any, context: any): Promise<void> {
    console.log(`Geospatial Analysis Agent received data update with ID: ${event.correlationId}`);
    
    try {
      const data = event.payload?.data || event.data?.data;
      
      if (!data) {
        throw new Error('Invalid data update event. Missing data.');
      }
      
      // In a real implementation, this would update the agent's data source
      console.log(`Received data update with ${data.properties?.length || 0} properties`);
      
      // Emit acknowledgment
      this.emitEvent('geospatial:data:updated', {
        source: this.agentId,
        timestamp: new Date(),
        data: {
          sourceAgentId: this.agentId,
          targetAgentId: event.source || event.sourceAgentId,
          correlationId: event.correlationId,
          success: true,
          message: 'Geospatial data updated successfully'
        }
      });
      
      // Record this interaction in the agent's memory
      this.recordMemory({
        type: 'data_update',
        timestamp: new Date(),
        metadata: {
          dataSize: data.properties?.length || 0,
          dataType: 'geospatial'
        },
        tags: ['data', 'update', 'geospatial']
      });
    } catch (error) {
      console.error('Error updating geospatial data:', error instanceof Error ? error.message : String(error));
      
      // Emit error event
      this.emitEvent('geospatial:data:error', {
        source: this.agentId,
        timestamp: new Date(),
        data: {
          sourceAgentId: this.agentId,
          targetAgentId: event.source || event.sourceAgentId,
          correlationId: event.correlationId,
          errorMessage: error instanceof Error ? error.message : String(error)
        }
      });
      
      // Record the failure in memory
      this.recordMemory({
        type: 'data_update_failure',
        timestamp: new Date(),
        metadata: {
          error: error instanceof Error ? error.message : String(error)
        },
        tags: ['data', 'update', 'error']
      });
    }
  }
  
  /**
   * Standardize a geospatial analysis request
   * 
   * @param request The request to standardize
   * @returns The standardized request
   */
  private standardizeRequest(request: GeospatialAnalysisRequest): GeospatialAnalysisRequest {
    // Clone the request to avoid modifying the original
    const standardized = { ...request };
    
    // Set default radius if not provided
    if (!standardized.radiusInMeters && 
        (standardized.analysisType === 'proximity' || standardized.analysisType === 'cluster')) {
      standardized.radiusInMeters = this.defaultRadius;
    }
    
    // Set default includeDetails if not provided
    if (standardized.includeDetails === undefined) {
      standardized.includeDetails = true;
    }
    
    return standardized;
  }
  
  /**
   * Perform the requested geospatial analysis
   * 
   * @param request The analysis request
   * @returns The analysis result
   */
  private performAnalysis(request: GeospatialAnalysisRequest): GeospatialAnalysisResult {
    // Start with base result structure
    const result: GeospatialAnalysisResult = {
      analysisId: uuidv4(),
      analysisType: request.analysisType,
      timestamp: new Date(),
      properties: {
        count: 0,
        ids: []
      },
      metadata: {
        executionTimeMs: 0,
        dataVersion: '1.0',
        confidenceLevel: 'MEDIUM'
      },
      insights: []
    };
    
    // Filter properties based on request
    const filteredProperties = this.filterProperties(request);
    result.properties.count = filteredProperties.length;
    result.properties.ids = filteredProperties.map(p => p.id);
    
    // Perform specific analysis based on type
    switch (request.analysisType) {
      case 'proximity':
        return this.performProximityAnalysis(request, filteredProperties, result);
      case 'cluster':
        return this.performClusterAnalysis(request, filteredProperties, result);
      case 'heatmap':
        return this.performHeatmapAnalysis(request, filteredProperties, result);
      case 'anomaly':
        return this.performAnomalyAnalysis(request, filteredProperties, result);
      default:
        throw new Error(`Unsupported analysis type: ${request.analysisType}`);
    }
  }
  
  /**
   * Filter properties based on request criteria
   * 
   * @param request The analysis request
   * @returns Filtered properties
   */
  private filterProperties(request: GeospatialAnalysisRequest): any[] {
    let properties = [...this.sampleProperties];
    
    // Filter by property type if specified
    if (request.filters?.propertyTypes && request.filters.propertyTypes.length > 0) {
      properties = properties.filter(p => request.filters?.propertyTypes?.includes(p.type));
    }
    
    // Filter by year built range if specified
    if (request.filters?.yearBuiltRange) {
      const { min, max } = request.filters.yearBuiltRange;
      properties = properties.filter(p => p.yearBuilt >= min && p.yearBuilt <= max);
    }
    
    // Filter by value range if specified
    if (request.filters?.valueRange) {
      const { min, max } = request.filters.valueRange;
      properties = properties.filter(p => p.value >= min && p.value <= max);
    }
    
    // Filter by bounding box if specified
    if (request.boundingBox) {
      const { minLat, maxLat, minLng, maxLng } = request.boundingBox;
      properties = properties.filter(p => 
        p.coordinates.latitude >= minLat && 
        p.coordinates.latitude <= maxLat && 
        p.coordinates.longitude >= minLng && 
        p.coordinates.longitude <= maxLng
      );
    }
    
    return properties;
  }
  
  /**
   * Calculate distance between two coordinates in meters
   * 
   * @param lat1 Latitude of first point
   * @param lng1 Longitude of first point
   * @param lat2 Latitude of second point
   * @param lng2 Longitude of second point
   * @returns Distance in meters
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const dLat = this.degToRad(lat2 - lat1);
    const dLng = this.degToRad(lng2 - lng1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degToRad(lat1)) * Math.cos(this.degToRad(lat2)) * 
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = this.earthRadius * c;
    
    return distance;
  }
  
  /**
   * Calculate bearing between two coordinates
   * 
   * @param lat1 Latitude of first point
   * @param lng1 Longitude of first point
   * @param lat2 Latitude of second point
   * @param lng2 Longitude of second point
   * @returns Bearing as cardinal direction (N, NE, E, etc.)
   */
  private calculateBearing(lat1: number, lng1: number, lat2: number, lng2: number): string {
    const dLng = this.degToRad(lng2 - lng1);
    
    const y = Math.sin(dLng) * Math.cos(this.degToRad(lat2));
    const x = Math.cos(this.degToRad(lat1)) * Math.sin(this.degToRad(lat2)) -
              Math.sin(this.degToRad(lat1)) * Math.cos(this.degToRad(lat2)) * Math.cos(dLng);
    
    let bearing = this.radToDeg(Math.atan2(y, x));
    if (bearing < 0) {
      bearing += 360;
    }
    
    // Convert to cardinal direction
    const index = Math.round(bearing / 45) % 8;
    return this.bearings[index];
  }
  
  /**
   * Convert degrees to radians
   */
  private degToRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
  
  /**
   * Convert radians to degrees
   */
  private radToDeg(radians: number): number {
    return radians * (180 / Math.PI);
  }
  
  /**
   * Perform proximity analysis
   */
  private performProximityAnalysis(
    request: GeospatialAnalysisRequest, 
    properties: any[], 
    baseResult: GeospatialAnalysisResult
  ): GeospatialAnalysisResult {
    const result = { ...baseResult };
    
    // Need coordinates for proximity analysis
    if (!request.coordinates) {
      throw new Error('Coordinates are required for proximity analysis');
    }
    
    const { latitude, longitude } = request.coordinates;
    const radius = request.radiusInMeters || this.defaultRadius;
    
    // Calculate distances
    const propertiesWithDistance = properties.map(property => {
      const distance = this.calculateDistance(
        latitude, 
        longitude, 
        property.coordinates.latitude, 
        property.coordinates.longitude
      );
      
      const bearing = this.calculateBearing(
        latitude,
        longitude,
        property.coordinates.latitude,
        property.coordinates.longitude
      );
      
      return {
        ...property,
        distance,
        bearing
      };
    });
    
    // Filter properties within radius
    const propertiesInRadius = propertiesWithDistance
      .filter(p => p.distance <= radius)
      .sort((a, b) => a.distance - b.distance);
    
    // Update properties count and IDs for properties in radius
    result.properties.count = propertiesInRadius.length;
    result.properties.ids = propertiesInRadius.map(p => p.id);
    
    // Set center coordinates
    result.center = { latitude, longitude };
    
    // Add proximity results
    result.proximityResults = propertiesInRadius.map(p => ({
      propertyId: p.id,
      distance: Math.round(p.distance),
      bearing: p.bearing
    }));
    
    // Generate insights
    const averageValue = propertiesInRadius.length > 0
      ? propertiesInRadius.reduce((sum, p) => sum + p.value, 0) / propertiesInRadius.length
      : 0;
    
    result.insights = [
      `Found ${propertiesInRadius.length} properties within ${radius} meters of the specified location.`,
      `Average property value in this area is $${Math.round(averageValue).toLocaleString()}.`,
      `Most properties in this area are oriented to the ${this.getMostCommonBearing(propertiesInRadius)}.`
    ];
    
    // Set confidence level
    result.metadata.confidenceLevel = propertiesInRadius.length > 5 ? 'HIGH' : 'MEDIUM';
    
    return result;
  }
  
  /**
   * Perform cluster analysis
   */
  private performClusterAnalysis(
    request: GeospatialAnalysisRequest, 
    properties: any[], 
    baseResult: GeospatialAnalysisResult
  ): GeospatialAnalysisResult {
    const result = { ...baseResult };
    
    // Simple clustering algorithm - this would be more sophisticated in production
    const clusterRadius = request.radiusInMeters || this.defaultRadius;
    const clusters: any[] = [];
    const processedProperties = new Set<string>();
    
    for (const property of properties) {
      if (processedProperties.has(property.id)) continue;
      
      // Create a new cluster centered on this property
      const clusterProperties = properties.filter(p => {
        if (processedProperties.has(p.id)) return false;
        
        const distance = this.calculateDistance(
          property.coordinates.latitude,
          property.coordinates.longitude,
          p.coordinates.latitude,
          p.coordinates.longitude
        );
        
        return distance <= clusterRadius;
      });
      
      if (clusterProperties.length > 1) {
        // Mark properties as processed
        clusterProperties.forEach(p => processedProperties.add(p.id));
        
        // Calculate cluster center as average of coordinates
        const centerLat = clusterProperties.reduce((sum, p) => sum + p.coordinates.latitude, 0) / clusterProperties.length;
        const centerLng = clusterProperties.reduce((sum, p) => sum + p.coordinates.longitude, 0) / clusterProperties.length;
        
        // Calculate average value
        const averageValue = clusterProperties.reduce((sum, p) => sum + p.value, 0) / clusterProperties.length;
        
        // Find maximum distance from center to any property in cluster
        let maxDistance = 0;
        for (const p of clusterProperties) {
          const distance = this.calculateDistance(centerLat, centerLng, p.coordinates.latitude, p.coordinates.longitude);
          if (distance > maxDistance) {
            maxDistance = distance;
          }
        }
        
        clusters.push({
          id: uuidv4(),
          center: {
            latitude: centerLat,
            longitude: centerLng
          },
          radius: Math.round(maxDistance),
          propertyCount: clusterProperties.length,
          averageValue: Math.round(averageValue),
          properties: clusterProperties.map(p => p.id)
        });
      }
    }
    
    // Add information about properties not in clusters
    const unclustered = properties.filter(p => !processedProperties.has(p.id));
    
    // Add clusters to result
    result.clusters = clusters;
    
    // Generate insights
    result.insights = [
      `Identified ${clusters.length} property clusters in the area.`,
      `${processedProperties.size} properties (${Math.round(processedProperties.size / properties.length * 100)}%) are part of clusters.`,
      `Average cluster size is ${Math.round(processedProperties.size / (clusters.length || 1))} properties.`,
      `${unclustered.length} properties are not part of any cluster.`
    ];
    
    if (clusters.length > 0) {
      // Find the largest cluster
      const largestCluster = clusters.reduce((prev, current) => 
        prev.propertyCount > current.propertyCount ? prev : current);
      
      result.insights.push(
        `The largest cluster has ${largestCluster.propertyCount} properties with an average value of $${largestCluster.averageValue.toLocaleString()}.`
      );
    }
    
    // Set confidence level based on clustering quality
    result.metadata.confidenceLevel = properties.length > 10 && clusters.length >= 2 ? 'HIGH' : 'MEDIUM';
    
    return result;
  }
  
  /**
   * Perform heatmap analysis
   */
  private performHeatmapAnalysis(
    request: GeospatialAnalysisRequest, 
    properties: any[], 
    baseResult: GeospatialAnalysisResult
  ): GeospatialAnalysisResult {
    const result = { ...baseResult };
    
    // Create heatmap points based on property values or density
    const heatmapType = 'value'; // Could be parameterized in a real implementation
    
    // Scale to create weight values between 0 and 1
    const maxValue = Math.max(...properties.map(p => p.value), 1);
    const currentYear = new Date().getFullYear();
    const oldestYear = Math.min(...properties.map(p => p.yearBuilt), currentYear - 100);
    
    const points = properties.map(property => {
      let weight;
      
      if (heatmapType === 'value') {
        // Normalize by the maximum value
        weight = property.value / maxValue;
      } else if (heatmapType === 'age') {
        // Newer properties have higher weight
        const age = currentYear - property.yearBuilt;
        const ageRange = currentYear - oldestYear;
        weight = 1 - (age / ageRange);
      } else {
        // Default to equal weights for density
        weight = 1;
      }
      
      return {
        latitude: property.coordinates.latitude,
        longitude: property.coordinates.longitude,
        weight
      };
    });
    
    // Add heatmap data to result
    result.heatmapData = {
      type: heatmapType,
      points
    };
    
    // Generate insights
    let highValueAreas = '';
    if (heatmapType === 'value' && properties.length > 0) {
      // Find high value properties
      const highValueProps = properties
        .sort((a, b) => b.value - a.value)
        .slice(0, Math.min(3, properties.length));
      
      // Approximate area names based on coordinates (simple implementation)
      const areas = highValueProps.map(p => this.determineAreaFromCoordinates(p.coordinates.latitude, p.coordinates.longitude));
      highValueAreas = [...new Set(areas)].join(', ');
    }
    
    result.insights = [
      `Generated heatmap with ${points.length} data points based on property ${heatmapType}.`,
      `The data shows variation in property ${heatmapType} across the region.`
    ];
    
    if (highValueAreas) {
      result.insights.push(`Highest property values are concentrated in: ${highValueAreas}.`);
    }
    
    // Set confidence level
    result.metadata.confidenceLevel = properties.length > 20 ? 'HIGH' : 'MEDIUM';
    
    return result;
  }
  
  /**
   * Perform anomaly analysis
   */
  private performAnomalyAnalysis(
    request: GeospatialAnalysisRequest, 
    properties: any[], 
    baseResult: GeospatialAnalysisResult
  ): GeospatialAnalysisResult {
    const result = { ...baseResult };
    
    // Simple anomaly detection - in a real implementation this would be more sophisticated
    const anomalies = [];
    
    // Calculate average values by property type
    const valuesByType: { [key: string]: number[] } = {};
    for (const property of properties) {
      if (!valuesByType[property.type]) {
        valuesByType[property.type] = [];
      }
      
      valuesByType[property.type].push(property.value);
    }
    
    // Calculate average and standard deviation for each type
    const statsByType: { [key: string]: { avg: number, stdDev: number } } = {};
    for (const [type, values] of Object.entries(valuesByType)) {
      const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
      const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      
      statsByType[type] = { avg, stdDev };
    }
    
    // Find value anomalies
    for (const property of properties) {
      const { avg, stdDev } = statsByType[property.type];
      const zScore = (property.value - avg) / (stdDev || 1); // Avoid division by zero
      
      // Properties with values more than 2 standard deviations from the mean are anomalies
      if (Math.abs(zScore) > 2) {
        anomalies.push({
          propertyId: property.id,
          anomalyType: 'value',
          confidence: Math.min(0.99, Math.abs(zScore) / 4), // Scale to a confidence value (max 0.99)
          description: zScore > 0 
            ? `Property value is unusually high for ${property.type} in this area.`
            : `Property value is unusually low for ${property.type} in this area.`
        });
      }
    }
    
    // Find location anomalies (isolated properties)
    for (const property of properties) {
      let nearbyCount = 0;
      
      // Count properties within 1km
      for (const other of properties) {
        if (property.id === other.id) continue;
        
        const distance = this.calculateDistance(
          property.coordinates.latitude,
          property.coordinates.longitude,
          other.coordinates.latitude,
          other.coordinates.longitude
        );
        
        if (distance <= 1000) {
          nearbyCount++;
        }
      }
      
      // Properties with no or very few neighbors are spatial anomalies
      if (nearbyCount === 0 && properties.length > 5) {
        anomalies.push({
          propertyId: property.id,
          anomalyType: 'location',
          confidence: 0.85,
          description: 'Property is unusually isolated compared to others in the dataset.'
        });
      }
    }
    
    // Add anomalies to result
    result.anomalies = anomalies;
    
    // Generate insights
    result.insights = [
      `Detected ${anomalies.length} potential anomalies among ${properties.length} properties.`,
      `${anomalies.filter(a => a.anomalyType === 'value').length} anomalies are related to unusual property values.`,
      `${anomalies.filter(a => a.anomalyType === 'location').length} anomalies are related to unusual locations.`
    ];
    
    if (anomalies.length > 0) {
      // Find the highest confidence anomaly
      const highestConfidenceAnomaly = anomalies.reduce((prev, current) => 
        prev.confidence > current.confidence ? prev : current);
      
      result.insights.push(
        `The most significant anomaly: ${highestConfidenceAnomaly.description} (${Math.round(highestConfidenceAnomaly.confidence * 100)}% confidence)`
      );
    }
    
    // Set confidence level based on sample size
    result.metadata.confidenceLevel = properties.length > 15 ? 'HIGH' : 'MEDIUM';
    
    return result;
  }
  
  /**
   * Helper function to get the most common bearing in a set of properties
   */
  private getMostCommonBearing(properties: any[]): string {
    if (!properties.length) return '';
    
    const bearingCounts: Record<string, number> = {};
    for (const property of properties) {
      if (!property.bearing) continue;
      
      if (!bearingCounts[property.bearing]) {
        bearingCounts[property.bearing] = 0;
      }
      
      bearingCounts[property.bearing]++;
    }
    
    let mostCommonBearing = '';
    let maxCount = 0;
    
    for (const [bearing, count] of Object.entries(bearingCounts)) {
      if (count > maxCount) {
        mostCommonBearing = bearing;
        maxCount = count;
      }
    }
    
    return mostCommonBearing;
  }
  
  /**
   * Helper function to determine an area name from coordinates
   * This is a simplified implementation - would use actual geospatial data in production
   */
  private determineAreaFromCoordinates(latitude: number, longitude: number): string {
    // Simplified area determination for Benton County
    if (latitude > 46.28 && longitude < -119.28) {
      return 'Kennewick';
    } else if (latitude > 46.28 && longitude > -119.28) {
      return 'West Richland';
    } else if (latitude < 46.22 && longitude < -119.2) {
      return 'South Richland';
    } else if (latitude < 46.22 && longitude > -119.45) {
      return 'Benton City';
    } else if (latitude > 46.3 && longitude < -119.4) {
      return 'Prosser';
    } else {
      return 'Richland';
    }
  }
}

// Create the singleton instance
export const geospatialAnalysisAgent = new GeospatialAnalysisAgent();
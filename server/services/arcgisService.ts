/**
 * ArcGIS REST API Service for Benton County Building Cost System
 * 
 * This service provides connectivity to ArcGIS REST APIs for retrieving
 * building and cost data directly from county GIS systems.
 */

import fetch from 'node-fetch';
import { storage } from '../storage';

// ArcGIS Configuration (should be moved to environment variables in production)
const ARCGIS_BASE_URL = process.env.ARCGIS_BASE_URL || 'https://gis.bentoncountywa.gov/arcgis/rest/services';
const ARCGIS_TOKEN = process.env.ARCGIS_TOKEN || '';
const ARCGIS_BUILDING_LAYER = process.env.ARCGIS_BUILDING_LAYER || '/Assessor/BuildingData/MapServer/0';

interface ArcGISQueryParams {
  where?: string;
  outFields?: string;
  returnGeometry?: boolean;
  format?: 'json' | 'geojson';
  token?: string;
  f?: string;
  orderByFields?: string;
  resultOffset?: number;
  resultRecordCount?: number;
}

interface ArcGISFeature {
  attributes: Record<string, any>;
  geometry?: {
    x: number;
    y: number;
    [key: string]: any;
  };
}

interface ArcGISQueryResult {
  features: ArcGISFeature[];
  exceededTransferLimit?: boolean;
  [key: string]: any;
}

/**
 * Create an authenticated ArcGIS query URL
 * 
 * @param endpoint The ArcGIS endpoint to query
 * @param params Query parameters
 * @returns Complete URL with parameters
 */
function createArcGISUrl(endpoint: string, params: ArcGISQueryParams): string {
  const url = new URL(`${ARCGIS_BASE_URL}${endpoint}/query`);
  
  // Set default parameters
  const defaultParams: ArcGISQueryParams = {
    f: 'json',
    where: '1=1',
    outFields: '*',
    returnGeometry: false,
  };
  
  // Merge default and custom parameters
  const mergedParams = { ...defaultParams, ...params };
  
  // Add token if available
  if (ARCGIS_TOKEN) {
    mergedParams.token = ARCGIS_TOKEN;
  }
  
  // Convert parameters to URL search params
  Object.entries(mergedParams).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.append(key, String(value));
    }
  });
  
  return url.toString();
}

/**
 * Query the ArcGIS REST API
 * 
 * @param endpoint The ArcGIS endpoint to query
 * @param params Query parameters
 * @returns Query results
 */
export async function queryArcGIS(
  endpoint: string, 
  params: ArcGISQueryParams
): Promise<ArcGISQueryResult> {
  try {
    console.log(`Querying ArcGIS endpoint: ${endpoint}`);
    
    // Record the attempt in activity log
    await storage.createActivity({
      action: `Querying ArcGIS endpoint: ${endpoint}`,
      icon: 'map',
      iconColor: 'blue'
    });
    
    const url = createArcGISUrl(endpoint, params);
    console.log(`ArcGIS query URL: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorMessage = `ArcGIS API error: ${response.status} ${response.statusText}`;
      console.error(errorMessage);
      
      // Record the error in activity log
      await storage.createActivity({
        action: errorMessage,
        icon: 'x-circle',
        iconColor: 'red'
      });
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json() as ArcGISQueryResult;
    
    // Log success information
    console.log(`ArcGIS query successful: Retrieved ${data.features?.length || 0} features`);
    
    // Record the success in activity log
    await storage.createActivity({
      action: `Retrieved ${data.features?.length || 0} features from ArcGIS`,
      icon: 'check-circle',
      iconColor: 'green'
    });
    
    return data;
  } catch (error: any) {
    const errorMessage = `ArcGIS query error: ${error.message || 'Unknown error'}`;
    console.error(errorMessage);
    
    // Record the error in activity log
    await storage.createActivity({
      action: errorMessage,
      icon: 'alert-triangle',
      iconColor: 'red'
    });
    
    throw new Error(errorMessage);
  }
}

/**
 * Fetch building data from ArcGIS
 * 
 * @param buildingId Optional building ID to filter by
 * @param filter Optional custom filter expression
 * @returns Building data from ArcGIS
 */
export async function fetchBuildingData(
  buildingId?: string | number,
  filter?: string
): Promise<ArcGISFeature[]> {
  let whereClause = '1=1';
  
  if (buildingId) {
    whereClause = `BuildingID = '${buildingId}'`;
  } else if (filter) {
    whereClause = filter;
  }
  
  const queryParams: ArcGISQueryParams = {
    where: whereClause,
    outFields: '*',
    returnGeometry: true,
    format: 'json'
  };
  
  try {
    const result = await queryArcGIS(ARCGIS_BUILDING_LAYER, queryParams);
    return result.features || [];
  } catch (error) {
    console.error('Error fetching building data from ArcGIS:', error);
    throw error;
  }
}

/**
 * Fetch building costs from ArcGIS by region
 * 
 * @param region Region code to filter by
 * @returns Cost data for buildings in the specified region
 */
export async function fetchBuildingCostsByRegion(
  region: string
): Promise<ArcGISFeature[]> {
  const whereClause = `Region = '${region}'`;
  
  const queryParams: ArcGISQueryParams = {
    where: whereClause,
    outFields: 'BuildingID,BuildingType,BaseCost,Region,ComplexityFactor,QualityFactor,ConditionFactor',
    returnGeometry: false,
    format: 'json'
  };
  
  try {
    const result = await queryArcGIS(ARCGIS_BUILDING_LAYER, queryParams);
    return result.features || [];
  } catch (error) {
    console.error(`Error fetching building costs for region ${region} from ArcGIS:`, error);
    throw error;
  }
}

/**
 * Fetch building costs from ArcGIS by building type
 * 
 * @param buildingType Building type code to filter by
 * @returns Cost data for buildings of the specified type
 */
export async function fetchBuildingCostsByType(
  buildingType: string
): Promise<ArcGISFeature[]> {
  const whereClause = `BuildingType = '${buildingType}'`;
  
  const queryParams: ArcGISQueryParams = {
    where: whereClause,
    outFields: 'BuildingID,BuildingType,BaseCost,Region,ComplexityFactor,QualityFactor,ConditionFactor',
    returnGeometry: false,
    format: 'json'
  };
  
  try {
    const result = await queryArcGIS(ARCGIS_BUILDING_LAYER, queryParams);
    return result.features || [];
  } catch (error) {
    console.error(`Error fetching building costs for type ${buildingType} from ArcGIS:`, error);
    throw error;
  }
}

/**
 * Test the connection to ArcGIS REST API
 * 
 * @returns Connection test result
 */
export async function testArcGISConnection(): Promise<{
  success: boolean;
  message: string;
  config?: {
    baseUrl: string;
    hasToken: boolean;
    endpointExists: boolean;
  }
}> {
  try {
    console.log('Testing ArcGIS connection...');
    
    // Check for required environment variables
    if (!ARCGIS_BASE_URL) {
      return {
        success: false,
        message: 'ARCGIS_BASE_URL environment variable is not set',
        config: {
          baseUrl: '',
          hasToken: Boolean(ARCGIS_TOKEN),
          endpointExists: false
        }
      };
    }
    
    // Create a test query to check if the API is accessible
    const testUrl = `${ARCGIS_BASE_URL}/info?f=json`;
    if (ARCGIS_TOKEN) {
      testUrl + `&token=${ARCGIS_TOKEN}`;
    }
    
    console.log(`Testing ArcGIS API access at: ${testUrl}`);
    const response = await fetch(testUrl);
    
    if (!response.ok) {
      const errorMessage = `ArcGIS API error: ${response.status} ${response.statusText}`;
      console.error(errorMessage);
      
      return {
        success: false,
        message: errorMessage,
        config: {
          baseUrl: ARCGIS_BASE_URL,
          hasToken: Boolean(ARCGIS_TOKEN),
          endpointExists: false
        }
      };
    }
    
    // Test the building layer endpoint
    const layerTestUrl = `${ARCGIS_BASE_URL}${ARCGIS_BUILDING_LAYER}?f=json`;
    if (ARCGIS_TOKEN) {
      layerTestUrl + `&token=${ARCGIS_TOKEN}`;
    }
    
    console.log(`Testing building layer access at: ${layerTestUrl}`);
    const layerResponse = await fetch(layerTestUrl);
    const endpointExists = layerResponse.ok;
    
    return {
      success: true,
      message: `Successfully connected to ArcGIS API at ${ARCGIS_BASE_URL}`,
      config: {
        baseUrl: ARCGIS_BASE_URL,
        hasToken: Boolean(ARCGIS_TOKEN),
        endpointExists
      }
    };
  } catch (error: any) {
    console.error('ArcGIS connection test failed:', error);
    
    return {
      success: false,
      message: `Failed to connect to ArcGIS API: ${error.message || 'Unknown error'}`,
      config: {
        baseUrl: ARCGIS_BASE_URL,
        hasToken: Boolean(ARCGIS_TOKEN),
        endpointExists: false
      }
    };
  }
}

/**
 * Import building cost data from ArcGIS to the database
 * 
 * @param region Optional region to import
 * @param buildingType Optional building type to import
 * @returns Import results
 */
export async function importBuildingCostsFromArcGIS(
  region?: string,
  buildingType?: string
): Promise<{
  success: boolean;
  message: string;
  count?: number;
}> {
  try {
    console.log(`Importing building costs from ArcGIS${region ? ` for region ${region}` : ''}${buildingType ? ` and building type ${buildingType}` : ''}`);
    
    // Record the import attempt in activity log
    await storage.createActivity({
      action: `Importing building costs from ArcGIS${region ? ` for region ${region}` : ''}${buildingType ? ` and building type ${buildingType}` : ''}`,
      icon: 'download',
      iconColor: 'blue'
    });
    
    // Build the query based on filters
    let whereClause = '1=1';
    if (region && buildingType) {
      whereClause = `Region = '${region}' AND BuildingType = '${buildingType}'`;
    } else if (region) {
      whereClause = `Region = '${region}'`;
    } else if (buildingType) {
      whereClause = `BuildingType = '${buildingType}'`;
    }
    
    const queryParams: ArcGISQueryParams = {
      where: whereClause,
      outFields: '*',
      returnGeometry: false,
      format: 'json'
    };
    
    // Query ArcGIS for building costs
    const result = await queryArcGIS(ARCGIS_BUILDING_LAYER, queryParams);
    
    if (!result.features || result.features.length === 0) {
      const noDataMessage = `No building cost data found in ArcGIS${region ? ` for region ${region}` : ''}${buildingType ? ` and building type ${buildingType}` : ''}`;
      console.warn(noDataMessage);
      
      await storage.createActivity({
        action: noDataMessage,
        icon: 'alert-circle',
        iconColor: 'amber'
      });
      
      return {
        success: false,
        message: noDataMessage,
        count: 0
      };
    }
    
    // Process the features and import to database
    const costMatrixEntries = result.features.map((feature) => {
      const attrs = feature.attributes;
      
      return {
        region: attrs.Region || region || 'UNKNOWN',
        buildingType: attrs.BuildingType || buildingType || 'UNKNOWN',
        buildingTypeDescription: attrs.BuildingTypeDescription || 'Imported from ArcGIS',
        baseCost: String(attrs.BaseCost || '0'),
        matrixYear: new Date().getFullYear(),
        sourceMatrixId: attrs.SourceID || 0,
        matrixDescription: `Imported from ArcGIS on ${new Date().toISOString()}`,
        dataPoints: 1,
        county: attrs.County || 'Benton',
        state: attrs.State || 'WA',
        complexityFactorBase: attrs.ComplexityFactor || 1,
        qualityFactorBase: attrs.QualityFactor || 1,
        conditionFactorBase: attrs.ConditionFactor || 1
      };
    });
    
    console.log(`Prepared ${costMatrixEntries.length} entries for import from ArcGIS`);
    
    // Import to database
    const importResults = await Promise.all(
      costMatrixEntries.map(async (entry) => {
        try {
          // Store in database using storage interface
          const savedEntry = await storage.createCostMatrix(entry);
          return { success: true, entry: savedEntry };
        } catch (error: any) {
          console.error(`Error importing entry: ${error.message}`, entry);
          return { success: false, error: error.message, entry };
        }
      })
    );
    
    // Count successful and failed imports
    const successCount = importResults.filter(r => r.success).length;
    const failureCount = importResults.filter(r => !r.success).length;
    
    const summaryMessage = `Imported ${successCount} building costs from ArcGIS${failureCount > 0 ? ` (${failureCount} failed)` : ''}`;
    console.log(summaryMessage);
    
    // Record the import results in activity log
    await storage.createActivity({
      action: summaryMessage,
      icon: failureCount > 0 ? 'alert-circle' : 'check-circle',
      iconColor: failureCount > 0 ? 'amber' : 'green'
    });
    
    return {
      success: true,
      message: summaryMessage,
      count: successCount
    };
  } catch (error: any) {
    const errorMessage = `Error importing building costs from ArcGIS: ${error.message || 'Unknown error'}`;
    console.error(errorMessage);
    
    // Record the error in activity log
    await storage.createActivity({
      action: errorMessage,
      icon: 'x-circle',
      iconColor: 'red'
    });
    
    throw new Error(errorMessage);
  }
}
/**
 * SQL Server Direct Connection Service for Benton County Building Cost System
 * 
 * This service provides direct database connectivity to SQL Server for retrieving
 * building and cost data from county database systems.
 */

import * as sql from 'mssql';
import { storage } from '../storage';

// SQL Server Configuration (should be moved to environment variables in production)
const SQL_SERVER_CONFIG: sql.config = {
  server: process.env.SQL_SERVER_HOST || 'localhost',
  port: parseInt(process.env.SQL_SERVER_PORT || '1433', 10),
  user: process.env.SQL_SERVER_USER || '',
  password: process.env.SQL_SERVER_PASSWORD || '',
  database: process.env.SQL_SERVER_DATABASE || 'BentonCountyAssessor',
  options: {
    encrypt: Boolean(process.env.SQL_SERVER_ENCRYPT || true), // Use encryption
    trustServerCertificate: Boolean(process.env.SQL_SERVER_TRUST_CERT || false), // Change to true for self-signed certs
    enableArithAbort: true
  },
  connectionTimeout: 30000, // 30 seconds
  requestTimeout: 30000 // 30 seconds for queries
};

// Pool singleton
let pool: sql.ConnectionPool | null = null;

/**
 * Get or create SQL Server connection pool
 * @returns SQL Server connection pool
 */
async function getConnectionPool(): Promise<sql.ConnectionPool> {
  if (!pool) {
    console.log('Creating new SQL Server connection pool');
    pool = await new sql.ConnectionPool(SQL_SERVER_CONFIG).connect();
    console.log('SQL Server connection pool created successfully');
    
    // Set up error handler
    pool.on('error', (err: Error) => {
      console.error('SQL Server connection pool error:', err);
      pool = null;
    });
  }
  
  return pool;
}

/**
 * Execute a SQL query against the SQL Server database
 * 
 * @param query SQL query to execute
 * @param params Optional parameters for the query
 * @returns Query result
 */
export async function executeQuery<T = any>(
  query: string,
  params: Record<string, any> = {}
): Promise<T[]> {
  try {
    console.log(`Executing SQL query: ${query.substring(0, 100)}...`);
    
    // Record the query in activity log
    await storage.createActivity({
      action: `Executing SQL Server query`,
      icon: 'database',
      iconColor: 'blue'
    });
    
    const pool = await getConnectionPool();
    const request = pool.request();
    
    // Add parameters to the request
    Object.entries(params).forEach(([key, value]) => {
      request.input(key, value);
    });
    
    const result = await request.query<T>(query);
    
    console.log(`Query executed successfully, returned ${result.recordset.length} rows`);
    
    // Record success in activity log
    await storage.createActivity({
      action: `SQL Server query returned ${result.recordset.length} rows`,
      icon: 'check-circle',
      iconColor: 'green'
    });
    
    return result.recordset;
  } catch (error: any) {
    const errorMessage = `SQL Server query error: ${error.message || 'Unknown error'}`;
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

/**
 * Test the connection to SQL Server
 * 
 * @returns Connection test result
 */
export async function testSqlServerConnection(): Promise<{
  success: boolean;
  message: string;
  config?: {
    server: string;
    port: number;
    database: string;
    hasCredentials: boolean;
  }
}> {
  try {
    console.log('Testing SQL Server connection...');
    
    // Check for required environment variables
    if (!SQL_SERVER_CONFIG.server || !SQL_SERVER_CONFIG.user || !SQL_SERVER_CONFIG.password) {
      return {
        success: false,
        message: 'SQL Server credentials are missing. Please check environment variables.',
        config: {
          server: SQL_SERVER_CONFIG.server,
          port: SQL_SERVER_CONFIG.port || 1433,
          database: SQL_SERVER_CONFIG.database || '',
          hasCredentials: Boolean(SQL_SERVER_CONFIG.user && SQL_SERVER_CONFIG.password)
        }
      };
    }
    
    // Test connection by getting a pool and executing a simple query
    const pool = await getConnectionPool();
    const result = await pool.request().query('SELECT @@VERSION as version');
    
    const sqlServerVersion = result.recordset[0]?.version || 'Unknown';
    console.log(`Successfully connected to SQL Server: ${sqlServerVersion}`);
    
    return {
      success: true,
      message: `Successfully connected to SQL Server at ${SQL_SERVER_CONFIG.server}:${SQL_SERVER_CONFIG.port}`,
      config: {
        server: SQL_SERVER_CONFIG.server,
        port: SQL_SERVER_CONFIG.port || 1433,
        database: SQL_SERVER_CONFIG.database || '',
        hasCredentials: true
      }
    };
  } catch (error: any) {
    console.error('SQL Server connection test failed:', error);
    
    return {
      success: false,
      message: `Failed to connect to SQL Server: ${error.message || 'Unknown error'}`,
      config: {
        server: SQL_SERVER_CONFIG.server,
        port: SQL_SERVER_CONFIG.port || 1433,
        database: SQL_SERVER_CONFIG.database || '',
        hasCredentials: Boolean(SQL_SERVER_CONFIG.user && SQL_SERVER_CONFIG.password)
      }
    };
  }
}

/**
 * Fetch building data from SQL Server
 * 
 * @param buildingId Optional building ID to filter by
 * @returns Building data from SQL Server
 */
export async function fetchBuildingData(buildingId?: string | number): Promise<any[]> {
  let query = `
    SELECT 
      BuildingID, 
      BuildingName, 
      BuildingType, 
      BuildingAddress,
      YearBuilt,
      SquareFootage,
      Stories,
      Region,
      BaseCost,
      QualityFactor,
      ComplexityFactor,
      ConditionFactor
    FROM 
      Buildings
  `;
  
  const params: Record<string, any> = {};
  
  if (buildingId) {
    query += ' WHERE BuildingID = @buildingId';
    params.buildingId = buildingId;
  }
  
  try {
    const buildings = await executeQuery(query, params);
    return buildings;
  } catch (error) {
    console.error('Error fetching building data from SQL Server:', error);
    throw error;
  }
}

/**
 * Fetch building costs from SQL Server by region
 * 
 * @param region Region code to filter by
 * @returns Cost data for buildings in the specified region
 */
export async function fetchBuildingCostsByRegion(region: string): Promise<any[]> {
  const query = `
    SELECT 
      b.BuildingID,
      b.BuildingType,
      bt.Description AS BuildingTypeDescription,
      b.BaseCost,
      b.Region,
      b.ComplexityFactor,
      b.QualityFactor,
      b.ConditionFactor
    FROM 
      Buildings b
    JOIN
      BuildingTypes bt ON b.BuildingType = bt.Code
    WHERE 
      b.Region = @region
  `;
  
  try {
    const costs = await executeQuery(query, { region });
    return costs;
  } catch (error) {
    console.error(`Error fetching building costs for region ${region} from SQL Server:`, error);
    throw error;
  }
}

/**
 * Fetch building costs from SQL Server by building type
 * 
 * @param buildingType Building type code to filter by
 * @returns Cost data for buildings of the specified type
 */
export async function fetchBuildingCostsByType(buildingType: string): Promise<any[]> {
  const query = `
    SELECT 
      b.BuildingID,
      b.BuildingType,
      bt.Description AS BuildingTypeDescription,
      b.BaseCost,
      b.Region,
      b.ComplexityFactor,
      b.QualityFactor,
      b.ConditionFactor
    FROM 
      Buildings b
    JOIN
      BuildingTypes bt ON b.BuildingType = bt.Code
    WHERE 
      b.BuildingType = @buildingType
  `;
  
  try {
    const costs = await executeQuery(query, { buildingType });
    return costs;
  } catch (error) {
    console.error(`Error fetching building costs for type ${buildingType} from SQL Server:`, error);
    throw error;
  }
}

/**
 * Import building cost data from SQL Server to the database
 * 
 * @param region Optional region to import
 * @param buildingType Optional building type to import
 * @returns Import results
 */
export async function importBuildingCostsFromSqlServer(
  region?: string,
  buildingType?: string
): Promise<{
  success: boolean;
  message: string;
  count?: number;
}> {
  try {
    console.log(`Importing building costs from SQL Server${region ? ` for region ${region}` : ''}${buildingType ? ` and building type ${buildingType}` : ''}`);
    
    // Record the import attempt in activity log
    await storage.createActivity({
      action: `Importing building costs from SQL Server${region ? ` for region ${region}` : ''}${buildingType ? ` and building type ${buildingType}` : ''}`,
      icon: 'download',
      iconColor: 'blue'
    });
    
    // Build the query based on filters
    let query = `
      SELECT 
        b.BuildingID,
        b.BuildingType,
        bt.Description AS BuildingTypeDescription,
        b.BaseCost,
        b.Region,
        'Benton' AS County,
        'WA' AS State,
        b.ComplexityFactor,
        b.QualityFactor,
        b.ConditionFactor
      FROM 
        Buildings b
      JOIN
        BuildingTypes bt ON b.BuildingType = bt.Code
      WHERE 1=1
    `;
    
    const params: Record<string, any> = {};
    
    if (region) {
      query += ' AND b.Region = @region';
      params.region = region;
    }
    
    if (buildingType) {
      query += ' AND b.BuildingType = @buildingType';
      params.buildingType = buildingType;
    }
    
    // Query SQL Server for building costs
    const buildings = await executeQuery(query, params);
    
    if (!buildings || buildings.length === 0) {
      const noDataMessage = `No building cost data found in SQL Server${region ? ` for region ${region}` : ''}${buildingType ? ` and building type ${buildingType}` : ''}`;
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
    
    // Process the buildings and import to database
    const costMatrixEntries = buildings.map((building) => {
      return {
        region: building.Region || region || 'UNKNOWN',
        buildingType: building.BuildingType || buildingType || 'UNKNOWN',
        buildingTypeDescription: building.BuildingTypeDescription || 'Imported from SQL Server',
        baseCost: String(building.BaseCost || '0'),
        matrixYear: new Date().getFullYear(),
        sourceMatrixId: building.BuildingID || 0,
        matrixDescription: `Imported from SQL Server on ${new Date().toISOString()}`,
        dataPoints: 1,
        county: building.County || 'Benton',
        state: building.State || 'WA',
        complexityFactorBase: building.ComplexityFactor || 1,
        qualityFactorBase: building.QualityFactor || 1,
        conditionFactorBase: building.ConditionFactor || 1
      };
    });
    
    console.log(`Prepared ${costMatrixEntries.length} entries for import from SQL Server`);
    
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
    
    const summaryMessage = `Imported ${successCount} building costs from SQL Server${failureCount > 0 ? ` (${failureCount} failed)` : ''}`;
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
    const errorMessage = `Error importing building costs from SQL Server: ${error.message || 'Unknown error'}`;
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
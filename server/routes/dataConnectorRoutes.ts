/**
 * Data Connector Routes for Benton County Building Cost System
 * 
 * These routes provide access to multiple data sources including:
 * - ArcGIS REST API
 * - SQL Server direct connection
 * - Enhanced FTP integration
 */

import { Router, Request, Response } from 'express';
import { testConnection, listFiles } from '../services/ftpService';
import { testArcGISConnection, fetchBuildingData, importBuildingCostsFromArcGIS } from '../services/arcgisService';
import { testSqlServerConnection, fetchBuildingData as fetchSqlServerBuildingData, importBuildingCostsFromSqlServer } from '../services/sqlServerService';
import { storage } from '../storage';

const router = Router();

// Available data connector types
const CONNECTOR_TYPES = ['arcgis', 'sqlserver', 'ftp'];

/**
 * Test connection to a data source
 * GET /api/data-connector/test/:type
 * 
 * This endpoint tests the connection to the specified data source.
 * Valid types: 'arcgis', 'sqlserver', 'ftp'
 */
router.get('/test/:type', async (req: Request, res: Response) => {
  try {
    const connectorType = req.params.type.toLowerCase();
    
    if (!CONNECTOR_TYPES.includes(connectorType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid connector type: ${connectorType}. Valid types are: ${CONNECTOR_TYPES.join(', ')}`,
        timestamp: new Date().toISOString()
      });
    }
    
    console.log(`Testing connection to ${connectorType} data source`);
    
    // Record the attempt in activity log
    await storage.createActivity({
      action: `Testing connection to ${connectorType} data source`,
      icon: 'plug',
      iconColor: 'blue'
    });
    
    let result: {
      success: boolean;
      message: string;
      config?: any;
    } = {
      success: false,
      message: 'Connection test not implemented'
    };
    
    switch (connectorType) {
      case 'arcgis':
        result = await testArcGISConnection();
        break;
      case 'sqlserver':
        result = await testSqlServerConnection();
        break;
      case 'ftp':
        result = await testConnection();
        break;
    }
    
    // Record the result in activity log
    if (result.success) {
      await storage.createActivity({
        action: `Successfully connected to ${connectorType} data source`,
        icon: 'check-circle',
        iconColor: 'green'
      });
    } else {
      await storage.createActivity({
        action: `Failed to connect to ${connectorType} data source: ${result.message}`,
        icon: 'x-circle',
        iconColor: 'red'
      });
    }
    
    return res.json({
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error(`Error testing connection:`, error);
    
    // Record error in activity log
    await storage.createActivity({
      action: `Error testing connection: ${error.message || 'Unknown error'}`,
      icon: 'alert-triangle',
      iconColor: 'red'
    });
    
    return res.status(500).json({
      success: false,
      message: `Error testing connection: ${error.message || 'Unknown error'}`,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Import building costs from a data source
 * POST /api/data-connector/import/:type
 * 
 * This endpoint imports building cost data from the specified data source.
 * Valid types: 'arcgis', 'sqlserver'
 * 
 * Request body:
 * {
 *   region: string,       // Optional - region to filter by
 *   buildingType: string, // Optional - building type to filter by
 *   userId: number        // Optional - user ID of the person initiating import
 * }
 */
router.post('/import/:type', async (req: Request, res: Response) => {
  try {
    const connectorType = req.params.type.toLowerCase();
    const { region, buildingType, userId } = req.body;
    
    // Validate connector type
    if (!['arcgis', 'sqlserver'].includes(connectorType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid connector type for import: ${connectorType}. Valid types are: arcgis, sqlserver`,
        timestamp: new Date().toISOString()
      });
    }
    
    console.log(`Importing building costs from ${connectorType}${region ? ` for region ${region}` : ''}${buildingType ? ` and building type ${buildingType}` : ''}`);
    
    // Record the import attempt in activity log
    await storage.createActivity({
      action: `Starting import from ${connectorType}${region ? ` for region ${region}` : ''}${buildingType ? ` and building type ${buildingType}` : ''}`,
      icon: 'download',
      iconColor: 'blue'
    });
    
    // Test connection before attempting import
    let connectionTest: {
      success: boolean;
      message: string;
      config?: any;
    } = {
      success: false,
      message: 'Connection test not initialized'
    };
    
    if (connectorType === 'arcgis') {
      connectionTest = await testArcGISConnection();
    } else if (connectorType === 'sqlserver') {
      connectionTest = await testSqlServerConnection();
    }
    
    if (!connectionTest.success) {
      const errorMessage = `Failed to connect to ${connectorType}: ${connectionTest.message}`;
      console.error(errorMessage);
      
      // Record connection failure in activity log
      await storage.createActivity({
        action: errorMessage,
        icon: 'plug-x',
        iconColor: 'red'
      });
      
      return res.status(500).json({
        success: false,
        message: errorMessage,
        timestamp: new Date().toISOString()
      });
    }
    
    // Import the data based on connector type
    let importResult: {
      success: boolean;
      message: string;
      count?: number;
      items?: any[];
    } = {
      success: false,
      message: 'Import not initialized'
    };
    
    if (connectorType === 'arcgis') {
      importResult = await importBuildingCostsFromArcGIS(region, buildingType);
    } else if (connectorType === 'sqlserver') {
      importResult = await importBuildingCostsFromSqlServer(region, buildingType);
    }
    
    // If a user ID was provided, record a user-specific activity
    if (userId && importResult.success) {
      const userDescription = `User ID ${userId} imported building costs from ${connectorType}`;
      await storage.createActivity({
        action: userDescription,
        icon: 'user',
        iconColor: 'blue'
      });
    }
    
    return res.json({
      ...importResult,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error(`Error importing building costs:`, error);
    
    // Record error in activity log
    await storage.createActivity({
      action: `Error importing building costs: ${error.message || 'Unknown error'}`,
      icon: 'alert-triangle',
      iconColor: 'red'
    });
    
    return res.status(500).json({
      success: false,
      message: `Error importing building costs: ${error.message || 'Unknown error'}`,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Fetch building data from a data source
 * GET /api/data-connector/building-data/:type
 * 
 * This endpoint fetches building data from the specified data source.
 * Valid types: 'arcgis', 'sqlserver'
 * 
 * Query parameters:
 * - buildingId: Optional building ID to filter by
 * - region: Optional region to filter by
 * - buildingType: Optional building type to filter by
 */
router.get('/building-data/:type', async (req: Request, res: Response) => {
  try {
    const connectorType = req.params.type.toLowerCase();
    const buildingId = req.query.buildingId as string;
    const region = req.query.region as string;
    const buildingType = req.query.buildingType as string;
    
    // Validate connector type
    if (!['arcgis', 'sqlserver'].includes(connectorType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid connector type: ${connectorType}. Valid types are: arcgis, sqlserver`,
        timestamp: new Date().toISOString()
      });
    }
    
    console.log(`Fetching building data from ${connectorType}${buildingId ? ` for building ID ${buildingId}` : ''}`);
    
    // Record the fetch attempt in activity log
    await storage.createActivity({
      action: `Fetching building data from ${connectorType}${buildingId ? ` for building ID ${buildingId}` : ''}`,
      icon: 'database-search',
      iconColor: 'blue'
    });
    
    // Fetch data based on connector type
    let buildings = [];
    
    if (connectorType === 'arcgis') {
      // For ArcGIS, we need to construct a filter if only region or buildingType is provided
      let filter = '';
      if (region && !buildingId) {
        filter = `Region = '${region}'`;
      }
      if (buildingType && !buildingId) {
        filter = filter ? `${filter} AND BuildingType = '${buildingType}'` : `BuildingType = '${buildingType}'`;
      }
      
      buildings = await fetchBuildingData(buildingId, filter);
    } else if (connectorType === 'sqlserver') {
      buildings = await fetchSqlServerBuildingData(buildingId);
      
      // Filter results by region and buildingType if provided
      if (region || buildingType) {
        buildings = buildings.filter(building => {
          let match = true;
          if (region) match = match && building.Region === region;
          if (buildingType) match = match && building.BuildingType === buildingType;
          return match;
        });
      }
    }
    
    // Record the fetch result in activity log
    await storage.createActivity({
      action: `Found ${buildings.length} buildings from ${connectorType}`,
      icon: 'check-circle',
      iconColor: 'green'
    });
    
    return res.json({
      success: true,
      count: buildings.length,
      buildings,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error(`Error fetching building data:`, error);
    
    // Record error in activity log
    await storage.createActivity({
      action: `Error fetching building data: ${error.message || 'Unknown error'}`,
      icon: 'alert-triangle',
      iconColor: 'red'
    });
    
    return res.status(500).json({
      success: false,
      message: `Error fetching building data: ${error.message || 'Unknown error'}`,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
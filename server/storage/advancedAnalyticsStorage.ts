import { db } from '../db';
import { sql } from 'drizzle-orm';
import { buildingCosts, costMatrix } from '../../shared/schema';

/**
 * Storage functions for advanced analytics and visualization features
 */

/**
 * Get regional cost data for heatmap visualization
 * 
 * @param region The region/state name
 * @param buildingType The building type
 * @returns County cost data for the specified region and building type
 */
export async function getRegionalCostsForHeatmap(region: string, buildingType: string) {
  try {
    // Query to get average, min, max costs by county within the region
    const result = await db.execute(sql`
      SELECT
        county,
        AVG(base_cost) as avg_cost,
        MIN(base_cost) as min_cost,
        MAX(base_cost) as max_cost,
        COUNT(*) as count
      FROM ${costMatrix}
      WHERE region = ${region}
        AND building_type = ${buildingType}
      GROUP BY county
      ORDER BY county
    `);
    
    // Convert result to array for processing
    const counties = Array.isArray(result) ? result : [result];
    
    return {
      success: true,
      region,
      buildingType,
      counties: counties.map((county: any) => ({
        name: county.county,
        avgCost: parseFloat(county.avg_cost as string),
        minCost: parseFloat(county.min_cost as string),
        maxCost: parseFloat(county.max_cost as string),
        count: parseInt(county.count as string)
      }))
    };
  } catch (error) {
    console.error('Error fetching regional costs for heatmap:', error);
    return {
      success: false,
      error: 'Failed to fetch regional cost data',
      counties: []
    };
  }
}

/**
 * Get hierarchical cost data for drill-down visualization
 * 
 * @param region The region/state name
 * @param buildingType The building type
 * @returns Hierarchical cost data for the specified region and building type
 */
export async function getHierarchicalCostData(region: string, buildingType: string) {
  try {
    // Get county-level data
    const countiesResult = await db.execute(sql`
      SELECT
        county,
        AVG(base_cost) as avg_cost,
        COUNT(*) as count
      FROM ${costMatrix}
      WHERE region = ${region}
        AND building_type = ${buildingType}
      GROUP BY county
      ORDER BY county
    `);
    
    // Get subcategory data (quality grade within each county)
    const subcategoriesResult = await db.execute(sql`
      SELECT
        county,
        quality_factor_base as quality_grade,
        AVG(base_cost) as avg_cost,
        COUNT(*) as count
      FROM ${costMatrix}
      WHERE region = ${region}
        AND building_type = ${buildingType}
      GROUP BY county, quality_factor_base
      ORDER BY county, quality_factor_base
    `);
    
    // Convert results to arrays for processing
    const counties = Array.isArray(countiesResult) ? countiesResult : [countiesResult];
    const subcategories = Array.isArray(subcategoriesResult) ? subcategoriesResult : [subcategoriesResult];
    
    // Build hierarchical structure
    const countyMap = new Map();
    
    counties.forEach((county: any) => {
      countyMap.set(county.county, {
        name: county.county,
        value: parseFloat(county.avg_cost as string),
        children: []
      });
    });
    
    subcategories.forEach((sub: any) => {
      const county = countyMap.get(sub.county);
      if (county) {
        county.children.push({
          name: sub.quality_grade || 'Unknown',
          value: parseFloat(sub.avg_cost as string),
          count: parseInt(sub.count as string)
        });
      }
    });
    
    return {
      success: true,
      data: {
        name: region,
        children: Array.from(countyMap.values())
      }
    };
  } catch (error) {
    console.error('Error fetching hierarchical cost data:', error);
    return {
      success: false,
      error: 'Failed to fetch hierarchical cost data',
      data: null
    };
  }
}

/**
 * Get statistical data for correlation and outlier analysis
 * 
 * @param region The region/state name
 * @param buildingType The building type
 * @returns Statistical data for the specified region and building type
 */
export async function getStatisticalData(region: string, buildingType: string) {
  try {
    // Get building data for statistical analysis
    const buildingsResult = await db.execute(sql`
      SELECT
        id,
        region,
        county,
        base_cost as cost,
        data_points as size,
        matrix_year as yearBuilt,
        quality_factor_base as qualityGrade
      FROM ${costMatrix}
      WHERE region = ${region}
        AND building_type = ${buildingType}
      ORDER BY id
    `);
    
    // Convert result to array for processing
    const buildings = Array.isArray(buildingsResult) ? buildingsResult : [buildingsResult];
    
    if (buildings.length === 0) {
      return {
        success: true,
        buildings: [],
        costs: [],
        correlations: null
      };
    }
    
    // Extract costs and sizes for correlation analysis
    const costs = buildings.map((b: any) => parseFloat(b.cost as string));
    const sizes = buildings.map((b: any) => parseFloat(b.size as string));
    
    return {
      success: true,
      buildings: buildings.map((b: any) => ({
        id: b.id,
        region: b.region,
        county: b.county,
        cost: parseFloat(b.cost as string),
        size: parseFloat(b.size as string),
        yearBuilt: parseInt(b.yearBuilt as string) || 0,
        qualityGrade: b.qualityGrade
      })),
      costs,
      correlations: {
        size: sizes,
        cost: costs
      }
    };
  } catch (error) {
    console.error('Error fetching statistical data:', error);
    return {
      success: false,
      error: 'Failed to fetch statistical data',
      buildings: [],
      costs: [],
      correlations: null
    };
  }
}
/**
 * Benchmarking Storage Interface for Building Cost Building System
 * 
 * This module provides database interactions for benchmarking features
 * such as cross-region and cross-county cost comparisons.
 */
import { db } from "../db";
import { CostMatrix, costMatrix } from "@shared/schema";
import { eq, and, isNull, isNotNull, desc, asc, sql, count } from "drizzle-orm";

// Get cost matrix entries by county
export async function getCostMatrixByCounty(county: string): Promise<CostMatrix[]> {
  return db.select().from(costMatrix)
    .where(and(
      eq(costMatrix.county, county),
      eq(costMatrix.isActive, true)
    ));
}

// Get cost matrix entries by state
export async function getCostMatrixByState(state: string): Promise<CostMatrix[]> {
  return db.select().from(costMatrix)
    .where(and(
      eq(costMatrix.state, state),
      eq(costMatrix.isActive, true)
    ));
}

// Get counties list
export async function getAllCounties(): Promise<string[]> {
  const results = await db.select({ county: costMatrix.county })
    .from(costMatrix)
    .where(and(
      isNotNull(costMatrix.county),
      eq(costMatrix.isActive, true)
    ))
    .groupBy(costMatrix.county);
  
  return results.map(r => r.county).filter((county): county is string => county !== null);
}

// Get states list
export async function getAllStates(): Promise<string[]> {
  const results = await db.select({ state: costMatrix.state })
    .from(costMatrix)
    .where(and(
      isNotNull(costMatrix.state),
      eq(costMatrix.isActive, true)
    ))
    .groupBy(costMatrix.state);
  
  return results.map(r => r.state).filter((state): state is string => state !== null);
}

// Get cost matrix by filters (for flexible querying)
export async function getCostMatrixByFilters(filters: Record<string, any>): Promise<CostMatrix[]> {
  // Start with the base query
  let conditions = [eq(costMatrix.isActive, true)];
  
  // Apply each filter
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && key in costMatrix) {
      conditions.push(eq(costMatrix[key as keyof typeof costMatrix] as any, value));
    }
  }
  
  return db.select().from(costMatrix).where(and(...conditions));
}

// Get unique building types by county
export async function getBuildingTypesByCounty(county: string): Promise<string[]> {
  const results = await db.select({ buildingType: costMatrix.buildingType })
    .from(costMatrix)
    .where(and(
      eq(costMatrix.county, county),
      eq(costMatrix.isActive, true)
    ))
    .groupBy(costMatrix.buildingType);
  
  return results.map(r => r.buildingType).filter((buildingType): buildingType is string => buildingType !== null);
}

// Get unique building types by state
export async function getBuildingTypesByState(state: string): Promise<string[]> {
  const results = await db.select({ buildingType: costMatrix.buildingType })
    .from(costMatrix)
    .where(and(
      eq(costMatrix.state, state),
      eq(costMatrix.isActive, true)
    ))
    .groupBy(costMatrix.buildingType);
  
  return results.map(r => r.buildingType).filter((buildingType): buildingType is string => buildingType !== null);
}

// Get county stats (min, max, avg costs)
export async function getCountyStats(county: string): Promise<{
  minCost: number,
  maxCost: number,
  avgCost: number,
  buildingTypeCount: number
}> {
  const countyData = await getCostMatrixByCounty(county);
  
  if (countyData.length === 0) {
    return {
      minCost: 0,
      maxCost: 0,
      avgCost: 0,
      buildingTypeCount: 0
    };
  }
  
  const costs = countyData.map(m => Number(m.baseCost));
  const minCost = Math.min(...costs);
  const maxCost = Math.max(...costs);
  const avgCost = costs.reduce((sum, cost) => sum + cost, 0) / costs.length;
  
  // Count unique building types
  const buildingTypes = new Set(countyData.map(m => m.buildingType));
  
  return {
    minCost,
    maxCost,
    avgCost,
    buildingTypeCount: buildingTypes.size
  };
}

// ----- Enhanced Benchmarking API Methods -----

/**
 * Compare costs across multiple counties for a specific building type
 */
export async function compareCounties(
  counties: string[],
  buildingType?: string
): Promise<{
  counties: Array<{
    name: string;
    avgCost: number;
    minCost: number;
    maxCost: number;
    buildingTypes: Array<{
      type: string;
      avgCost: number;
      count: number;
    }>;
  }>;
}> {
  const result = {
    counties: [] as Array<{
      name: string;
      avgCost: number;
      minCost: number;
      maxCost: number;
      buildingTypes: Array<{
        type: string;
        avgCost: number;
        count: number;
      }>;
    }>
  };

  // Process each county
  for (const county of counties) {
    // Prepare conditions for the query
    let conditions = [
      eq(costMatrix.county, county),
      eq(costMatrix.isActive, true)
    ];
    
    // Apply building type filter if provided
    if (buildingType) {
      conditions.push(eq(costMatrix.buildingType, buildingType));
    }
    
    const countyData = await db.select().from(costMatrix).where(and(...conditions));
    
    if (countyData.length === 0) continue;
    
    // Calculate county stats
    const costs = countyData.map(m => Number(m.baseCost));
    const minCost = Math.min(...costs);
    const maxCost = Math.max(...costs);
    const avgCost = costs.reduce((sum, cost) => sum + cost, 0) / costs.length;
    
    // Group by building type to calculate per-type averages
    const buildingTypeMap = new Map<string, { total: number; count: number }>();
    
    for (const entry of countyData) {
      const type = entry.buildingType;
      const cost = Number(entry.baseCost);
      
      if (!buildingTypeMap.has(type)) {
        buildingTypeMap.set(type, { total: 0, count: 0 });
      }
      
      const current = buildingTypeMap.get(type)!;
      buildingTypeMap.set(type, {
        total: current.total + cost,
        count: current.count + 1
      });
    }
    
    // Convert the map to the expected array format
    const buildingTypes = Array.from(buildingTypeMap.entries()).map(([type, data]) => ({
      type,
      avgCost: data.total / data.count,
      count: data.count
    }));
    
    // Add county data to result
    result.counties.push({
      name: county,
      avgCost,
      minCost,
      maxCost,
      buildingTypes
    });
  }
  
  return result;
}

/**
 * Compare costs across multiple states for a specific building type
 */
export async function compareStates(
  states: string[],
  buildingType?: string
): Promise<{
  states: Array<{
    name: string;
    avgCost: number;
    minCost: number;
    maxCost: number;
    counties: Array<{
      name: string;
      avgCost: number;
      count: number;
    }>;
  }>;
}> {
  const result = {
    states: [] as Array<{
      name: string;
      avgCost: number;
      minCost: number;
      maxCost: number;
      counties: Array<{
        name: string;
        avgCost: number;
        count: number;
      }>;
    }>
  };

  // Process each state
  for (const state of states) {
    // Prepare conditions for the query
    let conditions = [
      eq(costMatrix.state, state),
      eq(costMatrix.isActive, true)
    ];
    
    // Apply building type filter if provided
    if (buildingType) {
      conditions.push(eq(costMatrix.buildingType, buildingType));
    }
    
    const stateData = await db.select().from(costMatrix).where(and(...conditions));
    
    if (stateData.length === 0) continue;
    
    // Calculate state stats
    const costs = stateData.map(m => Number(m.baseCost));
    const minCost = Math.min(...costs);
    const maxCost = Math.max(...costs);
    const avgCost = costs.reduce((sum, cost) => sum + cost, 0) / costs.length;
    
    // Group by county to calculate per-county averages
    const countyMap = new Map<string, { total: number; count: number }>();
    
    for (const entry of stateData) {
      if (!entry.county) continue;
      const county = entry.county;
      const cost = Number(entry.baseCost);
      
      if (!countyMap.has(county)) {
        countyMap.set(county, { total: 0, count: 0 });
      }
      
      const current = countyMap.get(county)!;
      countyMap.set(county, {
        total: current.total + cost,
        count: current.count + 1
      });
    }
    
    // Convert the map to the expected array format
    const counties = Array.from(countyMap.entries()).map(([name, data]) => ({
      name,
      avgCost: data.total / data.count,
      count: data.count
    }));
    
    // Add state data to result
    result.states.push({
      name: state,
      avgCost,
      minCost,
      maxCost,
      counties
    });
  }
  
  return result;
}

/**
 * Get cost trends over time for a region and building type
 */
export async function getRegionCostTrends(
  region: string,
  buildingType: string,
  years: number = 5
): Promise<{
  region: string;
  buildingType: string;
  trends: Array<{ year: number; cost: number }>;
}> {
  // Get current year
  const currentYear = new Date().getFullYear();
  // Calculate start year
  const startYear = currentYear - years + 1;
  
  // Query cost matrix data for the specified region and years
  const data = await db.select()
    .from(costMatrix)
    .where(and(
      eq(costMatrix.region, region),
      eq(costMatrix.buildingType, buildingType),
      eq(costMatrix.isActive, true)
    ));
  
  // Group by year and calculate average cost for each year
  const yearMap = new Map<number, { total: number; count: number }>();
  
  for (const entry of data) {
    const year = entry.matrixYear;
    const cost = Number(entry.baseCost);
    
    if (!yearMap.has(year)) {
      yearMap.set(year, { total: 0, count: 0 });
    }
    
    const current = yearMap.get(year)!;
    yearMap.set(year, {
      total: current.total + cost,
      count: current.count + 1
    });
  }
  
  // Convert the map to the expected array format and sort by year
  const trends = Array.from(yearMap.entries())
    .filter(([year]) => year >= startYear && year <= currentYear)
    .map(([year, data]) => ({
      year,
      cost: data.total / data.count
    }))
    .sort((a, b) => a.year - b.year);
  
  return {
    region,
    buildingType,
    trends
  };
}

/**
 * Get cost trends over time across multiple counties
 */
export async function getCountyCostTrends(
  counties: string[],
  buildingType: string,
  years: number = 5
): Promise<{
  counties: Array<{
    name: string;
    trends: Array<{ year: number; cost: number }>;
  }>;
}> {
  // Get current year
  const currentYear = new Date().getFullYear();
  // Calculate start year
  const startYear = currentYear - years + 1;
  
  const result = {
    counties: [] as Array<{
      name: string;
      trends: Array<{ year: number; cost: number }>;
    }>
  };
  
  // Process each county
  for (const county of counties) {
    // Query cost matrix data for the specified county and building type
    const data = await db.select()
      .from(costMatrix)
      .where(and(
        eq(costMatrix.county, county),
        eq(costMatrix.buildingType, buildingType),
        eq(costMatrix.isActive, true)
      ));
    
    if (data.length === 0) continue;
    
    // Group by year and calculate average cost for each year
    const yearMap = new Map<number, { total: number; count: number }>();
    
    for (const entry of data) {
      const year = entry.matrixYear;
      const cost = Number(entry.baseCost);
      
      if (!yearMap.has(year)) {
        yearMap.set(year, { total: 0, count: 0 });
      }
      
      const current = yearMap.get(year)!;
      yearMap.set(year, {
        total: current.total + cost,
        count: current.count + 1
      });
    }
    
    // Convert the map to the expected array format and sort by year
    const trends = Array.from(yearMap.entries())
      .filter(([year]) => year >= startYear && year <= currentYear)
      .map(([year, data]) => ({
        year,
        cost: data.total / data.count
      }))
      .sort((a, b) => a.year - b.year);
    
    // Add county data to result
    result.counties.push({
      name: county,
      trends
    });
  }
  
  return result;
}

/**
 * Get regional stats report including most/least expensive regions, cost growth, etc.
 */
export async function getRegionalStatsReport(): Promise<{
  mostExpensiveRegions: Array<{ region: string; avgCost: number }>;
  leastExpensiveRegions: Array<{ region: string; avgCost: number }>;
  costGrowthByRegion: Array<{ region: string; growthRate: number }>;
  buildingTypeDistribution: Array<{ type: string; count: number }>;
  totalDataPoints: number;
}> {
  // Get current year
  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;
  
  // Query all active cost matrix data
  const data = await db.select().from(costMatrix)
    .where(eq(costMatrix.isActive, true));
  
  // Calculate average cost per region
  const regionMap = new Map<string, { total: number; count: number }>();
  
  for (const entry of data) {
    const region = entry.region;
    const cost = Number(entry.baseCost);
    
    if (!regionMap.has(region)) {
      regionMap.set(region, { total: 0, count: 0 });
    }
    
    const current = regionMap.get(region)!;
    regionMap.set(region, {
      total: current.total + cost,
      count: current.count + 1
    });
  }
  
  // Convert to array and calculate average cost per region
  const regionCosts = Array.from(regionMap.entries()).map(([region, data]) => ({
    region,
    avgCost: data.total / data.count
  }));
  
  // Sort by cost for most/least expensive
  const mostExpensiveRegions = [...regionCosts].sort((a, b) => b.avgCost - a.avgCost).slice(0, 5);
  const leastExpensiveRegions = [...regionCosts].sort((a, b) => a.avgCost - b.avgCost).slice(0, 5);
  
  // Calculate growth rate by region (comparing current year to previous year)
  const regionYearMap = new Map<string, Map<number, { total: number; count: number }>>();
  
  for (const entry of data) {
    const region = entry.region;
    const year = entry.matrixYear;
    const cost = Number(entry.baseCost);
    
    if (!regionYearMap.has(region)) {
      regionYearMap.set(region, new Map());
    }
    
    const yearMap = regionYearMap.get(region)!;
    
    if (!yearMap.has(year)) {
      yearMap.set(year, { total: 0, count: 0 });
    }
    
    const current = yearMap.get(year)!;
    yearMap.set(year, {
      total: current.total + cost,
      count: current.count + 1
    });
  }
  
  // Calculate growth rate for each region
  const costGrowthByRegion = Array.from(regionYearMap.entries())
    .map(([region, yearMap]) => {
      const currentYearData = yearMap.get(currentYear);
      const previousYearData = yearMap.get(previousYear);
      
      if (!currentYearData || !previousYearData) {
        return { region, growthRate: 0 };
      }
      
      const currentCost = currentYearData.total / currentYearData.count;
      const previousCost = previousYearData.total / previousYearData.count;
      
      const growthRate = ((currentCost - previousCost) / previousCost) * 100;
      
      return { region, growthRate };
    })
    .sort((a, b) => b.growthRate - a.growthRate);
  
  // Calculate building type distribution
  const buildingTypeMap = new Map<string, number>();
  
  for (const entry of data) {
    const type = entry.buildingType;
    
    if (!buildingTypeMap.has(type)) {
      buildingTypeMap.set(type, 0);
    }
    
    buildingTypeMap.set(type, buildingTypeMap.get(type)! + 1);
  }
  
  const buildingTypeDistribution = Array.from(buildingTypeMap.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
  
  return {
    mostExpensiveRegions,
    leastExpensiveRegions,
    costGrowthByRegion,
    buildingTypeDistribution,
    totalDataPoints: data.length
  };
}

/**
 * Compare material costs across regions
 */
export async function compareMaterialCostsAcrossRegions(
  regions: string[],
  buildingType: string
): Promise<{
  regions: Array<{
    name: string;
    materials: Array<{
      name: string;
      cost: number;
      percentage: number;
    }>;
  }>;
}> {
  const result = {
    regions: [] as Array<{
      name: string;
      materials: Array<{
        name: string;
        cost: number;
        percentage: number;
      }>;
    }>
  };
  
  // Material breakdown percentages by building type
  // In a real app, these would come from the database
  const materialBreakdowns: Record<string, Record<string, number>> = {
    RESIDENTIAL: {
      'Structure': 25,
      'Foundation': 10,
      'Electrical': 10,
      'Plumbing': 15,
      'HVAC': 8,
      'Interior Finishes': 15,
      'Exterior Finishes': 7,
      'Roofing': 5,
      'Site Work': 5
    },
    COMMERCIAL: {
      'Structure': 30,
      'Foundation': 12,
      'Electrical': 15,
      'Plumbing': 10,
      'HVAC': 12,
      'Interior Finishes': 8,
      'Exterior Finishes': 5,
      'Roofing': 3,
      'Site Work': 5
    },
    INDUSTRIAL: {
      'Structure': 35,
      'Foundation': 15,
      'Electrical': 20,
      'Plumbing': 8,
      'HVAC': 10,
      'Interior Finishes': 5,
      'Exterior Finishes': 2,
      'Roofing': 3,
      'Site Work': 2
    },
    DEFAULT: {
      'Structure': 30,
      'Foundation': 12,
      'Electrical': 12,
      'Plumbing': 12,
      'HVAC': 10,
      'Interior Finishes': 10,
      'Exterior Finishes': 5,
      'Roofing': 4,
      'Site Work': 5
    }
  };
  
  // Process each region
  for (const region of regions) {
    // Query cost matrix data for this region and building type
    const data = await db.select()
      .from(costMatrix)
      .where(and(
        eq(costMatrix.region, region),
        eq(costMatrix.buildingType, buildingType),
        eq(costMatrix.isActive, true)
      ));
    
    if (data.length === 0) continue;
    
    // Calculate average base cost for this region and building type
    const avgBaseCost = data.reduce((sum, entry) => sum + Number(entry.baseCost), 0) / data.length;
    
    // Get material breakdown for this building type
    const breakdown = materialBreakdowns[buildingType] || materialBreakdowns.DEFAULT;
    
    // Calculate material costs
    const materials = Object.entries(breakdown).map(([name, percentage]) => {
      const cost = (avgBaseCost * percentage) / 100;
      return { name, cost, percentage };
    });
    
    // Add region data to result
    result.regions.push({
      name: region,
      materials
    });
  }
  
  return result;
}
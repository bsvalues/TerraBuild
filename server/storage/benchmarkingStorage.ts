/**
 * Benchmarking Storage Interface for Building Cost Building System
 * 
 * This module provides database interactions for benchmarking features
 * such as cross-region and cross-county cost comparisons.
 */
import { db } from "../db";
import { CostMatrix, costMatrix } from "@shared/schema";
import { eq, and, isNull, isNotNull } from "drizzle-orm";

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
  let query = db.select().from(costMatrix).where(eq(costMatrix.isActive, true));
  
  // Apply each filter
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && key in costMatrix) {
      query = query.where(eq(costMatrix[key as keyof typeof costMatrix] as any, value));
    }
  }
  
  return query;
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
/**
 * Benchmarking Routes for Building Cost Building System
 * 
 * This module contains routes for benchmarking features such as
 * cross-region and cross-county cost comparisons.
 */
import { Response } from 'express';
import { Request } from '../types';
import * as benchmarkingStorage from '../storage/benchmarkingStorage';

/**
 * Register benchmarking routes
 */
export function registerBenchmarkingRoutes(app: any) {
  // Middleware to require authentication
  const requireAuth = (req: Request, res: Response, next: Function) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    next();
  };

  // Get all counties
  app.get("/api/benchmarking/counties", async (req: Request, res: Response) => {
    try {
      const counties = await benchmarkingStorage.getAllCounties();
      res.json(counties);
    } catch (error) {
      console.error("Error fetching counties:", error);
      res.status(500).json({ error: "Failed to fetch counties" });
    }
  });

  // Get all states
  app.get("/api/benchmarking/states", async (req: Request, res: Response) => {
    try {
      const states = await benchmarkingStorage.getAllStates();
      res.json(states);
    } catch (error) {
      console.error("Error fetching states:", error);
      res.status(500).json({ error: "Failed to fetch states" });
    }
  });

  // Get cost matrix by county
  app.get("/api/benchmarking/counties/:county", requireAuth, async (req: Request, res: Response) => {
    try {
      const { county } = req.params;
      const costMatrix = await benchmarkingStorage.getCostMatrixByCounty(county);
      res.json(costMatrix);
    } catch (error) {
      console.error(`Error fetching cost matrix for county ${req.params.county}:`, error);
      res.status(500).json({ error: `Failed to fetch cost matrix for county ${req.params.county}` });
    }
  });

  // Get cost matrix by state
  app.get("/api/benchmarking/states/:state", requireAuth, async (req: Request, res: Response) => {
    try {
      const { state } = req.params;
      const costMatrix = await benchmarkingStorage.getCostMatrixByState(state);
      res.json(costMatrix);
    } catch (error) {
      console.error(`Error fetching cost matrix for state ${req.params.state}:`, error);
      res.status(500).json({ error: `Failed to fetch cost matrix for state ${req.params.state}` });
    }
  });

  // Get building types by county
  app.get("/api/benchmarking/counties/:county/building-types", async (req: Request, res: Response) => {
    try {
      const { county } = req.params;
      const buildingTypes = await benchmarkingStorage.getBuildingTypesByCounty(county);
      res.json(buildingTypes);
    } catch (error) {
      console.error(`Error fetching building types for county ${req.params.county}:`, error);
      res.status(500).json({ error: `Failed to fetch building types for county ${req.params.county}` });
    }
  });

  // Get building types by state
  app.get("/api/benchmarking/states/:state/building-types", async (req: Request, res: Response) => {
    try {
      const { state } = req.params;
      const buildingTypes = await benchmarkingStorage.getBuildingTypesByState(state);
      res.json(buildingTypes);
    } catch (error) {
      console.error(`Error fetching building types for state ${req.params.state}:`, error);
      res.status(500).json({ error: `Failed to fetch building types for state ${req.params.state}` });
    }
  });

  // Get county stats (min, max, avg costs)
  app.get("/api/benchmarking/counties/:county/stats", requireAuth, async (req: Request, res: Response) => {
    try {
      const { county } = req.params;
      const stats = await benchmarkingStorage.getCountyStats(county);
      res.json(stats);
    } catch (error) {
      console.error(`Error fetching stats for county ${req.params.county}:`, error);
      res.status(500).json({ error: `Failed to fetch stats for county ${req.params.county}` });
    }
  });

  // Get cost matrix by filters (advanced query)
  app.post("/api/benchmarking/query", requireAuth, async (req: Request, res: Response) => {
    try {
      const filters = req.body;
      if (!filters || typeof filters !== 'object') {
        return res.status(400).json({ error: "Invalid filters format" });
      }
      
      const costMatrix = await benchmarkingStorage.getCostMatrixByFilters(filters);
      res.json(costMatrix);
    } catch (error) {
      console.error("Error querying cost matrix with filters:", error);
      res.status(500).json({ error: "Failed to query cost matrix with filters" });
    }
  });

  // ----- Enhanced Benchmarking API Routes -----

  // Compare costs across multiple counties
  app.post("/api/benchmarking/counties/compare", requireAuth, async (req: Request, res: Response) => {
    try {
      const { counties, buildingType } = req.body;

      if (!counties || !Array.isArray(counties) || counties.length === 0) {
        return res.status(400).json({ error: "Counties array is required" });
      }

      const comparisonData = await benchmarkingStorage.compareCounties(counties, buildingType);
      res.json(comparisonData);
    } catch (error) {
      console.error("Error comparing counties:", error);
      res.status(500).json({ error: "Failed to compare counties" });
    }
  });

  // Compare costs across multiple states
  app.post("/api/benchmarking/states/compare", requireAuth, async (req: Request, res: Response) => {
    try {
      const { states, buildingType } = req.body;

      if (!states || !Array.isArray(states) || states.length === 0) {
        return res.status(400).json({ error: "States array is required" });
      }

      const comparisonData = await benchmarkingStorage.compareStates(states, buildingType);
      res.json(comparisonData);
    } catch (error) {
      console.error("Error comparing states:", error);
      res.status(500).json({ error: "Failed to compare states" });
    }
  });

  // Get cost trends over time for a region
  app.post("/api/benchmarking/trends/region", requireAuth, async (req: Request, res: Response) => {
    try {
      const { region, buildingType, years } = req.body;

      if (!region || !buildingType) {
        return res.status(400).json({ error: "Region and buildingType are required" });
      }

      // Default to 5 years if not specified
      const numYears = years ? parseInt(years) : 5;

      const trendsData = await benchmarkingStorage.getRegionCostTrends(region, buildingType, numYears);
      res.json(trendsData);
    } catch (error) {
      console.error("Error fetching region cost trends:", error);
      res.status(500).json({ error: "Failed to fetch region cost trends" });
    }
  });

  // Get cost trends over time across counties
  app.post("/api/benchmarking/trends/counties", requireAuth, async (req: Request, res: Response) => {
    try {
      const { counties, buildingType, years } = req.body;

      if (!counties || !Array.isArray(counties) || counties.length === 0 || !buildingType) {
        return res.status(400).json({ error: "Counties array and buildingType are required" });
      }

      // Default to 5 years if not specified
      const numYears = years ? parseInt(years) : 5;

      const trendsData = await benchmarkingStorage.getCountyCostTrends(counties, buildingType, numYears);
      res.json(trendsData);
    } catch (error) {
      console.error("Error fetching county cost trends:", error);
      res.status(500).json({ error: "Failed to fetch county cost trends" });
    }
  });

  // Get comprehensive regional stats report
  app.get("/api/benchmarking/report/regional-stats", requireAuth, async (req: Request, res: Response) => {
    try {
      const reportData = await benchmarkingStorage.getRegionalStatsReport();
      res.json(reportData);
    } catch (error) {
      console.error("Error generating regional stats report:", error);
      res.status(500).json({ error: "Failed to generate regional stats report" });
    }
  });

  // Compare material costs across regions
  app.post("/api/benchmarking/materials/compare", requireAuth, async (req: Request, res: Response) => {
    try {
      const { regions, buildingType } = req.body;

      if (!regions || !Array.isArray(regions) || regions.length === 0 || !buildingType) {
        return res.status(400).json({ error: "Regions array and buildingType are required" });
      }

      const materialsComparisonData = await benchmarkingStorage.compareMaterialCostsAcrossRegions(regions, buildingType);
      res.json(materialsComparisonData);
    } catch (error) {
      console.error("Error comparing material costs across regions:", error);
      res.status(500).json({ error: "Failed to compare material costs across regions" });
    }
  });
}
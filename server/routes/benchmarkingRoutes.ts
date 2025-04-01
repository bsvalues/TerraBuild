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
}
/**
 * External API Integration Routes for Building Cost Building System
 * 
 * This module contains routes for integrating with external construction materials 
 * pricing APIs and other external data sources.
 */
import { Request, Response } from "express";
import { storage } from "../storage";
import { insertMaterialsPriceCacheSchema } from "@shared/schema";
import { z } from "zod";
import fetch from "node-fetch";

// Mock function to simulate external API call (to be replaced with actual API integration)
async function fetchMaterialPrice(materialCode: string, region: string, source: string) {
  // In a real implementation, we would call an actual external API here
  
  // Check if API key exists for the selected source
  const apiKeyName = `${source.toUpperCase()}_API_KEY`;
  const apiKey = process.env[apiKeyName];
  
  if (!apiKey) {
    throw new Error(`No API key found for ${source}. Please set the ${apiKeyName} environment variable.`);
  }
  
  // For demonstration purposes, simulate API return data
  // This would be replaced with actual API call
  return {
    materialCode,
    region,
    price: Math.random() * 100 + 50, // Random price between 50 and 150
    unit: "sq.ft.",
    validForDays: 30,
    metadata: {
      provider: source,
      timestamp: new Date().toISOString(),
      currency: "USD"
    }
  };
}

/**
 * Register external API integration routes
 */
export function registerExternalApiRoutes(app: any) {
  // Middleware to ensure user is authenticated
  const requireAuth = (req: Request, res: Response, next: Function) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized: You must be logged in" });
    }
    next();
  };

  // Get material price from cache or external API
  app.get("/api/materials/price/:materialCode/:region", requireAuth, async (req: Request, res: Response) => {
    try {
      const { materialCode, region } = req.params;
      const { source = "default" } = req.query;
      
      // Check if we have a valid cached price
      const cachedPrice = await storage.getMaterialPrice(materialCode, region, source.toString());
      
      // If valid cache exists and hasn't expired, return it
      if (cachedPrice && new Date(cachedPrice.validUntil) > new Date()) {
        return res.json({
          ...cachedPrice,
          source: "cache"
        });
      }
      
      // Otherwise, fetch from external API
      try {
        const apiResult = await fetchMaterialPrice(materialCode, region, source.toString());
        
        // Calculate expiration date
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + (apiResult.validForDays || 30));
        
        // Save to cache
        const cacheData = {
          materialCode,
          source: source.toString(),
          region,
          price: apiResult.price.toString(), // Convert to string for decimal storage
          unit: apiResult.unit,
          validUntil,
          metadata: apiResult.metadata
        };
        
        const validatedData = insertMaterialsPriceCacheSchema.parse(cacheData);
        const savedCache = await storage.saveMaterialPrice(validatedData);
        
        // Return the fetched price
        res.json({
          ...savedCache,
          source: "api"
        });
      } catch (apiError: any) {
        // If API call fails but we have an expired cache, return it with a warning
        if (cachedPrice) {
          return res.json({
            ...cachedPrice,
            source: "expired_cache",
            warning: "Data is expired and could not refresh from API: " + apiError.message
          });
        }
        
        throw apiError;
      }
    } catch (error: any) {
      res.status(500).json({ message: `Error fetching material price: ${error.message}` });
    }
  });
  
  // Get all available material prices for a region
  app.get("/api/materials/prices/region/:region", requireAuth, async (req: Request, res: Response) => {
    try {
      const { region } = req.params;
      const { source } = req.query;
      
      // Get all cached prices for the region
      const prices = await storage.getMaterialPricesByRegion(
        region, 
        source ? source.toString() : undefined
      );
      
      res.json(prices);
    } catch (error: any) {
      res.status(500).json({ message: `Error fetching regional material prices: ${error.message}` });
    }
  });
  
  // Get all available material prices for a specific material
  app.get("/api/materials/prices/material/:materialCode", requireAuth, async (req: Request, res: Response) => {
    try {
      const { materialCode } = req.params;
      const { source } = req.query;
      
      // Get all cached prices for the material
      const prices = await storage.getMaterialPricesByCode(
        materialCode, 
        source ? source.toString() : undefined
      );
      
      res.json(prices);
    } catch (error: any) {
      res.status(500).json({ message: `Error fetching material prices: ${error.message}` });
    }
  });
  
  // Force refresh material price from external API
  app.post("/api/materials/price/:materialCode/:region/refresh", requireAuth, async (req: Request, res: Response) => {
    try {
      const { materialCode, region } = req.params;
      const { source = "default" } = req.body;
      
      // Fetch latest price from API regardless of cache
      const apiResult = await fetchMaterialPrice(materialCode, region, source);
      
      // Calculate expiration date
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + (apiResult.validForDays || 30));
      
      // Save to cache
      const cacheData = {
        materialCode,
        source,
        region,
        price: apiResult.price.toString(), // Convert to string for decimal storage
        unit: apiResult.unit,
        validUntil,
        metadata: apiResult.metadata
      };
      
      const validatedData = insertMaterialsPriceCacheSchema.parse(cacheData);
      const savedCache = await storage.saveMaterialPrice(validatedData);
      
      // Return the fetched price
      res.json({
        ...savedCache,
        source: "api"
      });
    } catch (error: any) {
      res.status(500).json({ message: `Error refreshing material price: ${error.message}` });
    }
  });
  
  // Clear price cache for a specific material
  app.delete("/api/materials/price/:materialCode/:region", requireAuth, async (req: Request, res: Response) => {
    try {
      const { materialCode, region } = req.params;
      const { source = "default" } = req.query;
      
      // Delete the cached price
      await storage.deleteMaterialPrice(materialCode, region, source.toString());
      
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: `Error clearing material price cache: ${error.message}` });
    }
  });
  
  // Get available API integrations/sources
  app.get("/api/materials/sources", requireAuth, async (req: Request, res: Response) => {
    try {
      // Determine available API sources based on environment variables
      const availableSources = [
        // Check common construction material APIs
        process.env.RSM_API_KEY ? { id: "rsm", name: "RSMeans Construction Cost Database", status: "connected" } : null,
        process.env.COMPASS_API_KEY ? { id: "compass", name: "Compass International", status: "connected" } : null,
        process.env.BUILDING_JOURNAL_API_KEY ? { id: "building-journal", name: "Building Journal", status: "connected" } : null,
        process.env.CONSTRUCTION_MARKET_DATA_API_KEY ? { id: "cmd", name: "Construction Market Data", status: "connected" } : null,
        // Always include default source for demonstration
        { id: "default", name: "Default Pricing Database", status: "connected" }
      ].filter(Boolean);
      
      res.json(availableSources);
    } catch (error: any) {
      res.status(500).json({ message: `Error fetching available API sources: ${error.message}` });
    }
  });
}
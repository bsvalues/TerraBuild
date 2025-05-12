/**
 * Cost Factor Loader Service
 * 
 * This service loads cost factors from JSON data files or the database
 * based on configuration in terra.json. It supports caching and periodic refreshing.
 */

import fs from 'fs';
import path from 'path';
import { db } from '../../db';
import { settings } from '../../../shared/schema';
import { eq, and } from 'drizzle-orm';

export interface CostFactors {
  version: string;
  source: string;
  year: number;
  lastUpdated: string;
  regionFactors: Record<string, number>;
  qualityFactors: Record<string, number>;
  conditionFactors: Record<string, number>;
  baseRates: Record<string, number>;
  complexityFactors: {
    STORIES: Record<string, number>;
    FOUNDATION: Record<string, number>;
    ROOF: Record<string, number>;
    HVAC: Record<string, number>;
  };
  agingFactors: Record<string, number>;
}

interface CostFactorCache {
  data: CostFactors | null;
  lastLoaded: number;
}

export class CostFactorLoader {
  private configPath: string;
  private cache: CostFactorCache = { data: null, lastLoaded: 0 };
  private refreshInterval: number;
  private useCache: boolean;
  
  constructor(configPath: string = './terra.json') {
    this.configPath = configPath;
    
    // Default values
    this.refreshInterval = 3600000; // 1 hour in ms
    this.useCache = true;
    
    // Load configuration from terra.json
    this.loadConfig();
  }
  
  private loadConfig(): void {
    try {
      const configData = fs.readFileSync(this.configPath, 'utf8');
      const config = JSON.parse(configData);
      
      if (config.plugins && config.plugins.CostFactorTables) {
        this.useCache = config.plugins.CostFactorTables.cache !== false;
        
        if (config.plugins.CostFactorTables.refreshInterval) {
          this.refreshInterval = config.plugins.CostFactorTables.refreshInterval;
        }
      }
    } catch (error) {
      console.error('Error loading CostFactorTables configuration:', error);
    }
  }
  
  /**
   * Load cost factors from a JSON file
   */
  async loadFromFile(filePath: string): Promise<CostFactors | null> {
    try {
      // If using cache and data is fresh, return cached data
      if (this.useCache && this.cache.data && 
          Date.now() - this.cache.lastLoaded < this.refreshInterval) {
        return this.cache.data;
      }
      
      const resolvedPath = path.resolve(filePath);
      const fileData = fs.readFileSync(resolvedPath, 'utf8');
      const costFactors: CostFactors = JSON.parse(fileData);
      
      // Update cache
      this.cache = {
        data: costFactors,
        lastLoaded: Date.now()
      };
      
      return costFactors;
    } catch (error) {
      console.error(`Error loading cost factors from file ${filePath}:`, error);
      return null;
    }
  }
  
  /**
   * Load cost factors from database settings
   */
  async loadFromDatabase(category: string = 'costFactors'): Promise<CostFactors | null> {
    try {
      // If using cache and data is fresh, return cached data
      if (this.useCache && this.cache.data && 
          Date.now() - this.cache.lastLoaded < this.refreshInterval) {
        return this.cache.data;
      }
      
      // Query the settings table for cost factors
      const costFactorSettings = await db.query.settings.findFirst({
        where: and(
          eq(settings.category, category),
          eq(settings.key, 'costFactorsData')
        )
      });
      
      if (!costFactorSettings || !costFactorSettings.value) {
        return null;
      }
      
      const costFactors = costFactorSettings.value as unknown as CostFactors;
      
      // Update cache
      this.cache = {
        data: costFactors,
        lastLoaded: Date.now()
      };
      
      return costFactors;
    } catch (error) {
      console.error('Error loading cost factors from database:', error);
      return null;
    }
  }
  
  /**
   * Save cost factors to database
   */
  async saveToDatabase(costFactors: CostFactors, category: string = 'costFactors'): Promise<boolean> {
    try {
      // Check if setting already exists
      const existingSetting = await db.query.settings.findFirst({
        where: and(
          eq(settings.category, category),
          eq(settings.key, 'costFactorsData')
        )
      });
      
      if (existingSetting) {
        // Update existing setting
        await db.update(settings)
          .set({ 
            value: costFactors as any,
            updatedAt: new Date()
          })
          .where(eq(settings.id, existingSetting.id));
      } else {
        // Insert new setting
        await db.insert(settings).values({
          category,
          key: 'costFactorsData',
          value: costFactors as any,
          isPublic: true,
          description: 'Cost factors data for building cost calculations',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      // Update cache
      this.cache = {
        data: costFactors,
        lastLoaded: Date.now()
      };
      
      return true;
    } catch (error) {
      console.error('Error saving cost factors to database:', error);
      return false;
    }
  }
  
  /**
   * Load cost factors based on terra.json configuration
   */
  async load(): Promise<CostFactors | null> {
    try {
      const configData = fs.readFileSync(this.configPath, 'utf8');
      const config = JSON.parse(configData);
      
      if (config.plugins && 
          config.plugins.CostFactorTables && 
          config.plugins.CostFactorTables.enabled) {
        
        const source = config.plugins.CostFactorTables.source;
        
        if (source && source.endsWith('.json')) {
          return await this.loadFromFile(source);
        } else {
          return await this.loadFromDatabase();
        }
      }
      
      console.warn('CostFactorTables plugin is not enabled in terra.json');
      return null;
    } catch (error) {
      console.error('Error loading cost factors:', error);
      return null;
    }
  }
  
  /**
   * Get the configured source of cost factors
   */
  getConfiguredSource(): string | null {
    try {
      const configData = fs.readFileSync(this.configPath, 'utf8');
      const config = JSON.parse(configData);
      
      if (config.plugins && 
          config.plugins.CostFactorTables && 
          config.plugins.CostFactorTables.enabled) {
        
        return config.plugins.CostFactorTables.source || null;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting configured source:', error);
      return null;
    }
  }
  
  /**
   * Clear the cost factors cache
   */
  clearCache(): void {
    this.cache = { data: null, lastLoaded: 0 };
  }
}

// Singleton instance
export const costFactorLoader = new CostFactorLoader();

export default costFactorLoader;
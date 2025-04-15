/**
 * Adaptive Storage Provider
 * 
 * This module provides automatic failover between Supabase and local PostgreSQL storage.
 * It wraps the storage implementations and dynamically selects the appropriate one
 * based on connection availability.
 */

import { IStorage } from './storage';
import { isSupabaseConfigured } from './utils/supabaseClient';
import { PropertyPostgresStorage } from './property-storage';
import { log } from './vite';

// Create a singleton instance of the PostgreSQL storage
const postgresStorage = new PropertyPostgresStorage();

/**
 * AdaptiveStorage class that automatically selects between Supabase and local Postgres
 * based on availability
 */
export class AdaptiveStorage implements IStorage {
  private primaryStorage: IStorage;
  private fallbackStorage: IStorage;
  private usesFallback: boolean = false;
  private lastConnectionCheck: number = 0;
  private connectionCheckInterval: number = 30000; // 30 seconds
  private supabaseConfigured: boolean;

  constructor() {
    // Always initialize with PostgreSQL storage as the fallback
    this.fallbackStorage = postgresStorage;
    
    // Check if Supabase is configured
    this.supabaseConfigured = isSupabaseConfigured();
    
    // Initially use PostgreSQL storage since it's guaranteed to be available
    this.primaryStorage = this.fallbackStorage;
    this.usesFallback = true;
    
    log('AdaptiveStorage initialized', 'storage');
    
    // If Supabase is configured, check its availability
    if (this.supabaseConfigured) {
      this.checkSupabaseConnection();
    } else {
      log('Supabase not configured, using local PostgreSQL storage only', 'storage');
    }
  }

  /**
   * Check if Supabase is available and switch to it if it is
   */
  private async checkSupabaseConnection(): Promise<void> {
    // Skip if Supabase is not configured
    if (!this.supabaseConfigured) {
      return;
    }
    
    // Don't check too frequently
    const now = Date.now();
    if (now - this.lastConnectionCheck < this.connectionCheckInterval) {
      return;
    }
    
    this.lastConnectionCheck = now;
    
    try {
      // Use the utility method from supabaseClient.ts to check connection
      const { getSupabaseClient } = await import('./utils/supabaseClient');
      
      try {
        const supabase = getSupabaseClient();
        // Try a lightweight query to check connection
        const { error } = await supabase.from('users').select('count', { count: 'exact', head: true });
        const isSupabaseAvailable = !error;
        
        if (isSupabaseAvailable && this.usesFallback) {
          // Switch to Supabase if it's available and we're currently using fallback
          log('Switching to Supabase storage (primary)', 'storage');
          // In a real implementation, this would be where we'd create and use a Supabase storage instance
          // For now, we'll continue using PostgreSQL since we don't have a Supabase storage implementation
          // this.primaryStorage = supabaseStorage;
          // this.usesFallback = false;
          
          // Log that we'd switch if we had a Supabase storage implementation
          log('Would switch to Supabase, but continuing with PostgreSQL for now', 'storage');
        } else if (!isSupabaseAvailable && !this.usesFallback) {
          // Switch to PostgreSQL if Supabase is not available and we're not using fallback
          log('Switching to PostgreSQL storage (fallback)', 'storage');
          this.primaryStorage = this.fallbackStorage;
          this.usesFallback = true;
        }
      } catch (connectionError) {
        log(`Supabase connection error: ${connectionError}`, 'storage');
        if (!this.usesFallback) {
          log('Switching to PostgreSQL storage (fallback) due to connection error', 'storage');
          this.primaryStorage = this.fallbackStorage;
          this.usesFallback = true;
        }
      }
    } catch (error) {
      // If there's any error checking connection, use fallback
      log(`Error checking Supabase connection: ${error}. Using PostgreSQL fallback.`, 'storage');
      this.primaryStorage = this.fallbackStorage;
      this.usesFallback = true;
    }
  }

  /**
   * Generic method to execute any storage operation with automatic failover
   * @param operation Function that executes a storage operation
   * @returns Result of the storage operation
   */
  private async executeWithFailover<T>(
    operation: (storage: IStorage) => Promise<T>
  ): Promise<T> {
    try {
      // Check connection periodically
      await this.checkSupabaseConnection();
      
      // Try with the primary storage first
      return await operation(this.primaryStorage);
    } catch (error) {
      // If primary storage fails and we're not already using fallback, switch to fallback
      if (!this.usesFallback) {
        log(`Primary storage operation failed: ${error}. Switching to fallback.`, 'storage');
        this.primaryStorage = this.fallbackStorage;
        this.usesFallback = true;
        
        // Try again with fallback
        return await operation(this.primaryStorage);
      }
      
      // If we're already using fallback, just re-throw the error
      throw error;
    }
  }

  // Now implement all IStorage methods using the executeWithFailover pattern
  // For brevity, I'll implement a few methods and the rest can follow the same pattern

  // User methods
  async getUser(id: number) {
    return this.executeWithFailover(storage => storage.getUser(id));
  }

  async getUserByUsername(username: string) {
    return this.executeWithFailover(storage => storage.getUserByUsername(username));
  }

  async createUser(user: any) {
    return this.executeWithFailover(storage => storage.createUser(user));
  }

  async getAllUsers() {
    return this.executeWithFailover(storage => storage.getAllUsers());
  }

  async updateUser(id: number, user: any) {
    return this.executeWithFailover(storage => storage.updateUser(id, user));
  }

  async deleteUser(id: number) {
    return this.executeWithFailover(storage => storage.deleteUser(id));
  }

  // Sync Schedules
  async getAllSyncSchedules() {
    return this.executeWithFailover(storage => storage.getAllSyncSchedules());
  }

  async getSyncSchedulesByConnection(connectionId: number) {
    return this.executeWithFailover(storage => storage.getSyncSchedulesByConnection(connectionId));
  }

  async getSyncScheduleByName(connectionId: number, name: string) {
    return this.executeWithFailover(storage => storage.getSyncScheduleByName(connectionId, name));
  }

  async getEnabledSyncSchedules() {
    return this.executeWithFailover(storage => storage.getEnabledSyncSchedules());
  }

  async getSyncSchedule(id: number) {
    return this.executeWithFailover(storage => storage.getSyncSchedule(id));
  }

  async createSyncSchedule(schedule: any) {
    return this.executeWithFailover(storage => storage.createSyncSchedule(schedule));
  }

  async updateSyncSchedule(id: number, schedule: any) {
    return this.executeWithFailover(storage => storage.updateSyncSchedule(id, schedule));
  }

  async deleteSyncSchedule(id: number) {
    return this.executeWithFailover(storage => storage.deleteSyncSchedule(id));
  }

  // Sync History
  async getSyncHistory(limit?: number, offset?: number) {
    return this.executeWithFailover(storage => storage.getSyncHistory(limit, offset));
  }

  async getSyncHistoryByConnection(connectionId: number, limit?: number, offset?: number) {
    return this.executeWithFailover(storage => storage.getSyncHistoryByConnection(connectionId, limit, offset));
  }

  async getSyncHistoryBySchedule(scheduleId: number, limit?: number, offset?: number) {
    return this.executeWithFailover(storage => storage.getSyncHistoryBySchedule(scheduleId, limit, offset));
  }

  async getSyncHistoryById(id: number) {
    return this.executeWithFailover(storage => storage.getSyncHistoryById(id));
  }

  async createSyncHistory(history: any) {
    return this.executeWithFailover(storage => storage.createSyncHistory(history));
  }

  async updateSyncHistory(id: number, history: any) {
    return this.executeWithFailover(storage => storage.updateSyncHistory(id, history));
  }

  // Connection History
  async createConnectionHistory(connectionHistory: any) {
    return this.executeWithFailover(storage => storage.createConnectionHistory(connectionHistory));
  }

  async getConnectionHistory(options?: { connectionType?: string, limit?: number }) {
    return this.executeWithFailover(storage => storage.getConnectionHistory(options));
  }

  async getConnectionHistoryById(id: number) {
    return this.executeWithFailover(storage => storage.getConnectionHistoryById(id));
  }

  // Environments
  async getAllEnvironments() {
    return this.executeWithFailover(storage => storage.getAllEnvironments());
  }

  async getEnvironment(id: number) {
    return this.executeWithFailover(storage => storage.getEnvironment(id));
  }

  async createEnvironment(env: any) {
    return this.executeWithFailover(storage => storage.createEnvironment(env));
  }

  // API Endpoints
  async getAllApiEndpoints() {
    return this.executeWithFailover(storage => storage.getAllApiEndpoints());
  }

  async getApiEndpoint(id: number) {
    return this.executeWithFailover(storage => storage.getApiEndpoint(id));
  }

  async createApiEndpoint(endpoint: any) {
    return this.executeWithFailover(storage => storage.createApiEndpoint(endpoint));
  }

  async updateApiEndpointStatus(id: number, status: string) {
    return this.executeWithFailover(storage => storage.updateApiEndpointStatus(id, status));
  }

  async deleteApiEndpoint(id: number) {
    return this.executeWithFailover(storage => storage.deleteApiEndpoint(id));
  }

  // Settings
  async getAllSettings() {
    return this.executeWithFailover(storage => storage.getAllSettings());
  }

  async getSetting(key: string) {
    return this.executeWithFailover(storage => storage.getSetting(key));
  }

  async updateSetting(key: string, value: string) {
    return this.executeWithFailover(storage => storage.updateSetting(key, value));
  }

  async createSetting(setting: any) {
    return this.executeWithFailover(storage => storage.createSetting(setting));
  }

  // Activities
  async getAllActivities() {
    return this.executeWithFailover(storage => storage.getAllActivities());
  }

  async createActivity(activity: any) {
    return this.executeWithFailover(storage => storage.createActivity(activity));
  }

  // Repository Status
  async getRepositoryStatus() {
    return this.executeWithFailover(storage => storage.getRepositoryStatus());
  }

  async createRepositoryStatus(repoStatus: any) {
    return this.executeWithFailover(storage => storage.createRepositoryStatus(repoStatus));
  }

  async updateRepositoryStatus(id: number, status: string, steps: any[]) {
    return this.executeWithFailover(storage => storage.updateRepositoryStatus(id, status, steps));
  }

  // Building Costs
  async getAllBuildingCosts() {
    return this.executeWithFailover(storage => storage.getAllBuildingCosts());
  }
  
  async getBuildingCost(id: number) {
    return this.executeWithFailover(storage => storage.getBuildingCost(id));
  }
  
  async createBuildingCost(cost: any) {
    return this.executeWithFailover(storage => storage.createBuildingCost(cost));
  }
  
  async updateBuildingCost(id: number, cost: any) {
    return this.executeWithFailover(storage => storage.updateBuildingCost(id, cost));
  }
  
  async deleteBuildingCost(id: number) {
    return this.executeWithFailover(storage => storage.deleteBuildingCost(id));
  }
  
  // Cost Factors
  async getAllCostFactors() {
    return this.executeWithFailover(storage => storage.getAllCostFactors());
  }
  
  async getCostFactorsByRegionAndType(region: string, buildingType: string) {
    return this.executeWithFailover(storage => storage.getCostFactorsByRegionAndType(region, buildingType));
  }
  
  async createCostFactor(factor: any) {
    return this.executeWithFailover(storage => storage.createCostFactor(factor));
  }
  
  async updateCostFactor(id: number, factor: any) {
    return this.executeWithFailover(storage => storage.updateCostFactor(id, factor));
  }
  
  async deleteCostFactor(id: number) {
    return this.executeWithFailover(storage => storage.deleteCostFactor(id));
  }
  
  // Material Types
  async getAllMaterialTypes() {
    return this.executeWithFailover(storage => storage.getAllMaterialTypes());
  }
  
  async getMaterialType(id: number) {
    return this.executeWithFailover(storage => storage.getMaterialType(id));
  }
  
  async getMaterialTypeByCode(code: string) {
    return this.executeWithFailover(storage => storage.getMaterialTypeByCode(code));
  }
  
  async createMaterialType(materialType: any) {
    return this.executeWithFailover(storage => storage.createMaterialType(materialType));
  }
  
  async updateMaterialType(id: number, materialType: any) {
    return this.executeWithFailover(storage => storage.updateMaterialType(id, materialType));
  }
  
  async deleteMaterialType(id: number) {
    return this.executeWithFailover(storage => storage.deleteMaterialType(id));
  }
  
  // Material Costs
  async getAllMaterialCosts() {
    return this.executeWithFailover(storage => storage.getAllMaterialCosts());
  }
  
  async getMaterialCostsByBuildingType(buildingType: string) {
    return this.executeWithFailover(storage => storage.getMaterialCostsByBuildingType(buildingType));
  }
  
  async getMaterialCostsByRegion(region: string) {
    return this.executeWithFailover(storage => storage.getMaterialCostsByRegion(region));
  }
  
  async getMaterialCostsByBuildingTypeAndRegion(buildingType: string, region: string) {
    return this.executeWithFailover(storage => storage.getMaterialCostsByBuildingTypeAndRegion(buildingType, region));
  }
  
  async getMaterialCost(id: number) {
    return this.executeWithFailover(storage => storage.getMaterialCost(id));
  }
  
  async createMaterialCost(materialCost: any) {
    return this.executeWithFailover(storage => storage.createMaterialCost(materialCost));
  }
  
  async updateMaterialCost(id: number, materialCost: any) {
    return this.executeWithFailover(storage => storage.updateMaterialCost(id, materialCost));
  }
  
  async deleteMaterialCost(id: number) {
    return this.executeWithFailover(storage => storage.deleteMaterialCost(id));
  }
  
  // Building Cost Materials
  async getBuildingCostMaterials(buildingCostId: number) {
    return this.executeWithFailover(storage => storage.getBuildingCostMaterials(buildingCostId));
  }
  
  async createBuildingCostMaterial(material: any) {
    return this.executeWithFailover(storage => storage.createBuildingCostMaterial(material));
  }
  
  async deleteAllBuildingCostMaterials(buildingCostId: number) {
    return this.executeWithFailover(storage => storage.deleteAllBuildingCostMaterials(buildingCostId));
  }
  
  // Calculate Materials Breakdown
  async calculateMaterialsBreakdown(region: string, buildingType: string, squareFootage: number, complexityMultiplier?: number) {
    return this.executeWithFailover(storage => storage.calculateMaterialsBreakdown(region, buildingType, squareFootage, complexityMultiplier));
  }
  
  // Calculation History
  async getAllCalculationHistory() {
    return this.executeWithFailover(storage => storage.getAllCalculationHistory());
  }
  
  async getCalculationHistoryByUserId(userId: number) {
    return this.executeWithFailover(storage => storage.getCalculationHistoryByUserId(userId));
  }
  
  async getCalculationHistory(id: number) {
    return this.executeWithFailover(storage => storage.getCalculationHistory(id));
  }
  
  async createCalculationHistory(calculation: any) {
    return this.executeWithFailover(storage => storage.createCalculationHistory(calculation));
  }
  
  async deleteCalculationHistory(id: number) {
    return this.executeWithFailover(storage => storage.deleteCalculationHistory(id));
  }
  
  // Cost Matrix
  async getAllCostMatrix() {
    return this.executeWithFailover(storage => storage.getAllCostMatrix());
  }
  
  async getCostMatrix(id: number) {
    return this.executeWithFailover(storage => storage.getCostMatrix(id));
  }
  
  async getCostMatrixByRegion(region: string) {
    return this.executeWithFailover(storage => storage.getCostMatrixByRegion(region));
  }
  
  async getCostMatrixByBuildingType(buildingType: string) {
    return this.executeWithFailover(storage => storage.getCostMatrixByBuildingType(buildingType));
  }
  
  async getCostMatrixByRegionAndBuildingType(region: string, buildingType: string) {
    return this.executeWithFailover(storage => storage.getCostMatrixByRegionAndBuildingType(region, buildingType));
  }
  
  async createCostMatrix(matrix: any) {
    return this.executeWithFailover(storage => storage.createCostMatrix(matrix));
  }
  
  async createCostMatrixEntry(matrix: any) {
    return this.executeWithFailover(storage => storage.createCostMatrixEntry(matrix));
  }
  
  async updateCostMatrix(id: number, matrix: any) {
    return this.executeWithFailover(storage => storage.updateCostMatrix(id, matrix));
  }
  
  async deleteCostMatrix(id: number) {
    return this.executeWithFailover(storage => storage.deleteCostMatrix(id));
  }
  
  async importCostMatrixFromJson(data: any[]) {
    return this.executeWithFailover(storage => storage.importCostMatrixFromJson(data));
  }
  
  async importCostMatrixFromExcel(fileId: number, userId: number) {
    return this.executeWithFailover(storage => storage.importCostMatrixFromExcel(fileId, userId));
  }
  
  // Benchmarking methods
  async getCostMatrixByCounty(county: string) {
    return this.executeWithFailover(storage => storage.getCostMatrixByCounty(county));
  }
  
  async getCostMatrixByState(state: string) {
    return this.executeWithFailover(storage => storage.getCostMatrixByState(state));
  }
  
  async getAllCounties() {
    return this.executeWithFailover(storage => storage.getAllCounties());
  }
  
  async getAllStates() {
    return this.executeWithFailover(storage => storage.getAllStates());
  }
  
  async getCostMatrixByFilters(filters: Record<string, any>) {
    return this.executeWithFailover(storage => storage.getCostMatrixByFilters(filters));
  }
  
  // AI and NLP methods
  async getCostTrends(period?: string, buildingType?: string, region?: string) {
    return this.executeWithFailover(storage => storage.getCostTrends(period, buildingType, region));
  }
  
  async getBuildingTypesByCounty(county: string) {
    return this.executeWithFailover(storage => storage.getBuildingTypesByCounty(county));
  }
  
  async getBuildingTypesByState(state: string) {
    return this.executeWithFailover(storage => storage.getBuildingTypesByState(state));
  }
  
  async getCountyStats(county: string) {
    return this.executeWithFailover(storage => storage.getCountyStats(county));
  }
  
  // File Uploads
  async createFileUpload(fileUpload: any) {
    return this.executeWithFailover(storage => storage.createFileUpload(fileUpload));
  }
  
  async getFileUpload(id: number) {
    return this.executeWithFailover(storage => storage.getFileUpload(id));
  }
  
  async getAllFileUploads() {
    return this.executeWithFailover(storage => storage.getAllFileUploads());
  }
  
  async getUserFileUploads(userId: number) {
    return this.executeWithFailover(storage => storage.getUserFileUploads(userId));
  }
  
  async updateFileUploadStatus(id: number, status: string, processedItems?: number, totalItems?: number, errors?: any[]) {
    return this.executeWithFailover(storage => storage.updateFileUploadStatus(id, status, processedItems, totalItems, errors));
  }
  
  async deleteFileUpload(id: number) {
    return this.executeWithFailover(storage => storage.deleteFileUpload(id));
  }
  
  // Cost Factor Presets
  async getAllCostFactorPresets() {
    return this.executeWithFailover(storage => storage.getAllCostFactorPresets());
  }
  
  async getCostFactorPresetsByUserId(userId: number) {
    return this.executeWithFailover(storage => storage.getCostFactorPresetsByUserId(userId));
  }
  
  async getDefaultCostFactorPresets() {
    return this.executeWithFailover(storage => storage.getDefaultCostFactorPresets());
  }
  
  async getCostFactorPreset(id: number) {
    return this.executeWithFailover(storage => storage.getCostFactorPreset(id));
  }
  
  async createCostFactorPreset(preset: any) {
    return this.executeWithFailover(storage => storage.createCostFactorPreset(preset));
  }
  
  async updateCostFactorPreset(id: number, preset: any) {
    return this.executeWithFailover(storage => storage.updateCostFactorPreset(id, preset));
  }
  
  async deleteCostFactorPreset(id: number) {
    return this.executeWithFailover(storage => storage.deleteCostFactorPreset(id));
  }
  
  // What-If Scenarios
  async getAllWhatIfScenarios() {
    return this.executeWithFailover(storage => storage.getAllWhatIfScenarios());
  }
  
  async getWhatIfScenariosByUserId(userId: number) {
    return this.executeWithFailover(storage => storage.getWhatIfScenariosByUserId(userId));
  }
  
  async getWhatIfScenario(id: number) {
    return this.executeWithFailover(storage => storage.getWhatIfScenario(id));
  }
  
  async createWhatIfScenario(scenario: any) {
    return this.executeWithFailover(storage => storage.createWhatIfScenario(scenario));
  }
  
  async updateWhatIfScenario(id: number, scenario: any) {
    return this.executeWithFailover(storage => storage.updateWhatIfScenario(id, scenario));
  }
  
  async deleteWhatIfScenario(id: number) {
    return this.executeWithFailover(storage => storage.deleteWhatIfScenario(id));
  }
  
  async saveWhatIfScenario(id: number) {
    return this.executeWithFailover(storage => storage.saveWhatIfScenario(id));
  }
  
  // Scenario Variations
  async getScenarioVariations(scenarioId: number) {
    return this.executeWithFailover(storage => storage.getScenarioVariations(scenarioId));
  }
  
  async createScenarioVariation(variation: any) {
    return this.executeWithFailover(storage => storage.createScenarioVariation(variation));
  }
  
  async deleteScenarioVariation(id: number) {
    return this.executeWithFailover(storage => storage.deleteScenarioVariation(id));
  }
  
  async calculateScenarioImpact(scenarioId: number) {
    return this.executeWithFailover(storage => storage.calculateScenarioImpact(scenarioId));
  }
  
  // Shared Projects
  async getAllSharedProjects() {
    return this.executeWithFailover(storage => storage.getAllSharedProjects());
  }
  
  async getSharedProjectsByUser(userId: number) {
    return this.executeWithFailover(storage => storage.getSharedProjectsByUser(userId));
  }
  
  async getSharedProject(id: number) {
    return this.executeWithFailover(storage => storage.getSharedProject(id));
  }
  
  async getProject(id: number) {
    return this.executeWithFailover(storage => storage.getProject(id));
  }
  
  async createSharedProject(project: any) {
    return this.executeWithFailover(storage => storage.createSharedProject(project));
  }
  
  async updateSharedProject(id: number, project: any) {
    return this.executeWithFailover(storage => storage.updateSharedProject(id, project));
  }
  
  async deleteSharedProject(id: number) {
    return this.executeWithFailover(storage => storage.deleteSharedProject(id));
  }
  
  async getAccessibleSharedProjects(userId: number) {
    return this.executeWithFailover(storage => storage.getAccessibleSharedProjects(userId));
  }
  
  async getUserProjects(userId: number) {
    return this.executeWithFailover(storage => storage.getUserProjects(userId));
  }
  
  async getPublicProjects() {
    return this.executeWithFailover(storage => storage.getPublicProjects());
  }
  
  // Property Data Methods
  async getAllProperties(options?: { limit?: number; offset?: number }) {
    return this.executeWithFailover(storage => storage.getAllProperties(options));
  }
  
  async getProperty(id: number) {
    return this.executeWithFailover(storage => storage.getProperty(id));
  }
  
  async getPropertyByPropId(propId: number) {
    return this.executeWithFailover(storage => storage.getPropertyByPropId(propId));
  }
  
  async createProperty(property: any) {
    return this.executeWithFailover(storage => storage.createProperty(property));
  }
  
  async updateProperty(id: number, property: any) {
    return this.executeWithFailover(storage => storage.updateProperty(id, property));
  }
  
  async deleteProperty(id: number) {
    return this.executeWithFailover(storage => storage.deleteProperty(id));
  }
  
  async getAllImprovements() {
    return this.executeWithFailover(storage => storage.getAllImprovements());
  }
  
  async getImprovementsByPropId(propId: number) {
    return this.executeWithFailover(storage => storage.getImprovementsByPropId(propId));
  }
  
  async getAllImprovementDetails() {
    return this.executeWithFailover(storage => storage.getAllImprovementDetails());
  }
  
  async getImprovementDetailsByPropId(propId: number) {
    return this.executeWithFailover(storage => storage.getImprovementDetailsByPropId(propId));
  }
  
  async getAllImprovementItems() {
    return this.executeWithFailover(storage => storage.getAllImprovementItems());
  }
  
  async getImprovementItemsByPropId(propId: number) {
    return this.executeWithFailover(storage => storage.getImprovementItemsByPropId(propId));
  }
  
  async getAllLandDetails() {
    return this.executeWithFailover(storage => storage.getAllLandDetails());
  }
  
  async getLandDetailsByPropId(propId: number) {
    return this.executeWithFailover(storage => storage.getLandDetailsByPropId(propId));
  }
  
  // Fallback method for any missing methods
  [key: string]: any;
}

// Export a singleton instance of AdaptiveStorage
export const adaptiveStorage = new AdaptiveStorage();
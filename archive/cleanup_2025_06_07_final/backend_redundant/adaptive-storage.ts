/**
 * Adaptive Storage for Benton County Building Cost System
 * 
 * This module provides an adaptive storage solution that automatically switches
 * between Supabase (cloud) and PostgreSQL (local) storage based on availability.
 */

import { SupabaseStorage } from './supabase-storage';
import { PostgresStorage } from './pg-storage';
import { IStorage } from './storage';

import { createClient } from '@supabase/supabase-js';

type StorageProvider = 'supabase' | 'postgres';

// Connection status interface
export interface ConnectionStatus {
  supabase: {
    available: boolean;
    lastChecked: Date | null;
  };
  postgres: {
    available: boolean;
    lastChecked: Date | null;
  };
  activeProvider: StorageProvider;
}

/**
 * Adaptive Storage implementation that handles failover between providers
 */
export class AdaptiveStorage implements IStorage {
  private supabaseStorage: SupabaseStorage | null;
  private postgresStorage: PostgresStorage;
  private activeProvider: StorageProvider;
  private failoverTimestamp: Date | null = null;
  private connectionStatus: ConnectionStatus;
  private checkInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectBackoff = 30000; // 30 seconds

  constructor(
    supabaseUrl?: string, 
    supabaseKey?: string, 
    postgresUrl?: string,
    preferredProvider: StorageProvider = 'supabase'
  ) {
    try {
      // Initialize Supabase storage if credentials are provided
      if (supabaseUrl && supabaseKey) {
        const supabaseClient = createClient(supabaseUrl, supabaseKey);
        this.supabaseStorage = new SupabaseStorage(supabaseClient);
        console.log('[storage] Initialized Supabase storage');
      } else {
        this.supabaseStorage = null;
        console.log('[storage] Supabase credentials not provided, skipping initialization');
      }
      
      // Initialize PostgreSQL storage
      this.postgresStorage = new PostgresStorage(postgresUrl);
      console.log('[storage] Initialized PostgreSQL storage');
      
      // Set initial connection status
      this.connectionStatus = {
        supabase: {
          available: false,
          lastChecked: null
        },
        postgres: {
          available: false,
          lastChecked: null
        },
        activeProvider: 'postgres' // Default to postgres initially
      };
      
      // Set initial provider based on preference and availability
      this.activeProvider = 'postgres'; // Start with postgres as default
      
      // Immediately check connections and set the appropriate provider
      this.checkConnections().then(() => {
        // If preferred provider is available, use it
        if (preferredProvider === 'supabase' && this.connectionStatus.supabase.available) {
          console.log('[storage] Switching to Supabase storage (primary)');
          this.activeProvider = 'supabase';
        } else if (this.connectionStatus.postgres.available) {
          console.log('[storage] Using PostgreSQL storage (alternative)');
          this.activeProvider = 'postgres';
        } else {
          console.warn('[storage] No storage provider is available, using fallback to PostgreSQL');
          this.activeProvider = 'postgres';
        }
        
        this.connectionStatus.activeProvider = this.activeProvider;
      });
      
      // Start continuous connection monitoring
      this.startConnectionMonitoring();
      
    } catch (error) {
      console.error('[storage] Error initializing adaptive storage:', error);
      this.activeProvider = 'postgres'; // Fallback to postgres on initialization error
      this.connectionStatus = {
        supabase: {
          available: false,
          lastChecked: new Date()
        },
        postgres: {
          available: false,
          lastChecked: new Date()
        },
        activeProvider: 'postgres'
      };
    }
  }
  
  /**
   * Start monitoring connections to automatically handle failover and recovery
   */
  private startConnectionMonitoring() {
    // Clear any existing interval
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    
    // Set up a new check interval (every 60 seconds)
    this.checkInterval = setInterval(async () => {
      await this.monitorConnections();
    }, 60000);
    
    console.log('[storage] Connection monitoring started');
  }
  
  /**
   * Stop monitoring connections
   */
  public stopConnectionMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('[storage] Connection monitoring stopped');
    }
  }
  
  /**
   * Monitor connections and handle failover/recovery
   */
  private async monitorConnections() {
    try {
      await this.checkConnections();
      
      // If using Postgres due to failover, check if Supabase is back
      if (this.activeProvider === 'postgres' && this.failoverTimestamp && this.supabaseStorage) {
        if (this.connectionStatus.supabase.available) {
          console.log('[storage] Supabase connection restored, switching back from failover');
          this.activeProvider = 'supabase';
          this.failoverTimestamp = null;
          this.reconnectAttempts = 0;
          this.connectionStatus.activeProvider = 'supabase';
        } else {
          // Increment reconnect attempts
          this.reconnectAttempts++;
          if (this.reconnectAttempts > this.maxReconnectAttempts) {
            console.log('[storage] Max reconnect attempts reached, staying with PostgreSQL');
            this.reconnectAttempts = 0; // Reset counter but keep checking
          }
        }
      }
    } catch (error) {
      console.error('[storage] Error in connection monitoring:', error);
    }
  }
  
  /**
   * Check all connections and update status
   */
  private async checkConnections(): Promise<void> {
    // Check Supabase connection
    if (this.supabaseStorage) {
      try {
        const supabaseAvailable = await this.supabaseStorage.checkConnection();
        this.connectionStatus.supabase = {
          available: supabaseAvailable,
          lastChecked: new Date()
        };
      } catch (error) {
        console.error('[storage] Error checking Supabase connection:', error);
        this.connectionStatus.supabase = {
          available: false,
          lastChecked: new Date()
        };
      }
    } else {
      this.connectionStatus.supabase = {
        available: false,
        lastChecked: new Date()
      };
    }
    
    // Check PostgreSQL connection
    try {
      const postgresAvailable = await this.postgresStorage.checkConnection();
      this.connectionStatus.postgres = {
        available: postgresAvailable,
        lastChecked: new Date()
      };
    } catch (error) {
      console.error('[storage] Error checking PostgreSQL connection:', error);
      this.connectionStatus.postgres = {
        available: false,
        lastChecked: new Date()
      };
    }
    
    // Update active provider in connection status
    this.connectionStatus.activeProvider = this.activeProvider;
  }
  
  /**
   * Get the current connection status
   */
  public async getConnectionStatus(): Promise<ConnectionStatus> {
    // Check connections when explicitly requested
    await this.checkConnections();
    return this.connectionStatus;
  }
  
  /**
   * Get the currently active storage provider
   */
  public getCurrentProvider(): StorageProvider {
    return this.activeProvider;
  }
  
  /**
   * Manually switch to a specific provider
   */
  public async switchProvider(provider: StorageProvider): Promise<boolean> {
    await this.checkConnections();
    
    if (provider === 'supabase' && !this.connectionStatus.supabase.available) {
      console.log('[storage] Cannot switch to Supabase: not available');
      return false;
    }
    
    if (provider === 'postgres' && !this.connectionStatus.postgres.available) {
      console.log('[storage] Cannot switch to PostgreSQL: not available');
      return false;
    }
    
    console.log(`[storage] Switching to ${provider} storage`);
    this.activeProvider = provider;
    this.connectionStatus.activeProvider = provider;
    return true;
  }
  
  /**
   * Check database health
   */
  public async checkHealth(): Promise<{ connected: boolean; provider: StorageProvider; error?: string }> {
    try {
      // Force check connection status
      await this.checkConnections();
      
      // Get current provider's connection status
      const isConnected = this.activeProvider === 'supabase' 
        ? this.connectionStatus.supabase.available 
        : this.connectionStatus.postgres.available;
      
      return {
        connected: isConnected,
        provider: this.activeProvider
      };
    } catch (error) {
      return {
        connected: false,
        provider: this.activeProvider,
        error: (error as Error).message
      };
    }
  }

  /**
   * Execute a storage operation with automatic failover
   * @param operation Function that performs the storage operation
   * @param operationName Name of the operation for logging
   * @returns Result of the operation
   */
  private async executeWithFailover<T>(
    operation: (provider: StorageProvider) => Promise<T>,
    operationName: string
  ): Promise<T> {
    try {
      // Try with the active provider
      return await operation(this.activeProvider);
    } catch (error) {
      console.error(`[storage] Error executing ${operationName} with ${this.activeProvider}:`, error);
      
      // If active provider is Supabase and we have Postgres as backup
      if (this.activeProvider === 'supabase') {
        console.log(`[storage] Attempting failover to PostgreSQL for ${operationName}`);
        
        // Check if PostgreSQL is available
        const postgresAvailable = await this.postgresStorage.checkConnection();
        if (!postgresAvailable) {
          console.error('[storage] PostgreSQL failover not available');
          throw new Error(`Storage operation failed and failover is not available: ${(error as Error).message}`);
        }
        
        // Switch to PostgreSQL temporarily
        const previousProvider = this.activeProvider;
        this.activeProvider = 'postgres';
        this.failoverTimestamp = new Date();
        this.connectionStatus.activeProvider = 'postgres';
        
        try {
          // Retry the operation with PostgreSQL
          const result = await operation('postgres');
          console.log(`[storage] Successfully executed ${operationName} with PostgreSQL failover`);
          
          // Update connection status to reflect that Supabase is down
          this.connectionStatus.supabase.available = false;
          this.connectionStatus.supabase.lastChecked = new Date();
          return result;
        } catch (postgresError) {
          // If PostgreSQL also fails, restore the original provider and throw
          console.error(`[storage] Failover to PostgreSQL also failed for ${operationName}:`, postgresError);
          this.activeProvider = previousProvider;
          this.connectionStatus.activeProvider = previousProvider;
          throw new Error(`Both storage providers failed. Original error: ${(error as Error).message}, Failover error: ${(postgresError as Error).message}`);
        }
      } else {
        // If PostgreSQL is the active provider and it fails, check if Supabase is available
        if (this.supabaseStorage) {
          console.log(`[storage] Checking if Supabase is available for ${operationName}`);
          const supabaseAvailable = await this.supabaseStorage.checkConnection();
          
          if (supabaseAvailable) {
            console.log(`[storage] Attempting to use Supabase for ${operationName}`);
            this.activeProvider = 'supabase';
            this.connectionStatus.activeProvider = 'supabase';
            
            try {
              return await operation('supabase');
            } catch (supabaseError) {
              // If Supabase also fails, restore PostgreSQL as active and throw
              console.error(`[storage] Supabase also failed for ${operationName}:`, supabaseError);
              this.activeProvider = 'postgres';
              this.connectionStatus.activeProvider = 'postgres';
              throw new Error(`Both storage providers failed. Original error: ${(error as Error).message}, Supabase error: ${(supabaseError as Error).message}`);
            }
          }
        }
        
        // If we reach here, we couldn't failover
        throw new Error(`Storage operation failed and no alternative provider is available: ${(error as Error).message}`);
      }
    }
  }
  
  // Implementation of IStorage interface methods
  async getAllCosts(): Promise<any[]> {
    return this.executeWithFailover(async (provider) => {
      return provider === 'supabase' 
        ? await this.supabaseStorage!.getAllCosts()
        : await this.postgresStorage.getAllCosts();
    }, 'getAllCosts');
  }
  
  async getCostById(id: number): Promise<any> {
    return this.executeWithFailover(async (provider) => {
      return provider === 'supabase' 
        ? await this.supabaseStorage!.getCostById(id)
        : await this.postgresStorage.getCostById(id);
    }, 'getCostById');
  }
  
  async createCost(data: any): Promise<any> {
    return this.executeWithFailover(async (provider) => {
      return provider === 'supabase' 
        ? await this.supabaseStorage!.createCost(data)
        : await this.postgresStorage.createCost(data);
    }, 'createCost');
  }
  
  async updateCost(id: number, data: any): Promise<any> {
    return this.executeWithFailover(async (provider) => {
      return provider === 'supabase' 
        ? await this.supabaseStorage!.updateCost(id, data)
        : await this.postgresStorage.updateCost(id, data);
    }, 'updateCost');
  }
  
  async deleteCost(id: number): Promise<void> {
    return this.executeWithFailover(async (provider) => {
      return provider === 'supabase' 
        ? await this.supabaseStorage!.deleteCost(id)
        : await this.postgresStorage.deleteCost(id);
    }, 'deleteCost');
  }
  
  async getCostFactors(): Promise<any[]> {
    return this.executeWithFailover(async (provider) => {
      return provider === 'supabase' 
        ? await this.supabaseStorage!.getCostFactors()
        : await this.postgresStorage.getCostFactors();
    }, 'getCostFactors');
  }
  
  async getCostFactorsByRegionAndBuildingType(region: string, buildingType: string): Promise<any[]> {
    return this.executeWithFailover(async (provider) => {
      return provider === 'supabase' 
        ? await this.supabaseStorage!.getCostFactorsByRegionAndBuildingType(region, buildingType)
        : await this.postgresStorage.getCostFactorsByRegionAndBuildingType(region, buildingType);
    }, 'getCostFactorsByRegionAndBuildingType');
  }
  
  async createCostFactor(data: any): Promise<any> {
    return this.executeWithFailover(async (provider) => {
      return provider === 'supabase' 
        ? await this.supabaseStorage!.createCostFactor(data)
        : await this.postgresStorage.createCostFactor(data);
    }, 'createCostFactor');
  }
  
  async updateCostFactor(id: number, data: any): Promise<any> {
    return this.executeWithFailover(async (provider) => {
      return provider === 'supabase' 
        ? await this.supabaseStorage!.updateCostFactor(id, data)
        : await this.postgresStorage.updateCostFactor(id, data);
    }, 'updateCostFactor');
  }
  
  async deleteCostFactor(id: number): Promise<void> {
    return this.executeWithFailover(async (provider) => {
      return provider === 'supabase' 
        ? await this.supabaseStorage!.deleteCostFactor(id)
        : await this.postgresStorage.deleteCostFactor(id);
    }, 'deleteCostFactor');
  }
  
  async getUsers(): Promise<any[]> {
    return this.executeWithFailover(async (provider) => {
      return provider === 'supabase' 
        ? await this.supabaseStorage!.getUsers()
        : await this.postgresStorage.getUsers();
    }, 'getUsers');
  }
  
  async getUserById(id: number): Promise<any> {
    return this.executeWithFailover(async (provider) => {
      return provider === 'supabase' 
        ? await this.supabaseStorage!.getUserById(id)
        : await this.postgresStorage.getUserById(id);
    }, 'getUserById');
  }
  
  async getUserByEmail(email: string): Promise<any> {
    return this.executeWithFailover(async (provider) => {
      return provider === 'supabase' 
        ? await this.supabaseStorage!.getUserByEmail(email)
        : await this.postgresStorage.getUserByEmail(email);
    }, 'getUserByEmail');
  }
  
  async createUser(data: any): Promise<any> {
    return this.executeWithFailover(async (provider) => {
      return provider === 'supabase' 
        ? await this.supabaseStorage!.createUser(data)
        : await this.postgresStorage.createUser(data);
    }, 'createUser');
  }
  
  async updateUser(id: number, data: any): Promise<any> {
    return this.executeWithFailover(async (provider) => {
      return provider === 'supabase' 
        ? await this.supabaseStorage!.updateUser(id, data)
        : await this.postgresStorage.updateUser(id, data);
    }, 'updateUser');
  }
  
  async deleteUser(id: number): Promise<void> {
    return this.executeWithFailover(async (provider) => {
      return provider === 'supabase' 
        ? await this.supabaseStorage!.deleteUser(id)
        : await this.postgresStorage.deleteUser(id);
    }, 'deleteUser');
  }
  
  async getCostMatrices(): Promise<any[]> {
    return this.executeWithFailover(async (provider) => {
      return provider === 'supabase' 
        ? await this.supabaseStorage!.getCostMatrices()
        : await this.postgresStorage.getCostMatrices();
    }, 'getCostMatrices');
  }
  
  async getCostMatrixById(id: number): Promise<any> {
    return this.executeWithFailover(async (provider) => {
      return provider === 'supabase' 
        ? await this.supabaseStorage!.getCostMatrixById(id)
        : await this.postgresStorage.getCostMatrixById(id);
    }, 'getCostMatrixById');
  }
  
  async getCostMatrixByRegionAndBuildingType(region: string, buildingType: string): Promise<any[]> {
    return this.executeWithFailover(async (provider) => {
      return provider === 'supabase' 
        ? await this.supabaseStorage!.getCostMatrixByRegionAndBuildingType(region, buildingType)
        : await this.postgresStorage.getCostMatrixByRegionAndBuildingType(region, buildingType);
    }, 'getCostMatrixByRegionAndBuildingType');
  }
  
  async createCostMatrix(data: any): Promise<any> {
    return this.executeWithFailover(async (provider) => {
      return provider === 'supabase' 
        ? await this.supabaseStorage!.createCostMatrix(data)
        : await this.postgresStorage.createCostMatrix(data);
    }, 'createCostMatrix');
  }
  
  async updateCostMatrix(id: number, data: any): Promise<any> {
    return this.executeWithFailover(async (provider) => {
      return provider === 'supabase' 
        ? await this.supabaseStorage!.updateCostMatrix(id, data)
        : await this.postgresStorage.updateCostMatrix(id, data);
    }, 'updateCostMatrix');
  }
  
  async deleteCostMatrix(id: number): Promise<void> {
    return this.executeWithFailover(async (provider) => {
      return provider === 'supabase' 
        ? await this.supabaseStorage!.deleteCostMatrix(id)
        : await this.postgresStorage.deleteCostMatrix(id);
    }, 'deleteCostMatrix');
  }
  
  async getAllProperties(options?: { limit?: number, offset?: number }): Promise<any[]> {
    return this.executeWithFailover(async (provider) => {
      return provider === 'supabase' 
        ? await this.supabaseStorage!.getAllProperties(options)
        : await this.postgresStorage.getAllProperties(options?.limit, options?.offset);
    }, 'getAllProperties');
  }
  
  async getPropertyById(id: number): Promise<any> {
    return this.executeWithFailover(async (provider) => {
      return provider === 'supabase' 
        ? await this.supabaseStorage!.getPropertyById(id)
        : await this.postgresStorage.getPropertyById(id);
    }, 'getPropertyById');
  }
  
  async getPropertyByPropId(propId: string): Promise<any> {
    return this.executeWithFailover(async (provider) => {
      return provider === 'supabase' 
        ? await this.supabaseStorage!.getPropertyByPropId(propId)
        : await this.postgresStorage.getPropertyByPropId(propId);
    }, 'getPropertyByPropId');
  }
  
  async createProperty(data: any): Promise<any> {
    return this.executeWithFailover(async (provider) => {
      return provider === 'supabase' 
        ? await this.supabaseStorage!.createProperty(data)
        : await this.postgresStorage.createProperty(data);
    }, 'createProperty');
  }
  
  async updateProperty(id: number, data: any): Promise<any> {
    return this.executeWithFailover(async (provider) => {
      return provider === 'supabase' 
        ? await this.supabaseStorage!.updateProperty(id, data)
        : await this.postgresStorage.updateProperty(id, data);
    }, 'updateProperty');
  }
  
  async deleteProperty(id: number): Promise<void> {
    return this.executeWithFailover(async (provider) => {
      return provider === 'supabase' 
        ? await this.supabaseStorage!.deleteProperty(id)
        : await this.postgresStorage.deleteProperty(id);
    }, 'deleteProperty');
  }
  
  // Activities
  async getAllActivities(): Promise<any[]> {
    return this.executeWithFailover(async (provider) => {
      return provider === 'supabase' 
        ? await this.supabaseStorage!.getAllActivities()
        : await this.postgresStorage.getAllActivities();
    }, 'getAllActivities');
  }
  
  async createActivity(activity: any): Promise<any> {
    return this.executeWithFailover(async (provider) => {
      return provider === 'supabase' 
        ? await this.supabaseStorage!.createActivity(activity)
        : await this.postgresStorage.createActivity(activity);
    }, 'createActivity');
  }

  // Sync Schedule methods
  async getAllSyncSchedules(): Promise<any[]> {
    return this.executeWithFailover(async (provider) => {
      return provider === 'supabase' 
        ? await this.supabaseStorage!.getAllSyncSchedules()
        : await this.postgresStorage.getAllSyncSchedules();
    }, 'getAllSyncSchedules');
  }

  async getSyncSchedulesByConnection(connectionId: number): Promise<any[]> {
    return this.executeWithFailover(async (provider) => {
      return provider === 'supabase' 
        ? await this.supabaseStorage!.getSyncSchedulesByConnection(connectionId)
        : await this.postgresStorage.getSyncSchedulesByConnection(connectionId);
    }, 'getSyncSchedulesByConnection');
  }

  async getSyncScheduleByName(connectionId: number, name: string): Promise<any | undefined> {
    return this.executeWithFailover(async (provider) => {
      return provider === 'supabase' 
        ? await this.supabaseStorage!.getSyncScheduleByName(connectionId, name)
        : await this.postgresStorage.getSyncScheduleByName(connectionId, name);
    }, 'getSyncScheduleByName');
  }

  async getEnabledSyncSchedules(): Promise<any[]> {
    return this.executeWithFailover(async (provider) => {
      return provider === 'supabase' 
        ? await this.supabaseStorage!.getEnabledSyncSchedules()
        : await this.postgresStorage.getEnabledSyncSchedules();
    }, 'getEnabledSyncSchedules');
  }

  async getSyncSchedule(id: number): Promise<any | undefined> {
    return this.executeWithFailover(async (provider) => {
      return provider === 'supabase' 
        ? await this.supabaseStorage!.getSyncSchedule(id)
        : await this.postgresStorage.getSyncSchedule(id);
    }, 'getSyncSchedule');
  }

  async createSyncSchedule(schedule: any): Promise<any> {
    return this.executeWithFailover(async (provider) => {
      return provider === 'supabase' 
        ? await this.supabaseStorage!.createSyncSchedule(schedule)
        : await this.postgresStorage.createSyncSchedule(schedule);
    }, 'createSyncSchedule');
  }

  async updateSyncSchedule(id: number, schedule: any): Promise<any | undefined> {
    return this.executeWithFailover(async (provider) => {
      return provider === 'supabase' 
        ? await this.supabaseStorage!.updateSyncSchedule(id, schedule)
        : await this.postgresStorage.updateSyncSchedule(id, schedule);
    }, 'updateSyncSchedule');
  }

  async deleteSyncSchedule(id: number): Promise<void> {
    return this.executeWithFailover(async (provider) => {
      return provider === 'supabase' 
        ? await this.supabaseStorage!.deleteSyncSchedule(id)
        : await this.postgresStorage.deleteSyncSchedule(id);
    }, 'deleteSyncSchedule');
  }

  // Sync History methods
  async getSyncHistoryBySchedule(scheduleId: number, limit?: number, offset?: number): Promise<any[]> {
    return this.executeWithFailover(async (provider) => {
      return provider === 'supabase' 
        ? await this.supabaseStorage!.getSyncHistoryBySchedule(scheduleId, limit, offset)
        : await this.postgresStorage.getSyncHistoryBySchedule(scheduleId, limit, offset);
    }, 'getSyncHistoryBySchedule');
  }

  async getSyncHistoryByConnection(connectionId: number, limit?: number, offset?: number): Promise<any[]> {
    return this.executeWithFailover(async (provider) => {
      return provider === 'supabase' 
        ? await this.supabaseStorage!.getSyncHistoryByConnection(connectionId, limit, offset)
        : await this.postgresStorage.getSyncHistoryByConnection(connectionId, limit, offset);
    }, 'getSyncHistoryByConnection');
  }

  async createSyncHistory(history: any): Promise<any> {
    return this.executeWithFailover(async (provider) => {
      return provider === 'supabase' 
        ? await this.supabaseStorage!.createSyncHistory(history)
        : await this.postgresStorage.createSyncHistory(history);
    }, 'createSyncHistory');
  }

  async updateSyncHistory(id: number, history: any): Promise<any | undefined> {
    return this.executeWithFailover(async (provider) => {
      return provider === 'supabase' 
        ? await this.supabaseStorage!.updateSyncHistory(id, history)
        : await this.postgresStorage.updateSyncHistory(id, history);
    }, 'updateSyncHistory');
  }

  // FTP Connection methods
  async getFTPConnection(id: number): Promise<any | undefined> {
    return this.executeWithFailover(async (provider) => {
      return provider === 'supabase' 
        ? await this.supabaseStorage!.getFTPConnection(id)
        : await this.postgresStorage.getFTPConnection(id);
    }, 'getFTPConnection');
  }
}

// Create a singleton instance for the app to use
export const adaptiveStorage = new AdaptiveStorage();
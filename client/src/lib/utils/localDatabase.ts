/**
 * Local Database Service
 * 
 * This module provides a local database service using IndexedDB for offline storage.
 * It handles storing and retrieving data when Supabase is unavailable, as well as
 * queuing changes for synchronization when the connection is restored.
 */

import Dexie, { Table } from 'dexie';
import { v4 as uuidv4 } from 'uuid';

// Database version
const DB_VERSION = 1;

// Sync queue operations
export type SyncOperation = 'insert' | 'update' | 'delete';

// Sync queue item
export interface SyncQueueItem {
  id?: number;
  createdAt: string;
  syncedAt?: string;
  tableName: string;
  recordId?: string | number;
  operation: SyncOperation;
  recordData?: Record<string, any>;
  attempts: number;
  errorMessage?: string;
}

// Define tables for our database
interface LocalDatabaseSchema extends Dexie {
  // Tables for offline data
  properties: Table<any, number>;
  improvements: Table<any, number>;
  cost_matrices: Table<any, number>;
  users: Table<any, number>;
  calculations: Table<any, number>;
  
  // Sync queue for pending changes
  syncQueue: Table<SyncQueueItem, number> & {
    add(tableName: string, operation: SyncOperation, data?: any, id?: string | number): Promise<number>;
    getPending(): Promise<{ data?: SyncQueueItem[], error?: Error }>;
    markAsSynced(ids: number[]): Promise<void>;
    getFailedItems(): Promise<{ data?: SyncQueueItem[], error?: Error }>;
    clearAll(): Promise<void>;
  };
}

// Extend Dexie with our schema
class LocalDatabase extends Dexie implements LocalDatabaseSchema {
  properties!: Table<any, number>;
  improvements!: Table<any, number>;
  cost_matrices!: Table<any, number>;
  users!: Table<any, number>;
  calculations!: Table<any, number>;
  syncQueue!: Table<SyncQueueItem, number> & {
    add(tableName: string, operation: SyncOperation, data?: any, id?: string | number): Promise<number>;
    getPending(): Promise<{ data?: SyncQueueItem[], error?: Error }>;
    markAsSynced(ids: number[]): Promise<void>;
    getFailedItems(): Promise<{ data?: SyncQueueItem[], error?: Error }>;
    clearAll(): Promise<void>;
  };
  
  constructor() {
    super('BentonCountyCostCalculator');
    
    // Define tables and indexes
    this.version(DB_VERSION).stores({
      properties: '++id, propertyId, parcelId, lastUpdated, address, owner',
      improvements: '++id, improvementId, propertyId, buildingType, yearBuilt, lastUpdated',
      cost_matrices: '++id, matrixId, buildingType, region, year, lastUpdated',
      users: '++id, userId, email, role, lastLogin',
      calculations: '++id, calculationId, propertyId, userId, date, buildingType, result',
      syncQueue: '++id, createdAt, syncedAt, tableName, recordId, operation, attempts'
    });
    
    // Add methods to sync queue table
    this.syncQueue.add = this._addToSyncQueue.bind(this);
    this.syncQueue.getPending = this._getPendingSyncItems.bind(this);
    this.syncQueue.markAsSynced = this._markAsSynced.bind(this);
    this.syncQueue.getFailedItems = this._getFailedSyncItems.bind(this);
    this.syncQueue.clearAll = this._clearSyncQueue.bind(this);
  }
  
  /**
   * Add an item to the sync queue
   */
  private async _addToSyncQueue(
    tableName: string, 
    operation: SyncOperation, 
    data?: any, 
    id?: string | number
  ): Promise<number> {
    const now = new Date().toISOString();
    
    const item: SyncQueueItem = {
      createdAt: now,
      tableName,
      operation,
      attempts: 0,
      recordId: id,
      recordData: data
    };
    
    return this.syncQueue.add(item);
  }
  
  /**
   * Get pending sync items
   */
  private async _getPendingSyncItems(): Promise<{ data?: SyncQueueItem[], error?: Error }> {
    try {
      // Use whereNull instead of equals(undefined)
      const items = await this.syncQueue
        .filter(item => item.syncedAt === undefined)
        .toArray();
      
      return { data: items };
    } catch (error) {
      console.error('Error getting pending sync items:', error);
      return { error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }
  
  /**
   * Mark items as synced
   */
  private async _markAsSynced(ids: number[]): Promise<void> {
    const now = new Date().toISOString();
    
    try {
      await this.syncQueue
        .where('id')
        .anyOf(ids)
        .modify({ syncedAt: now });
    } catch (error) {
      console.error('Error marking sync items as synced:', error);
      throw error;
    }
  }
  
  /**
   * Get failed sync items
   */
  private async _getFailedSyncItems(): Promise<{ data?: SyncQueueItem[], error?: Error }> {
    try {
      const items = await this.syncQueue
        .filter(item => item.attempts >= 3 && item.syncedAt === undefined)
        .toArray();
      
      return { data: items };
    } catch (error) {
      console.error('Error getting failed sync items:', error);
      return { error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }
  
  /**
   * Clear all sync queue items
   */
  private async _clearSyncQueue(): Promise<void> {
    try {
      await this.syncQueue.clear();
    } catch (error) {
      console.error('Error clearing sync queue:', error);
      throw error;
    }
  }
  
  /**
   * Store data in local database with auto-sync
   */
  async storeWithSync<T extends Record<string, any>>(
    tableName: string, 
    data: T, 
    id?: string | number
  ): Promise<{ data?: T, error?: Error }> {
    try {
      // Add a unique ID if not provided
      if (!id && !data.id) {
        data.id = uuidv4();
      }
      
      // Add timestamp
      data.lastUpdated = new Date().toISOString();
      
      // Get the table
      const table = this.table(tableName);
      
      // Store the data
      const newId = await table.add(data);
      
      // Add to sync queue for later synchronization
      await this.syncQueue.add(tableName, 'insert', data);
      
      return { data: { ...data, id: newId } };
    } catch (error) {
      console.error(`Error storing data in table ${tableName}:`, error);
      return { error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }
  
  /**
   * Update data in local database with auto-sync
   */
  async updateWithSync<T extends Record<string, any>>(
    tableName: string, 
    id: string | number, 
    data: Partial<T>
  ): Promise<{ data?: T, error?: Error }> {
    try {
      // Add timestamp
      data.lastUpdated = new Date().toISOString();
      
      // Get the table
      const table = this.table(tableName);
      
      // Get current record
      const current = await table.get(id as any);
      if (!current) {
        return { error: new Error(`Record with id ${id} not found in table ${tableName}`) };
      }
      
      // Merge data
      const mergedData = { ...current, ...data };
      
      // Update the data
      await table.update(id as any, data);
      
      // Add to sync queue for later synchronization
      await this.syncQueue.add(tableName, 'update', mergedData, id);
      
      return { data: mergedData as T };
    } catch (error) {
      console.error(`Error updating data in table ${tableName}:`, error);
      return { error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }
  
  /**
   * Delete data from local database with auto-sync
   */
  async deleteWithSync(
    tableName: string, 
    id: string | number
  ): Promise<{ success?: boolean, error?: Error }> {
    try {
      // Get the table
      const table = this.table(tableName);
      
      // Get current record for sync
      const current = await table.get(id as any);
      if (!current) {
        return { error: new Error(`Record with id ${id} not found in table ${tableName}`) };
      }
      
      // Delete the data
      await table.delete(id as any);
      
      // Add to sync queue for later synchronization
      await this.syncQueue.add(tableName, 'delete', current, id);
      
      return { success: true };
    } catch (error) {
      console.error(`Error deleting data from table ${tableName}:`, error);
      return { error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }
  
  /**
   * Get data from local database
   */
  async get<T>(
    tableName: string, 
    id: string | number
  ): Promise<{ data?: T, error?: Error }> {
    try {
      // Get the table
      const table = this.table(tableName);
      
      // Get the data
      const data = await table.get(id as any);
      
      if (!data) {
        return { error: new Error(`Record with id ${id} not found in table ${tableName}`) };
      }
      
      return { data: data as T };
    } catch (error) {
      console.error(`Error getting data from table ${tableName}:`, error);
      return { error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }
  
  /**
   * Query data from local database
   */
  async query<T>(
    tableName: string, 
    whereClause?: (item: any) => boolean,
    limit?: number
  ): Promise<{ data?: T[], error?: Error }> {
    try {
      // Get the table
      const table = this.table(tableName);
      
      // Build query
      let collection = table.toCollection();
      
      // Apply where clause if provided
      if (whereClause) {
        collection = collection.filter(whereClause);
      }
      
      // Apply limit if provided
      if (limit && limit > 0) {
        collection = collection.limit(limit);
      }
      
      // Execute query
      const data = await collection.toArray();
      
      return { data: data as T[] };
    } catch (error) {
      console.error(`Error querying data from table ${tableName}:`, error);
      return { error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }
}

// Create database instance
export const localDB = new LocalDatabase();

// Export a function to check if IndexedDB is available
export function isIndexedDBAvailable(): boolean {
  try {
    // This is a basic check to see if IndexedDB is available
    return !!window.indexedDB;
  } catch (e) {
    return false;
  }
}

export default localDB;
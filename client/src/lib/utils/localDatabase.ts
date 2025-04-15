/**
 * Local Database Service using Dexie.js (IndexedDB)
 * 
 * This module provides offline data persistence when Supabase
 * is unavailable. It implements similar methods to the Supabase
 * database API to make switching between them seamless.
 */

import Dexie from 'dexie';

// Database version and name
const DB_VERSION = 1;
const DB_NAME = 'bcbs-offline-db';

// Explicitly define all table schemas
class BCBSDatabase extends Dexie {
  // Tables
  properties: Dexie.Table<PropertyRecord, string>;
  improvements: Dexie.Table<ImprovementRecord, string>;
  costMatrix: Dexie.Table<CostMatrixRecord, string>;
  buildingTypes: Dexie.Table<BuildingTypeRecord, string>;
  regions: Dexie.Table<RegionRecord, string>;
  calculationHistory: Dexie.Table<CalculationRecord, string>;
  syncQueue: Dexie.Table<SyncQueueItem, number>;

  constructor() {
    super(DB_NAME);
    
    // Define tables with indexes
    this.version(DB_VERSION).stores({
      properties: 'id, ownerId, address, city, state, zipCode, modifiedAt',
      improvements: 'id, propertyId, type, squareFootage, modifiedAt',
      costMatrix: 'id, buildingType, region, quality, effectiveDate, modifiedAt',
      buildingTypes: 'id, code, description, modifiedAt',
      regions: 'id, code, name, state, modifiedAt',
      calculationHistory: 'id, propertyId, userId, calculatedAt, modifiedAt',
      syncQueue: '++id, tableName, recordId, operation, createdAt'
    });
    
    // Define table types
    this.properties = this.table('properties');
    this.improvements = this.table('improvements');
    this.costMatrix = this.table('costMatrix');
    this.buildingTypes = this.table('buildingTypes');
    this.regions = this.table('regions');
    this.calculationHistory = this.table('calculationHistory');
    this.syncQueue = this.table('syncQueue');
  }
}

// Initialize database
export const db = new BCBSDatabase();

// Table record interfaces
export interface PropertyRecord {
  id: string;
  ownerId?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
  modifiedAt: string;
  [key: string]: any; // For additional dynamic fields
}

export interface ImprovementRecord {
  id: string;
  propertyId: string;
  type: string;
  buildingType?: string;
  squareFootage?: number;
  quality?: string;
  condition?: string;
  yearBuilt?: number;
  createdAt: string;
  modifiedAt: string;
  [key: string]: any; // For additional dynamic fields
}

export interface CostMatrixRecord {
  id: string;
  buildingType: string;
  region: string;
  quality: string;
  baseCostPerSqFt: number;
  adjustmentFactor?: number;
  effectiveDate: string;
  expiryDate?: string;
  createdAt: string;
  modifiedAt: string;
}

export interface BuildingTypeRecord {
  id: string;
  code: string;
  description: string;
  category?: string;
  createdAt: string;
  modifiedAt: string;
}

export interface RegionRecord {
  id: string;
  code: string;
  name: string;
  state: string;
  country?: string;
  regionalFactor?: number;
  createdAt: string;
  modifiedAt: string;
}

export interface CalculationRecord {
  id: string;
  propertyId: string;
  userId: string;
  totalCost: number;
  squareFootage?: number;
  buildingType?: string;
  quality?: string;
  region?: string;
  calculatedAt: string;
  modifiedAt: string;
  // Add other calculation parameters
  [key: string]: any;
}

export interface SyncQueueItem {
  id?: number; // Auto-incremented primary key
  tableName: string;
  recordId: string;
  operation: 'insert' | 'update' | 'delete';
  recordData?: any;
  createdAt: string;
  syncedAt?: string;
  retryCount?: number;
  error?: string;
}

// Similar response format to Supabase for consistent interface
export interface LocalDBResponse<T> {
  data: T | null;
  error: Error | null;
}

/**
 * Generic error handler for Dexie operations
 */
function handleDexieError(error: any): Error {
  console.error('IndexedDB operation failed:', error);
  
  if (error instanceof Dexie.DexieError) {
    return new Error(`Database error (${error.name}): ${error.message}`);
  }
  
  return error instanceof Error 
    ? error 
    : new Error('Unknown database error');
}

/**
 * Get records from a table with filtering options
 */
export async function select<T>(
  tableName: string, 
  options: {
    columns?: string;
    where?: Record<string, any>;
    limit?: number;
    offset?: number;
    orderBy?: string;
    order?: 'asc' | 'desc';
  } = {}
): Promise<LocalDBResponse<T[]>> {
  try {
    // Get the table
    const table = (db as any)[tableName];
    if (!table) {
      throw new Error(`Table '${tableName}' does not exist`);
    }
    
    // Start with all records
    let collection = table.toCollection();
    
    // Apply where filters if specified
    if (options.where) {
      collection = collection.filter(record => {
        // Check if all conditions match
        return Object.entries(options.where).every(([key, value]) => {
          return record[key] === value;
        });
      });
    }
    
    // Apply order by
    if (options.orderBy) {
      collection = collection.sortBy(options.orderBy);
      
      // If desc order, reverse the result
      if (options.order === 'desc') {
        const results = await collection;
        return { data: results.reverse() as T[], error: null };
      }
    }
    
    // Apply pagination
    if (options.offset !== undefined) {
      collection = collection.offset(options.offset);
    }
    
    if (options.limit !== undefined) {
      collection = collection.limit(options.limit);
    }
    
    // Execute query
    const results = await collection.toArray();
    
    // Apply column selection if specified
    if (options.columns && options.columns !== '*') {
      const columns = options.columns.split(',').map(c => c.trim());
      const filteredResults = results.map(record => {
        const result: Record<string, any> = {};
        columns.forEach(column => {
          if (column in record) {
            result[column] = record[column];
          }
        });
        return result;
      });
      
      return { data: filteredResults as T[], error: null };
    }
    
    return { data: results as T[], error: null };
  } catch (error) {
    return { data: null, error: handleDexieError(error) };
  }
}

/**
 * Insert records into a table
 */
export async function insert<T>(
  tableName: string, 
  data: Record<string, any> | Record<string, any>[]
): Promise<LocalDBResponse<T>> {
  try {
    // Get the table
    const table = (db as any)[tableName];
    if (!table) {
      throw new Error(`Table '${tableName}' does not exist`);
    }
    
    // Add timestamps
    const now = new Date().toISOString();
    
    // Convert single object to array for consistent handling
    const records = Array.isArray(data) ? data : [data];
    
    // Add timestamps and generate ID if not present
    const preparedRecords = records.map(record => ({
      ...record,
      id: record.id || `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      createdAt: record.createdAt || now,
      modifiedAt: now
    }));
    
    // Add to sync queue for future synchronization
    for (const record of preparedRecords) {
      await db.syncQueue.add({
        tableName,
        recordId: record.id,
        operation: 'insert',
        recordData: record,
        createdAt: now
      });
    }
    
    // Perform the insert
    const ids = await table.bulkAdd(preparedRecords, { allKeys: true });
    
    // Return the result
    return { 
      data: Array.isArray(data) ? preparedRecords as T : preparedRecords[0] as T, 
      error: null 
    };
  } catch (error) {
    return { data: null, error: handleDexieError(error) };
  }
}

/**
 * Update records in a table
 */
export async function update<T>(
  tableName: string, 
  data: Record<string, any>,
  options: {
    where?: Record<string, any>;
  } = {}
): Promise<LocalDBResponse<T>> {
  try {
    // Get the table
    const table = (db as any)[tableName];
    if (!table) {
      throw new Error(`Table '${tableName}' does not exist`);
    }
    
    // Add timestamp
    const now = new Date().toISOString();
    const updateData = {
      ...data,
      modifiedAt: now
    };
    
    // Determine which records to update
    if (options.where) {
      // Find records that match the where clause
      const records = await table.filter(record => {
        return Object.entries(options.where || {}).every(([key, value]) => {
          return record[key] === value;
        });
      }).toArray();
      
      // Update each matching record
      for (const record of records) {
        await table.update(record.id, updateData);
        
        // Add to sync queue
        await db.syncQueue.add({
          tableName,
          recordId: record.id,
          operation: 'update',
          recordData: { ...record, ...updateData },
          createdAt: now
        });
      }
      
      return { data: records.length > 0 ? records as T : null, error: null };
    } else if (data.id) {
      // Direct update by ID
      await table.update(data.id, updateData);
      
      // Get the updated record
      const updated = await table.get(data.id);
      
      // Add to sync queue
      await db.syncQueue.add({
        tableName,
        recordId: data.id,
        operation: 'update',
        recordData: updated,
        createdAt: now
      });
      
      return { data: updated as T, error: null };
    } else {
      throw new Error('Update requires either a where clause or an id in the data');
    }
  } catch (error) {
    return { data: null, error: handleDexieError(error) };
  }
}

/**
 * Delete records from a table
 */
export async function remove<T>(
  tableName: string, 
  options: {
    where?: Record<string, any>;
    id?: string;
  }
): Promise<LocalDBResponse<T>> {
  try {
    // Get the table
    const table = (db as any)[tableName];
    if (!table) {
      throw new Error(`Table '${tableName}' does not exist`);
    }
    
    const now = new Date().toISOString();
    
    // Delete by ID
    if (options.id) {
      // Get the record first to add to sync queue
      const record = await table.get(options.id);
      if (record) {
        await table.delete(options.id);
        
        // Add to sync queue
        await db.syncQueue.add({
          tableName,
          recordId: options.id,
          operation: 'delete',
          createdAt: now
        });
        
        return { data: record as T, error: null };
      }
      
      return { data: null, error: new Error(`Record with id ${options.id} not found`) };
    }
    
    // Delete by where clause
    if (options.where) {
      // Find records that match the where clause
      const records = await table.filter(record => {
        return Object.entries(options.where || {}).every(([key, value]) => {
          return record[key] === value;
        });
      }).toArray();
      
      // Delete each matching record
      for (const record of records) {
        await table.delete(record.id);
        
        // Add to sync queue
        await db.syncQueue.add({
          tableName,
          recordId: record.id,
          operation: 'delete',
          createdAt: now
        });
      }
      
      return { data: records.length > 0 ? records as T : null, error: null };
    }
    
    return { data: null, error: new Error('Delete requires either a where clause or an id') };
  } catch (error) {
    return { data: null, error: handleDexieError(error) };
  }
}

/**
 * Count records in a table
 */
export async function count(
  tableName: string,
  options: {
    where?: Record<string, any>;
  } = {}
): Promise<LocalDBResponse<number>> {
  try {
    // Get the table
    const table = (db as any)[tableName];
    if (!table) {
      throw new Error(`Table '${tableName}' does not exist`);
    }
    
    // Count with filter
    if (options.where) {
      const count = await table.filter(record => {
        return Object.entries(options.where || {}).every(([key, value]) => {
          return record[key] === value;
        });
      }).count();
      
      return { data: count, error: null };
    }
    
    // Count all
    const count = await table.count();
    return { data: count, error: null };
  } catch (error) {
    return { data: null, error: handleDexieError(error) };
  }
}

/**
 * Get pending sync items
 */
export async function getPendingSyncItems(): Promise<LocalDBResponse<SyncQueueItem[]>> {
  try {
    const items = await db.syncQueue
      .filter(item => !item.syncedAt)
      .toArray();
    
    return { data: items, error: null };
  } catch (error) {
    return { data: null, error: handleDexieError(error) };
  }
}

/**
 * Mark sync items as synchronized
 */
export async function markAsSynced(ids: number[]): Promise<LocalDBResponse<void>> {
  try {
    await db.syncQueue.bulkUpdate(
      ids.map(id => ({
        id,
        syncedAt: new Date().toISOString()
      }))
    );
    
    return { data: undefined, error: null };
  } catch (error) {
    return { data: null, error: handleDexieError(error) };
  }
}

/**
 * Clear all offline data
 */
export async function clearOfflineData(): Promise<LocalDBResponse<void>> {
  try {
    await db.delete();
    await db.open();
    return { data: undefined, error: null };
  } catch (error) {
    return { data: null, error: handleDexieError(error) };
  }
}

// LocalDB API wrapper for easier integration
export const localDB = {
  from: (tableName: string) => {
    return {
      select: <T>(columns = '*') => {
        return {
          where: (field: string, operator: string, value: any) => {
            const whereClause = { [field]: value }; // Simple equality for now
            return {
              get: async () => await select<T>(tableName, { columns, where: whereClause }),
              limit: (limit: number) => ({
                get: async () => await select<T>(tableName, { columns, where: whereClause, limit })
              })
            };
          },
          get: async () => await select<T>(tableName, { columns }),
          limit: (limit: number) => ({
            get: async () => await select<T>(tableName, { columns, limit })
          }),
          order: (field: string, direction: 'asc' | 'desc' = 'asc') => ({
            get: async () => await select<T>(tableName, { columns, orderBy: field, order: direction })
          })
        };
      },
      insert: async <T>(data: Record<string, any>) => await insert<T>(tableName, data),
      update: async <T>(data: Record<string, any>) => await update<T>(tableName, data),
      delete: async <T>() => ({
        where: (field: string, operator: string, value: any) => {
          const whereClause = { [field]: value }; // Simple equality for now
          return {
            get: async () => await remove<T>(tableName, { where: whereClause })
          };
        },
        match: async (criteria: Record<string, any>) => await remove<T>(tableName, { where: criteria })
      }),
      count: async () => await count(tableName)
    };
  },
  syncQueue: {
    getPending: getPendingSyncItems,
    markAsSynced
  },
  clearOfflineData
};

// Check if IndexedDB is available
export const isIndexedDBAvailable = () => {
  try {
    return !!window.indexedDB;
  } catch (e) {
    return false;
  }
};

export default localDB;
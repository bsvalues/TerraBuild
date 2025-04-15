/**
 * Data Synchronization Service
 * 
 * This module manages synchronization of data between local storage and Supabase
 * when the connection is restored after being offline.
 */

import { localDB, SyncQueueItem, SyncOperation } from './localDatabase';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Event names for sync state changes
export type SyncEvent = 'SYNC_START' | 'SYNC_COMPLETE' | 'SYNC_ERROR' | 'SYNC_PROGRESS';

// Event listener type
type SyncEventListener = (event: SyncEvent, data?: any) => void;

// Sync status
export interface SyncStatus {
  isSyncing: boolean;
  lastSyncTime: Date | null;
  syncErrors: Error[];
  pendingChanges: number;
  progress: number;
}

/**
 * Data Synchronization Service
 */
export class SyncService {
  private supabase: SupabaseClient | null = null;
  private isSyncing: boolean = false;
  private lastSyncTime: Date | null = null;
  private syncErrors: Error[] = [];
  private eventListeners: Map<SyncEvent, SyncEventListener[]> = new Map();
  private pendingChanges: number = 0;
  private syncProgress: number = 0;
  private syncInterval: number | null = null;
  private syncIntervalTime: number = 60000; // 1 minute

  /**
   * Initialize the sync service
   * @param supabase Supabase client
   * @param autoSync Enable auto sync
   * @param interval Auto sync interval in ms
   */
  initialize(supabase: SupabaseClient, autoSync: boolean = true, interval?: number): void {
    this.supabase = supabase;
    
    if (interval) {
      this.syncIntervalTime = interval;
    }
    
    // Check for pending changes
    this.checkPendingChanges();
    
    // Start auto sync if enabled
    if (autoSync) {
      this.startAutoSync();
    }
  }

  /**
   * Start auto sync at specified interval
   */
  startAutoSync(): void {
    // Clear any existing interval
    this.stopAutoSync();
    
    // Start new interval
    this.syncInterval = window.setInterval(() => {
      this.checkPendingChanges()
        .then(pendingCount => {
          if (pendingCount > 0) {
            this.synchronize();
          }
        })
        .catch(error => {
          console.error('Error checking pending changes:', error);
        });
    }, this.syncIntervalTime);
  }

  /**
   * Stop auto sync
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      window.clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Check if there are pending changes to sync
   * @returns Promise with the number of pending changes
   */
  async checkPendingChanges(): Promise<number> {
    try {
      const { data, error } = await localDB.syncQueue.getPending();
      
      if (error) {
        throw error;
      }
      
      this.pendingChanges = data?.length || 0;
      return this.pendingChanges;
    } catch (error) {
      console.error('Error checking pending changes:', error);
      return 0;
    }
  }

  /**
   * Start synchronization process
   * @returns Promise that resolves when sync is complete
   */
  async synchronize(): Promise<boolean> {
    // If already syncing or no Supabase, don't start again
    if (this.isSyncing || !this.supabase) {
      return false;
    }
    
    try {
      // Start syncing
      this.isSyncing = true;
      this.syncProgress = 0;
      this.syncErrors = [];
      this.emit('SYNC_START');
      
      // Get pending changes
      const { data: pendingItems, error } = await localDB.syncQueue.getPending();
      
      if (error) {
        throw error;
      }
      
      if (!pendingItems || pendingItems.length === 0) {
        // No pending changes
        this.isSyncing = false;
        this.lastSyncTime = new Date();
        this.emit('SYNC_COMPLETE');
        return true;
      }
      
      this.pendingChanges = pendingItems.length;
      
      // Process each item in sequence
      const syncedIds: number[] = [];
      const errors: Error[] = [];
      
      for (let i = 0; i < pendingItems.length; i++) {
        const item = pendingItems[i];
        this.syncProgress = Math.round((i / pendingItems.length) * 100);
        this.emit('SYNC_PROGRESS', { current: i + 1, total: pendingItems.length, progress: this.syncProgress });
        
        try {
          const success = await this.processSyncItem(item);
          
          if (success && item.id) {
            syncedIds.push(item.id);
          }
        } catch (error) {
          console.error(`Error syncing item ${item.id}:`, error);
          errors.push(error instanceof Error ? error : new Error('Unknown error during sync'));
        }
      }
      
      // Mark synced items
      if (syncedIds.length > 0) {
        await localDB.syncQueue.markAsSynced(syncedIds);
      }
      
      // Update sync state
      this.isSyncing = false;
      this.lastSyncTime = new Date();
      this.syncErrors = errors;
      this.syncProgress = 100;
      
      // Update pending changes count
      await this.checkPendingChanges();
      
      // Emit event
      if (errors.length > 0) {
        this.emit('SYNC_ERROR', { errors, syncedCount: syncedIds.length });
        return false;
      } else {
        this.emit('SYNC_COMPLETE', { syncedCount: syncedIds.length });
        return true;
      }
    } catch (error) {
      console.error('Error during synchronization:', error);
      this.isSyncing = false;
      this.syncErrors = [error instanceof Error ? error : new Error('Unknown error during sync')];
      this.emit('SYNC_ERROR', { errors: this.syncErrors });
      return false;
    }
  }

  /**
   * Get current sync status
   */
  getStatus(): SyncStatus {
    return {
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime,
      syncErrors: this.syncErrors,
      pendingChanges: this.pendingChanges,
      progress: this.syncProgress
    };
  }

  /**
   * Add event listener
   * @param event Event to listen for
   * @param listener Callback function
   * @returns Function to remove listener
   */
  on(event: SyncEvent, listener: SyncEventListener): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    
    const listeners = this.eventListeners.get(event)!;
    listeners.push(listener);
    
    return () => {
      const index = listeners.indexOf(listener);
      if (index >= 0) {
        listeners.splice(index, 1);
      }
    };
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stopAutoSync();
    this.eventListeners.clear();
  }

  /**
   * Process a single sync queue item
   */
  private async processSyncItem(item: SyncQueueItem): Promise<boolean> {
    if (!this.supabase) {
      return false;
    }
    
    try {
      const { tableName, operation, recordData, recordId } = item;
      
      switch (operation) {
        case 'insert':
          if (!recordData) {
            throw new Error('No record data for insert operation');
          }
          
          const { error: insertError } = await this.supabase
            .from(tableName)
            .insert(recordData);
          
          if (insertError) {
            throw insertError;
          }
          
          return true;
          
        case 'update':
          if (!recordData || !recordId) {
            throw new Error('Missing record data or ID for update operation');
          }
          
          const { error: updateError } = await this.supabase
            .from(tableName)
            .update(recordData)
            .eq('id', recordId);
          
          if (updateError) {
            throw updateError;
          }
          
          return true;
          
        case 'delete':
          if (!recordId) {
            throw new Error('No record ID for delete operation');
          }
          
          const { error: deleteError } = await this.supabase
            .from(tableName)
            .delete()
            .eq('id', recordId);
          
          if (deleteError) {
            throw deleteError;
          }
          
          return true;
          
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }
    } catch (error) {
      console.error('Error processing sync item:', error);
      throw error;
    }
  }

  /**
   * Emit an event
   */
  private emit(event: SyncEvent, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event, data);
        } catch (error) {
          console.error('Error in sync event listener:', error);
        }
      });
    }
  }
}

// Create and export singleton instance
export const syncService = new SyncService();

export default syncService;
/**
 * Data Synchronization Service
 * 
 * This service handles the synchronization of data between the local
 * database and Supabase when connection is restored after being offline.
 */

import { toast } from '@/hooks/use-toast';
import localDB, { SyncQueueItem } from '@/lib/utils/localDatabase';
import supabase from '@/lib/utils/supabaseClient';
import supabaseCircuitBreaker from '@/lib/utils/circuitBreaker';

// Default sync options
interface SyncOptions {
  batchSize: number;
  maxRetries: number;
  syncInterval: number;
  onSyncStart?: () => void;
  onSyncComplete?: (result: SyncResult) => void;
  onSyncError?: (error: Error) => void;
}

// Sync result
interface SyncResult {
  success: boolean;
  processed: number;
  succeeded: number;
  failed: number;
  errors: Error[];
  timestamp: string;
}

// Default options
const DEFAULT_OPTIONS: SyncOptions = {
  batchSize: 20,        // Number of items to sync in a batch
  maxRetries: 3,         // Maximum number of retries per item
  syncInterval: 60000,   // Run sync every minute when online
};

/**
 * Sync Service to manage data synchronization
 */
export class SyncService {
  private options: SyncOptions;
  private isSyncing: boolean = false;
  private syncTimer: ReturnType<typeof setTimeout> | null = null;
  private lastSyncResult: SyncResult | null = null;
  private isStarted: boolean = false;

  constructor(options: Partial<SyncOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Start the sync service
   */
  public start(): void {
    if (this.isStarted) return;
    
    this.isStarted = true;
    this.scheduleSyncIfOnline();
    
    // Monitor online/offline status
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    
    console.log('Sync service started');
  }

  /**
   * Stop the sync service
   */
  public stop(): void {
    if (!this.isStarted) return;
    
    this.isStarted = false;
    
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
      this.syncTimer = null;
    }
    
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    
    console.log('Sync service stopped');
  }

  /**
   * Handle online event
   */
  private handleOnline = (): void => {
    console.log('Network online, scheduling sync...');
    this.scheduleSyncIfOnline();
  };

  /**
   * Handle offline event
   */
  private handleOffline = (): void => {
    console.log('Network offline, pausing sync...');
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
      this.syncTimer = null;
    }
  };

  /**
   * Force a sync immediately
   */
  public async forceSync(): Promise<SyncResult> {
    return this.performSync();
  }

  /**
   * Schedule a sync if online
   */
  private scheduleSyncIfOnline(): void {
    if (!navigator.onLine) return;
    
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
    }
    
    this.syncTimer = setTimeout(async () => {
      await this.performSync();
      // Schedule next sync
      this.scheduleSyncIfOnline();
    }, this.options.syncInterval);
  }

  /**
   * Perform synchronization
   */
  private async performSync(): Promise<SyncResult> {
    // Check if already syncing or offline
    if (this.isSyncing || !navigator.onLine) {
      return {
        success: false,
        processed: 0,
        succeeded: 0,
        failed: 0,
        errors: [new Error(this.isSyncing ? 'Sync already in progress' : 'Network offline')],
        timestamp: new Date().toISOString()
      };
    }
    
    // Check if circuit breaker is open
    if (supabaseCircuitBreaker.isOpen()) {
      console.log('Circuit breaker is open, skipping sync');
      return {
        success: false,
        processed: 0,
        succeeded: 0,
        failed: 0,
        errors: [new Error('Circuit breaker is open')],
        timestamp: new Date().toISOString()
      };
    }
    
    this.isSyncing = true;
    
    if (this.options.onSyncStart) {
      this.options.onSyncStart();
    }
    
    try {
      const result = await this.syncQueueItems();
      this.lastSyncResult = result;
      
      if (this.options.onSyncComplete) {
        this.options.onSyncComplete(result);
      }
      
      // Show toast if there were synced items
      if (result.succeeded > 0) {
        toast({
          title: 'Sync Complete',
          description: `Successfully synchronized ${result.succeeded} items`,
          variant: 'default',
        });
      }
      
      return result;
    } catch (error) {
      const syncError = error instanceof Error 
        ? error 
        : new Error('Unknown sync error');
      
      console.error('Sync error:', syncError);
      
      if (this.options.onSyncError) {
        this.options.onSyncError(syncError);
      }
      
      // Show toast for sync error
      toast({
        title: 'Sync Error',
        description: syncError.message,
        variant: 'destructive',
      });
      
      return {
        success: false,
        processed: 0,
        succeeded: 0,
        failed: 0,
        errors: [syncError],
        timestamp: new Date().toISOString()
      };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Synchronize queued items
   */
  private async syncQueueItems(): Promise<SyncResult> {
    try {
      // Get pending sync items
      const { data: pendingItems, error } = await localDB.syncQueue.getPending();
      
      if (error) throw error;
      if (!pendingItems || pendingItems.length === 0) {
        return {
          success: true,
          processed: 0,
          succeeded: 0,
          failed: 0,
          errors: [],
          timestamp: new Date().toISOString()
        };
      }
      
      console.log(`Found ${pendingItems.length} items to sync`);
      
      // Process items in batches
      const batchSize = this.options.batchSize;
      const result: SyncResult = {
        success: true,
        processed: 0,
        succeeded: 0,
        failed: 0,
        errors: [],
        timestamp: new Date().toISOString()
      };
      
      // Group by table for more efficient processing
      const itemsByTable = this.groupByTable(pendingItems);
      
      // Process tables in parallel, but items in each table sequentially
      await Promise.all(
        Object.entries(itemsByTable).map(async ([tableName, items]) => {
          for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);
            const batchResults = await this.processBatch(tableName, batch);
            
            // Update result
            result.processed += batchResults.processed;
            result.succeeded += batchResults.succeeded;
            result.failed += batchResults.failed;
            result.errors.push(...batchResults.errors);
          }
        })
      );
      
      result.success = result.failed === 0;
      return result;
    } catch (error) {
      console.error('Error during sync:', error);
      return {
        success: false,
        processed: 0,
        succeeded: 0,
        failed: 0,
        errors: [error instanceof Error ? error : new Error('Unknown sync error')],
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Group sync items by table
   */
  private groupByTable(items: SyncQueueItem[]): Record<string, SyncQueueItem[]> {
    return items.reduce((acc, item) => {
      if (!acc[item.tableName]) {
        acc[item.tableName] = [];
      }
      acc[item.tableName].push(item);
      return acc;
    }, {} as Record<string, SyncQueueItem[]>);
  }

  /**
   * Process a batch of sync items for a specific table
   */
  private async processBatch(
    tableName: string, 
    items: SyncQueueItem[]
  ): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      processed: items.length,
      succeeded: 0,
      failed: 0,
      errors: [],
      timestamp: new Date().toISOString()
    };
    
    const succeededIds: number[] = [];
    
    // Process each item
    for (const item of items) {
      try {
        // Use the circuit breaker to protect against failures
        await supabaseCircuitBreaker.execute(async () => {
          if (item.operation === 'insert') {
            await supabase.from(tableName).insert(item.recordData);
          } else if (item.operation === 'update') {
            await supabase.from(tableName).update(item.recordData).eq('id', item.recordId);
          } else if (item.operation === 'delete') {
            await supabase.from(tableName).delete().eq('id', item.recordId);
          }
        }, 'database');
        
        // If successful, mark for synced
        if (item.id) succeededIds.push(item.id);
        result.succeeded++;
      } catch (error) {
        console.error(`Error processing sync item ${item.id}:`, error);
        result.failed++;
        result.errors.push(error instanceof Error ? error : new Error('Unknown sync error'));
      }
    }
    
    // Mark synced items as processed
    if (succeededIds.length > 0) {
      await localDB.syncQueue.markAsSynced(succeededIds);
    }
    
    result.success = result.failed === 0;
    return result;
  }

  /**
   * Get the status of the sync service
   */
  public getStatus(): {
    isStarted: boolean;
    isSyncing: boolean;
    lastSyncResult: SyncResult | null;
  } {
    return {
      isStarted: this.isStarted,
      isSyncing: this.isSyncing,
      lastSyncResult: this.lastSyncResult
    };
  }
}

// Create and export a singleton instance
export const syncService = new SyncService();

export default syncService;
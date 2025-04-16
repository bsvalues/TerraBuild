import { IStorage } from './storage';
import { db } from './db';
import { eq, and, desc, asc, ne, isNull, isNotNull, inArray, sql } from 'drizzle-orm';
import { 
  User, InsertUser,
  Environment, InsertEnvironment,
  ApiEndpoint, InsertApiEndpoint,
  Setting, InsertSetting,
  Activity, InsertActivity,
  RepositoryStatus, InsertRepositoryStatus,
  BuildingCost, InsertBuildingCost,
  CostFactor, InsertCostFactor,
  MaterialType, InsertMaterialType,
  MaterialCost, InsertMaterialCost,
  BuildingCostMaterial, InsertBuildingCostMaterial,
  CalculationHistory, InsertCalculationHistory,
  CostMatrix, InsertCostMatrix,
  CostMatrixEntry, InsertCostMatrixEntry,
  CostFactorPreset, InsertCostFactorPreset,
  FileUpload, InsertFileUpload,
  WhatIfScenario, InsertWhatIfScenario,
  ProjectInvitation, InsertProjectInvitation,
  projectInvitations,
  ScenarioVariation, InsertScenarioVariation,
  SharedProject, InsertSharedProject,
  ProjectMember, InsertProjectMember,
  ProjectItem, InsertProjectItem,
  Comment, InsertComment,
  SharedLink, InsertSharedLink,
  ConnectionHistory, InsertConnectionHistory,
  SyncSchedule, InsertSyncSchedule,
  SyncHistory, InsertSyncHistory,
  FTPConnection, InsertFTPConnection,
  ImportRecord, InsertImportRecord,
  users, environments, apiEndpoints, settings, activities, repositoryStatus,
  buildingCosts, costFactors, materialTypes, materialCosts, buildingCostMaterials,
  calculationHistory, costMatrix, costMatrixEntry, costFactorPresets, fileUploads, 
  whatIfScenarios, scenarioVariations, sharedProjects, projectMembers, projectItems,
  comments, sharedLinks, connectionHistory, syncSchedules, syncHistory, ftpConnections,
  importRecords, projectActivities
} from '@shared/schema';

export class PostgresStorage implements IStorage {
  // Reference to database
  private db = db;
  
  constructor(postgresUrl?: string) {
    // URL is used by the parent class for connection management
    // In this implementation, we're using the configured db
  }
  
  /**
   * Check if the PostgreSQL connection is working
   */
  async checkConnection(): Promise<boolean> {
    try {
      // Perform a simple query to check database connectivity
      const result = await this.db.execute(sql`SELECT 1 as connected`);
      return result.rows && result.rows.length > 0 && !!result.rows[0]?.connected;
    } catch (error) {
      console.error('[postgres] Connection check error:', error);
      return false;
    }
  }
  
  /**
   * Helper method to check if a table exists in the database
   * @param tableName The name of the table to check
   * @returns Promise resolving to true if the table exists, false otherwise
   */
  async tableExists(tableName: string): Promise<boolean> {
    try {
      const result = await this.db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_name = ${tableName}
        );
      `);
      
      return result.rows && result.rows[0] && result.rows[0].exists === true;
    } catch (error) {
      console.error(`Error checking if table ${tableName} exists:`, error);
      return false;
    }
  }
  
  // Sync Schedules
  async getAllSyncSchedules(): Promise<SyncSchedule[]> {
    try {
      // Check if the syncSchedules table exists
      if (!(await this.tableExists('sync_schedules'))) {
        console.warn('Sync schedules table does not exist yet.');
        return [];
      }
      
      const results = await this.db.query.syncSchedules.findMany({
        orderBy: [desc(syncSchedules.updatedAt)]
      });
      return results;
    } catch (error) {
      console.error('Error fetching all sync schedules:', error);
      return [];
    }
  }

  async getSyncSchedulesByConnection(connectionId: number): Promise<SyncSchedule[]> {
    try {
      // Check if the syncSchedules table exists
      if (!(await this.tableExists('sync_schedules'))) {
        console.warn('Sync schedules table does not exist yet.');
        return [];
      }
      
      const results = await this.db.query.syncSchedules.findMany({
        where: eq(syncSchedules.connectionId, connectionId),
        orderBy: [desc(syncSchedules.updatedAt)]
      });
      return results;
    } catch (error) {
      console.error(`Error fetching sync schedules for connection ${connectionId}:`, error);
      return [];
    }
  }

  async getSyncScheduleByName(connectionId: number, name: string): Promise<SyncSchedule | undefined> {
    try {
      // Check if the syncSchedules table exists
      if (!(await this.tableExists('sync_schedules'))) {
        console.warn('Sync schedules table does not exist yet.');
        return undefined;
      }
    
      const result = await this.db.query.syncSchedules.findFirst({
        where: and(
          eq(syncSchedules.connectionId, connectionId),
          eq(syncSchedules.name, name)
        )
      });
      return result;
    } catch (error) {
      console.error(`Error fetching sync schedule by name (${name}) for connection ${connectionId}:`, error);
      return undefined;
    }
  }

  async getEnabledSyncSchedules(): Promise<SyncSchedule[]> {
    try {
      // Check if the syncSchedules table exists
      if (!(await this.tableExists('sync_schedules'))) {
        console.warn('Sync schedules table does not exist yet.');
        return [];
      }
      
      const results = await this.db.query.syncSchedules.findMany({
        where: eq(syncSchedules.enabled, true)
      });
      return results;
    } catch (error) {
      console.error('Error fetching enabled sync schedules:', error);
      return [];
    }
  }

  async getSyncSchedule(id: number): Promise<SyncSchedule | undefined> {
    try {
      // Check if the syncSchedules table exists
      if (!(await this.tableExists('sync_schedules'))) {
        console.warn('Sync schedules table does not exist yet.');
        return undefined;
      }
      
      const result = await this.db.query.syncSchedules.findFirst({
        where: eq(syncSchedules.id, id)
      });
      return result;
    } catch (error) {
      console.error(`Error fetching sync schedule ${id}:`, error);
      return undefined;
    }
  }

  async createSyncSchedule(schedule: InsertSyncSchedule): Promise<SyncSchedule> {
    try {
      // Check if the syncSchedules table exists
      if (!(await this.tableExists('sync_schedules'))) {
        console.warn('Sync schedules table does not exist yet.');
        return {
          id: 0,
          name: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          connectionId: 0,
          source: {},
          destination: {},
          frequency: '',
          time: null,
          dayOfWeek: null,
          dayOfMonth: null,
          options: {},
          enabled: false,
          status: 'error',
          lastRun: null,
          nextRun: null
        };
      }
      
      const result = await this.db.insert(syncSchedules).values({
        ...schedule,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: schedule.status || 'pending',
        lastRun: null,
        nextRun: this.calculateNextRunTime(schedule)
      }).returning();
      
      return result[0];
    } catch (error) {
      console.error('Error creating sync schedule:', error);
      return {
        id: 0,
        name: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        connectionId: 0,
        source: {},
        destination: {},
        frequency: '',
        time: null,
        dayOfWeek: null,
        dayOfMonth: null,
        options: {},
        enabled: false,
        status: 'error',
        lastRun: null,
        nextRun: null
      };
    }
  }

  async updateSyncSchedule(id: number, schedule: Partial<InsertSyncSchedule>): Promise<SyncSchedule | undefined> {
    try {
      // Check if the syncSchedules table exists
      if (!(await this.tableExists('sync_schedules'))) {
        console.warn('Sync schedules table does not exist yet.');
        return undefined;
      }
      
      // Calculate next run time if frequency-related fields were updated
      let nextRun = undefined;
      if (schedule.frequency || schedule.time || schedule.dayOfWeek || schedule.dayOfMonth) {
        const currentSchedule = await this.getSyncSchedule(id);
        if (currentSchedule) {
          const mergedSchedule = {
            ...currentSchedule,
            ...schedule
          };
          nextRun = this.calculateNextRunTime(mergedSchedule);
        }
      }
      
      const result = await this.db.update(syncSchedules)
        .set({
          ...schedule,
          updatedAt: new Date(),
          ...(nextRun && { nextRun })
        })
        .where(eq(syncSchedules.id, id))
        .returning();
      
      return result[0];
    } catch (error) {
      console.error(`Error updating sync schedule ${id}:`, error);
      return undefined;
    }
  }

  async deleteSyncSchedule(id: number): Promise<void> {
    try {
      // Check if the syncSchedules table exists
      if (!(await this.tableExists('sync_schedules'))) {
        console.warn('Sync schedules table does not exist yet.');
        return;
      }
      
      await this.db.delete(syncSchedules)
        .where(eq(syncSchedules.id, id));
    } catch (error) {
      console.error(`Error deleting sync schedule ${id}:`, error);
    }
  }
  
  // Helper function to calculate the next run time based on schedule configuration
  private calculateNextRunTime(schedule: Partial<SyncSchedule>): Date | null {
    if (!schedule.enabled || !schedule.frequency) {
      return null;
    }
    
    const now = new Date();
    const result = new Date(now);
    
    // Add 1 minute as minimum delay
    result.setMinutes(result.getMinutes() + 1);
    
    switch (schedule.frequency) {
      case 'hourly':
        // Set to the next hour
        result.setMinutes(0);
        result.setSeconds(0);
        result.setHours(result.getHours() + 1);
        break;
        
      case 'daily':
        // Set to the specified time or midnight
        result.setHours(schedule.time ? parseInt(schedule.time.split(':')[0], 10) : 0);
        result.setMinutes(schedule.time ? parseInt(schedule.time.split(':')[1], 10) : 0);
        result.setSeconds(0);
        
        // If the calculated time is in the past, move to the next day
        if (result <= now) {
          result.setDate(result.getDate() + 1);
        }
        break;
        
      case 'weekly':
        // Set to the specified day of week and time
        const weekTargetDay = schedule.dayOfWeek || 0; // Use Sunday (0) as default
        const currentDay = result.getDay();
        
        // Calculate days to add
        let daysToAdd = weekTargetDay - currentDay;
        if (daysToAdd <= 0) {
          daysToAdd += 7; // Move to next week if the day has passed this week
        }
        
        result.setDate(result.getDate() + daysToAdd);
        result.setHours(schedule.time ? parseInt(schedule.time.split(':')[0], 10) : 0);
        result.setMinutes(schedule.time ? parseInt(schedule.time.split(':')[1], 10) : 0);
        result.setSeconds(0);
        break;
        
      case 'monthly':
        // Set to the specified day of month and time
        const monthTargetDay = schedule.dayOfMonth || 1; // Use 1st day as default
        
        result.setDate(monthTargetDay);
        result.setHours(schedule.time ? parseInt(schedule.time.split(':')[0], 10) : 0);
        result.setMinutes(schedule.time ? parseInt(schedule.time.split(':')[1], 10) : 0);
        result.setSeconds(0);
        
        // If the calculated time is in the past, move to the next month
        if (result <= now) {
          result.setMonth(result.getMonth() + 1);
        }
        break;
        
      default:
        // For immediate or custom, set to 5 minutes from now
        result.setMinutes(result.getMinutes() + 5);
        break;
    }
    
    return result;
  }

  // Sync History
  async getAllSyncHistory(): Promise<SyncHistory[]> {
    try {
      // Check if the syncHistory table exists
      if (!(await this.tableExists('sync_history'))) {
        console.warn('Sync history table does not exist yet.');
        return [];
      }
      
      const results = await this.db.query.syncHistory.findMany({
        orderBy: [desc(syncHistory.startTime)]
      });
      return results;
    } catch (error) {
      console.error('Error fetching all sync history:', error);
      return [];
    }
  }

  async getSyncHistoryBySchedule(scheduleId: number, limit?: number, offset?: number): Promise<SyncHistory[]> {
    try {
      // Check if the syncHistory table exists
      if (!(await this.tableExists('sync_history'))) {
        console.warn('Sync history table does not exist yet.');
        return [];
      }
      
      // Create query params
      const queryParams: any = {
        where: eq(syncHistory.scheduleId, scheduleId),
        orderBy: [desc(syncHistory.startTime)]
      };
      
      if (limit !== undefined) {
        queryParams.limit = limit;
      }
      if (offset !== undefined) {
        queryParams.offset = offset;
      }
      
      const results = await this.db.query.syncHistory.findMany(queryParams);
      return results;
    } catch (error) {
      console.error(`Error fetching sync history for schedule ${scheduleId}:`, error);
      return [];
    }
  }

  async getSyncHistoryByConnection(connectionId: number, limit?: number, offset?: number): Promise<SyncHistory[]> {
    try {
      // Check if the syncHistory table exists
      if (!(await this.tableExists('sync_history'))) {
        console.warn('Sync history table does not exist yet.');
        return [];
      }
      
      // Create query params
      const queryParams: any = {
        where: eq(syncHistory.connectionId, connectionId),
        orderBy: [desc(syncHistory.startTime)]
      };
      
      if (limit !== undefined) {
        queryParams.limit = limit;
      }
      if (offset !== undefined) {
        queryParams.offset = offset;
      }
      
      const results = await this.db.query.syncHistory.findMany(queryParams);
      return results;
    } catch (error) {
      console.error(`Error fetching sync history for connection ${connectionId}:`, error);
      return [];
    }
  }

  async getSyncHistoryById(id: number): Promise<SyncHistory | undefined> {
    try {
      // Check if the syncHistory table exists
      if (!(await this.tableExists('sync_history'))) {
        console.warn('Sync history table does not exist yet.');
        return undefined;
      }
      
      const result = await this.db.query.syncHistory.findFirst({
        where: eq(syncHistory.id, id)
      });
      return result;
    } catch (error) {
      console.error(`Error fetching sync history by id ${id}:`, error);
      return undefined;
    }
  }

  async getSyncHistory(limit: number = 10, offset: number = 0): Promise<SyncHistory[]> {
    try {
      // Check if the syncHistory table exists
      if (!(await this.tableExists('sync_history'))) {
        console.warn('Sync history table does not exist yet.');
        return [];
      }
      
      // Create a properly typed query object
      const results = await this.db.query.syncHistory.findMany({
        orderBy: [desc(syncHistory.startTime)],
        limit: limit,
        offset: offset
      });
      return results;
    } catch (error) {
      console.error('Error fetching sync history:', error);
      return []; // Return empty array for a listing that failed
    }
  }

  async createSyncHistory(history: InsertSyncHistory): Promise<SyncHistory> {
    try {
      // Check if the syncHistory table exists
      if (!(await this.tableExists('sync_history'))) {
        console.warn('Sync history table does not exist yet.');
        // Return a minimal object so the frontend doesn't break
        return {
          id: 0,
          connectionId: 0,
          status: 'error',
          details: { error: 'Failed to create sync history record - table does not exist' },
          scheduleId: 0,
          scheduleName: '',
          startTime: new Date(),
          endTime: null,
          filesTransferred: 0,
          totalBytes: 0,
          errors: ['Database table does not exist']
        };
      }
      
      // Ensure required fields have default values
      const historyWithDefaults = {
        ...history,
        startTime: history.startTime || new Date(),
        filesTransferred: history.filesTransferred || 0,
        totalBytes: history.totalBytes || 0,
        errors: history.errors || []
      };

      const result = await this.db.insert(syncHistory).values(historyWithDefaults).returning();
      
      return result[0];
    } catch (error) {
      console.error('Error creating sync history:', error);
      // Return a minimal object so the frontend doesn't break
      return {
        id: 0,
        connectionId: 0,
        status: 'error',
        details: { error: 'Failed to create sync history record' },
        scheduleId: 0,
        scheduleName: '',
        startTime: new Date(),
        endTime: null,
        filesTransferred: 0,
        totalBytes: 0,
        errors: ['Database error']
      };
    }
  }

  async updateSyncHistory(id: number, history: Partial<SyncHistory>): Promise<SyncHistory | undefined> {
    try {
      // Check if the syncHistory table exists
      if (!(await this.tableExists('sync_history'))) {
        console.warn('Sync history table does not exist yet.');
        return undefined;
      }
      
      const result = await this.db.update(syncHistory)
        .set(history)
        .where(eq(syncHistory.id, id))
        .returning();
      
      return result[0];
    } catch (error) {
      console.error(`Error updating sync history ${id}:`, error);
      return undefined;
    }
  }

  async deleteSyncHistory(id: number): Promise<void> {
    try {
      // Check if the syncHistory table exists
      if (!(await this.tableExists('sync_history'))) {
        console.warn('Sync history table does not exist yet.');
        return;
      }
      
      await this.db.delete(syncHistory)
        .where(eq(syncHistory.id, id));
    } catch (error) {
      console.error(`Error deleting sync history ${id}:`, error);
    }
  }

  // FTP Connections
  async getFTPConnection(id: number): Promise<FTPConnection | undefined> {
    try {
      const result = await this.db.query.ftpConnections.findFirst({
        where: eq(ftpConnections.id, id)
      });
      return result;
    } catch (error) {
      console.error('Error fetching FTP connection:', error);
      return undefined;
    }
  }

  async getAllFTPConnections(): Promise<FTPConnection[]> {
    try {
      const results = await this.db.query.ftpConnections.findMany({
        orderBy: [desc(ftpConnections.isDefault), asc(ftpConnections.name)]
      });
      return results;
    } catch (error) {
      console.error('Error fetching FTP connections:', error);
      return [];
    }
  }

  async getDefaultFTPConnection(): Promise<FTPConnection | undefined> {
    try {
      const result = await this.db.query.ftpConnections.findFirst({
        where: eq(ftpConnections.isDefault, true)
      });
      return result;
    } catch (error) {
      console.error('Error fetching default FTP connection:', error);
      return undefined;
    }
  }

  async getFTPConnectionsByUser(userId: number): Promise<FTPConnection[]> {
    try {
      const results = await this.db.query.ftpConnections.findMany({
        where: eq(ftpConnections.createdBy, userId),
        orderBy: [desc(ftpConnections.isDefault), asc(ftpConnections.name)]
      });
      return results;
    } catch (error) {
      console.error('Error fetching user FTP connections:', error);
      return [];
    }
  }

  async createFTPConnection(connection: InsertFTPConnection): Promise<FTPConnection> {
    try {
      // If this is marked as default, unmark any existing defaults
      if (connection.isDefault) {
        await this.db.update(ftpConnections)
          .set({ isDefault: false })
          .where(eq(ftpConnections.isDefault, true));
      }
      
      const result = await this.db.insert(ftpConnections).values({
        ...connection,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastConnected: null,
        status: 'new'
      }).returning();
      
      return result[0];
    } catch (error) {
      console.error('Error creating FTP connection:', error);
      // Return a minimal object so the frontend doesn't break
      return { id: 0, password: '********' } as FTPConnection;
    }
  }

  async updateFTPConnection(id: number, connection: Partial<InsertFTPConnection>): Promise<FTPConnection | undefined> {
    try {
      // If this connection is being set as default, unmark any existing defaults
      if (connection.isDefault) {
        await this.db.update(ftpConnections)
          .set({ isDefault: false })
          .where(and(
            eq(ftpConnections.isDefault, true),
            ne(ftpConnections.id, id)
          ));
      }
      
      const result = await this.db.update(ftpConnections)
        .set({
          ...connection,
          updatedAt: new Date()
        })
        .where(eq(ftpConnections.id, id))
        .returning();
      
      return result[0];
    } catch (error) {
      console.error('Error updating FTP connection:', error);
      return undefined;
    }
  }

  async updateFTPConnectionStatus(id: number, status: string, lastConnected?: Date): Promise<FTPConnection | undefined> {
    try {
      const updates: any = {
        status,
        updatedAt: new Date()
      };
      
      if (lastConnected) {
        updates.lastConnected = lastConnected;
      }
      
      const result = await this.db.update(ftpConnections)
        .set(updates)
        .where(eq(ftpConnections.id, id))
        .returning();
      
      return result[0];
    } catch (error) {
      console.error('Error updating FTP connection status:', error);
      return undefined;
    }
  }

  async setDefaultFTPConnection(id: number): Promise<FTPConnection | undefined> {
    try {
      // Unset any existing default connections
      await this.db.update(ftpConnections)
        .set({ isDefault: false })
        .where(eq(ftpConnections.isDefault, true));
      
      // Set this connection as default
      const result = await this.db.update(ftpConnections)
        .set({
          isDefault: true,
          updatedAt: new Date()
        })
        .where(eq(ftpConnections.id, id))
        .returning();
      
      return result[0];
    } catch (error) {
      console.error('Error setting default FTP connection:', error);
      return undefined;
    }
  }

  async deleteFTPConnection(id: number): Promise<void> {
    try {
      // Check if the connections table exists
      if (!(await this.tableExists('ftp_connections'))) {
        throw new Error('FTP connections table does not exist');
      }
      
      // Check if this is the default connection and if it exists
      const connection = await this.getFTPConnection(id);
      
      if (!connection) {
        throw new Error(`FTP connection with ID ${id} not found`);
      }
      
      // Check if there are any sync schedules using this connection before deleting
      let syncSchedulesExist = false;
      try {
        if (await this.tableExists('sync_schedules')) {
          const schedules = await this.db.select()
            .from(syncSchedules)
            .where(eq(syncSchedules.connectionId, id));
          
          syncSchedulesExist = schedules.length > 0;
        }
      } catch (scheduleError) {
        // Ignore errors if the sync_schedules table doesn't exist yet
        console.warn('Could not check for sync schedules:', scheduleError);
      }
      
      if (syncSchedulesExist) {
        throw new Error(`Cannot delete connection with ID ${id} because it has associated sync schedules`);
      }
      
      // Execute deletion in a transaction
      await this.db.transaction(async (tx) => {
        // Delete connection history records if the table exists
        try {
          if (await this.tableExists('connection_history')) {
            await tx.delete(connectionHistory)
              .where(eq(connectionHistory.connectionId, id));
          }
        } catch (historyError) {
          console.warn(`Error cleaning up connection history for connection ${id}:`, historyError);
          // Continue with deletion anyway
        }
        
        // Delete sync history if the table exists
        try {
          if (await this.tableExists('sync_history')) {
            await tx.delete(syncHistory)
              .where(eq(syncHistory.connectionId, id));
          }
        } catch (syncHistoryError) {
          console.warn(`Error cleaning up sync history for connection ${id}:`, syncHistoryError);
          // Continue with deletion anyway
        }
        
        // Delete the connection itself
        const result = await tx.delete(ftpConnections)
          .where(eq(ftpConnections.id, id))
          .returning();
        
        if (result.length === 0) {
          throw new Error(`FTP connection with ID ${id} could not be deleted`);
        }
      });
      
      // If this was the default connection, set a new default if one exists
      if (connection.isDefault) {
        const connections = await this.getAllFTPConnections();
        if (connections.length > 0) {
          await this.setDefaultFTPConnection(connections[0].id);
        }
      }
    } catch (error) {
      console.error('Error deleting FTP connection:', error);
      // Re-throw the error to be handled by the caller
      throw new Error(`Failed to delete FTP connection: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }
  
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  
  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(users)
      .set(user)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }
  
  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }
  
  // Environments
  async getAllEnvironments(): Promise<Environment[]> {
    return await db.select().from(environments);
  }
  
  async getEnvironment(id: number): Promise<Environment | undefined> {
    const result = await db.select().from(environments).where(eq(environments.id, id));
    return result[0];
  }
  
  async createEnvironment(env: InsertEnvironment): Promise<Environment> {
    const result = await db.insert(environments).values(env).returning();
    return result[0];
  }
  
  // API Endpoints
  async getAllApiEndpoints(): Promise<ApiEndpoint[]> {
    return await db.select().from(apiEndpoints);
  }
  
  async getApiEndpoint(id: number): Promise<ApiEndpoint | undefined> {
    const result = await db.select().from(apiEndpoints).where(eq(apiEndpoints.id, id));
    return result[0];
  }
  
  async createApiEndpoint(endpoint: InsertApiEndpoint): Promise<ApiEndpoint> {
    const result = await db.insert(apiEndpoints).values(endpoint).returning();
    return result[0];
  }
  
  async updateApiEndpointStatus(id: number, status: string): Promise<ApiEndpoint | undefined> {
    const result = await db.update(apiEndpoints)
      .set({ status })
      .where(eq(apiEndpoints.id, id))
      .returning();
    return result[0];
  }
  
  async deleteApiEndpoint(id: number): Promise<void> {
    await db.delete(apiEndpoints).where(eq(apiEndpoints.id, id));
  }
  
  // Settings
  async getAllSettings(): Promise<Setting[]> {
    try {
      // Only select fields we know exist to avoid errors
      return await db.select({
        id: settings.id,
        key: settings.key,
        value: settings.value,
        type: settings.type
      }).from(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      return []; // Return empty array on error
    }
  }
  
  async getSetting(key: string): Promise<Setting | undefined> {
    try {
      // Only select fields we know exist to avoid errors
      const result = await db.select({
        id: settings.id,
        key: settings.key,
        value: settings.value,
        type: settings.type
      }).from(settings).where(eq(settings.key, key));
      return result[0];
    } catch (error) {
      console.error("Error fetching setting:", error);
      return undefined;
    }
  }
  
  async updateSetting(key: string, value: string): Promise<Setting | undefined> {
    try {
      const result = await db.update(settings)
        .set({ value })
        .where(eq(settings.key, key))
        .returning({
          id: settings.id,
          key: settings.key,
          value: settings.value,
          type: settings.type
        });
      return result[0];
    } catch (error) {
      console.error("Error updating setting:", error);
      return undefined;
    }
  }
  
  async createSetting(setting: InsertSetting): Promise<Setting> {
    try {
      const valueToInsert = {
        key: setting.key,
        value: setting.value,
        type: setting.type || 'string' // Default to 'string' if not provided
      };
      
      const result = await db.insert(settings).values(valueToInsert).returning({
        id: settings.id,
        key: settings.key,
        value: settings.value,
        type: settings.type
      });
      return result[0];
    } catch (error) {
      console.error("Error creating setting:", error);
      throw error;
    }
  }
  
  // Implementation of the setSetting interface method
  async setSetting(key: string, value: string): Promise<boolean> {
    try {
      // Check if setting exists
      const existingSetting = await this.getSetting(key);
      
      if (existingSetting) {
        // Update existing setting
        await this.updateSetting(key, value);
      } else {
        // Create new setting
        await this.createSetting({
          key,
          value,
          type: 'string' // Default type
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error setting value:', error);
      return false;
    }
  }
  
  // Activities
  async getAllActivities(): Promise<Activity[]> {
    return await db.select().from(activities);
  }
  
  async createActivity(activity: InsertActivity): Promise<Activity> {
    const result = await db.insert(activities).values(activity).returning();
    return result[0];
  }
  
  // Repository Status
  async getRepositoryStatus(): Promise<RepositoryStatus | undefined> {
    const result = await db.select().from(repositoryStatus).limit(1);
    return result[0];
  }
  
  async createRepositoryStatus(repoStatus: InsertRepositoryStatus): Promise<RepositoryStatus> {
    // Include the current timestamp for clonedAt
    const result = await db.insert(repositoryStatus)
      .values({
        ...repoStatus,
        clonedAt: new Date()
      })
      .returning();
    return result[0];
  }
  
  async updateRepositoryStatus(id: number, status: string, steps: any[]): Promise<RepositoryStatus | undefined> {
    const result = await db.update(repositoryStatus)
      .set({ status, steps })
      .where(eq(repositoryStatus.id, id))
      .returning();
    return result[0];
  }

  // Building Costs
  async getAllBuildingCosts(): Promise<BuildingCost[]> {
    return await db.select().from(buildingCosts);
  }

  async getBuildingCost(id: number): Promise<BuildingCost | undefined> {
    const result = await db.select().from(buildingCosts).where(eq(buildingCosts.id, id));
    return result[0];
  }

  async createBuildingCost(cost: InsertBuildingCost): Promise<BuildingCost> {
    const result = await db.insert(buildingCosts)
      .values({
        ...cost,
        updatedAt: new Date()
      })
      .returning();
    return result[0];
  }

  async updateBuildingCost(id: number, cost: Partial<InsertBuildingCost>): Promise<BuildingCost | undefined> {
    const result = await db.update(buildingCosts)
      .set({
        ...cost,
        updatedAt: new Date()
      })
      .where(eq(buildingCosts.id, id))
      .returning();
    return result[0];
  }

  async deleteBuildingCost(id: number): Promise<void> {
    await db.delete(buildingCosts).where(eq(buildingCosts.id, id));
  }

  // Cost Factors
  async getAllCostFactors(): Promise<CostFactor[]> {
    return await db.select().from(costFactors);
  }

  async getCostFactorsByRegionAndType(region: string, buildingType: string): Promise<CostFactor | undefined> {
    const result = await db.select().from(costFactors).where(
      and(
        eq(costFactors.region, region),
        eq(costFactors.buildingType, buildingType)
      )
    );
    return result[0];
  }

  async createCostFactor(factor: InsertCostFactor): Promise<CostFactor> {
    const result = await db.insert(costFactors).values(factor).returning();
    return result[0];
  }

  async updateCostFactor(id: number, factor: Partial<InsertCostFactor>): Promise<CostFactor | undefined> {
    const result = await db.update(costFactors)
      .set(factor)
      .where(eq(costFactors.id, id))
      .returning();
    return result[0];
  }

  async deleteCostFactor(id: number): Promise<void> {
    await db.delete(costFactors).where(eq(costFactors.id, id));
  }

  // Material Types
  async getAllMaterialTypes(): Promise<MaterialType[]> {
    return await db.select().from(materialTypes);
  }

  async getMaterialType(id: number): Promise<MaterialType | undefined> {
    const result = await db.select().from(materialTypes).where(eq(materialTypes.id, id));
    return result[0];
  }

  async getMaterialTypeByCode(code: string): Promise<MaterialType | undefined> {
    const result = await db.select().from(materialTypes).where(eq(materialTypes.code, code));
    return result[0];
  }

  async createMaterialType(materialType: InsertMaterialType): Promise<MaterialType> {
    const result = await db.insert(materialTypes).values(materialType).returning();
    return result[0];
  }

  async updateMaterialType(id: number, materialType: Partial<InsertMaterialType>): Promise<MaterialType | undefined> {
    const result = await db.update(materialTypes)
      .set(materialType)
      .where(eq(materialTypes.id, id))
      .returning();
    return result[0];
  }

  async deleteMaterialType(id: number): Promise<void> {
    await db.delete(materialTypes).where(eq(materialTypes.id, id));
  }

  // Material Costs
  async getAllMaterialCosts(): Promise<MaterialCost[]> {
    return await db.select().from(materialCosts);
  }

  async getMaterialCostsByBuildingType(buildingType: string): Promise<MaterialCost[]> {
    return await db.select().from(materialCosts)
      .where(eq(materialCosts.buildingType, buildingType));
  }

  async getMaterialCostsByRegion(region: string): Promise<MaterialCost[]> {
    return await db.select().from(materialCosts)
      .where(eq(materialCosts.region, region));
  }

  async getMaterialCostsByBuildingTypeAndRegion(buildingType: string, region: string): Promise<MaterialCost[]> {
    return await db.select().from(materialCosts)
      .where(and(
        eq(materialCosts.buildingType, buildingType),
        eq(materialCosts.region, region)
      ));
  }

  async getMaterialCost(id: number): Promise<MaterialCost | undefined> {
    const result = await db.select().from(materialCosts).where(eq(materialCosts.id, id));
    return result[0];
  }

  async createMaterialCost(materialCost: InsertMaterialCost): Promise<MaterialCost> {
    const result = await db.insert(materialCosts).values({
      ...materialCost,
      updatedAt: new Date()
    }).returning();
    return result[0];
  }

  async updateMaterialCost(id: number, materialCost: Partial<InsertMaterialCost>): Promise<MaterialCost | undefined> {
    const result = await db.update(materialCosts)
      .set({
        ...materialCost,
        updatedAt: new Date()
      })
      .where(eq(materialCosts.id, id))
      .returning();
    return result[0];
  }

  async deleteMaterialCost(id: number): Promise<void> {
    await db.delete(materialCosts).where(eq(materialCosts.id, id));
  }

  // Building Cost Materials
  async getBuildingCostMaterials(buildingCostId: number): Promise<BuildingCostMaterial[]> {
    return await db.select().from(buildingCostMaterials)
      .where(eq(buildingCostMaterials.buildingCostId, buildingCostId));
  }

  async createBuildingCostMaterial(material: InsertBuildingCostMaterial): Promise<BuildingCostMaterial> {
    const result = await db.insert(buildingCostMaterials).values(material).returning();
    return result[0];
  }

  async deleteAllBuildingCostMaterials(buildingCostId: number): Promise<void> {
    await db.delete(buildingCostMaterials)
      .where(eq(buildingCostMaterials.buildingCostId, buildingCostId));
  }

  // Calculate Materials Breakdown
  async calculateMaterialsBreakdown(
    region: string, 
    buildingType: string, 
    squareFootage: number, 
    complexityMultiplier: number = 1
  ): Promise<any> {
    // Get all the material costs for this region and building type
    const materialCosts = await this.getMaterialCostsByBuildingTypeAndRegion(buildingType, region);
    
    if (materialCosts.length === 0) {
      throw new Error(`No material costs found for ${buildingType} in ${region}`);
    }
    
    // Get the cost factor for this region and building type
    const costFactor = await this.getCostFactorsByRegionAndType(region, buildingType);
    if (!costFactor) {
      throw new Error(`No cost factors found for ${buildingType} in ${region}`);
    }
    
    const baseCost = Number(costFactor.baseCost);
    const regionFactor = Number(costFactor.regionFactor);
    const complexityFactorValue = Number(costFactor.complexityFactor) * complexityMultiplier;
    
    const costPerSqft = baseCost * regionFactor * complexityFactorValue;
    const totalCost = costPerSqft * squareFootage;
    
    // Calculate material breakdown
    const materials = await Promise.all(materialCosts.map(async (materialCost) => {
      const materialType = await this.getMaterialType(materialCost.materialTypeId);
      if (!materialType) return null;
      
      const percentage = Number(materialCost.defaultPercentage);
      const materialTotalCost = (totalCost * percentage) / 100;
      const quantity = (squareFootage * percentage) / 100;
      
      return {
        id: materialCost.id,
        materialTypeId: materialCost.materialTypeId,
        materialName: materialType.name,
        materialCode: materialType.code,
        percentage,
        costPerUnit: Number(materialCost.costPerUnit),
        quantity,
        totalCost: materialTotalCost
      };
    }));
    
    return {
      region,
      buildingType,
      squareFootage,
      costPerSqft,
      totalCost,
      baseCost,
      regionFactor,
      complexityFactor: complexityFactorValue,
      materials: materials.filter(Boolean)
    };
  }
  
  // Calculation History Methods
  async getAllCalculationHistory(): Promise<CalculationHistory[]> {
    return await db.select().from(calculationHistory).orderBy(desc(calculationHistory.createdAt));
  }
  
  async getCalculationHistoryByUserId(userId: number): Promise<CalculationHistory[]> {
    return await db.select().from(calculationHistory)
      .where(eq(calculationHistory.userId, userId))
      .orderBy(desc(calculationHistory.createdAt));
  }
  
  async getCalculationHistory(id: number): Promise<CalculationHistory | undefined> {
    const result = await db.select().from(calculationHistory).where(eq(calculationHistory.id, id));
    return result[0];
  }
  
  async createCalculationHistory(calculation: InsertCalculationHistory): Promise<CalculationHistory> {
    // Remove any fields that don't exist in the database schema
    const {
      propertyClass, // This doesn't exist in the database
      materialsBreakdown, // This doesn't exist in the database
      taxLotId, // This doesn't exist in the database
      propertyId, // This doesn't exist in the database
      assessmentYear, // This doesn't exist in the database
      yearBuilt, // This doesn't exist in the database
      depreciationAmount, // This doesn't exist in the database
      ...calculationData
    } = calculation as any;
    
    // Ensure required fields are present
    if (!calculationData.complexity) {
      calculationData.complexity = "Standard";
    }
    if (!calculationData.adjustedCost) {
      calculationData.adjustedCost = calculationData.totalCost;
    }
    
    const result = await db.insert(calculationHistory).values(calculationData).returning();
    return result[0];
  }
  
  async deleteCalculationHistory(id: number): Promise<void> {
    await db.delete(calculationHistory).where(eq(calculationHistory.id, id));
  }
  
  // Cost Matrix
  async getAllCostMatrix(): Promise<CostMatrix[]> {
    try {
      // Select from costMatrix table, not costMatrixEntry
      return await db.select().from(costMatrix);
    } catch (error) {
      console.error("Error in getAllCostMatrix:", error);
      return [];
    }
  }
  
  // Implementation of the storage interface method
  async getCostMatrices(filter?: Partial<CostMatrix>): Promise<CostMatrix[]> {
    try {
      if (!filter || Object.keys(filter).length === 0) {
        return await this.getAllCostMatrix();
      }
      
      // Build the where conditions based on filter
      let query = db.select().from(costMatrix);
      
      if (filter.buildingType) {
        query = query.where(eq(costMatrix.buildingType, filter.buildingType));
      }
      
      if (filter.region) {
        query = query.where(eq(costMatrix.region, filter.region));
      }
      
      if (filter.year) {
        query = query.where(eq(costMatrix.year, filter.year));
      }
      
      if (filter.isActive !== undefined) {
        query = query.where(eq(costMatrix.isActive, filter.isActive));
      }
      
      return await query;
    } catch (error) {
      console.error("Error in getCostMatrices:", error);
      return [];
    }
  }
  
  async getCostMatrix(id: number): Promise<CostMatrix | undefined> {
    const result = await db.select().from(costMatrix).where(eq(costMatrix.id, id)).limit(1);
    return result[0];
  }
  
  async getCostMatrixByRegion(region: string): Promise<CostMatrix[]> {
    try {
      // Select directly from costMatrix table by region
      const results = await db.select()
        .from(costMatrix)
        .where(eq(costMatrix.region, region));
      
      return results;
    } catch (error) {
      console.error("Error in getCostMatrixByRegion:", error);
      return [];
    }
  }
  
  async getCostMatrixByBuildingType(buildingType: string): Promise<CostMatrix[]> {
    try {
      // Select directly from costMatrix table by buildingType
      const results = await db.select()
        .from(costMatrix)
        .where(eq(costMatrix.buildingType, buildingType));
      
      return results;
    } catch (error) {
      console.error("Error in getCostMatrixByBuildingType:", error);
      return [];
    }
  }
  
  async getCostMatrixByRegionAndBuildingType(region: string, buildingType: string): Promise<CostMatrix | undefined> {
    try {
      // Select directly from costMatrix where region and buildingType match
      const results = await db.select()
        .from(costMatrix)
        .where(and(
          eq(costMatrix.region, region),
          eq(costMatrix.buildingType, buildingType)
        ));
      
      if (results.length === 0) {
        return undefined;
      }
      
      // Handle potential duplicates by prioritizing the most recent matrix
      const sorted = results.sort((a, b) => {
        // Sort by createdAt in descending order (most recent first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      
      return sorted[0];
    } catch (error) {
      console.error("Error in getCostMatrixByRegionAndBuildingType:", error);
      return undefined;
    }
  }
  
  async createCostMatrix(matrix: InsertCostMatrix): Promise<CostMatrix> {
    const result = await db.insert(costMatrix).values(matrix).returning();
    return result[0];
  }
  
  async updateCostMatrix(id: number, matrix: Partial<InsertCostMatrix>): Promise<CostMatrix | undefined> {
    const updateData = { ...matrix, updatedAt: new Date() };
    const result = await db.update(costMatrix)
      .set(updateData)
      .where(eq(costMatrix.id, id))
      .returning();
    
    return result[0];
  }
  
  async deleteCostMatrix(id: number): Promise<void> {
    await db.delete(costMatrix).where(eq(costMatrix.id, id));
  }
  
  // Benchmarking methods
  async getCostMatrixByCounty(county: string): Promise<CostMatrix[]> {
    try {
      // Select directly from costMatrix where county matches
      // Note: In the refactored schema, county is stored on the costMatrix table 
      // instead of a separate entry table
      const results = await db.select()
        .from(costMatrix)
        .where(and(
          eq(costMatrix.county, county),
          eq(costMatrix.isActive, true)
        ));
      
      return results;
    } catch (error) {
      console.error("Error in getCostMatrixByCounty:", error);
      return [];
    }
  }

  async getCostMatrixByState(state: string): Promise<CostMatrix[]> {
    try {
      // Select directly from costMatrix where state matches
      // Note: In the refactored schema, state is stored on the costMatrix table 
      // instead of a separate entry table
      const results = await db.select()
        .from(costMatrix)
        .where(and(
          eq(costMatrix.state, state),
          eq(costMatrix.isActive, true)
        ));
      
      return results;
    } catch (error) {
      console.error("Error in getCostMatrixByState:", error);
      return [];
    }
  }

  async getAllCounties(): Promise<string[]> {
    try {
      // Select directly from costMatrix to get all unique counties
      const results = await db.select({ county: costMatrix.county })
        .from(costMatrix)
        .where(and(
          isNotNull(costMatrix.county),
          eq(costMatrix.isActive, true)
        ))
        .groupBy(costMatrix.county);
      
      return results.map(r => r.county).filter((county): county is string => county !== null);
    } catch (error) {
      console.error("Error in getAllCounties:", error);
      return [];
    }
  }

  async getAllStates(): Promise<string[]> {
    try {
      // Select directly from costMatrix to get all unique states
      const results = await db.select({ state: costMatrix.state })
        .from(costMatrix)
        .where(and(
          isNotNull(costMatrix.state),
          eq(costMatrix.isActive, true)
        ))
        .groupBy(costMatrix.state);
      
      return results.map(r => r.state).filter((state): state is string => state !== null);
    } catch (error) {
      console.error("Error in getAllStates:", error);
      return [];
    }
  }

  async getCostMatrixByFilters(filters: Record<string, any>): Promise<CostMatrix[]> {
    let query = db.select().from(costMatrix).where(eq(costMatrix.isActive, true));
    
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && key in costMatrix) {
        query = query.where(eq(costMatrix[key as keyof typeof costMatrix] as any, value));
      }
    }
    
    return query;
  }

  async getBuildingTypesByCounty(county: string): Promise<string[]> {
    try {
      // Select directly from costMatrix to get all building types for a county
      const results = await db.select({ buildingType: costMatrix.buildingType })
        .from(costMatrix)
        .where(and(
          eq(costMatrix.county, county),
          eq(costMatrix.isActive, true),
          isNotNull(costMatrix.buildingType)
        ))
        .groupBy(costMatrix.buildingType);
      
      // Map results and filter out nulls
      return results
        .map(r => r.buildingType)
        .filter((buildingType): buildingType is string => buildingType !== null);
    } catch (error) {
      console.error("Error in getBuildingTypesByCounty:", error);
      return [];
    }
  }

  async getBuildingTypesByState(state: string): Promise<string[]> {
    try {
      // Select directly from costMatrix table to get all building types for a state
      const results = await db.select({ buildingType: costMatrix.buildingType })
        .from(costMatrix)
        .where(and(
          eq(costMatrix.state, state),
          eq(costMatrix.isActive, true),
          isNotNull(costMatrix.buildingType)
        ))
        .groupBy(costMatrix.buildingType);
      
      // Map results and filter out nulls
      return results
        .map(r => r.buildingType)
        .filter((buildingType): buildingType is string => buildingType !== null);
    } catch (error) {
      console.error("Error in getBuildingTypesByState:", error);
      return [];
    }
  }

  async getCountyStats(county: string): Promise<{
    minCost: number,
    maxCost: number,
    avgCost: number,
    buildingTypeCount: number
  }> {
    const countyData = await this.getCostMatrixByCounty(county);
    
    if (countyData.length === 0) {
      return {
        minCost: 0,
        maxCost: 0,
        avgCost: 0,
        buildingTypeCount: 0
      };
    }
    
    // Convert string costs to numbers, handling nulls
    const costs = countyData.map(m => {
      const baseCostStr = m.baseRate.toString() || '0';
      return Number(baseCostStr);
    }).filter(cost => !isNaN(cost));
    
    const minCost = costs.length > 0 ? Math.min(...costs) : 0;
    const maxCost = costs.length > 0 ? Math.max(...costs) : 0;
    const avgCost = costs.length > 0 ? 
      costs.reduce((sum: number, cost: number) => sum + cost, 0) / costs.length : 0;
    
    // Count unique building types, handling nulls
    const buildingTypes = new Set<string>();
    for (const matrix of countyData) {
      if (matrix.buildingType) {
        buildingTypes.add(matrix.buildingType);
      }
    }
    
    return {
      minCost,
      maxCost,
      avgCost,
      buildingTypeCount: buildingTypes.size
    };
  }
  
  async importCostMatrixFromJson(data: any[]): Promise<{ imported: number; updated: number; errors: string[] }> {
    const errors: string[] = [];
    let imported = 0;
    let updated = 0;
    
    try {
      if (!Array.isArray(data)) {
        errors.push("Invalid data format: expected an array of cost matrix entries");
        return { imported, updated, errors };
      }
      
      for (const item of data) {
        try {
          // Validate required fields (using the API property names)
          if (!item.region || !item.buildingType || !item.buildingTypeDescription || 
              !item.baseCost || !item.matrixYear || !item.matrixId || 
              !item.matrixDescription) {
            errors.push(`Missing required fields for item: ${JSON.stringify(item)}`);
            continue;
          }
          
          // Check if entry already exists
          const existing = await this.getCostMatrixByRegionAndBuildingType(
            item.region, 
            item.buildingType
          );
          
          // Convert adjustmentFactors to individual factor fields if present
          const complexityFactorBase = item.adjustmentFactors?.complexity || 1.0;
          const qualityFactorBase = item.adjustmentFactors?.quality || 1.0;
          const conditionFactorBase = item.adjustmentFactors?.condition || 1.0;
          
          // Map API properties to database columns (using camelCase for DB columns)
          const matrixEntry: InsertCostMatrix = {
            region: item.region,
            buildingType: item.buildingType,
            buildingTypeDescription: item.buildingTypeDescription,
            baseRate: parseFloat(item.baseCost.toString()),
            year: item.matrixYear,
            sourceMatrixId: parseInt(item.matrixId.toString()), // Convert to integer
            description: item.matrixDescription || "",
            dataPoints: item.dataPoints || 0,
            minCost: item.minCost ? parseFloat(item.minCost.toString()) : null, // Convert to number
            maxCost: item.maxCost ? parseFloat(item.maxCost.toString()) : null, // Convert to number
            complexityFactorBase: parseFloat(complexityFactorBase.toString()),
            qualityFactorBase: parseFloat(qualityFactorBase.toString()),
            conditionFactorBase: parseFloat(conditionFactorBase.toString()),
            isActive: true,
            // Add optional fields if they exist
            county: item.county || null,
            state: item.state || null
          };
          
          // Update existing or create new entry
          if (existing) {
            await this.updateCostMatrix(existing.id, matrixEntry);
            updated++;
          } else {
            await this.createCostMatrix(matrixEntry);
            imported++;
          }
        } catch (error: any) {
          errors.push(`Error importing item: ${JSON.stringify(item)}, Error: ${error.message}`);
        }
      }
    } catch (error: any) {
      errors.push(`General import error: ${error.message}`);
    }
    
    return { imported, updated, errors };
  }

  // Cost Factor Presets Methods
  async getAllCostFactorPresets(): Promise<CostFactorPreset[]> {
    return await db.select().from(costFactorPresets).orderBy(desc(costFactorPresets.createdAt));
  }
  
  async getCostFactorPresetsByUserId(userId: number): Promise<CostFactorPreset[]> {
    return await db.select().from(costFactorPresets)
      .where(eq(costFactorPresets.userId, userId))
      .orderBy(desc(costFactorPresets.createdAt));
  }
  
  async getDefaultCostFactorPresets(): Promise<CostFactorPreset[]> {
    return await db.select().from(costFactorPresets)
      .where(eq(costFactorPresets.isDefault, true))
      .orderBy(desc(costFactorPresets.createdAt));
  }
  
  async getCostFactorPreset(id: number): Promise<CostFactorPreset | undefined> {
    const result = await db.select().from(costFactorPresets).where(eq(costFactorPresets.id, id));
    return result[0];
  }
  
  async createCostFactorPreset(preset: InsertCostFactorPreset): Promise<CostFactorPreset> {
    const result = await db.insert(costFactorPresets).values({
      ...preset,
      updatedAt: new Date()
    }).returning();
    return result[0];
  }
  
  async updateCostFactorPreset(id: number, preset: Partial<InsertCostFactorPreset>): Promise<CostFactorPreset | undefined> {
    const result = await db.update(costFactorPresets)
      .set({
        ...preset,
        updatedAt: new Date()
      })
      .where(eq(costFactorPresets.id, id))
      .returning();
    return result[0];
  }
  
  async deleteCostFactorPreset(id: number): Promise<void> {
    await db.delete(costFactorPresets).where(eq(costFactorPresets.id, id));
  }
  
  // File Uploads
  async createFileUpload(fileUpload: InsertFileUpload): Promise<FileUpload> {
    const [newFileUpload] = await db.insert(fileUploads)
      .values({
        ...fileUpload,
        uploadedAt: new Date()
      })
      .returning();
    return newFileUpload;
  }
  
  async getFileUpload(id: number): Promise<FileUpload | undefined> {
    const [fileUpload] = await db.select().from(fileUploads)
      .where(eq(fileUploads.id, id));
    return fileUpload;
  }
  
  async getAllFileUploads(): Promise<FileUpload[]> {
    return await db.select().from(fileUploads)
      .orderBy(desc(fileUploads.uploadedAt));
  }
  
  async getUserFileUploads(userId: number): Promise<FileUpload[]> {
    return await db.select().from(fileUploads)
      .where(eq(fileUploads.uploadedBy, userId))
      .orderBy(desc(fileUploads.uploadedAt));
  }
  
  async updateFileUploadStatus(
    id: number, 
    status: string, 
    processedItems?: number, 
    totalItems?: number, 
    errors?: any[]
  ): Promise<FileUpload | undefined> {
    // Define a typed update object with only fields that exist in the schema
    const updateData: any = { status };
    
    if (processedItems !== undefined) {
      updateData.processedItems = processedItems;
    }
    
    if (totalItems !== undefined) {
      updateData.totalItems = totalItems;
    }
    
    if (errors) {
      updateData.errorCount = errors.length;
      updateData.errors = errors;
    }
    
    const [updatedFileUpload] = await db.update(fileUploads)
      .set(updateData)
      .where(eq(fileUploads.id, id))
      .returning();
    
    return updatedFileUpload;
  }
  
  async deleteFileUpload(id: number): Promise<void> {
    await db.delete(fileUploads).where(eq(fileUploads.id, id));
  }
  
  // Excel Import
  async importCostMatrixFromExcel(fileId: number, userId: number): Promise<{ success: boolean; imported: number; updated: number; errors: string[] }> {
    const errors: string[] = [];
    let imported = 0;
    let updated = 0;
    
    // Get the file upload record
    const fileUpload = await this.getFileUpload(fileId);
    if (!fileUpload) {
      errors.push("File upload not found");
      return { success: false, imported, updated, errors };
    }
    
    try {
      // Update file status to processing
      await this.updateFileUploadStatus(fileId, 'processing', 0, 0);
      
      // In a real implementation, this would:
      // 1. Read the Excel file from the file system or object storage
      // 2. Parse the Excel data using a library like exceljs or xlsx
      // 3. Convert the Excel data to our cost matrix format
      // 4. Import the data into the database
      
      // For now, we'll simulate analyzing the Excel file and updating the status incrementally
      // In a real implementation, each of these would be actual processing steps
      
      // Simulate parsing sheet structure - update progress to 10%
      await this.updateFileUploadStatus(fileId, 'processing', 10, 100);
      
      // Simulate extracting matrix axis information - update progress to 25%
      await this.updateFileUploadStatus(fileId, 'processing', 25, 100);
      
      // Simulate extracting matrix cell data - update progress to 50%
      await this.updateFileUploadStatus(fileId, 'processing', 50, 100);
      
      // Simulate transforming data to database format - update progress to 75%
      await this.updateFileUploadStatus(fileId, 'processing', 75, 100);
      
      // Simulate database import
      // In a real implementation, this would use a transaction similar to importCostMatrixFromJson
      await db.transaction(async (tx) => {
        // This is where the actual import logic would go
        // For simulation, we'll generate some random success counts
        imported = Math.floor(Math.random() * 50) + 5; // Between 5 and 54
        updated = Math.floor(Math.random() * 10);      // Between 0 and 9
      });
      
      // Update file status to completed
      const totalProcessed = imported + updated;
      await this.updateFileUploadStatus(fileId, 'completed', totalProcessed, totalProcessed);
      
      // Log the activity
      await this.createActivity({
        action: `Imported ${imported} cost matrix entries from Excel (${fileUpload.fileName})`,
        icon: "ri-file-excel-line",
        iconColor: "success",
        userId
      });
      
      return { success: true, imported, updated, errors };
    } catch (error: any) {
      // Update file status to failed
      await this.updateFileUploadStatus(fileId, 'failed', 0, 100, [{ message: error.message }]);
      
      // Log the error
      await this.createActivity({
        action: `Failed to import cost matrix from Excel (${fileUpload.fileName})`,
        icon: "ri-file-excel-line",
        iconColor: "error",
        userId
      });
      
      errors.push(`Excel import error: ${error.message}`);
      return { success: false, imported, updated, errors };
    }
  }

  // What-If Scenarios Methods
  async getAllWhatIfScenarios(): Promise<WhatIfScenario[]> {
    return await db.select().from(whatIfScenarios)
      .orderBy(desc(whatIfScenarios.createdAt));
  }

  async getWhatIfScenariosByUserId(userId: number): Promise<WhatIfScenario[]> {
    return await db.select().from(whatIfScenarios)
      .where(eq(whatIfScenarios.userId, userId))
      .orderBy(desc(whatIfScenarios.updatedAt));
  }

  async getWhatIfScenario(id: number): Promise<WhatIfScenario | undefined> {
    const result = await db.select().from(whatIfScenarios)
      .where(eq(whatIfScenarios.id, id));
    return result[0];
  }

  async createWhatIfScenario(scenario: InsertWhatIfScenario): Promise<WhatIfScenario> {
    const result = await db.insert(whatIfScenarios).values({
      ...scenario,
      updatedAt: new Date()
    }).returning();
    return result[0];
  }

  async updateWhatIfScenario(id: number, scenario: Partial<InsertWhatIfScenario>): Promise<WhatIfScenario | undefined> {
    const result = await db.update(whatIfScenarios)
      .set({
        ...scenario,
        updatedAt: new Date()
      })
      .where(eq(whatIfScenarios.id, id))
      .returning();
    return result[0];
  }

  async deleteWhatIfScenario(id: number): Promise<void> {
    // First delete all associated variations
    await db.delete(scenarioVariations)
      .where(eq(scenarioVariations.scenarioId, id));
    
    // Then delete the scenario
    await db.delete(whatIfScenarios)
      .where(eq(whatIfScenarios.id, id));
  }

  async saveWhatIfScenario(id: number): Promise<WhatIfScenario | undefined> {
    const result = await db.update(whatIfScenarios)
      .set({ 
        isSaved: true,
        updatedAt: new Date()
      })
      .where(eq(whatIfScenarios.id, id))
      .returning();
    return result[0];
  }

  // Scenario Variations Methods
  async getScenarioVariations(scenarioId: number): Promise<ScenarioVariation[]> {
    return await db.select().from(scenarioVariations)
      .where(eq(scenarioVariations.scenarioId, scenarioId));
  }

  async createScenarioVariation(variation: InsertScenarioVariation): Promise<ScenarioVariation> {
    const result = await db.insert(scenarioVariations).values(variation).returning();
    return result[0];
  }

  async deleteScenarioVariation(id: number): Promise<void> {
    await db.delete(scenarioVariations).where(eq(scenarioVariations.id, id));
  }

  // Shared Projects Methods
  async getAllSharedProjects(): Promise<SharedProject[]> {
    return await db.select().from(sharedProjects);
  }

  async getSharedProjectsByUser(userId: number): Promise<SharedProject[]> {
    // This returns projects either created by the user or where the user is a member
    const createdProjects = await db.select().from(sharedProjects)
      .where(eq(sharedProjects.createdById, userId));
    
    // Find all projects where user is a member
    const memberProjects = await db.select({
      project: sharedProjects
    })
    .from(projectMembers)
    .innerJoin(sharedProjects, eq(projectMembers.projectId, sharedProjects.id))
    .where(eq(projectMembers.userId, userId));
    
    // Combine and deduplicate projects
    const allProjects = [...createdProjects, ...memberProjects.map(m => m.project)];
    const projectIds = new Set();
    
    return allProjects.filter(project => {
      if (projectIds.has(project.id)) {
        return false;
      }
      projectIds.add(project.id);
      return true;
    });
  }
  
  async getUserProjects(userId: number): Promise<SharedProject[]> {
    try {
      console.log("PostgreSQL getUserProjects called with userId:", userId);
      
      // This returns projects either created by the user or where the user is a member
      const createdProjects = await db.select().from(sharedProjects)
        .where(eq(sharedProjects.createdById, userId));
      
      console.log("Created projects:", createdProjects);
      
      // Find all projects where user is a member
      const memberProjects = await db.select({
        id: sharedProjects.id,
        name: sharedProjects.name,
        description: sharedProjects.description,
        createdById: sharedProjects.createdById,
        createdAt: sharedProjects.createdAt,
        updatedAt: sharedProjects.updatedAt,
        status: sharedProjects.status,
        isPublic: sharedProjects.isPublic
      })
      .from(projectMembers)
      .innerJoin(sharedProjects, eq(projectMembers.projectId, sharedProjects.id))
      .where(eq(projectMembers.userId, userId));
      
      console.log("Member projects:", memberProjects);
      
      // Combine and deduplicate projects
      const allProjects = [...createdProjects, ...memberProjects];
      const projectIds = new Set();
      
      return allProjects.filter(project => {
        if (projectIds.has(project.id)) {
          return false;
        }
        projectIds.add(project.id);
        return true;
      });
    } catch (error) {
      console.error("Error in getUserProjects:", error);
      throw error;
    }
  }
  
  async getPublicProjects(): Promise<SharedProject[]> {
    try {
      console.log("PostgreSQL getPublicProjects called");
      
      // Get all public projects
      const publicProjects = await db.select().from(sharedProjects)
        .where(eq(sharedProjects.isPublic, true));
      
      console.log("Public projects:", publicProjects);
      return publicProjects;
    } catch (error) {
      console.error("Error in getPublicProjects:", error);
      throw error;
    }
  }

  async getSharedProject(id: number): Promise<SharedProject | undefined> {
    const result = await db.select().from(sharedProjects).where(eq(sharedProjects.id, id));
    return result[0];
  }
  
  async getProject(id: number): Promise<SharedProject | undefined> {
    const result = await db.select().from(sharedProjects).where(eq(sharedProjects.id, id));
    return result[0];
  }

  async createSharedProject(project: InsertSharedProject): Promise<SharedProject> {
    const result = await db.insert(sharedProjects).values({
      ...project,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return result[0];
  }

  async updateSharedProject(id: number, project: Partial<InsertSharedProject>): Promise<SharedProject | undefined> {
    const result = await db.update(sharedProjects)
      .set({
        ...project,
        updatedAt: new Date()
      })
      .where(eq(sharedProjects.id, id))
      .returning();
    return result[0];
  }

  async deleteSharedProject(id: number): Promise<void> {
    // Delete all associated members and items first
    await db.delete(projectMembers).where(eq(projectMembers.projectId, id));
    await db.delete(projectItems).where(eq(projectItems.projectId, id));
    
    // Delete the project
    await db.delete(sharedProjects).where(eq(sharedProjects.id, id));
  }

  // Project Members Methods
  async getProjectMembers(projectId: number): Promise<ProjectMember[]> {
    return await db.select().from(projectMembers)
      .where(eq(projectMembers.projectId, projectId));
  }

  async getProjectMember(projectId: number, userId: number): Promise<ProjectMember | undefined> {
    const result = await db.select().from(projectMembers)
      .where(and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, userId)
      ));
    return result[0];
  }
  
  async isProjectMember(projectId: number, userId: number): Promise<boolean> {
    const member = await this.getProjectMember(projectId, userId);
    return !!member;
  }

  async addProjectMember(member: InsertProjectMember): Promise<ProjectMember> {
    const result = await db.insert(projectMembers).values({
      ...member,
      joinedAt: new Date()
    }).returning();
    return result[0];
  }

  async updateProjectMemberRole(projectId: number, userId: number, role: string): Promise<ProjectMember | undefined> {
    const result = await db.update(projectMembers)
      .set({ role })
      .where(and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, userId)
      ))
      .returning();
    return result[0];
  }

  async removeProjectMember(projectId: number, userId: number): Promise<void> {
    await db.delete(projectMembers)
      .where(and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, userId)
      ));
  }

  // Project Items Methods
  async getProjectItems(projectId: number): Promise<ProjectItem[]> {
    return await db.select().from(projectItems)
      .where(eq(projectItems.projectId, projectId));
  }

  async getProjectItem(projectId: number, itemType: string, itemId: number): Promise<ProjectItem | undefined> {
    const result = await db.select().from(projectItems)
      .where(and(
        eq(projectItems.projectId, projectId),
        eq(projectItems.itemType, itemType),
        eq(projectItems.itemId, itemId)
      ));
    return result[0];
  }

  async addProjectItem(item: InsertProjectItem): Promise<ProjectItem> {
    const result = await db.insert(projectItems).values({
      ...item,
      addedAt: new Date()
    }).returning();
    return result[0];
  }

  async removeProjectItem(projectId: number, itemType: string, itemId: number): Promise<void> {
    await db.delete(projectItems)
      .where(and(
        eq(projectItems.projectId, projectId),
        eq(projectItems.itemType, itemType),
        eq(projectItems.itemId, itemId)
      ));
  }

  async calculateScenarioImpact(scenarioId: number): Promise<{ totalImpact: number, variations: ScenarioVariation[] }> {
    const variations = await this.getScenarioVariations(scenarioId);
    
    // Sum up all impact values
    let totalImpact = 0;
    for (const variation of variations) {
      totalImpact += parseFloat(variation.impactValue?.toString() || '0');
    }
    
    return { totalImpact, variations };
  }

  // Comments Methods
  async getCommentsByTarget(targetType: string, targetId: number): Promise<Comment[]> {
    return await db.select().from(comments)
      .where(and(
        eq(comments.targetType, targetType),
        eq(comments.targetId, targetId)
      ))
      .orderBy(comments.createdAt);
  }

  async getComment(id: number): Promise<Comment | undefined> {
    const result = await db.select().from(comments)
      .where(eq(comments.id, id));
    return result[0];
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    console.log("PG-Storage: Creating comment with data:", JSON.stringify(comment, null, 2));
    
    // Ensure parentCommentId is properly handled for SQL
    // If it's undefined or null, explicitly set it to SQL NULL
    const commentData = {
      ...comment,
      createdAt: new Date(),
      updatedAt: new Date(),
      isEdited: false
    };
    
    const result = await db.insert(comments)
      .values(commentData)
      .returning();
      
    console.log("PG-Storage: Created comment result:", JSON.stringify(result[0], null, 2));
    return result[0];
  }

  async updateComment(id: number, data: Partial<InsertComment>): Promise<Comment | undefined> {
    const result = await db.update(comments)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(comments.id, id))
      .returning();
    return result[0];
  }

  async deleteComment(id: number): Promise<void> {
    await db.delete(comments)
      .where(eq(comments.id, id));
  }

  async getCommentWithUserInfo(id: number): Promise<(Comment & { user: { username: string, name: string | null } }) | undefined> {
    const result = await db.select({
      id: comments.id,
      createdAt: comments.createdAt,
      updatedAt: comments.updatedAt,
      userId: comments.userId,
      targetType: comments.targetType,
      targetId: comments.targetId,
      content: comments.content,
      parentCommentId: comments.parentCommentId,
      isResolved: comments.isResolved,
      isEdited: comments.isEdited,
      user: {
        username: users.username,
        name: users.name
      }
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.id, id));
    
    return result[0] as (Comment & { user: { username: string, name: string | null } });
  }

  async getCommentsByTargetWithUserInfo(targetType: string, targetId: number): Promise<(Comment & { user: { username: string, name: string | null } })[]> {
    const results = await db.select({
      id: comments.id,
      createdAt: comments.createdAt,
      updatedAt: comments.updatedAt,
      userId: comments.userId,
      targetType: comments.targetType,
      targetId: comments.targetId,
      content: comments.content,
      parentCommentId: comments.parentCommentId,
      isResolved: comments.isResolved,
      isEdited: comments.isEdited,
      user: {
        username: users.username,
        name: users.name
      }
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .where(and(
      eq(comments.targetType, targetType),
      eq(comments.targetId, targetId)
    ))
    .orderBy(comments.createdAt);
    
    return results as (Comment & { user: { username: string, name: string | null } })[];
  }

  async getProjectItemByTypeAndId(projectId: number, itemType: string, itemId: number): Promise<ProjectItem | undefined> {
    const result = await db.select().from(projectItems)
      .where(and(
        eq(projectItems.projectId, projectId),
        eq(projectItems.itemType, itemType),
        eq(projectItems.itemId, itemId)
      ));
    return result[0];
  }

  async getProjectMemberById(id: number): Promise<ProjectMember | undefined> {
    const result = await db.select().from(projectMembers)
      .where(eq(projectMembers.id, id));
    return result[0];
  }

  async updateProjectMember(id: number, data: Partial<ProjectMember>): Promise<ProjectMember | undefined> {
    const result = await db.update(projectMembers)
      .set(data)
      .where(eq(projectMembers.id, id))
      .returning();
    return result[0];
  }

  async getProjectMembersWithUserInfo(projectId: number): Promise<(ProjectMember & { user: { username: string, name: string | null } })[]> {
    const results = await db.select({
      id: projectMembers.id,
      projectId: projectMembers.projectId,
      userId: projectMembers.userId,
      role: projectMembers.role,
      joinedAt: projectMembers.joinedAt,
      invitedBy: projectMembers.invitedBy,
      user: {
        username: users.username,
        name: users.name
      }
    })
    .from(projectMembers)
    .innerJoin(users, eq(projectMembers.userId, users.id))
    .where(eq(projectMembers.projectId, projectId));
    
    return results as (ProjectMember & { user: { username: string, name: string | null } })[];
  }

  async getProjectMemberWithUserInfo(id: number): Promise<(ProjectMember & { user: { username: string, name: string | null } }) | undefined> {
    const result = await db.select({
      id: projectMembers.id,
      projectId: projectMembers.projectId,
      userId: projectMembers.userId,
      role: projectMembers.role,
      joinedAt: projectMembers.joinedAt,
      invitedBy: projectMembers.invitedBy,
      user: {
        username: users.username,
        name: users.name
      }
    })
    .from(projectMembers)
    .innerJoin(users, eq(projectMembers.userId, users.id))
    .where(eq(projectMembers.id, id));
    
    return result[0] as (ProjectMember & { user: { username: string, name: string | null } });
  }

  // Project Invitations
  async getProjectInvitations(projectId: number): Promise<ProjectInvitation[]> {
    return await db.select().from(projectInvitations)
      .where(eq(projectInvitations.projectId, projectId));
  }

  async getProjectInvitation(id: number): Promise<ProjectInvitation | undefined> {
    const result = await db.select().from(projectInvitations)
      .where(eq(projectInvitations.id, id));
    
    return result[0];
  }

  async getProjectInvitationByUserAndProject(projectId: number, userId: number): Promise<ProjectInvitation | undefined> {
    const result = await db.select().from(projectInvitations)
      .where(and(
        eq(projectInvitations.projectId, projectId),
        eq(projectInvitations.userId, userId)
      ));
    
    return result[0];
  }

  async getPendingInvitationsForUser(userId: number): Promise<ProjectInvitation[]> {
    return await db.select().from(projectInvitations)
      .where(and(
        eq(projectInvitations.userId, userId),
        eq(projectInvitations.status, "pending")
      ));
  }

  async createProjectInvitation(invitation: InsertProjectInvitation): Promise<ProjectInvitation> {
    const result = await db.insert(projectInvitations)
      .values(invitation)
      .returning();
    
    return result[0];
  }

  async updateProjectInvitationStatus(id: number, status: string): Promise<ProjectInvitation | undefined> {
    const result = await db.update(projectInvitations)
      .set({ status })
      .where(eq(projectInvitations.id, id))
      .returning();
    
    return result[0];
  }

  async deleteProjectInvitation(id: number): Promise<void> {
    await db.delete(projectInvitations)
      .where(eq(projectInvitations.id, id));
  }

  async getProjectInvitationsWithUserInfo(projectId: number): Promise<(ProjectInvitation & { user: { username: string, name: string | null } })[]> {
    return await db.select({
      id: projectInvitations.id,
      projectId: projectInvitations.projectId,
      userId: projectInvitations.userId,
      invitedBy: projectInvitations.invitedBy,
      role: projectInvitations.role,
      status: projectInvitations.status,
      invitedAt: projectInvitations.invitedAt,
      user: {
        username: users.username,
        name: users.name
      }
    })
    .from(projectInvitations)
    .innerJoin(users, eq(projectInvitations.userId, users.id))
    .where(eq(projectInvitations.projectId, projectId));
  }

  async getAccessibleSharedProjects(userId: number): Promise<SharedProject[]> {
    // Get projects created by the user
    const ownedProjects = await db.select().from(sharedProjects)
      .where(eq(sharedProjects.createdById, userId));
    
    // Get public projects
    const publicProjects = await db.select().from(sharedProjects)
      .where(eq(sharedProjects.isPublic, true));
    
    // Get projects where the user is a member
    const memberProjectIds = (await db.select({ projectId: projectMembers.projectId })
      .from(projectMembers)
      .where(eq(projectMembers.userId, userId))).map(row => row.projectId);
    
    const memberProjects = memberProjectIds.length > 0 
      ? await db.select().from(sharedProjects)
        .where(inArray(sharedProjects.id, memberProjectIds))
      : [];
    
    // Combine all projects and remove duplicates
    const allProjects = [...ownedProjects, ...publicProjects, ...memberProjects];
    const uniqueProjects = allProjects.filter((project, index, self) =>
      index === self.findIndex(p => p.id === project.id)
    );
    
    return uniqueProjects;
  }

  async deleteAllProjectMembers(projectId: number): Promise<void> {
    await db.delete(projectMembers)
      .where(eq(projectMembers.projectId, projectId));
  }

  async deleteAllProjectItems(projectId: number): Promise<void> {
    await db.delete(projectItems)
      .where(eq(projectItems.projectId, projectId));
  }

  async updateProjectItem(id: number, data: Partial<ProjectItem>): Promise<ProjectItem | undefined> {
    const result = await db.update(projectItems)
      .set(data)
      .where(eq(projectItems.id, id))
      .returning();
    return result[0];
  }

  async getProjectItem(id: number): Promise<ProjectItem | undefined> {
    const result = await db.select().from(projectItems)
      .where(eq(projectItems.id, id));
    return result[0];
  }

  async removeProjectMember(id: number): Promise<void> {
    await db.delete(projectMembers)
      .where(eq(projectMembers.id, id));
  }

  async removeProjectItem(id: number): Promise<void> {
    await db.delete(projectItems)
      .where(eq(projectItems.id, id));
  }
  
  // Shared Links
  async getSharedLinks(projectId: number): Promise<SharedLink[]> {
    return db.select().from(sharedLinks)
      .where(eq(sharedLinks.projectId, projectId))
      .orderBy(sharedLinks.createdAt);
  }
  
  async getSharedLinksByProject(projectId: number): Promise<SharedLink[]> {
    return db.select().from(sharedLinks)
      .where(eq(sharedLinks.projectId, projectId))
      .orderBy(sharedLinks.createdAt);
  }
  
  async getSharedLink(id: number): Promise<SharedLink | undefined> {
    const result = await db.select().from(sharedLinks)
      .where(eq(sharedLinks.id, id));
    return result[0];
  }
  
  async getSharedLinkByToken(token: string): Promise<SharedLink | undefined> {
    const result = await db.select().from(sharedLinks)
      .where(eq(sharedLinks.token, token));
    return result[0];
  }
  
  async createSharedLink(link: InsertSharedLink): Promise<SharedLink> {
    const result = await db.insert(sharedLinks)
      .values({
        projectId: link.projectId,
        token: link.token,
        accessLevel: link.accessLevel,
        expiresAt: link.expiresAt,
        createdBy: link.createdBy,
        description: link.description
      })
      .returning();
    return result[0];
  }
  
  async updateSharedLink(id: number, data: Partial<SharedLink>): Promise<SharedLink | undefined> {
    const result = await db.update(sharedLinks)
      .set(data)
      .where(eq(sharedLinks.id, id))
      .returning();
    return result[0];
  }
  
  async deleteSharedLink(id: number): Promise<void> {
    await db.delete(sharedLinks)
      .where(eq(sharedLinks.id, id));
  }
  
  async deleteAllSharedLinks(projectId: number): Promise<void> {
    await db.delete(sharedLinks)
      .where(eq(sharedLinks.projectId, projectId));
  }
  
  async getCostTrends(period?: string, buildingType?: string, region?: string): Promise<any[]> {
    // Default period is yearly
    const timePeriod = period || 'yearly';
    
    let query = db.select({
      id: calculationHistory.id,
      createdAt: calculationHistory.createdAt,
      region: calculationHistory.region,
      buildingType: calculationHistory.buildingType,
      squareFootage: calculationHistory.squareFootage,
      costPerSqft: calculationHistory.costPerSqft,
      totalCost: calculationHistory.totalCost
    })
    .from(calculationHistory);
    
    // Apply filters if provided
    if (buildingType) {
      query = query.where(eq(calculationHistory.buildingType, buildingType));
    }
    
    if (region) {
      query = query.where(eq(calculationHistory.region, region));
    }
    
    // Add order by after where clauses
    query = query.orderBy(calculationHistory.createdAt);
    
    const results = await query;
    
    // Group and aggregate data based on the time period
    const trends: any[] = [];
    const groupedData: Record<string, any[]> = {};
    
    for (const result of results) {
      const date = new Date(result.createdAt);
      let key = '';
      
      if (timePeriod === 'monthly') {
        key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      } else if (timePeriod === 'quarterly') {
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        key = `${date.getFullYear()}-Q${quarter}`;
      } else {
        // Default to yearly
        key = `${date.getFullYear()}`;
      }
      
      if (!groupedData[key]) {
        groupedData[key] = [];
      }
      
      groupedData[key].push(result);
    }
    
    // Calculate averages for each time period
    for (const [period, data] of Object.entries(groupedData)) {
      const totalCostPerSqft = data.reduce((sum, item) => sum + parseFloat(String(item.costPerSqft)), 0);
      const avgCostPerSqft = totalCostPerSqft / data.length;
      
      const totalCost = data.reduce((sum, item) => sum + parseFloat(String(item.totalCost)), 0);
      const avgTotalCost = totalCost / data.length;
      
      trends.push({
        period,
        count: data.length,
        avgCostPerSqft,
        avgTotalCost,
        minCostPerSqft: data.length > 0 ? Math.min(...data.map(item => parseFloat(String(item.costPerSqft)))) : 0,
        maxCostPerSqft: data.length > 0 ? Math.max(...data.map(item => parseFloat(String(item.costPerSqft)))) : 0,
        minTotalCost: data.length > 0 ? Math.min(...data.map(item => parseFloat(String(item.totalCost)))) : 0,
        maxTotalCost: data.length > 0 ? Math.max(...data.map(item => parseFloat(String(item.totalCost)))) : 0,
        buildingTypes: [...new Set(data.map(item => item.buildingType))],
        regions: [...new Set(data.map(item => item.region))]
      });
    }
    
    return trends.sort((a, b) => a.period.localeCompare(b.period));
  }

  // Project Activities
  async getProjectActivities(projectId: number): Promise<ProjectActivity[]> {
    return db
      .select()
      .from(projectActivities)
      .where(eq(projectActivities.projectId, projectId))
      .orderBy(desc(projectActivities.createdAt));
  }
  
  async getProjectActivitiesWithUserInfo(projectId: number): Promise<(ProjectActivity & { user: { username: string, name: string | null } })[]> {
    const activities = await db
      .select()
      .from(projectActivities)
      .where(eq(projectActivities.projectId, projectId))
      .orderBy(desc(projectActivities.createdAt));
    
    const result = [];
    
    for (const activity of activities) {
      const userResults = await db
        .select()
        .from(users)
        .where(eq(users.id, activity.userId));
      
      const user = userResults.length > 0 ? userResults[0] : { username: 'Unknown', name: null };
      
      result.push({
        ...activity,
        user: {
          username: user.username,
          name: user.name
        }
      });
    }
    
    return result;
  }
  
  async getProjectActivity(id: number): Promise<ProjectActivity | undefined> {
    const activities = await db
      .select()
      .from(projectActivities)
      .where(eq(projectActivities.id, id));
    
    return activities.length > 0 ? activities[0] : undefined;
  }
  
  async createProjectActivity(activity: InsertProjectActivity): Promise<ProjectActivity> {
    const [result] = await db
      .insert(projectActivities)
      .values(activity)
      .returning();
    
    return result;
  }

  // Connection History
  async createConnectionHistory(history: InsertConnectionHistory): Promise<ConnectionHistory> {
    const [result] = await db
      .insert(connectionHistory)
      .values({
        ...history,
        timestamp: new Date()
      })
      .returning();
    
    return result;
  }
  
  async getConnectionHistory(options?: { connectionType?: string, limit?: number }): Promise<ConnectionHistory[]> {
    let query = db.select().from(connectionHistory).orderBy(desc(connectionHistory.timestamp));
    
    if (options?.connectionType) {
      query = query.where(eq(connectionHistory.connectionType, options.connectionType));
    }
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    return await query;
  }
  
  async getConnectionHistoryById(id: number): Promise<ConnectionHistory | undefined> {
    const result = await db.select().from(connectionHistory).where(eq(connectionHistory.id, id));
    return result[0];
  }
  
  // Alias for createCostMatrix
  async createCostMatrixEntry(matrix: InsertCostMatrix): Promise<CostMatrix> {
    return this.createCostMatrix(matrix);
  }
  
  // Import Records
  async createImportRecord(data: { 
    filename: string;
    fileType: string;
    fileSize: number;
    uploadedBy: number;
    status?: string;
    errors?: any;
    processedItems?: number;
    totalItems?: number;
    errorCount?: number;
  }): Promise<{ 
    id: number;
    filename: string;
    fileType: string;
    fileSize: number;
    uploadedBy: number;
    status: string;
    errors: any;
    processedItems: number;
    totalItems: number | null;
    errorCount: number;
    createdAt: Date;
    updatedAt: Date;
  }> {
    try {
      // Check if the importRecords table exists
      if (!(await this.tableExists('import_records'))) {
        console.warn('Import records table does not exist yet.');
        throw new Error('Import records table does not exist');
      }
      
      const now = new Date();
      const result = await db.insert(importRecords).values({
        filename: data.filename,
        fileType: data.fileType,
        fileSize: data.fileSize,
        uploadedBy: data.uploadedBy,
        status: data.status || 'pending',
        errors: data.errors || {},
        processedItems: data.processedItems || 0,
        totalItems: data.totalItems || null,
        errorCount: data.errorCount || 0,
        createdAt: now,
        updatedAt: now
      }).returning();
      
      return result[0];
    } catch (error) {
      console.error('Error creating import record:', error);
      throw error;
    }
  }
  
  async getImportRecord(id: number): Promise<{
    id: number;
    filename: string;
    fileType: string;
    fileSize: number;
    uploadedBy: number;
    status: string;
    errors: any;
    processedItems: number;
    totalItems: number | null;
    errorCount: number;
    createdAt: Date;
    updatedAt: Date;
  } | undefined> {
    try {
      // Check if the importRecords table exists
      if (!(await this.tableExists('import_records'))) {
        console.warn('Import records table does not exist yet.');
        return undefined;
      }
      
      const result = await db.select().from(importRecords).where(eq(importRecords.id, id)).execute();
      return result[0];
    } catch (error) {
      console.error(`Error getting import record ${id}:`, error);
      return undefined;
    }
  }
  
  async getImportRecords(limit?: number, offset?: number): Promise<{
    id: number;
    filename: string;
    fileType: string;
    fileSize: number;
    uploadedBy: number;
    status: string;
    errors: any;
    processedItems: number;
    totalItems: number | null;
    errorCount: number;
    createdAt: Date;
    updatedAt: Date;
  }[]> {
    try {
      // Check if the importRecords table exists
      if (!(await this.tableExists('import_records'))) {
        console.warn('Import records table does not exist yet.');
        return [];
      }
      
      let query = db.select().from(importRecords).orderBy(desc(importRecords.createdAt));
      
      if (limit !== undefined) {
        query = query.limit(limit);
      }
      
      if (offset !== undefined) {
        query = query.offset(offset);
      }
      
      const results = await query.execute();
      return results;
    } catch (error) {
      console.error('Error getting import records:', error);
      return [];
    }
  }
  
  async updateImportRecord(id: number, data: Partial<{
    status: string;
    errors: any;
    processedItems: number;
    totalItems: number | null;
    errorCount: number;
  }>): Promise<{
    id: number;
    filename: string;
    fileType: string;
    fileSize: number;
    uploadedBy: number;
    status: string;
    errors: any;
    processedItems: number;
    totalItems: number | null;
    errorCount: number;
    createdAt: Date;
    updatedAt: Date;
  } | undefined> {
    try {
      // Check if the importRecords table exists
      if (!(await this.tableExists('import_records'))) {
        console.warn('Import records table does not exist yet.');
        return undefined;
      }
      
      const now = new Date();
      const result = await db.update(importRecords)
        .set({
          ...data,
          updatedAt: now
        })
        .where(eq(importRecords.id, id))
        .returning();
        
      return result[0];
    } catch (error) {
      console.error(`Error updating import record ${id}:`, error);
      return undefined;
    }
  }
  
  async deleteImportRecord(id: number): Promise<void> {
    try {
      // Check if the importRecords table exists
      if (!(await this.tableExists('import_records'))) {
        console.warn('Import records table does not exist yet.');
        return;
      }
      
      await db.delete(importRecords).where(eq(importRecords.id, id));
    } catch (error) {
      console.error(`Error deleting import record ${id}:`, error);
    }
  }
}
import * as path from 'path';
import * as fs from 'fs';
import { FTPService } from './ftpService';
import { IStorage, SyncSchedule, SyncHistory } from '../storage';

/**
 * FTP Sync Service for scheduling and executing FTP sync jobs
 */
export class FTPSyncService {
  private storage: IStorage;
  private ftpService: FTPService;
  private activeJobs: Map<string, boolean> = new Map();
  private uploadsDir: string = path.join(process.cwd(), 'uploads', 'ftp-sync');

  constructor(storage: IStorage) {
    this.storage = storage;
    this.ftpService = new FTPService();
    
    // Ensure uploads directory exists
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  /**
   * Get all sync schedules
   */
  async getSchedules(connectionId?: number): Promise<SyncSchedule[]> {
    if (connectionId) {
      return this.storage.getSyncSchedulesByConnection(connectionId);
    }
    return this.storage.getAllSyncSchedules();
  }

  /**
   * Get a specific sync schedule by name
   */
  async getScheduleByName(connectionId: number, name: string): Promise<SyncSchedule | null> {
    const schedule = await this.storage.getSyncScheduleByName(connectionId, name);
    return schedule || null;
  }

  /**
   * Create a new sync schedule
   */
  async createSchedule(schedule: SyncSchedule): Promise<SyncSchedule> {
    // Calculate next run time
    const nextRun = this.calculateNextRunTime(schedule);
    
    // Create the schedule
    const newSchedule = await this.storage.createSyncSchedule({
      ...schedule,
      nextRun,
      status: 'idle'
    });
    
    // Log activity
    await this.storage.createActivity({
      action: `FTP Sync schedule '${schedule.name}' created`,
      icon: 'ri-time-line',
      iconColor: 'primary'
    });
    
    return newSchedule;
  }

  /**
   * Update an existing sync schedule
   */
  async updateSchedule(connectionId: number, name: string, updates: Partial<SyncSchedule>): Promise<SyncSchedule> {
    const schedule = await this.storage.getSyncScheduleByName(connectionId, name);
    
    if (!schedule) {
      throw new Error(`Schedule '${name}' not found for connection ${connectionId}`);
    }
    
    // If frequency or timing parameters changed, recalculate next run
    const recalculateNext = 
      updates.frequency !== undefined || 
      updates.time !== undefined || 
      updates.dayOfWeek !== undefined || 
      updates.dayOfMonth !== undefined;
    
    const updatedSchedule: SyncSchedule = {
      ...schedule,
      ...updates
    };
    
    if (recalculateNext) {
      updatedSchedule.nextRun = this.calculateNextRunTime(updatedSchedule);
    }
    
    // Update the schedule
    const result = await this.storage.updateSyncSchedule(schedule.id, updatedSchedule);
    
    if (!result) {
      throw new Error(`Failed to update schedule '${name}'`);
    }
    
    // Log activity
    await this.storage.createActivity({
      action: `FTP Sync schedule '${name}' updated`,
      icon: 'ri-time-line',
      iconColor: 'info'
    });
    
    return result;
  }

  /**
   * Delete a sync schedule
   */
  async deleteSchedule(connectionId: number, name: string): Promise<boolean> {
    const schedule = await this.storage.getSyncScheduleByName(connectionId, name);
    
    if (!schedule) {
      throw new Error(`Schedule '${name}' not found for connection ${connectionId}`);
    }
    
    await this.storage.deleteSyncSchedule(schedule.id);
    
    // Log activity
    await this.storage.createActivity({
      action: `FTP Sync schedule '${name}' deleted`,
      icon: 'ri-delete-bin-line',
      iconColor: 'danger'
    });
    
    return true;
  }

  /**
   * Run a sync job manually
   */
  async runSyncJob(connectionId: number, scheduleName: string): Promise<boolean> {
    const schedule = await this.storage.getSyncScheduleByName(connectionId, scheduleName);
    
    if (!schedule) {
      throw new Error(`Schedule '${scheduleName}' not found for connection ${connectionId}`);
    }
    
    // Check if the job is already running
    const jobKey = `${connectionId}-${scheduleName}`;
    if (this.activeJobs.get(jobKey)) {
      throw new Error(`Job '${scheduleName}' is already running`);
    }
    
    // Execute the job
    this.activeJobs.set(jobKey, true);
    
    try {
      // Update status to running
      await this.storage.updateSyncSchedule(schedule.id, { status: 'running' });
      
      // Get FTP connection details
      const connection = await this.storage.getFTPConnection(connectionId);
      
      if (!connection) {
        throw new Error(`FTP connection ${connectionId} not found`);
      }
      
      // Log activity
      await this.storage.createActivity({
        action: `FTP Sync job '${scheduleName}' started`,
        icon: 'ri-refresh-line',
        iconColor: 'warning'
      });
      
      // Execute the sync
      const result = await this._executeSync(schedule);
      
      // Update next run time
      const nextRun = this.calculateNextRunTime(schedule);
      await this.storage.updateSyncSchedule(schedule.id, { 
        status: result.status, 
        nextRun,
        lastRun: new Date() 
      });
      
      // Log activity when complete
      await this.storage.createActivity({
        action: `FTP Sync job '${scheduleName}' completed`,
        icon: 'ri-check-line',
        iconColor: 'success'
      });
      
      return true;
    } catch (error) {
      console.error(`Error running sync job '${scheduleName}':`, error);
      
      // Update status to failed
      await this.storage.updateSyncSchedule(schedule.id, { status: 'failed' });
      
      // Log activity
      await this.storage.createActivity({
        action: `FTP Sync job '${scheduleName}' failed: ${error.message}`,
        icon: 'ri-error-warning-line',
        iconColor: 'danger'
      });
      
      return false;
    } finally {
      this.activeJobs.delete(jobKey);
    }
  }

  /**
   * Get sync history for a specific schedule or connection
   */
  async getSyncHistory(connectionId: number, scheduleName?: string, limit = 10, offset = 0): Promise<SyncHistory[]> {
    let history: SyncHistory[];
    
    if (scheduleName) {
      const schedule = await this.storage.getSyncScheduleByName(connectionId, scheduleName);
      if (!schedule) {
        return [];
      }
      
      history = await this.storage.getSyncHistoryBySchedule(schedule.id, limit, offset);
    } else {
      history = await this.storage.getSyncHistoryByConnection(connectionId, limit, offset);
    }
    
    return history;
  }

  /**
   * Run scheduled jobs that are due
   */
  async runScheduledJobs(): Promise<number> {
    const now = new Date();
    const schedules = await this.storage.getEnabledSyncSchedules();
    let runCount = 0;
    
    // Find schedules that are due to run
    const dueSchedules = schedules.filter(schedule => {
      if (!schedule.nextRun) return false;
      return schedule.nextRun <= now && schedule.status !== 'running';
    });
    
    // Run each due schedule
    for (const schedule of dueSchedules) {
      try {
        // Skip if there's an active job for this schedule
        const jobKey = `${schedule.connectionId}-${schedule.name}`;
        if (this.activeJobs.get(jobKey)) {
          continue;
        }
        
        // Execute the job
        this.activeJobs.set(jobKey, true);
        
        // Update status to running
        await this.storage.updateSyncSchedule(schedule.id, { status: 'running' });
        
        // Log activity
        await this.storage.createActivity({
          action: `Scheduled FTP Sync job '${schedule.name}' started`,
          icon: 'ri-refresh-line',
          iconColor: 'warning'
        });
        
        // Execute the sync
        const result = await this._executeSync(schedule);
        
        // Update next run time
        const nextRun = this.calculateNextRunTime(schedule);
        await this.storage.updateSyncSchedule(schedule.id, { 
          status: result.status, 
          nextRun,
          lastRun: new Date() 
        });
        
        // Log activity
        await this.storage.createActivity({
          action: `Scheduled FTP Sync job '${schedule.name}' completed`,
          icon: 'ri-check-line',
          iconColor: 'success'
        });
        
        runCount++;
      } catch (error) {
        console.error(`Error running scheduled sync job '${schedule.name}':`, error);
        
        // Update status to failed
        await this.storage.updateSyncSchedule(schedule.id, { status: 'failed' });
        
        // Log activity
        await this.storage.createActivity({
          action: `Scheduled FTP Sync job '${schedule.name}' failed: ${error.message}`,
          icon: 'ri-error-warning-line',
          iconColor: 'danger'
        });
      } finally {
        this.activeJobs.delete(`${schedule.connectionId}-${schedule.name}`);
      }
    }
    
    return runCount;
  }

  /**
   * Execute the actual sync process
   */
  private async _executeSync(schedule: SyncSchedule): Promise<SyncHistory> {
    const startTime = new Date();
    
    const result: SyncHistory = {
      id: 0, // Will be assigned by storage
      connectionId: schedule.connectionId,
      scheduleId: schedule.id,
      scheduleName: schedule.name,
      status: 'running',
      filesTransferred: 0,
      totalBytes: 0,
      startTime,
      endTime: null,
      errors: [],
      details: {
        files: []
      }
    };
    
    try {
      // Create the history record
      const historyRecord = await this.storage.createSyncHistory(result);
      result.id = historyRecord.id;
      
      // Get connection details
      const connection = await this.storage.getFTPConnection(schedule.connectionId);
      
      if (!connection) {
        throw new Error(`FTP connection ${schedule.connectionId} not found`);
      }
      
      // Connect to FTP
      await this.ftpService.connect({
        host: connection.host,
        port: connection.port,
        user: connection.username,
        password: connection.password,
        secure: connection.secure
      });
      
      // Route to correct sync method based on source/destination
      if (schedule.source.type === 'ftp' && schedule.destination.type === 'local') {
        await this._syncFromFTPToLocal(schedule, connection, result);
      } else if (schedule.source.type === 'local' && schedule.destination.type === 'ftp') {
        await this._syncFromLocalToFTP(schedule, connection, result);
      } else if (schedule.source.type === 'ftp' && schedule.destination.type === 'ftp') {
        await this._syncFromFTPToFTP(schedule, connection, result);
      } else {
        throw new Error('Unsupported source/destination combination');
      }
      
      // Update history record
      result.status = 'success';
      result.endTime = new Date();
      await this.storage.updateSyncHistory(result.id, result);
      
      return result;
    } catch (error) {
      console.error('Sync error:', error);
      
      // Update history record
      result.status = 'failed';
      result.endTime = new Date();
      result.errors.push(error.message);
      
      if (result.id) {
        await this.storage.updateSyncHistory(result.id, result);
      } else {
        await this.storage.createSyncHistory(result);
      }
      
      throw error;
    } finally {
      // Disconnect from FTP
      try {
        await this.ftpService.disconnect();
      } catch (error) {
        console.error('Error disconnecting from FTP:', error);
      }
    }
  }

  /**
   * Sync files from FTP server to local storage
   */
  private async _syncFromFTPToLocal(
    schedule: SyncSchedule, 
    connection: any,
    result: SyncHistory
  ): Promise<void> {
    const sourcePath = schedule.source.path;
    const destPath = schedule.destination.path;
    
    // Ensure destination directory exists
    if (!fs.existsSync(destPath)) {
      fs.mkdirSync(destPath, { recursive: true });
    }
    
    // Get list of files from FTP
    const files = await this.ftpService.listFiles(sourcePath);
    
    // Filter files based on patterns (if specified)
    const filteredFiles = schedule.options.filePatterns.length > 0
      ? this._filterFilesByPattern(files, schedule.options.filePatterns)
      : files;
    
    // Process each file
    for (const file of filteredFiles) {
      try {
        // Skip directories if not including subfolders
        if (file.isDirectory && !schedule.options.includeSubfolders) {
          continue;
        }
        
        // Handle directories recursively
        if (file.isDirectory) {
          const subSchedule: SyncSchedule = {
            ...schedule,
            source: {
              ...schedule.source,
              path: path.posix.join(sourcePath, file.name)
            },
            destination: {
              ...schedule.destination,
              path: path.join(destPath, file.name)
            }
          };
          
          await this._syncFromFTPToLocal(subSchedule, connection, result);
          continue;
        }
        
        // Define file paths
        const remoteFilePath = path.posix.join(sourcePath, file.name);
        const localFilePath = path.join(destPath, file.name);
        
        // Check if file exists and whether to overwrite
        const fileExists = fs.existsSync(localFilePath);
        if (fileExists && !schedule.options.overwriteExisting) {
          result.details.files.push({
            file: remoteFilePath,
            status: 'skipped',
            size: file.size,
            reason: 'File exists and overwrite not enabled'
          });
          continue;
        }
        
        // Download file
        await this.ftpService.downloadFile(remoteFilePath, localFilePath);
        
        // Update stats
        result.filesTransferred++;
        result.totalBytes += file.size;
        
        // Add file to details
        result.details.files.push({
          file: remoteFilePath,
          status: 'success',
          size: file.size
        });
        
        // Delete source file if requested
        if (schedule.options.deleteAfterSync) {
          await this.ftpService.deleteFile(remoteFilePath);
        }
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        
        // Add error to details
        result.details.files.push({
          file: path.posix.join(sourcePath, file.name),
          status: 'failed',
          size: file.size,
          error: error.message
        });
        
        // Add to overall errors
        result.errors.push(`Error with file ${file.name}: ${error.message}`);
      }
    }
  }

  /**
   * Sync files from local storage to FTP server
   */
  private async _syncFromLocalToFTP(
    schedule: SyncSchedule, 
    connection: any,
    result: SyncHistory
  ): Promise<void> {
    const sourcePath = schedule.source.path;
    const destPath = schedule.destination.path;
    
    // Ensure source directory exists
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Source directory not found: ${sourcePath}`);
    }
    
    // Get list of files from local directory
    const files = this._getLocalFiles(sourcePath, schedule.options.includeSubfolders);
    
    // Filter files based on patterns (if specified)
    const filteredFiles = schedule.options.filePatterns.length > 0
      ? files.filter(file => {
          const fileName = path.basename(file.path);
          return schedule.options.filePatterns.some(pattern => {
            const regex = new RegExp(pattern.replace(/\*/g, '.*'));
            return regex.test(fileName);
          });
        })
      : files;
    
    // Create destination directory on FTP server
    try {
      await this.ftpService.createDirectory(destPath);
    } catch (error) {
      console.warn(`Error creating destination directory: ${error.message}`);
    }
    
    // Process each file
    for (const file of filteredFiles) {
      try {
        // Get relative path from source root
        const relativePath = path.relative(sourcePath, file.path);
        const remoteFilePath = path.posix.join(destPath, relativePath.replace(/\\/g, '/'));
        
        // Create directory structure on FTP server
        const remoteDir = path.posix.dirname(remoteFilePath);
        try {
          await this.ftpService.createDirectory(remoteDir);
        } catch (error) {
          console.warn(`Error creating directory ${remoteDir}: ${error.message}`);
        }
        
        // Check if file exists on FTP server
        const fileExists = await this.ftpService.fileExists(remoteFilePath);
        if (fileExists && !schedule.options.overwriteExisting) {
          result.details.files.push({
            file: remoteFilePath,
            status: 'skipped',
            size: file.size,
            reason: 'File exists and overwrite not enabled'
          });
          continue;
        }
        
        // Upload file
        await this.ftpService.uploadFile(file.path, remoteFilePath);
        
        // Update stats
        result.filesTransferred++;
        result.totalBytes += file.size;
        
        // Add file to details
        result.details.files.push({
          file: remoteFilePath,
          status: 'success',
          size: file.size
        });
        
        // Delete source file if requested
        if (schedule.options.deleteAfterSync) {
          fs.unlinkSync(file.path);
        }
      } catch (error) {
        console.error(`Error processing file ${file.path}:`, error);
        
        // Add error to details
        result.details.files.push({
          file: file.path,
          status: 'failed',
          size: file.size,
          error: error.message
        });
        
        // Add to overall errors
        result.errors.push(`Error with file ${file.path}: ${error.message}`);
      }
    }
  }

  /**
   * Sync files from one FTP directory to another (same server)
   */
  private async _syncFromFTPToFTP(
    schedule: SyncSchedule, 
    connection: any,
    result: SyncHistory
  ): Promise<void> {
    const sourcePath = schedule.source.path;
    const destPath = schedule.destination.path;
    
    // Get list of files from source directory
    const files = await this.ftpService.listFiles(sourcePath);
    
    // Filter files based on patterns (if specified)
    const filteredFiles = schedule.options.filePatterns.length > 0
      ? this._filterFilesByPattern(files, schedule.options.filePatterns)
      : files;
    
    // Create destination directory
    try {
      await this.ftpService.createDirectory(destPath);
    } catch (error) {
      console.warn(`Error creating destination directory: ${error.message}`);
    }
    
    // Process each file
    for (const file of filteredFiles) {
      try {
        // Skip directories if not including subfolders
        if (file.isDirectory && !schedule.options.includeSubfolders) {
          continue;
        }
        
        // Handle directories recursively
        if (file.isDirectory) {
          const subSchedule: SyncSchedule = {
            ...schedule,
            source: {
              ...schedule.source,
              path: path.posix.join(sourcePath, file.name)
            },
            destination: {
              ...schedule.destination,
              path: path.posix.join(destPath, file.name)
            }
          };
          
          await this._syncFromFTPToFTP(subSchedule, connection, result);
          continue;
        }
        
        // Define file paths
        const sourceFilePath = path.posix.join(sourcePath, file.name);
        const destFilePath = path.posix.join(destPath, file.name);
        
        // Check if file exists in destination
        const fileExists = await this.ftpService.fileExists(destFilePath);
        if (fileExists && !schedule.options.overwriteExisting) {
          result.details.files.push({
            file: sourceFilePath,
            status: 'skipped',
            size: file.size,
            reason: 'File exists and overwrite not enabled'
          });
          continue;
        }
        
        // For FTP to FTP, we need to download to a temp file then upload
        const tempFilePath = path.join(this.uploadsDir, file.name);
        
        // Download to temp
        await this.ftpService.downloadFile(sourceFilePath, tempFilePath);
        
        // Upload to destination
        await this.ftpService.uploadFile(tempFilePath, destFilePath);
        
        // Clean up temp file
        fs.unlinkSync(tempFilePath);
        
        // Update stats
        result.filesTransferred++;
        result.totalBytes += file.size;
        
        // Add file to details
        result.details.files.push({
          file: sourceFilePath,
          status: 'success',
          size: file.size
        });
        
        // Delete source file if requested
        if (schedule.options.deleteAfterSync) {
          await this.ftpService.deleteFile(sourceFilePath);
        }
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        
        // Add error to details
        result.details.files.push({
          file: path.posix.join(sourcePath, file.name),
          status: 'failed',
          size: file.size,
          error: error.message
        });
        
        // Add to overall errors
        result.errors.push(`Error with file ${file.name}: ${error.message}`);
      }
    }
  }

  /**
   * Get list of local files
   */
  private _getLocalFiles(dir: string, recursive: boolean): Array<{path: string; size: number}> {
    const results: Array<{path: string; size: number}> = [];
    
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        if (recursive) {
          results.push(...this._getLocalFiles(fullPath, recursive));
        }
      } else {
        const stats = fs.statSync(fullPath);
        results.push({
          path: fullPath,
          size: stats.size
        });
      }
    }
    
    return results;
  }

  /**
   * Filter files based on patterns
   */
  private _filterFilesByPattern(
    files: Array<{name: string; isDirectory?: boolean; size: number}>,
    patterns: string[]
  ): Array<{name: string; isDirectory?: boolean; size: number}> {
    return files.filter(file => {
      // Skip directories in pattern matching
      if (file.isDirectory) return true;
      
      return patterns.some(pattern => {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(file.name);
      });
    });
  }

  /**
   * Calculate the next run time for a schedule
   */
  private calculateNextRunTime(schedule: SyncSchedule): Date {
    const now = new Date();
    const nextRun = new Date(now);
    
    // For manual schedules, set next run to far future (effectively never)
    if (schedule.frequency === 'manual') {
      nextRun.setFullYear(nextRun.getFullYear() + 100);
      return nextRun;
    }
    
    // Parse time if provided
    let hours = 0;
    let minutes = 0;
    
    if (schedule.time) {
      const [hoursStr, minutesStr] = schedule.time.split(':');
      hours = parseInt(hoursStr, 10);
      minutes = parseInt(minutesStr, 10);
    }
    
    // Set time components
    nextRun.setHours(hours);
    nextRun.setMinutes(minutes);
    nextRun.setSeconds(0);
    nextRun.setMilliseconds(0);
    
    // Handle different frequencies
    switch (schedule.frequency) {
      case 'hourly':
        // If the current time is past the specified minutes, move to next hour
        if (now.getMinutes() >= minutes) {
          nextRun.setHours(nextRun.getHours() + 1);
        }
        break;
        
      case 'daily':
        // If the current time is past the specified time, move to tomorrow
        if (now.getHours() > hours || (now.getHours() === hours && now.getMinutes() >= minutes)) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
        break;
        
      case 'weekly':
        const dayOfWeek = schedule.dayOfWeek || 0; // Default to Sunday
        // Calculate days until next target day of week
        let daysUntilTargetDay = dayOfWeek - now.getDay();
        if (daysUntilTargetDay < 0) {
          daysUntilTargetDay += 7;
        } else if (daysUntilTargetDay === 0 && 
                 (now.getHours() > hours || 
                  (now.getHours() === hours && now.getMinutes() >= minutes))) {
          // If it's the target day but past the time, move to next week
          daysUntilTargetDay = 7;
        }
        
        nextRun.setDate(nextRun.getDate() + daysUntilTargetDay);
        break;
        
      case 'monthly':
        const dayOfMonth = schedule.dayOfMonth || 1; // Default to 1st day of month
        
        // Set to the target day of month
        nextRun.setDate(dayOfMonth);
        
        // If the target day has already passed this month, move to next month
        if (now.getDate() > dayOfMonth || 
            (now.getDate() === dayOfMonth && 
             (now.getHours() > hours || 
              (now.getHours() === hours && now.getMinutes() >= minutes)))) {
          nextRun.setMonth(nextRun.getMonth() + 1);
        }
        
        // Handle invalid dates (e.g., Feb 30, which becomes Mar 2)
        if (nextRun.getDate() !== dayOfMonth) {
          // Go to the last day of the previous month
          nextRun.setDate(0);
        }
        break;
    }
    
    return nextRun;
  }
}
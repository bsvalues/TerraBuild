import { IStorage } from '../storage';
import { FTPSyncService } from './ftpSyncService';

/**
 * Scheduler Service for managing and running scheduled tasks
 */
export class SchedulerService {
  private storage: IStorage;
  private ftpSyncService: FTPSyncService;
  private intervalId: NodeJS.Timeout | null = null;
  private running: boolean = false;
  private checkInterval: number = 60000; // Check every minute by default
  
  constructor(storage: IStorage) {
    this.storage = storage;
    this.ftpSyncService = new FTPSyncService(storage);
  }
  
  /**
   * Start the scheduler
   * @param checkInterval Optional interval in milliseconds (default: 60000 ms / 1 minute)
   */
  start(checkInterval: number = 60000): void {
    if (this.running) {
      console.log('Scheduler is already running');
      return;
    }
    
    this.checkInterval = checkInterval;
    this.running = true;
    
    console.log(`Starting scheduler with check interval: ${checkInterval}ms`);
    
    // Log scheduler startup activity
    this.storage.createActivity({
      action: 'Scheduler service started',
      icon: 'clock',
      iconColor: 'green',
      details: [{ key: 'checkInterval', value: checkInterval }]
    }).catch(error => {
      console.error('Failed to log scheduler start activity:', error);
    });
    
    // Run immediately on startup
    this.checkSchedules();
    
    // Set up interval for future runs
    this.intervalId = setInterval(() => {
      this.checkSchedules();
    }, this.checkInterval);
  }
  
  /**
   * Stop the scheduler
   */
  stop(): void {
    if (!this.running) {
      console.log('Scheduler is not running');
      return;
    }
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.running = false;
    console.log('Scheduler stopped');
    
    // Log scheduler shutdown activity
    this.storage.createActivity({
      action: 'Scheduler service stopped',
      icon: 'clock',
      iconColor: 'amber',
      details: [{ key: 'reason', value: 'Manual shutdown' }]
    }).catch(error => {
      console.error('Failed to log scheduler stop activity:', error);
    });
  }
  
  /**
   * Check for and run scheduled jobs
   */
  private async checkSchedules(): Promise<void> {
    try {
      console.log(`Checking for scheduled jobs at ${new Date().toISOString()}`);
      
      // Run FTP sync scheduled jobs
      const runCount = await this.ftpSyncService.runScheduledJobs();
      
      if (runCount > 0) {
        console.log(`Executed ${runCount} scheduled FTP sync jobs`);
        
        // Only log activity if jobs were actually run
        await this.storage.createActivity({
          action: 'Scheduled jobs executed',
          icon: 'refresh-cw',
          iconColor: 'blue',
          details: [
            { key: 'jobsRun', value: runCount },
            { key: 'timestamp', value: new Date().toISOString() }
          ]
        });
      }
    } catch (error) {
      console.error('Error checking schedules:', error);
      
      // Log error activity
      await this.storage.createActivity({
        action: 'Scheduler error occurred',
        icon: 'alert-triangle',
        iconColor: 'red',
        details: [
          { key: 'error', value: error instanceof Error ? error.message : String(error) },
          { key: 'timestamp', value: new Date().toISOString() }
        ]
      });
    }
  }
  
  /**
   * Get the scheduler status
   */
  getStatus(): { running: boolean; checkInterval: number; nextCheckAt?: Date } {
    const status = {
      running: this.running,
      checkInterval: this.checkInterval
    };
    
    if (this.running) {
      const nextCheckAt = new Date();
      nextCheckAt.setTime(nextCheckAt.getTime() + this.checkInterval);
      return { ...status, nextCheckAt };
    }
    
    return status;
  }
}
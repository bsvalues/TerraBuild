/**
 * Training Coordinator for Model Content Protocol
 * 
 * This file implements a coordinator that manages training processes across agents,
 * facilitating knowledge sharing and collaborative learning through the experience
 * replay buffer.
 */

import { experienceReplayBuffer, TrainingBatch } from './replayBuffer';
import { agentRegistry } from '../agents';
import { AgentEventType } from '../agents/baseAgent';

/**
 * Training Options interface
 */
interface TrainingOptions {
  batchSize: number;
  targetAgentIds?: string[];
  trainingInterval?: number; // In milliseconds
  minExperiencesRequired?: number;
  learningRate?: number;
}

/**
 * Training Result interface
 */
interface TrainingResult {
  batchId: string;
  timestamp: Date;
  targetAgents: string[];
  metricsBeforeTraining: Record<string, any>;
  metricsAfterTraining: Record<string, any>;
  improvements: Record<string, number>;
  trainingDuration: number; // In milliseconds
}

/**
 * Training Metrics for an agent
 */
interface AgentMetrics {
  agentId: string;
  successRate: number;
  averageReward: number;
  taskCompletionTime: number;
  errorRate: number;
  insightQuality: number;
  additionalMetrics?: Record<string, any>;
}

/**
 * Training Coordinator
 * Manages collaborative learning across agents
 */
export class TrainingCoordinator {
  private static instance: TrainingCoordinator;
  private isTraining: boolean = false;
  private trainingInterval: NodeJS.Timeout | null = null;
  private trainingResults: TrainingResult[] = [];
  private readonly MAX_RESULTS_HISTORY = 20;
  private readonly DEFAULT_OPTIONS: TrainingOptions = {
    batchSize: 50,
    minExperiencesRequired: 100,
    trainingInterval: 3600000, // Default: train once per hour
    learningRate: 0.01
  };
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    console.log('Training Coordinator initialized');
  }
  
  /**
   * Get the singleton instance of the training coordinator
   */
  public static getInstance(): TrainingCoordinator {
    if (!TrainingCoordinator.instance) {
      TrainingCoordinator.instance = new TrainingCoordinator();
    }
    return TrainingCoordinator.instance;
  }
  
  /**
   * Start automated training on a schedule
   * 
   * @param options Training options
   * @returns True if automated training was started
   */
  public startAutomatedTraining(options: Partial<TrainingOptions> = {}): boolean {
    if (this.trainingInterval) {
      console.log('Automated training is already running');
      return false;
    }
    
    const mergedOptions: TrainingOptions = {
      ...this.DEFAULT_OPTIONS,
      ...options
    };
    
    console.log(`Starting automated training with interval ${mergedOptions.trainingInterval}ms`);
    
    this.trainingInterval = setInterval(async () => {
      await this.runTrainingCycle(mergedOptions);
    }, mergedOptions.trainingInterval);
    
    return true;
  }
  
  /**
   * Stop automated training
   * 
   * @returns True if automated training was stopped
   */
  public stopAutomatedTraining(): boolean {
    if (!this.trainingInterval) {
      console.log('No automated training is running');
      return false;
    }
    
    clearInterval(this.trainingInterval);
    this.trainingInterval = null;
    console.log('Automated training stopped');
    return true;
  }
  
  /**
   * Run a single training cycle
   * 
   * @param options Training options
   * @returns Training result
   */
  public async runTrainingCycle(options: Partial<TrainingOptions> = {}): Promise<TrainingResult | null> {
    if (this.isTraining) {
      console.log('Training is already in progress');
      return null;
    }
    
    const mergedOptions: TrainingOptions = {
      ...this.DEFAULT_OPTIONS,
      ...options
    };
    
    this.isTraining = true;
    const startTime = Date.now();
    
    try {
      // Check if we have enough experiences to train
      const bufferSize = experienceReplayBuffer.size();
      if (bufferSize < (mergedOptions.minExperiencesRequired || 0)) {
        console.log(`Not enough experiences for training: ${bufferSize}/${mergedOptions.minExperiencesRequired}`);
        this.isTraining = false;
        return null;
      }
      
      // Determine target agents
      const targetAgentIds = mergedOptions.targetAgentIds || this.getAllAgentIds();
      
      // Collect metrics before training
      const metricsBefore = await this.collectAgentMetrics(targetAgentIds);
      
      // Create training batch
      const batch = experienceReplayBuffer.createTrainingBatch(
        mergedOptions.batchSize,
        targetAgentIds
      );
      
      // Apply training to each agent
      await this.applyTrainingBatch(batch, mergedOptions.learningRate || 0.01);
      
      // Collect metrics after training
      const metricsAfter = await this.collectAgentMetrics(targetAgentIds);
      
      // Calculate improvements
      const improvements: Record<string, number> = {};
      for (const agentId of targetAgentIds) {
        if (metricsBefore[agentId] && metricsAfter[agentId]) {
          improvements[agentId] = this.calculateImprovement(
            metricsBefore[agentId],
            metricsAfter[agentId]
          );
        }
      }
      
      // Record training result
      const trainingResult: TrainingResult = {
        batchId: batch.batchId,
        timestamp: new Date(),
        targetAgents: targetAgentIds,
        metricsBeforeTraining: metricsBefore,
        metricsAfterTraining: metricsAfter,
        improvements,
        trainingDuration: Date.now() - startTime
      };
      
      // Add to history and maintain max size
      this.trainingResults.push(trainingResult);
      if (this.trainingResults.length > this.MAX_RESULTS_HISTORY) {
        this.trainingResults.shift();
      }
      
      // Log results
      console.log(`Training cycle completed in ${trainingResult.trainingDuration}ms`);
      console.log(`Trained ${targetAgentIds.length} agents with ${batch.experiences.length} experiences`);
      
      // Broadcast training completion event to all agents
      for (const agentId of targetAgentIds) {
        const agent = agentRegistry.getAgent(agentId);
        if (agent) {
          agent.receiveEvent({
            type: AgentEventType.TASK_COMPLETED,
            sourceAgentId: 'training-coordinator',
            targetAgentId: agentId,
            timestamp: new Date(),
            payload: {
              taskType: 'training',
              batchId: batch.batchId,
              improvement: improvements[agentId] || 0,
              experienceCount: batch.experiences.length
            }
          });
        }
      }
      
      return trainingResult;
    } catch (error) {
      console.error('Error during training cycle:', error);
      return null;
    } finally {
      this.isTraining = false;
    }
  }
  
  /**
   * Apply a training batch to target agents
   * 
   * @param batch The training batch
   * @param learningRate Learning rate parameter
   */
  private async applyTrainingBatch(batch: TrainingBatch, learningRate: number): Promise<void> {
    const targetAgentIds = batch.targetAgentIds || this.getAllAgentIds();
    
    // For each target agent, process the training batch
    for (const agentId of targetAgentIds) {
      const agent = agentRegistry.getAgent(agentId);
      if (!agent) {
        console.warn(`Agent ${agentId} not found, skipping training`);
        continue;
      }
      
      try {
        // In a real implementation, this would call agent-specific training methods
        // For this prototype, we'll simulate training by sending a training event
        await agent.receiveEvent({
          type: AgentEventType.DATA_AVAILABLE,
          sourceAgentId: 'training-coordinator',
          targetAgentId: agentId,
          timestamp: new Date(),
          payload: {
            dataType: 'training_batch',
            batchId: batch.batchId,
            experienceCount: batch.experiences.length,
            learningRate,
            // In a real implementation, this would include the actual experiences
            // but for this prototype, we'll omit them to keep the message size reasonable
            sampleExperience: batch.experiences.length > 0 ? batch.experiences[0] : null
          }
        });
        
        console.log(`Applied training batch ${batch.batchId} to agent ${agentId}`);
      } catch (error) {
        console.error(`Error applying training to agent ${agentId}:`, error);
      }
    }
  }
  
  /**
   * Collect metrics from all specified agents
   * 
   * @param agentIds Array of agent IDs to collect metrics from
   * @returns Record of agent IDs to metrics
   */
  private async collectAgentMetrics(agentIds: string[]): Promise<Record<string, AgentMetrics>> {
    const metrics: Record<string, AgentMetrics> = {};
    
    for (const agentId of agentIds) {
      const agent = agentRegistry.getAgent(agentId);
      if (!agent) {
        console.warn(`Agent ${agentId} not found, skipping metrics collection`);
        continue;
      }
      
      try {
        // In a real implementation, this would call agent-specific metric methods
        // For this prototype, we'll generate simulated metrics
        metrics[agentId] = this.generateSimulatedMetrics(agentId);
      } catch (error) {
        console.error(`Error collecting metrics from agent ${agentId}:`, error);
      }
    }
    
    return metrics;
  }
  
  /**
   * Generate simulated metrics for an agent
   * In a real implementation, this would be replaced with actual agent metrics
   * 
   * @param agentId Agent ID
   * @returns Simulated metrics
   */
  private generateSimulatedMetrics(agentId: string): AgentMetrics {
    // In a real implementation, this would retrieve actual metrics from the agent
    // This is just a placeholder for demonstration purposes
    return {
      agentId,
      successRate: Math.random() * 0.3 + 0.7, // 70-100%
      averageReward: Math.random() * 0.5 + 0.5, // 0.5-1.0
      taskCompletionTime: Math.random() * 500 + 100, // 100-600ms
      errorRate: Math.random() * 0.2, // 0-20%
      insightQuality: Math.random() * 0.4 + 0.6, // 60-100%
      additionalMetrics: {
        memoryUtilization: Math.random() * 50 + 50, // 50-100 MB
        eventProcessingRate: Math.floor(Math.random() * 50 + 50) // 50-100 events/sec
      }
    };
  }
  
  /**
   * Calculate improvement between before and after metrics
   * 
   * @param before Metrics before training
   * @param after Metrics after training
   * @returns Overall improvement score (0-1)
   */
  private calculateImprovement(before: AgentMetrics, after: AgentMetrics): number {
    // Calculate weighted improvement across key metrics
    const successRateImprovement = Math.max(0, (after.successRate - before.successRate) / before.successRate);
    const rewardImprovement = Math.max(0, (after.averageReward - before.averageReward) / Math.max(0.1, before.averageReward));
    const timeImprovement = Math.max(0, (before.taskCompletionTime - after.taskCompletionTime) / before.taskCompletionTime);
    const errorRateImprovement = Math.max(0, (before.errorRate - after.errorRate) / Math.max(0.01, before.errorRate));
    const insightImprovement = Math.max(0, (after.insightQuality - before.insightQuality) / before.insightQuality);
    
    // Weighted average (higher weights for more important metrics)
    const weights = {
      successRate: 0.3,
      reward: 0.2,
      time: 0.15,
      errorRate: 0.2,
      insight: 0.15
    };
    
    const weightedImprovement =
      successRateImprovement * weights.successRate +
      rewardImprovement * weights.reward +
      timeImprovement * weights.time +
      errorRateImprovement * weights.errorRate +
      insightImprovement * weights.insight;
    
    // Return normalized improvement score (0-1)
    return Math.min(1, Math.max(0, weightedImprovement));
  }
  
  /**
   * Get recent training results
   * 
   * @param count Number of results to get (default: all)
   * @returns Array of training results
   */
  public getRecentTrainingResults(count?: number): TrainingResult[] {
    if (count === undefined || count >= this.trainingResults.length) {
      return [...this.trainingResults];
    }
    return this.trainingResults.slice(-count);
  }
  
  /**
   * Get a list of all agent IDs in the registry
   * 
   * @returns Array of agent IDs
   */
  private getAllAgentIds(): string[] {
    // In a real implementation, this would retrieve all agent IDs from the registry
    return ['data-quality-agent', 'compliance-agent', 'cost-analysis-agent'];
  }
  
  /**
   * Request immediate training for a specific agent
   * 
   * @param agentId Agent ID
   * @param options Training options
   * @returns Training result
   */
  public async requestAgentTraining(
    agentId: string, 
    options: Partial<TrainingOptions> = {}
  ): Promise<TrainingResult | null> {
    return this.runTrainingCycle({
      ...options,
      targetAgentIds: [agentId],
      batchSize: options.batchSize || 25 // Smaller batch for single agent
    });
  }
  
  /**
   * Check if training is currently in progress
   * 
   * @returns True if training is in progress
   */
  public isTrainingInProgress(): boolean {
    return this.isTraining;
  }
  
  /**
   * Check if automated training is active
   * 
   * @returns True if automated training is active
   */
  public isAutomatedTrainingActive(): boolean {
    return this.trainingInterval !== null;
  }
}

// Export singleton instance
export const trainingCoordinator = TrainingCoordinator.getInstance();
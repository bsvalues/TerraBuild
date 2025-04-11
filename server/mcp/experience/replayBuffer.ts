/**
 * Experience Replay Buffer for Model Content Protocol
 * 
 * This file implements a shared experience buffer that enables agents to learn
 * from each other's experiences through a centralized replay mechanism.
 */

import { AgentEvent } from '../agents/baseAgent';
import { v4 as uuidv4 } from 'uuid';

/**
 * Experience Entry represents a single learning experience
 */
export interface ExperienceEntry {
  id: string;
  timestamp: Date;
  agentId: string;
  state: any;
  action: string;
  result: any;
  nextState: any;
  reward: number;
  metadata?: Record<string, any>;
  priority: number;
}

/**
 * Training Batch for agent learning
 */
export interface TrainingBatch {
  batchId: string;
  timestamp: Date;
  experiences: ExperienceEntry[];
  targetAgentIds?: string[];
}

/**
 * Experience Replay Buffer
 * Stores and manages agent experiences for collaborative learning
 */
export class ExperienceReplayBuffer {
  private static instance: ExperienceReplayBuffer;
  private experiences: ExperienceEntry[] = [];
  private readonly MAX_BUFFER_SIZE = 1000;
  private readonly DEFAULT_PRIORITY = 0.5;
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    console.log('Experience Replay Buffer initialized');
  }
  
  /**
   * Get the singleton instance of the replay buffer
   */
  public static getInstance(): ExperienceReplayBuffer {
    if (!ExperienceReplayBuffer.instance) {
      ExperienceReplayBuffer.instance = new ExperienceReplayBuffer();
    }
    return ExperienceReplayBuffer.instance;
  }
  
  /**
   * Add an experience to the buffer
   * 
   * @param experience The experience to add
   * @returns The ID of the added experience
   */
  public addExperience(experience: Omit<ExperienceEntry, 'id' | 'timestamp' | 'priority'>): string {
    const id = uuidv4();
    const timestamp = new Date();
    const priority = experience.metadata?.priority || this.DEFAULT_PRIORITY;
    
    const fullExperience: ExperienceEntry = {
      id,
      timestamp,
      priority,
      ...experience
    };
    
    // Add to buffer
    this.experiences.push(fullExperience);
    
    // Enforce maximum buffer size by removing lowest priority experiences
    if (this.experiences.length > this.MAX_BUFFER_SIZE) {
      // Sort by priority (ascending) and remove lowest priority items
      this.experiences.sort((a, b) => a.priority - b.priority);
      this.experiences = this.experiences.slice(
        this.experiences.length - this.MAX_BUFFER_SIZE
      );
    }
    
    console.log(`Added experience ${id} from agent ${experience.agentId} to replay buffer`);
    return id;
  }
  
  /**
   * Add an experience derived from an agent event
   * 
   * @param event The agent event
   * @param result The result of processing the event
   * @param reward The reward value assigned to this experience
   * @returns The ID of the added experience
   */
  public addExperienceFromEvent(
    event: AgentEvent, 
    result: any, 
    reward: number
  ): string {
    return this.addExperience({
      agentId: event.sourceAgentId,
      state: { 
        eventType: event.type,
        timestamp: event.timestamp,
        correlationId: event.correlationId
      },
      action: 'process_event',
      result,
      nextState: { processed: true, timestamp: new Date() },
      reward,
      metadata: {
        eventType: event.type,
        priority: event.priority === 'CRITICAL' ? 1.0 : 
                 event.priority === 'HIGH' ? 0.8 :
                 event.priority === 'MEDIUM' ? 0.5 : 0.3,
        originalEvent: event
      }
    });
  }
  
  /**
   * Sample experiences from the buffer for training
   * 
   * @param count Number of experiences to sample
   * @param agentId Optional filter by agent ID
   * @returns Array of sampled experiences
   */
  public sampleExperiences(count: number, agentId?: string): ExperienceEntry[] {
    let candidateExperiences = this.experiences;
    
    // Filter by agent if specified
    if (agentId) {
      candidateExperiences = candidateExperiences.filter(e => e.agentId === agentId);
    }
    
    // If we don't have enough experiences, return what we have
    if (candidateExperiences.length <= count) {
      return [...candidateExperiences];
    }
    
    // Prioritized sampling
    // First, calculate selection probabilities based on priority
    const totalPriority = candidateExperiences.reduce((sum, exp) => sum + exp.priority, 0);
    const selectionProbabilities = candidateExperiences.map(exp => exp.priority / totalPriority);
    
    // Sample without replacement
    const sampled: ExperienceEntry[] = [];
    const indices = new Set<number>();
    
    while (sampled.length < count && indices.size < candidateExperiences.length) {
      // Select an index based on priority probabilities
      let rand = Math.random();
      let cumulativeProbability = 0;
      let selectedIndex = -1;
      
      for (let i = 0; i < selectionProbabilities.length; i++) {
        if (indices.has(i)) continue; // Skip already selected indices
        
        cumulativeProbability += selectionProbabilities[i];
        if (rand <= cumulativeProbability) {
          selectedIndex = i;
          break;
        }
      }
      
      // If we didn't select anything, pick a random unselected index
      if (selectedIndex === -1) {
        const unselectedIndices = candidateExperiences
          .map((_, i) => i)
          .filter(i => !indices.has(i));
        
        if (unselectedIndices.length > 0) {
          selectedIndex = unselectedIndices[Math.floor(Math.random() * unselectedIndices.length)];
        }
      }
      
      if (selectedIndex !== -1) {
        indices.add(selectedIndex);
        sampled.push(candidateExperiences[selectedIndex]);
      }
    }
    
    return sampled;
  }
  
  /**
   * Create a training batch from sampled experiences
   * 
   * @param count Number of experiences to include
   * @param targetAgentIds Optional array of agent IDs to target with this batch
   * @returns Training batch object
   */
  public createTrainingBatch(count: number, targetAgentIds?: string[]): TrainingBatch {
    const experiences = this.sampleExperiences(count);
    
    return {
      batchId: uuidv4(),
      timestamp: new Date(),
      experiences,
      targetAgentIds
    };
  }
  
  /**
   * Update experience priority based on new information
   * 
   * @param experienceId ID of the experience to update
   * @param newPriority New priority value
   * @returns True if update was successful
   */
  public updatePriority(experienceId: string, newPriority: number): boolean {
    const experience = this.experiences.find(e => e.id === experienceId);
    if (!experience) {
      return false;
    }
    
    experience.priority = Math.max(0, Math.min(1, newPriority)); // Clamp to [0,1]
    return true;
  }
  
  /**
   * Get the current size of the buffer
   * 
   * @returns Number of experiences in the buffer
   */
  public size(): number {
    return this.experiences.length;
  }
  
  /**
   * Get buffer statistics
   * 
   * @returns Statistics about the buffer contents
   */
  public getStats(): {
    size: number;
    agentDistribution: Record<string, number>;
    averagePriority: number;
    oldestTimestamp: Date | null;
    newestTimestamp: Date | null;
  } {
    const agentDistribution: Record<string, number> = {};
    let totalPriority = 0;
    
    // Calculate statistics
    for (const exp of this.experiences) {
      // Count by agent
      agentDistribution[exp.agentId] = (agentDistribution[exp.agentId] || 0) + 1;
      
      // Sum priorities
      totalPriority += exp.priority;
    }
    
    // Find timestamps
    const timestamps = this.experiences.map(e => e.timestamp);
    const oldestTimestamp = timestamps.length > 0 ? 
      new Date(Math.min(...timestamps.map(t => t.getTime()))) : null;
    const newestTimestamp = timestamps.length > 0 ?
      new Date(Math.max(...timestamps.map(t => t.getTime()))) : null;
    
    return {
      size: this.experiences.length,
      agentDistribution,
      averagePriority: this.experiences.length > 0 ? 
        totalPriority / this.experiences.length : 0,
      oldestTimestamp,
      newestTimestamp
    };
  }
  
  /**
   * Clear the buffer
   */
  public clear(): void {
    const clearedCount = this.experiences.length;
    this.experiences = [];
    console.log(`Cleared ${clearedCount} experiences from replay buffer`);
  }
}

// Export singleton instance
export const experienceReplayBuffer = ExperienceReplayBuffer.getInstance();
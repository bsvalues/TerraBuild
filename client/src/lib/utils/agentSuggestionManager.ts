/**
 * Agent Suggestion Manager
 * 
 * A utility for managing, prioritizing, and tracking AI agent suggestions
 * following the structured implementation approach defined in Phase 1.
 */

export enum SuggestionPriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export enum SuggestionStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  IMPLEMENTED = 'implemented',
  TESTED = 'tested',
  REVIEWED = 'reviewed',
  COMPLETED = 'completed',
  REJECTED = 'rejected'
}

export enum SuggestionCategory {
  DATABASE = 'database',
  UI = 'ui',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  API = 'api',
  ARCHITECTURE = 'architecture',
  TESTING = 'testing',
  DOCUMENTATION = 'documentation'
}

export interface AgentSuggestion {
  id: string;
  title: string;
  description: string;
  priority: SuggestionPriority;
  status: SuggestionStatus;
  category: SuggestionCategory;
  dependencies: string[]; // IDs of other suggestions this depends on
  implementationSteps: string[];
  createdAt: Date;
  updatedAt: Date;
  assignedTo?: string;
  relatedFiles?: string[];
  testCoverage?: {
    unitTests: boolean;
    integrationTests: boolean;
    e2eTests: boolean;
  };
}

/**
 * Get suggestions filtered by various criteria
 */
export function filterSuggestions(
  suggestions: AgentSuggestion[],
  filters: {
    priority?: SuggestionPriority;
    status?: SuggestionStatus;
    category?: SuggestionCategory;
    assignedTo?: string;
  }
): AgentSuggestion[] {
  return suggestions.filter(suggestion => {
    if (filters.priority && suggestion.priority !== filters.priority) return false;
    if (filters.status && suggestion.status !== filters.status) return false;
    if (filters.category && suggestion.category !== filters.category) return false;
    if (filters.assignedTo && suggestion.assignedTo !== filters.assignedTo) return false;
    return true;
  });
}

/**
 * Sort suggestions based on dependencies to create an implementation order
 */
export function createImplementationOrder(suggestions: AgentSuggestion[]): AgentSuggestion[] {
  const result: AgentSuggestion[] = [];
  const visited = new Set<string>();
  
  function visit(suggestion: AgentSuggestion) {
    if (visited.has(suggestion.id)) return;
    
    // First process all dependencies
    for (const depId of suggestion.dependencies) {
      const dep = suggestions.find(s => s.id === depId);
      if (dep) visit(dep);
    }
    
    visited.add(suggestion.id);
    result.push(suggestion);
  }
  
  // Start with high priority items
  const highPriority = suggestions.filter(s => s.priority === SuggestionPriority.HIGH);
  for (const suggestion of highPriority) {
    visit(suggestion);
  }
  
  // Then medium priority
  const mediumPriority = suggestions.filter(s => s.priority === SuggestionPriority.MEDIUM);
  for (const suggestion of mediumPriority) {
    visit(suggestion);
  }
  
  // Finally low priority
  const lowPriority = suggestions.filter(s => s.priority === SuggestionPriority.LOW);
  for (const suggestion of lowPriority) {
    visit(suggestion);
  }
  
  return result;
}

/**
 * Group related suggestions to implement together
 */
export function groupRelatedSuggestions(suggestions: AgentSuggestion[]): AgentSuggestion[][] {
  const fileToSuggestions = new Map<string, Set<AgentSuggestion>>();
  
  // Group by related files
  suggestions.forEach(suggestion => {
    if (!suggestion.relatedFiles) return;
    
    suggestion.relatedFiles.forEach(file => {
      if (!fileToSuggestions.has(file)) {
        fileToSuggestions.set(file, new Set());
      }
      fileToSuggestions.get(file)?.add(suggestion);
    });
  });
  
  // Create groups
  const groups: Set<AgentSuggestion>[] = [];
  const processedSuggestions = new Set<string>();
  
  fileToSuggestions.forEach(suggestionsSet => {
    const newGroup = new Set<AgentSuggestion>();
    
    suggestionsSet.forEach(suggestion => {
      if (!processedSuggestions.has(suggestion.id)) {
        newGroup.add(suggestion);
        processedSuggestions.add(suggestion.id);
      }
    });
    
    if (newGroup.size > 0) {
      groups.push(newGroup);
    }
  });
  
  // Handle suggestions without related files
  suggestions.forEach(suggestion => {
    if (!processedSuggestions.has(suggestion.id)) {
      groups.push(new Set([suggestion]));
      processedSuggestions.add(suggestion.id);
    }
  });
  
  return groups.map(group => Array.from(group));
}

/**
 * Create a new suggestion
 */
export function createSuggestion(
  title: string,
  description: string,
  category: SuggestionCategory,
  priority: SuggestionPriority,
  implementationSteps: string[],
  dependencies: string[] = [],
  relatedFiles: string[] = []
): AgentSuggestion {
  return {
    id: `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title,
    description,
    priority,
    status: SuggestionStatus.PENDING,
    category,
    dependencies,
    implementationSteps,
    createdAt: new Date(),
    updatedAt: new Date(),
    relatedFiles,
    testCoverage: {
      unitTests: false,
      integrationTests: false,
      e2eTests: false
    }
  };
}

/**
 * Update a suggestion's status
 */
export function updateSuggestionStatus(
  suggestion: AgentSuggestion,
  status: SuggestionStatus
): AgentSuggestion {
  return {
    ...suggestion,
    status,
    updatedAt: new Date()
  };
}

/**
 * Initial set of Supabase integration suggestions
 */
export const initialSupabaseSuggestions: AgentSuggestion[] = [
  createSuggestion(
    'Implement Supabase Database Schema Migration',
    'Create database schema for the application in Supabase and implement migration strategy',
    SuggestionCategory.DATABASE,
    SuggestionPriority.HIGH,
    [
      'Define database schema using Drizzle ORM',
      'Create migration scripts',
      'Test migration on development instance',
      'Implement rollback strategy'
    ],
    [],
    ['shared/schema.ts', 'server/utils/supabaseClient.ts', 'server/storage.ts']
  ),
  createSuggestion(
    'Create Supabase Authentication Integration',
    'Implement user authentication flow using Supabase Auth',
    SuggestionCategory.SECURITY,
    SuggestionPriority.HIGH,
    [
      'Implement sign-up flow',
      'Implement sign-in flow',
      'Add password reset functionality',
      'Implement session management'
    ],
    ['suggestion_1'],
    ['client/src/lib/utils/supabaseClient.ts', 'client/src/components/auth']
  ),
  createSuggestion(
    'Implement Supabase Real-time Data Subscriptions',
    'Add real-time data synchronization for collaborative features',
    SuggestionCategory.PERFORMANCE,
    SuggestionPriority.MEDIUM,
    [
      'Configure real-time channels',
      'Implement subscription logic',
      'Add UI components for real-time updates',
      'Implement conflict resolution strategy'
    ],
    ['suggestion_1', 'suggestion_2'],
    ['client/src/lib/utils/supabaseRealtime.ts', 'client/src/hooks/useRealtimeSubscription.ts']
  ),
  createSuggestion(
    'Implement Supabase Storage for File Uploads',
    'Add file upload capabilities using Supabase Storage',
    SuggestionCategory.API,
    SuggestionPriority.MEDIUM,
    [
      'Configure storage buckets',
      'Implement file upload UI',
      'Add file access control',
      'Implement file preview components'
    ],
    ['suggestion_1'],
    ['client/src/lib/utils/supabaseStorage.ts', 'client/src/components/fileUpload']
  ),
  createSuggestion(
    'Add Comprehensive Error Handling for Supabase Operations',
    'Implement robust error handling for all Supabase database operations',
    SuggestionCategory.ARCHITECTURE,
    SuggestionPriority.HIGH,
    [
      'Create error handling utilities',
      'Implement error boundaries',
      'Add error logging and monitoring',
      'Create user-friendly error messages'
    ],
    ['suggestion_1'],
    ['client/src/lib/utils/errorHandling.ts', 'client/src/components/ErrorBoundary.tsx']
  )
];
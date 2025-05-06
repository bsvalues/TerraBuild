import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';

// Story types that match the backend enum
export enum StoryType {
  COST_TRENDS = 'cost_trends',
  REGIONAL_COMPARISON = 'regional_comparison',
  BUILDING_TYPE_ANALYSIS = 'building_type_analysis',
  PROPERTY_INSIGHTS = 'property_insights',
  IMPROVEMENT_ANALYSIS = 'improvement_analysis',
  INFRASTRUCTURE_HEALTH = 'infrastructure_health',
  CUSTOM = 'custom'
}

export interface StoryRequest {
  storyType: StoryType;
  buildingTypes?: string[];
  regions?: string[];
  propertyIds?: number[];
  timeframe?: {
    start: Date;
    end: Date;
  };
  customPrompt?: string;
  includeCharts?: boolean;
  includeTables?: boolean;
}

export interface StoryInsight {
  id: string;
  title: string;
  narrative: string;
  charts?: any[];  // Chart configurations
  tables?: any[];  // Table data
  metadata: {
    storyType: StoryType;
    generatedAt: Date;
    dataPoints: number;
    confidenceScore: number;
    sources: string[];
  };
}

export interface StoryTypeInfo {
  type: StoryType;
  name: string;
  description: string;
}

/**
 * Hook to get the available story types
 */
export function useStoryTypes() {
  return useQuery({
    queryKey: ['/api/stories/types'],
    queryFn: async () => {
      const response = await fetch('/api/stories/types');
      if (!response.ok) {
        throw new Error('Failed to fetch story types');
      }
      const data = await response.json();
      return data.storyTypes as StoryTypeInfo[];
    }
  });
}

/**
 * Hook to generate a story
 */
export function useGenerateStory() {
  return useMutation({
    mutationFn: async (request: StoryRequest) => {
      return apiRequest('/api/stories/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });
    },
    onSuccess: () => {
      // Invalidate the stories cache when a new story is generated
      queryClient.invalidateQueries({ queryKey: ['/api/stories'] });
    }
  });
}
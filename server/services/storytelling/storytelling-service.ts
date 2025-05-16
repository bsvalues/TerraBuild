import { generateNarrative } from './anthropic-client';
import { db } from '../../db';
import { eq, desc, or, and, SQL } from 'drizzle-orm';
import { 
  costMatrices as costMatrix, 
  costMatrices as matrixDetail, 
  buildingTypes, 
  regions, 
  properties, 
  improvements,
  improvements as improvementDetails 
} from '@shared/schema';

// Types of infrastructure stories we can generate
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

/**
 * Class that handles generation of infrastructure narrative stories
 */
export class StorytellingService {
  /**
   * Generate a story based on the request parameters
   * @param request Story generation request parameters
   * @returns A story insight object with narrative and visualizations
   */
  public async generateStory(request: StoryRequest): Promise<StoryInsight> {
    // 1. Gather the appropriate data based on the story type
    const data = await this.gatherData(request);
    
    // 2. Create a prompt for the AI model
    const prompt = this.createPrompt(request, data);
    
    // 3. Generate the narrative using the Anthropic client
    const narrative = await generateNarrative(prompt, this.getSystemPrompt(request.storyType));
    
    // 4. Generate charts if requested
    const charts = request.includeCharts ? await this.generateCharts(request, data) : [];
    
    // 5. Generate tables if requested
    const tables = request.includeTables ? this.generateTables(request, data) : [];
    
    // 6. Create and return the story insight
    return {
      id: this.generateStoryId(),
      title: this.generateTitle(request, narrative),
      narrative,
      charts,
      tables,
      metadata: {
        storyType: request.storyType,
        generatedAt: new Date(),
        dataPoints: this.countDataPoints(data),
        confidenceScore: 0.85, // A placeholder, would be calculated based on data quality
        sources: this.getDataSources(request)
      }
    };
  }
  
  /**
   * Gather the appropriate data based on the story type and request parameters
   * @param request Story request parameters
   * @returns Object containing the data needed for the story
   */
  private async gatherData(request: StoryRequest): Promise<any> {
    switch (request.storyType) {
      case StoryType.COST_TRENDS:
        return this.gatherCostTrendsData(request);
      
      case StoryType.REGIONAL_COMPARISON:
        return this.gatherRegionalComparisonData(request);
      
      case StoryType.BUILDING_TYPE_ANALYSIS:
        return this.gatherBuildingTypeAnalysisData(request);
      
      case StoryType.PROPERTY_INSIGHTS:
        return this.gatherPropertyInsightsData(request);
      
      case StoryType.IMPROVEMENT_ANALYSIS:
        return this.gatherImprovementAnalysisData(request);
      
      case StoryType.INFRASTRUCTURE_HEALTH:
        return this.gatherInfrastructureHealthData(request);
      
      case StoryType.CUSTOM:
        return this.gatherCustomData(request);
      
      default:
        throw new Error(`Unsupported story type: ${request.storyType}`);
    }
  }
  
  /**
   * Gather data for cost trends analysis
   */
  private async gatherCostTrendsData(request: StoryRequest): Promise<any> {
    // Base query with no filters
    const baseQuery = db.select()
      .from(costMatrix)
      .leftJoin(matrixDetail, eq(costMatrix.id, matrixDetail.matrixId))
      .orderBy(desc(costMatrix.year));
      
    // Build filters based on request parameters
    let costData;
    
    // Different combinations of filters
    if (request.buildingTypes?.length && request.regions?.length) {
      // Both building types and regions are specified
      const buildingTypeConditions = request.buildingTypes.map(bt => eq(costMatrix.buildingType, bt));
      const regionConditions = request.regions.map(r => eq(costMatrix.region, r));
      
      costData = await baseQuery.where(
        and(
          or(...buildingTypeConditions),
          or(...regionConditions)
        )
      );
    } else if (request.buildingTypes?.length) {
      // Only building types are specified
      const buildingTypeConditions = request.buildingTypes.map(bt => eq(costMatrix.buildingType, bt));
      costData = await baseQuery.where(or(...buildingTypeConditions));
    } else if (request.regions?.length) {
      // Only regions are specified
      const regionConditions = request.regions.map(r => eq(costMatrix.region, r));
      costData = await baseQuery.where(or(...regionConditions));
    } else {
      // No filters
      costData = await baseQuery;
    }
    
    // Get building type and region details for better context
    const buildingTypeDetails = await db.select().from(buildingTypes);
    const regionDetails = await db.select().from(regions);
    
    return {
      costData,
      buildingTypeDetails,
      regionDetails
    };
  }
  
  /**
   * Gather data for regional comparison
   */
  private async gatherRegionalComparisonData(request: StoryRequest): Promise<any> {
    // Get region details
    const regionsList = await db.select().from(regions);
    
    // Base query with no filters
    const baseQuery = db.select()
      .from(costMatrix)
      .leftJoin(matrixDetail, eq(costMatrix.id, matrixDetail.matrixId))
      .leftJoin(regions, eq(costMatrix.region, regions.code));
      
    // Build filters based on request parameters
    let costByRegion;
    
    // Different combinations of filters
    if (request.buildingTypes?.length && request.regions?.length) {
      // Both building types and regions are specified
      const buildingTypeConditions = request.buildingTypes.map(bt => eq(costMatrix.buildingType, bt));
      const regionConditions = request.regions.map(r => eq(costMatrix.region, r));
      
      costByRegion = await baseQuery.where(
        and(
          or(...buildingTypeConditions),
          or(...regionConditions)
        )
      );
    } else if (request.buildingTypes?.length) {
      // Only building types are specified
      const buildingTypeConditions = request.buildingTypes.map(bt => eq(costMatrix.buildingType, bt));
      costByRegion = await baseQuery.where(or(...buildingTypeConditions));
    } else if (request.regions?.length) {
      // Only regions are specified
      const regionConditions = request.regions.map(r => eq(costMatrix.region, r));
      costByRegion = await baseQuery.where(or(...regionConditions));
    } else {
      // No filters
      costByRegion = await baseQuery;
    }
    
    // Calculate average costs by region
    const regionalAverages = this.calculateRegionalAverages(costByRegion);
    
    return {
      regions: regionsList,
      costByRegion,
      regionalAverages
    };
  }
  
  /**
   * Gather data for building type analysis
   */
  private async gatherBuildingTypeAnalysisData(request: StoryRequest): Promise<any> {
    // Get building type details
    const buildingTypesList = await db.select().from(buildingTypes);
    
    // Base query with no filters
    const baseQuery = db.select()
      .from(costMatrix)
      .leftJoin(matrixDetail, eq(costMatrix.id, matrixDetail.matrixId))
      .leftJoin(buildingTypes, eq(costMatrix.buildingType, buildingTypes.code));
    
    // Build filters based on request parameters
    let costByBuildingType;
    
    // Different combinations of filters
    if (request.buildingTypes?.length && request.regions?.length) {
      // Both building types and regions are specified
      const buildingTypeConditions = request.buildingTypes.map(bt => eq(costMatrix.buildingType, bt));
      const regionConditions = request.regions.map(r => eq(costMatrix.region, r));
      
      costByBuildingType = await baseQuery.where(
        and(
          or(...buildingTypeConditions),
          or(...regionConditions)
        )
      );
    } else if (request.buildingTypes?.length) {
      // Only building types are specified
      const buildingTypeConditions = request.buildingTypes.map(bt => eq(costMatrix.buildingType, bt));
      costByBuildingType = await baseQuery.where(or(...buildingTypeConditions));
    } else if (request.regions?.length) {
      // Only regions are specified
      const regionConditions = request.regions.map(r => eq(costMatrix.region, r));
      costByBuildingType = await baseQuery.where(or(...regionConditions));
    } else {
      // No filters
      costByBuildingType = await baseQuery;
    }
    
    // Calculate average costs by building type
    const buildingTypeAverages = this.calculateBuildingTypeAverages(costByBuildingType);
    
    return {
      buildingTypes: buildingTypesList,
      costByBuildingType,
      buildingTypeAverages
    };
  }
  
  /**
   * Gather data for property insights
   */
  private async gatherPropertyInsightsData(request: StoryRequest): Promise<any> {
    // Base query with no filters
    const baseQuery = db.select()
      .from(properties)
      .leftJoin(improvements, eq(properties.id, improvements.propertyId))
      .leftJoin(improvementDetails, eq(improvements.id, improvementDetails.improvementId));
    
    let propertyData;
    
    // Filter by property IDs if provided
    if (request.propertyIds && request.propertyIds.length > 0) {
      propertyData = await baseQuery.where(or(...request.propertyIds.map(id => eq(properties.id, id))));
    } else {
      propertyData = await baseQuery;
    }
    
    // Get relevant cost matrices for context
    const relevantCostMatrices = await db.select()
      .from(costMatrix)
      .leftJoin(matrixDetail, eq(costMatrix.id, matrixDetail.matrixId));
    
    return {
      propertyData,
      relevantCostMatrices
    };
  }
  
  /**
   * Gather data for improvement analysis
   */
  private async gatherImprovementAnalysisData(request: StoryRequest): Promise<any> {
    // Base query with no filters
    const baseQuery = db.select()
      .from(improvements)
      .leftJoin(improvementDetails, eq(improvements.id, improvementDetails.improvementId))
      .leftJoin(properties, eq(improvements.propertyId, properties.id));
    
    let improvementData;
    
    // Filter by property IDs if provided
    if (request.propertyIds && request.propertyIds.length > 0) {
      improvementData = await baseQuery.where(or(...request.propertyIds.map(id => eq(properties.id, id))));
    } else {
      improvementData = await baseQuery;
    }
    
    return {
      improvementData
    };
  }
  
  /**
   * Gather data for infrastructure health analysis
   */
  private async gatherInfrastructureHealthData(request: StoryRequest): Promise<any> {
    // This would typically involve collecting metrics from monitoring systems
    // For now, we'll use a simplified approach with the data we have
    
    // Base query with no filters
    const baseQuery = db.select()
      .from(properties)
      .leftJoin(improvements, eq(properties.id, improvements.propertyId))
      .leftJoin(improvementDetails, eq(improvements.id, improvementDetails.improvementId));
    
    let infrastructureData;
    
    // Filter by property IDs if provided
    if (request.propertyIds && request.propertyIds.length > 0) {
      infrastructureData = await baseQuery.where(or(...request.propertyIds.map(id => eq(properties.id, id))));
    } else {
      infrastructureData = await baseQuery;
    }
    
    // We would typically have more health indicators here
    return {
      infrastructureData
    };
  }
  
  /**
   * Gather data for custom analysis
   */
  private async gatherCustomData(request: StoryRequest): Promise<any> {
    // For custom analysis, gather a comprehensive set of data
    const costData = await db.select()
      .from(costMatrix)
      .leftJoin(matrixDetail, eq(costMatrix.id, matrixDetail.matrixId));
    
    const buildingTypesList = await db.select().from(buildingTypes);
    const regionsList = await db.select().from(regions);
    
    // Base query with no filters
    const basePropertyQuery = db.select()
      .from(properties)
      .leftJoin(improvements, eq(properties.id, improvements.propertyId))
      .leftJoin(improvementDetails, eq(improvements.id, improvementDetails.improvementId));
    
    let propertyData;
    
    // Filter by property IDs if provided
    if (request.propertyIds && request.propertyIds.length > 0) {
      propertyData = await basePropertyQuery.where(or(...request.propertyIds.map(id => eq(properties.id, id))));
    } else {
      propertyData = await basePropertyQuery;
    }
    
    return {
      costData,
      buildingTypes: buildingTypesList,
      regions: regionsList,
      propertyData
    };
  }
  
  /**
   * Create a prompt for the AI model based on the data and request
   */
  private createPrompt(request: StoryRequest, data: any): string {
    // For custom prompts, use the provided prompt
    if (request.storyType === StoryType.CUSTOM && request.customPrompt) {
      return `${request.customPrompt}\n\nHere is the data to analyze:\n${JSON.stringify(data, null, 2)}`;
    }
    
    // Create a prompt based on the story type
    let basePrompt = '';
    
    switch (request.storyType) {
      case StoryType.COST_TRENDS:
        basePrompt = 'Create a narrative that explains the trends in building costs over time. ' +
          'Identify patterns, notable increases or decreases, and potential factors affecting these changes. ' +
          'Include comparisons between different years and highlight significant variations.';
        break;
      
      case StoryType.REGIONAL_COMPARISON:
        basePrompt = 'Create a narrative that compares building costs across different regions. ' +
          'Identify which regions have higher or lower costs, explain potential reasons for these differences, ' +
          'and highlight any unusual patterns or outliers in the data.';
        break;
      
      case StoryType.BUILDING_TYPE_ANALYSIS:
        basePrompt = 'Create a narrative that analyzes the costs associated with different building types. ' +
          'Compare the costs between building categories, identify which types are more expensive to build ' +
          'or maintain, and explain factors that contribute to these differences.';
        break;
      
      case StoryType.PROPERTY_INSIGHTS:
        basePrompt = 'Create a narrative that provides insights into the selected properties. ' +
          'Analyze their characteristics, values, improvements, and how they compare to similar properties. ' +
          'Identify notable features or patterns that emerge from the data.';
        break;
      
      case StoryType.IMPROVEMENT_ANALYSIS:
        basePrompt = 'Create a narrative that analyzes property improvements. ' +
          'Discuss the types of improvements made, their costs, impacts on property value, ' +
          'and identify patterns or trends in improvement activities.';
        break;
      
      case StoryType.INFRASTRUCTURE_HEALTH:
        basePrompt = 'Create a narrative that assesses the overall health of the infrastructure. ' +
          'Analyze the condition of properties and improvements, identify areas of concern ' +
          'or exceptional quality, and provide insights into maintenance needs or priorities.';
        break;
      
      default:
        basePrompt = 'Create a comprehensive analysis of the infrastructure data provided. ' +
          'Identify key patterns, insights, and notable features in the data.';
    }
    
    // Add request-specific information to refine the prompt
    let refinements = '';
    
    if (request.buildingTypes && request.buildingTypes.length > 0) {
      refinements += `Focus on the following building types: ${request.buildingTypes.join(', ')}. `;
    }
    
    if (request.regions && request.regions.length > 0) {
      refinements += `Focus on the following regions: ${request.regions.join(', ')}. `;
    }
    
    if (request.propertyIds && request.propertyIds.length > 0) {
      refinements += `Focus on the properties with IDs: ${request.propertyIds.join(', ')}. `;
    }
    
    if (request.timeframe) {
      refinements += `Focus on the time period from ${request.timeframe.start.toISOString().split('T')[0]} to ${request.timeframe.end.toISOString().split('T')[0]}. `;
    }
    
    // Format the data as JSON string for the AI model
    const dataString = JSON.stringify(data, null, 2);
    
    // Combine all parts into a complete prompt
    return `${basePrompt}\n\n${refinements}\n\nPlease analyze the following data and create your narrative:\n${dataString}\n\nProvide insights in a clear, engaging narrative style that highlights the most important patterns and findings. Use analogies where helpful to make complex concepts more understandable. Structure your analysis with clear sections and make the information accessible to non-technical readers.`;
  }
  
  /**
   * Get the appropriate system prompt based on the story type
   */
  private getSystemPrompt(storyType: StoryType): string {
    switch (storyType) {
      case StoryType.COST_TRENDS:
        return 'You are an expert financial analyst specializing in infrastructure economics. Your role is to craft compelling narratives about building cost trends, making complex data accessible and insightful for policy makers and the public. Focus on long-term patterns, economic factors, and practical implications.';
      
      case StoryType.REGIONAL_COMPARISON:
        return 'You are a regional development expert with deep knowledge of how geography, regulations, and local economies impact infrastructure costs. Your narratives help decision makers understand regional variations and their causes, highlighting opportunities for standardization or region-specific approaches.';
      
      case StoryType.BUILDING_TYPE_ANALYSIS:
        return 'You are an architectural economist who specializes in analyzing how building types influence costs and value. Your narratives explain technical building classifications in accessible terms, highlighting factors that drive cost differences between structure types.';
      
      case StoryType.PROPERTY_INSIGHTS:
        return 'You are a property analysis expert who excels at extracting value insights from property data. Your narratives provide nuanced understanding of property characteristics, market positioning, and potential investment value.';
      
      case StoryType.IMPROVEMENT_ANALYSIS:
        return 'You are a renovation and improvement specialist who analyzes the cost-benefit impacts of property enhancements. Your narratives explain how different improvements affect property value, functionality, and long-term economics.';
      
      case StoryType.INFRASTRUCTURE_HEALTH:
        return 'You are an infrastructure sustainability expert who evaluates the condition and longevity of building systems. Your narratives translate technical condition assessments into accessible insights about maintenance priorities and long-term planning.';
      
      case StoryType.CUSTOM:
      default:
        return 'You are an insightful infrastructure analyst crafting compelling narratives about building costs and infrastructure data. Provide clear, engaging explanations that highlight key patterns and insights.';
    }
  }
  
  /**
   * Generate charts based on the data
   * This is a placeholder - in a real implementation, we would generate
   * chart configurations for visualization libraries like Chart.js
   */
  private async generateCharts(request: StoryRequest, data: any): Promise<any[]> {
    // In a real implementation, this would generate chart configurations 
    // based on the data and story type
    return [];
  }
  
  /**
   * Generate tables based on the data
   * This is a placeholder - in a real implementation, we would format
   * the data for display in tables
   */
  private generateTables(request: StoryRequest, data: any): any[] {
    // In a real implementation, this would format the data for tables
    return [];
  }
  
  /**
   * Generate a unique ID for the story
   */
  private generateStoryId(): string {
    return `story_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  }
  
  /**
   * Generate a title for the story based on the narrative
   */
  private generateTitle(request: StoryRequest, narrative: string): string {
    // Extract the first sentence of the narrative as a title
    const firstSentence = narrative.split(/\.|\?|!/)[0];
    
    // If it's too long, truncate it
    if (firstSentence.length > 60) {
      return `${firstSentence.substring(0, 57)}...`;
    }
    
    return firstSentence;
  }
  
  /**
   * Count the number of data points in the dataset
   */
  private countDataPoints(data: any): number {
    let count = 0;
    
    const countRecursive = (obj: any) => {
      if (typeof obj !== 'object' || obj === null) {
        count++;
        return;
      }
      
      if (Array.isArray(obj)) {
        count += obj.length;
        obj.forEach(item => {
          if (typeof item === 'object' && item !== null) {
            countRecursive(item);
          }
        });
      } else {
        Object.values(obj).forEach(value => {
          if (typeof value === 'object' && value !== null) {
            countRecursive(value);
          } else {
            count++;
          }
        });
      }
    };
    
    countRecursive(data);
    return count;
  }
  
  /**
   * Get data sources used in the analysis
   */
  private getDataSources(request: StoryRequest): string[] {
    const sources = ['Benton County Cost Matrix Database'];
    
    switch (request.storyType) {
      case StoryType.COST_TRENDS:
        sources.push('Historical Cost Trends Analysis');
        break;
      case StoryType.REGIONAL_COMPARISON:
        sources.push('Regional Economic Indicators');
        break;
      case StoryType.BUILDING_TYPE_ANALYSIS:
        sources.push('Building Classification Standards');
        break;
      case StoryType.PROPERTY_INSIGHTS:
        sources.push('Property Assessment Records');
        break;
      case StoryType.IMPROVEMENT_ANALYSIS:
        sources.push('Improvement Cost Records');
        break;
      case StoryType.INFRASTRUCTURE_HEALTH:
        sources.push('Infrastructure Condition Assessments');
        break;
      default:
        break;
    }
    
    return sources;
  }
  
  /**
   * Calculate average costs by region from cost data
   */
  private calculateRegionalAverages(costData: any[]): Record<string, number> {
    const sums: Record<string, number> = {};
    const counts: Record<string, number> = {};
    
    costData.forEach(item => {
      const region = item.costMatrix.region;
      const cost = item.matrixDetail?.baseCost || 0;
      
      if (!sums[region]) {
        sums[region] = 0;
        counts[region] = 0;
      }
      
      sums[region] += cost;
      counts[region]++;
    });
    
    const averages: Record<string, number> = {};
    
    Object.keys(sums).forEach(region => {
      averages[region] = counts[region] > 0 ? sums[region] / counts[region] : 0;
    });
    
    return averages;
  }
  
  /**
   * Calculate average costs by building type from cost data
   */
  private calculateBuildingTypeAverages(costData: any[]): Record<string, number> {
    const sums: Record<string, number> = {};
    const counts: Record<string, number> = {};
    
    costData.forEach(item => {
      const buildingType = item.costMatrix.buildingType;
      const cost = item.matrixDetail?.baseCost || 0;
      
      if (!sums[buildingType]) {
        sums[buildingType] = 0;
        counts[buildingType] = 0;
      }
      
      sums[buildingType] += cost;
      counts[buildingType]++;
    });
    
    const averages: Record<string, number> = {};
    
    Object.keys(sums).forEach(buildingType => {
      averages[buildingType] = counts[buildingType] > 0 ? sums[buildingType] / counts[buildingType] : 0;
    });
    
    return averages;
  }
}

// Export a singleton instance
export const storytellingService = new StorytellingService();
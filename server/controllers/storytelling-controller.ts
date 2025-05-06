import { Request, Response } from 'express';
import { StoryType, StoryRequest, storytellingService } from '../services/storytelling/storytelling-service';
import { z } from 'zod';

// Create a schema for validating story requests
const storyRequestSchema = z.object({
  storyType: z.enum([
    StoryType.COST_TRENDS,
    StoryType.REGIONAL_COMPARISON,
    StoryType.BUILDING_TYPE_ANALYSIS,
    StoryType.PROPERTY_INSIGHTS,
    StoryType.IMPROVEMENT_ANALYSIS,
    StoryType.INFRASTRUCTURE_HEALTH,
    StoryType.CUSTOM
  ]),
  buildingTypes: z.array(z.string()).optional(),
  regions: z.array(z.string()).optional(),
  propertyIds: z.array(z.number()).optional(),
  timeframe: z.object({
    start: z.string().transform(val => new Date(val)),
    end: z.string().transform(val => new Date(val))
  }).optional(),
  customPrompt: z.string().optional(),
  includeCharts: z.boolean().default(false),
  includeTables: z.boolean().default(false),
});

// Create a controller for the storytelling feature
export class StorytellingController {
  /**
   * Generate a story based on the request
   * @param req Express request
   * @param res Express response
   */
  public async generateStory(req: Request, res: Response): Promise<void> {
    try {
      // Validate the request
      const validationResult = storyRequestSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid request',
          details: validationResult.error.format()
        });
        return;
      }
      
      // Get the validated request
      const storyRequest = validationResult.data;
      
      // Generate the story
      const story = await storytellingService.generateStory(storyRequest);
      
      // Return the story
      res.status(200).json({
        success: true,
        story
      });
    } catch (error: unknown) {
      console.error('Error generating story:', error);
      
      res.status(500).json({
        success: false,
        error: 'Error generating story',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * Get a list of available story types
   * @param req Express request
   * @param res Express response
   */
  public getStoryTypes(req: Request, res: Response): void {
    try {
      // Create a description for each story type
      const storyTypes = [
        {
          type: StoryType.COST_TRENDS,
          name: 'Cost Trends Analysis',
          description: 'Analyze how building costs have changed over time, identifying patterns and trends.'
        },
        {
          type: StoryType.REGIONAL_COMPARISON,
          name: 'Regional Comparison',
          description: 'Compare building costs across different regions to identify geographic variations.'
        },
        {
          type: StoryType.BUILDING_TYPE_ANALYSIS,
          name: 'Building Type Analysis',
          description: 'Analyze how different building types compare in terms of costs and characteristics.'
        },
        {
          type: StoryType.PROPERTY_INSIGHTS,
          name: 'Property Insights',
          description: 'Generate insights about specific properties, their values, and characteristics.'
        },
        {
          type: StoryType.IMPROVEMENT_ANALYSIS,
          name: 'Improvement Analysis',
          description: 'Analyze property improvements, their costs, and impacts on property values.'
        },
        {
          type: StoryType.INFRASTRUCTURE_HEALTH,
          name: 'Infrastructure Health',
          description: 'Assess the overall health of infrastructure based on conditions and maintenance needs.'
        },
        {
          type: StoryType.CUSTOM,
          name: 'Custom Analysis',
          description: 'Create a custom analysis using your own prompt and selected data.'
        }
      ];
      
      res.status(200).json({
        success: true,
        storyTypes
      });
    } catch (error: unknown) {
      console.error('Error getting story types:', error);
      
      res.status(500).json({
        success: false,
        error: 'Error getting story types',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }
}

// Export a singleton instance
export const storytellingController = new StorytellingController();
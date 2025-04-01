import { Router, Request, Response } from 'express';
import { getRegionalCostsForHeatmap, getHierarchicalCostData, getStatisticalData } from '../storage/advancedAnalyticsStorage';

const router = Router();

/**
 * Get regional cost data for heatmap visualization
 * GET /api/benchmarking/regional-costs/:region/:buildingType
 */
router.get('/regional-costs/:region/:buildingType', async (req: Request, res: Response) => {
  try {
    const { region, buildingType } = req.params;
    
    if (!region || !buildingType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: region and buildingType'
      });
    }
    
    const result = await getRegionalCostsForHeatmap(region, buildingType);
    res.json(result);
  } catch (error) {
    console.error('Error fetching regional costs data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch regional costs data'
    });
  }
});

/**
 * Get hierarchical cost data for drill-down visualization
 * GET /api/benchmarking/hierarchical-costs/:region/:buildingType
 */
router.get('/hierarchical-costs/:region/:buildingType', async (req: Request, res: Response) => {
  try {
    const { region, buildingType } = req.params;
    
    if (!region || !buildingType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: region and buildingType'
      });
    }
    
    const result = await getHierarchicalCostData(region, buildingType);
    res.json(result);
  } catch (error) {
    console.error('Error fetching hierarchical costs data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch hierarchical costs data'
    });
  }
});

/**
 * Get statistical data for analysis
 * GET /api/benchmarking/statistical-data/:region/:buildingType
 */
router.get('/statistical-data/:region/:buildingType', async (req: Request, res: Response) => {
  try {
    const { region, buildingType } = req.params;
    
    if (!region || !buildingType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: region and buildingType'
      });
    }
    
    const result = await getStatisticalData(region, buildingType);
    res.json(result);
  } catch (error) {
    console.error('Error fetching statistical data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistical data'
    });
  }
});

export default router;
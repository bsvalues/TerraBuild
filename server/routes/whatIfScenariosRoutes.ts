/**
 * What-If Scenarios Routes for the BCBS Application
 * 
 * These routes handle what-if scenarios fetching and management.
 */
import { Router, Request, Response } from 'express';
import storage from '../storage';

// Demo what-if scenarios data for the MVP
const demoScenarios = [
  {
    id: 1,
    name: "Residential Building Cost Increase Scenario",
    description: "Analysis of potential cost increases for residential buildings in East Benton region",
    parameters: {
      baseCost: 150,
      squareFootage: 2200,
      complexity: 1.2,
      region: "East Benton",
      buildingType: "R1",
      baseYear: 2025,
      comparisonYear: 2025,
      adjustmentFactor: 1.2,
      qualityFactor: 1.1,
      conditionFactor: 1.0
    },
    results: {
      baseCost: 330000,
      adjustedCost: 396000,
      difference: 66000,
      percentChange: 20.0,
      details: [
        { factor: "Region", impact: 16500, percentImpact: 25.0 },
        { factor: "Quality", impact: 33000, percentImpact: 50.0 },
        { factor: "Complexity", impact: 16500, percentImpact: 25.0 }
      ],
      chartData: [
        { year: 2020, value: 300000 },
        { year: 2021, value: 310000 },
        { year: 2022, value: 318000 },
        { year: 2023, value: 325000 },
        { year: 2024, value: 328000 },
        { year: 2025, value: 330000 },
        { year: 2026, value: 350000, projected: true },
        { year: 2027, value: 370000, projected: true }
      ]
    },
    createdAt: "2025-03-10T14:00:00Z",
    updatedAt: "2025-03-10T14:00:00Z",
    userId: 1,
    isSaved: true,
    is_saved: true
  },
  {
    id: 2,
    name: "Commercial Property Value Projection",
    description: "Five-year projection of commercial property values with various improvement scenarios",
    parameters: {
      baseCost: 185,
      squareFootage: 5000,
      complexity: 1.5,
      region: "Central Benton",
      buildingType: "C1",
      baseYear: 2025,
      comparisonYear: 2028,
      adjustmentFactor: 1.15,
      qualityFactor: 1.2,
      conditionFactor: 1.05
    },
    results: {
      baseCost: 925000,
      adjustedCost: 1063750,
      difference: 138750,
      percentChange: 15.0,
      details: [
        { factor: "Time Value", impact: 46250, percentImpact: 33.3 },
        { factor: "Quality", impact: 55500, percentImpact: 40.0 },
        { factor: "Complexity", impact: 37000, percentImpact: 26.7 }
      ],
      chartData: [
        { year: 2025, value: 925000 },
        { year: 2026, value: 960000, projected: true },
        { year: 2027, value: 1010000, projected: true },
        { year: 2028, value: 1063750, projected: true }
      ]
    },
    createdAt: "2025-03-08T11:30:00Z",
    updatedAt: "2025-03-09T09:15:00Z",
    userId: 1,
    isSaved: true,
    is_saved: true
  },
  {
    id: 3,
    name: "Agricultural Land Valuation Factors",
    description: "Impact of irrigation improvements on agricultural property values",
    parameters: {
      baseCost: 95,
      squareFootage: 12000,
      complexity: 0.8,
      region: "West Benton",
      buildingType: "A1",
      baseYear: 2025,
      comparisonYear: 2025,
      adjustmentFactor: 1.0,
      qualityFactor: 1.3,
      conditionFactor: 1.1
    },
    results: {
      baseCost: 1140000,
      adjustedCost: 1482000,
      difference: 342000,
      percentChange: 30.0,
      details: [
        { factor: "Quality Improvements", impact: 228000, percentImpact: 66.7 },
        { factor: "Condition Upgrade", impact: 114000, percentImpact: 33.3 }
      ]
    },
    createdAt: "2025-03-05T16:20:00Z",
    updatedAt: "2025-03-05T16:20:00Z",
    userId: 1,
    isSaved: false,
    is_saved: false
  }
];

// Demo variations for scenarios
const demoVariations = [
  {
    id: 1,
    scenarioId: 1,
    name: "10% Material Cost Increase",
    description: "Impact of 10% increase in material costs",
    parameters: {
      baseCost: 165,
      materialCostFactor: 1.1
    },
    createdAt: "2025-03-10T14:30:00Z"
  },
  {
    id: 2,
    scenarioId: 1,
    name: "Labor Shortage Impact",
    description: "Impact of labor shortage and wage increases",
    parameters: {
      baseCost: 158,
      laborCostFactor: 1.15
    },
    createdAt: "2025-03-10T14:35:00Z"
  },
  {
    id: 3,
    scenarioId: 2, 
    name: "Premium Finishes",
    description: "Impact of premium finishes on commercial property value",
    parameters: {
      qualityFactor: 1.25,
      baseCost: 205
    },
    createdAt: "2025-03-09T09:20:00Z"
  }
];

const router = Router();

// Get all scenarios
router.get('/', async (req: Request, res: Response) => {
  try {
    // For demo purposes, just return the demo scenarios
    // In production, this would fetch from database
    res.json(demoScenarios);
  } catch (error) {
    console.error('Error fetching scenarios:', error);
    res.status(500).json({ error: 'Failed to fetch scenarios' });
  }
});

// Get a specific scenario by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const scenarioId = parseInt(req.params.id);
    
    // Find the scenario in demo data
    const scenario = demoScenarios.find(s => s.id === scenarioId);
    
    if (!scenario) {
      return res.status(404).json({ error: 'Scenario not found' });
    }
    
    res.json(scenario);
  } catch (error) {
    console.error('Error fetching scenario:', error);
    res.status(500).json({ error: 'Failed to fetch scenario' });
  }
});

// Get scenarios for a specific user
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    
    // Filter scenarios by user ID
    const userScenarios = demoScenarios.filter(s => s.userId === userId);
    
    res.json(userScenarios);
  } catch (error) {
    console.error('Error fetching user scenarios:', error);
    res.status(500).json({ error: 'Failed to fetch user scenarios' });
  }
});

// Get variations for a specific scenario
router.get('/:id/variations', async (req: Request, res: Response) => {
  try {
    const scenarioId = parseInt(req.params.id);
    
    // Filter variations by scenario ID
    const variations = demoVariations.filter(v => v.scenarioId === scenarioId);
    
    res.json(variations);
  } catch (error) {
    console.error('Error fetching scenario variations:', error);
    res.status(500).json({ error: 'Failed to fetch scenario variations' });
  }
});

// Get impact analysis for a specific scenario
router.get('/:id/impact', async (req: Request, res: Response) => {
  try {
    const scenarioId = parseInt(req.params.id);
    
    // Find the scenario
    const scenario = demoScenarios.find(s => s.id === scenarioId);
    
    if (!scenario) {
      return res.status(404).json({ error: 'Scenario not found' });
    }
    
    // Find variations
    const variations = demoVariations.filter(v => v.scenarioId === scenarioId);
    
    // Create demo impact analysis
    const impactAnalysis = {
      baselineCost: scenario.parameters.baseCost * scenario.parameters.squareFootage,
      variations: variations.map(v => ({
        name: v.name,
        cost: v.parameters.baseCost * scenario.parameters.squareFootage,
        percentChange: ((v.parameters.baseCost - scenario.parameters.baseCost) / scenario.parameters.baseCost) * 100
      })),
      factors: [
        { name: "Region", impact: 10.5 },
        { name: "Complexity", impact: 8.2 },
        { name: "Quality", impact: 15.3 }
      ],
      recommendations: [
        "Consider phasing construction to mitigate cost increases",
        "Evaluate alternative materials for non-structural components",
        "Review regional cost differences for optimal timing"
      ]
    };
    
    res.json(impactAnalysis);
  } catch (error) {
    console.error('Error generating impact analysis:', error);
    res.status(500).json({ error: 'Failed to generate impact analysis' });
  }
});

// Create a new scenario
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, parameters, userId } = req.body;
    
    // Validation
    if (!name || !parameters) {
      return res.status(400).json({ error: 'Name and parameters are required' });
    }
    
    // Calculate base cost (in a real app, this would use more complex logic)
    const baseCost = parameters.baseCost * parameters.squareFootage || 0;
    // Calculate adjustment factor from parameters or use a default
    const adjustmentFactor = parameters.adjustmentFactor || 1.2;
    // Calculate adjusted cost
    const adjustedCost = baseCost * adjustmentFactor;
    // Calculate difference
    const difference = adjustedCost - baseCost;
    // Calculate percent change
    const percentChange = (difference / baseCost) * 100;
    
    // Generate sample details for visualization
    const details = [
      { 
        factor: "Region", 
        impact: difference * 0.3, 
        percentImpact: 30.0 
      },
      { 
        factor: "Quality", 
        impact: difference * 0.4, 
        percentImpact: 40.0 
      },
      { 
        factor: "Complexity", 
        impact: difference * 0.3, 
        percentImpact: 30.0 
      }
    ];
    
    // Create a new scenario with results
    const newScenario = {
      id: demoScenarios.length + 1,
      name,
      description: description || '',
      parameters,
      results: {
        baseCost,
        adjustedCost,
        difference,
        percentChange,
        details
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: userId || 1,
      isSaved: false,
      is_saved: false
    };
    
    // Add to demo scenarios (this won't persist after server restart)
    demoScenarios.push(newScenario);
    
    res.status(201).json(newScenario);
  } catch (error) {
    console.error('Error creating scenario:', error);
    res.status(500).json({ error: 'Failed to create scenario' });
  }
});

// Update a scenario
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const scenarioId = parseInt(req.params.id);
    const { name, description, parameters, isSaved, is_saved } = req.body;
    
    // Find the scenario in demo data
    const scenarioIndex = demoScenarios.findIndex(s => s.id === scenarioId);
    
    if (scenarioIndex === -1) {
      return res.status(404).json({ error: 'Scenario not found' });
    }
    
    // Determine saved state (prefer is_saved if both are provided)
    const savedState = is_saved !== undefined ? is_saved : 
                      (isSaved !== undefined ? isSaved : demoScenarios[scenarioIndex].isSaved);
    
    // Update scenario
    const updatedScenario = {
      ...demoScenarios[scenarioIndex],
      name: name || demoScenarios[scenarioIndex].name,
      description: description !== undefined ? description : demoScenarios[scenarioIndex].description,
      parameters: parameters || demoScenarios[scenarioIndex].parameters,
      isSaved: savedState,
      is_saved: savedState,
      updatedAt: new Date().toISOString()
    };
    
    demoScenarios[scenarioIndex] = updatedScenario;
    
    res.json(updatedScenario);
  } catch (error) {
    console.error('Error updating scenario:', error);
    res.status(500).json({ error: 'Failed to update scenario' });
  }
});

// Mark a scenario as saved
router.post('/:id/save', async (req: Request, res: Response) => {
  try {
    const scenarioId = parseInt(req.params.id);
    
    // Find the scenario in demo data
    const scenarioIndex = demoScenarios.findIndex(s => s.id === scenarioId);
    
    if (scenarioIndex === -1) {
      return res.status(404).json({ error: 'Scenario not found' });
    }
    
    // Update isSaved flag (support both formats for maximum compatibility)
    demoScenarios[scenarioIndex] = {
      ...demoScenarios[scenarioIndex],
      isSaved: true,
      is_saved: true,
      updatedAt: new Date().toISOString()
    };
    
    res.json(demoScenarios[scenarioIndex]);
  } catch (error) {
    console.error('Error saving scenario:', error);
    res.status(500).json({ error: 'Failed to save scenario' });
  }
});

// Delete a scenario
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const scenarioId = parseInt(req.params.id);
    
    // Find the scenario in demo data
    const scenarioIndex = demoScenarios.findIndex(s => s.id === scenarioId);
    
    if (scenarioIndex === -1) {
      return res.status(404).json({ error: 'Scenario not found' });
    }
    
    // Remove from demo scenarios
    demoScenarios.splice(scenarioIndex, 1);
    
    // Also remove associated variations
    const variationIndicesToRemove = [];
    for (let i = 0; i < demoVariations.length; i++) {
      if (demoVariations[i].scenarioId === scenarioId) {
        variationIndicesToRemove.push(i);
      }
    }
    
    // Remove variations in reverse order to avoid index shifting
    for (let i = variationIndicesToRemove.length - 1; i >= 0; i--) {
      demoVariations.splice(variationIndicesToRemove[i], 1);
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting scenario:', error);
    res.status(500).json({ error: 'Failed to delete scenario' });
  }
});

// Add a variation to a scenario
router.post('/:id/variations', async (req: Request, res: Response) => {
  try {
    const scenarioId = parseInt(req.params.id);
    const { name, description, parameters } = req.body;
    
    // Validation
    if (!name || !parameters) {
      return res.status(400).json({ error: 'Name and parameters are required' });
    }
    
    // Check if the scenario exists
    const scenario = demoScenarios.find(s => s.id === scenarioId);
    if (!scenario) {
      return res.status(404).json({ error: 'Scenario not found' });
    }
    
    // Create a new variation
    const newVariation = {
      id: demoVariations.length + 1,
      scenarioId,
      name,
      description: description || '',
      parameters,
      createdAt: new Date().toISOString()
    };
    
    // Add to demo variations
    demoVariations.push(newVariation);
    
    res.status(201).json(newVariation);
  } catch (error) {
    console.error('Error creating variation:', error);
    res.status(500).json({ error: 'Failed to create variation' });
  }
});

// Delete a variation
router.delete('/variations/:id', async (req: Request, res: Response) => {
  try {
    const variationId = parseInt(req.params.id);
    
    // Find the variation
    const variationIndex = demoVariations.findIndex(v => v.id === variationId);
    
    if (variationIndex === -1) {
      return res.status(404).json({ error: 'Variation not found' });
    }
    
    // Remove the variation
    demoVariations.splice(variationIndex, 1);
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting variation:', error);
    res.status(500).json({ error: 'Failed to delete variation' });
  }
});

export default router;
# AI-Generated Hook Example

This document demonstrates how the Replit AI Agent would generate a custom hook for cost calculations, extracted from the BCBSCostCalculator component.

## Prompt to AI Agent

```
Create a custom hook called useCostCalculation that extracts the cost calculation logic from the BCBSCostCalculator component.

The hook should:
1. Accept all necessary inputs (square footage, building type, quality, etc.)
2. Handle all property types (buildings, vehicles, boats, business property)
3. Calculate costs including regional adjustments and age depreciation
4. Return total cost, cost breakdown, and other relevant data
5. Include proper TypeScript types and documentation

Extract the logic from the existing component and refactor it for clarity, better organization, and maintainability.
```

## AI-Generated Response

Below is the custom hook that the AI Agent might generate based on the prompt:

```typescript
// client/src/hooks/use-cost-calculation.ts

import { useMemo } from 'react';

// Types
export type PropertyType = 'RESIDENTIAL' | 'COMMERCIAL' | 'INDUSTRIAL' | 'AGRICULTURAL' | 
                           'VEHICLE' | 'BOAT' | 'BUSINESS_PROPERTY';

export type QualityLevel = 'ECONOMY' | 'STANDARD' | 'PREMIUM' | 'LUXURY' | 'CUSTOM';

export type RegionCode = 'RICHLAND' | 'KENNEWICK' | 'PASCO' | 'WEST_RICHLAND' | 
                         'BENTON_CITY' | 'PROSSER' | 'OTHER_BENTON' |
                         'NORTHEAST' | 'MIDWEST' | 'SOUTH' | 'WEST' |
                         'LITTLE_ROCK' | 'FAYETTEVILLE' | 'JONESBORO' | 'OTHER_ARKANSAS';

export interface CostBreakdown {
  category: string;
  cost: number;
}

export interface CostCalculationInput {
  squareFootage?: number;
  buildingType: PropertyType;
  quality: QualityLevel;
  region: RegionCode;
  buildingAge: number;
  complexityFactor: number;
  conditionFactor: number;
  // Vehicle-specific inputs
  vehicleValue?: number;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  // Boat-specific inputs
  boatValue?: number;
  boatLength?: number;
  boatType?: string;
  // Business property inputs
  businessPropertyValue?: number;
  businessPropertyType?: string;
  businessPropertyCategory?: string;
}

export interface CostCalculationResult {
  totalCost: number;
  baseCost: number;
  adjustedCost: number;
  depreciatedCost: number;
  costBreakdown: CostBreakdown[];
  regionalMultiplier: number;
  depreciation: {
    factor: number;
    percentage: number;
    color: string;
  };
}

/**
 * Custom hook for calculating property costs based on various inputs
 * 
 * This hook handles calculations for all property types (buildings, vehicles, etc.)
 * and accounts for regional factors, quality levels, and age depreciation.
 * 
 * @param input - Object containing all calculation inputs
 * @returns Object with calculation results including total cost and breakdown
 */
export function useCostCalculation(input: CostCalculationInput): CostCalculationResult {
  // Regional multiplier lookup
  const getRegionalMultiplier = (region: RegionCode): number => {
    const multipliers: Record<RegionCode, number> = {
      // Washington - Benton County regions
      'RICHLAND': 1.05,
      'KENNEWICK': 1.02,
      'PASCO': 1.0,
      'WEST_RICHLAND': 1.07,
      'BENTON_CITY': 0.95,
      'PROSSER': 0.93,
      'OTHER_BENTON': 0.98,
      
      // General US regions (for comparison purposes)
      'NORTHEAST': 1.15,
      'MIDWEST': 1.0,
      'SOUTH': 0.92,
      'WEST': 1.25,
      
      // Arkansas regions
      'LITTLE_ROCK': 0.97,
      'FAYETTEVILLE': 1.03,
      'JONESBORO': 0.91,
      'OTHER_ARKANSAS': 0.89
    };
    
    return multipliers[region] || 1.0;
  };

  // Base cost per square foot lookup
  const getBaseCostPerSqFt = (buildingType: PropertyType, quality: QualityLevel): number => {
    const baseCosts: Record<PropertyType, Record<QualityLevel, number>> = {
      'RESIDENTIAL': { 
        'ECONOMY': 95, 
        'STANDARD': 125, 
        'PREMIUM': 175, 
        'LUXURY': 250, 
        'CUSTOM': 300 
      },
      'COMMERCIAL': { 
        'ECONOMY': 110, 
        'STANDARD': 150, 
        'PREMIUM': 200, 
        'LUXURY': 300,
        'CUSTOM': 350 
      },
      'INDUSTRIAL': { 
        'ECONOMY': 80, 
        'STANDARD': 100, 
        'PREMIUM': 150, 
        'LUXURY': 225,
        'CUSTOM': 275 
      },
      'AGRICULTURAL': { 
        'ECONOMY': 60, 
        'STANDARD': 85, 
        'PREMIUM': 120, 
        'LUXURY': 180,
        'CUSTOM': 220 
      },
      // For non-building property types, we use a different approach:
      // These are priced per unit value, not per square foot
      'VEHICLE': { 
        'ECONOMY': 25,  // Value per $1000 of assessed value
        'STANDARD': 35, 
        'PREMIUM': 45, 
        'LUXURY': 60,
        'CUSTOM': 75 
      },
      'BOAT': { 
        'ECONOMY': 30,  // Value per $1000 of assessed value
        'STANDARD': 40, 
        'PREMIUM': 55, 
        'LUXURY': 70,
        'CUSTOM': 85 
      },
      'BUSINESS_PROPERTY': { 
        'ECONOMY': 20,  // Value per $1000 of assessed value
        'STANDARD': 30, 
        'PREMIUM': 40, 
        'LUXURY': 50,
        'CUSTOM': 60 
      }
    };
    
    // Return the base cost or a reasonable default if not found
    return baseCosts[buildingType]?.[quality] || 150;
  };
  
  // Calculate depreciation factor based on building age and type
  const calculateAgeDepreciation = (buildingAge: number, buildingType: PropertyType): number => {
    // No depreciation for new buildings
    if (buildingAge === 0) {
      return 1.0;
    }
    
    // Configure depreciation rates by building type based on Arkansas/Benton County standards
    const annualDepreciationRates: Record<PropertyType, number> = {
      'RESIDENTIAL': 0.01333, // 1.333% per year (80% over 15 years)
      'COMMERCIAL': 0.01,     // 1% per year (80% over 20 years)
      'INDUSTRIAL': 0.00889,  // 0.889% per year (80% over 25 years)
      'AGRICULTURAL': 0.0125, // 1.25% per year
      'VEHICLE': 0.15,        // 15% per year for vehicles
      'BOAT': 0.10,           // 10% per year for boats
      'BUSINESS_PROPERTY': 0.10 // 10% per year for business personal property
    };
    
    // Configure minimum depreciation values (maximum age effect)
    const minimumDepreciationValues: Record<PropertyType, number> = {
      'RESIDENTIAL': 0.3,   // Residential buildings retain at least 30% of value
      'COMMERCIAL': 0.25,   // Commercial buildings retain at least 25% of value
      'INDUSTRIAL': 0.2,    // Industrial buildings retain at least 20% of value
      'AGRICULTURAL': 0.15, // Agricultural buildings retain at least 15% of value
      'VEHICLE': 0.1,       // Vehicles retain at least 10% of value
      'BOAT': 0.15,         // Boats retain at least 15% of value
      'BUSINESS_PROPERTY': 0.1 // Business property retains at least 10% of value
    };
    
    // Maximum age considerations
    const maximumAgeYears: Record<PropertyType, number> = {
      'RESIDENTIAL': 60,
      'COMMERCIAL': 75,
      'INDUSTRIAL': 90,
      'AGRICULTURAL': 68,
      'VEHICLE': 15,
      'BOAT': 20,
      'BUSINESS_PROPERTY': 10
    };
    
    // Cap the building age at the maximum for this property type
    const maxAge = maximumAgeYears[buildingType] || maximumAgeYears['RESIDENTIAL'];
    const cappedAge = Math.min(buildingAge, maxAge);
    
    // Get depreciation rate for building type (default to residential if not found)
    const annualRate = annualDepreciationRates[buildingType] || annualDepreciationRates['RESIDENTIAL'];
    
    // Calculate depreciation factor
    const calculatedDepreciation = 1.0 - (cappedAge * annualRate);
    
    // Apply minimum value
    const minimumValue = minimumDepreciationValues[buildingType] || minimumDepreciationValues['RESIDENTIAL'];
    
    // Return the larger of the calculated value or the minimum value
    return Math.max(calculatedDepreciation, minimumValue);
  };
  
  // Get the current depreciation percentage for display
  const getDepreciationPercentage = (buildingAge: number, buildingType: PropertyType): number => {
    if (buildingAge === 0) return 0;
    
    const depreciationFactor = calculateAgeDepreciation(buildingAge, buildingType);
    return Math.round((1 - depreciationFactor) * 100);
  };
  
  // Get a color representation of the depreciation severity
  const getDepreciationColor = (percentage: number): string => {
    if (percentage < 15) return "#3CAB36"; // Low depreciation (green)
    if (percentage < 40) return "#F5A623"; // Medium depreciation (amber)
    return "#E53935";                      // High depreciation (red)
  };

  // Main calculation function - memoized to prevent unnecessary recalculation
  return useMemo(() => {
    const {
      squareFootage = 0,
      buildingType,
      quality,
      region,
      buildingAge,
      complexityFactor,
      conditionFactor,
      vehicleValue = 0,
      boatValue = 0,
      businessPropertyValue = 0
    } = input;

    const regionalMultiplier = getRegionalMultiplier(region);
    let baseCost = 0;
    let adjustedCost = 0;
    let depreciatedCost = 0;
    const costBreakdown: CostBreakdown[] = [];
    
    // Calculate depreciation factor once
    const ageDepreciationFactor = calculateAgeDepreciation(buildingAge, buildingType);
    const depreciationPercentage = getDepreciationPercentage(buildingAge, buildingType);
    const depreciationColor = getDepreciationColor(depreciationPercentage);
    
    // Calculate based on property type
    switch (buildingType) {
      case 'VEHICLE':
        // Base rate per $1000 of value
        const vehicleBaseRatePerThousand = getBaseCostPerSqFt(buildingType, quality);
        baseCost = (vehicleValue / 1000) * vehicleBaseRatePerThousand;
        adjustedCost = baseCost * regionalMultiplier * conditionFactor;
        depreciatedCost = adjustedCost * ageDepreciationFactor;
        
        // Cost breakdown
        costBreakdown.push({ category: 'Base Assessment', cost: baseCost });
        costBreakdown.push({ category: 'Condition Adjustment', cost: baseCost * (conditionFactor - 1) });
        costBreakdown.push({ category: 'Regional Adjustment', cost: (baseCost * conditionFactor * regionalMultiplier) - (baseCost * conditionFactor) });
        costBreakdown.push({ category: 'Age Depreciation', cost: adjustedCost - depreciatedCost });
        break;
        
      case 'BOAT':
        // Base rate per $1000 of value
        const boatBaseRatePerThousand = getBaseCostPerSqFt(buildingType, quality);
        baseCost = (boatValue / 1000) * boatBaseRatePerThousand;
        adjustedCost = baseCost * regionalMultiplier * conditionFactor;
        depreciatedCost = adjustedCost * ageDepreciationFactor;
        
        // Cost breakdown
        costBreakdown.push({ category: 'Base Assessment', cost: baseCost });
        costBreakdown.push({ category: 'Condition Adjustment', cost: baseCost * (conditionFactor - 1) });
        costBreakdown.push({ category: 'Regional Adjustment', cost: (baseCost * conditionFactor * regionalMultiplier) - (baseCost * conditionFactor) });
        costBreakdown.push({ category: 'Age Depreciation', cost: adjustedCost - depreciatedCost });
        break;
        
      case 'BUSINESS_PROPERTY':
        // Base rate per $1000 of value
        const businessBaseRatePerThousand = getBaseCostPerSqFt(buildingType, quality);
        baseCost = (businessPropertyValue / 1000) * businessBaseRatePerThousand;
        adjustedCost = baseCost * regionalMultiplier * conditionFactor;
        depreciatedCost = adjustedCost * ageDepreciationFactor;
        
        // Cost breakdown
        costBreakdown.push({ category: 'Base Assessment', cost: baseCost });
        costBreakdown.push({ category: 'Condition Adjustment', cost: baseCost * (conditionFactor - 1) });
        costBreakdown.push({ category: 'Regional Adjustment', cost: (baseCost * conditionFactor * regionalMultiplier) - (baseCost * conditionFactor) });
        costBreakdown.push({ category: 'Age Depreciation', cost: adjustedCost - depreciatedCost });
        break;
        
      default: // Building types (RESIDENTIAL, COMMERCIAL, INDUSTRIAL, AGRICULTURAL)
        // Cost per square foot
        const baseCostPerSqFt = getBaseCostPerSqFt(buildingType, quality);
        baseCost = squareFootage * baseCostPerSqFt;
        
        // Apply complexity factor for buildings
        const complexityAdjustment = baseCost * (complexityFactor - 1);
        const costWithComplexity = baseCost + complexityAdjustment;
        
        // Apply condition factor
        const conditionAdjustment = costWithComplexity * (conditionFactor - 1);
        const costWithCondition = costWithComplexity + conditionAdjustment;
        
        // Apply regional multiplier
        const regionalAdjustment = costWithCondition * (regionalMultiplier - 1);
        adjustedCost = costWithCondition + regionalAdjustment;
        
        // Apply age depreciation
        depreciatedCost = adjustedCost * ageDepreciationFactor;
        
        // Cost breakdown for buildings
        costBreakdown.push({ category: 'Base Cost', cost: baseCost });
        costBreakdown.push({ category: 'Complexity Adjustment', cost: complexityAdjustment });
        costBreakdown.push({ category: 'Condition Adjustment', cost: conditionAdjustment });
        costBreakdown.push({ category: 'Regional Adjustment', cost: regionalAdjustment });
        costBreakdown.push({ category: 'Age Depreciation', cost: adjustedCost - depreciatedCost });
        break;
    }
    
    // Return the calculation results
    return {
      totalCost: depreciatedCost,
      baseCost,
      adjustedCost,
      depreciatedCost,
      costBreakdown,
      regionalMultiplier,
      depreciation: {
        factor: ageDepreciationFactor,
        percentage: depreciationPercentage,
        color: depreciationColor
      }
    };
  }, [
    input.squareFootage,
    input.buildingType,
    input.quality,
    input.region,
    input.buildingAge,
    input.complexityFactor,
    input.conditionFactor,
    input.vehicleValue,
    input.boatValue,
    input.businessPropertyValue
  ]);
}
```

## How to Use the Hook

The AI Agent would then provide an example of how to use this hook in a component:

```tsx
// Example usage in a component
import { useCostCalculation } from '@/hooks/use-cost-calculation';

function CostCalculatorComponent() {
  const [inputs, setInputs] = useState({
    squareFootage: 1000,
    buildingType: 'RESIDENTIAL' as const,
    quality: 'STANDARD' as const,
    region: 'RICHLAND' as const,
    buildingAge: 0,
    complexityFactor: 1.0,
    conditionFactor: 1.0
  });
  
  // Use the custom hook to calculate costs
  const {
    totalCost,
    costBreakdown,
    depreciation
  } = useCostCalculation(inputs);
  
  // Component logic and rendering...
  
  return (
    <div>
      <h2>Cost Calculation Result</h2>
      <p>Total Cost: ${totalCost.toLocaleString()}</p>
      
      <h3>Cost Breakdown</h3>
      <ul>
        {costBreakdown.map((item, index) => (
          <li key={index}>
            {item.category}: ${item.cost.toLocaleString()}
          </li>
        ))}
      </ul>
      
      <p>Depreciation: {depreciation.percentage}%</p>
    </div>
  );
}
```

## Benefits of the Refactored Hook

1. **Improved Type Safety**: Proper TypeScript types for inputs and outputs
2. **Separation of Concerns**: Calculation logic is separated from UI
3. **Memoization**: Performance optimization with useMemo
4. **Reusability**: Can be used in multiple components
5. **Maintainability**: Logic is organized and documented
6. **Testability**: Easier to write unit tests for isolated logic

This example demonstrates how the Replit AI Agent can help refactor complex components into more maintainable, reusable pieces following best practices.
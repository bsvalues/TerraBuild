# How TerraBuild's Cost Analysis System Works

## Overview

TerraBuild uses a sophisticated multi-factor cost calculation engine that applies Marshall Swift methodology adapted for municipal property assessment. The system combines base construction costs with regional, quality, condition, and complexity adjustments to produce accurate property valuations.

## Core Components

### 1. Base Cost Tables
The foundation uses standardized construction costs per square foot by property type:

```json
{
  "baseRates": {
    "RESIDENTIAL": 125.5,
    "COMMERCIAL": 145.75,
    "INDUSTRIAL": 110.25,
    "AGRICULTURAL": 85.0,
    "WAREHOUSE": 95.5,
    "RETAIL": 135.0,
    "OFFICE": 150.25,
    "MIXED_USE": 140.0,
    "APARTMENT": 130.5,
    "HOTEL": 175.25,
    "RESTAURANT": 190.0,
    "MEDICAL": 205.5,
    "EDUCATIONAL": 195.25
  }
}
```

### 2. Regional Adjustment Factors
Location-specific multipliers based on Benton County geographic codes:

```json
{
  "regionFactors": {
    "Richland": 1.05,
    "Kennewick": 1.04,
    "Prosser": 0.96,
    "West Richland": 1.03,
    "Benton City": 0.98,
    "5N-24E": 1.04,
    "5N-25E": 1.05,
    "10N-24E": 0.98
  }
}
```

### 3. Quality Adjustment Matrix
Construction quality multipliers affecting final valuation:

```json
{
  "qualityFactors": {
    "LOW": 0.85,
    "ECONOMY": 0.9,
    "STANDARD": 1.0,
    "GOOD": 1.1,
    "VERY_GOOD": 1.2,
    "EXCELLENT": 1.3,
    "LUXURY": 1.5,
    "PREMIUM": 1.75
  }
}
```

### 4. Condition Assessment Factors
Physical condition impact on property value:

```json
{
  "conditionFactors": {
    "POOR": 0.7,
    "FAIR": 0.85,
    "AVERAGE": 1.0,
    "GOOD": 1.05,
    "VERY_GOOD": 1.1,
    "EXCELLENT": 1.15,
    "NEW": 1.2
  }
}
```

### 5. Complexity Multipliers
Building complexity adjustments for stories, foundation, roof, and HVAC:

```json
{
  "complexityFactors": {
    "STORIES": {
      "1": 1.0,
      "2": 1.05,
      "3": 1.12,
      "4": 1.18,
      "5_PLUS": 1.25
    },
    "FOUNDATION": {
      "SLAB": 1.0,
      "CRAWLSPACE": 1.05,
      "BASEMENT": 1.15,
      "FULL_BASEMENT": 1.2
    },
    "ROOF": {
      "ASPHALT": 1.0,
      "METAL": 1.08,
      "TILE": 1.15,
      "SLATE": 1.25
    },
    "HVAC": {
      "BASIC": 1.0,
      "CENTRAL": 1.1,
      "ZONED": 1.15,
      "ADVANCED": 1.2
    }
  }
}
```

### 6. Age Depreciation Schedule
Time-based depreciation factors:

```json
{
  "agingFactors": {
    "NEW_5YRS": 1.0,
    "5_10YRS": 0.95,
    "10_20YRS": 0.9,
    "20_30YRS": 0.85,
    "30_40YRS": 0.8,
    "40_50YRS": 0.75,
    "50_PLUS": 0.7
  }
}
```

## Calculation Process

### Step 1: Base Cost Calculation
```typescript
const baseCost = baseRates[propertyType] * squareFootage;
```

### Step 2: Apply Regional Adjustment
```typescript
const regionalAdjustment = baseCost * regionFactors[locationCode];
```

### Step 3: Apply Quality Factor
```typescript
const qualityAdjustment = regionalAdjustment * qualityFactors[qualityLevel];
```

### Step 4: Apply Condition Factor
```typescript
const conditionAdjustment = qualityAdjustment * conditionFactors[conditionLevel];
```

### Step 5: Apply Complexity Factors
```typescript
let complexityAdjustment = conditionAdjustment;
complexityAdjustment *= complexityFactors.STORIES[storyCount];
complexityAdjustment *= complexityFactors.FOUNDATION[foundationType];
complexityAdjustment *= complexityFactors.ROOF[roofType];
complexityAdjustment *= complexityFactors.HVAC[hvacType];
```

### Step 6: Apply Age Depreciation
```typescript
const finalValue = complexityAdjustment * agingFactors[ageCategory];
```

## AI Agent Enhancement

The Cost Analysis Agent adds intelligence to the calculation process:

### Automated Factor Selection
- Analyzes property characteristics to recommend appropriate quality and condition ratings
- Identifies optimal regional factors based on geographic location
- Suggests complexity adjustments based on building features

### Market Trend Integration
- Incorporates current market conditions into base cost adjustments
- Applies inflation factors and construction cost escalation
- Considers local economic indicators

### Comparative Analysis
- Performs automated comparable property analysis
- Identifies market anomalies and valuation outliers
- Provides confidence scoring for calculated values

## Database Schema Integration

### Cost Matrices Table
Stores standardized cost factors by region and building type:

```sql
CREATE TABLE cost_matrices (
  id SERIAL PRIMARY KEY,
  building_type VARCHAR(50) NOT NULL,
  region VARCHAR(50) NOT NULL,
  matrix_year INTEGER NOT NULL,
  base_cost DOUBLE PRECISION NOT NULL,
  quality_factors JSONB,
  condition_factors JSONB,
  complexity_factors JSONB,
  regional_multiplier DOUBLE PRECISION DEFAULT 1.0
);
```

### Calculations Table
Records detailed calculation results:

```sql
CREATE TABLE calculations (
  id SERIAL PRIMARY KEY,
  property_id INTEGER REFERENCES properties(id),
  base_cost DOUBLE PRECISION,
  quality_factor DOUBLE PRECISION,
  condition_factor DOUBLE PRECISION,
  age_factor DOUBLE PRECISION,
  region_factor DOUBLE PRECISION,
  calculated_value DOUBLE PRECISION,
  calculation_date TIMESTAMP DEFAULT NOW()
);
```

## API Integration

### Property Valuation Endpoint
```http
POST /api/valuations/calculate
{
  "property_id": 123,
  "building_type": "RESIDENTIAL",
  "region": "Richland",
  "square_feet": 2000,
  "year_built": 2010,
  "quality": "GOOD",
  "condition": "AVERAGE",
  "stories": 2,
  "foundation": "BASEMENT",
  "roof": "ASPHALT",
  "hvac": "CENTRAL"
}
```

### Response Format
```json
{
  "valuation": {
    "property_id": 123,
    "base_cost": 150.50,
    "total_base_value": 301000,
    "quality_adjustment": 1.1,
    "condition_adjustment": 1.0,
    "age_adjustment": 0.9,
    "regional_adjustment": 1.05,
    "complexity_adjustment": 1.12,
    "final_value": 377589,
    "confidence_score": 0.92,
    "calculation_steps": [
      {
        "step": 1,
        "description": "Base cost calculation",
        "value": 301000,
        "formula": "125.5 * 2000"
      },
      {
        "step": 2,
        "description": "Regional adjustment",
        "value": 316050,
        "formula": "301000 * 1.05"
      }
    ]
  }
}
```

## Washington State Adaptations

### County-Specific Customizations
Each Washington county has specialized factors:

**Yakima County (Agricultural Focus):**
- Irrigation rights premium: 1.15
- Crop type classifications with specific multipliers
- Soil quality variations: 1.0-1.25

**Walla Walla County (Wine Industry):**
- AVA designation premium: 1.20
- Vineyard classification adjustments
- Tourism proximity factors: 1.10

**San Juan County (Waterfront Premium):**
- Marine access classifications with 1.35-2.15 multipliers
- Ferry proximity adjustments
- Conservation constraint discounts: 0.65-0.75

### Multi-County Coordination
- Standardized base costs across Washington State
- Regional multipliers reflecting local economic conditions
- Cross-county comparable property sharing

## Performance Optimization

### Caching Strategy
- Frequently used factor combinations cached in Redis
- Base cost tables loaded into memory at startup
- Regional factors indexed by geographic codes

### Calculation Engine
- Parallel processing for batch valuations
- Optimized database queries with proper indexing
- Sub-2 second response times for individual calculations

This comprehensive cost system ensures accurate, consistent property valuations while maintaining the flexibility to accommodate local market conditions and specialized property types across multiple jurisdictions.
# Marshall Swift to CostFactorTables Refactoring Guide

## Overview

This document outlines the completed refactoring process that replaced all references to "marshallSwift" with "CostFactorTables" throughout the codebase. This change was made to standardize terminology and better reflect the actual functionality of the cost calculation system.

## Changes Made

The refactoring script (`scripts/refactor_ms_to_cft.sh`) made the following changes:

1. **Source Files**:
   - Renamed `server/services/costEngine/marshallSwift.ts` to `server/services/costEngine/CostFactorTables.ts`
   - Updated file content with standardized naming

2. **Type Definitions**:
   - Changed `MsCostFactorType` to `CostFactorType`
   - Changed `MsClass` to `FactorClass`
   - Changed `MarshallSwiftFactor` to `CostFactorTablesFactor`

3. **Function Names**:
   - Changed `getMsCostFactors` to `getCostFactors`
   - Changed `calculateMsAdjustedCost` to `calculateAdjustedCost`

4. **Test Fixtures**:
   - Moved tests from `tests/costEngine/ms/` to `tests/costEngine/cf/`
   - Renamed `marshall-swift.test.ts` to `cost-factor-tables.test.ts`
   - Updated test imports and references

5. **Database Migration**:
   - Created SQL migration to rename the database table
   - Added backward compatibility view

## Implementation Details

### Type Definitions

Old (MarshallSwift):
```typescript
export type MsCostFactorType = 
  'regionFactor' | 
  'qualityFactor' | 
  'conditionFactor' | 
  'complexityFactor' | 
  'sizeFactor' | 
  'heightFactor' | 
  'ageFactor';

export enum MsClass {
  RESIDENTIAL = 'RES',
  COMMERCIAL = 'COM', 
  INDUSTRIAL = 'IND',
  AGRICULTURAL = 'AGR'
}
```

New (CostFactorTables):
```typescript
export type CostFactorType = 
  'regionFactor' | 
  'qualityFactor' | 
  'conditionFactor' | 
  'complexityFactor' | 
  'sizeFactor' | 
  'heightFactor' | 
  'ageFactor';

export enum FactorClass {
  RESIDENTIAL = 'RES',
  COMMERCIAL = 'COM', 
  INDUSTRIAL = 'IND',
  AGRICULTURAL = 'AGR'
}
```

### Function Signatures

Old (MarshallSwift):
```typescript
export function getMsCostFactors(propertyType: string, region: string) {
  // Implementation
}

export function calculateMsAdjustedCost(baseCost: number, factors: Record<MsCostFactorType, number>) {
  // Implementation
}
```

New (CostFactorTables):
```typescript
export function getCostFactors(propertyType: string, region: string) {
  // Implementation
}

export function calculateAdjustedCost(baseCost: number, factors: Record<CostFactorType, number>) {
  // Implementation
}
```

## Database Migration

The migration script `migrations/20250430104900_rename_ms_table.sql` includes:

```sql
-- Renaming marshall_swift_factor ➜ cost_factor
ALTER TABLE IF EXISTS marshall_swift_factor RENAME TO cost_factor;
-- Back-compat view
CREATE OR REPLACE VIEW marshall_swift_factor AS
SELECT * FROM cost_factor;
```

This provides backward compatibility for any existing code still using the old table name.

## How to Use the Refactored Service

Old imports and usage:
```typescript
import { MarshallSwiftService, MsClass } from '../services/costEngine/marshallSwift';

const service = new MarshallSwiftService();
const factors = await service.getFactors('RESIDENTIAL', 'URBAN');
const cost = service.calculateCost(100, factors);
```

New imports and usage:
```typescript
import { CostFactorTablesService, FactorClass } from '../services/costEngine/CostFactorTables';

const service = new CostFactorTablesService();
const factors = await service.getFactors('RESIDENTIAL', 'URBAN');
const cost = service.calculateCost(100, factors);
```

## Next Steps

For any additional refactoring needs, consider:

1. Updating any UI references to "Marshall Swift" with "Cost Factor Tables"
2. Reviewing client documentation that may reference the old terminology
3. If necessary, adding deprecation warnings to any backward compatibility layers

## Conclusion

This refactoring standardizes the cost calculation system terminology across the codebase, making it more maintainable and descriptive of its actual functionality. The changes maintain API compatibility while providing a clearer, more accurate naming scheme.
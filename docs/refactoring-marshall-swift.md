# Refactoring Marshall & Swift to CostFactorTables

This document describes the process of refactoring the application from using "Marshall & Swift" terminology to "CostFactorTables" for cost calculation factors.

## Background

The system previously used naming conventions based on the "Marshall & Swift" cost estimation methodology. To modernize the codebase and avoid potential trademark issues, we have refactored all references to use the more generic "CostFactorTables" terminology.

## What Changed

The refactoring involves:

1. Renaming the core service file:
   - `marshallSwift.ts` → `CostFactorTables.ts`

2. Updating class and type names:
   - `MarshallSwiftService` → `CostFactorTablesService`
   - `MsClass` → `FactorClass`
   - `MsCostFactorType` → `CostFactorType`
   - `msClass` → `factorClass` (property names)

3. Updating database tables:
   - `marshall_swift_factor` → `cost_factor`
   - Added backward compatibility view for legacy code

4. Migrating test fixtures:
   - `/tests/costEngine/ms/` → `/tests/costEngine/cf/`

## Running the Refactoring Script

The refactoring script is located at `scripts/refactor_ms_to_cft.sh` and performs all of the changes automatically.

To run it:

```bash
chmod +x scripts/refactor_ms_to_cft.sh
./scripts/refactor_ms_to_cft.sh
```

## After Running the Script

After running the script, you should:

1. Review the changes in your Git diff
2. Run your test suite to ensure everything works correctly
3. Execute the SQL migration to update your database
4. Update any API documentation to reflect the name changes

## Backward Compatibility

The script preserves backward compatibility in two ways:

1. A database view `marshall_swift_factor` that points to the new `cost_factor` table
2. The original file structure remains navigable for a transition period

However, you should plan to update all imports and usage to the new naming convention.
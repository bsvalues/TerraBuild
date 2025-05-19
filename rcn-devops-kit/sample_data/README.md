# Sample Data for TerraFusionBuild RCN Valuation Engine

This directory contains sample data files that drive the RCN valuation calculations. These files are provided as examples and can be modified to match your county's specific requirements, cost factors, and regional adjustments.

## Files Overview

### cost_profiles.json
Contains comprehensive cost data for different building types, construction methods, quality classes, and regional factors. This file defines the base rates used in calculations.

**Key sections:**
- **building_types**: Defines main categories (residential, commercial, industrial, agricultural) and their subtypes with base rates
- **construction_types**: Defines construction methods (frame, masonry, concrete, steel) with cost multipliers
- **quality_classes**: Defines quality levels (economy, standard, good, excellent, luxury) with cost multipliers
- **regions**: Defines geographic regions with regional cost multipliers
- **features**: Defines building features (garage, pool, deck, etc.) with unit costs
- **special_considerations**: Defines additional factors that may impact valuation

### depreciation_tables.json
Contains depreciation factors used to adjust building values based on age and condition. This includes separate tables for different building types.

**Key sections:**
- **age_based**: Age-based depreciation factors for each building type
- **condition_based**: Condition-based depreciation factors
- **building_type_specific_condition**: Building-type-specific condition adjustments
- **effective_age_adjustment**: Condition impact on effective age
- **building_subtype_adjustments**: Subtype-specific depreciation adjustments
- **quality_age_impact**: Quality impact on depreciation rate
- **historical_considerations**: Special handling for historic buildings
- **renovation_adjustments**: Adjustments for renovated buildings

### example_building_inputs.json
Contains 20 detailed example buildings covering various types, quality levels, and features. These examples can be used to test the calculation engine and understand how different building characteristics affect the valuation results.

Examples include:
- Single-family homes of various qualities and ages
- Commercial buildings (retail, office, restaurant, hotel)
- Industrial facilities (manufacturing, warehouse)
- Agricultural buildings (barn, storage, processing)

## Customizing for Your County

These data files are designed to be customizable for your specific county's needs. Here's how to adapt them:

### Adjusting Cost Profiles
1. Modify the base rates in the `cost_profiles.json` file to match your county's construction costs
2. Adjust regional multipliers to reflect your local market conditions
3. Add or modify building types or subtypes as needed
4. Update construction type and quality class multipliers to reflect local standards

### Adjusting Depreciation Tables
1. Modify age-based depreciation schedules to match your county's assessment methodology
2. Adjust condition-based depreciation factors to align with your practices
3. Update building-specific adjustments as needed

### Using Example Buildings
1. Test the engine with provided examples
2. Add new examples specific to your county's common building types
3. Use examples for training staff on the system's functionality

## Integration with TerraFusionBuild RCN Valuation Engine

The engine automatically loads these files at startup. After making changes:

1. Restart the RCN Valuation Engine for changes to take effect
2. Test with example buildings to verify the impact of your changes
3. Use the API documentation to understand how to submit valuations with your modified data

## Data Format Requirements

When modifying these files, maintain the existing JSON structure to ensure compatibility with the RCN calculation engine. Key requirements:

- Maintain the hierarchical structure of objects and arrays
- Keep field names consistent
- Use proper JSON syntax (quotes around field names, commas between elements)
- Ensure numeric values are appropriate for their context (multipliers typically range from 0.5 to 2.0)

## Adding New Data

To add new building types, construction methods, or features:

1. Follow the existing patterns in the respective JSON files
2. Add new entries with unique codes and descriptive names
3. Provide appropriate cost factors and multipliers
4. Add example buildings that use the new data elements for testing

## Need Help?

For assistance with customizing these data files or understanding their impact on valuations, contact TerraFusionBuild support at support@terrafusionbuild.com.
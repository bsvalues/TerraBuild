/**
 * Data Quality Framework - Entry Point
 * 
 * This module exports the data quality framework and initializes it with
 * the property assessment validation rules.
 */

import { dataQualityFramework } from './framework';
import { registerPropertyRules } from './property-rules';

// Initialize with property validation rules
registerPropertyRules(dataQualityFramework);

// Export framework and types
export { dataQualityFramework };
export * from './types';
export * from './property-rules';
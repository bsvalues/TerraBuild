/**
 * Cost Factor Tables Plugin
 * 
 * This plugin provides functionality for working with cost factor tables
 * and supports different data sources.
 */

import { router } from './router';
import * as controller from './controller';

// Add a debug log
console.log('CostFactorTables plugin loaded, router:', router);

// Export the router for use in the main application
export { router, controller };
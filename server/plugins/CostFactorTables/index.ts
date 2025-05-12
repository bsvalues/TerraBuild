/**
 * Cost Factor Tables Plugin
 * 
 * This plugin provides endpoints and UI components for working with cost factor tables.
 */

import router from './router';
import * as controller from './controller';

export { router, controller };

// Plugin metadata
export const metadata = {
  name: 'CostFactorTables',
  version: '1.0.0',
  description: 'Data-driven cost modeling plugin for TerraFusion',
  author: 'TerraFusion Team',
  routes: [
    {
      path: '/api/cost-factors',
      method: 'GET',
      description: 'Get cost factors based on source'
    },
    {
      path: '/api/cost-factors/source',
      method: 'GET',
      description: 'Get current cost factor source'
    },
    {
      path: '/api/cost-factors/sources',
      method: 'GET',
      description: 'Get available cost factor sources'
    },
    {
      path: '/api/cost-factors/source',
      method: 'PUT',
      description: 'Update current cost factor source'
    }
  ]
};

export default {
  router,
  controller,
  metadata
};
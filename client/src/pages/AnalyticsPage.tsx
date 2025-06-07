import React from 'react';
import PropertyAnalyticsDashboard from '@/components/analytics/PropertyAnalyticsDashboard';
import TerraFusionLayout from '@/components/layout/TerraFusionLayout';

/**
 * TerraFusion Analytics Page
 * 
 * Enterprise-grade property analytics dashboard featuring:
 * - Real-time property assessment metrics
 * - Advanced AI-powered market insights
 * - Regional performance analysis
 * - Predictive analytics and trend forecasting
 */
const AnalyticsPage: React.FC = () => {
  return (
    <TerraFusionLayout>
      <PropertyAnalyticsDashboard countyName="Benton County" />
    </TerraFusionLayout>
  );
};

export default AnalyticsPage;
import React from 'react';
import PredictiveCostAnalysis from '../components/predictive/PredictiveCostAnalysis';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DemoNavigation from '@/components/DemoNavigation';

const PredictiveCostAnalysisDemo: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <DemoNavigation />
        <PredictiveCostAnalysis />
      </div>
    </DashboardLayout>
  );
};

export default PredictiveCostAnalysisDemo;

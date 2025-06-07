import React from 'react';
import PredictiveCostAnalysis from '../components/predictive/PredictiveCostAnalysis';
import DashboardLayout from '@/components/layout/DashboardLayout';

const PredictiveCostAnalysisDemo: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <PredictiveCostAnalysis />
      </div>
    </DashboardLayout>
  );
};

export default PredictiveCostAnalysisDemo;
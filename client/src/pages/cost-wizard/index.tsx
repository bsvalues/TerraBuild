import React from 'react';
import { PageHeader } from '@/components/ui/page-header';
import CostWizardSimple from '@/components/wizards/CostWizardSimple';
import { Calculator } from 'lucide-react';

const CostWizardPage = () => {
  return (
    <div className="container mx-auto py-6">
      <PageHeader
        title="Cost Estimation Wizard"
        description="Step-by-step property cost analysis using 2025 construction rates"
        icon={Calculator}
      />
      
      <div className="mt-6">
        <CostWizardSimple />
      </div>
    </div>
  );
};

export default CostWizardPage;
import React from 'react';
import { Link } from 'wouter';
import Layout from '@/components/layout/Layout';
import RegionalCostComparison from '@/components/cost-analysis/RegionalCostComparison';
import PageHeader from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { ArrowLeft, Download, FileBarChart } from 'lucide-react';

const RegionalCostComparisonPage: React.FC = () => {
  return (
    <Layout>
      <div className="container py-6">
        <Breadcrumb>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/analytics">Analytics</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink>Regional Cost Comparison</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
        
        <PageHeader 
          title="Regional Cost Comparison" 
          description="Compare building costs across different regions in Benton County."
          actions={
            <>
              <Button variant="outline" size="sm" className="mr-2">
                <Download className="mr-2 h-4 w-4" />
                Export Data
              </Button>
              <Button variant="outline" size="sm">
                <FileBarChart className="mr-2 h-4 w-4" />
                Generate Report
              </Button>
            </>
          }
        />
        
        <div className="bg-white rounded-lg shadow p-6">
          <RegionalCostComparison />
        </div>
      </div>
    </Layout>
  );
};

export default RegionalCostComparisonPage;
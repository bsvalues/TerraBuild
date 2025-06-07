import React from 'react';
import { CostFactorDashboard } from '@/components/cost-factors/CostFactorDashboard';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { Redirect } from 'wouter';
import { Loader2 } from 'lucide-react';

export default function CostFactorTablesPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">Cost Factor Tables</h1>
      <p className="text-muted-foreground">
        View and manage the cost factors used to calculate building costs in the Benton County Building Cost Assessment System.
      </p>
      
      <Separator className="my-6" />
      
      <CostFactorDashboard />
    </div>
  );
}
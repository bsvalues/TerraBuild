import { useCostFactors, useCostFactorSources } from "@/hooks/use-cost-factors";
import { CostFactorTable } from "./CostFactorTable";
import { ComplexityFactorsTable } from "./ComplexityFactorsTable";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export function CostFactorDashboard() {
  const { source, year, isLoading: factorsLoading, error: factorsError } = useCostFactors();
  const { currentSource, isLoading: sourcesLoading, error: sourcesError } = useCostFactorSources();

  if (factorsError || sourcesError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {factorsError 
            ? `Failed to load cost factors: ${factorsError.message}`
            : `Failed to load cost factor sources: ${sourcesError?.message}`}
        </AlertDescription>
      </Alert>
    );
  }

  if (factorsLoading || sourcesLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-6 w-20" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Cost Factor Tables</h2>
          {source && (
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-sm">
                Source: {source}
              </Badge>
              <Badge variant="outline" className="text-sm">
                Year: {year}
              </Badge>
            </div>
          )}
        </div>
        <p className="text-muted-foreground">
          The following tables show the cost factor values used to calculate building costs.
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Benton County Cost Factors</AlertTitle>
        <AlertDescription>
          These factors are specific to Benton County, Washington and are updated annually.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CostFactorTable 
          factorType="region" 
          description="Geographic adjustment factors based on location within Benton County."
        />
        <CostFactorTable 
          factorType="quality" 
          description="Adjustments based on the quality grade of the building construction."
        />
        <CostFactorTable 
          factorType="condition" 
          description="Adjustments based on the current condition of the building."
        />
        <CostFactorTable 
          factorType="age" 
          description="Depreciation factors based on the age of the building."
        />
      </div>

      <h3 className="text-2xl font-semibold mt-8 mb-4">Base Rates</h3>
      <div className="grid grid-cols-1 gap-6">
        <CostFactorTable 
          factorType="baserate" 
          title="Building Type Base Rates"
          description="Base cost rates per square foot for different building types."
        />
      </div>

      <h3 className="text-2xl font-semibold mt-8 mb-4">Complexity Factors</h3>
      <div className="grid grid-cols-1 gap-6">
        <ComplexityFactorsTable 
          description="Adjustment factors for building complexity including stories, foundation, roof type, and HVAC systems."
        />
      </div>
    </div>
  );
}
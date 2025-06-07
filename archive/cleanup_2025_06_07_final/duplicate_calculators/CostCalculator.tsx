import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

interface CalculationRequest {
  buildingType: string;
  region: string;
  yearBuilt: number;
  quality: string;
  condition: string;
  complexity: string;
  squareFeet: number;
}

interface CalculationResult {
  estimatedCost: number;
  perSquareFoot: number;
  factors: {
    base: number;
    region: number;
    quality: number;
    condition: number;
    age: number;
    complexity: number;
  };
  breakdown: {
    baseCost: number;
    regionAdjustment: number;
    qualityAdjustment: number;
    conditionAdjustment: number;
    ageAdjustment: number;
    complexityAdjustment: number;
  };
}

const CostCalculator = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const form = useForm<CalculationRequest>({
    defaultValues: {
      buildingType: 'RES',
      region: 'BC-CENTRAL',
      yearBuilt: 2020,
      quality: 'STANDARD',
      condition: 'GOOD',
      complexity: 'STANDARD',
      squareFeet: 2000
    }
  });
  
  const onSubmit = async (data: CalculationRequest) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error('Calculation failed: ' + response.statusText);
      }
      
      const result = await response.json();
      setResult(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Benton County Building Cost Calculator</h1>
      
      <div className="grid md:grid-cols-2 gap-8">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle>Building Information</CardTitle>
            <CardDescription>
              Enter the details of the building to calculate construction costs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="buildingType">Building Type</Label>
                  <Select
                    defaultValue={form.getValues('buildingType')}
                    onValueChange={(value) => form.setValue('buildingType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RES">Residential</SelectItem>
                      <SelectItem value="COM">Commercial</SelectItem>
                      <SelectItem value="IND">Industrial</SelectItem>
                      <SelectItem value="AGR">Agricultural</SelectItem>
                      <SelectItem value="MUL">Multi-family</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="region">Region</Label>
                  <Select
                    defaultValue={form.getValues('region')}
                    onValueChange={(value) => form.setValue('region', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BC-NORTH">North Benton County</SelectItem>
                      <SelectItem value="BC-CENTRAL">Central Benton County</SelectItem>
                      <SelectItem value="BC-SOUTH">South Benton County</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="yearBuilt">Year Built</Label>
                  <Input
                    type="number"
                    min="1900"
                    max="2025"
                    {...form.register('yearBuilt', { valueAsNumber: true })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="squareFeet">Square Feet</Label>
                  <Input
                    type="number"
                    min="100"
                    {...form.register('squareFeet', { valueAsNumber: true })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quality">Quality</Label>
                  <Select
                    defaultValue={form.getValues('quality')}
                    onValueChange={(value) => form.setValue('quality', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select quality" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ECONOMY">Economy</SelectItem>
                      <SelectItem value="STANDARD">Standard</SelectItem>
                      <SelectItem value="CUSTOM">Custom</SelectItem>
                      <SelectItem value="PREMIUM">Premium</SelectItem>
                      <SelectItem value="LUXURY">Luxury</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="condition">Condition</Label>
                  <Select
                    defaultValue={form.getValues('condition')}
                    onValueChange={(value) => form.setValue('condition', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="POOR">Poor</SelectItem>
                      <SelectItem value="FAIR">Fair</SelectItem>
                      <SelectItem value="AVERAGE">Average</SelectItem>
                      <SelectItem value="GOOD">Good</SelectItem>
                      <SelectItem value="EXCELLENT">Excellent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="complexity">Complexity</Label>
                  <Select
                    defaultValue={form.getValues('complexity')}
                    onValueChange={(value) => form.setValue('complexity', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select complexity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SIMPLE">Simple</SelectItem>
                      <SelectItem value="STANDARD">Standard</SelectItem>
                      <SelectItem value="MODERATE">Moderate</SelectItem>
                      <SelectItem value="COMPLEX">Complex</SelectItem>
                      <SelectItem value="VERY_COMPLEX">Very Complex</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button type="submit" className="w-full mt-4" disabled={loading}>
                {loading ? 'Calculating...' : 'Calculate Cost'}
              </Button>
              
              {error && (
                <div className="text-red-500 text-sm mt-2">{error}</div>
              )}
            </form>
          </CardContent>
        </Card>
        
        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>Cost Estimate</CardTitle>
            <CardDescription>
              Calculated based on Benton County 2025 cost factors
            </CardDescription>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary">
                    ${result.estimatedCost.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ${result.perSquareFoot.toLocaleString()} per square foot
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-semibold mb-2">Cost Breakdown</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Base Cost:</span>
                      <span>${result.breakdown.baseCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Region Adjustment:</span>
                      <span>${result.breakdown.regionAdjustment.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Quality Adjustment:</span>
                      <span>${result.breakdown.qualityAdjustment.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Condition Adjustment:</span>
                      <span>${result.breakdown.conditionAdjustment.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Age Adjustment:</span>
                      <span>${result.breakdown.ageAdjustment.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Complexity Adjustment:</span>
                      <span>${result.breakdown.complexityAdjustment.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-semibold mb-2">Applied Factors</h3>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <div className="font-medium">Base</div>
                      <div>${result.factors.base}/sqft</div>
                    </div>
                    <div>
                      <div className="font-medium">Region</div>
                      <div>{result.factors.region.toFixed(2)}x</div>
                    </div>
                    <div>
                      <div className="font-medium">Quality</div>
                      <div>{result.factors.quality.toFixed(2)}x</div>
                    </div>
                    <div>
                      <div className="font-medium">Condition</div>
                      <div>{result.factors.condition.toFixed(2)}x</div>
                    </div>
                    <div>
                      <div className="font-medium">Age</div>
                      <div>{result.factors.age.toFixed(2)}x</div>
                    </div>
                    <div>
                      <div className="font-medium">Complexity</div>
                      <div>{result.factors.complexity.toFixed(2)}x</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Fill out the form and click "Calculate Cost" to see your estimate
              </div>
            )}
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            This estimation is based on current construction cost data for Benton County.
            Actual costs may vary based on specific project details.
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default CostCalculator;
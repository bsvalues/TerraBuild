import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import BenchmarkingVisualization from '@/components/visualizations/BenchmarkingVisualization';
import { apiRequest } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';

const BenchmarkingPage: React.FC = () => {
  // State for benchmarking parameters
  const [formState, setFormState] = useState({
    buildingType: 'residential',
    region: 'northwest',
    year: new Date().getFullYear(),
    squareFootage: 2500,
  });
  
  const [parameters, setParameters] = useState({
    buildingType: 'residential',
    region: 'northwest',
    year: new Date().getFullYear(),
    squareFootage: 2500,
  });

  // Fetch available building types and regions for dropdown selection
  const { data: buildingTypes, isLoading: loadingBuildingTypes } = useQuery({
    queryKey: ['buildingTypes'],
    queryFn: () => apiRequest('/api/building-cost/types')
  });

  const { data: regions, isLoading: loadingRegions } = useQuery({
    queryKey: ['regions'],
    queryFn: () => apiRequest('/api/regions')
  });

  // Handler for form input changes
  const handleInputChange = (field: string, value: string | number) => {
    setFormState(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handler for form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setParameters(formState);
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold">Building Cost Benchmarking</h1>
      <p className="text-muted-foreground">
        Compare building costs against regional and statewide averages to benchmark your project.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Benchmarking Parameters</CardTitle>
            <CardDescription>
              Enter the details of your building to compare against similar buildings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="buildingType">Building Type</Label>
                <Select
                  value={formState.buildingType}
                  onValueChange={(value) => handleInputChange('buildingType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select building type" />
                  </SelectTrigger>
                  <SelectContent>
                    {!loadingBuildingTypes && buildingTypes && Array.isArray(buildingTypes) ? (
                      buildingTypes.map((type: string) => (
                        <SelectItem key={type} value={type.toLowerCase()}>
                          {type}
                        </SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="residential">Residential</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="industrial">Industrial</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="region">Region</Label>
                <Select
                  value={formState.region}
                  onValueChange={(value) => handleInputChange('region', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    {!loadingRegions && regions && Array.isArray(regions) ? (
                      regions.map((region: string) => (
                        <SelectItem key={region} value={region.toLowerCase()}>
                          {region}
                        </SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="northwest">Northwest</SelectItem>
                        <SelectItem value="northeast">Northeast</SelectItem>
                        <SelectItem value="southwest">Southwest</SelectItem>
                        <SelectItem value="southeast">Southeast</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  value={formState.year}
                  onChange={(e) => handleInputChange('year', parseInt(e.target.value))}
                  min={2020}
                  max={2030}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="squareFootage">Square Footage</Label>
                <Input
                  id="squareFootage"
                  type="number"
                  value={formState.squareFootage}
                  onChange={(e) => handleInputChange('squareFootage', parseInt(e.target.value))}
                  min={500}
                  step={100}
                />
              </div>

              <Button type="submit" className="w-full">
                Generate Benchmark
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <BenchmarkingVisualization
            buildingType={parameters.buildingType}
            region={parameters.region}
            year={parameters.year}
            squareFootage={parameters.squareFootage}
          />
        </div>
      </div>
    </div>
  );
};

export default BenchmarkingPage;
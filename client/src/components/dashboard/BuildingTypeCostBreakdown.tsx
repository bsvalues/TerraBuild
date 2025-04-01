import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Building, HardHat, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface BuildingTypeCostBreakdownProps {
  title?: string;
  description?: string;
  className?: string;
  showControls?: boolean;
}

const COLORS = [
  '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', 
  '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
];

const DEFAULT_MATERIAL_BREAKDOWNS = {
  "RESIDENTIAL": {
    "Structure": 0.25,
    "Foundation": 0.12,
    "Electrical": 0.10,
    "Plumbing": 0.10,
    "HVAC": 0.07,
    "Interior Finishes": 0.18,
    "Exterior Finishes": 0.10,
    "Roofing": 0.05,
    "Site Work": 0.03
  },
  "COMMERCIAL": {
    "Structure": 0.22,
    "Foundation": 0.12,
    "Electrical": 0.15,
    "Plumbing": 0.08,
    "HVAC": 0.12,
    "Interior Finishes": 0.15,
    "Exterior Finishes": 0.08,
    "Roofing": 0.05,
    "Site Work": 0.03
  },
  "INDUSTRIAL": {
    "Structure": 0.30,
    "Foundation": 0.15,
    "Electrical": 0.15,
    "Plumbing": 0.05,
    "HVAC": 0.07,
    "Interior Finishes": 0.08,
    "Exterior Finishes": 0.10,
    "Roofing": 0.05,
    "Site Work": 0.05
  },
  "DEFAULT": {
    "Structure": 0.25,
    "Foundation": 0.12,
    "Electrical": 0.10,
    "Plumbing": 0.08,
    "HVAC": 0.08,
    "Interior Finishes": 0.15,
    "Exterior Finishes": 0.10,
    "Roofing": 0.07,
    "Site Work": 0.05
  }
};

export function BuildingTypeCostBreakdown({ 
  title = "Building Cost Breakdown", 
  description = "Cost breakdown by building type and materials",
  className,
  showControls = true
}: BuildingTypeCostBreakdownProps) {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('typesChart');

  // Fetch cost matrix data
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/cost-matrix'],
  });

  // Get unique regions
  const getUniqueRegions = (data: any[]): string[] => {
    if (!data || !Array.isArray(data)) return [];
    return [...new Set(data.map(item => item.region))].sort();
  };

  // Process data for building types pie chart
  const processBuildingTypeData = () => {
    if (!data || !Array.isArray(data)) return [];
    
    // Filter by region if selected
    let filteredData = data;
    if (selectedRegion) {
      filteredData = data.filter(item => item.region === selectedRegion);
    }
    
    // Group by building type and sum base costs
    const buildingTypeTotals = filteredData.reduce((acc, item) => {
      const type = item.buildingTypeDescription || item.buildingType;
      if (!acc[type]) {
        acc[type] = {
          name: type,
          value: 0,
          count: 0,
          totalBaseCost: 0
        };
      }
      
      const cost = parseFloat(item.baseCost);
      acc[type].totalBaseCost += cost;
      acc[type].count += 1;
      acc[type].value = acc[type].totalBaseCost / acc[type].count;
      
      return acc;
    }, {});
    
    // Convert to array and calculate percentages
    const typeData = Object.values(buildingTypeTotals);
    const totalValue = typeData.reduce((sum, item: any) => sum + item.value, 0);
    
    return typeData.map((item: any) => ({
      name: item.name,
      value: parseFloat(item.value.toFixed(2)),
      percent: parseFloat(((item.value / totalValue) * 100).toFixed(1)),
      count: item.count
    })).sort((a, b) => b.value - a.value);
  };

  // Create material breakdown data
  const createMaterialBreakdownData = (buildingType: string) => {
    let breakdownData = DEFAULT_MATERIAL_BREAKDOWNS[buildingType] || DEFAULT_MATERIAL_BREAKDOWNS.DEFAULT;
    
    // Convert to array format for chart
    return Object.entries(breakdownData).map(([name, percentage]) => ({
      name,
      value: percentage,
      percent: parseFloat((percentage * 100).toFixed(1))
    })).sort((a, b) => b.value - a.value);
  };

  // Get the most common building type in the data
  const getMostCommonBuildingType = (): string => {
    if (!data || !Array.isArray(data)) return 'DEFAULT';
    
    let filteredData = data;
    if (selectedRegion) {
      filteredData = data.filter(item => item.region === selectedRegion);
    }
    
    const typeCounts = filteredData.reduce((acc, item) => {
      const type = item.buildingType.toUpperCase();
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    
    let mostCommon = 'DEFAULT';
    let highestCount = 0;
    
    Object.entries(typeCounts).forEach(([type, count]) => {
      if (count > highestCount) {
        mostCommon = type;
        highestCount = count as number;
      }
    });
    
    return mostCommon;
  };

  const buildingTypeData = processBuildingTypeData();
  const regions = getUniqueRegions(data);
  const mostCommonBuildingType = getMostCommonBuildingType();
  const materialBreakdownData = createMaterialBreakdownData(mostCommonBuildingType);

  // Custom pie chart label
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    return percent >= 0.05 ? (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        style={{ fontSize: '12px', fontWeight: 'bold' }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    ) : null;
  };

  // Rendering loading state
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  // Rendering error state
  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load building cost breakdown data. Please try again later.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Rendering empty state
  if (!buildingTypeData.length) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center min-h-[300px]">
          <p className="text-muted-foreground">No data available for the selected region.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          
          {showControls && (
            <div className="flex items-center gap-2 mt-4 md:mt-0">
              <Select
                value={selectedRegion || "all"}
                onValueChange={(value) => setSelectedRegion(value === "all" ? null : value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Regions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  {regions.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="outline" className="flex items-center gap-1">
            {selectedRegion ? 
              <><MapPin className="h-3 w-3" /> {selectedRegion}</> : 
              'All Regions'
            }
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Building className="h-3 w-3" /> 
            {buildingTypeData.length} Building Types
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full flex mb-6">
            <TabsTrigger value="typesChart" className="flex-1">
              <Building className="h-4 w-4 mr-2" />
              Building Types
            </TabsTrigger>
            <TabsTrigger value="materialsChart" className="flex-1">
              <HardHat className="h-4 w-4 mr-2" />
              Material Breakdown
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="typesChart" className="mt-0">
            <div className="w-full h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={buildingTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={130}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {buildingTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`$${value}/sq.ft`, 'Base Cost']}
                    itemSorter={(item) => -(item.value as number)}
                  />
                  <Legend
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    wrapperStyle={{ paddingLeft: '20px' }}
                    formatter={(value, entry, index) => (
                      <span style={{ color: '#333', fontSize: '12px' }}>
                        {value} - ${buildingTypeData[index].value}/sq.ft
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm">
              {buildingTypeData.slice(0, 3).map((type, index) => (
                <div 
                  key={type.name}
                  className="flex items-center gap-2 p-3 rounded-md"
                  style={{ backgroundColor: `${COLORS[index % COLORS.length]}20` }}
                >
                  <Building 
                    className="h-5 w-5" 
                    style={{ color: COLORS[index % COLORS.length] }} 
                  />
                  <div>
                    <p className="font-medium">{type.name}</p>
                    <p>
                      <span className="font-semibold">${type.value}/sq.ft</span> - 
                      <span className="font-medium ml-1">{type.percent}%</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="materialsChart" className="mt-0">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-4">
              <h3 className="text-lg font-medium">
                Material Cost Breakdown for {mostCommonBuildingType.charAt(0) + mostCommonBuildingType.slice(1).toLowerCase()} Buildings
              </h3>
            </div>
            
            <div className="w-full h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={materialBreakdownData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={130}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {materialBreakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${(value * 100).toFixed(1)}%`, 'Percentage']}
                    itemSorter={(item) => -(item.value as number)}
                  />
                  <Legend
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    wrapperStyle={{ paddingLeft: '20px' }}
                    formatter={(value, entry, index) => (
                      <span style={{ color: '#333', fontSize: '12px' }}>
                        {value} - {(materialBreakdownData[index].value * 100).toFixed(1)}%
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm">
              {materialBreakdownData.slice(0, 3).map((material, index) => (
                <div 
                  key={material.name}
                  className="flex items-center gap-2 p-3 rounded-md"
                  style={{ backgroundColor: `${COLORS[index % COLORS.length]}20` }}
                >
                  <HardHat 
                    className="h-5 w-5" 
                    style={{ color: COLORS[index % COLORS.length] }} 
                  />
                  <div>
                    <p className="font-medium">{material.name}</p>
                    <p>
                      <span className="font-semibold">{material.percent}%</span> of total cost
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
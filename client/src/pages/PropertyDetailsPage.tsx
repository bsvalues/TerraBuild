import { useState } from 'react';
import { useRoute, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import LayoutWrapper from '@/components/layout/LayoutWrapper';
import MainContent from '@/components/layout/MainContent';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import {
  ChevronLeft,
  ChevronRight,
  Home,
  Building,
  Layers,
  Map,
  FileText,
  Clock,
  User,
  Mail,
  MapPin,
  DollarSign,
  BarChart2,
  Calculator,
  CircleCheck,
  Loader2,
  XCircle,
  ArrowDown,
  ArrowRight
} from "lucide-react";

// Type definitions
interface Property {
  id: number;
  propId: number;
  block: string | null;
  tractOrLot: string | null;
  legalDesc: string | null;
  legalDesc2: string | null;
  townshipSection: string | null;
  range: string | null;
  township: string | null;
  section: string | null;
  ownerName: string | null;
  ownerAddress: string | null;
  ownerCity: string | null;
  ownerState: string | null;
  ownerZip: string | null;
  propertyAddress: string | null;
  propertyCity: string | null;
  propertyState: string | null;
  propertyZip: string | null;
  parcelNumber: string | null;
  zone: string | null;
  neighborhood: string | null;
  importedAt: string;
  updatedAt: string;
  isActive: boolean | null;
}

interface Improvement {
  id: number;
  propId: number;
  imprvId: number;
  imprvDesc: string | null;
  imprvVal: string | null;
  livingArea: string | null;
  primaryUseCd: string | null;
  stories: string | null;
  actualYearBuilt: number | null;
  totalArea: string | null;
  importedAt: string;
  updatedAt: string;
  details: ImprovementDetail[];
  items: ImprovementItem[];
}

interface ImprovementDetail {
  id: number;
  propId: number;
  imprvId: number;
  livingArea: string | null;
  belowGradeLivingArea: string | null;
  conditionCd: string | null;
  qualityCd: string | null;
  styleDesc: string | null;
  grade: string | null;
  yearRemodeled: string | null;
  remodYrFlag: string | null;
  imprvDetClassCd: string | null;
  importedAt: string;
  updatedAt: string;
}

interface ImprovementItem {
  id: number;
  propId: number;
  imprvId: number;
  bedrooms: string | null;
  baths: string | null;
  halfbath: string | null;
  foundation: string | null;
  extwall_desc: string | null;
  roofcover_desc: string | null;
  hvac_desc: string | null;
  fireplaces: string | null;
  sprinkler: boolean | null;
  framing_class: string | null;
  com_hvac: string | null;
  importedAt: string;
  updatedAt: string;
}

interface LandDetail {
  id: number;
  propId: number;
  size_acres: string | null;
  size_square_feet: string | null;
  land_type_cd: string | null;
  land_soil_code: string | null;
  ag_use_cd: string | null;
  primary_use_cd: string | null;
  importedAt: string;
  updatedAt: string;
}

interface PropertyDetails {
  property: Property;
  improvements: Improvement[];
  landDetails: LandDetail[];
}

const PropertyDetailsPage = () => {
  const [, params] = useRoute('/properties/:id');
  const { toast } = useToast();
  const propertyId = params?.id ? parseInt(params.id) : 0;

  // Fetch property details
  const { data, isLoading, isError, dataUpdatedAt, isFetching } = useQuery({
    queryKey: [`/api/properties/${propertyId}/details`],
    queryFn: async () => {
      const startTime = Date.now();
      try {
        // Show loading indicator with console log for debugging
        console.log("Fetching property details data...");
        
        // Make the API request
        const response = await fetch(`/api/properties/${propertyId}/details`);
        
        // Handle error response
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Property fetch error:", errorText);
          throw new Error(`Failed to fetch property details: ${response.status} ${response.statusText} ${errorText}`);
        }
        
        // Parse response
        const data = await response.json() as PropertyDetails;
        console.log("Received property data:", data);
        
        // Ensure loading spinner shows for at least 800ms for better user experience
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime < 800) {
          await new Promise(resolve => setTimeout(resolve, 800 - elapsedTime));
        }
        
        return data;
      } catch (error) {
        console.error("Error fetching property data:", error);
        throw error;
      }
    },
    enabled: !!propertyId,
    // Add retry logic for better resilience
    retry: 2,
    retryDelay: attempt => Math.min(1000 * 2 ** attempt, 10000),
    staleTime: 5 * 60 * 1000, // Data remains fresh for 5 minutes
  });

  if (isError) {
    toast({
      title: "Error",
      description: "Failed to load property details. Please try again later.",
      variant: "destructive",
    });
  }

  // Helper functions for formatting
  const formatAddress = (property: Property) => {
    const parts = [];
    if (property.propertyAddress) parts.push(property.propertyAddress);
    if (property.propertyCity) parts.push(property.propertyCity);
    if (property.propertyState) parts.push(property.propertyState);
    if (property.propertyZip) parts.push(property.propertyZip);
    return parts.join(', ');
  };

  const formatOwnerAddress = (property: Property) => {
    const parts = [];
    if (property.ownerAddress) parts.push(property.ownerAddress);
    if (property.ownerCity) parts.push(property.ownerCity);
    if (property.ownerState) parts.push(property.ownerState);
    if (property.ownerZip) parts.push(property.ownerZip);
    return parts.join(', ');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Total acreage calculation
  const calculateTotalAcreage = (landDetails: LandDetail[]) => {
    return landDetails.reduce((sum, detail) => {
      const acres = detail.size_acres ? parseFloat(detail.size_acres) : 0;
      return sum + acres;
    }, 0).toFixed(2);
  };

  return (
    <LayoutWrapper>
      <MainContent title="Property Details">
        {/* Data Flow Status Indicator */}
        <div className="mb-4 px-4 py-2 bg-muted rounded-md text-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-medium">Data Status:</span>
              {isFetching ? (
                <span className="flex items-center text-amber-500">
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  Loading data...
                </span>
              ) : data ? (
                <span className="flex items-center text-green-500">
                  <CircleCheck className="h-3 w-3 mr-1" />
                  Data loaded successfully
                </span>
              ) : (
                <span className="flex items-center text-red-500">
                  <XCircle className="h-3 w-3 mr-1" />
                  No data available
                </span>
              )}
            </div>
            
            {data && dataUpdatedAt && (
              <div className="text-xs text-muted-foreground">
                <span className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  Last fetched: {new Date(dataUpdatedAt).toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>
          
          {data && (
            <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
              <div>
                <span className="font-medium">API Endpoint:</span> 
                <code className="ml-1 bg-background p-1 rounded">/api/properties/{propertyId}/details</code>
              </div>
              <div>
                <span className="font-medium">Improvements:</span> 
                <span className="ml-1">{data.improvements?.length || 0} items</span>
              </div>
              <div>
                <span className="font-medium">Land Details:</span> 
                <span className="ml-1">{data.landDetails?.length || 0} items</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mb-6">
          <Link href="/properties">
            <Button variant="outline" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Properties
            </Button>
          </Link>
          
          <h1 className="text-3xl font-bold tracking-tight">
            {isLoading ? (
              <Skeleton className="h-9 w-40" />
            ) : (
              data ? `Property #${data.property.propId}` : 'Property Details'
            )}
          </h1>
        </div>

        {isLoading ? (
          // Skeleton loaders while content is loading
          <div className="space-y-6">
            <Skeleton className="h-[200px] w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-[300px] w-full" />
              <Skeleton className="h-[300px] w-full" />
            </div>
          </div>
        ) : data ? (
          <>
            {/* Property Overview Card */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Home className="h-5 w-5 mr-2" />
                  Property Overview
                </CardTitle>
                <CardDescription>
                  Basic information about the property
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Property ID</h3>
                      <p className="text-xl font-semibold">{data.property.propId}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">
                        <MapPin className="h-4 w-4 inline mr-1" />
                        Address
                      </h3>
                      <p className="text-base">
                        {formatAddress(data.property) || 'No address available'}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">
                        <User className="h-4 w-4 inline mr-1" />
                        Owner
                      </h3>
                      <p className="text-base">
                        {data.property.ownerName || 'No owner information'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatOwnerAddress(data.property)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Parcel Number</h3>
                      <p className="text-base">{data.property.parcelNumber || 'N/A'}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Zone</h3>
                      <Badge variant="outline">{data.property.zone || 'N/A'}</Badge>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Neighborhood</h3>
                      <p className="text-base">{data.property.neighborhood || 'N/A'}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">
                        <Clock className="h-4 w-4 inline mr-1" />
                        Last Updated
                      </h3>
                      <p className="text-sm">
                        {formatDate(data.property.updatedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs for different property aspects */}
            <Tabs defaultValue="improvements" className="mb-6">
              <TabsList className="mb-4">
                <TabsTrigger value="improvements">
                  <Building className="h-4 w-4 mr-1" />
                  Improvements
                </TabsTrigger>
                <TabsTrigger value="land">
                  <Map className="h-4 w-4 mr-1" />
                  Land Details
                </TabsTrigger>
                <TabsTrigger value="legal">
                  <FileText className="h-4 w-4 mr-1" />
                  Legal Description
                </TabsTrigger>
                <TabsTrigger value="cost">
                  <Calculator className="h-4 w-4 mr-1" />
                  Cost Analysis
                </TabsTrigger>
                <TabsTrigger value="visualize">
                  <BarChart2 className="h-4 w-4 mr-1" />
                  Visualizations
                </TabsTrigger>
              </TabsList>
              
              {/* Improvements Tab */}
              <TabsContent value="improvements">
                <Card>
                  <CardHeader>
                    <CardTitle>Improvements</CardTitle>
                    <CardDescription>
                      Buildings and structures on the property
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {data.improvements && data.improvements.length > 0 ? (
                      <div className="space-y-8">
                        {data.improvements.map((improvement) => (
                          <div key={improvement.id} className="border rounded-md p-4">
                            <h3 className="text-lg font-semibold mb-2 flex items-center">
                              <Building className="h-5 w-5 mr-2" />
                              {improvement.imprvDesc || `Improvement #${improvement.imprvId}`}
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div>
                                <p className="text-sm text-muted-foreground">Living Area</p>
                                <p>{improvement.livingArea || 'N/A'} sq ft</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Total Area</p>
                                <p>{improvement.totalArea || 'N/A'} sq ft</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Year Built</p>
                                <p>{improvement.actualYearBuilt || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Value</p>
                                <p>
                                  {improvement.imprvVal 
                                    ? `$${parseFloat(improvement.imprvVal).toLocaleString()}`
                                    : 'N/A'}
                                </p>
                              </div>
                            </div>
                            
                            {/* Improvement Items */}
                            {improvement.items && improvement.items.length > 0 && (
                              <div className="mt-4">
                                <h4 className="text-md font-medium mb-2">Features</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  {improvement.items.map((item) => (
                                    <div key={item.id} className="bg-accent/50 rounded-md p-3">
                                      <div className="grid grid-cols-2 gap-2 text-sm">
                                        {item.bedrooms && (
                                          <>
                                            <span className="text-muted-foreground">Bedrooms:</span>
                                            <span>{item.bedrooms}</span>
                                          </>
                                        )}
                                        {item.baths && (
                                          <>
                                            <span className="text-muted-foreground">Bathrooms:</span>
                                            <span>{item.baths}</span>
                                          </>
                                        )}
                                        {item.halfbath && (
                                          <>
                                            <span className="text-muted-foreground">Half Baths:</span>
                                            <span>{item.halfbath}</span>
                                          </>
                                        )}
                                        {item.foundation && (
                                          <>
                                            <span className="text-muted-foreground">Foundation:</span>
                                            <span>{item.foundation}</span>
                                          </>
                                        )}
                                        {item.extwall_desc && (
                                          <>
                                            <span className="text-muted-foreground">Exterior:</span>
                                            <span>{item.extwall_desc}</span>
                                          </>
                                        )}
                                        {item.roofcover_desc && (
                                          <>
                                            <span className="text-muted-foreground">Roof:</span>
                                            <span>{item.roofcover_desc}</span>
                                          </>
                                        )}
                                        {item.hvac_desc && (
                                          <>
                                            <span className="text-muted-foreground">HVAC:</span>
                                            <span>{item.hvac_desc}</span>
                                          </>
                                        )}
                                        {item.fireplaces && parseInt(item.fireplaces) > 0 && (
                                          <>
                                            <span className="text-muted-foreground">Fireplaces:</span>
                                            <span>{item.fireplaces}</span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Building className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">No improvements found for this property</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Land Details Tab */}
              <TabsContent value="land">
                <Card>
                  <CardHeader>
                    <CardTitle>Land Details</CardTitle>
                    <CardDescription>
                      Information about the land parcels
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {data.landDetails && data.landDetails.length > 0 ? (
                      <>
                        <div className="mb-6 p-4 bg-accent/50 rounded-md">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground">Total Acreage</h3>
                              <p className="text-xl font-semibold">{calculateTotalAcreage(data.landDetails)} acres</p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground">Number of Parcels</h3>
                              <p className="text-xl font-semibold">{data.landDetails.length}</p>
                            </div>
                          </div>
                        </div>
                      
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Type</TableHead>
                              <TableHead>Soil Code</TableHead>
                              <TableHead>Size (Acres)</TableHead>
                              <TableHead>Size (Sq.Ft.)</TableHead>
                              <TableHead>Use Code</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {data.landDetails.map((land) => (
                              <TableRow key={land.id}>
                                <TableCell>{land.land_type_cd || 'N/A'}</TableCell>
                                <TableCell>{land.land_soil_code || 'N/A'}</TableCell>
                                <TableCell>
                                  {land.size_acres 
                                    ? parseFloat(land.size_acres).toFixed(4)
                                    : 'N/A'}
                                </TableCell>
                                <TableCell>
                                  {land.size_square_feet 
                                    ? parseFloat(land.size_square_feet).toLocaleString()
                                    : 'N/A'}
                                </TableCell>
                                <TableCell>
                                  {land.primary_use_cd || land.ag_use_cd || 'N/A'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <Map className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">No land details found for this property</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Legal Description Tab */}
              <TabsContent value="legal">
                <Card>
                  <CardHeader>
                    <CardTitle>Legal Description</CardTitle>
                    <CardDescription>
                      Legal information and parcel details
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {data.property.legalDesc && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-1">Legal Description</h3>
                          <p className="p-3 bg-muted rounded-md">{data.property.legalDesc}</p>
                          {data.property.legalDesc2 && (
                            <p className="p-3 bg-muted rounded-md mt-2">{data.property.legalDesc2}</p>
                          )}
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-1">Block</h3>
                          <p>{data.property.block || 'N/A'}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-1">Tract/Lot</h3>
                          <p>{data.property.tractOrLot || 'N/A'}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-1">Township/Section</h3>
                          <p>{data.property.townshipSection || 'N/A'}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-1">Range</h3>
                          <p>{data.property.range || 'N/A'}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-1">Township</h3>
                          <p>{data.property.township || 'N/A'}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-1">Section</h3>
                          <p>{data.property.section || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Cost Analysis Tab */}
              <TabsContent value="cost">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calculator className="h-5 w-5 mr-2" />
                      Cost Analysis
                    </CardTitle>
                    <CardDescription>
                      Building cost estimation based on property characteristics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Data Flow Diagram */}
                    <div className="mb-6 p-3 border rounded-md bg-muted/30">
                      <h3 className="text-sm font-medium mb-2">Cost Calculation Flow:</h3>
                      <div className="flex items-center flex-wrap gap-2 text-xs">
                        <div className="bg-background p-2 rounded-md border">
                          Property Data
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        <div className="bg-background p-2 rounded-md border">
                          Region Detection
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        <div className="bg-background p-2 rounded-md border">
                          Building Type Classification  
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        <div className="bg-background p-2 rounded-md border">
                          Quality & Age Factors
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        <div className="bg-primary/20 p-2 rounded-md border-primary/30 border-2">
                          Cost Calculation
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        All calculations use the latest 2025 Benton County cost matrix data.
                      </p>
                    </div>
                
                    {data.improvements && data.improvements.length > 0 ? (
                      <div className="space-y-6">
                        {data.improvements.map((improvement) => {
                          // Extract building type based on primary use code
                          const buildingType = determineBuildingType(improvement.primaryUseCd);
                          // Determine region based on property location
                          const region = determineRegion(data.property);
                          
                          // Calculate estimated cost based on improvement characteristics
                          const squareFootage = improvement.totalArea ? parseFloat(improvement.totalArea) : 0;
                          const baseCost = calculateBaseCost(buildingType, region);
                          const qualityFactor = determineQualityFactor(improvement);
                          const ageFactor = determineAgeFactor(improvement.actualYearBuilt);
                          
                          const estimatedCost = squareFootage * baseCost * qualityFactor * ageFactor;
                          const assessedValue = improvement.imprvVal ? parseFloat(improvement.imprvVal) : 0;
                          
                          // Calculation tracking for data flow visibility
                          const calculationSteps = [
                            { step: 'Building Type', value: buildingType, source: `Primary Use Code: ${improvement.primaryUseCd || 'N/A'}` },
                            { step: 'Region', value: region, source: `Neighborhood: ${data.property.neighborhood || 'N/A'}` },
                            { step: 'Square Footage', value: `${squareFootage.toLocaleString()} sq ft`, source: 'Total Area' },
                            { step: 'Base Cost', value: `$${baseCost.toFixed(2)}/sq ft`, source: '2025 Cost Matrix' },
                            { step: 'Quality Factor', value: qualityFactor.toFixed(2), source: `Quality Code: ${improvement.details[0]?.qualityCd || 'Standard'}` },
                            { step: 'Age Factor', value: ageFactor.toFixed(2), source: `Year Built: ${improvement.actualYearBuilt || 'Unknown'}` }
                          ];
                          
                          const costDifference = assessedValue - estimatedCost;
                          const costDifferencePercent = assessedValue > 0 
                            ? (costDifference / assessedValue) * 100 
                            : 0;
                          
                          return (
                            <div key={improvement.id} className="border rounded-md p-4">
                              <h3 className="text-lg font-semibold mb-4 flex items-center">
                                <Building className="h-5 w-5 mr-2" />
                                {improvement.imprvDesc || `Improvement #${improvement.imprvId}`}
                              </h3>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div className="space-y-4">
                                  <div>
                                    <p className="text-sm text-muted-foreground mb-1">Building Type</p>
                                    <p className="font-medium">{buildingType || 'Unknown'}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground mb-1">Region</p>
                                    <p className="font-medium">{region || 'Unknown'}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground mb-1">Square Footage</p>
                                    <p className="font-medium">{squareFootage.toLocaleString()} sq ft</p>
                                  </div>
                                </div>
                                
                                <div className="space-y-4">
                                  <div>
                                    <p className="text-sm text-muted-foreground mb-1">Quality Factor</p>
                                    <p className="font-medium">{qualityFactor.toFixed(2)}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground mb-1">Age Factor</p>
                                    <p className="font-medium">{ageFactor.toFixed(2)}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground mb-1">Base Cost per Sq.Ft.</p>
                                    <p className="font-medium">${baseCost.toFixed(2)}</p>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="bg-accent/30 rounded-lg p-4 mb-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div>
                                    <p className="text-sm text-muted-foreground mb-1">Estimated Cost</p>
                                    <p className="text-xl font-semibold">${estimatedCost.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground mb-1">Assessed Value</p>
                                    <p className="text-xl font-semibold">${assessedValue.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground mb-1">Difference</p>
                                    <p className={`text-xl font-semibold ${costDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {costDifference >= 0 ? '+' : ''}${Math.abs(costDifference).toLocaleString(undefined, {maximumFractionDigits: 0})}
                                      <span className="text-sm ml-1">({costDifferencePercent.toFixed(1)}%)</span>
                                    </p>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Calculation Steps Visualization */}
                              <div className="mt-6 border rounded-md p-4 bg-muted/30">
                                <h4 className="text-sm font-medium mb-3">Calculation Process Details</h4>
                                <div className="space-y-4">
                                  {calculationSteps.map((step, index) => (
                                    <div key={index} className="grid grid-cols-[auto,1fr] gap-2">
                                      <div className="flex items-center justify-center">
                                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                          {index + 1}
                                        </div>
                                        {index < calculationSteps.length - 1 && (
                                          <div className="h-6 w-px bg-border mx-auto mt-1"></div>
                                        )}
                                      </div>
                                      <div>
                                        <div className="flex items-center">
                                          <h5 className="font-medium">{step.step}</h5>
                                          <ArrowRight className="h-4 w-4 mx-2 text-muted-foreground" />
                                          <span className="font-bold">{step.value}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                          Source: {step.source}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                  
                                  {/* Final Calculation Step */}
                                  <div className="grid grid-cols-[auto,1fr] gap-2">
                                    <div className="flex items-center justify-center">
                                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                                        <Calculator className="h-4 w-4" />
                                      </div>
                                    </div>
                                    <div className="p-3 border rounded-md bg-background">
                                      <div className="text-sm">
                                        <span className="font-medium">Final Calculation</span>
                                        <div className="mt-1 p-2 bg-muted rounded text-xs font-mono">
                                          ${squareFootage.toLocaleString()} sq ft × ${baseCost.toFixed(2)}/sq ft × {qualityFactor.toFixed(2)} × {ageFactor.toFixed(2)} = ${estimatedCost.toLocaleString(undefined, {maximumFractionDigits: 0})}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="space-y-2 mt-6">
                                <p className="text-sm font-medium mb-1">Cost vs. Assessment Comparison</p>
                                <div className="h-6 bg-muted rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${costDifference >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                                    style={{ 
                                      width: `${Math.min(Math.abs(costDifferencePercent), 100)}%`, 
                                      marginLeft: costDifference >= 0 ? '50%' : `${50 - Math.min(Math.abs(costDifferencePercent)/2, 50)}%` 
                                    }}
                                  />
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>Undervalued</span>
                                  <span>Accurate</span>
                                  <span>Overvalued</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Calculator className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">No improvements found to analyze</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Visualizations Tab */}
              <TabsContent value="visualize">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart2 className="h-5 w-5 mr-2" />
                      Property Visualizations
                    </CardTitle>
                    <CardDescription>
                      Visual representation of property data
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {data.improvements && data.improvements.length > 0 ? (
                      <div className="space-y-8">
                        {/* Building Age Distribution */}
                        <div>
                          <h3 className="text-lg font-medium mb-4">Building Age Distribution</h3>
                          <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={data.improvements.map(imp => ({
                                  name: imp.imprvDesc || `Improvement #${imp.imprvId}`,
                                  age: imp.actualYearBuilt ? (new Date().getFullYear() - imp.actualYearBuilt) : 0
                                }))}
                                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                                <YAxis label={{ value: 'Age (years)', angle: -90, position: 'insideLeft' }} />
                                <Tooltip formatter={(value) => [`${value} years`, 'Age']} />
                                <Bar dataKey="age" fill="#8884d8" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                        
                        {/* Improvement Value Distribution */}
                        <div>
                          <h3 className="text-lg font-medium mb-4">Improvement Value Distribution</h3>
                          <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={data.improvements.map(imp => ({
                                    name: imp.imprvDesc || `Improvement #${imp.imprvId}`,
                                    value: imp.imprvVal ? parseFloat(imp.imprvVal) : 0
                                  }))}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={true}
                                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                  outerRadius={80}
                                  fill="#8884d8"
                                  dataKey="value"
                                >
                                  {data.improvements.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 60%)`} />
                                  ))}
                                </Pie>
                                <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Value']} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                        
                        {/* Building Size Comparison */}
                        <div>
                          <h3 className="text-lg font-medium mb-4">Building Size Comparison</h3>
                          <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={data.improvements.map(imp => ({
                                  name: imp.imprvDesc || `Improvement #${imp.imprvId}`,
                                  totalArea: imp.totalArea ? parseFloat(imp.totalArea) : 0,
                                  livingArea: imp.livingArea ? parseFloat(imp.livingArea) : 0
                                }))}
                                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                                <YAxis label={{ value: 'Square Feet', angle: -90, position: 'insideLeft' }} />
                                <Tooltip formatter={(value) => [`${value.toLocaleString()} sq ft`, 'Area']} />
                                <Legend />
                                <Bar dataKey="totalArea" fill="#8884d8" name="Total Area" />
                                <Bar dataKey="livingArea" fill="#82ca9d" name="Living Area" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <BarChart2 className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">No improvement data available for visualization</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="text-center py-12">
            <Home className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Property Not Found</h2>
            <p className="text-muted-foreground mb-6">The property you're looking for doesn't exist or has been removed.</p>
            <Link href="/properties">
              <Button>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Properties
              </Button>
            </Link>
          </div>
        )}
      </MainContent>
    </LayoutWrapper>
  );
};

// Cost calculation helper functions
const determineBuildingType = (primaryUseCd: string | null): string => {
  if (!primaryUseCd) return 'R1'; // Default to Residential

  // Map primary use codes to building type codes
  const codeMap: Record<string, string> = {
    '100': 'R1', // Single Family Residential
    '101': 'R1',
    '102': 'R2', // Multi-Family Residential
    '103': 'R2',
    '104': 'R3', // Apartments
    '200': 'C1', // Retail Commercial
    '201': 'C1',
    '300': 'C2', // Office Commercial
    '301': 'C2',
    '400': 'I1', // Light Industrial
    '401': 'I1',
    '500': 'I2', // Heavy Industrial
    '501': 'I2',
    '600': 'A1', // Agricultural
    '601': 'A1',
  };

  return codeMap[primaryUseCd] || 'R1';
};

const determineRegion = (property: Property): string => {
  // Determine region based on property location
  // This is a simple implementation that could be enhanced with more detailed mapping
  if (!property.neighborhood) return 'Central Benton';

  const neighborhood = property.neighborhood.toLowerCase();
  
  if (neighborhood.includes('west') || neighborhood.includes('richland')) {
    return 'West Benton';
  } else if (neighborhood.includes('east') || neighborhood.includes('kennewick')) {
    return 'East Benton';
  } else {
    return 'Central Benton';
  }
};

const calculateBaseCost = (buildingType: string, region: string): number => {
  // Base costs per square foot by building type and region
  const costMatrix: Record<string, Record<string, number>> = {
    'R1': {
      'Central Benton': 125.50,
      'East Benton': 135.75,
      'West Benton': 145.25
    },
    'R2': {
      'Central Benton': 110.25,
      'East Benton': 118.50,
      'West Benton': 127.75
    },
    'R3': {
      'Central Benton': 95.50,
      'East Benton': 102.25,
      'West Benton': 109.75
    },
    'C1': {
      'Central Benton': 155.75,
      'East Benton': 162.50,
      'West Benton': 170.25
    },
    'C2': {
      'Central Benton': 175.25,
      'East Benton': 182.75,
      'West Benton': 190.50
    },
    'I1': {
      'Central Benton': 85.50,
      'East Benton': 92.25,
      'West Benton': 99.75
    },
    'I2': {
      'Central Benton': 75.25,
      'East Benton': 82.75,
      'West Benton': 90.25
    },
    'A1': {
      'Central Benton': 55.25,
      'East Benton': 60.75,
      'West Benton': 65.25
    }
  };

  const regionCosts = costMatrix[buildingType] || costMatrix['R1'];
  return regionCosts[region] || regionCosts['Central Benton'];
};

const determineQualityFactor = (improvement: Improvement): number => {
  // Extract quality code from improvement detail if available
  const qualityCode = improvement.details && improvement.details.length > 0 
    ? improvement.details[0].qualityCd 
    : null;
  
  // Quality factors by quality code
  const qualityFactors: Record<string, number> = {
    'A+': 1.3,  // Excellent Plus
    'A': 1.2,   // Excellent
    'B+': 1.15, // Very Good Plus
    'B': 1.1,   // Very Good
    'C+': 1.05, // Good Plus
    'C': 1.0,   // Good (Standard)
    'D+': 0.95, // Average Plus
    'D': 0.9,   // Average
    'E+': 0.85, // Fair Plus
    'E': 0.8,   // Fair
    'F+': 0.75, // Poor Plus
    'F': 0.7    // Poor
  };
  
  return qualityCode && qualityFactors[qualityCode] 
    ? qualityFactors[qualityCode] 
    : 1.0; // Default to standard quality
};

const determineAgeFactor = (yearBuilt: number | null): number => {
  if (!yearBuilt) return 1.0;
  
  const currentYear = new Date().getFullYear();
  const age = currentYear - yearBuilt;
  
  // Age depreciation factors
  if (age <= 5) return 1.0;        // New buildings (0-5 years)
  if (age <= 10) return 0.95;     // 6-10 years
  if (age <= 20) return 0.9;      // 11-20 years
  if (age <= 30) return 0.85;     // 21-30 years
  if (age <= 40) return 0.8;      // 31-40 years
  if (age <= 50) return 0.75;     // 41-50 years
  return 0.7;                     // 50+ years
};

export default PropertyDetailsPage;
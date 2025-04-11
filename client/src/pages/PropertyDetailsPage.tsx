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
  ChevronLeft,
  Home,
  Building,
  Layers,
  Map,
  FileText,
  Clock,
  User,
  Mail,
  MapPin
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
  const { data, isLoading, isError } = useQuery({
    queryKey: [`/api/properties/${propertyId}/details`],
    queryFn: async () => {
      const response = await fetch(`/api/properties/${propertyId}/details`);
      if (!response.ok) {
        throw new Error('Failed to fetch property details');
      }
      return response.json() as Promise<PropertyDetails>;
    },
    enabled: !!propertyId,
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

export default PropertyDetailsPage;
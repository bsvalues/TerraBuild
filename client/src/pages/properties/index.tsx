import React, { useState } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Building,
  Search,
  Filter,
  Map,
  FileDown,
  Plus,
  MoreHorizontal,
  ArrowUpDown,
  ListFilter
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Property interface matching database structure
interface Property {
  id: number;
  parcel_id: string;
  geo_id?: string;
  address: string;
  property_type: string;
  city: string;
  county: string;
  state?: string;
  zip?: string;
  total_value: number;
  land_value?: number;
  land_area?: number;
  year_built?: number;
  bedrooms?: number;
  bathrooms?: number;
  created_at: string;
  updated_at?: string;
  latitude?: number;
  longitude?: number;
  status?: string;
}

const PropertiesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  // Fetch properties from API
  const { data: properties, isLoading, error } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
    queryFn: getQueryFn(),
  });
  
  // If properties are loading, show skeleton UI
  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-9 w-32" />
          </div>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }
  
  // If there was an error fetching properties or no properties were returned
  if (error || !properties) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle>Error Loading Properties</CardTitle>
          </CardHeader>
          <CardContent>
            <p>There was an error loading the property data. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Default status for properties that don't have one
  const propertiesWithStatus = properties.map(property => ({
    ...property,
    status: property.status || 'Active'
  }));
  
  // Filter properties based on search term and active tab
  const filteredProperties = propertiesWithStatus.filter(property => {
    const matchesSearch = 
      property.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.parcel_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.county?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'residential') return matchesSearch && property.property_type === 'Residential';
    if (activeTab === 'commercial') return matchesSearch && property.property_type === 'Commercial';
    if (activeTab === 'pending') return matchesSearch && property.status === 'Pending Review';
    
    return matchesSearch;
  });
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Properties</h1>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Property
          </Button>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search properties..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm" className="flex gap-1 items-center">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" size="sm" className="flex gap-1 items-center">
            <FileDown className="h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" size="sm" className="flex gap-1 items-center">
            <Map className="h-4 w-4" />
            Map View
          </Button>
        </div>
        
        <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All Properties</TabsTrigger>
            <TabsTrigger value="residential">Residential</TabsTrigger>
            <TabsTrigger value="commercial">Commercial</TabsTrigger>
            <TabsTrigger value="pending">Pending Review</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Property Inventory</CardTitle>
                <CardDescription>
                  Showing {filteredProperties.length} properties in Benton County and surrounding areas.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">ID</TableHead>
                      <TableHead>
                        <div className="flex items-center gap-1">
                          Address
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>County</TableHead>
                      <TableHead>
                        <div className="flex items-center gap-1">
                          Value
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProperties.map((property) => (
                      <TableRow key={property.id}>
                        <TableCell className="font-medium">
                          <Link href={`/properties/${property.id}`}>
                            {property.parcel_id}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Link href={`/properties/${property.id}`} className="hover:underline">
                            {property.address}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant={property.property_type === 'Residential' ? 'default' : 'secondary'}>
                            {property.property_type}
                          </Badge>
                        </TableCell>
                        <TableCell>{property.city}</TableCell>
                        <TableCell>{property.county}</TableCell>
                        <TableCell>${property.total_value.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={property.status === 'Active' ? 'outline' : 'destructive'}>
                            {property.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Link href={`/properties/${property.id}`}>
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>Edit Property</DropdownMenuItem>
                              <DropdownMenuItem>Generate Report</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="residential" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Residential Properties</CardTitle>
                <CardDescription>
                  Showing {filteredProperties.length} residential properties.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  {/* Same table structure as above */}
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">ID</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>County</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProperties.map((property) => (
                      <TableRow key={property.id}>
                        <TableCell className="font-medium">
                          <Link href={`/properties/${property.id}`}>
                            {property.parcel_id}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Link href={`/properties/${property.id}`} className="hover:underline">
                            {property.address}
                          </Link>
                        </TableCell>
                        <TableCell>{property.city}</TableCell>
                        <TableCell>{property.county}</TableCell>
                        <TableCell>${property.total_value.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={property.status === 'Active' ? 'outline' : 'destructive'}>
                            {property.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Link href={`/properties/${property.id}`}>
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>Edit Property</DropdownMenuItem>
                              <DropdownMenuItem>Generate Report</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="commercial" className="mt-4">
            {/* Similar structure for commercial properties */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Commercial Properties</CardTitle>
                <CardDescription>
                  Showing {filteredProperties.length} commercial properties.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  {/* Same table structure as above */}
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">ID</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>County</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProperties.map((property) => (
                      <TableRow key={property.id}>
                        <TableCell className="font-medium">
                          <Link href={`/properties/${property.id}`}>
                            {property.parcel_id}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Link href={`/properties/${property.id}`} className="hover:underline">
                            {property.address}
                          </Link>
                        </TableCell>
                        <TableCell>{property.city}</TableCell>
                        <TableCell>{property.county}</TableCell>
                        <TableCell>${property.total_value.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={property.status === 'Active' ? 'outline' : 'destructive'}>
                            {property.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Link href={`/properties/${property.id}`}>
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>Edit Property</DropdownMenuItem>
                              <DropdownMenuItem>Generate Report</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="pending" className="mt-4">
            {/* Similar structure for pending properties */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Pending Review</CardTitle>
                <CardDescription>
                  Showing {filteredProperties.length} properties pending review.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  {/* Same table structure as above */}
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">ID</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>County</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProperties.map((property) => (
                      <TableRow key={property.id}>
                        <TableCell className="font-medium">
                          <Link href={`/properties/${property.id}`}>
                            {property.parcel_id}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Link href={`/properties/${property.id}`} className="hover:underline">
                            {property.address}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant={property.property_type === 'Residential' ? 'default' : 'secondary'}>
                            {property.property_type}
                          </Badge>
                        </TableCell>
                        <TableCell>{property.city}</TableCell>
                        <TableCell>{property.county}</TableCell>
                        <TableCell>${property.total_value.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant="destructive">
                            {property.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Link href={`/properties/${property.id}`}>
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>Approve</DropdownMenuItem>
                              <DropdownMenuItem>Edit Property</DropdownMenuItem>
                              <DropdownMenuItem>Generate Report</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PropertiesPage;
import React, { useState } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

// Example property data
const properties = [
  {
    id: '1',
    parcelId: 'BC-10032-54',
    address: '1234 Main St, Richland, WA 99352',
    type: 'Residential',
    region: 'Richland',
    hoodCode: '52100 100',
    value: '$485,000',
    lastAssessed: '2024-12-10',
    status: 'Active',
  },
  {
    id: '2',
    parcelId: 'BC-10045-76',
    address: '567 Oak Ave, Kennewick, WA 99336',
    type: 'Commercial',
    region: 'Kennewick',
    hoodCode: '52100 140',
    value: '$1,250,000',
    lastAssessed: '2024-11-15',
    status: 'Active',
  },
  {
    id: '3',
    parcelId: 'BC-10089-23',
    address: '890 Pine Rd, Richland, WA 99352',
    type: 'Residential',
    region: 'Richland',
    hoodCode: '52100 100',
    value: '$550,000',
    lastAssessed: '2024-10-22',
    status: 'Under Review',
  },
  {
    id: '4',
    parcelId: 'BC-10125-89',
    address: '432 Cedar Ln, West Richland, WA 99353',
    type: 'Residential',
    region: 'West Richland',
    hoodCode: '52100 240',
    value: '$410,000',
    lastAssessed: '2024-12-05',
    status: 'Active',
  },
  {
    id: '5',
    parcelId: 'BC-10201-43',
    address: '789 Industrial Way, Kennewick, WA 99336',
    type: 'Industrial',
    region: 'Kennewick',
    hoodCode: '52100 140',
    value: '$2,850,000',
    lastAssessed: '2024-09-18',
    status: 'Active',
  },
  {
    id: '6',
    parcelId: 'BC-10256-91',
    address: '345 Vineyard Rd, Prosser, WA 99350',
    type: 'Agricultural',
    region: 'Prosser',
    hoodCode: '52100 320',
    value: '$1,100,000',
    lastAssessed: '2024-11-30',
    status: 'Active',
  },
];

const PropertiesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterRegion, setFilterRegion] = useState('All');

  // Filter properties based on search and filters
  const filteredProperties = properties.filter(property => {
    const matchesSearch = !searchTerm || 
      property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.parcelId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'All' || property.type === filterType;
    const matchesRegion = filterRegion === 'All' || property.region === filterRegion;
    
    return matchesSearch && matchesType && matchesRegion;
  });

  // Get unique types and regions for filters
  const propertyTypes = ['All', ...Array.from(new Set(properties.map(p => p.type)))];
  const regions = ['All', ...Array.from(new Set(properties.map(p => p.region)))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-blue-100">Properties</h1>
        <Button className="bg-blue-700 hover:bg-blue-600">
          <Plus className="mr-2 h-4 w-4" />
          Add Property
        </Button>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="bg-blue-900/50 border border-blue-800/40">
          <TabsTrigger value="all" className="data-[state=active]:bg-blue-800/50">All Properties</TabsTrigger>
          <TabsTrigger value="residential" className="data-[state=active]:bg-blue-800/50">Residential</TabsTrigger>
          <TabsTrigger value="commercial" className="data-[state=active]:bg-blue-800/50">Commercial</TabsTrigger>
          <TabsTrigger value="map" className="data-[state=active]:bg-blue-800/50">
            <Map className="h-4 w-4 mr-2" />
            Map View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card className="bg-blue-900/30 border-blue-800/40">
            <CardHeader className="pb-0">
              <CardTitle className="text-blue-100">Property Management</CardTitle>
              <CardDescription className="text-blue-300">
                View and manage all property records in Benton County.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 py-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-400" />
                    <Input
                      placeholder="Search properties by address or parcel ID..."
                      className="pl-8 bg-blue-900/50 border-blue-700/50 text-blue-100 placeholder:text-blue-400/70"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="border-blue-700/50 bg-blue-900/50 text-blue-200">
                          <ListFilter className="mr-2 h-4 w-4" />
                          Type: {filterType}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-blue-900 border-blue-700">
                        {propertyTypes.map(type => (
                          <DropdownMenuItem 
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={`text-blue-200 hover:bg-blue-800 ${filterType === type ? 'font-medium' : ''}`}
                          >
                            {type}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="border-blue-700/50 bg-blue-900/50 text-blue-200">
                          <Map className="mr-2 h-4 w-4" />
                          Region: {filterRegion}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-blue-900 border-blue-700">
                        {regions.map(region => (
                          <DropdownMenuItem 
                            key={region}
                            onClick={() => setFilterRegion(region)}
                            className={`text-blue-200 hover:bg-blue-800 ${filterRegion === region ? 'font-medium' : ''}`}
                          >
                            {region}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    
                    <Button variant="outline" className="border-blue-700/50 bg-blue-900/50 text-blue-200">
                      <FileDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="rounded-md border border-blue-800">
                  <Table>
                    <TableHeader className="bg-blue-900/50">
                      <TableRow className="hover:bg-blue-900/60 border-blue-800">
                        <TableHead className="text-blue-300 w-[100px]">
                          <div className="flex items-center">
                            Parcel ID
                            <ArrowUpDown className="ml-1 h-3 w-3" />
                          </div>
                        </TableHead>
                        <TableHead className="text-blue-300">
                          <div className="flex items-center">
                            Address
                            <ArrowUpDown className="ml-1 h-3 w-3" />
                          </div>
                        </TableHead>
                        <TableHead className="text-blue-300">Type</TableHead>
                        <TableHead className="text-blue-300">Region</TableHead>
                        <TableHead className="text-blue-300 hidden md:table-cell">Value</TableHead>
                        <TableHead className="text-blue-300 hidden md:table-cell">Last Assessed</TableHead>
                        <TableHead className="text-blue-300">Status</TableHead>
                        <TableHead className="text-blue-300 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProperties.length > 0 ? (
                        filteredProperties.map((property) => (
                          <TableRow key={property.id} className="hover:bg-blue-900/60 border-blue-800">
                            <TableCell className="font-mono text-blue-200">
                              <Link href={`/properties/detail/${property.id}`} className="hover:underline">
                                {property.parcelId}
                              </Link>
                            </TableCell>
                            <TableCell className="text-blue-100">
                              <Link href={`/properties/detail/${property.id}`} className="hover:underline">
                                {property.address}
                              </Link>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`
                                ${property.type === 'Residential' ? 'border-blue-500 text-blue-300' : ''}
                                ${property.type === 'Commercial' ? 'border-cyan-500 text-cyan-300' : ''}
                                ${property.type === 'Industrial' ? 'border-indigo-500 text-indigo-300' : ''}
                                ${property.type === 'Agricultural' ? 'border-emerald-500 text-emerald-300' : ''}
                              `}>
                                {property.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-blue-200">{property.region}</TableCell>
                            <TableCell className="hidden md:table-cell text-blue-100">{property.value}</TableCell>
                            <TableCell className="hidden md:table-cell text-blue-300">{property.lastAssessed}</TableCell>
                            <TableCell>
                              <Badge variant={property.status === 'Active' ? 'default' : 'outline'} className={`
                                ${property.status === 'Active' ? 'bg-emerald-600/50 hover:bg-emerald-600/70 text-emerald-200' : ''}
                                ${property.status === 'Under Review' ? 'bg-amber-600/50 hover:bg-amber-600/70 text-amber-200' : ''}
                              `}>
                                {property.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0 text-blue-300 hover:text-blue-100">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-blue-900 border-blue-700">
                                  <DropdownMenuItem className="text-blue-200 hover:bg-blue-800">
                                    <Link href={`/properties/detail/${property.id}`}>View Details</Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-blue-200 hover:bg-blue-800">Edit Property</DropdownMenuItem>
                                  <DropdownMenuItem className="text-blue-200 hover:bg-blue-800">Calculate Valuation</DropdownMenuItem>
                                  <DropdownMenuItem className="text-blue-200 hover:bg-blue-800">View History</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center h-24 text-blue-300">
                            No properties found matching your filters
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="flex items-center justify-between text-blue-300 text-sm">
                  <div>Showing {filteredProperties.length} of {properties.length} properties</div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" className="h-8 border-blue-700/50 bg-blue-900/50 text-blue-200">Previous</Button>
                    <Button variant="outline" size="sm" className="h-8 border-blue-700/50 bg-blue-900/50 text-blue-200">Next</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="residential" className="space-y-4">
          <Card className="bg-blue-900/30 border-blue-800/40">
            <CardHeader>
              <CardTitle className="text-blue-100">Residential Properties</CardTitle>
              <CardDescription className="text-blue-300">
                View and manage all residential properties in Benton County.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-blue-200 mb-4">
                This section shows all residential properties. Filter options specific to residential properties are available below.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <Card className="bg-blue-900/50 border-blue-800/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-blue-100 text-lg">Single Family</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-100">1,845</div>
                    <div className="text-sm text-blue-300">Average value: $485,000</div>
                  </CardContent>
                </Card>
                <Card className="bg-blue-900/50 border-blue-800/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-blue-100 text-lg">Multi Family</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-100">386</div>
                    <div className="text-sm text-blue-300">Average value: $752,000</div>
                  </CardContent>
                </Card>
                <Card className="bg-blue-900/50 border-blue-800/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-blue-100 text-lg">Condominium</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-100">97</div>
                    <div className="text-sm text-blue-300">Average value: $340,000</div>
                  </CardContent>
                </Card>
              </div>
              <Button className="bg-blue-700 hover:bg-blue-600">View All Residential Properties</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="commercial" className="space-y-4">
          <Card className="bg-blue-900/30 border-blue-800/40">
            <CardHeader>
              <CardTitle className="text-blue-100">Commercial Properties</CardTitle>
              <CardDescription className="text-blue-300">
                View and manage all commercial properties in Benton County.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-blue-200 mb-4">
                This section shows all commercial properties. Filter options specific to commercial properties are available below.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <Card className="bg-blue-900/50 border-blue-800/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-blue-100 text-lg">Retail</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-100">212</div>
                    <div className="text-sm text-blue-300">Average value: $1,250,000</div>
                  </CardContent>
                </Card>
                <Card className="bg-blue-900/50 border-blue-800/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-blue-100 text-lg">Office</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-100">184</div>
                    <div className="text-sm text-blue-300">Average value: $1,840,000</div>
                  </CardContent>
                </Card>
                <Card className="bg-blue-900/50 border-blue-800/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-blue-100 text-lg">Mixed Use</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-100">90</div>
                    <div className="text-sm text-blue-300">Average value: $2,150,000</div>
                  </CardContent>
                </Card>
              </div>
              <Button className="bg-blue-700 hover:bg-blue-600">View All Commercial Properties</Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="map" className="space-y-4">
          <Card className="bg-blue-900/30 border-blue-800/40">
            <CardHeader>
              <CardTitle className="text-blue-100">Property Map View</CardTitle>
              <CardDescription className="text-blue-300">
                Geographic visualization of property locations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[500px] w-full bg-blue-950/50 rounded-lg border border-blue-800/40 flex items-center justify-center">
                <div className="text-center p-8">
                  <Map className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                  <p className="text-blue-200 mb-2">Interactive map view will be available soon</p>
                  <p className="text-blue-400 text-sm">This feature will display property locations with advanced filtering options and geospatial analysis tools.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PropertiesPage;
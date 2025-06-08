import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { PageHeader } from '@/components/ui/page-header';
import { EnterpriseCard, EnterpriseCardHeader, EnterpriseCardTitle, EnterpriseCardContent } from '@/components/ui/enterprise-card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  ChevronLeft, 
  ChevronRight, 
  Search,
  Building,
  Home,
  Info,
  Plus,
  Download,
  Upload,
  FileDown
} from "lucide-react";

// Property type definition
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

const PropertyBrowserPage = () => {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const pageSize = 20;

  // Fetch properties with pagination
  const { data, isLoading, isError } = useQuery({
    queryKey: ['/api/properties', page, pageSize],
    queryFn: async () => {
      const response = await fetch(`/api/properties?page=${page}&limit=${pageSize}`);
      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }
      return response.json();
    }
  });

  // Show error toast only when error state changes
  useEffect(() => {
    // Only show toast when error first occurs
    if (isError) {
      toast({
        title: "Error",
        description: "Failed to load properties. Please try again later.",
        variant: "destructive",
      });
    }
  }, [isError]); // Intentionally omit toast from deps to avoid re-render loop

  // Filtered properties based on search
  const filteredProperties = searchQuery && data 
    ? data.filter((property: Property) => 
        (property.propertyAddress && property.propertyAddress.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (property.ownerName && property.ownerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (property.propId.toString().includes(searchQuery))
      )
    : data;

  // Header actions for the page
  const headerActions = [
    {
      label: "Add Property",
      icon: <Plus className="h-4 w-4" />,
      variant: "default" as const,
      href: "/properties/new",
      tooltipText: "Add a new property to the database"
    },
    {
      label: "Export",
      icon: <FileDown className="h-4 w-4" />,
      variant: "outline" as const,
      onClick: () => console.log("Export properties"),
      tooltipText: "Export properties to CSV or Excel"
    },
    {
      label: "Import",
      icon: <Upload className="h-4 w-4" />,
      variant: "outline" as const,
      href: "/data-import",
      tooltipText: "Import properties from a file"
    }
  ];

  return (
    <MainLayout loading={isLoading && page === 1}>
      <div className="space-y-6">
        <PageHeader
          title="Property Database"
          description="Browse, search, and manage property records from Benton County"
          actions={headerActions}
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Properties", href: "/properties" }
          ]}
          helpText="This database contains all of the properties in Benton County. You can search, filter, and export property data from this page."
        />
        
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Search className="h-5 w-5 text-[#29B7D3] mr-2" />
              Search Properties
            </CardTitle>
            <CardDescription>
              Search by address, owner name, or property ID
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Type to search properties..."
                className="pl-8 bg-gray-50 focus:bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Building className="h-5 w-5 text-[#29B7D3] mr-2" />
              Property Records
            </CardTitle>
            <CardDescription>
              Showing {data ? (filteredProperties ? filteredProperties.length : 0) : '0'} of {data ? data.length : 0} properties
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && page !== 1 ? (
              // Skeleton loader for properties table
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>ID</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Parcel Number</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProperties && filteredProperties.length > 0 ? (
                        filteredProperties.map((property: Property) => (
                          <TableRow key={property.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium">{property.propId}</TableCell>
                            <TableCell>
                              {property.propertyAddress ? (
                                <>
                                  {property.propertyAddress}
                                  {property.propertyCity && <>, {property.propertyCity}</>}
                                  {property.propertyState && <>, {property.propertyState}</>}
                                  {property.propertyZip && <> {property.propertyZip}</>}
                                </>
                              ) : (
                                <span className="text-gray-400 italic">No address</span>
                              )}
                            </TableCell>
                            <TableCell>{property.ownerName || 'Unknown'}</TableCell>
                            <TableCell>{property.parcelNumber || 'N/A'}</TableCell>
                            <TableCell className="text-right">
                              <Link href={`/properties/${property.id}`}>
                                <Button variant="outline" size="sm" className="hover:bg-[#29B7D3]/10 hover:text-[#29B7D3] hover:border-[#29B7D3]/30">
                                  <Info className="h-4 w-4 mr-1" />
                                  Details
                                </Button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-6">
                            <div className="flex flex-col items-center justify-center space-y-2 py-8">
                              <Home className="h-12 w-12 text-gray-300" />
                              <p className="text-gray-500 font-medium">No properties found</p>
                              <p className="text-gray-400 text-sm max-w-md text-center">
                                {searchQuery ? 
                                  "Try adjusting your search criteria or clear the search to see all properties." : 
                                  "There are no properties in the database. Add a property to get started."}
                              </p>
                              {searchQuery && (
                                <Button
                                  variant="outline"
                                  onClick={() => setSearchQuery('')}
                                  className="mt-2"
                                >
                                  Clear search
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Pagination controls */}
                <div className="flex items-center justify-between mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="text-[#243E4D]"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <div className="px-4 py-1.5 bg-white border rounded-md text-sm text-gray-600">
                    Page {page}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => p + 1)}
                    disabled={!data || data.length < pageSize}
                    className="text-[#243E4D]"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default PropertyBrowserPage;
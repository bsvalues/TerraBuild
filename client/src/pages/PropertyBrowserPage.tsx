import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import LayoutWrapper from '@/components/layout/LayoutWrapper';
import MainContent from '@/components/layout/MainContent';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
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
  Info
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

  return (
    <LayoutWrapper>
      <MainContent title="Property Browser">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Property Browser</h1>
            <p className="text-muted-foreground">
              Browse and search property records from Benton County
            </p>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle>Search Properties</CardTitle>
            <CardDescription>
              Search by address, owner name, or property ID
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search properties..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Property Records</CardTitle>
            <CardDescription>
              Showing {data ? filteredProperties.length : '0'} properties
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              // Skeleton loader for properties table
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
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
                          <TableRow key={property.id}>
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
                                <span className="text-muted-foreground italic">No address</span>
                              )}
                            </TableCell>
                            <TableCell>{property.ownerName || 'Unknown'}</TableCell>
                            <TableCell>{property.parcelNumber || 'N/A'}</TableCell>
                            <TableCell className="text-right">
                              <Link href={`/properties/${property.id}`}>
                                <Button variant="outline" size="sm">
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
                            <div className="flex flex-col items-center justify-center space-y-2">
                              <Home className="h-8 w-8 text-muted-foreground" />
                              <p className="text-muted-foreground">No properties found</p>
                              {searchQuery && (
                                <Button
                                  variant="outline"
                                  onClick={() => setSearchQuery('')}
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
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => p + 1)}
                    disabled={!data || data.length < pageSize}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </MainContent>
    </LayoutWrapper>
  );
};

export default PropertyBrowserPage;
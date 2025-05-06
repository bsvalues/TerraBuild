import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList 
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, MapPin, Home, Building, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface Property {
  id: string;
  parcelId: string;
  address: string;
  state?: string;
  county?: string;
  zone?: string;
  propertyType?: string;
  yearBuilt?: number;
}

interface PropertySearchProps {
  onSelectProperty: (property: Property) => void;
}

export default function PropertySearch({ onSelectProperty }: PropertySearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // Query to fetch properties from the API
  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['properties', searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 3) return [];
      
      try {
        // In a real implementation, this would call the API with the search term
        const response = await fetch(`/api/properties?search=${encodeURIComponent(searchTerm)}`);
        if (!response.ok) throw new Error('Failed to fetch properties');
        return await response.json();
      } catch (error) {
        console.error('Error fetching properties:', error);
        return [];
      }
    },
    enabled: searchTerm.length >= 3
  });

  const handleSelectProperty = (property: Property) => {
    setSelectedProperty(property);
    setOpen(false);
    onSelectProperty(property);
  };

  const buildingTypeIcon = (propertyType?: string) => {
    if (propertyType?.toLowerCase().includes('commercial')) return <Building className="h-4 w-4 mr-2" />;
    if (propertyType?.toLowerCase().includes('industrial')) return <Building className="h-4 w-4 mr-2" />;
    return <Home className="h-4 w-4 mr-2" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Property Search</CardTitle>
        <CardDescription>
          Enter an address or parcel ID to find a specific property
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full justify-between"
                role="combobox"
                aria-expanded={open}
              >
                {selectedProperty ? selectedProperty.address : "Search for a property..."}
                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
              <Command shouldFilter={false}>
                <CommandInput 
                  placeholder="Enter address or parcel ID..." 
                  value={searchTerm}
                  onValueChange={setSearchTerm}
                />
                {searchTerm.length < 3 && (
                  <p className="p-2 text-sm text-muted-foreground">
                    Enter at least 3 characters to search
                  </p>
                )}
                {searchTerm.length >= 3 && (
                  <CommandList>
                    {isLoading ? (
                      <CommandEmpty>Searching...</CommandEmpty>
                    ) : properties.length === 0 ? (
                      <CommandEmpty>No properties found</CommandEmpty>
                    ) : (
                      <CommandGroup heading="Properties">
                        {properties.map((property: Property) => (
                          <CommandItem
                            key={property.id}
                            value={property.id}
                            onSelect={() => handleSelectProperty(property)}
                          >
                            <div className="flex items-center">
                              {buildingTypeIcon(property.propertyType)}
                              <div className="flex flex-col">
                                <span>{property.address}</span>
                                <span className="text-xs text-muted-foreground">
                                  Parcel ID: {property.parcelId} • {property.county}, {property.state}
                                </span>
                              </div>
                            </div>
                            {selectedProperty?.id === property.id && (
                              <Check className="h-4 w-4 ml-auto" />
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </CommandList>
                )}
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {selectedProperty && (
          <div className="mt-4 p-4 border rounded-md bg-muted/30">
            <h3 className="font-medium mb-2 flex items-center">
              <MapPin className="h-4 w-4 mr-2" /> Selected Property
            </h3>
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="font-medium">Address:</span> {selectedProperty.address}
                </div>
                <div>
                  <span className="font-medium">Parcel ID:</span> {selectedProperty.parcelId}
                </div>
                <div>
                  <span className="font-medium">County:</span> {selectedProperty.county || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">State:</span> {selectedProperty.state || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Zone:</span> {selectedProperty.zone || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Year Built:</span> {selectedProperty.yearBuilt || 'N/A'}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building, MapPin, Search } from 'lucide-react';
import axios from 'axios';

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
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // Search for properties based on the query
  const searchProperties = async () => {
    if (!searchQuery || searchQuery.length < 3) return;
    
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/properties?search=${encodeURIComponent(searchQuery)}`);
      setProperties(response.data);
    } catch (error) {
      console.error('Error searching properties:', error);
      setProperties([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle property selection
  const handleSelectProperty = (property: Property) => {
    setSelectedProperty(property);
    onSelectProperty(property);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Property Search</CardTitle>
        <CardDescription>
          Search for a property by address or parcel ID
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-2">
          <Input
            placeholder="Enter address or parcel ID"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchProperties()}
          />
          <Button
            variant="secondary"
            onClick={searchProperties}
            disabled={isLoading || searchQuery.length < 3}
          >
            <Search className="h-4 w-4 mr-1" />
            Search
          </Button>
        </div>

        {selectedProperty && (
          <div className="p-3 border rounded-md bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Building className="h-4 w-4 text-primary" />
                <span className="font-medium">{selectedProperty.address}</span>
              </div>
              <Badge variant="outline">Selected</Badge>
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              Parcel ID: {selectedProperty.parcelId}
              {selectedProperty.county && <span> | {selectedProperty.county} County</span>}
              {selectedProperty.propertyType && <span> | {selectedProperty.propertyType}</span>}
            </div>
          </div>
        )}

        {!selectedProperty && properties.length > 0 && (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            <p className="text-sm font-medium text-muted-foreground">Search Results</p>
            {properties.map((property) => (
              <div
                key={property.id}
                className="p-2 border rounded-md hover:bg-accent cursor-pointer"
                onClick={() => handleSelectProperty(property)}
              >
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-primary/60" />
                  <span>{property.address}</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Parcel ID: {property.parcelId}
                  {property.county && <span> | {property.county} County</span>}
                  {property.propertyType && <span> | {property.propertyType}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {isLoading && (
          <div className="text-center p-4">
            <p className="text-sm text-muted-foreground">Searching properties...</p>
          </div>
        )}

        {!isLoading && searchQuery.length >= 3 && properties.length === 0 && (
          <div className="text-center p-4">
            <p className="text-sm text-muted-foreground">No properties found. Try a different search term.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
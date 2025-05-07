import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building, MapPin, Search } from 'lucide-react';
import axios from 'axios';
import { SmartSearch } from '@/components/search/SmartSearch';

// Define property interfaces locally since we can't directly import from shared/models
interface Property {
  id: number;
  legal_desc?: string;
  geo_id?: string;
  property_use_desc?: string;
  assessed_val?: number;
  appraised_val?: number;
  property_use_cd?: string;
  hood_cd?: string;
}

interface PropertyViewModel {
  id: number;
  parcelId: string;
  address: string;
  county?: string;
  state?: string;
  propertyType?: string;
  assessedValue?: number;
  totalValue?: number;
}

// Convert database property to view model
function toPropertyViewModel(property: Property): PropertyViewModel {
  return {
    id: property.id,
    parcelId: property.geo_id || `BC-${property.id}`,
    address: property.legal_desc || `Property #${property.id}`,
    county: "Benton",
    state: "WA",
    propertyType: property.property_use_desc,
    assessedValue: property.assessed_val,
    totalValue: property.appraised_val
  };
}

interface PropertySearchProps {
  onSelectProperty: (property: PropertyViewModel) => void;
}

export default function PropertySearch({ onSelectProperty }: PropertySearchProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [properties, setProperties] = useState<PropertyViewModel[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedProperty, setSelectedProperty] = useState<PropertyViewModel | null>(null);

  // Search for properties based on the query
  const searchProperties = async () => {
    if (!searchQuery || searchQuery.length < 3) return;
    
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/properties?search=${encodeURIComponent(searchQuery)}`);
      // Convert database properties to view models
      const propertyViewModels = response.data.map((property: Property) => 
        toPropertyViewModel(property)
      );
      setProperties(propertyViewModels);
    } catch (error) {
      console.error('Error searching properties:', error);
      setProperties([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle property selection
  const handleSelectProperty = (property: PropertyViewModel) => {
    setSelectedProperty(property);
    onSelectProperty(property);
  };

  // Convert property from the Smart Search format to the PropertyViewModel format
  const convertToPropertyViewModel = (property: any): PropertyViewModel => {
    return {
      id: property.id,
      parcelId: property.prop_id || property.geo_id || `BC-${property.id}`,
      address: property.address || property.legal_desc || `Property #${property.id}`,
      county: "Benton",
      state: "WA",
      propertyType: property.property_use_desc || "Unknown",
      assessedValue: property.assessed_val || 0,
      totalValue: property.appraised_val || 0
    };
  };

  // Handle property selection from SmartSearch
  const handleSmartSearchPropertySelect = (property: any) => {
    const propertyViewModel = convertToPropertyViewModel(property);
    setSelectedProperty(propertyViewModel);
    onSelectProperty(propertyViewModel);
  };

  // Handle neighborhood selection from SmartSearch
  const handleSmartSearchNeighborhoodSelect = (neighborhood: any) => {
    // Set neighborhood in state or context if needed
    console.log("Selected neighborhood:", neighborhood);
    
    // Here we could potentially load properties from this neighborhood
    // or just display neighborhood information
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Smart Property Search</CardTitle>
        <CardDescription>
          Search for properties and neighborhoods with predictive suggestions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <SmartSearch 
          onSelectProperty={handleSmartSearchPropertySelect}
          onSelectNeighborhood={handleSmartSearchNeighborhoodSelect}
          placeholder="Search by address, property ID, or neighborhood..."
        />

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
              {selectedProperty.assessedValue && (
                <span> | Assessed Value: ${selectedProperty.assessedValue.toLocaleString()}</span>
              )}
            </div>
          </div>
        )}

        {/* Legacy search UI - keeping as fallback */}
        <div className="border-t pt-4 mt-4">
          <p className="text-sm font-medium mb-2">Advanced Search</p>
          <div className="flex space-x-2">
            <Input
              placeholder="Enter legal description or property ID"
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
        </div>

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
                  {property.assessedValue && (
                    <span> | Assessed: ${property.assessedValue.toLocaleString()}</span>
                  )}
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
            <p className="text-sm text-muted-foreground">No properties found in advanced search. Try using the smart search above.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
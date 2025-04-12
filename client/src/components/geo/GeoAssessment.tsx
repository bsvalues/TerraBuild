/**
 * GeoAssessment Component
 * 
 * Provides interactive geospatial visualization of property locations and assessments
 * with map-based views, filtering, and property details.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Search, Filter, Layers, Plus, Minus, Home, X, ChevronRight, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

interface Property {
  id: number;
  propId: string;
  address: string;
  owner: string;
  lat: number;
  lng: number;
  assessedValue: number;
  propertyType: string;
  buildingType?: string;
  yearBuilt?: number;
  squareFeet?: number;
  hasAssessmentData: boolean;
}

interface MapMarker {
  id: number;
  lat: number;
  lng: number;
  size: number;
  color: string;
  property: Property;
}

interface GeoAssessmentProps {
  initialLat?: number;
  initialLng?: number;
  initialZoom?: number;
  height?: number;
  showFilters?: boolean;
  selectedPropertyId?: number;
  onPropertySelect?: (property: Property) => void;
}

export function GeoAssessment({
  initialLat = 46.2087,  // Benton County, WA approximate center
  initialLng = -119.1352,
  initialZoom = 12,
  height = 600,
  showFilters = true,
  selectedPropertyId,
  onPropertySelect
}: GeoAssessmentProps) {
  const { toast } = useToast();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapInteractionKey, setMapInteractionKey] = useState(Date.now()); // For forcing map refreshes
  
  // Map state
  const [mapReady, setMapReady] = useState(false);
  const [center, setCenter] = useState({ lat: initialLat, lng: initialLng });
  const [zoom, setZoom] = useState(initialZoom);
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [valueRange, setValueRange] = useState([0, 1000000]);
  const [selectedPropertyType, setSelectedPropertyType] = useState<string | null>(null);
  const [filterExpanded, setFilterExpanded] = useState(false);
  
  // Fetch properties
  const { data: properties, isLoading, isError, refetch } = useQuery({
    queryKey: ['/api/properties'],
    queryFn: async () => {
      const response = await fetch('/api/properties');
      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }
      return response.json() as Promise<Property[]>;
    }
  });
  
  // Mock map loading since we don't have a real map service here
  useEffect(() => {
    const timer = setTimeout(() => {
      setMapReady(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [mapInteractionKey]);
  
  // Process properties into map markers
  useEffect(() => {
    if (!properties) return;
    
    // Filter properties
    const filteredProperties = properties.filter(property => {
      // Search term filter
      if (searchTerm && !property.address.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !property.propId.toString().includes(searchTerm)) {
        return false;
      }
      
      // Value range filter
      if (property.assessedValue < valueRange[0] || property.assessedValue > valueRange[1]) {
        return false;
      }
      
      // Property type filter
      if (selectedPropertyType && property.propertyType !== selectedPropertyType) {
        return false;
      }
      
      return true;
    });
    
    // Convert to markers
    const newMarkers: MapMarker[] = filteredProperties.map(property => {
      // Determine marker size and color based on property value
      const valueFactor = Math.min(property.assessedValue / 1000000, 1);
      const size = 10 + (valueFactor * 20);
      
      // Color based on property type
      let color = '#3B82F6'; // Default blue
      
      switch (property.propertyType) {
        case 'Residential':
          color = '#10B981'; // Green
          break;
        case 'Commercial':
          color = '#6366F1'; // Indigo
          break;
        case 'Agricultural':
          color = '#F59E0B'; // Amber
          break;
        case 'Industrial':
          color = '#EF4444'; // Red
          break;
      }
      
      // Use property coords if available, otherwise use random coords near center
      const lat = property.lat || center.lat + (Math.random() * 0.05 - 0.025);
      const lng = property.lng || center.lng + (Math.random() * 0.05 - 0.025);
      
      return {
        id: property.id,
        lat,
        lng,
        size,
        color,
        property
      };
    });
    
    setMarkers(newMarkers);
    
    // If there's a selectedPropertyId, find and select that marker
    if (selectedPropertyId) {
      const marker = newMarkers.find(m => m.property.id === selectedPropertyId) || null;
      setSelectedMarker(marker);
      
      // Center on selected marker
      if (marker) {
        setCenter({ lat: marker.lat, lng: marker.lng });
        setZoom(15);
      }
    }
  }, [properties, searchTerm, valueRange, selectedPropertyType, selectedPropertyId, center.lat, center.lng]);
  
  // Zoom controls
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 1, 20));
  };
  
  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 1, 5));
  };
  
  // Reset map to initial state
  const handleResetMap = () => {
    setCenter({ lat: initialLat, lng: initialLng });
    setZoom(initialZoom);
    setSelectedMarker(null);
  };
  
  // Handle marker selection
  const handleMarkerClick = (marker: MapMarker) => {
    setSelectedMarker(marker);
    setCenter({ lat: marker.lat, lng: marker.lng });
    setZoom(16);
    
    if (onPropertySelect) {
      onPropertySelect(marker.property);
    }
  };
  
  // Clear marker selection
  const clearSelectedMarker = () => {
    setSelectedMarker(null);
  };
  
  // Derived property list for sidebar
  const propertyList = markers.slice(0, 50); // Limit display for performance
  
  // Property type options from data
  const propertyTypes = properties ? 
    Array.from(new Set(properties.map(p => p.propertyType || ''))).filter(Boolean) : 
    ['Residential', 'Commercial', 'Agricultural', 'Industrial'];
  
  // Mock map placeholder (in a real implementation, this would be a map library)
  const renderMap = () => (
    <div 
      ref={mapContainerRef}
      className="relative w-full h-full bg-slate-100 rounded-md overflow-hidden"
      style={{ minHeight: '300px' }}
    >
      {!mapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-200">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading map data...</p>
          </div>
        </div>
      )}
      
      {mapReady && (
        <>
          {/* Map content - in a real app, this would be a map component */}
          <div className="absolute inset-0 bg-slate-100">
            {/* Display some geographical features to simulate a map */}
            <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)', backgroundSize: `${20 * zoom}px ${20 * zoom}px` }}></div>
            
            {/* Draw some "roads" */}
            <div className="absolute" style={{ top: '30%', left: '10%', width: '80%', height: '2px', backgroundColor: '#CBD5E1', transform: 'rotate(15deg)' }}></div>
            <div className="absolute" style={{ top: '50%', left: '0%', width: '100%', height: '3px', backgroundColor: '#94A3B8' }}></div>
            <div className="absolute" style={{ top: '20%', left: '40%', width: '3px', height: '60%', backgroundColor: '#94A3B8' }}></div>
            
            {/* Place name */}
            <div className="absolute text-sm text-gray-500" style={{ top: '45%', left: '45%' }}>Benton County</div>
            
            {/* Render markers */}
            {markers.map(marker => (
              <div
                key={marker.id}
                className="absolute rounded-full cursor-pointer transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-all duration-200 hover:z-20"
                style={{
                  top: `${50 - (marker.lat - center.lat) * 1000 * zoom / 10}%`,
                  left: `${50 + (marker.lng - center.lng) * 1000 * zoom / 10}%`,
                  width: `${marker.size}px`,
                  height: `${marker.size}px`,
                  backgroundColor: marker.color,
                  border: marker.id === selectedMarker?.id ? '2px solid white' : 'none',
                  boxShadow: marker.id === selectedMarker?.id ? '0 0 0 2px black' : 'none',
                  zIndex: marker.id === selectedMarker?.id ? 10 : 1
                }}
                onClick={() => handleMarkerClick(marker)}
              >
                <MapPin className="h-3 w-3 text-white" />
              </div>
            ))}
          </div>
          
          {/* Map controls */}
          <div className="absolute top-4 right-4 flex flex-col space-y-2">
            <Button size="sm" variant="secondary" onClick={handleZoomIn}>
              <Plus className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="secondary" onClick={handleZoomOut}>
              <Minus className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="secondary" onClick={handleResetMap}>
              <Home className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Layer controls */}
          <div className="absolute bottom-4 left-4">
            <Button size="sm" variant="secondary">
              <Layers className="h-4 w-4 mr-2" />
              Map Layers
            </Button>
          </div>
        </>
      )}
    </div>
  );
  
  return (
    <div className="w-full h-full bg-background" style={{ height: `${height}px` }}>
      <div className="flex h-full">
        {/* Left sidebar for filters and list */}
        <div className="hidden md:block w-80 border-r overflow-y-auto h-full">
          <div className="p-4 border-b">
            <div className="flex items-center">
              <h3 className="text-lg font-semibold">Properties</h3>
              <span className="ml-2 inline-flex items-center justify-center text-xs h-5 w-5 text-white bg-primary rounded-full">
                {markers.length}
              </span>
            </div>
            
            <div className="relative mt-2">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by address or ID..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {showFilters && (
              <div className="mt-4">
                <div 
                  className="flex items-center justify-between cursor-pointer" 
                  onClick={() => setFilterExpanded(!filterExpanded)}
                >
                  <div className="flex items-center">
                    <Filter className="h-4 w-4 mr-2" />
                    <span className="font-medium">Filters</span>
                  </div>
                  {filterExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </div>
                
                {filterExpanded && (
                  <div className="mt-2 space-y-4">
                    <div>
                      <label className="text-sm text-muted-foreground">Property Type</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <Button 
                          size="sm"
                          variant={selectedPropertyType === null ? "default" : "outline"}
                          onClick={() => setSelectedPropertyType(null)}
                        >
                          All
                        </Button>
                        {propertyTypes.map(type => (
                          <Button
                            key={type}
                            size="sm"
                            variant={selectedPropertyType === type ? "default" : "outline"}
                            onClick={() => setSelectedPropertyType(type)}
                          >
                            {type}
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm text-muted-foreground">Value Range</label>
                      <div className="px-2 pt-6 pb-2">
                        <Slider
                          defaultValue={valueRange}
                          max={1000000}
                          step={10000}
                          onValueChange={(values) => setValueRange(values as [number, number])}
                        />
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>${valueRange[0].toLocaleString()}</span>
                        <span>${valueRange[1].toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setSearchTerm('');
                          setValueRange([0, 1000000]);
                          setSelectedPropertyType(null);
                        }}
                      >
                        Reset Filters
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="divide-y">
            {propertyList.map(marker => (
              <div
                key={marker.id}
                className={`p-3 cursor-pointer hover:bg-slate-50 ${
                  marker.id === selectedMarker?.id ? 'bg-slate-100' : ''
                }`}
                onClick={() => handleMarkerClick(marker)}
              >
                <div className="flex items-start">
                  <div 
                    className="w-3 h-3 mt-1 rounded-full mr-2 flex-shrink-0" 
                    style={{ backgroundColor: marker.color }}
                  ></div>
                  <div>
                    <div className="font-medium">{marker.property.address || `Property #${marker.property.propId}`}</div>
                    <div className="text-xs text-muted-foreground mt-1">ID: {marker.property.propId}</div>
                    <div className="text-xs text-muted-foreground">Type: {marker.property.propertyType || 'Unknown'}</div>
                    <div className="text-sm mt-1">${marker.property.assessedValue?.toLocaleString() || 'Not assessed'}</div>
                  </div>
                </div>
              </div>
            ))}
            
            {propertyList.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                No properties found matching your criteria.
              </div>
            )}
            
            {markers.length > 50 && (
              <div className="p-3 text-center text-xs text-muted-foreground">
                Showing 50 of {markers.length} properties. Use filters to narrow your search.
              </div>
            )}
          </div>
        </div>
        
        {/* Main content area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Mobile search bar - only visible on small screens */}
          <div className="p-4 border-b md:hidden">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by address or ID..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {/* Map view */}
          <div className="flex-1 relative">
            {renderMap()}
            
            {/* Property detail panel */}
            {selectedMarker && (
              <div className="absolute bottom-4 left-4 right-4 md:left-auto md:w-80 bg-white rounded-lg shadow-lg border overflow-hidden max-h-[400px]">
                <div className="flex items-center justify-between p-3 border-b bg-slate-50">
                  <h3 className="font-medium">Property Details</h3>
                  <Button size="sm" variant="ghost" onClick={clearSelectedMarker}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="p-4 overflow-y-auto" style={{ maxHeight: '350px' }}>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm text-muted-foreground">Address</h4>
                      <p className="font-medium">{selectedMarker.property.address || 'No address available'}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm text-muted-foreground">Property ID</h4>
                        <p>{selectedMarker.property.propId}</p>
                      </div>
                      <div>
                        <h4 className="text-sm text-muted-foreground">Type</h4>
                        <p>{selectedMarker.property.propertyType || 'Unknown'}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm text-muted-foreground">Owner</h4>
                      <p>{selectedMarker.property.owner || 'Owner information not available'}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm text-muted-foreground">Assessed Value</h4>
                      <p className="text-lg font-semibold">${selectedMarker.property.assessedValue?.toLocaleString() || 'Not assessed'}</p>
                    </div>
                    
                    {selectedMarker.property.buildingType && (
                      <div>
                        <h4 className="text-sm text-muted-foreground">Building Type</h4>
                        <p>{selectedMarker.property.buildingType}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      {selectedMarker.property.yearBuilt && (
                        <div>
                          <h4 className="text-sm text-muted-foreground">Year Built</h4>
                          <p>{selectedMarker.property.yearBuilt}</p>
                        </div>
                      )}
                      
                      {selectedMarker.property.squareFeet && (
                        <div>
                          <h4 className="text-sm text-muted-foreground">Square Feet</h4>
                          <p>{selectedMarker.property.squareFeet.toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                    
                    {selectedMarker.property.hasAssessmentData ? (
                      <Button className="w-full mt-2">View Full Assessment</Button>
                    ) : (
                      <div className="bg-yellow-50 p-3 rounded-md mt-4">
                        <p className="text-sm text-yellow-800">No detailed assessment data available for this property.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
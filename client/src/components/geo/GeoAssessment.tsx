/**
 * GeoAssessment Component
 * 
 * Provides geospatial visualization and analysis capabilities for property assessment
 * Integrates with property data to display location and geographic context
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Map, MapPin, AlertTriangle, Maximize2, Minimize2, Layers } from 'lucide-react';

interface GeoAssessmentProps {
  propertyId?: number;
  latitude?: number;
  longitude?: number;
  address?: string;
  showFullscreen?: boolean;
}

export function GeoAssessment({
  propertyId,
  latitude = 46.211295, // Default to Benton County coordinates
  longitude = -119.137062,
  address,
  showFullscreen = false
}: GeoAssessmentProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('map');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLayers, setShowLayers] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Simulate loading a map - in a real implementation this would initialize a mapping library
  useEffect(() => {
    // Simulate map loading delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (!mapContainerRef.current) return;
    
    if (!isFullscreen) {
      try {
        if (mapContainerRef.current.requestFullscreen) {
          mapContainerRef.current.requestFullscreen();
          setIsFullscreen(true);
        }
      } catch (err) {
        toast({
          title: "Fullscreen Error",
          description: "Unable to enter fullscreen mode",
          variant: "destructive"
        });
      }
    } else {
      try {
        if (document.exitFullscreen) {
          document.exitFullscreen();
          setIsFullscreen(false);
        }
      } catch (err) {
        // Ignore exit fullscreen errors
      }
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <Card className={`w-full ${isFullscreen ? 'h-screen' : 'h-[500px]'}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>GeoAssessment</CardTitle>
            <CardDescription>
              {address || 'Benton County, Washington'}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {showFullscreen && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={toggleFullscreen}
                className="h-8 w-8 p-0"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
                <span className="sr-only">Toggle fullscreen</span>
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowLayers(!showLayers)}
              className="h-8 w-8 p-0"
            >
              <Layers className="h-4 w-4" />
              <span className="sr-only">Toggle layers</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 relative">
        <Tabs 
          defaultValue="map" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="h-full"
        >
          <div className="px-4 pt-0 border-b">
            <TabsList>
              <TabsTrigger value="map">Map</TabsTrigger>
              <TabsTrigger value="satellite">Satellite</TabsTrigger>
              <TabsTrigger value="3d">3D View</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
            </TabsList>
          </div>
          
          <div 
            ref={mapContainerRef} 
            className={`relative ${isFullscreen ? 'h-[calc(100vh-120px)]' : 'h-[400px]'}`}
          >
            <TabsContent value="map" className="m-0 h-full">
              {isLoading ? (
                <div className="p-6 flex flex-col items-center justify-center h-full">
                  <Skeleton className="w-full h-full" />
                </div>
              ) : (
                <div className="relative h-full bg-[#e6eef2]/30 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Map className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Map visualization would appear here</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}
                      </p>
                      {address && (
                        <p className="text-sm font-medium mt-2">{address}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="satellite" className="m-0 h-full">
              <div className="relative h-full bg-[#1a2530] flex items-center justify-center">
                <div className="text-center">
                  <Map className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Satellite imagery would appear here</p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="3d" className="m-0 h-full">
              <div className="relative h-full bg-[#e6eef2]/30 flex items-center justify-center">
                <div className="text-center">
                  <Map className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">3D visualization would appear here</p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="analysis" className="m-0 h-full">
              <div className="p-6">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Analysis Tools</AlertTitle>
                  <AlertDescription>
                    Geospatial analysis tools are in development and will be available soon.
                  </AlertDescription>
                </Alert>
                
                <div className="mt-6 grid gap-4">
                  <div className="border rounded-md p-4">
                    <h3 className="font-medium mb-2">Proximity Analysis</h3>
                    <p className="text-sm text-muted-foreground">
                      Analyze nearby properties and geographic features
                    </p>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <h3 className="font-medium mb-2">Area Calculation</h3>
                    <p className="text-sm text-muted-foreground">
                      Calculate property area and dimensions
                    </p>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <h3 className="font-medium mb-2">Zoning Analysis</h3>
                    <p className="text-sm text-muted-foreground">
                      View zoning and land use regulations for this property
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {showLayers && (
              <div className="absolute top-2 right-2 bg-card border rounded-md shadow-md p-3 w-48 z-10">
                <h4 className="text-sm font-medium mb-2">Map Layers</h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input type="checkbox" id="parcel-boundaries" className="mr-2" checked readOnly />
                    <label htmlFor="parcel-boundaries" className="text-sm">Parcel Boundaries</label>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="zoning" className="mr-2" checked readOnly />
                    <label htmlFor="zoning" className="text-sm">Zoning</label>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="buildings" className="mr-2" checked readOnly />
                    <label htmlFor="buildings" className="text-sm">Buildings</label>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="flood-zones" className="mr-2" />
                    <label htmlFor="flood-zones" className="text-sm">Flood Zones</label>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="infrastructure" className="mr-2" />
                    <label htmlFor="infrastructure" className="text-sm">Infrastructure</label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default GeoAssessment;
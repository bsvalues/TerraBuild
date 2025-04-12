/**
 * GeoAssessment Page
 * 
 * Provides a full-page interface for the geospatial visualization of property assessments
 * with map-based views, property details, and filtering capabilities.
 */

import React, { useState } from 'react';
import { Link } from 'wouter';
import LayoutWrapper from '@/components/layout/LayoutWrapper';
import MainContent from '@/components/layout/MainContent';
import { GeoAssessment } from '@/components/geo/GeoAssessment';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  Map, 
  Search, 
  BarChart2, 
  Table, 
  Download,
  HelpCircle,
  DownloadCloud
} from 'lucide-react';

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

export default function GeoAssessmentPage() {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [activeView, setActiveView] = useState('map');
  
  // Handle property selection from the map
  const handlePropertySelect = (property: Property) => {
    setSelectedProperty(property);
  };
  
  return (
    <LayoutWrapper>
      <MainContent title="GeoAssessment">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">GeoAssessment</h1>
              <p className="text-muted-foreground">
                Interactive property assessment visualization and analysis
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Link href="/properties">
                <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Property Browser
                </Button>
              </Link>
              
              <Button variant="outline">
                <HelpCircle className="mr-2 h-4 w-4" />
                Help
              </Button>
              
              <Button variant="outline">
                <DownloadCloud className="mr-2 h-4 w-4" />
                Export Data
              </Button>
            </div>
          </div>
          
          <div className="flex w-full gap-4">
            <div className="w-full max-w-md">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search properties by address or ID..." className="pl-8" />
              </div>
            </div>
            
            <div className="flex items-center">
              <Button
                variant={activeView === 'map' ? 'default' : 'outline'}
                className="mr-2"
                onClick={() => setActiveView('map')}
              >
                <Map className="mr-2 h-4 w-4" />
                Map View
              </Button>
              <Button
                variant={activeView === 'table' ? 'default' : 'outline'}
                className="mr-2"
                onClick={() => setActiveView('table')}
              >
                <Table className="mr-2 h-4 w-4" />
                Table View
              </Button>
              <Button
                variant={activeView === 'analytics' ? 'default' : 'outline'}
                onClick={() => setActiveView('analytics')}
              >
                <BarChart2 className="mr-2 h-4 w-4" />
                Analytics
              </Button>
            </div>
          </div>
          
          {activeView === 'map' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Geographic Property Assessment</CardTitle>
                <CardDescription>
                  Interactive map of property assessments in Benton County
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <GeoAssessment 
                  height={700}
                  showFilters={true}
                  onPropertySelect={handlePropertySelect}
                />
              </CardContent>
            </Card>
          )}
          
          {activeView === 'table' && (
            <Card>
              <CardHeader>
                <CardTitle>Property Data Table</CardTitle>
                <CardDescription>
                  Tabular view of property assessment data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Table view will be available in a future update.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setActiveView('map')}
                  >
                    <Map className="mr-2 h-4 w-4" />
                    Switch to Map View
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          {activeView === 'analytics' && (
            <Card>
              <CardHeader>
                <CardTitle>Assessment Analytics</CardTitle>
                <CardDescription>
                  Visual analytics of property assessment data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Analytics view will be available in a future update.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setActiveView('map')}
                  >
                    <Map className="mr-2 h-4 w-4" />
                    Switch to Map View
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          {selectedProperty && (
            <Card className="mt-4">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Selected Property Details</CardTitle>
                    <CardDescription>
                      {selectedProperty.address || `Property #${selectedProperty.propId}`}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedProperty(null)}
                  >
                    Clear Selection
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Property ID</h3>
                    <p className="mt-1">{selectedProperty.propId}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Owner</h3>
                    <p className="mt-1">{selectedProperty.owner || "Unknown"}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Property Type</h3>
                    <p className="mt-1">{selectedProperty.propertyType || "Unknown"}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Assessed Value</h3>
                    <p className="mt-1 text-lg font-semibold">
                      ${selectedProperty.assessedValue?.toLocaleString() || "Not assessed"}
                    </p>
                  </div>
                  
                  {selectedProperty.yearBuilt && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Year Built</h3>
                      <p className="mt-1">{selectedProperty.yearBuilt}</p>
                    </div>
                  )}
                  
                  {selectedProperty.squareFeet && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Square Feet</h3>
                      <p className="mt-1">{selectedProperty.squareFeet.toLocaleString()}</p>
                    </div>
                  )}
                </div>
                
                <div className="mt-6 flex gap-2">
                  <Button>View Full Assessment</Button>
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Download Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </MainContent>
    </LayoutWrapper>
  );
}
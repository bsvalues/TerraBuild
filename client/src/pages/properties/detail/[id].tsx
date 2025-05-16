import React, { useState } from 'react';
import { useParams, Link } from 'wouter';
import { 
  Building, 
  ChevronLeft, 
  Home, 
  MapPin, 
  Tag, 
  Calendar, 
  DollarSign, 
  Clipboard, 
  FileText, 
  BarChart, 
  History, 
  Edit, 
  Printer, 
  Share2, 
  Download, 
  Clock,
  CheckSquare,
  Info,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import PropertyRecordCard from '@/components/properties/PropertyRecordCard';
import SimplePropertyCard from '@/components/properties/SimplePropertyCard';
import BasicPropertyCard from '@/components/properties/BasicPropertyCard';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// Property data - would be fetched from API in a real implementation
const propertyData = {
  "1": {
    id: '1',
    parcelId: 'BC-10032-54',
    address: '1234 Main St',
    city: 'Richland',
    state: 'WA',
    zip: '99352',
    type: 'Residential',
    subType: 'Single Family',
    status: 'Active',
    yearBuilt: 2010,
    squareFeet: 2400,
    bedrooms: 4,
    bathrooms: 2.5,
    lotSize: '0.25 acres',
    region: 'Richland',
    hoodCode: '52100 100',
    township: '10N-28E',
    section: '12',
    owner: 'John & Sarah Smith',
    value: '$485,000',
    landValue: '$105,000',
    improvementValue: '$380,000',
    lastAssessed: '2024-12-10',
    previousValue: '$462,000',
    changePercent: '+5.0%',
    quality: 'Good',
    condition: 'Good',
    features: [
      'Attached Garage',
      'Basement',
      'Deck',
      'Central Air',
      'Fireplace'
    ],
    history: [
      { date: '2024-12-10', value: '$485,000', event: 'Annual Assessment' },
      { date: '2023-12-05', value: '$462,000', event: 'Annual Assessment' },
      { date: '2022-12-12', value: '$425,000', event: 'Annual Assessment' },
      { date: '2021-12-08', value: '$395,000', event: 'Annual Assessment' },
      { date: '2020-12-10', value: '$378,000', event: 'Annual Assessment' }
    ],
    improvements: [
      { id: 'I001', type: 'Main Structure', size: '2400 sq ft', yearBuilt: 2010, value: '$320,000', quality: 'Good', condition: 'Good' },
      { id: 'I002', type: 'Detached Garage', size: '400 sq ft', yearBuilt: 2010, value: '$35,000', quality: 'Good', condition: 'Good' },
      { id: 'I003', type: 'Deck', size: '250 sq ft', yearBuilt: 2015, value: '$25,000', quality: 'Good', condition: 'Good' }
    ],
    calculations: [
      { id: 'C001', date: '2024-12-10', calculatedBy: 'System', value: '$485,000', method: 'Cost Approach', confidence: 'High' },
      { id: 'C002', date: '2023-12-05', calculatedBy: 'M. Johnson', value: '$462,000', method: 'Cost Approach', confidence: 'High' },
      { id: 'C003', date: '2022-12-12', calculatedBy: 'System', value: '$425,000', method: 'Cost Approach', confidence: 'High' }
    ],
    notes: "Property has been well-maintained with regular updates. New deck added in 2015 has been properly assessed. No issues with property access or measurement. Owner has been prompt with all tax payments."
  },
  "2": {
    id: '2',
    parcelId: 'BC-10045-76',
    address: '567 Oak Ave',
    city: 'Kennewick',
    state: 'WA',
    zip: '99336',
    type: 'Commercial',
    subType: 'Retail',
    status: 'Active',
    yearBuilt: 2005,
    squareFeet: 5200,
    bedrooms: 0,
    bathrooms: 2,
    lotSize: '0.75 acres',
    region: 'Kennewick',
    hoodCode: '52100 140',
    township: '8N-29E',
    section: '18',
    owner: 'Oak Avenue Investments LLC',
    value: '$1,250,000',
    landValue: '$350,000',
    improvementValue: '$900,000',
    lastAssessed: '2024-11-15',
    previousValue: '$1,150,000',
    changePercent: '+8.7%',
    quality: 'Excellent',
    condition: 'Good',
    features: [
      'Parking Lot',
      'Store Front',
      'Loading Dock',
      'HVAC System'
    ],
    history: [
      { date: '2024-11-15', value: '$1,250,000', event: 'Annual Assessment' },
      { date: '2023-11-20', value: '$1,150,000', event: 'Annual Assessment' },
      { date: '2022-11-18', value: '$1,050,000', event: 'Annual Assessment' },
      { date: '2021-11-15', value: '$980,000', event: 'Annual Assessment' },
      { date: '2020-11-12', value: '$950,000', event: 'Annual Assessment' }
    ],
    improvements: [
      { id: 'I001', type: 'Main Building', size: '5200 sq ft', yearBuilt: 2005, value: '$850,000', quality: 'Excellent', condition: 'Good' },
      { id: 'I002', type: 'Parking Lot', size: '10000 sq ft', yearBuilt: 2005, value: '$50,000', quality: 'Good', condition: 'Good' }
    ],
    calculations: [
      { id: 'C001', date: '2024-11-15', calculatedBy: 'L. Barnes', value: '$1,250,000', method: 'Income Approach', confidence: 'High' },
      { id: 'C002', date: '2023-11-20', calculatedBy: 'System', value: '$1,150,000', method: 'Income Approach', confidence: 'High' },
      { id: 'C003', date: '2022-11-18', calculatedBy: 'L. Barnes', value: '$1,050,000', method: 'Income Approach', confidence: 'High' }
    ],
    notes: "Commercial retail property with stable rental income. Property has seen steady appreciation due to favorable location and good maintenance. Recent commercial development in surrounding area has positively impacted property value."
  }
};

const PropertyDetail = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("overview");
  const [showRecordCard, setShowRecordCard] = useState(false);
  
  // Get property data based on ID from URL
  const property = propertyData[id as string];
  
  // If property doesn't exist
  if (!property) {
    return (
      <div className="h-full flex items-center justify-center">
        <Card className="bg-blue-900/30 border-blue-800/40 max-w-md mx-auto">
          <CardHeader>
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <CardTitle className="text-center text-blue-100">Property Not Found</CardTitle>
            <CardDescription className="text-center text-blue-300">
              The property you're looking for doesn't exist or has been removed.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Link href="/properties">
              <Button className="bg-blue-700 hover:bg-blue-600">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to Properties
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Format currency value by removing $ and converting to number
  const getCurrentValue = () => {
    return parseInt(property.value.replace('$', '').replace(',', ''));
  };
  
  // Function to calculate property value over time (for chart visualization)
  const getYearlyValues = () => {
    return property.history.map(record => ({
      year: record.date.split('-')[0],
      value: parseInt(record.value.replace('$', '').replace(',', ''))
    })).reverse();
  };
  
  // Function to generate stats for cards
  const getValueChanges = () => {
    const currentValue = getCurrentValue();
    const yearValues = getYearlyValues();
    
    if (yearValues.length < 2) return { oneYear: '0%', fiveYear: '0%' };
    
    const oneYearAgo = yearValues[yearValues.length - 2].value;
    const oneYearChange = ((currentValue - oneYearAgo) / oneYearAgo * 100).toFixed(1);
    
    let fiveYearChange = '0.0';
    if (yearValues.length >= 5) {
      const fiveYearsAgo = yearValues[0].value;
      fiveYearChange = ((currentValue - fiveYearsAgo) / fiveYearsAgo * 100).toFixed(1);
    }
    
    return {
      oneYear: `${oneYearChange}%`,
      fiveYear: `${fiveYearChange}%`
    };
  };
  
  const valueChanges = getValueChanges();
  
  // Return record card if in record card view
  if (showRecordCard && property) {
    return (
      <div className="container mx-auto py-6">
        <BasicPropertyCard property={property} onClose={() => setShowRecordCard(false)} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link href="/properties">
            <Button variant="outline" className="border-blue-700 text-blue-200">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Properties
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-blue-100">{property.address}</h1>
          <Badge 
            variant="outline" 
            className={`
              ${property.type === 'Residential' ? 'border-blue-500 text-blue-300' : ''}
              ${property.type === 'Commercial' ? 'border-cyan-500 text-cyan-300' : ''}
              ${property.type === 'Industrial' ? 'border-indigo-500 text-indigo-300' : ''}
              ${property.type === 'Agricultural' ? 'border-emerald-500 text-emerald-300' : ''}
            `}
          >
            {property.type}
          </Badge>
        </div>
        <div className="flex gap-2 flex-wrap md:flex-nowrap">
          <Button variant="outline" className="border-blue-700 text-blue-200">
            <Edit className="mr-2 h-4 w-4" />
            Edit Property
          </Button>
          <Button 
            variant="outline" 
            className="border-blue-700 text-blue-200"
            onClick={() => setShowRecordCard(true)}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Record Card
          </Button>
          <Button className="bg-blue-700 hover:bg-blue-600">
            <FileText className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-blue-900/30 border-blue-800/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-blue-100">Current Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-100">{property.value}</div>
            <div className="text-blue-300 text-sm flex items-center mt-1">
              <Calendar className="h-3 w-3 mr-1" />
              Last assessed: {property.lastAssessed}
            </div>
            <div className="mt-2 flex items-center text-sm">
              <Badge className={property.changePercent.startsWith('+') ? 'bg-emerald-700/50 text-emerald-200' : 'bg-red-700/50 text-red-200'}>
                {property.changePercent} from previous
              </Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-blue-900/30 border-blue-800/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-blue-100">Land Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-100">{property.landValue}</div>
            <div className="text-blue-300 text-sm flex items-center mt-1">
              <Info className="h-3 w-3 mr-1" />
              {property.lotSize}
            </div>
            <div className="mt-2 text-sm text-blue-300">
              {((parseInt(property.landValue.replace('$', '').replace(',', '')) / getCurrentValue()) * 100).toFixed(1)}% of total value
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-blue-900/30 border-blue-800/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-blue-100">Improvement Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-100">{property.improvementValue}</div>
            <div className="text-blue-300 text-sm flex items-center mt-1">
              <Building className="h-3 w-3 mr-1" />
              {property.squareFeet} sq ft, built {property.yearBuilt}
            </div>
            <div className="mt-2 text-sm text-blue-300">
              {((parseInt(property.improvementValue.replace('$', '').replace(',', '')) / getCurrentValue()) * 100).toFixed(1)}% of total value
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-blue-900/50 border border-blue-800/40">
          <TabsTrigger 
            value="overview" 
            className="data-[state=active]:bg-blue-800/50"
          >
            <Info className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="features" 
            className="data-[state=active]:bg-blue-800/50"
          >
            <CheckSquare className="h-4 w-4 mr-2" />
            Features & Attributes
          </TabsTrigger>
          <TabsTrigger 
            value="valuation" 
            className="data-[state=active]:bg-blue-800/50"
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Valuation History
          </TabsTrigger>
          <TabsTrigger 
            value="improvements" 
            className="data-[state=active]:bg-blue-800/50"
          >
            <Building className="h-4 w-4 mr-2" />
            Improvements
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Card className="bg-blue-900/30 border-blue-800/40">
            <CardHeader>
              <CardTitle className="text-blue-100">Property Details</CardTitle>
              <CardDescription className="text-blue-300">
                Key information about this {property.type.toLowerCase()} property
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-blue-100 font-medium mb-2">Identification</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between border-b border-blue-800/40 pb-1">
                        <span className="text-blue-300">Parcel ID</span>
                        <span className="text-blue-100 font-mono">{property.parcelId}</span>
                      </div>
                      <div className="flex justify-between border-b border-blue-800/40 pb-1">
                        <span className="text-blue-300">Address</span>
                        <span className="text-blue-100">{property.address}</span>
                      </div>
                      <div className="flex justify-between border-b border-blue-800/40 pb-1">
                        <span className="text-blue-300">City, State, Zip</span>
                        <span className="text-blue-100">{property.city}, {property.state} {property.zip}</span>
                      </div>
                      <div className="flex justify-between border-b border-blue-800/40 pb-1">
                        <span className="text-blue-300">Region</span>
                        <span className="text-blue-100">{property.region}</span>
                      </div>
                      <div className="flex justify-between border-b border-blue-800/40 pb-1">
                        <span className="text-blue-300">Hood Code</span>
                        <span className="text-blue-100">{property.hoodCode}</span>
                      </div>
                      <div className="flex justify-between border-b border-blue-800/40 pb-1">
                        <span className="text-blue-300">Township/Range</span>
                        <span className="text-blue-100">{property.township}, Section {property.section}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-blue-100 font-medium mb-2">Property Characteristics</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between border-b border-blue-800/40 pb-1">
                        <span className="text-blue-300">Type</span>
                        <span className="text-blue-100">{property.type} ({property.subType})</span>
                      </div>
                      <div className="flex justify-between border-b border-blue-800/40 pb-1">
                        <span className="text-blue-300">Year Built</span>
                        <span className="text-blue-100">{property.yearBuilt}</span>
                      </div>
                      <div className="flex justify-between border-b border-blue-800/40 pb-1">
                        <span className="text-blue-300">Square Footage</span>
                        <span className="text-blue-100">{property.squareFeet.toLocaleString()} sq ft</span>
                      </div>
                      {property.type === 'Residential' && (
                        <>
                          <div className="flex justify-between border-b border-blue-800/40 pb-1">
                            <span className="text-blue-300">Bedrooms</span>
                            <span className="text-blue-100">{property.bedrooms}</span>
                          </div>
                          <div className="flex justify-between border-b border-blue-800/40 pb-1">
                            <span className="text-blue-300">Bathrooms</span>
                            <span className="text-blue-100">{property.bathrooms}</span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between border-b border-blue-800/40 pb-1">
                        <span className="text-blue-300">Lot Size</span>
                        <span className="text-blue-100">{property.lotSize}</span>
                      </div>
                      <div className="flex justify-between border-b border-blue-800/40 pb-1">
                        <span className="text-blue-300">Quality</span>
                        <span className="text-blue-100">{property.quality}</span>
                      </div>
                      <div className="flex justify-between border-b border-blue-800/40 pb-1">
                        <span className="text-blue-300">Condition</span>
                        <span className="text-blue-100">{property.condition}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-blue-100 font-medium mb-2">Ownership</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between border-b border-blue-800/40 pb-1">
                        <span className="text-blue-300">Current Owner</span>
                        <span className="text-blue-100">{property.owner}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-blue-100 font-medium mb-2">Valuation Summary</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between border-b border-blue-800/40 pb-1">
                        <span className="text-blue-300">Current Value</span>
                        <span className="text-blue-100">{property.value}</span>
                      </div>
                      <div className="flex justify-between border-b border-blue-800/40 pb-1">
                        <span className="text-blue-300">Land Value</span>
                        <span className="text-blue-100">{property.landValue}</span>
                      </div>
                      <div className="flex justify-between border-b border-blue-800/40 pb-1">
                        <span className="text-blue-300">Improvement Value</span>
                        <span className="text-blue-100">{property.improvementValue}</span>
                      </div>
                      <div className="flex justify-between border-b border-blue-800/40 pb-1">
                        <span className="text-blue-300">Previous Value</span>
                        <span className="text-blue-100">{property.previousValue}</span>
                      </div>
                      <div className="flex justify-between border-b border-blue-800/40 pb-1">
                        <span className="text-blue-300">1-Year Change</span>
                        <span className={valueChanges.oneYear.startsWith('-') ? 'text-red-300' : 'text-emerald-300'}>
                          {valueChanges.oneYear}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-blue-800/40 pb-1">
                        <span className="text-blue-300">5-Year Change</span>
                        <span className={valueChanges.fiveYear.startsWith('-') ? 'text-red-300' : 'text-emerald-300'}>
                          {valueChanges.fiveYear}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-blue-800/40 pb-1">
                        <span className="text-blue-300">Last Assessed</span>
                        <span className="text-blue-100">{property.lastAssessed}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-blue-100 font-medium mb-2">Notes</h3>
                    <div className="bg-blue-900/20 p-3 rounded-md border border-blue-800/40">
                      <p className="text-blue-200 text-sm">{property.notes}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-blue-900/30 border-blue-800/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-blue-100">Location</CardTitle>
              </CardHeader>
              <CardContent className="h-[250px] flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="h-12 w-12 text-blue-700/40 mx-auto mb-2" />
                  <p className="text-blue-200">Interactive map would appear here</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-blue-900/30 border-blue-800/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-blue-100">Value History</CardTitle>
              </CardHeader>
              <CardContent className="h-[250px] flex items-center justify-center">
                <div className="text-center">
                  <BarChart className="h-12 w-12 text-blue-700/40 mx-auto mb-2" />
                  <p className="text-blue-200">Value history chart would appear here</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="features" className="space-y-4">
          <Card className="bg-blue-900/30 border-blue-800/40">
            <CardHeader>
              <CardTitle className="text-blue-100">Features & Attributes</CardTitle>
              <CardDescription className="text-blue-300">
                Detailed features and characteristics of this property
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-blue-100 font-medium mb-3">Property Features</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {property.features.map((feature, index) => (
                      <div key={index} className="bg-blue-900/20 border border-blue-800/40 rounded-md p-2 flex items-center">
                        <CheckSquare className="h-4 w-4 text-blue-400 mr-2" />
                        <span className="text-blue-200">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Separator className="bg-blue-800/40" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-blue-100 font-medium mb-3">Basic Information</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between border-b border-blue-800/40 pb-1">
                        <span className="text-blue-300">Property Type</span>
                        <span className="text-blue-100">{property.type}</span>
                      </div>
                      <div className="flex justify-between border-b border-blue-800/40 pb-1">
                        <span className="text-blue-300">Sub Type</span>
                        <span className="text-blue-100">{property.subType}</span>
                      </div>
                      <div className="flex justify-between border-b border-blue-800/40 pb-1">
                        <span className="text-blue-300">Year Built</span>
                        <span className="text-blue-100">{property.yearBuilt}</span>
                      </div>
                      <div className="flex justify-between border-b border-blue-800/40 pb-1">
                        <span className="text-blue-300">Building Size</span>
                        <span className="text-blue-100">{property.squareFeet.toLocaleString()} sq ft</span>
                      </div>
                      <div className="flex justify-between border-b border-blue-800/40 pb-1">
                        <span className="text-blue-300">Lot Size</span>
                        <span className="text-blue-100">{property.lotSize}</span>
                      </div>
                      <div className="flex justify-between border-b border-blue-800/40 pb-1">
                        <span className="text-blue-300">Quality Grade</span>
                        <span className="text-blue-100">{property.quality}</span>
                      </div>
                      <div className="flex justify-between border-b border-blue-800/40 pb-1">
                        <span className="text-blue-300">Condition</span>
                        <span className="text-blue-100">{property.condition}</span>
                      </div>
                    </div>
                  </div>
                  
                  {property.type === 'Residential' && (
                    <div>
                      <h3 className="text-blue-100 font-medium mb-3">Residential Details</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between border-b border-blue-800/40 pb-1">
                          <span className="text-blue-300">Bedrooms</span>
                          <span className="text-blue-100">{property.bedrooms}</span>
                        </div>
                        <div className="flex justify-between border-b border-blue-800/40 pb-1">
                          <span className="text-blue-300">Bathrooms</span>
                          <span className="text-blue-100">{property.bathrooms}</span>
                        </div>
                        <div className="flex justify-between border-b border-blue-800/40 pb-1">
                          <span className="text-blue-300">Garage</span>
                          <span className="text-blue-100">Yes (Attached)</span>
                        </div>
                        <div className="flex justify-between border-b border-blue-800/40 pb-1">
                          <span className="text-blue-300">Basement</span>
                          <span className="text-blue-100">Yes (Finished)</span>
                        </div>
                        <div className="flex justify-between border-b border-blue-800/40 pb-1">
                          <span className="text-blue-300">Stories</span>
                          <span className="text-blue-100">2</span>
                        </div>
                        <div className="flex justify-between border-b border-blue-800/40 pb-1">
                          <span className="text-blue-300">Foundation Type</span>
                          <span className="text-blue-100">Concrete Slab</span>
                        </div>
                        <div className="flex justify-between border-b border-blue-800/40 pb-1">
                          <span className="text-blue-300">Heating/Cooling</span>
                          <span className="text-blue-100">Central Air</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {property.type === 'Commercial' && (
                    <div>
                      <h3 className="text-blue-100 font-medium mb-3">Commercial Details</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between border-b border-blue-800/40 pb-1">
                          <span className="text-blue-300">Zoning</span>
                          <span className="text-blue-100">C-3 (General Commercial)</span>
                        </div>
                        <div className="flex justify-between border-b border-blue-800/40 pb-1">
                          <span className="text-blue-300">Parking Spaces</span>
                          <span className="text-blue-100">32</span>
                        </div>
                        <div className="flex justify-between border-b border-blue-800/40 pb-1">
                          <span className="text-blue-300">Loading Docks</span>
                          <span className="text-blue-100">1</span>
                        </div>
                        <div className="flex justify-between border-b border-blue-800/40 pb-1">
                          <span className="text-blue-300">Stories</span>
                          <span className="text-blue-100">1</span>
                        </div>
                        <div className="flex justify-between border-b border-blue-800/40 pb-1">
                          <span className="text-blue-300">Ceiling Height</span>
                          <span className="text-blue-100">12 feet</span>
                        </div>
                        <div className="flex justify-between border-b border-blue-800/40 pb-1">
                          <span className="text-blue-300">Construction Type</span>
                          <span className="text-blue-100">Steel Frame</span>
                        </div>
                        <div className="flex justify-between border-b border-blue-800/40 pb-1">
                          <span className="text-blue-300">Current Use</span>
                          <span className="text-blue-100">Retail</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <Separator className="bg-blue-800/40" />
                
                <div>
                  <h3 className="text-blue-100 font-medium mb-3">Geographic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="space-y-2">
                        <div className="flex justify-between border-b border-blue-800/40 pb-1">
                          <span className="text-blue-300">County</span>
                          <span className="text-blue-100">Benton</span>
                        </div>
                        <div className="flex justify-between border-b border-blue-800/40 pb-1">
                          <span className="text-blue-300">City</span>
                          <span className="text-blue-100">{property.city}</span>
                        </div>
                        <div className="flex justify-between border-b border-blue-800/40 pb-1">
                          <span className="text-blue-300">Zip Code</span>
                          <span className="text-blue-100">{property.zip}</span>
                        </div>
                        <div className="flex justify-between border-b border-blue-800/40 pb-1">
                          <span className="text-blue-300">Region</span>
                          <span className="text-blue-100">{property.region}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="space-y-2">
                        <div className="flex justify-between border-b border-blue-800/40 pb-1">
                          <span className="text-blue-300">Hood Code</span>
                          <span className="text-blue-100">{property.hoodCode}</span>
                        </div>
                        <div className="flex justify-between border-b border-blue-800/40 pb-1">
                          <span className="text-blue-300">Township/Range</span>
                          <span className="text-blue-100">{property.township}</span>
                        </div>
                        <div className="flex justify-between border-b border-blue-800/40 pb-1">
                          <span className="text-blue-300">Section</span>
                          <span className="text-blue-100">{property.section}</span>
                        </div>
                        <div className="flex justify-between border-b border-blue-800/40 pb-1">
                          <span className="text-blue-300">School District</span>
                          <span className="text-blue-100">{property.city} School District</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="valuation" className="space-y-4">
          <Card className="bg-blue-900/30 border-blue-800/40">
            <CardHeader>
              <CardTitle className="text-blue-100">Valuation History</CardTitle>
              <CardDescription className="text-blue-300">
                Historical property valuations and assessment records
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-blue-100 font-medium mb-3">Value Trend</h3>
                    <div className="h-[200px] flex items-center justify-center bg-blue-900/20 rounded-md border border-blue-800/40">
                      <div className="text-center">
                        <BarChart className="h-12 w-12 text-blue-700/40 mx-auto mb-2" />
                        <p className="text-blue-200">Value trend chart would appear here</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-blue-100 font-medium mb-3">Summary Statistics</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between border-b border-blue-800/40 pb-1">
                        <span className="text-blue-300">Current Value</span>
                        <span className="text-blue-100">{property.value}</span>
                      </div>
                      <div className="flex justify-between border-b border-blue-800/40 pb-1">
                        <span className="text-blue-300">Last Year Value</span>
                        <span className="text-blue-100">{property.previousValue}</span>
                      </div>
                      <div className="flex justify-between border-b border-blue-800/40 pb-1">
                        <span className="text-blue-300">1-Year Change</span>
                        <span className={valueChanges.oneYear.startsWith('-') ? 'text-red-300' : 'text-emerald-300'}>
                          {valueChanges.oneYear}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-blue-800/40 pb-1">
                        <span className="text-blue-300">5-Year Change</span>
                        <span className={valueChanges.fiveYear.startsWith('-') ? 'text-red-300' : 'text-emerald-300'}>
                          {valueChanges.fiveYear}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-blue-800/40 pb-1">
                        <span className="text-blue-300">Average Annual Change</span>
                        <span className="text-blue-100">
                          +{((Math.pow((getCurrentValue() / parseInt(getYearlyValues()[0].value)), 1/5) - 1) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-blue-800/40 pb-1">
                        <span className="text-blue-300">Last Assessed</span>
                        <span className="text-blue-100">{property.lastAssessed}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Separator className="bg-blue-800/40" />
                
                <div>
                  <h3 className="text-blue-100 font-medium mb-3">Historical Assessments</h3>
                  <div className="rounded-md border border-blue-800/40 overflow-hidden">
                    <Table>
                      <TableHeader className="bg-blue-900/50">
                        <TableRow className="hover:bg-blue-900/60 border-blue-800/60">
                          <TableHead className="text-blue-300">Date</TableHead>
                          <TableHead className="text-blue-300">Value</TableHead>
                          <TableHead className="text-blue-300">Change</TableHead>
                          <TableHead className="text-blue-300">Event</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {property.history.map((item, index) => {
                          const prevValue = index < property.history.length - 1 
                            ? parseInt(property.history[index + 1].value.replace('$', '').replace(',', ''))
                            : parseInt(item.value.replace('$', '').replace(',', ''));
                          const currentValue = parseInt(item.value.replace('$', '').replace(',', ''));
                          const change = ((currentValue - prevValue) / prevValue) * 100;
                          const changeText = index < property.history.length - 1 
                            ? `${change > 0 ? '+' : ''}${change.toFixed(1)}%` 
                            : 'Initial';
                          
                          return (
                            <TableRow key={index} className="hover:bg-blue-900/30 border-blue-800/40">
                              <TableCell className="text-blue-200">{item.date}</TableCell>
                              <TableCell className="text-blue-100">{item.value}</TableCell>
                              <TableCell className={`
                                ${change > 0 ? 'text-emerald-300' : ''} 
                                ${change < 0 ? 'text-red-300' : ''}
                                ${index === property.history.length - 1 ? 'text-blue-300' : ''}
                              `}>
                                {changeText}
                              </TableCell>
                              <TableCell className="text-blue-200">{item.event}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                
                <Separator className="bg-blue-800/40" />
                
                <div>
                  <h3 className="text-blue-100 font-medium mb-3">Calculation History</h3>
                  <div className="rounded-md border border-blue-800/40 overflow-hidden">
                    <Table>
                      <TableHeader className="bg-blue-900/50">
                        <TableRow className="hover:bg-blue-900/60 border-blue-800/60">
                          <TableHead className="text-blue-300">Calculation ID</TableHead>
                          <TableHead className="text-blue-300">Date</TableHead>
                          <TableHead className="text-blue-300">Value</TableHead>
                          <TableHead className="text-blue-300">Method</TableHead>
                          <TableHead className="text-blue-300">Calculated By</TableHead>
                          <TableHead className="text-blue-300">Confidence</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {property.calculations.map((calc, index) => (
                          <TableRow key={index} className="hover:bg-blue-900/30 border-blue-800/40">
                            <TableCell className="font-mono text-blue-200">{calc.id}</TableCell>
                            <TableCell className="text-blue-200">{calc.date}</TableCell>
                            <TableCell className="text-blue-100">{calc.value}</TableCell>
                            <TableCell className="text-blue-200">{calc.method}</TableCell>
                            <TableCell className="text-blue-200">{calc.calculatedBy}</TableCell>
                            <TableCell>
                              <Badge className={`
                                ${calc.confidence === 'High' ? 'bg-emerald-600/50 text-emerald-200' : ''}
                                ${calc.confidence === 'Medium' ? 'bg-amber-600/50 text-amber-200' : ''}
                                ${calc.confidence === 'Low' ? 'bg-red-600/50 text-red-200' : ''}
                              `}>
                                {calc.confidence}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button className="bg-blue-700 hover:bg-blue-600">
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Valuation Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="improvements" className="space-y-4">
          <Card className="bg-blue-900/30 border-blue-800/40">
            <CardHeader>
              <CardTitle className="text-blue-100">Property Improvements</CardTitle>
              <CardDescription className="text-blue-300">
                Details of structures and improvements on this property
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-blue-100 font-medium mb-3">Improvement Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-blue-900/50 border-blue-800/40">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-blue-100 text-base">Total Improvements</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-blue-100">{property.improvements.length}</div>
                        <div className="text-sm text-blue-300">Primary and secondary structures</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-blue-900/50 border-blue-800/40">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-blue-100 text-base">Total Value</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-blue-100">{property.improvementValue}</div>
                        <div className="text-sm text-blue-300">Combined improvement value</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-blue-900/50 border-blue-800/40">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-blue-100 text-base">Primary Structure</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-blue-100">{property.yearBuilt}</div>
                        <div className="text-sm text-blue-300">Year built</div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
                
                <Separator className="bg-blue-800/40" />
                
                <div>
                  <h3 className="text-blue-100 font-medium mb-3">Improvement Details</h3>
                  <div className="rounded-md border border-blue-800/40 overflow-hidden">
                    <Table>
                      <TableHeader className="bg-blue-900/50">
                        <TableRow className="hover:bg-blue-900/60 border-blue-800/60">
                          <TableHead className="text-blue-300">ID</TableHead>
                          <TableHead className="text-blue-300">Type</TableHead>
                          <TableHead className="text-blue-300">Size</TableHead>
                          <TableHead className="text-blue-300">Year Built</TableHead>
                          <TableHead className="text-blue-300">Value</TableHead>
                          <TableHead className="text-blue-300">Quality</TableHead>
                          <TableHead className="text-blue-300">Condition</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {property.improvements.map((improvement, index) => (
                          <TableRow key={index} className="hover:bg-blue-900/30 border-blue-800/40">
                            <TableCell className="font-mono text-blue-200">{improvement.id}</TableCell>
                            <TableCell className="text-blue-100">{improvement.type}</TableCell>
                            <TableCell className="text-blue-200">{improvement.size}</TableCell>
                            <TableCell className="text-blue-200">{improvement.yearBuilt}</TableCell>
                            <TableCell className="text-blue-100">{improvement.value}</TableCell>
                            <TableCell className="text-blue-200">{improvement.quality}</TableCell>
                            <TableCell className="text-blue-200">{improvement.condition}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                
                <div className="bg-blue-900/20 p-4 rounded-md border border-blue-800/40">
                  <div className="flex items-start">
                    <Clock className="h-5 w-5 text-blue-400 mr-2 mt-0.5" />
                    <div>
                      <h3 className="text-blue-100 font-medium">Improvement History</h3>
                      <p className="text-blue-300 text-sm mt-1">
                        This property has had the following major improvements recorded:
                      </p>
                      <ul className="list-disc list-inside mt-2 space-y-1 text-blue-200 text-sm">
                        <li>Original construction: {property.yearBuilt}</li>
                        {property.id === '1' && (
                          <>
                            <li>Deck addition: 2015</li>
                            <li>Basement renovation: 2018</li>
                            <li>Kitchen remodel: 2022</li>
                          </>
                        )}
                        {property.id === '2' && (
                          <>
                            <li>HVAC System Upgrade: 2015</li>
                            <li>Storefront Renovation: 2018</li>
                            <li>Parking Lot Resurfacing: 2022</li>
                          </>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-between">
        <Button variant="outline" className="border-blue-700 text-blue-200">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous Property
        </Button>
        <Button variant="outline" className="border-blue-700 text-blue-200">
          Next Property
          <ChevronLeft className="ml-2 h-4 w-4 rotate-180" />
        </Button>
      </div>
    </div>
  );
};

export default PropertyDetail;
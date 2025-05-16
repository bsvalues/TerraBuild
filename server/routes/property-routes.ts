import { Router } from 'express';
import { z } from 'zod';
import { isAuthenticated } from '../replitAuth';

// Create router
const router = Router();

// Sample property data (would come from database in a real implementation)
const sampleProperties = [
  {
    id: "P10055732",
    address: "152 Meadow Hills Dr",
    city: "Richland",
    region: "52100 100",
    parcelNumber: "1-1234-567-890-0001",
    type: "Residential",
    yearBuilt: 2010,
    squareFeet: 2300,
    value: 425000,
    lastUpdated: "2025-02-15",
    coordinates: [46.2854, -119.2945],
    features: ["3BR", "2BA", "Garage", "Basement"]
  },
  {
    id: "P10055148",
    address: "2187 Riverfront Way",
    city: "Richland",
    region: "52100 100",
    parcelNumber: "1-1234-567-891-0002",
    type: "Residential",
    yearBuilt: 2015,
    squareFeet: 3100,
    value: 682000,
    lastUpdated: "2025-02-28",
    coordinates: [46.2932, -119.2721],
    features: ["4BR", "3BA", "3-Car Garage", "Waterfront"]
  },
  {
    id: "P10056344",
    address: "845 Columbia Point Dr",
    city: "Richland",
    region: "52100 100",
    parcelNumber: "1-1234-567-892-0003",
    type: "Residential",
    yearBuilt: 2012,
    squareFeet: 2800,
    value: 578300,
    lastUpdated: "2025-03-05",
    coordinates: [46.2655, -119.2591],
    features: ["4BR", "2.5BA", "Garage", "Pool"]
  },
  {
    id: "C10023187",
    address: "12400 Tapteal Dr",
    city: "Richland",
    region: "52100 100",
    parcelNumber: "1-1234-567-893-0004",
    type: "Commercial",
    yearBuilt: 2005,
    squareFeet: 12500,
    value: 1876000,
    lastUpdated: "2025-01-22",
    coordinates: [46.2701, -119.3017],
    features: ["Retail", "Office Space", "Parking Lot"]
  },
  {
    id: "P10058921",
    address: "3315 Westlake Dr",
    city: "Kennewick",
    region: "52100 140",
    parcelNumber: "1-1234-567-894-0005",
    type: "Residential",
    yearBuilt: 2018,
    squareFeet: 2100,
    value: 395000,
    lastUpdated: "2025-03-12",
    coordinates: [46.2012, -119.1834],
    features: ["3BR", "2BA", "Garage"]
  },
  {
    id: "P10060125",
    address: "1650 George Washington Way",
    city: "Richland",
    region: "52100 100",
    parcelNumber: "1-1234-567-895-0006",
    type: "Residential",
    yearBuilt: 1992,
    squareFeet: 1850,
    value: 342000,
    lastUpdated: "2025-03-18",
    coordinates: [46.2787, -119.2764],
    features: ["3BR", "1.5BA", "Carport"]
  },
  {
    id: "C10025468",
    address: "4850 Paradise Way",
    city: "West Richland",
    region: "52100 160",
    parcelNumber: "1-1234-567-896-0007",
    type: "Commercial",
    yearBuilt: 2008,
    squareFeet: 8500,
    value: 1240000,
    lastUpdated: "2025-02-10",
    coordinates: [46.2924, -119.3912],
    features: ["Office Space", "Warehouse", "Loading Dock"]
  },
  {
    id: "P10061547",
    address: "710 Swift Blvd",
    city: "Richland",
    region: "52100 100",
    parcelNumber: "1-1234-567-897-0008",
    type: "Residential",
    yearBuilt: 1985,
    squareFeet: 1650,
    value: 298000,
    lastUpdated: "2025-03-20",
    coordinates: [46.2818, -119.2814],
    features: ["2BR", "1BA", "Garage"]
  },
  {
    id: "I10012385",
    address: "2555 Stevens Dr",
    city: "Richland",
    region: "52100 100",
    parcelNumber: "1-1234-567-898-0009",
    type: "Industrial",
    yearBuilt: 2001,
    squareFeet: 25000,
    value: 3250000,
    lastUpdated: "2025-01-15",
    coordinates: [46.2567, -119.2832],
    features: ["Manufacturing", "Office Space", "Storage"]
  },
  {
    id: "P10062890",
    address: "1815 W 4th Ave",
    city: "Kennewick",
    region: "52100 140",
    parcelNumber: "1-1234-567-899-0010",
    type: "Residential",
    yearBuilt: 2010,
    squareFeet: 1950,
    value: 372000,
    lastUpdated: "2025-03-08",
    coordinates: [46.2103, -119.1567],
    features: ["3BR", "2BA", "Garage"]
  }
];

// Sample region data
const regionData = [
  {
    id: "richland",
    name: "Richland",
    code: "52100 100",
    township: "10N-28E",
    propertyCount: 12485,
    averageValue: 425600,
    valuationFactor: 1.15
  },
  {
    id: "kennewick",
    name: "Kennewick",
    code: "52100 140",
    township: "08N-29E",
    propertyCount: 16750,
    averageValue: 392100,
    valuationFactor: 1.08
  },
  {
    id: "west_richland",
    name: "West Richland",
    code: "52100 160",
    township: "09N-27E",
    propertyCount: 6320,
    averageValue: 447300,
    valuationFactor: 1.21
  }
];

// Get all regions
router.get('/regions', isAuthenticated, (req, res) => {
  res.json({ regions: regionData });
});

// Get region by ID
router.get('/regions/:id', isAuthenticated, (req, res) => {
  const { id } = req.params;
  
  const region = regionData.find(r => r.id === id);
  
  if (!region) {
    return res.status(404).json({ message: 'Region not found' });
  }
  
  res.json({ region });
});

// Get properties
router.get('/properties', isAuthenticated, (req, res) => {
  // Schema for query parameters
  const querySchema = z.object({
    search: z.string().optional(),
    region: z.string().optional(),
    type: z.string().optional(),
    minValue: z.string().optional(),
    maxValue: z.string().optional(),
    limit: z.string().optional(),
    page: z.string().optional()
  });
  
  // Parse and validate query parameters
  const result = querySchema.safeParse(req.query);
  
  if (!result.success) {
    return res.status(400).json({ message: 'Invalid query parameters' });
  }
  
  // Convert to the right types
  const { 
    search, 
    region, 
    type, 
    minValue, 
    maxValue, 
    limit = '10', 
    page = '1' 
  } = result.data;
  
  // Parse numerical values
  const limitNum = parseInt(limit);
  const pageNum = parseInt(page);
  const minValueNum = minValue ? parseInt(minValue) : undefined;
  const maxValueNum = maxValue ? parseInt(maxValue) : undefined;
  
  // Apply filters
  let filteredProperties = [...sampleProperties];
  
  if (search) {
    const searchLower = search.toLowerCase();
    filteredProperties = filteredProperties.filter(p => 
      p.id.toLowerCase().includes(searchLower) ||
      p.address.toLowerCase().includes(searchLower) ||
      p.parcelNumber.toLowerCase().includes(searchLower)
    );
  }
  
  if (region) {
    filteredProperties = filteredProperties.filter(p => p.region === region);
  }
  
  if (type) {
    filteredProperties = filteredProperties.filter(p => p.type.toLowerCase() === type.toLowerCase());
  }
  
  if (minValueNum !== undefined) {
    filteredProperties = filteredProperties.filter(p => p.value >= minValueNum);
  }
  
  if (maxValueNum !== undefined) {
    filteredProperties = filteredProperties.filter(p => p.value <= maxValueNum);
  }
  
  // Calculate pagination
  const totalCount = filteredProperties.length;
  const totalPages = Math.ceil(totalCount / limitNum);
  const startIndex = (pageNum - 1) * limitNum;
  const endIndex = startIndex + limitNum;
  
  // Get the properties for the current page
  const paginatedProperties = filteredProperties.slice(startIndex, endIndex);
  
  res.json({
    properties: paginatedProperties,
    pagination: {
      totalCount,
      totalPages,
      currentPage: pageNum,
      limit: limitNum
    }
  });
});

// Get property by ID
router.get('/properties/:id', isAuthenticated, (req, res) => {
  const { id } = req.params;
  
  const property = sampleProperties.find(p => p.id === id);
  
  if (!property) {
    return res.status(404).json({ message: 'Property not found' });
  }
  
  res.json({ property });
});

// Get property history (valuations)
router.get('/properties/:id/history', isAuthenticated, (req, res) => {
  const { id } = req.params;
  
  // Check if property exists
  const property = sampleProperties.find(p => p.id === id);
  
  if (!property) {
    return res.status(404).json({ message: 'Property not found' });
  }
  
  // Generate sample historical valuations
  const currentYear = new Date().getFullYear();
  const history = [];
  
  let baseValue = Math.round(property.value * 0.85); // Start at 85% of current value
  
  for (let year = currentYear - 5; year <= currentYear; year++) {
    const valuationDate = `${year}-${Math.floor(Math.random() * 12) + 1}-${Math.floor(Math.random() * 28) + 1}`;
    
    history.push({
      id: `V${property.id.substring(1)}-${year}`,
      propertyId: property.id,
      value: baseValue,
      valuationDate,
      notes: year === currentYear ? 'Current valuation' : `Annual assessment for ${year}`
    });
    
    // Increase by 3-7% each year
    baseValue = Math.round(baseValue * (1 + (0.03 + (Math.random() * 0.04))));
  }
  
  res.json({ history });
});

export default router;
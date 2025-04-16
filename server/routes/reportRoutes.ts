/**
 * Report Routes for the BCBS Application
 * 
 * These routes handle report fetching and management.
 */
import { Router, Request, Response } from 'express';
import storage from '../storage';

// Demo reports data for the MVP
const demoReports = [
  {
    id: 1,
    title: "Annual Property Assessment Report - 2025",
    description: "Comprehensive assessment of property values in East Benton region for 2025, including historical trending and market analysis.",
    report_type: "assessment",
    created_at: "2025-03-15T14:30:00Z",
    is_public: true,
    content: {
      property: {
        address: "1234 Vineyard Way",
        parcel_id: "B-12345-6789",
        city: "Kennewick",
        county: "Benton",
        state: "Washington",
        building_type: "R1",
        year_built: 2010,
        square_feet: 2450
      },
      assessor: {
        name: "Sarah Johnson",
        department: "Benton County Assessor's Office",
        contact: "sjohnson@bentoncounty.gov"
      },
      assessment: {
        date: "2025-02-28T09:00:00Z",
        land_value: 120000,
        improvement_value: 330000,
        total_value: 450000,
        previous_value: 425000,
        change_percent: 5.88
      },
      charts: {
        cost_breakdown: [
          { name: 'Structure', value: 285000 },
          { name: 'Land', value: 120000 },
          { name: 'Improvements', value: 35000 },
          { name: 'Features', value: 10000 }
        ],
        historical_values: [
          { year: 2020, value: 375000 },
          { year: 2021, value: 390000 },
          { year: 2022, value: 400000 },
          { year: 2023, value: 415000 },
          { year: 2024, value: 425000 },
          { year: 2025, value: 450000 }
        ],
        comparable_properties: [
          { name: 'Subject Property', value: 450000 },
          { name: 'Comp 1', value: 442000 },
          { name: 'Comp 2', value: 465000 },
          { name: 'Comp 3', value: 428000 },
          { name: 'Neighborhood Avg', value: 440000 }
        ]
      },
      notes: "This property has seen consistent appreciation over the past 5 years, with a slight acceleration in 2025 due to the new community developments nearby. The vineyard view and recent kitchen remodel have contributed significantly to the value increase. The property remains in good condition overall with standard maintenance."
    }
  },
  {
    id: 2,
    title: "Commercial Property Valuation Report",
    description: "Detailed valuation assessment for commercial retail property in West Benton business district.",
    report_type: "valuation",
    created_at: "2025-03-10T11:15:00Z",
    is_public: true,
    content: {
      property: {
        address: "789 Business Park Ave",
        parcel_id: "C-78901-2345",
        city: "Richland",
        county: "Benton",
        state: "Washington",
        building_type: "C1",
        year_built: 2015,
        square_feet: 4800
      },
      assessor: {
        name: "Michael Roberts",
        department: "Benton County Assessor's Office",
        contact: "mroberts@bentoncounty.gov"
      },
      assessment: {
        date: "2025-03-01T10:30:00Z",
        land_value: 250000,
        improvement_value: 850000,
        total_value: 1100000,
        previous_value: 1050000,
        change_percent: 4.76
      }
    }
  },
  {
    id: 3,
    title: "Agricultural Property Cost Analysis",
    description: "Detailed cost analysis of agricultural property in East Benton region with irrigation improvements.",
    report_type: "cost_analysis",
    created_at: "2025-02-25T16:45:00Z",
    is_public: false,
    content: {
      property: {
        address: "5670 Farmland Rd",
        parcel_id: "A-67890-1234",
        city: "Kennewick",
        county: "Benton",
        state: "Washington",
        building_type: "A1",
        year_built: 2008,
        square_feet: 3200
      }
    }
  },
  {
    id: 4,
    title: "Property Value Comparison Study",
    description: "Comparative analysis of similar residential properties in Central Benton to establish fair market values.",
    report_type: "comparison",
    created_at: "2025-02-20T09:30:00Z",
    is_public: true
  },
  {
    id: 5,
    title: "Industrial Property Assessment Report",
    description: "Assessment of industrial manufacturing facility including specialized equipment and infrastructure improvements.",
    report_type: "assessment",
    created_at: "2025-02-15T13:20:00Z",
    is_public: true
  }
];

const router = Router();

// Get all reports
router.get('/', async (req: Request, res: Response) => {
  try {
    // For demo purposes, just return the demo reports
    // In production, this would fetch from database
    res.json(demoReports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Get a single report by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const reportId = parseInt(req.params.id);
    
    // For demo purposes, find in demo data
    const report = demoReports.find(r => r.id === reportId);
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    res.json(report);
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

// Create a new report (demo implementation)
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, description, report_type, is_public, content } = req.body;
    
    // In a real implementation, we would validate and save to database
    const newReport = {
      id: demoReports.length + 1,
      title,
      description,
      report_type,
      created_at: new Date().toISOString(),
      is_public: is_public || false,
      content: content || {}
    };
    
    // Add to demo reports (this won't persist after server restart)
    demoReports.push(newReport);
    
    res.status(201).json(newReport);
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ error: 'Failed to create report' });
  }
});

// Update a report (demo implementation)
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const reportId = parseInt(req.params.id);
    const { title, description, report_type, is_public, content } = req.body;
    
    // Find the report in demo data
    const reportIndex = demoReports.findIndex(r => r.id === reportId);
    
    if (reportIndex === -1) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    // Update report
    const updatedReport = {
      ...demoReports[reportIndex],
      title: title || demoReports[reportIndex].title,
      description: description || demoReports[reportIndex].description,
      report_type: report_type || demoReports[reportIndex].report_type,
      is_public: is_public !== undefined ? is_public : demoReports[reportIndex].is_public,
      content: content || demoReports[reportIndex].content
    };
    
    demoReports[reportIndex] = updatedReport;
    
    res.json(updatedReport);
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({ error: 'Failed to update report' });
  }
});

// Delete a report (demo implementation)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const reportId = parseInt(req.params.id);
    
    // Find the report in demo data
    const reportIndex = demoReports.findIndex(r => r.id === reportId);
    
    if (reportIndex === -1) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    // Remove report
    demoReports.splice(reportIndex, 1);
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

export default router;
import React from 'react';
import DataPointContext from './DataPointContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';

interface ContextualDataViewerProps {
  /**
   * Title of the data viewer component
   */
  title?: string;
  
  /**
   * Optional description text
   */
  description?: string;
  
  /**
   * Optional CSS class for the container
   */
  className?: string;
  
  /**
   * Optional CSS class for the card component
   */
  cardClassName?: string;

  /**
   * Sample data mode to demonstrate different interaction patterns
   * 'cost': Shows building cost breakdown with trends
   * 'usage': Shows usage metrics with contextual information
   * 'comparison': Shows comparison metrics with thresholds
   */
  mode?: 'cost' | 'usage' | 'comparison' | 'custom';

  /**
   * Custom data for the data viewer (when mode is 'custom')
   */
  customData?: Array<{
    label: string;
    value: string | number;
    format?: 'currency' | 'percentage' | 'number' | 'text' | 'date';
    context?: string;
    explanation?: string;
    trendData?: Array<{
      date: string;
      value: number;
    }>;
    breakdownData?: Array<{
      label: string;
      value: number;
      percentage: number;
    }>;
    contextType?: 'tooltip' | 'hovercard' | 'popover';
    thresholds?: {
      low?: number;
      medium?: number;
      high?: number;
    };
  }>;

  /**
   * Callback triggered when a data point is interacted with
   */
  onDataPointInteraction?: (label: string, value: string | number, type: 'hover' | 'click') => void;
}

/**
 * ContextualDataViewer demonstrates the use of DataPointContext components
 * in a table view, showing how to provide contextual information for complex data points.
 */
const ContextualDataViewer: React.FC<ContextualDataViewerProps> = ({
  title = "Contextual Data Viewer",
  description = "Hover or click on data points for more information",
  className = "",
  cardClassName = "",
  mode = 'cost',
  customData,
  onDataPointInteraction
}) => {
  // Sample cost data with trends and breakdowns
  const costData = [
    {
      label: "Base Cost",
      value: 245000,
      format: 'currency' as const,
      context: "Base construction cost without adjustments",
      explanation: "This is the starting point for cost calculations based on square footage and building type.",
      contextType: 'tooltip' as const
    },
    {
      label: "Regional Multiplier",
      value: 1.25,
      format: 'number' as const,
      context: "Regional cost adjustment factor",
      explanation: "This multiplier accounts for regional variations in labor and material costs.",
      trendData: [
        { date: "2020", value: 1.18 },
        { date: "2021", value: 1.20 },
        { date: "2022", value: 1.22 },
        { date: "2023", value: 1.24 },
        { date: "2024", value: 1.25 }
      ],
      contextType: 'hovercard' as const
    },
    {
      label: "Quality Adjustment",
      value: 32000,
      format: 'currency' as const,
      context: "Adjustment based on construction quality",
      breakdownData: [
        { label: "Materials", value: 18000, percentage: 56 },
        { label: "Fixtures", value: 8000, percentage: 25 },
        { label: "Finishes", value: 6000, percentage: 19 }
      ],
      contextType: 'popover' as const
    },
    {
      label: "Age Depreciation",
      value: 15,
      format: 'percentage' as const,
      context: "Value reduction due to age",
      explanation: "The depreciation is calculated based on the building's age and condition.",
      trendData: [
        { date: "5 yrs", value: 5 },
        { date: "10 yrs", value: 10 },
        { date: "15 yrs", value: 15 },
        { date: "20 yrs", value: 22 },
        { date: "25 yrs", value: 30 }
      ],
      contextType: 'hovercard' as const
    },
    {
      label: "Total Cost",
      value: 306250,
      format: 'currency' as const,
      context: "Final adjusted cost",
      explanation: "This is the final cost after all adjustments have been applied to the base cost.",
      breakdownData: [
        { label: "Base", value: 245000, percentage: 80 },
        { label: "Regional", value: 61250, percentage: 20 },
        { label: "Quality", value: 32000, percentage: 10 },
        { label: "Depreciation", value: -32000, percentage: -10 }
      ],
      contextType: 'popover' as const
    }
  ];

  // Sample usage data with contextual information
  const usageData = [
    {
      label: "API Calls",
      value: 1250423,
      format: 'number' as const,
      context: "Total API calls in the current billing period",
      trendData: [
        { date: "Mon", value: 180000 },
        { date: "Tue", value: 195000 },
        { date: "Wed", value: 210000 },
        { date: "Thu", value: 230000 },
        { date: "Fri", value: 245000 },
        { date: "Sat", value: 90000 },
        { date: "Sun", value: 100423 }
      ],
      thresholds: { low: 1000000, medium: 2000000, high: 3000000 },
      contextType: 'hovercard' as const
    },
    {
      label: "Storage Used",
      value: 85.7,
      format: 'percentage' as const,
      context: "Current storage capacity usage",
      explanation: "Storage usage is approaching the limit. Consider upgrading your plan or optimizing storage.",
      thresholds: { low: 60, medium: 80, high: 90 },
      contextType: 'tooltip' as const
    },
    {
      label: "Response Time",
      value: 425,
      format: 'number' as const,
      context: "Average API response time in milliseconds",
      explanation: "Response times over 500ms may indicate performance issues.",
      trendData: [
        { date: "8AM", value: 320 },
        { date: "10AM", value: 350 },
        { date: "12PM", value: 480 },
        { date: "2PM", value: 510 },
        { date: "4PM", value: 425 },
        { date: "6PM", value: 380 }
      ],
      thresholds: { low: 300, medium: 450, high: 600 },
      contextType: 'hovercard' as const
    }
  ];

  // Sample comparison data with thresholds
  const comparisonData = [
    {
      label: "Construction Cost Index",
      value: 115.2,
      format: 'number' as const,
      context: "Relative cost compared to base year (100)",
      explanation: "The construction cost index measures the relative cost of construction compared to the base year (2015).",
      trendData: [
        { date: "2020", value: 107.3 },
        { date: "2021", value: 109.8 },
        { date: "2022", value: 112.5 },
        { date: "2023", value: 114.1 },
        { date: "2024", value: 115.2 }
      ],
      contextType: 'hovercard' as const
    },
    {
      label: "Cost vs. Benchmark",
      value: -5.8,
      format: 'percentage' as const,
      context: "Percentage difference from regional benchmark",
      explanation: "Your cost is 5.8% below the regional benchmark, indicating a potential cost advantage.",
      thresholds: { low: -10, medium: 0, high: 10 },
      contextType: 'tooltip' as const
    },
    {
      label: "Efficiency Rating",
      value: 87,
      format: 'number' as const,
      context: "Building efficiency score (0-100)",
      explanation: "The efficiency rating measures how effectively the building utilizes space and resources.",
      thresholds: { low: 60, medium: 80, high: 95 },
      breakdownData: [
        { label: "Space Utilization", value: 91, percentage: 91 },
        { label: "Energy Efficiency", value: 83, percentage: 83 },
        { label: "Material Efficiency", value: 85, percentage: 85 },
        { label: "Operational Efficiency", value: 89, percentage: 89 }
      ],
      contextType: 'popover' as const
    }
  ];

  // Determine which data set to display
  const dataToDisplay = customData || (
    mode === 'cost' ? costData :
    mode === 'usage' ? usageData :
    mode === 'comparison' ? comparisonData :
    []
  );

  // Handle interaction with a data point
  const handleDataPointInteraction = (type: 'hover' | 'click', value: string | number, label: string) => {
    if (onDataPointInteraction) {
      onDataPointInteraction(label, value, type);
    }
  };

  return (
    <Card className={`border shadow-sm ${cardClassName}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button variant="outline" size="sm" className="flex items-center gap-1 h-8">
            <Info className="h-3.5 w-3.5" />
            <span className="text-xs">Data Info</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className={className}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Metric</TableHead>
              <TableHead>Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dataToDisplay.map((item, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{item.label}</TableCell>
                <TableCell>
                  <DataPointContext
                    value={item.value}
                    context={item.context}
                    explanation={item.explanation}
                    trendData={item.trendData}
                    breakdownData={'breakdownData' in item ? item.breakdownData : undefined}
                    contextType={item.contextType || 'tooltip'}
                    format={item.format || 'text'}
                    thresholds={'thresholds' in item ? item.thresholds : undefined}
                    interactionEffect="glow"
                    onInteraction={(type, value) => 
                      handleDataPointInteraction(type, value, item.label)
                    }
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ContextualDataViewer;
import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Area
} from 'recharts';
import { 
  CHART_COLORS, 
  DATA_SERIES_COLORS, 
  BASE_CHART_CONFIG, 
  formatters 
} from './ChartTheme';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { InfoCircle } from 'lucide-react';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import SampleSizeIndicator from './SampleSizeIndicator';
import ConfidenceIntervalArea from './ConfidenceIntervalArea';
import MethodologyPanel from './MethodologyPanel';
import { calculateCOD, calculateStandardDeviation, calculateConfidenceInterval, formatStatistic } from '../../utils/statistics';

// Define data structure for line chart
interface DataPoint {
  name: string;
  value: number;
  date?: string;
  [key: string]: any; // Allow for additional data points
}

interface LineChartComponentProps {
  data: DataPoint[];
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  showGrid?: boolean;
  showArea?: boolean;
  showLegend?: boolean;
  showGradient?: boolean;
  referenceLine?: number;
  referenceLineLabel?: string;
  xAxisDataKey?: string;
  yAxisDataKey?: string;
  height?: number;
  className?: string;
  
  // IAAO Statistical Properties
  showConfidenceInterval?: boolean;
  confidenceLevel?: number;
  showMethodology?: boolean;
  methodologyDescription?: string;
  methodologyDataSource?: string;
  methodologyReferenceDate?: string;
  showSampleSize?: boolean;
  sampleSize?: number;
  populationSize?: number;
  
  // Additional statistics
  cod?: number; // Coefficient of Dispersion
  prd?: number; // Price-Related Differential
  meanValue?: number;
  medianValue?: number;
  standardDeviation?: number;
}

// Enhanced custom tooltip with more detailed information
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 shadow-lg rounded border border-gray-100">
        <p className="font-medium text-gray-800">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={`tooltip-${index}`} className="flex items-center mt-1">
            <div 
              className="w-3 h-3 rounded-full mr-2" 
              style={{ backgroundColor: entry.stroke }}
            />
            <p className="text-sm">
              <span className="text-gray-600">{entry.name}: </span>
              <span className="font-medium">{formatters.currency(entry.value)}</span>
            </p>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const LineChartComponent: React.FC<LineChartComponentProps> = ({
  data,
  title,
  xAxisLabel,
  yAxisLabel,
  showGrid = true,
  showArea = true,
  showLegend = true,
  showGradient = true,
  referenceLine,
  referenceLineLabel,
  xAxisDataKey = "name",
  yAxisDataKey = "value",
  height = 300,
  className = '',
  // Statistical properties
  showConfidenceInterval = false,
  confidenceLevel = 0.95,
  showMethodology = false,
  methodologyDescription = "Time series analysis of building costs with IAAO-compliant statistical methods.",
  methodologyDataSource = "Benton County Cost Matrix Database",
  methodologyReferenceDate,
  showSampleSize = false,
  sampleSize,
  populationSize,
  // Additional statistics
  cod,
  prd,
  meanValue,
  medianValue,
  standardDeviation
}) => {
  // For interactive features
  const [activeDot, setActiveDot] = useState<number | null>(null);

  // Create gradient definition for area under the line
  const gradientId = "colorGradient";
  
  // Extract values for calculations if not provided
  const values = data.map(item => parseFloat(item[yAxisDataKey])).filter(val => !isNaN(val));
  
  // Calculate statistics if not provided
  const calculatedMean = meanValue || (values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0);
  const calculatedStdDev = standardDeviation || calculateStandardDeviation(values);
  const calculatedMedian = medianValue || calculateMedian(values);
  const calculatedCOD = cod || calculateCOD(values.map(v => v / calculatedMedian));
  const calculatedSampleSize = sampleSize || values.length;
  
  // Generate statistics for methodology panel
  const statistics = [
    {
      name: "Sample Size",
      description: "Number of data points used in this analysis",
      value: calculatedSampleSize,
      format: "count"
    },
    {
      name: "Mean",
      description: "Average cost value across all data points",
      value: calculatedMean,
      format: "currency",
      formula: "Σ(values) / n"
    },
    {
      name: "Median",
      description: "Middle value in the dataset (50th percentile)",
      value: calculatedMedian,
      format: "currency"
    },
    {
      name: "Standard Deviation",
      description: "Measure of dispersion in the dataset",
      value: calculatedStdDev,
      format: "currency",
      formula: "√(Σ(x - μ)² / n)"
    }
  ];
  
  // Add COD if available
  if (calculatedCOD) {
    statistics.push({
      name: "Coefficient of Dispersion (COD)",
      description: "IAAO measure of horizontal equity (assessment uniformity)",
      value: calculatedCOD,
      format: "percentage",
      formula: "100 × (Σ|R - Median(R)| / n) / Median(R)",
      standard: "IAAO standard: COD ≤ 15.0 for residential, ≤ 20.0 for other property classes"
    });
  }
  
  // Add PRD if available
  if (prd) {
    statistics.push({
      name: "Price-Related Differential (PRD)",
      description: "IAAO measure of vertical equity (assessment progressivity)",
      value: prd,
      format: "ratio",
      formula: "Mean(R) / Weighted Mean(R)",
      standard: "IAAO standard: 0.98 ≤ PRD ≤ 1.03"
    });
  }
  
  return (
    <Card className={`overflow-hidden ${className}`}>
      <div className="px-4 pt-4 flex justify-between items-center">
        {title && (
          <div className="font-medium text-base">{title}</div>
        )}
        
        {/* Sample size indicator */}
        {showSampleSize && (
          <SampleSizeIndicator 
            sampleSize={calculatedSampleSize} 
            populationSize={populationSize}
            confidenceLevel={confidenceLevel}
          />
        )}
      </div>
      
      <CardContent className="p-4">
        <ResponsiveContainer width="100%" height={height}>
          <LineChart
            data={data}
            margin={{
              top: BASE_CHART_CONFIG.margin.top,
              right: BASE_CHART_CONFIG.margin.right,
              left: BASE_CHART_CONFIG.margin.left,
              bottom: BASE_CHART_CONFIG.margin.bottom
            }}
            onMouseMove={(data) => {
              if (data && data.activeTooltipIndex !== undefined) {
                setActiveDot(data.activeTooltipIndex);
              }
            }}
            onMouseLeave={() => setActiveDot(null)}
          >
            {/* Gradient definition for area */}
            {showGradient && showArea && (
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
            )}
            
            {showGrid && (
              <CartesianGrid 
                strokeDasharray={BASE_CHART_CONFIG.gridStrokeDasharray} 
                stroke={CHART_COLORS.gridLine}
                vertical={true}
                horizontal={true}
              />
            )}
            
            <XAxis 
              dataKey={xAxisDataKey} 
              tick={{ fill: CHART_COLORS.textSecondary, fontSize: BASE_CHART_CONFIG.fontSize.xAxis }}
              label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -10 } : undefined}
              axisLine={{ stroke: CHART_COLORS.gridLine }}
              tickLine={{ stroke: CHART_COLORS.gridLine }}
            />
            
            <YAxis 
              tick={{ fill: CHART_COLORS.textSecondary, fontSize: BASE_CHART_CONFIG.fontSize.yAxis }}
              tickFormatter={formatters.currency}
              label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
              axisLine={{ stroke: CHART_COLORS.gridLine }}
              tickLine={{ stroke: CHART_COLORS.gridLine }}
              domain={['dataMin - 1000', 'dataMax + 1000']}
            />
            
            <Tooltip 
              content={<CustomTooltip />}
              cursor={{ stroke: CHART_COLORS.neutral, strokeDasharray: '3 3' }}
            />
            
            {showLegend && <Legend />}
            
            {/* Confidence Interval Area */}
            {showConfidenceInterval && (
              <ConfidenceIntervalArea
                dataKey={yAxisDataKey}
                data={data}
                xAxisKey={xAxisDataKey}
                confidenceLevel={confidenceLevel}
                fillColor="rgba(66, 133, 244, 0.1)"
                strokeColor="rgba(66, 133, 244, 0.3)"
                show={true}
              />
            )}
            
            {/* Optional reference line (e.g., average or target) */}
            {referenceLine !== undefined && (
              <ReferenceLine 
                y={referenceLine} 
                stroke={CHART_COLORS.highlight}
                strokeDasharray="3 3"
                label={{
                  value: referenceLineLabel || `Reference: ${formatters.currency(referenceLine)}`,
                  position: 'right',
                  fill: CHART_COLORS.highlight,
                  fontSize: 12
                }}
              />
            )}
            
            {/* Mean reference line */}
            {calculatedMean && !referenceLine && (
              <ReferenceLine 
                y={calculatedMean} 
                stroke={CHART_COLORS.secondary}
                strokeDasharray="3 3"
                label={{
                  value: `Mean: ${formatters.currency(calculatedMean)}`,
                  position: 'right',
                  fill: CHART_COLORS.secondary,
                  fontSize: 12
                }}
              />
            )}
            
            {/* Area under the line */}
            {showArea && (
              <Area 
                type="monotone" 
                dataKey={yAxisDataKey} 
                stroke="none"
                fillOpacity={1}
                fill={showGradient ? `url(#${gradientId})` : CHART_COLORS.primary + '20'}
              />
            )}
            
            {/* Main line */}
            <Line 
              type="monotone" 
              dataKey={yAxisDataKey} 
              stroke={CHART_COLORS.primary}
              strokeWidth={3}
              dot={(props: any) => {
                const isActive = activeDot === props.index;
                return (
                  <svg 
                    x={props.cx - (isActive ? 6 : 4)} 
                    y={props.cy - (isActive ? 6 : 4)} 
                    width={isActive ? 12 : 8} 
                    height={isActive ? 12 : 8}
                    style={{
                      transition: 'all 150ms ease-in-out'
                    }}
                  >
                    <circle 
                      cx={isActive ? 6 : 4} 
                      cy={isActive ? 6 : 4} 
                      r={isActive ? 6 : 4} 
                      fill="#fff" 
                      stroke={CHART_COLORS.primary}
                      strokeWidth={2}
                    />
                  </svg>
                );
              }}
              activeDot={{ 
                r: 6, 
                stroke: CHART_COLORS.primary, 
                strokeWidth: 2, 
                fill: '#fff',
                style: { filter: 'drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.2))' }
              }}
              name="Cost"
              animationDuration={BASE_CHART_CONFIG.animationDuration}
              isAnimationActive={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
      
      {/* Methodology Panel */}
      {showMethodology && (
        <CardFooter className="px-4 py-2">
          <MethodologyPanel
            title={title || "Cost Trend Analysis"}
            description={methodologyDescription}
            dataSource={methodologyDataSource}
            referenceDate={methodologyReferenceDate || new Date().toLocaleDateString()}
            methodDescription={`Analysis of ${calculatedSampleSize} data points using IAAO-compliant statistical methods, including mean, median, and measures of dispersion. ${showConfidenceInterval ? `Confidence intervals shown at ${confidenceLevel * 100}% confidence level.` : ''}`}
            statistics={statistics}
            references={[
              {
                title: "IAAO Standard on Ratio Studies",
                url: "https://www.iaao.org/media/standards/Standard_on_Ratio_Studies.pdf"
              },
              {
                title: "USPAP Standard 6: Mass Appraisal, Development and Reporting",
                url: "https://www.appraisalfoundation.org/"
              }
            ]}
            uspap={true}
            iaao={true}
          />
        </CardFooter>
      )}
    </Card>
  );
};

export default LineChartComponent;
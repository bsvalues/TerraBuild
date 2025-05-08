import React from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { 
  CHART_COLORS, 
  DATA_SERIES_COLORS, 
  formatters 
} from './ChartTheme';
import { Card, CardContent } from '@/components/ui/card';

// Define the data structure for radar chart data
interface DataItem {
  subject: string;
  [key: string]: any; // For various metrics
}

interface RadarChartComponentProps {
  data: DataItem[];
  title?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  metrics?: Array<{key: string, name: string, color?: string}>;
  height?: number;
  fillOpacity?: number;
  className?: string;
}

// Custom tooltip for radar chart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 shadow-lg rounded border border-gray-100">
        <p className="font-medium text-gray-800">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={`tooltip-${index}`} className="flex items-center mt-1">
            <div 
              className="w-3 h-3 rounded-full mr-2" 
              style={{ backgroundColor: entry.color }}
            />
            <p className="text-sm">
              <span className="text-gray-600">{entry.name}: </span>
              <span className="font-medium">{formatters.number(entry.value)}</span>
            </p>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const RadarChartComponent: React.FC<RadarChartComponentProps> = ({
  data,
  title,
  showGrid = true,
  showLegend = true,
  metrics = [{ key: 'value', name: 'Value' }],
  height = 300,
  fillOpacity = 0.3,
  className = ''
}) => {
  return (
    <Card className={`overflow-hidden ${className}`}>
      {title && (
        <div className="px-4 pt-4 font-medium text-base">{title}</div>
      )}
      <CardContent className="p-4">
        <ResponsiveContainer width="100%" height={height}>
          <RadarChart 
            cx="50%" 
            cy="50%" 
            outerRadius="80%" 
            data={data}
          >
            {showGrid && (
              <PolarGrid 
                stroke={CHART_COLORS.gridLine} 
                gridType="circle"
              />
            )}
            
            <PolarAngleAxis 
              dataKey="subject" 
              tick={{ 
                fill: CHART_COLORS.textSecondary, 
                fontSize: 12
              }}
              stroke={CHART_COLORS.gridLine}
            />
            
            <PolarRadiusAxis 
              angle={30} 
              domain={[0, 'auto']} 
              tick={{ 
                fill: CHART_COLORS.textSecondary, 
                fontSize: 10 
              }}
              stroke={CHART_COLORS.gridLine}
              tickCount={5}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            {showLegend && <Legend />}
            
            {metrics.map((metric, index) => (
              <Radar
                key={metric.key}
                name={metric.name}
                dataKey={metric.key}
                stroke={metric.color || DATA_SERIES_COLORS[index % DATA_SERIES_COLORS.length]}
                fill={metric.color || DATA_SERIES_COLORS[index % DATA_SERIES_COLORS.length]}
                fillOpacity={fillOpacity}
                dot={true}
                isAnimationActive={true}
                animationDuration={800}
                animationEasing="ease-in-out"
              />
            ))}
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default RadarChartComponent;
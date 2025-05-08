import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { CHART_COLORS, DATA_SERIES_COLORS, BASE_CHART_CONFIG, formatters } from './ChartTheme';
import { Card, CardContent } from '@/components/ui/card';

interface DataItem {
  name: string;
  value: number;
  color?: string;
}

interface BarChartComponentProps {
  data: DataItem[];
  selectedBuildingType?: string | null;
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  height?: number;
  horizontal?: boolean;
  className?: string;
}

// Enhanced tooltip that follows Apple's clean design principles
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 shadow-lg rounded border border-gray-100 text-left">
        <p className="font-medium text-gray-800">{label}</p>
        <div className="flex items-center mt-1">
          <div 
            className="w-3 h-3 rounded-full mr-2" 
            style={{ backgroundColor: payload[0].fill }}
          />
          <p className="text-sm">
            <span className="text-gray-600">Cost: </span>
            <span className="font-medium">{formatters.currency(payload[0].value)}</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

const BarChartComponent: React.FC<BarChartComponentProps> = ({
  data,
  selectedBuildingType,
  title,
  xAxisLabel,
  yAxisLabel,
  showGrid = true,
  showLegend = false,
  height = 300,
  horizontal = false,
  className = ''
}) => {
  // Add hover effect state
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  // Get the index of the selected building type
  const selectedIndex = selectedBuildingType 
    ? data.findIndex(item => item.name === selectedBuildingType)
    : -1;

  return (
    <Card className={`overflow-hidden ${className}`}>
      {title && (
        <div className="px-4 pt-4 font-medium text-base">{title}</div>
      )}
      <CardContent className="p-4">
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={data}
            layout={horizontal ? 'vertical' : 'horizontal'}
            margin={{
              top: BASE_CHART_CONFIG.margin.top,
              right: BASE_CHART_CONFIG.margin.right,
              left: BASE_CHART_CONFIG.margin.left,
              bottom: BASE_CHART_CONFIG.margin.bottom
            }}
            barCategoryGap="20%"
            barSize={selectedBuildingType ? 30 : 20}
            onMouseMove={(data) => {
              if (data && data.activeTooltipIndex !== undefined) {
                setHoveredBar(data.activeTooltipIndex);
              }
            }}
            onMouseLeave={() => setHoveredBar(null)}
          >
            {showGrid && (
              <CartesianGrid 
                strokeDasharray={BASE_CHART_CONFIG.gridStrokeDasharray} 
                stroke={CHART_COLORS.gridLine}
                vertical={!horizontal}
                horizontal={horizontal}
              />
            )}
            
            {horizontal ? (
              <>
                <XAxis 
                  type="number" 
                  tick={{ fill: CHART_COLORS.textSecondary, fontSize: BASE_CHART_CONFIG.fontSize.xAxis }}
                  tickFormatter={formatters.currency}
                  label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -10 } : undefined}
                  axisLine={{ stroke: CHART_COLORS.gridLine }}
                  tickLine={{ stroke: CHART_COLORS.gridLine }}
                  domain={[0, 'dataMax']}
                />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  tick={{ fill: CHART_COLORS.textSecondary, fontSize: BASE_CHART_CONFIG.fontSize.yAxis }}
                  label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
                  axisLine={{ stroke: CHART_COLORS.gridLine }}
                  tickLine={{ stroke: CHART_COLORS.gridLine }}
                />
              </>
            ) : (
              <>
                <XAxis 
                  dataKey="name" 
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
                  domain={[0, 'dataMax']}
                />
              </>
            )}
            
            <Tooltip 
              content={<CustomTooltip />}
              cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
            />
            
            {showLegend && <Legend />}
            
            <Bar 
              dataKey="value" 
              name="Cost" 
              radius={[BASE_CHART_CONFIG.borderRadius, BASE_CHART_CONFIG.borderRadius, 0, 0]}
              animationDuration={BASE_CHART_CONFIG.animationDuration}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color || 
                    (selectedBuildingType && index === selectedIndex 
                      ? CHART_COLORS.highlight 
                      : DATA_SERIES_COLORS[index % DATA_SERIES_COLORS.length])}
                  stroke={
                    hoveredBar === index || (selectedBuildingType && index === selectedIndex)
                      ? CHART_COLORS.primary
                      : 'transparent'
                  }
                  strokeWidth={2}
                  style={{
                    filter: hoveredBar === index ? 'drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.2))' : 'none',
                    opacity: hoveredBar === null || hoveredBar === index || (selectedBuildingType && index === selectedIndex) ? 1 : 0.7,
                    transition: 'opacity 300ms, filter 300ms'
                  }}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default BarChartComponent;
import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, Sector } from 'recharts';
import { CHART_COLORS, DATA_SERIES_COLORS, formatters } from './ChartTheme';
import { Card, CardContent } from '@/components/ui/card';

// Define the data shape for region data
interface DataItem {
  name: string;
  value: number;
  color?: string;
}

interface PieChartComponentProps {
  data: DataItem[];
  title?: string;
  showLegend?: boolean;
  showLabels?: boolean;
  showTooltip?: boolean;
  height?: number;
  className?: string;
}

// Custom active shape for enhanced presentation when hovering
const renderActiveShape = (props: any) => {
  const {
    cx, cy, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, percent, value
  } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        cornerRadius={4}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={innerRadius - 6}
        outerRadius={innerRadius - 2}
        fill={fill}
      />
      <text x={cx} y={cy} dy={-15} textAnchor="middle" fill={CHART_COLORS.textPrimary} className="text-sm font-medium">
        {payload.name}
      </text>
      <text x={cx} y={cy + 5} textAnchor="middle" fill={CHART_COLORS.textSecondary} className="text-xs">
        {formatters.currency(value)}
      </text>
      <text x={cx} y={cy + 25} textAnchor="middle" fill={CHART_COLORS.textSecondary} className="text-xs">
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    </g>
  );
};

// Enhanced tooltip 
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
        <p className="font-medium">{payload[0].name}</p>
        <p className="text-sm text-gray-600">{formatters.currency(payload[0].value)}</p>
        <p className="text-xs text-gray-500">
          {`${(payload[0].payload.percent * 100).toFixed(1)}% of total`}
        </p>
      </div>
    );
  }
  return null;
};

const PieChartComponent: React.FC<PieChartComponentProps> = ({
  data,
  title,
  showLegend = true,
  showLabels = true,
  showTooltip = true,
  height = 300,
  className = ''
}) => {
  const [activeIndex, setActiveIndex] = useState(0);

  // Prepare data with percentages
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const dataWithPercent = data.map(item => ({
    ...item,
    percent: item.value / total
  }));

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  return (
    <Card className={`overflow-hidden ${className}`}>
      {title && (
        <div className="px-4 pt-4 font-medium text-base">{title}</div>
      )}
      <CardContent className="p-0">
        <div className="p-4">
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                data={dataWithPercent}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                onMouseEnter={onPieEnter}
                cornerRadius={4}
              >
                {dataWithPercent.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color || DATA_SERIES_COLORS[index % DATA_SERIES_COLORS.length]} 
                    stroke={CHART_COLORS.background}
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              {showTooltip && <Tooltip content={<CustomTooltip />} />}
              {showLegend && (
                <Legend 
                  layout="vertical" 
                  align="right"
                  verticalAlign="middle" 
                  iconType="circle"
                  formatter={(value, entry: any) => (
                    <span className="text-sm text-gray-700">
                      {value}: {formatters.currency(entry.payload.value)}
                    </span>
                  )}
                />
              )}
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default PieChartComponent;
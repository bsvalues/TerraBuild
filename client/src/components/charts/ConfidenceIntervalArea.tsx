import React from 'react';
import { Area } from 'recharts';
import { calculateConfidenceInterval } from '../../utils/statistics';

interface ConfidenceIntervalAreaProps {
  /**
   * The data key for the main value to calculate confidence interval around
   */
  dataKey: string;
  
  /**
   * Full dataset array
   */
  data: any[];
  
  /**
   * Optional x-axis key (category) if needed for proper rendering
   */
  xAxisKey?: string;
  
  /**
   * Confidence level (0.95 for 95% confidence)
   */
  confidenceLevel?: number;
  
  /**
   * Fill color for the confidence interval area
   */
  fillColor?: string;
  
  /**
   * Opacity for the confidence interval area
   */
  fillOpacity?: number;
  
  /**
   * Stroke color for the confidence interval area borders
   */
  strokeColor?: string;
  
  /**
   * Whether to show the confidence interval
   */
  show?: boolean;
}

/**
 * Confidence Interval Area Component
 * 
 * Renders a confidence interval as a shaded area on charts
 * to visualize statistical uncertainty according to IAAO standards.
 */
const ConfidenceIntervalArea: React.FC<ConfidenceIntervalAreaProps> = ({
  dataKey,
  data,
  xAxisKey,
  confidenceLevel = 0.95,
  fillColor = 'rgba(33, 150, 243, 0.2)',
  fillOpacity = 0.4,
  strokeColor = 'rgba(33, 150, 243, 0.5)',
  show = true
}) => {
  if (!show || !data || data.length === 0) {
    return null;
  }

  // Extract the values for the specified dataKey
  const values = data.map(item => parseFloat(item[dataKey])).filter(val => !isNaN(val));
  
  // Calculate the confidence interval
  const { lower, upper } = calculateConfidenceInterval(values, confidenceLevel);
  
  // Create dataset with confidence interval bounds
  const confidenceData = data.map(item => {
    const value = parseFloat(item[dataKey]);
    if (isNaN(value)) {
      return { ...item, ciLower: null, ciUpper: null };
    }
    
    // Calculate individual item confidence interval based on global bounds
    // This is a simplification - in a real implementation you might want to
    // calculate individual CIs or use more sophisticated methods
    const valueFactor = value / (values.reduce((sum, v) => sum + v, 0) / values.length);
    const adjustedLower = lower * valueFactor;
    const adjustedUpper = upper * valueFactor;
    
    return {
      ...item,
      ciLower: adjustedLower,
      ciUpper: adjustedUpper
    };
  });
  
  return (
    <>
      <Area
        type="monotone"
        dataKey="ciUpper"
        data={confidenceData}
        fill={fillColor}
        fillOpacity={fillOpacity}
        stroke={strokeColor}
        activeDot={false}
        isAnimationActive={false}
      />
      <Area
        type="monotone"
        dataKey="ciLower"
        data={confidenceData}
        fill="transparent"
        stroke={strokeColor}
        activeDot={false}
        isAnimationActive={false}
      />
    </>
  );
};

export default ConfidenceIntervalArea;
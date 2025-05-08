/**
 * Chart Theme Configuration
 * 
 * This file defines consistent styling for all chart components in the TerraBuild platform,
 * following design principles that emphasize clarity, trustworthiness, and professionalism.
 */

export const CHART_COLORS = {
  // Primary palette (for main data series)
  primary: "#0A559E", // Trustworthy blue
  secondary: "#2E8A99", // Supporting teal
  tertiary: "#4FB0C6", // Light blue accent
  
  // Regional color palette (for geographic data)
  west: "#1F78B4",    // West region blue
  central: "#33A02C", // Central region green
  east: "#E31A1C",    // East region red
  
  // Supporting colors for charts
  positive: "#2E8B57", // Success/positive green
  negative: "#CC3333", // Error/negative red
  neutral: "#888888",  // Neutral gray
  
  // Highlight colors for selection/focus
  highlight: "#FFA500", // Orange highlight
  selection: "#FFD700", // Gold selection
  
  // Background and surface colors
  background: "#FFFFFF",
  surface: "#F9FAFB", 
  gridLine: "#EEEEEE",
  
  // Text colors
  textPrimary: "#333333",
  textSecondary: "#666666",
  textMuted: "#999999"
};

// Color arrays for consistent data series
export const DATA_SERIES_COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.secondary,
  CHART_COLORS.tertiary,
  "#6B5B95", // Purple
  "#88B04B", // Green
  "#EFC050", // Yellow
  "#7B9EA8", // Slate blue
  "#9B2335", // Dark red
  "#5B5EA6", // Blue purple
  "#45B8AC"  // Turquoise
];

// Base chart configuration
export const BASE_CHART_CONFIG = {
  margin: { top: 20, right: 30, bottom: 40, left: 50 },
  animationDuration: 500,
  gridStrokeDasharray: "3 3",
  fontSize: {
    xAxis: 12,
    yAxis: 12,
    label: 14,
    title: 16
  },
  borderRadius: 4
};

// Default tooltip styling
export const TOOLTIP_STYLE = {
  background: "#FFFFFF",
  border: `1px solid ${CHART_COLORS.gridLine}`,
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
  borderRadius: "4px",
  padding: "8px 12px",
  fontFamily: "'Inter', system-ui, sans-serif",
  fontSize: "12px",
  color: CHART_COLORS.textPrimary
};

// Responsive sizing
export const RESPONSIVE_CHART_SIZES = {
  small: {
    height: 200,
    paddingX: 16,
    fontSize: {
      xAxis: 10,
      yAxis: 10,
      label: 12,
      title: 14
    }
  },
  medium: {
    height: 300,
    paddingX: 20,
    fontSize: {
      xAxis: 12,
      yAxis: 12,
      label: 14,
      title: 16
    }
  },
  large: {
    height: 400,
    paddingX: 24,
    fontSize: {
      xAxis: 14,
      yAxis: 14,
      label: 16,
      title: 18
    }
  }
};

// Formatter functions
export const formatters = {
  currency: (value: number) => 
    new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value),
    
  percent: (value: number) => 
    new Intl.NumberFormat('en-US', { 
      style: 'percent', 
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value / 100),
    
  number: (value: number) => 
    new Intl.NumberFormat('en-US').format(value),
    
  compact: (value: number) => 
    new Intl.NumberFormat('en-US', {
      notation: 'compact',
      compactDisplay: 'short'
    }).format(value)
};
/**
 * Chart Theme System for TerraBuild
 * 
 * This file contains theme settings and helpers for consistent chart styling
 * across the application, following Apple-inspired design principles with
 * a focus on clarity, deference, and depth.
 */

// Color palette for charts (based on Benton County branding with professional blues)
export const CHART_COLORS = {
  // Primary application colors
  primary: '#0070F3', // Primary blue
  secondary: '#4E44CE', // Secondary blue/purple
  tertiary: '#00A3BF', // Tertiary teal  
  highlight: '#FF6B00', // Orange highlight
  success: '#10B981', // Success green
  warning: '#F59E0B', // Warning amber
  error: '#EF4444', // Error red
  neutral: '#64748B', // Neutral gray

  // Text colors
  textPrimary: '#111827', // Near black
  textSecondary: '#6B7280', // Gray
  textTertiary: '#9CA3AF', // Light gray

  // Background/surface colors
  background: '#FFFFFF', // White
  surface: '#F9FAFB', // Off-white
  gridLine: '#E5E7EB', // Light gray for grid lines
  
  // Special case colors
  increase: '#10B981', // For value increases (green)
  decrease: '#EF4444', // For value decreases (red)
  
  // Chart specific colors
  chartBackground: 'rgba(249, 250, 251, 0.8)' // Semi-transparent background
};

// Color series for multiple data points in the same chart
export const DATA_SERIES_COLORS = [
  '#0070F3', // Primary Blue
  '#00A3BF', // Teal
  '#4E44CE', // Purple
  '#10B981', // Green
  '#F59E0B', // Amber
  '#FF6B00', // Orange
  '#EF4444', // Red
  '#64748B', // Gray
];

// Base chart configuration for consistent styling
export const BASE_CHART_CONFIG = {
  animationDuration: 800,
  fontSize: {
    title: 16,
    subtitle: 14,
    xAxis: 12,
    yAxis: 12,
    label: 12,
    tooltip: 12
  },
  borderRadius: 4, // For bar charts, buttons, etc.
  padding: {
    card: 16,
    chart: 20
  },
  margin: {
    top: 10,
    right: 30,
    bottom: 30,
    left: 20
  },
  gridStrokeDasharray: '3 3'
};

// Formatter functions for consistent data display
export const formatters = {
  // Format currency values
  currency: (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  },
  
  // Format percentage values
  percent: (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value / 100);
  },
  
  // Format large numbers with K/M/B suffixes
  compact: (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      compactDisplay: 'short'
    }).format(value);
  },
  
  // Format plain numbers with thousands separators
  number: (value: number): string => {
    return new Intl.NumberFormat('en-US').format(value);
  },
  
  // Format dates (simple)
  date: (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
};
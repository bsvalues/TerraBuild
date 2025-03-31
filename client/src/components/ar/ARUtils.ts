/**
 * AR Utilities for Building Cost Visualization
 * 
 * This module provides helper functions for working with AR in the Building Cost app
 */

/**
 * Check if WebXR AR is supported in the current browser
 * @returns Promise that resolves to a boolean indicating AR support
 */
export async function checkARSupport(): Promise<boolean> {
  // First check for WebXR support
  if (
    'xr' in navigator && 
    'isSessionSupported' in (navigator as any).xr && 
    typeof (navigator as any).xr.isSessionSupported === 'function'
  ) {
    try {
      return await (navigator as any).xr.isSessionSupported('immersive-ar');
    } catch (e) {
      console.error("Error checking WebXR support:", e);
      return false;
    }
  }
  
  // Fallback for older WebVR API (not fully compatible but may work)
  if ('getVRDisplays' in navigator) {
    return true;
  }
  
  return false;
}

/**
 * Calculate building dimensions for AR visualization based on square footage
 * @param squareFootage Total square footage of the building
 * @returns Object with width, depth, and height values
 */
export function calculateBuildingDimensions(squareFootage: number) {
  // For visualization purposes, we'll scale down real-world sizes
  // and assume a square building layout for simplicity
  const scale = 0.1; // Scale factor for AR visualization
  const sideLength = Math.sqrt(squareFootage) * scale;
  const height = sideLength * 0.7; // Typical height is less than width/depth
  
  return {
    width: sideLength,
    depth: sideLength,
    height: height
  };
}

/**
 * Get color based on building condition factor
 * @param conditionFactor A value between 0-1 representing building condition
 * @returns Hex color code
 */
export function getConditionColor(conditionFactor: number): string {
  if (conditionFactor >= 0.7) {
    return '#4CAF50'; // Good condition (green)
  } else if (conditionFactor >= 0.4) {
    return '#FFC107'; // Fair condition (yellow)
  } else {
    return '#F44336'; // Poor condition (red)
  }
}

/**
 * Create building cost scale for visualization
 * @param totalCost Total building cost
 * @returns A normalized scale value between 0.5 and 5
 */
export function getCostScale(totalCost: number): number {
  // Normalize cost to a reasonable scale for visualization (0.5 to 5)
  return Math.min(Math.max(totalCost / 10000, 0.5), 5);
}

/**
 * Get building material colors based on building type
 * @param buildingType Type of building
 * @returns Object with color codes for different building parts
 */
export function getBuildingMaterialColors(buildingType: string): {
  primary: string;
  secondary: string;
  roof: string;
} {
  // Default colors
  let colors = {
    primary: '#B0BEC5', // Light gray-blue
    secondary: '#90A4AE', // Slightly darker gray-blue
    roof: '#795548'      // Brown
  };
  
  // Adjust colors based on building type
  switch (buildingType.toLowerCase()) {
    case 'residential':
      colors.primary = '#FFECB3'; // Light tan
      colors.secondary = '#FFE082'; // Slightly darker tan
      colors.roof = '#A1887F'; // Light brown
      break;
    case 'commercial':
      colors.primary = '#B3E5FC'; // Light blue
      colors.secondary = '#81D4FA'; // Medium blue
      colors.roof = '#607D8B'; // Blue-gray
      break;
    case 'industrial':
      colors.primary = '#BDBDBD'; // Light gray
      colors.secondary = '#9E9E9E'; // Medium gray
      colors.roof = '#616161'; // Dark gray
      break;
    case 'agricultural':
      colors.primary = '#DCEDC8'; // Light green
      colors.secondary = '#C5E1A5'; // Medium green
      colors.roof = '#827717'; // Dark olive
      break;
  }
  
  return colors;
}

/**
 * Create different AR marker types
 */
export const ARMarkerTypes = {
  HIRO: 'hiro',
  KANJI: 'kanji',
  PATTERN: 'pattern',
  BARCODE: 'barcode'
};

/**
 * Get AR marker image URL
 * @param type Marker type
 * @returns URL to the marker image
 */
export function getMarkerImageUrl(type: string = ARMarkerTypes.HIRO): string {
  switch (type) {
    case ARMarkerTypes.HIRO:
      return 'https://jeromeetienne.github.io/AR.js/data/images/HIRO.jpg';
    case ARMarkerTypes.KANJI:
      return 'https://jeromeetienne.github.io/AR.js/data/images/kanji.jpg';
    default:
      return 'https://jeromeetienne.github.io/AR.js/data/images/HIRO.jpg';
  }
}
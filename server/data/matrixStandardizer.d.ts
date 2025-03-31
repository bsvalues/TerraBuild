/**
 * Matrix Standardizer Type Definitions
 */

interface StandardizationOptions {
  detectOutliers?: boolean;
  autoCorrectOutliers?: boolean;
}

interface OutlierInfo {
  isOutlier: boolean;
  modifiedZScore?: number;
  median?: number;
  mad?: number;
  suggestedValue?: number;
}

export function standardizeMatrixData(
  data: any[],
  options?: StandardizationOptions
): any[];

export function standardizeCurrencyValue(value: any): number;

export function standardizeBuildingType(buildingType: string): string;

export function standardizeRegion(region: string): string;

export function extractRegionFromDescription(description: string): string | null;

export function detectOutlier(value: number, data: any[]): OutlierInfo;
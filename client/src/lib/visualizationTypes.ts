/**
 * Type definitions for visualization components and API responses
 */

// Regional cost heatmap types
export interface RegionalCostData {
  name: string;
  avgCost: number | null;
  minCost: number | null;
  maxCost: number | null;
  count: number | null;
}

export interface RegionalCostsResponse {
  success: boolean;
  region: string;
  buildingType: string;
  counties: RegionalCostData[];
  error?: string;
}

export interface HeatmapVisualizationProps {
  data: RegionalCostData[];
  region: string;
  buildingType: string;
  isLoading?: boolean;
  onCountySelect?: (county: string) => void;
}

// Hierarchical cost visualization types
export interface HierarchicalCostNode {
  name: string;
  value: number | null;
  children?: HierarchicalCostNode[];
  count?: number | null;
}

export interface HierarchicalCostsResponse {
  success: boolean;
  data: {
    name: string;
    children: HierarchicalCostNode[];
  } | null;
  error?: string;
}

export interface HierarchicalVisualizationProps {
  data: HierarchicalCostsResponse['data'];
  isLoading?: boolean;
  onNodeSelect?: (nodePath: string[]) => void;
}

// Statistical correlation analysis types
export interface BuildingDataPoint {
  id?: number | string;
  region?: string;
  county?: string;
  cost: number | null;
  size: number | null;
  yearBuilt?: number | null;
  qualityGrade?: string | null;
}

export interface CorrelationData {
  size: (number | null)[];
  cost: (number | null)[];
}

export interface StatisticalDataResponse {
  success: boolean;
  buildings: BuildingDataPoint[];
  costs: (number | null)[];
  correlations: CorrelationData | null;
  error?: string;
}

export interface CorrelationAnalysisProps {
  buildings: BuildingDataPoint[];
  costs: (number | null)[];
  correlations: CorrelationData | null;
  isLoading?: boolean;
  onDataPointSelect?: (buildingId: number | string) => void;
}

// Common visualization controller types
export interface VisualizationFilterState {
  region: string;
  buildingType: string;
  year?: number;
  county?: string;
  quality?: string;
}

export interface VisualizationControllerProps {
  children: React.ReactNode;
  initialFilters?: Partial<VisualizationFilterState>;
  onFilterChange?: (filters: VisualizationFilterState) => void;
}
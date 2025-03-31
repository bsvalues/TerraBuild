export const APP_NAME = "Benton County Washington Building Cost Assessment System";
export const APP_VERSION = "2.0.0";

export const API_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"];

export const STATUS_TYPES = {
  ONLINE: "online",
  DEGRADED: "degraded",
  OFFLINE: "offline"
};

export const STATUS_VARIANTS = {
  online: "success",
  degraded: "warning",
  offline: "danger"
};

export const QUICK_ACTIONS = [
  {
    name: "Restart Application",
    icon: "ri-restart-line",
    action: "restart"
  },
  {
    name: "Pull Latest Changes",
    icon: "ri-git-pull-request-line",
    action: "pull"
  },
  {
    name: "Sync Database",
    icon: "ri-database-2-line",
    action: "sync"
  }
];

export const APP_DETAILS = [
  { label: "Application", value: APP_NAME },
  { label: "Version", value: APP_VERSION },
  { label: "Environment", value: "Development", variant: "success" },
  { label: "Last Deployment", value: "March 31, 2025" },
  { label: "Assessment Data", value: "2025 Matrix" },
  { label: "Database", value: "PostgreSQL 14" }
];

export const TEST_USERS = [
  { id: 1, name: "County Assessor" },
  { id: 2, name: "Assessment Clerk" },
  { id: 3, name: "Property Inspector" }
];

export const EXPIRATION_OPTIONS = [
  { value: "4h", label: "4 hours" },
  { value: "8h", label: "8 hours" },
  { value: "24h", label: "24 hours" },
  { value: "never", label: "Never (Development Only)" }
];

// Building Cost Calculator Constants - Benton County Washington Specific
export const regions = [
  { value: "Central Benton", label: "Central Benton" },
  { value: "East Benton", label: "East Benton" },
  { value: "West Benton", label: "West Benton" }
];

// For backwards compatibility
export const REGIONS = regions;

export const buildingTypes = [
  { value: "A1", label: "A1 - Agricultural" },
  { value: "C1", label: "C1 - Central Commercial" },
  { value: "C4", label: "C4 - Office Building" },
  { value: "I1", label: "I1 - Light Industrial" },
  { value: "R1", label: "R1 - Single Family Residential" },
  { value: "R2", label: "R2 - Multi-Family Residential" },
  { value: "S1", label: "S1 - Storage" }
];

// For backwards compatibility
export const BUILDING_TYPES = [
  { value: "Residential", label: "Residential" },
  { value: "Commercial", label: "Commercial" },
  { value: "Industrial", label: "Industrial" },
  { value: "Agricultural", label: "Agricultural" },
  { value: "Storage", label: "Storage" }
];

export const PROPERTY_CLASSES = [
  { value: "R1", label: "R1 - Single Family Residential" },
  { value: "R2", label: "R2 - Multi-Family Residential" },
  { value: "R3", label: "R3 - Residential Manufactured Home" },
  { value: "C1", label: "C1 - Central Commercial" },
  { value: "C2", label: "C2 - General Commercial" },
  { value: "I1", label: "I1 - Light Industrial" },
  { value: "I2", label: "I2 - Heavy Industrial" },
  { value: "A1", label: "A1 - Agricultural" },
  { value: "OS", label: "OS - Open Space" },
  { value: "PF", label: "PF - Public Facility" }
];

export const COMPLEXITY_OPTIONS = [
  { value: "0.8", label: "Simple (0.8×)" },
  { value: "1", label: "Standard (1.0×)" },
  { value: "1.2", label: "Complex (1.2×)" },
  { value: "1.5", label: "Custom (1.5×)" }
];

export const complexityLevels = [
  { value: "Low", label: "Low Complexity (0.9×)" },
  { value: "Medium", label: "Medium Complexity (1.0×)" },
  { value: "High", label: "High Complexity (1.1×)" },
  { value: "Custom", label: "Custom Complexity" }
];

export const ASSESSMENT_YEARS = [
  { value: "2025", label: "2025" },
  { value: "2024", label: "2024" },
  { value: "2023", label: "2023" },
  { value: "2022", label: "2022" },
  { value: "2021", label: "2021" }
];

export const CONDITION_TYPES = [
  { value: "Exc", label: "Excellent" },
  { value: "Good", label: "Good" },
  { value: "Avg", label: "Average" },
  { value: "Fair", label: "Fair" },
  { value: "Chp", label: "Cheap" }
];

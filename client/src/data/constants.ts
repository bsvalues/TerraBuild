export const APP_NAME = "Benton County Building Cost Assessment System";
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

// Building Cost Calculator Constants - Benton County Specific
export const REGIONS = [
  { value: "Corvallis", label: "Corvallis" },
  { value: "Albany", label: "Albany" },
  { value: "Philomath", label: "Philomath" },
  { value: "Monroe", label: "Monroe" },
  { value: "North_County", label: "North County" },
  { value: "South_County", label: "South County" }
];

export const BUILDING_TYPES = [
  { value: "Residential", label: "Residential" },
  { value: "Commercial", label: "Commercial" },
  { value: "Industrial", label: "Industrial" },
  { value: "Farm", label: "Farm" },
  { value: "Mixed_Use", label: "Mixed Use" }
];

export const PROPERTY_CLASSES = [
  { value: "100", label: "100 - Residential" },
  { value: "101", label: "101 - Single Family Residence" },
  { value: "103", label: "103 - Residential Condo" },
  { value: "200", label: "200 - Commercial" },
  { value: "201", label: "201 - Commercial Store" },
  { value: "300", label: "300 - Industrial" },
  { value: "400", label: "400 - Tract" },
  { value: "500", label: "500 - Farm" },
  { value: "600", label: "600 - Multi-Family" },
  { value: "700", label: "700 - Recreational" }
];

export const COMPLEXITY_OPTIONS = [
  { value: "0.8", label: "Simple (0.8×)" },
  { value: "1", label: "Standard (1.0×)" },
  { value: "1.2", label: "Complex (1.2×)" },
  { value: "1.5", label: "Custom (1.5×)" }
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

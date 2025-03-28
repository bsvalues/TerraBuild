export const APP_NAME = "BCBS Building Cost";
export const APP_VERSION = "1.2.0";

export const API_METHODS = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  DELETE: "DELETE",
  PATCH: "PATCH"
};

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
  { label: "Last Deployment", value: "Today at 10:45 AM" },
  { label: "Node Version", value: "16.13.1" },
  { label: "Database", value: "PostgreSQL 14" }
];

export const TEST_USERS = [
  { id: 1, name: "Admin User" },
  { id: 2, name: "Standard User" },
  { id: 3, name: "Read-only User" }
];

export const EXPIRATION_OPTIONS = [
  { value: "4h", label: "4 hours" },
  { value: "8h", label: "8 hours" },
  { value: "24h", label: "24 hours" },
  { value: "never", label: "Never (Development Only)" }
];

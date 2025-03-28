import { 
  users, type User, type InsertUser,
  environments, type Environment, type InsertEnvironment,
  apiEndpoints, type ApiEndpoint, type InsertApiEndpoint,
  settings, type Setting, type InsertSetting,
  activities, type Activity, type InsertActivity,
  repositoryStatus, type RepositoryStatus, type InsertRepositoryStatus,
  buildingCosts, type BuildingCost, type InsertBuildingCost,
  costFactors, type CostFactor, type InsertCostFactor
} from "@shared/schema";

// Storage interface
export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<void>;
  
  // Environments
  getAllEnvironments(): Promise<Environment[]>;
  getEnvironment(id: number): Promise<Environment | undefined>;
  createEnvironment(env: InsertEnvironment): Promise<Environment>;
  
  // API Endpoints
  getAllApiEndpoints(): Promise<ApiEndpoint[]>;
  getApiEndpoint(id: number): Promise<ApiEndpoint | undefined>;
  createApiEndpoint(endpoint: InsertApiEndpoint): Promise<ApiEndpoint>;
  updateApiEndpointStatus(id: number, status: string): Promise<ApiEndpoint | undefined>;
  deleteApiEndpoint(id: number): Promise<void>;
  
  // Settings
  getAllSettings(): Promise<Setting[]>;
  getSetting(key: string): Promise<Setting | undefined>;
  updateSetting(key: string, value: string): Promise<Setting | undefined>;
  createSetting(setting: InsertSetting): Promise<Setting>;
  
  // Activities
  getAllActivities(): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Repository Status
  getRepositoryStatus(): Promise<RepositoryStatus | undefined>;
  createRepositoryStatus(repoStatus: InsertRepositoryStatus): Promise<RepositoryStatus>;
  updateRepositoryStatus(id: number, status: string, steps: any[]): Promise<RepositoryStatus | undefined>;
  
  // Building Costs
  getAllBuildingCosts(): Promise<BuildingCost[]>;
  getBuildingCost(id: number): Promise<BuildingCost | undefined>;
  createBuildingCost(cost: InsertBuildingCost): Promise<BuildingCost>;
  updateBuildingCost(id: number, cost: Partial<InsertBuildingCost>): Promise<BuildingCost | undefined>;
  deleteBuildingCost(id: number): Promise<void>;
  
  // Cost Factors
  getAllCostFactors(): Promise<CostFactor[]>;
  getCostFactorsByRegionAndType(region: string, buildingType: string): Promise<CostFactor | undefined>;
  createCostFactor(factor: InsertCostFactor): Promise<CostFactor>;
  updateCostFactor(id: number, factor: Partial<InsertCostFactor>): Promise<CostFactor | undefined>;
  deleteCostFactor(id: number): Promise<void>;
}

// Memory Storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private environments: Map<number, Environment>;
  private apiEndpoints: Map<number, ApiEndpoint>;
  private settings: Map<number, Setting>;
  private activities: Map<number, Activity>;
  private repositoryStatuses: Map<number, RepositoryStatus>;
  
  private currentUserId: number;
  private currentEnvironmentId: number;
  private currentApiEndpointId: number;
  private currentSettingId: number;
  private currentActivityId: number;
  private currentRepositoryStatusId: number;
  
  constructor() {
    this.users = new Map();
    this.environments = new Map();
    this.apiEndpoints = new Map();
    this.settings = new Map();
    this.activities = new Map();
    this.repositoryStatuses = new Map();
    
    this.currentUserId = 1;
    this.currentEnvironmentId = 1;
    this.currentApiEndpointId = 1;
    this.currentSettingId = 1;
    this.currentActivityId = 1;
    this.currentRepositoryStatusId = 1;
    
    // Initialize with sample data
    this.initializeData();
  }
  
  private initializeData() {
    // Add admin user
    this.createUser({
      username: "admin",
      password: "password", // In a real app, this would be hashed
      role: "admin",
      name: "Admin User",
      isActive: true
    });
    
    // Add environments
    this.createEnvironment({ name: "Development", isActive: true });
    this.createEnvironment({ name: "Staging", isActive: true });
    this.createEnvironment({ name: "Production", isActive: true });
    
    // Add API endpoints
    this.createApiEndpoint({ 
      path: "/api/costs", 
      method: "GET", 
      status: "online", 
      requiresAuth: true 
    });
    
    this.createApiEndpoint({ 
      path: "/api/costs/{id}", 
      method: "GET", 
      status: "online", 
      requiresAuth: true 
    });
    
    this.createApiEndpoint({ 
      path: "/api/costs", 
      method: "POST", 
      status: "online", 
      requiresAuth: true 
    });
    
    this.createApiEndpoint({ 
      path: "/api/costs/{id}", 
      method: "PUT", 
      status: "degraded", 
      requiresAuth: true 
    });
    
    this.createApiEndpoint({ 
      path: "/api/costs/{id}", 
      method: "DELETE", 
      status: "online", 
      requiresAuth: true 
    });
    
    // Add settings
    this.createSetting({ key: "SAAS_MODE", value: "true", type: "boolean" });
    this.createSetting({ key: "DEV_AUTOLOGIN", value: "true", type: "boolean" });
    this.createSetting({ key: "DEBUG_MODE", value: "false", type: "boolean" });
    this.createSetting({ key: "API_RATE_LIMITING", value: "true", type: "boolean" });
    this.createSetting({ key: "DEV_AUTH_TOKEN", value: "dev_tk_7f9a8b3c2d1e0f4a5b6c7d8e9f0a1b2c3d4e5f6", type: "string" });
    
    // Add activities
    this.createActivity({ 
      action: "Repository cloned successfully", 
      icon: "ri-git-commit-line", 
      iconColor: "primary" 
    });
    
    this.createActivity({ 
      action: "SaaS configuration applied", 
      icon: "ri-settings-3-line", 
      iconColor: "success" 
    });
    
    this.createActivity({ 
      action: "Development autologin enabled", 
      icon: "ri-user-settings-line", 
      iconColor: "warning" 
    });
    
    // Add repository status
    this.createRepositoryStatus({
      sourceRepo: "bsvalues/BSBuildingCost",
      targetRepo: "yourteam/BSBuildingCost",
      status: "complete",
      steps: [
        { name: "Repository cloned successfully", completed: true },
        { name: "Dependencies installed", completed: true },
        { name: "Environment configured", completed: true },
        { name: "Build completed", completed: true },
        { name: "Application deployed", completed: true }
      ]
    });
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<void> {
    this.users.delete(id);
  }
  
  // Environments
  async getAllEnvironments(): Promise<Environment[]> {
    return Array.from(this.environments.values());
  }
  
  async getEnvironment(id: number): Promise<Environment | undefined> {
    return this.environments.get(id);
  }
  
  async createEnvironment(env: InsertEnvironment): Promise<Environment> {
    const id = this.currentEnvironmentId++;
    const environment: Environment = { ...env, id };
    this.environments.set(id, environment);
    return environment;
  }
  
  // API Endpoints
  async getAllApiEndpoints(): Promise<ApiEndpoint[]> {
    return Array.from(this.apiEndpoints.values());
  }
  
  async getApiEndpoint(id: number): Promise<ApiEndpoint | undefined> {
    return this.apiEndpoints.get(id);
  }
  
  async createApiEndpoint(endpoint: InsertApiEndpoint): Promise<ApiEndpoint> {
    const id = this.currentApiEndpointId++;
    const createdAt = new Date();
    const apiEndpoint: ApiEndpoint = { ...endpoint, id, createdAt };
    this.apiEndpoints.set(id, apiEndpoint);
    return apiEndpoint;
  }
  
  async updateApiEndpointStatus(id: number, status: string): Promise<ApiEndpoint | undefined> {
    const endpoint = this.apiEndpoints.get(id);
    if (!endpoint) return undefined;
    
    const updatedEndpoint = { ...endpoint, status };
    this.apiEndpoints.set(id, updatedEndpoint);
    return updatedEndpoint;
  }
  
  async deleteApiEndpoint(id: number): Promise<void> {
    this.apiEndpoints.delete(id);
  }
  
  // Settings
  async getAllSettings(): Promise<Setting[]> {
    return Array.from(this.settings.values());
  }
  
  async getSetting(key: string): Promise<Setting | undefined> {
    return Array.from(this.settings.values()).find(setting => setting.key === key);
  }
  
  async updateSetting(key: string, value: string): Promise<Setting | undefined> {
    const setting = Array.from(this.settings.values()).find(s => s.key === key);
    if (!setting) return undefined;
    
    const updatedSetting = { ...setting, value };
    this.settings.set(setting.id, updatedSetting);
    return updatedSetting;
  }
  
  async createSetting(setting: InsertSetting): Promise<Setting> {
    const id = this.currentSettingId++;
    const newSetting: Setting = { ...setting, id };
    this.settings.set(id, newSetting);
    return newSetting;
  }
  
  // Activities
  async getAllActivities(): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
  
  async createActivity(activity: InsertActivity): Promise<Activity> {
    const id = this.currentActivityId++;
    const timestamp = new Date();
    const newActivity: Activity = { ...activity, id, timestamp };
    this.activities.set(id, newActivity);
    return newActivity;
  }
  
  // Repository Status
  async getRepositoryStatus(): Promise<RepositoryStatus | undefined> {
    return Array.from(this.repositoryStatuses.values())[0];
  }
  
  async createRepositoryStatus(repoStatus: InsertRepositoryStatus): Promise<RepositoryStatus> {
    const id = this.currentRepositoryStatusId++;
    const clonedAt = new Date();
    const newRepoStatus: RepositoryStatus = { ...repoStatus, id, clonedAt };
    this.repositoryStatuses.set(id, newRepoStatus);
    return newRepoStatus;
  }
  
  async updateRepositoryStatus(id: number, status: string, steps: any[]): Promise<RepositoryStatus | undefined> {
    const repoStatus = this.repositoryStatuses.get(id);
    if (!repoStatus) return undefined;
    
    const updatedRepoStatus = { ...repoStatus, status, steps };
    this.repositoryStatuses.set(id, updatedRepoStatus);
    return updatedRepoStatus;
  }
  
  // Building Costs
  async getAllBuildingCosts(): Promise<BuildingCost[]> {
    return [];
  }
  
  async getBuildingCost(id: number): Promise<BuildingCost | undefined> {
    return undefined;
  }
  
  async createBuildingCost(cost: InsertBuildingCost): Promise<BuildingCost> {
    throw new Error('Building costs not implemented in MemStorage');
  }
  
  async updateBuildingCost(id: number, cost: Partial<InsertBuildingCost>): Promise<BuildingCost | undefined> {
    return undefined;
  }
  
  async deleteBuildingCost(id: number): Promise<void> {
    // No-op
  }
  
  // Cost Factors
  async getAllCostFactors(): Promise<CostFactor[]> {
    return [];
  }
  
  async getCostFactorsByRegionAndType(region: string, buildingType: string): Promise<CostFactor | undefined> {
    return undefined;
  }
  
  async createCostFactor(factor: InsertCostFactor): Promise<CostFactor> {
    throw new Error('Cost factors not implemented in MemStorage');
  }
  
  async updateCostFactor(id: number, factor: Partial<InsertCostFactor>): Promise<CostFactor | undefined> {
    return undefined;
  }
  
  async deleteCostFactor(id: number): Promise<void> {
    // No-op
  }
}

// The storage implementation is provided in storage-implementation.ts
export { storage } from './storage-implementation';

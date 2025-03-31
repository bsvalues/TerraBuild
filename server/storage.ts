import { 
  users, type User, type InsertUser,
  environments, type Environment, type InsertEnvironment,
  apiEndpoints, type ApiEndpoint, type InsertApiEndpoint,
  settings, type Setting, type InsertSetting,
  activities, type Activity, type InsertActivity,
  repositoryStatus, type RepositoryStatus, type InsertRepositoryStatus,
  buildingCosts, type BuildingCost, type InsertBuildingCost,
  costFactors, type CostFactor, type InsertCostFactor,
  materialTypes, type MaterialType, type InsertMaterialType,
  materialCosts, type MaterialCost, type InsertMaterialCost,
  buildingCostMaterials, type BuildingCostMaterial, type InsertBuildingCostMaterial,
  calculationHistory, type CalculationHistory, type InsertCalculationHistory
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
  
  // Material Types
  getAllMaterialTypes(): Promise<MaterialType[]>;
  getMaterialType(id: number): Promise<MaterialType | undefined>;
  getMaterialTypeByCode(code: string): Promise<MaterialType | undefined>;
  createMaterialType(materialType: InsertMaterialType): Promise<MaterialType>;
  updateMaterialType(id: number, materialType: Partial<InsertMaterialType>): Promise<MaterialType | undefined>;
  deleteMaterialType(id: number): Promise<void>;
  
  // Material Costs
  getAllMaterialCosts(): Promise<MaterialCost[]>;
  getMaterialCostsByBuildingType(buildingType: string): Promise<MaterialCost[]>;
  getMaterialCostsByRegion(region: string): Promise<MaterialCost[]>;
  getMaterialCostsByBuildingTypeAndRegion(buildingType: string, region: string): Promise<MaterialCost[]>;
  getMaterialCost(id: number): Promise<MaterialCost | undefined>;
  createMaterialCost(materialCost: InsertMaterialCost): Promise<MaterialCost>;
  updateMaterialCost(id: number, materialCost: Partial<InsertMaterialCost>): Promise<MaterialCost | undefined>;
  deleteMaterialCost(id: number): Promise<void>;
  
  // Building Cost Materials
  getBuildingCostMaterials(buildingCostId: number): Promise<BuildingCostMaterial[]>;
  createBuildingCostMaterial(material: InsertBuildingCostMaterial): Promise<BuildingCostMaterial>;
  deleteAllBuildingCostMaterials(buildingCostId: number): Promise<void>;
  
  // Calculate Materials Breakdown
  calculateMaterialsBreakdown(region: string, buildingType: string, squareFootage: number, complexityMultiplier?: number): Promise<any>;
  
  // Calculation History
  getAllCalculationHistory(): Promise<CalculationHistory[]>;
  getCalculationHistoryByUserId(userId: number): Promise<CalculationHistory[]>;
  getCalculationHistory(id: number): Promise<CalculationHistory | undefined>;
  createCalculationHistory(calculation: InsertCalculationHistory): Promise<CalculationHistory>;
  deleteCalculationHistory(id: number): Promise<void>;
}

// Memory Storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private environments: Map<number, Environment>;
  private apiEndpoints: Map<number, ApiEndpoint>;
  private settings: Map<number, Setting>;
  private activities: Map<number, Activity>;
  private repositoryStatuses: Map<number, RepositoryStatus>;
  private materialTypes: Map<number, MaterialType>;
  private materialCosts: Map<number, MaterialCost>;
  private buildingCostMaterials: Map<number, BuildingCostMaterial>;
  private calculationHistories: Map<number, CalculationHistory>;
  
  private currentUserId: number;
  private currentEnvironmentId: number;
  private currentApiEndpointId: number;
  private currentSettingId: number;
  private currentActivityId: number;
  private currentRepositoryStatusId: number;
  private currentMaterialTypeId: number;
  private currentMaterialCostId: number;
  private currentBuildingCostMaterialId: number;
  private currentCalculationHistoryId: number;
  
  constructor() {
    this.users = new Map();
    this.environments = new Map();
    this.apiEndpoints = new Map();
    this.settings = new Map();
    this.activities = new Map();
    this.repositoryStatuses = new Map();
    this.materialTypes = new Map();
    this.materialCosts = new Map();
    this.buildingCostMaterials = new Map();
    this.calculationHistories = new Map();
    
    this.currentUserId = 1;
    this.currentEnvironmentId = 1;
    this.currentApiEndpointId = 1;
    this.currentSettingId = 1;
    this.currentActivityId = 1;
    this.currentRepositoryStatusId = 1;
    this.currentMaterialTypeId = 1;
    this.currentMaterialCostId = 1;
    this.currentBuildingCostMaterialId = 1;
    this.currentCalculationHistoryId = 1;
    
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
    
    this.createApiEndpoint({ 
      path: "/api/materials/types", 
      method: "GET", 
      status: "online", 
      requiresAuth: true 
    });
    
    this.createApiEndpoint({ 
      path: "/api/materials/costs", 
      method: "GET", 
      status: "online", 
      requiresAuth: true 
    });
    
    this.createApiEndpoint({ 
      path: "/api/costs/calculate-materials", 
      method: "POST", 
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
    
    this.createActivity({ 
      action: "Material breakdown calculation added", 
      icon: "ri-layout-grid-line", 
      iconColor: "primary" 
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

    // Add material types
    this.createMaterialType({
      name: "Concrete",
      code: "CONCRETE",
      description: "Foundation and structural concrete",
      unit: "sqft"
    });

    this.createMaterialType({
      name: "Steel",
      code: "STEEL",
      description: "Structural steel and metal framing",
      unit: "sqft"
    });

    this.createMaterialType({
      name: "Lumber",
      code: "LUMBER",
      description: "Wood framing and finishing",
      unit: "sqft"
    });

    this.createMaterialType({
      name: "Drywall",
      code: "DRYWALL",
      description: "Interior wall and ceiling finishes",
      unit: "sqft"
    });

    this.createMaterialType({
      name: "Insulation",
      code: "INSULATION",
      description: "Thermal and acoustic insulation",
      unit: "sqft"
    });

    this.createMaterialType({
      name: "Roofing",
      code: "ROOFING",
      description: "Roofing materials and installation",
      unit: "sqft"
    });

    this.createMaterialType({
      name: "Electrical",
      code: "ELECTRICAL",
      description: "Electrical systems and fixtures",
      unit: "sqft"
    });

    this.createMaterialType({
      name: "Plumbing",
      code: "PLUMBING",
      description: "Plumbing systems and fixtures",
      unit: "sqft"
    });

    this.createMaterialType({
      name: "HVAC",
      code: "HVAC",
      description: "Heating, ventilation, and air conditioning",
      unit: "sqft"
    });

    this.createMaterialType({
      name: "Flooring",
      code: "FLOORING",
      description: "Floor finishes including tile, carpet, and hardwood",
      unit: "sqft"
    });
    
    // Add a material cost for each type for each building type and region combination
    const buildingTypes = ["Commercial", "Residential", "Industrial"];
    const regions = ["Northeast", "Midwest", "South", "West"];
    
    for (let i = 1; i <= 10; i++) {
      for (const buildingType of buildingTypes) {
        for (const region of regions) {
          let costMultiplier = 1.0;
          let percentageTotal = 0;
          
          // Adjust cost multiplier based on region and building type
          if (region === "Northeast") costMultiplier = 1.2;
          if (region === "West") costMultiplier = 1.15;
          if (region === "Midwest") costMultiplier = 0.95;
          if (region === "South") costMultiplier = 0.9;
          
          if (buildingType === "Commercial") costMultiplier *= 1.25;
          if (buildingType === "Industrial") costMultiplier *= 1.1;
          
          let defaultPercentage = 10;
          
          // Adjust percentage based on material type and building type
          if (i <= 3) { // Structural materials get higher percentage for industrial
            defaultPercentage = buildingType === "Industrial" ? 15 : 12;
          } else if (i >= 7 && i <= 9) { // MEP systems get higher percentage for commercial
            defaultPercentage = buildingType === "Commercial" ? 12 : 10;
          } else if (i > 9) { // Finishes get higher percentage for residential
            defaultPercentage = buildingType === "Residential" ? 12 : 8;
          }
          
          // Make sure percentages don't exceed 100% total
          if (percentageTotal + defaultPercentage > 100) {
            defaultPercentage = 100 - percentageTotal;
          }
          
          percentageTotal += defaultPercentage;
          
          this.createMaterialCost({
            materialTypeId: i,
            buildingType,
            region,
            costPerUnit: (i * 5 * costMultiplier).toFixed(2) as any,
            defaultPercentage: defaultPercentage.toFixed(1) as any
          });
        }
      }
    }
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

  // Material Types
  async getAllMaterialTypes(): Promise<MaterialType[]> {
    return Array.from(this.materialTypes.values());
  }

  async getMaterialType(id: number): Promise<MaterialType | undefined> {
    return this.materialTypes.get(id);
  }

  async getMaterialTypeByCode(code: string): Promise<MaterialType | undefined> {
    return Array.from(this.materialTypes.values()).find(
      (materialType) => materialType.code === code
    );
  }

  async createMaterialType(materialType: InsertMaterialType): Promise<MaterialType> {
    const id = this.currentMaterialTypeId++;
    const createdAt = new Date();
    const newMaterialType: MaterialType = { ...materialType, id, createdAt };
    this.materialTypes.set(id, newMaterialType);
    return newMaterialType;
  }

  async updateMaterialType(id: number, materialType: Partial<InsertMaterialType>): Promise<MaterialType | undefined> {
    const existingMaterialType = this.materialTypes.get(id);
    if (!existingMaterialType) return undefined;
    
    const updatedMaterialType = { ...existingMaterialType, ...materialType };
    this.materialTypes.set(id, updatedMaterialType);
    return updatedMaterialType;
  }

  async deleteMaterialType(id: number): Promise<void> {
    this.materialTypes.delete(id);
  }

  // Material Costs
  async getAllMaterialCosts(): Promise<MaterialCost[]> {
    return Array.from(this.materialCosts.values());
  }

  async getMaterialCostsByBuildingType(buildingType: string): Promise<MaterialCost[]> {
    return Array.from(this.materialCosts.values()).filter(
      (cost) => cost.buildingType === buildingType
    );
  }

  async getMaterialCostsByRegion(region: string): Promise<MaterialCost[]> {
    return Array.from(this.materialCosts.values()).filter(
      (cost) => cost.region === region
    );
  }

  async getMaterialCostsByBuildingTypeAndRegion(buildingType: string, region: string): Promise<MaterialCost[]> {
    return Array.from(this.materialCosts.values()).filter(
      (cost) => cost.buildingType === buildingType && cost.region === region
    );
  }

  async getMaterialCost(id: number): Promise<MaterialCost | undefined> {
    return this.materialCosts.get(id);
  }

  async createMaterialCost(materialCost: InsertMaterialCost): Promise<MaterialCost> {
    const id = this.currentMaterialCostId++;
    const createdAt = new Date();
    const updatedAt = new Date();
    const newMaterialCost: MaterialCost = { ...materialCost, id, createdAt, updatedAt };
    this.materialCosts.set(id, newMaterialCost);
    return newMaterialCost;
  }

  async updateMaterialCost(id: number, materialCost: Partial<InsertMaterialCost>): Promise<MaterialCost | undefined> {
    const existingMaterialCost = this.materialCosts.get(id);
    if (!existingMaterialCost) return undefined;
    
    const updatedAt = new Date();
    const updatedMaterialCost = { ...existingMaterialCost, ...materialCost, updatedAt };
    this.materialCosts.set(id, updatedMaterialCost);
    return updatedMaterialCost;
  }

  async deleteMaterialCost(id: number): Promise<void> {
    this.materialCosts.delete(id);
  }

  // Building Cost Materials
  async getBuildingCostMaterials(buildingCostId: number): Promise<BuildingCostMaterial[]> {
    return Array.from(this.buildingCostMaterials.values()).filter(
      (material) => material.buildingCostId === buildingCostId
    );
  }

  async createBuildingCostMaterial(material: InsertBuildingCostMaterial): Promise<BuildingCostMaterial> {
    const id = this.currentBuildingCostMaterialId++;
    const createdAt = new Date();
    const newMaterial: BuildingCostMaterial = { ...material, id, createdAt };
    this.buildingCostMaterials.set(id, newMaterial);
    return newMaterial;
  }

  async deleteAllBuildingCostMaterials(buildingCostId: number): Promise<void> {
    const materialsToDelete = Array.from(this.buildingCostMaterials.values())
      .filter((material) => material.buildingCostId === buildingCostId)
      .map((material) => material.id);
    
    for (const id of materialsToDelete) {
      this.buildingCostMaterials.delete(id);
    }
  }

  // Calculate Materials Breakdown
  async calculateMaterialsBreakdown(
    region: string, 
    buildingType: string, 
    squareFootage: number, 
    complexityMultiplier: number = 1
  ): Promise<any> {
    // Stub implementation for memory storage
    // In a real implementation, this would calculate based on the material costs
    const materialCosts = await this.getMaterialCostsByBuildingTypeAndRegion(buildingType, region);
    
    if (materialCosts.length === 0) {
      throw new Error(`No material costs found for ${buildingType} in ${region}`);
    }
    
    const costFactor = await this.getCostFactorsByRegionAndType(region, buildingType);
    if (!costFactor) {
      throw new Error(`No cost factors found for ${buildingType} in ${region}`);
    }
    
    const baseCost = Number(costFactor.baseCost);
    const regionFactor = Number(costFactor.regionFactor);
    const complexityFactorValue = Number(costFactor.complexityFactor) * complexityMultiplier;
    
    const costPerSqft = baseCost * regionFactor * complexityFactorValue;
    const totalCost = costPerSqft * squareFootage;
    
    // Calculate material breakdown
    const materials = await Promise.all(materialCosts.map(async (materialCost) => {
      const materialType = await this.getMaterialType(materialCost.materialTypeId);
      if (!materialType) return null;
      
      const percentage = Number(materialCost.defaultPercentage);
      const materialTotalCost = (totalCost * percentage) / 100;
      const quantity = (squareFootage * percentage) / 100;
      
      return {
        id: materialCost.id,
        materialTypeId: materialCost.materialTypeId,
        materialName: materialType.name,
        materialCode: materialType.code,
        percentage,
        costPerUnit: Number(materialCost.costPerUnit),
        quantity,
        totalCost: materialTotalCost
      };
    }));
    
    return {
      region,
      buildingType,
      squareFootage,
      costPerSqft,
      totalCost,
      baseCost,
      regionFactor,
      complexityFactor: complexityFactorValue,
      materials: materials.filter(Boolean)
    };
  }
  
  // Calculation History Methods
  async getAllCalculationHistory(): Promise<CalculationHistory[]> {
    return Array.from(this.calculationHistories.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async getCalculationHistoryByUserId(userId: number): Promise<CalculationHistory[]> {
    return Array.from(this.calculationHistories.values())
      .filter(calc => calc.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async getCalculationHistory(id: number): Promise<CalculationHistory | undefined> {
    return this.calculationHistories.get(id);
  }
  
  async createCalculationHistory(calculation: InsertCalculationHistory): Promise<CalculationHistory> {
    const id = this.currentCalculationHistoryId++;
    const createdAt = new Date();
    const newCalculation: CalculationHistory = { ...calculation, id, createdAt };
    this.calculationHistories.set(id, newCalculation);
    return newCalculation;
  }
  
  async deleteCalculationHistory(id: number): Promise<void> {
    this.calculationHistories.delete(id);
  }
}

// The storage implementation is provided in storage-implementation.ts
export { storage } from './storage-implementation';

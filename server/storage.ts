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
  calculationHistory, type CalculationHistory, type InsertCalculationHistory,
  costMatrix, type CostMatrix, type InsertCostMatrix,
  costFactorPresets, type CostFactorPreset, type InsertCostFactorPreset,
  fileUploads, type FileUpload, type InsertFileUpload,
  whatIfScenarios, type WhatIfScenario, type InsertWhatIfScenario,
  scenarioVariations, type ScenarioVariation, type InsertScenarioVariation,
  sharedProjects, type SharedProject, type InsertSharedProject,
  projectMembers, type ProjectMember, type InsertProjectMember,
  projectItems, type ProjectItem, type InsertProjectItem,
  comments, type Comment, type InsertComment,
  projectInvitations, type ProjectInvitation, type InsertProjectInvitation,
  sharedLinks, type SharedLink, type InsertSharedLink,
  projectActivities, type ProjectActivity, type InsertProjectActivity,
  connectionHistory, type ConnectionHistory, type InsertConnectionHistory,
  syncSchedules, type SyncSchedule, type InsertSyncSchedule,
  syncHistory, type SyncHistory, type InsertSyncHistory
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
  
  // Sync Schedules
  getAllSyncSchedules(): Promise<SyncSchedule[]>;
  getSyncSchedulesByConnection(connectionId: number): Promise<SyncSchedule[]>;
  getSyncScheduleByName(connectionId: number, name: string): Promise<SyncSchedule | undefined>;
  getEnabledSyncSchedules(): Promise<SyncSchedule[]>;
  getSyncSchedule(id: number): Promise<SyncSchedule | undefined>;
  createSyncSchedule(schedule: InsertSyncSchedule): Promise<SyncSchedule>;
  updateSyncSchedule(id: number, schedule: Partial<InsertSyncSchedule>): Promise<SyncSchedule | undefined>;
  deleteSyncSchedule(id: number): Promise<void>;
  
  // Sync History
  getSyncHistory(limit?: number, offset?: number): Promise<SyncHistory[]>;
  getSyncHistoryByConnection(connectionId: number, limit?: number, offset?: number): Promise<SyncHistory[]>;
  getSyncHistoryBySchedule(scheduleId: number, limit?: number, offset?: number): Promise<SyncHistory[]>;
  getSyncHistoryById(id: number): Promise<SyncHistory | undefined>;
  createSyncHistory(history: InsertSyncHistory): Promise<SyncHistory>;
  updateSyncHistory(id: number, history: Partial<InsertSyncHistory>): Promise<SyncHistory | undefined>;
  
  // Connection History
  createConnectionHistory(connectionHistory: InsertConnectionHistory): Promise<ConnectionHistory>;
  getConnectionHistory(options?: { connectionType?: string, limit?: number }): Promise<ConnectionHistory[]>;
  getConnectionHistoryById(id: number): Promise<ConnectionHistory | undefined>;
  
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
  
  // Cost Matrix
  getAllCostMatrix(): Promise<CostMatrix[]>;
  getCostMatrix(id: number): Promise<CostMatrix | undefined>;
  getCostMatrixByRegion(region: string): Promise<CostMatrix[]>;
  getCostMatrixByBuildingType(buildingType: string): Promise<CostMatrix[]>;
  getCostMatrixByRegionAndBuildingType(region: string, buildingType: string): Promise<CostMatrix | undefined>;
  createCostMatrix(matrix: InsertCostMatrix): Promise<CostMatrix>;
  createCostMatrixEntry(matrix: InsertCostMatrix): Promise<CostMatrix>; // Alias for createCostMatrix
  updateCostMatrix(id: number, matrix: Partial<InsertCostMatrix>): Promise<CostMatrix | undefined>;
  deleteCostMatrix(id: number): Promise<void>;
  importCostMatrixFromJson(data: any[]): Promise<{ imported: number, updated: number, errors: string[] }>;
  importCostMatrixFromExcel(fileId: number, userId: number): Promise<{ success: boolean, imported: number, updated: number, errors: string[] }>;
  
  // Benchmarking methods
  getCostMatrixByCounty(county: string): Promise<CostMatrix[]>;
  getCostMatrixByState(state: string): Promise<CostMatrix[]>;
  getAllCounties(): Promise<string[]>;
  getAllStates(): Promise<string[]>;
  getCostMatrixByFilters(filters: Record<string, any>): Promise<CostMatrix[]>;
  
  // AI and NLP methods
  getCostTrends(period?: string, buildingType?: string, region?: string): Promise<any[]>;
  getBuildingTypesByCounty(county: string): Promise<string[]>;
  getBuildingTypesByState(state: string): Promise<string[]>;
  getCountyStats(county: string): Promise<{
    minCost: number,
    maxCost: number,
    avgCost: number,
    buildingTypeCount: number
  }>;
  
  // File Uploads
  createFileUpload(fileUpload: InsertFileUpload): Promise<FileUpload>;
  getFileUpload(id: number): Promise<FileUpload | undefined>;
  getAllFileUploads(): Promise<FileUpload[]>;
  getUserFileUploads(userId: number): Promise<FileUpload[]>;
  updateFileUploadStatus(id: number, status: string, processedItems?: number, totalItems?: number, errors?: any[]): Promise<FileUpload | undefined>;
  deleteFileUpload(id: number): Promise<void>;
  
  // Excel Import
  
  // Cost Factor Presets
  getAllCostFactorPresets(): Promise<CostFactorPreset[]>;
  getCostFactorPresetsByUserId(userId: number): Promise<CostFactorPreset[]>;
  getDefaultCostFactorPresets(): Promise<CostFactorPreset[]>;
  getCostFactorPreset(id: number): Promise<CostFactorPreset | undefined>;
  createCostFactorPreset(preset: InsertCostFactorPreset): Promise<CostFactorPreset>;
  updateCostFactorPreset(id: number, preset: Partial<InsertCostFactorPreset>): Promise<CostFactorPreset | undefined>;
  deleteCostFactorPreset(id: number): Promise<void>;
  
  // What-If Scenarios
  getAllWhatIfScenarios(): Promise<WhatIfScenario[]>;
  getWhatIfScenariosByUserId(userId: number): Promise<WhatIfScenario[]>;
  getWhatIfScenario(id: number): Promise<WhatIfScenario | undefined>;
  createWhatIfScenario(scenario: InsertWhatIfScenario): Promise<WhatIfScenario>;
  updateWhatIfScenario(id: number, scenario: Partial<InsertWhatIfScenario>): Promise<WhatIfScenario | undefined>;
  deleteWhatIfScenario(id: number): Promise<void>;
  saveWhatIfScenario(id: number): Promise<WhatIfScenario | undefined>;
  
  // Scenario Variations
  getScenarioVariations(scenarioId: number): Promise<ScenarioVariation[]>;
  createScenarioVariation(variation: InsertScenarioVariation): Promise<ScenarioVariation>;
  deleteScenarioVariation(id: number): Promise<void>;
  calculateScenarioImpact(scenarioId: number): Promise<{ totalImpact: number, variations: ScenarioVariation[] }>;
  
  // Shared Projects
  getAllSharedProjects(): Promise<SharedProject[]>;
  getSharedProjectsByUser(userId: number): Promise<SharedProject[]>;
  getSharedProject(id: number): Promise<SharedProject | undefined>;
  getProject(id: number): Promise<SharedProject | undefined>;
  createSharedProject(project: InsertSharedProject): Promise<SharedProject>;
  updateSharedProject(id: number, project: Partial<InsertSharedProject>): Promise<SharedProject | undefined>;
  deleteSharedProject(id: number): Promise<void>;
  getAccessibleSharedProjects(userId: number): Promise<SharedProject[]>;
  getUserProjects(userId: number): Promise<SharedProject[]>;
  getPublicProjects(): Promise<SharedProject[]>;
  
  // Project Members
  getProjectMembers(projectId: number): Promise<ProjectMember[]>;
  getProjectMember(projectId: number, userId: number): Promise<ProjectMember | undefined>;
  isProjectMember(projectId: number, userId: number): Promise<boolean>;
  addProjectMember(member: InsertProjectMember): Promise<ProjectMember>;
  updateProjectMemberRole(projectId: number, userId: number, role: string): Promise<ProjectMember | undefined>;
  removeProjectMember(projectId: number, userId: number): Promise<void>;
  getProjectMemberById(id: number): Promise<ProjectMember | undefined>;
  updateProjectMember(id: number, data: Partial<ProjectMember>): Promise<ProjectMember | undefined>;
  getProjectMembersWithUserInfo(projectId: number): Promise<(ProjectMember & { user: { username: string, name: string | null } })[]>;
  getProjectMemberWithUserInfo(id: number): Promise<(ProjectMember & { user: { username: string, name: string | null } }) | undefined>;
  deleteAllProjectMembers(projectId: number): Promise<void>;
  removeProjectMember(id: number): Promise<void>;
  
  // Project Invitations
  getProjectInvitations(projectId: number): Promise<ProjectInvitation[]>;
  getProjectInvitation(id: number): Promise<ProjectInvitation | undefined>;
  getProjectInvitationByUserAndProject(projectId: number, userId: number): Promise<ProjectInvitation | undefined>;
  getPendingInvitationsForUser(userId: number): Promise<ProjectInvitation[]>;
  createProjectInvitation(invitation: InsertProjectInvitation): Promise<ProjectInvitation>;
  updateProjectInvitationStatus(id: number, status: string): Promise<ProjectInvitation | undefined>;
  deleteProjectInvitation(id: number): Promise<void>;
  getProjectInvitationsWithUserInfo(projectId: number): Promise<(ProjectInvitation & { user: { username: string, name: string | null } })[]>;
  
  // Project Items
  getProjectItems(projectId: number): Promise<ProjectItem[]>;
  getProjectItem(projectId: number, itemType: string, itemId: number): Promise<ProjectItem | undefined>;
  addProjectItem(item: InsertProjectItem): Promise<ProjectItem>;
  removeProjectItem(projectId: number, itemType: string, itemId: number): Promise<void>;
  getProjectItemByTypeAndId(projectId: number, itemType: string, itemId: number): Promise<ProjectItem | undefined>;
  getProjectItem(id: number): Promise<ProjectItem | undefined>;
  updateProjectItem(id: number, data: Partial<ProjectItem>): Promise<ProjectItem | undefined>;
  deleteAllProjectItems(projectId: number): Promise<void>;
  removeProjectItem(id: number): Promise<void>;
  
  // Comments
  getCommentsByTarget(targetType: string, targetId: number): Promise<Comment[]>;
  getComment(id: number): Promise<Comment | undefined>;
  createComment(comment: InsertComment): Promise<Comment>;
  updateComment(id: number, data: Partial<Comment>): Promise<Comment | undefined>;
  deleteComment(id: number): Promise<void>;
  getCommentWithUserInfo(id: number): Promise<(Comment & { user: { username: string, name: string | null } }) | undefined>;
  getCommentsByTargetWithUserInfo(targetType: string, targetId: number): Promise<(Comment & { user: { username: string, name: string | null } })[]>;
  
  // Shared Links
  getSharedLinks(projectId: number): Promise<SharedLink[]>;
  getSharedLinksByProject(projectId: number): Promise<SharedLink[]>;
  getSharedLink(id: number): Promise<SharedLink | undefined>;
  getSharedLinkByToken(token: string): Promise<SharedLink | undefined>;
  createSharedLink(link: InsertSharedLink): Promise<SharedLink>;
  updateSharedLink(id: number, data: Partial<SharedLink>): Promise<SharedLink | undefined>;
  deleteSharedLink(id: number): Promise<void>;
  deleteAllSharedLinks(projectId: number): Promise<void>;
  
  // Project Activities
  getProjectActivities(projectId: number): Promise<ProjectActivity[]>;
  getProjectActivitiesWithUserInfo(projectId: number): Promise<(ProjectActivity & { user: { username: string, name: string | null } })[]>;
  getProjectActivity(id: number): Promise<ProjectActivity | undefined>;
  createProjectActivity(activity: InsertProjectActivity): Promise<ProjectActivity>;
  

  
  // FTP Connections (extended from existing connections)
  getFTPConnection(id: number): Promise<any | undefined>;
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
  private whatIfScenarios: Map<number, WhatIfScenario>;
  private scenarioVariations: Map<number, ScenarioVariation>;
  private calculationHistories: Map<number, CalculationHistory>;
  private fileUploads: Map<number, FileUpload>;
  private sharedProjects: Map<number, SharedProject>;
  private projectMembers: Map<number, ProjectMember>;
  private projectInvitations: Map<number, ProjectInvitation>;
  private projectItems: Map<number, ProjectItem>;
  private comments: Map<number, Comment>;
  private sharedLinks: Map<number, SharedLink>;
  private projectActivities: Map<number, ProjectActivity>;
  private connectionHistories: Map<number, ConnectionHistory>;
  private syncSchedules: Map<number, SyncSchedule>;
  private syncHistories: Map<number, SyncHistory>;
  
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
  private currentFileUploadId: number;
  private currentWhatIfScenarioId: number;
  private currentScenarioVariationId: number;
  private currentSharedProjectId: number;
  private currentProjectMemberId: number;
  private currentProjectInvitationId: number;
  private currentProjectItemId: number;
  private currentCommentId: number;
  private currentSharedLinkId: number;
  private currentProjectActivityId: number;
  private currentConnectionHistoryId: number;
  private currentSyncScheduleId: number = 1;
  private currentSyncHistoryId: number = 1;
  
  // Add connection history to the interface
  async createConnectionHistory(history: InsertConnectionHistory): Promise<ConnectionHistory> {
    const id = this.currentConnectionHistoryId++;
    const timestamp = new Date();
    const newHistory: ConnectionHistory = { 
      ...history, 
      id, 
      timestamp 
    };
    this.connectionHistories.set(id, newHistory);
    return newHistory;
  }
  
  async getConnectionHistory(options?: { connectionType?: string, limit?: number }): Promise<ConnectionHistory[]> {
    let histories = Array.from(this.connectionHistories.values());
    
    // Filter by connection type if provided
    if (options?.connectionType) {
      histories = histories.filter(h => h.connectionType === options.connectionType);
    }
    
    // Sort by most recent first
    histories = histories.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    // Apply limit if provided
    if (options?.limit && options.limit > 0) {
      histories = histories.slice(0, options.limit);
    }
    
    return histories;
  }
  
  async getConnectionHistoryById(id: number): Promise<ConnectionHistory | undefined> {
    return this.connectionHistories.get(id);
  }
  
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
    this.fileUploads = new Map();
    this.whatIfScenarios = new Map();
    this.scenarioVariations = new Map();
    this.sharedProjects = new Map();
    this.projectMembers = new Map();
    this.projectInvitations = new Map();
    this.projectItems = new Map();
    this.comments = new Map();
    this.sharedLinks = new Map();
    this.projectActivities = new Map();
    this.connectionHistories = new Map();
    this.syncSchedules = new Map();
    this.syncHistories = new Map();
    
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
    this.currentFileUploadId = 1;
    this.currentWhatIfScenarioId = 1;
    this.currentScenarioVariationId = 1;
    this.currentSharedProjectId = 1;
    this.currentProjectMemberId = 1;
    this.currentProjectInvitationId = 1;
    this.currentProjectItemId = 1;
    this.currentCommentId = 1;
    this.currentSharedLinkId = 1;
    this.currentProjectActivityId = 1;
    this.currentConnectionHistoryId = 1;
    this.currentSyncScheduleId = 1;
    this.currentSyncHistoryId = 1;
    
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
  
  // Cost Matrix
  private costMatrixEntries: Map<number, CostMatrix> = new Map();
  private currentCostMatrixId: number = 1;
  
  async getAllCostMatrix(): Promise<CostMatrix[]> {
    return Array.from(this.costMatrixEntries.values());
  }
  
  async getCostMatrix(id: number): Promise<CostMatrix | undefined> {
    return this.costMatrixEntries.get(id);
  }
  
  async getCostMatrixByRegion(region: string): Promise<CostMatrix[]> {
    return Array.from(this.costMatrixEntries.values())
      .filter(matrix => matrix.region === region);
  }
  
  async getCostMatrixByBuildingType(buildingType: string): Promise<CostMatrix[]> {
    return Array.from(this.costMatrixEntries.values())
      .filter(matrix => matrix.buildingType === buildingType);
  }
  
  async getCostMatrixByRegionAndBuildingType(region: string, buildingType: string): Promise<CostMatrix | undefined> {
    return Array.from(this.costMatrixEntries.values())
      .find(matrix => matrix.region === region && matrix.buildingType === buildingType);
  }
  
  async createCostMatrix(matrix: InsertCostMatrix): Promise<CostMatrix> {
    const id = this.currentCostMatrixId++;
    const createdAt = new Date();
    const updatedAt = new Date();
    
    const newMatrix: CostMatrix = {
      ...matrix,
      id,
      createdAt,
      updatedAt
    };
    
    this.costMatrixEntries.set(id, newMatrix);
    return newMatrix;
  }
  
  // Alias for createCostMatrix to support the batch API
  async createCostMatrixEntry(matrix: InsertCostMatrix): Promise<CostMatrix> {
    return this.createCostMatrix(matrix);
  }
  
  async updateCostMatrix(id: number, matrix: Partial<InsertCostMatrix>): Promise<CostMatrix | undefined> {
    const existingMatrix = this.costMatrixEntries.get(id);
    if (!existingMatrix) return undefined;
    
    const updatedMatrix: CostMatrix = {
      ...existingMatrix,
      ...matrix,
      updatedAt: new Date()
    };
    
    this.costMatrixEntries.set(id, updatedMatrix);
    return updatedMatrix;
  }
  
  async deleteCostMatrix(id: number): Promise<void> {
    this.costMatrixEntries.delete(id);
  }
  
  async importCostMatrixFromJson(data: any[]): Promise<{ imported: number; updated: number; errors: string[] }> {
    const errors: string[] = [];
    let imported = 0;
    let updated = 0;
    
    if (!Array.isArray(data)) {
      errors.push("Invalid data format: expected an array of cost matrix entries");
      return { imported, updated, errors };
    }
    
    for (const item of data) {
      try {
        if (!item.region || !item.buildingType || !item.buildingTypeDescription || 
            !item.baseCost || !item.matrixYear || !item.sourceMatrixId || 
            !item.sourceMatrixDescription) {
          errors.push(`Missing required fields for item: ${JSON.stringify(item)}`);
          continue;
        }
        
        // Convert adjustmentFactors to individual factor fields if present
        const complexityFactorBase = item.adjustmentFactors?.complexity || 1.0;
        const qualityFactorBase = item.adjustmentFactors?.quality || 1.0;
        const conditionFactorBase = item.adjustmentFactors?.condition || 1.0;
        
        const matrixEntry: InsertCostMatrix = {
          region: item.region,
          buildingType: item.buildingType,
          buildingTypeDescription: item.buildingTypeDescription,
          baseCost: item.baseCost.toString(),
          matrixYear: item.matrixYear,
          sourceMatrixId: item.matrixId,
          matrixDescription: item.matrixDescription || "",
          dataPoints: item.dataPoints || 0,
          minCost: item.minCost?.toString(),
          maxCost: item.maxCost?.toString(),
          complexityFactorBase: complexityFactorBase.toString(),
          qualityFactorBase: qualityFactorBase.toString(),
          conditionFactorBase: conditionFactorBase.toString(),
          isActive: true
        };
        
        await this.createCostMatrix(matrixEntry);
        imported++;
      } catch (error) {
        errors.push(`Error importing item: ${JSON.stringify(item)}, Error: ${error}`);
      }
    }
    
    return { imported, updated, errors };
  }
  
  // Benchmarking Methods
  async getCostMatrixByCounty(county: string): Promise<CostMatrix[]> {
    return Array.from(this.costMatrixEntries.values()).filter(
      matrix => matrix.county === county && matrix.isActive
    );
  }
  
  async getCostMatrixByState(state: string): Promise<CostMatrix[]> {
    return Array.from(this.costMatrixEntries.values()).filter(
      matrix => matrix.state === state && matrix.isActive
    );
  }
  
  async getAllCounties(): Promise<string[]> {
    const counties = new Set<string>();
    
    Array.from(this.costMatrixEntries.values())
      .filter(matrix => matrix.isActive && matrix.county)
      .forEach(matrix => counties.add(matrix.county!));
    
    return Array.from(counties);
  }
  
  async getAllStates(): Promise<string[]> {
    const states = new Set<string>();
    
    Array.from(this.costMatrixEntries.values())
      .filter(matrix => matrix.isActive && matrix.state)
      .forEach(matrix => states.add(matrix.state!));
    
    return Array.from(states);
  }
  
  async getCostMatrixByFilters(filters: Record<string, any>): Promise<CostMatrix[]> {
    return Array.from(this.costMatrixEntries.values()).filter(matrix => {
      // Start with active check
      if (!matrix.isActive) return false;
      
      // Check each filter
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && (matrix as any)[key] !== value) {
          return false;
        }
      }
      
      return true;
    });
  }
  
  async getBuildingTypesByCounty(county: string): Promise<string[]> {
    const buildingTypes = new Set<string>();
    
    Array.from(this.costMatrixEntries.values())
      .filter(matrix => matrix.county === county && matrix.isActive)
      .forEach(matrix => buildingTypes.add(matrix.buildingType));
    
    return Array.from(buildingTypes);
  }
  
  async getBuildingTypesByState(state: string): Promise<string[]> {
    const buildingTypes = new Set<string>();
    
    Array.from(this.costMatrixEntries.values())
      .filter(matrix => matrix.state === state && matrix.isActive)
      .forEach(matrix => buildingTypes.add(matrix.buildingType));
    
    return Array.from(buildingTypes);
  }
  
  async getCostTrends(): Promise<any[]> {
    const matrixEntries = Array.from(this.costMatrixEntries.values())
      .filter(matrix => matrix.isActive);
    
    if (matrixEntries.length === 0) {
      return [];
    }
    
    // Group by year and building type
    const trendsByYearAndType: Record<string, Record<string, number[]>> = {};
    
    matrixEntries.forEach(entry => {
      const year = entry.matrixYear.toString();
      const type = entry.buildingType;
      
      if (!trendsByYearAndType[year]) {
        trendsByYearAndType[year] = {};
      }
      
      if (!trendsByYearAndType[year][type]) {
        trendsByYearAndType[year][type] = [];
      }
      
      trendsByYearAndType[year][type].push(parseFloat(entry.baseCost));
    });
    
    // Convert to array of trend objects
    const trends: any[] = [];
    
    Object.entries(trendsByYearAndType).forEach(([year, typeData]) => {
      Object.entries(typeData).forEach(([buildingType, costs]) => {
        const avgCost = costs.reduce((sum, cost) => sum + cost, 0) / costs.length;
        
        trends.push({
          year: parseInt(year),
          buildingType,
          avgCost,
          minCost: Math.min(...costs),
          maxCost: Math.max(...costs),
          dataPoints: costs.length
        });
      });
    });
    
    // Sort by year ascending
    return trends.sort((a, b) => a.year - b.year);
  }
  
  async getCountyStats(county: string): Promise<{
    minCost: number,
    maxCost: number,
    avgCost: number,
    buildingTypeCount: number
  }> {
    const countyData = await this.getCostMatrixByCounty(county);
    
    if (countyData.length === 0) {
      return {
        minCost: 0,
        maxCost: 0,
        avgCost: 0,
        buildingTypeCount: 0
      };
    }
    
    const costs = countyData.map(m => Number(m.baseCost));
    const minCost = Math.min(...costs);
    const maxCost = Math.max(...costs);
    const avgCost = costs.reduce((sum, cost) => sum + cost, 0) / costs.length;
    
    // Count unique building types
    const buildingTypes = new Set<string>();
    countyData.forEach(matrix => buildingTypes.add(matrix.buildingType));
    
    return {
      minCost,
      maxCost,
      avgCost,
      buildingTypeCount: buildingTypes.size
    };
  }
  
  // Cost Factor Presets Methods
  private costFactorPresets: Map<number, CostFactorPreset> = new Map();
  private currentCostFactorPresetId: number = 1;
  
  async getAllCostFactorPresets(): Promise<CostFactorPreset[]> {
    return Array.from(this.costFactorPresets.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getCostFactorPresetsByUserId(userId: number): Promise<CostFactorPreset[]> {
    return Array.from(this.costFactorPresets.values())
      .filter(preset => preset.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getDefaultCostFactorPresets(): Promise<CostFactorPreset[]> {
    return Array.from(this.costFactorPresets.values())
      .filter(preset => preset.isDefault === true)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getCostFactorPreset(id: number): Promise<CostFactorPreset | undefined> {
    return this.costFactorPresets.get(id);
  }
  
  async createCostFactorPreset(preset: InsertCostFactorPreset): Promise<CostFactorPreset> {
    const id = this.currentCostFactorPresetId++;
    const now = new Date();
    const costFactorPreset: CostFactorPreset = {
      ...preset,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.costFactorPresets.set(id, costFactorPreset);
    return costFactorPreset;
  }
  
  async updateCostFactorPreset(id: number, preset: Partial<InsertCostFactorPreset>): Promise<CostFactorPreset | undefined> {
    const costFactorPreset = this.costFactorPresets.get(id);
    if (!costFactorPreset) return undefined;
    
    const updatedPreset = {
      ...costFactorPreset,
      ...preset,
      updatedAt: new Date()
    };
    this.costFactorPresets.set(id, updatedPreset);
    return updatedPreset;
  }
  
  async deleteCostFactorPreset(id: number): Promise<void> {
    this.costFactorPresets.delete(id);
  }
  
  // File Uploads
  async createFileUpload(fileUpload: InsertFileUpload): Promise<FileUpload> {
    const id = this.currentFileUploadId++;
    const createdAt = new Date();
    const updatedAt = new Date();
    const newFileUpload: FileUpload = { 
      ...fileUpload, 
      id, 
      createdAt,
      updatedAt,
      status: fileUpload.status || 'pending',
      processedItems: fileUpload.processedItems || 0,
      totalItems: fileUpload.totalItems || 0,
      errorCount: fileUpload.errorCount || 0,
      errors: fileUpload.errors || []
    };
    this.fileUploads.set(id, newFileUpload);
    return newFileUpload;
  }
  
  async getFileUpload(id: number): Promise<FileUpload | undefined> {
    return this.fileUploads.get(id);
  }
  
  async getAllFileUploads(): Promise<FileUpload[]> {
    return Array.from(this.fileUploads.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getUserFileUploads(userId: number): Promise<FileUpload[]> {
    return Array.from(this.fileUploads.values())
      .filter(upload => upload.uploadedBy === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async updateFileUploadStatus(
    id: number, 
    status: string, 
    processedItems?: number, 
    totalItems?: number, 
    errors?: any[]
  ): Promise<FileUpload | undefined> {
    const fileUpload = this.fileUploads.get(id);
    if (!fileUpload) return undefined;
    
    const updatedFileUpload: FileUpload = { 
      ...fileUpload, 
      status,
      updatedAt: new Date(),
      processedItems: processedItems !== undefined ? processedItems : fileUpload.processedItems,
      totalItems: totalItems !== undefined ? totalItems : fileUpload.totalItems,
      errorCount: errors ? errors.length : fileUpload.errorCount,
      errors: errors || fileUpload.errors
    };
    
    this.fileUploads.set(id, updatedFileUpload);
    return updatedFileUpload;
  }
  
  async deleteFileUpload(id: number): Promise<void> {
    this.fileUploads.delete(id);
  }
  
  // Excel Import
  async importCostMatrixFromExcel(fileId: number, userId: number): Promise<{ success: boolean; imported: number; updated: number; errors: string[] }> {
    const fileUpload = await this.getFileUpload(fileId);
    if (!fileUpload) {
      return { success: false, imported: 0, updated: 0, errors: ["File upload not found"] };
    }
    
    // Update the status to processing
    await this.updateFileUploadStatus(fileId, 'processing', 0, 100);

    try {
      // Get the actual file path from the uploads directory
      const filePath = `uploads/${fileUpload.fileName}`;
      
      // Check if file exists
      const fs = require('fs');
      if (!fs.existsSync(filePath)) {
        await this.updateFileUploadStatus(fileId, 'failed', 0, 0, [{
          message: `File not found: ${filePath}`
        }]);
        return { 
          success: false,
          imported: 0, 
          updated: 0, 
          errors: [`File not found: ${filePath}`] 
        };
      }
      
      // Using child_process to run the Python parser
      const { spawnSync } = require('child_process');
      
      const pythonProcess = spawnSync('python', [
        'enhanced_excel_parser.py', 
        filePath,
        '--output-json-only',
        '--standardize'
      ], { 
        encoding: 'utf-8'
      });
      
      if (pythonProcess.error || pythonProcess.status !== 0) {
        const errorMessage = pythonProcess.stderr || pythonProcess.error?.message || 'Unknown error running parser';
        await this.updateFileUploadStatus(fileId, 'failed', 0, 0, [{
          message: errorMessage
        }]);
        
        return { 
          success: false,
          imported: 0, 
          updated: 0, 
          errors: [errorMessage] 
        };
      }
      
      // Parse the output JSON
      let parsedData;
      try {
        parsedData = JSON.parse(pythonProcess.stdout);
        
        if (!parsedData.success) {
          await this.updateFileUploadStatus(fileId, 'failed', 0, 0, 
            parsedData.errors.map((e: any) => ({ message: e }))
          );
          
          return { 
            success: false,
            imported: 0, 
            updated: 0, 
            errors: parsedData.errors 
          };
        }
      } catch (parseError: any) {
        const errorMessage = parseError?.message || 'Unknown parsing error';
        await this.updateFileUploadStatus(fileId, 'failed', 0, 0, [{
          message: `Failed to parse output: ${errorMessage}`
        }]);
        
        return { 
          success: false,
          imported: 0, 
          updated: 0, 
          errors: [`Failed to parse output: ${errorMessage}`] 
        };
      }
      
      // Update progress to show we're starting database import
      await this.updateFileUploadStatus(fileId, 'processing', 50, 100);
      
      // Import the data to the database
      const { matrices, details, buildingTypes, regions } = parsedData.data;
      
      let imported = 0;
      let updated = 0;
      
      // Import matrices
      if (matrices && matrices.length > 0) {
        // Process each matrix
        for (const matrix of matrices) {
          // Find if matrix already exists in the in-memory storage
          const existingMatrix = Array.from(this.costMatrixEntries.values()).find(
            m => m.sourceMatrixId === matrix.matrix_id && m.matrixYear === (matrix.year || new Date().getFullYear())
          );
          
          if (existingMatrix) {
            // Update existing matrix
            const updatedMatrix = {
              ...existingMatrix,
              buildingType: matrix.building_type,
              region: matrix.region,
              buildingTypeDescription: matrix.building_type_description || existingMatrix.buildingTypeDescription,
              matrixDescription: matrix.matrix_description || existingMatrix.matrixDescription,
              updatedAt: new Date()
            };
            
            this.costMatrixEntries.set(existingMatrix.id, updatedMatrix);
            updated++;
          } else {
            // Create new matrix entry
            const matrixEntry: InsertCostMatrix = {
              region: matrix.region,
              buildingType: matrix.building_type,
              buildingTypeDescription: matrix.building_type_description || matrix.building_type,
              baseCost: matrix.base_cost?.toString() || "0.00",
              matrixYear: matrix.year || new Date().getFullYear(),
              sourceMatrixId: matrix.matrix_id,
              matrixDescription: matrix.matrix_description || "",
              dataPoints: matrix.data_points || 0,
              minCost: matrix.min_cost?.toString() || "0.00",
              maxCost: matrix.max_cost?.toString() || "0.00",
              complexityFactorBase: "1.0",
              qualityFactorBase: "1.0",
              conditionFactorBase: "1.0",
              isActive: true
            };
            
            await this.createCostMatrix(matrixEntry);
            imported++;
          }
        }
      }
      
      // Update progress
      await this.updateFileUploadStatus(fileId, 'processing', 75, 100);
      
      // Import matrix details
      if (details && details.length > 0) {
        // For simplicity in this in-memory implementation, we'll skip the matrix details
        // and just increment the imported count
        imported += details.length;
        
        // In a real implementation with a proper database schema for details, 
        // we would insert or update each detail record
      }
      
      // Update status to completed
      const totalProcessed = imported + updated;
      await this.updateFileUploadStatus(fileId, 'completed', totalProcessed, totalProcessed);
      
      // Log activity
      await this.createActivity({
        action: `Imported ${imported} and updated ${updated} cost matrix entries from Excel (${fileUpload.fileName})`,
        icon: "ri-file-excel-line",
        iconColor: "success"
      });
      
      return {
        success: true,
        imported,
        updated,
        errors: []
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error';
      
      // Update status to failed
      await this.updateFileUploadStatus(fileId, 'failed', 0, 0, [{
        message: errorMessage
      }]);
      
      // Log error activity
      await this.createActivity({
        action: `Failed to import cost matrix from Excel (${fileUpload.fileName})`,
        icon: "ri-file-excel-line",
        iconColor: "danger"
      });
      
      return {
        success: false,
        imported: 0,
        updated: 0,
        errors: [errorMessage]
      };
    }
  }

  // What-If Scenarios Methods
  async getAllWhatIfScenarios(): Promise<WhatIfScenario[]> {
    return Array.from(this.whatIfScenarios.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getWhatIfScenariosByUserId(userId: number): Promise<WhatIfScenario[]> {
    return Array.from(this.whatIfScenarios.values())
      .filter(scenario => scenario.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async getWhatIfScenario(id: number): Promise<WhatIfScenario | undefined> {
    return this.whatIfScenarios.get(id);
  }

  async createWhatIfScenario(scenario: InsertWhatIfScenario): Promise<WhatIfScenario> {
    const id = this.currentWhatIfScenarioId++;
    const createdAt = new Date();
    const updatedAt = new Date();
    const newScenario: WhatIfScenario = { 
      ...scenario, 
      id, 
      createdAt,
      updatedAt,
      isSaved: false
    };
    this.whatIfScenarios.set(id, newScenario);
    return newScenario;
  }

  async updateWhatIfScenario(id: number, scenario: Partial<InsertWhatIfScenario>): Promise<WhatIfScenario | undefined> {
    const existingScenario = this.whatIfScenarios.get(id);
    if (!existingScenario) return undefined;
    
    const updatedAt = new Date();
    const updatedScenario = { 
      ...existingScenario, 
      ...scenario, 
      updatedAt 
    };
    this.whatIfScenarios.set(id, updatedScenario);
    return updatedScenario;
  }

  async deleteWhatIfScenario(id: number): Promise<void> {
    // First delete all associated variations
    const variationsToDelete = Array.from(this.scenarioVariations.values())
      .filter(variation => variation.scenarioId === id);
    
    for (const variation of variationsToDelete) {
      this.scenarioVariations.delete(variation.id);
    }
    
    // Then delete the scenario
    this.whatIfScenarios.delete(id);
  }

  async saveWhatIfScenario(id: number): Promise<WhatIfScenario | undefined> {
    const scenario = this.whatIfScenarios.get(id);
    if (!scenario) return undefined;
    
    const updatedScenario = { 
      ...scenario, 
      isSaved: true,
      updatedAt: new Date()
    };
    this.whatIfScenarios.set(id, updatedScenario);
    return updatedScenario;
  }

  // Scenario Variations Methods
  async getScenarioVariations(scenarioId: number): Promise<ScenarioVariation[]> {
    return Array.from(this.scenarioVariations.values())
      .filter(variation => variation.scenarioId === scenarioId);
  }

  async createScenarioVariation(variation: InsertScenarioVariation): Promise<ScenarioVariation> {
    const id = this.currentScenarioVariationId++;
    const createdAt = new Date();
    const newVariation: ScenarioVariation = { ...variation, id, createdAt };
    this.scenarioVariations.set(id, newVariation);
    return newVariation;
  }

  async deleteScenarioVariation(id: number): Promise<void> {
    this.scenarioVariations.delete(id);
  }

  async calculateScenarioImpact(scenarioId: number): Promise<{ totalImpact: number, variations: ScenarioVariation[] }> {
    const variations = await this.getScenarioVariations(scenarioId);
    
    // Sum up all impact values
    let totalImpact = 0;
    for (const variation of variations) {
      totalImpact += parseFloat(variation.impactValue?.toString() || '0');
    }
    
    return { totalImpact, variations };
  }
  
  // Shared Projects
  async getAllSharedProjects(): Promise<SharedProject[]> {
    return Array.from(this.sharedProjects.values());
  }
  
  async getSharedProjectsByUser(userId: number): Promise<SharedProject[]> {
    // Get projects created by the user
    const ownedProjects = Array.from(this.sharedProjects.values()).filter(
      project => project.createdById === userId
    );
    
    // Get projects where the user is a member
    const memberProjectIds = Array.from(this.projectMembers.values())
      .filter(member => member.userId === userId)
      .map(member => member.projectId);
    
    const memberProjects = Array.from(this.sharedProjects.values()).filter(
      project => memberProjectIds.includes(project.id)
    );
    
    // Combine and remove duplicates
    const allProjects = [...ownedProjects];
    
    memberProjects.forEach(project => {
      if (!allProjects.some(p => p.id === project.id)) {
        allProjects.push(project);
      }
    });
    
    return allProjects;
  }
  
  async getSharedProject(id: number): Promise<SharedProject | undefined> {
    return this.sharedProjects.get(id);
  }
  
  async createSharedProject(project: InsertSharedProject): Promise<SharedProject> {
    const id = this.currentSharedProjectId++;
    const createdAt = new Date();
    const updatedAt = new Date();
    const sharedProject: SharedProject = { 
      ...project, 
      id, 
      createdAt, 
      updatedAt 
    };
    
    this.sharedProjects.set(id, sharedProject);
    return sharedProject;
  }
  
  async updateSharedProject(id: number, project: Partial<InsertSharedProject>): Promise<SharedProject | undefined> {
    const existingProject = this.sharedProjects.get(id);
    if (!existingProject) return undefined;
    
    const updatedAt = new Date();
    const updatedProject = { 
      ...existingProject, 
      ...project,
      updatedAt 
    };
    
    this.sharedProjects.set(id, updatedProject);
    return updatedProject;
  }
  
  async getUserProjects(userId: number): Promise<SharedProject[]> {
    // Get projects created by the user
    const ownedProjects = Array.from(this.sharedProjects.values()).filter(
      project => project.createdById === userId
    );
    
    // Get projects where the user is a member
    const memberProjectIds = Array.from(this.projectMembers.values())
      .filter(member => member.userId === userId)
      .map(member => member.projectId);
    
    const memberProjects = Array.from(this.sharedProjects.values()).filter(
      project => memberProjectIds.includes(project.id)
    );
    
    // Combine and remove duplicates
    const allProjects = [...ownedProjects];
    
    memberProjects.forEach(project => {
      if (!allProjects.some(p => p.id === project.id)) {
        allProjects.push(project);
      }
    });
    
    return allProjects;
  }
  
  async getPublicProjects(): Promise<SharedProject[]> {
    // Get all public projects
    return Array.from(this.sharedProjects.values()).filter(
      project => project.isPublic === true
    );
  }
  
  async deleteSharedProject(id: number): Promise<void> {
    // Delete project members first
    const membersToDelete = Array.from(this.projectMembers.values())
      .filter(member => member.projectId === id);
    
    membersToDelete.forEach(member => {
      this.projectMembers.delete(member.id);
    });
    
    // Delete project items
    const itemsToDelete = Array.from(this.projectItems.values())
      .filter(item => item.projectId === id);
    
    itemsToDelete.forEach(item => {
      this.projectItems.delete(item.id);
    });
    
    // Delete the project
    this.sharedProjects.delete(id);
  }
  
  // Project Members
  async getProjectMembers(projectId: number): Promise<ProjectMember[]> {
    return Array.from(this.projectMembers.values())
      .filter(member => member.projectId === projectId);
  }
  
  async getProjectMember(projectId: number, userId: number): Promise<ProjectMember | undefined> {
    return Array.from(this.projectMembers.values())
      .find(member => member.projectId === projectId && member.userId === userId);
  }
  
  async isProjectMember(projectId: number, userId: number): Promise<boolean> {
    const member = await this.getProjectMember(projectId, userId);
    return !!member;
  }
  
  async addProjectMember(member: InsertProjectMember): Promise<ProjectMember> {
    const id = this.currentProjectMemberId++;
    const joinedAt = new Date();
    const projectMember: ProjectMember = { 
      ...member, 
      id, 
      joinedAt 
    };
    
    this.projectMembers.set(id, projectMember);
    return projectMember;
  }
  
  async updateProjectMemberRole(projectId: number, userId: number, role: string): Promise<ProjectMember | undefined> {
    const member = await this.getProjectMember(projectId, userId);
    if (!member) return undefined;
    
    const updatedMember = { 
      ...member, 
      role 
    };
    
    this.projectMembers.set(member.id, updatedMember);
    return updatedMember;
  }
  
  async removeProjectMember(projectId: number, userId: number): Promise<void> {
    const member = await this.getProjectMember(projectId, userId);
    if (member) {
      this.projectMembers.delete(member.id);
    }
  }
  
  // Project Invitations
  async getProjectInvitations(projectId: number): Promise<ProjectInvitation[]> {
    return Array.from(this.projectInvitations.values()).filter(
      invitation => invitation.projectId === projectId
    );
  }
  
  async getProjectInvitation(id: number): Promise<ProjectInvitation | undefined> {
    return this.projectInvitations.get(id);
  }
  
  async getProjectInvitationByUserAndProject(projectId: number, userId: number): Promise<ProjectInvitation | undefined> {
    return Array.from(this.projectInvitations.values()).find(
      invitation => invitation.projectId === projectId && invitation.userId === userId
    );
  }
  
  async getPendingInvitationsForUser(userId: number): Promise<ProjectInvitation[]> {
    return Array.from(this.projectInvitations.values()).filter(
      invitation => invitation.userId === userId && invitation.status === "pending"
    );
  }
  
  async createProjectInvitation(invitation: InsertProjectInvitation): Promise<ProjectInvitation> {
    const id = this.currentProjectInvitationId++;
    const invitedAt = new Date();
    const newInvitation: ProjectInvitation = { 
      ...invitation, 
      id, 
      invitedAt,
      status: invitation.status || "pending"
    };
    this.projectInvitations.set(id, newInvitation);
    return newInvitation;
  }
  
  async updateProjectInvitationStatus(id: number, status: string): Promise<ProjectInvitation | undefined> {
    const invitation = this.projectInvitations.get(id);
    if (!invitation) return undefined;
    
    const updatedInvitation: ProjectInvitation = { ...invitation, status };
    this.projectInvitations.set(id, updatedInvitation);
    return updatedInvitation;
  }
  
  async deleteProjectInvitation(id: number): Promise<void> {
    this.projectInvitations.delete(id);
  }
  
  async getProjectInvitationsWithUserInfo(projectId: number): Promise<(ProjectInvitation & { user: { username: string, name: string | null } })[]> {
    const invitations = await this.getProjectInvitations(projectId);
    const invitationsWithUserInfo = await Promise.all(
      invitations.map(async invitation => {
        const user = await this.getUser(invitation.userId);
        return {
          ...invitation,
          user: {
            username: user?.username || "",
            name: user?.name
          }
        };
      })
    );
    return invitationsWithUserInfo;
  }
  
  // Project Items
  async getProjectItems(projectId: number): Promise<ProjectItem[]> {
    return Array.from(this.projectItems.values())
      .filter(item => item.projectId === projectId);
  }
  
  // Method to get project item by type and ID
  async getProjectItem(projectId: number, itemType: string, itemId: number): Promise<ProjectItem | undefined> {
    return Array.from(this.projectItems.values())
      .find(item => 
        item.projectId === projectId && 
        item.itemType === itemType && 
        item.itemId === itemId
      );
  }
  
  // Method to get a project item by just the item ID
  async getProjectItemByTypeAndId(projectId: number, itemType: string, itemId: number): Promise<ProjectItem | undefined> {
    return this.getProjectItem(projectId, itemType, itemId);
  }
  
  // Method to get a project item by just the item ID
  async getProjectItem(id: number): Promise<ProjectItem | undefined> {
    return this.projectItems.get(id);
  }
  
  async addProjectItem(item: InsertProjectItem): Promise<ProjectItem> {
    const id = this.currentProjectItemId++;
    const addedAt = new Date();
    const projectItem: ProjectItem = { 
      ...item, 
      id, 
      addedAt 
    };
    
    this.projectItems.set(id, projectItem);
    return projectItem;
  }
  
  // Method to update a project item by ID
  async updateProjectItem(id: number, data: Partial<ProjectItem>): Promise<ProjectItem | undefined> {
    const item = this.projectItems.get(id);
    if (!item) {
      return undefined;
    }
    
    const updatedItem = {
      ...item,
      ...data
    };
    
    this.projectItems.set(id, updatedItem);
    return updatedItem;
  }
  
  // Method to remove a project item by item type, project ID and item ID
  async removeProjectItem(projectId: number, itemType: string, itemId: number): Promise<void> {
    const item = await this.getProjectItem(projectId, itemType, itemId);
    if (item) {
      this.projectItems.delete(item.id);
    }
  }
  
  // Method to remove a project item by just the item ID
  async removeProjectItem(id: number): Promise<void> {
    this.projectItems.delete(id);
  }

  // Comments
  async getCommentsByTarget(targetType: string, targetId: number): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.targetType === targetType && comment.targetId === targetId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
  
  async getComment(id: number): Promise<Comment | undefined> {
    return this.comments.get(id);
  }
  
  async createComment(comment: InsertComment): Promise<Comment> {
    const id = this.currentCommentId++;
    const createdAt = new Date();
    const updatedAt = new Date();
    const isResolved = comment.isResolved || false;
    const isEdited = false;
    
    const newComment: Comment = {
      ...comment,
      id,
      createdAt,
      updatedAt,
      isResolved,
      isEdited
    };
    
    this.comments.set(id, newComment);
    return newComment;
  }
  
  async updateComment(id: number, data: Partial<Comment>): Promise<Comment | undefined> {
    const comment = this.comments.get(id);
    if (!comment) return undefined;
    
    const updatedComment: Comment = {
      ...comment,
      ...data,
      updatedAt: new Date(),
      isEdited: true
    };
    
    this.comments.set(id, updatedComment);
    return updatedComment;
  }
  
  async deleteComment(id: number): Promise<void> {
    this.comments.delete(id);
  }
  
  async getCommentWithUserInfo(id: number): Promise<(Comment & { user: { username: string, name: string | null } }) | undefined> {
    const comment = this.comments.get(id);
    if (!comment) return undefined;
    
    const user = this.users.get(comment.userId);
    if (!user) return undefined;
    
    return {
      ...comment,
      user: {
        username: user.username,
        name: user.name
      }
    };
  }
  
  async getCommentsByTargetWithUserInfo(targetType: string, targetId: number): Promise<(Comment & { user: { username: string, name: string | null } })[]> {
    const comments = await this.getCommentsByTarget(targetType, targetId);
    
    return comments.map(comment => {
      const user = this.users.get(comment.userId);
      
      return {
        ...comment,
        user: {
          username: user ? user.username : 'Unknown',
          name: user ? user.name : null
        }
      };
    });
  }

  // Shared Projects
  async getProject(id: number): Promise<SharedProject | undefined> {
    return this.sharedProjects.get(id);
  }
  
  async isProjectMember(projectId: number, userId: number): Promise<boolean> {
    return Array.from(this.projectMembers.values()).some(
      member => member.projectId === projectId && member.userId === userId
    );
  }
  
  // Shared Links
  async getSharedLinks(projectId: number): Promise<SharedLink[]> {
    return Array.from(this.sharedLinks.values())
      .filter(link => link.projectId === projectId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
  
  async getSharedLinksByProject(projectId: number): Promise<SharedLink[]> {
    return Array.from(this.sharedLinks.values())
      .filter(link => link.projectId === projectId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
  
  async getSharedLink(id: number): Promise<SharedLink | undefined> {
    return this.sharedLinks.get(id);
  }
  
  async getSharedLinkByToken(token: string): Promise<SharedLink | undefined> {
    return Array.from(this.sharedLinks.values()).find(
      (link) => link.token === token
    );
  }
  
  async createSharedLink(link: InsertSharedLink): Promise<SharedLink> {
    const id = this.currentSharedLinkId++;
    const createdAt = new Date();
    
    // Generate a random token if not provided
    const token = link.token || this.generateRandomToken();
    
    const newLink: SharedLink = {
      ...link,
      token,
      id,
      createdAt,
      accessLevel: link.accessLevel || 'view'
    };
    
    this.sharedLinks.set(id, newLink);
    return newLink;
  }
  
  private generateRandomToken(): string {
    // Generate a random 32-character token
    return [...Array(32)]
      .map(() => Math.floor(Math.random() * 36).toString(36))
      .join('');
  }
  
  async updateSharedLink(id: number, data: Partial<SharedLink>): Promise<SharedLink | undefined> {
    const link = this.sharedLinks.get(id);
    if (!link) return undefined;
    
    const updatedLink: SharedLink = {
      ...link,
      ...data
    };
    
    this.sharedLinks.set(id, updatedLink);
    return updatedLink;
  }
  
  async deleteSharedLink(id: number): Promise<void> {
    this.sharedLinks.delete(id);
  }
  
  async deleteAllSharedLinks(projectId: number): Promise<void> {
    const linksToDelete = Array.from(this.sharedLinks.values())
      .filter(link => link.projectId === projectId);
    
    for (const link of linksToDelete) {
      this.sharedLinks.delete(link.id);
    }
  }

  // Project Activities
  async getProjectActivities(projectId: number): Promise<ProjectActivity[]> {
    return Array.from(this.projectActivities.values())
      .filter(activity => activity.projectId === projectId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getProjectActivitiesWithUserInfo(projectId: number): Promise<(ProjectActivity & { user: { username: string, name: string | null } })[]> {
    const activities = await this.getProjectActivities(projectId);
    const results = [];
    
    for (const activity of activities) {
      const user = await this.getUser(activity.userId);
      
      results.push({
        ...activity,
        user: {
          username: user?.username || 'Unknown',
          name: user?.name || null,
        }
      });
    }
    
    return results;
  }
  
  async getProjectActivity(id: number): Promise<ProjectActivity | undefined> {
    return this.projectActivities.get(id);
  }
  
  async createProjectActivity(activity: InsertProjectActivity): Promise<ProjectActivity> {
    const id = this.currentProjectActivityId++;
    const createdAt = new Date();
    const newActivity: ProjectActivity = {
      ...activity,
      id,
      createdAt,
      activityData: activity.activityData || null
    };
    
    this.projectActivities.set(id, newActivity);
    return newActivity;
  }

  // FTP Sync Schedules
  async getAllSyncSchedules(): Promise<SyncSchedule[]> {
    return Array.from(this.syncSchedules.values());
  }
  
  async getSyncSchedulesByConnection(connectionId: number): Promise<SyncSchedule[]> {
    return Array.from(this.syncSchedules.values())
      .filter(schedule => schedule.connectionId === connectionId);
  }
  
  async getSyncScheduleByName(connectionId: number, name: string): Promise<SyncSchedule | undefined> {
    return Array.from(this.syncSchedules.values())
      .find(schedule => schedule.connectionId === connectionId && schedule.name === name);
  }
  
  async getEnabledSyncSchedules(): Promise<SyncSchedule[]> {
    return Array.from(this.syncSchedules.values())
      .filter(schedule => schedule.enabled);
  }
  
  async getSyncSchedule(id: number): Promise<SyncSchedule | undefined> {
    return this.syncSchedules.get(id);
  }
  
  async createSyncSchedule(schedule: InsertSyncSchedule): Promise<SyncSchedule> {
    const id = this.currentSyncScheduleId++;
    const createdAt = new Date();
    const updatedAt = new Date();
    const newSchedule: SyncSchedule = {
      ...schedule,
      id,
      createdAt,
      updatedAt,
      status: schedule.status || 'idle'
    };
    this.syncSchedules.set(id, newSchedule);
    return newSchedule;
  }
  
  async updateSyncSchedule(id: number, schedule: Partial<InsertSyncSchedule>): Promise<SyncSchedule | undefined> {
    const existingSchedule = this.syncSchedules.get(id);
    if (!existingSchedule) return undefined;
    
    const updatedAt = new Date();
    const updatedSchedule = { ...existingSchedule, ...schedule, updatedAt };
    this.syncSchedules.set(id, updatedSchedule);
    return updatedSchedule;
  }
  
  async deleteSyncSchedule(id: number): Promise<void> {
    this.syncSchedules.delete(id);
  }
  
  // FTP Sync History
  async getSyncHistory(limit = 10, offset = 0): Promise<SyncHistory[]> {
    const history = Array.from(this.syncHistories.values())
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
    
    return history.slice(offset, offset + limit);
  }
  
  async getSyncHistoryByConnection(connectionId: number, limit = 10, offset = 0): Promise<SyncHistory[]> {
    const history = Array.from(this.syncHistories.values())
      .filter(h => h.connectionId === connectionId)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
    
    return history.slice(offset, offset + limit);
  }
  
  async getSyncHistoryBySchedule(scheduleId: number, limit = 10, offset = 0): Promise<SyncHistory[]> {
    const history = Array.from(this.syncHistories.values())
      .filter(h => h.scheduleId === scheduleId)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
    
    return history.slice(offset, offset + limit);
  }
  
  async getSyncHistoryById(id: number): Promise<SyncHistory | undefined> {
    return this.syncHistories.get(id);
  }
  
  async createSyncHistory(history: InsertSyncHistory): Promise<SyncHistory> {
    const id = this.currentSyncHistoryId++;
    const newHistory: SyncHistory = {
      ...history,
      id
    };
    this.syncHistories.set(id, newHistory);
    return newHistory;
  }
  
  async updateSyncHistory(id: number, history: Partial<InsertSyncHistory>): Promise<SyncHistory | undefined> {
    const existingHistory = this.syncHistories.get(id);
    if (!existingHistory) return undefined;
    
    const updatedHistory = { ...existingHistory, ...history };
    this.syncHistories.set(id, updatedHistory);
    return updatedHistory;
  }
  
  // FTP Connection methods (extension of existing connection methods)
  async getFTPConnection(id: number): Promise<any | undefined> {
    // In a real implementation, this would retrieve FTP connection details from the database
    // For now, just return a placeholder if requested
    if (id > 0) {
      return {
        id,
        name: `FTP Connection ${id}`,
        host: 'ftp.example.com',
        port: 21,
        username: 'ftpuser',
        password: '*****',
        type: 'ftp',
        lastConnected: new Date(),
        status: 'active'
      };
    }
    return undefined;
  }
}

// The storage implementation is provided in storage-implementation.ts
export { storage } from './storage-implementation';

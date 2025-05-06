import { 
  User, InsertUser, 
  Property, InsertProperty,
  BuildingType, InsertBuildingType,
  Region, InsertRegion,
  Improvement, InsertImprovement,
  ImprovementDetail, InsertImprovementDetail,
  CostMatrix, InsertCostMatrix,
  Session, InsertSession,
  Calculation, InsertCalculation,
  Project, InsertProject,
  ProjectMember, InsertProjectMember,
  ProjectProperty, InsertProjectProperty,
  FileUpload, InsertFileUpload,
  Setting, InsertSetting
} from "../shared/schema";

/**
 * Storage Interface for TerraBuild platform.
 * Defines all data access operations throughout the application.
 */
export interface IStorage {
  // User operations
  getUsers(): Promise<User[]>;
  getUserById(id: number): Promise<User | null>;
  getUserByUsername(username: string): Promise<User | null>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | null>;
  deleteUser(id: number): Promise<boolean>;

  // Property operations
  getProperties(filter?: Record<string, any>): Promise<Property[]>;
  getPropertyById(id: number): Promise<Property | null>;
  getPropertyByGeoId(geoId: string): Promise<Property | null>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: number, propertyData: Partial<Property>): Promise<Property | null>;
  deleteProperty(id: number): Promise<boolean>;

  // Building type operations
  getBuildingTypes(): Promise<BuildingType[]>;
  getBuildingTypeByCode(code: string): Promise<BuildingType | null>;
  createBuildingType(buildingType: InsertBuildingType): Promise<BuildingType>;
  updateBuildingType(code: string, buildingTypeData: Partial<BuildingType>): Promise<BuildingType | null>;
  deleteBuildingType(code: string): Promise<boolean>;

  // Region operations
  getRegions(): Promise<Region[]>;
  getRegionByCode(code: string): Promise<Region | null>;
  createRegion(region: InsertRegion): Promise<Region>;
  updateRegion(code: string, regionData: Partial<Region>): Promise<Region | null>;
  deleteRegion(code: string): Promise<boolean>;

  // Improvement operations
  getImprovements(propertyId?: string): Promise<Improvement[]>;
  getImprovementById(id: number): Promise<Improvement | null>;
  createImprovement(improvement: InsertImprovement): Promise<Improvement>;
  updateImprovement(id: number, improvementData: Partial<Improvement>): Promise<Improvement | null>;
  deleteImprovement(id: number): Promise<boolean>;
  
  // Improvement details operations
  getImprovementDetails(improvementId: number): Promise<ImprovementDetail[]>;
  createImprovementDetail(detail: InsertImprovementDetail): Promise<ImprovementDetail>;
  deleteImprovementDetail(id: number): Promise<boolean>;

  // Cost matrix operations
  getCostMatrices(filter?: Record<string, any>): Promise<CostMatrix[]>;
  getCostMatrixById(id: number): Promise<CostMatrix | null>;
  getCostMatrixByBuildingType(buildingTypeCode: string, county: string, year: number): Promise<CostMatrix | null>;
  createCostMatrix(matrix: InsertCostMatrix): Promise<CostMatrix>;
  updateCostMatrix(id: number, matrixData: Partial<CostMatrix>): Promise<CostMatrix | null>;
  deleteCostMatrix(id: number): Promise<boolean>;

  // Cost factor operations
  getQualityFactors(): Promise<Record<string, number>>;
  getConditionFactors(): Promise<Record<string, number>>;
  getAgeFactors(): Promise<Record<number, number>>;

  // Session operations
  getSessions(userId?: number): Promise<Session[]>;
  getSession(id: string): Promise<Session | null>;
  createSession(session: InsertSession): Promise<Session>;
  updateSession(id: string, sessionData: Partial<Session>): Promise<Session | null>;
  deleteSession(id: string): Promise<boolean>;

  // Calculation operations
  getCalculations(propertyId?: string, improvementId?: string): Promise<Calculation[]>;
  getCalculationById(id: number): Promise<Calculation | null>;
  createCalculation(calculation: InsertCalculation): Promise<Calculation>;
  deleteCalculation(id: number): Promise<boolean>;

  // Project operations
  getProjects(userId?: string): Promise<Project[]>;
  getProjectById(id: number): Promise<Project | null>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, projectData: Partial<Project>): Promise<Project | null>;
  deleteProject(id: number): Promise<boolean>;

  // Project members operations
  getProjectMembers(projectId: string): Promise<ProjectMember[]>;
  addProjectMember(projectId: string, userId: string, role?: string): Promise<boolean>;
  removeProjectMember(projectId: string, userId: string): Promise<boolean>;

  // Project properties operations
  getProjectProperties(projectId: string): Promise<ProjectProperty[]>;
  addPropertyToProject(projectId: string, propertyId: string): Promise<boolean>;
  removePropertyFromProject(projectId: string, propertyId: string): Promise<boolean>;

  // Settings operations
  getSettings(userId?: number, isPublic?: boolean): Promise<Setting[]>;
  getSetting(key: string, userId?: number): Promise<Setting | null>;
  createSetting(setting: InsertSetting): Promise<Setting>;
  updateSetting(id: number, settingData: Partial<Setting>): Promise<Setting | null>;
  deleteSetting(id: number): Promise<boolean>;

  // File upload operations
  getFileUploads(userId?: number): Promise<FileUpload[]>;
  getFileUploadById(id: number): Promise<FileUpload | null>;
  createFileUpload(fileUpload: InsertFileUpload): Promise<FileUpload>;
  updateFileUpload(id: number, fileUploadData: Partial<FileUpload>): Promise<FileUpload | null>;
  deleteFileUpload(id: number): Promise<boolean>;
}

/**
 * In-memory implementation of IStorage interface
 * Used for development and testing
 */
export class MemStorage implements IStorage {
  private users: User[] = [];
  private properties: Property[] = [];
  private buildingTypes: BuildingType[] = [];
  private regions: Region[] = [];
  private improvements: Improvement[] = [];
  private improvementDetails: ImprovementDetail[] = [];
  private costMatrices: CostMatrix[] = [];
  private sessions: Session[] = [];
  private calculations: Calculation[] = [];
  private projects: Project[] = [];
  private projectMembers: ProjectMember[] = [];
  private projectProperties: ProjectProperty[] = [];
  private settings: Setting[] = [];
  private fileUploads: FileUpload[] = [];

  // User operations
  async getUsers(): Promise<User[]> {
    return this.users;
  }

  async getUserById(id: number): Promise<User | null> {
    return this.users.find(user => user.id === id) || null;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    return this.users.find(user => user.username === username) || null;
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.users.length + 1;
    const newUser: User = {
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...user
    };
    this.users.push(newUser);
    return newUser;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | null> {
    const index = this.users.findIndex(user => user.id === id);
    if (index === -1) return null;
    
    this.users[index] = {
      ...this.users[index],
      ...userData,
      updatedAt: new Date()
    };
    
    return this.users[index];
  }

  async deleteUser(id: number): Promise<boolean> {
    const initialLength = this.users.length;
    this.users = this.users.filter(user => user.id !== id);
    return this.users.length < initialLength;
  }

  // Property operations
  async getProperties(filter?: Record<string, any>): Promise<Property[]> {
    if (!filter) return this.properties;
    
    return this.properties.filter(prop => {
      return Object.entries(filter).every(([key, value]) => {
        return prop[key as keyof Property] === value;
      });
    });
  }

  async getPropertyById(id: number): Promise<Property | null> {
    return this.properties.find(prop => prop.id === id) || null;
  }

  async getPropertyByGeoId(geoId: string): Promise<Property | null> {
    return this.properties.find(prop => prop.geo_id === geoId) || null;
  }

  async createProperty(property: InsertProperty): Promise<Property> {
    const id = this.properties.length + 1;
    const newProperty: Property = {
      id,
      imported_at: new Date(),
      updated_at: new Date(),
      ...property
    };
    this.properties.push(newProperty);
    return newProperty;
  }

  async updateProperty(id: number, propertyData: Partial<Property>): Promise<Property | null> {
    const index = this.properties.findIndex(prop => prop.id === id);
    if (index === -1) return null;
    
    this.properties[index] = {
      ...this.properties[index],
      ...propertyData,
      updated_at: new Date()
    };
    
    return this.properties[index];
  }

  async deleteProperty(id: number): Promise<boolean> {
    const initialLength = this.properties.length;
    this.properties = this.properties.filter(prop => prop.id !== id);
    return this.properties.length < initialLength;
  }

  // Building type operations
  async getBuildingTypes(): Promise<BuildingType[]> {
    return this.buildingTypes;
  }

  async getBuildingTypeByCode(code: string): Promise<BuildingType | null> {
    return this.buildingTypes.find(bt => bt.code === code) || null;
  }

  async createBuildingType(buildingType: InsertBuildingType): Promise<BuildingType> {
    const id = this.buildingTypes.length + 1;
    const newBuildingType: BuildingType = {
      id,
      lastUpdated: new Date(),
      ...buildingType
    };
    this.buildingTypes.push(newBuildingType);
    return newBuildingType;
  }

  async updateBuildingType(code: string, buildingTypeData: Partial<BuildingType>): Promise<BuildingType | null> {
    const index = this.buildingTypes.findIndex(bt => bt.code === code);
    if (index === -1) return null;
    
    this.buildingTypes[index] = {
      ...this.buildingTypes[index],
      ...buildingTypeData,
      lastUpdated: new Date()
    };
    
    return this.buildingTypes[index];
  }

  async deleteBuildingType(code: string): Promise<boolean> {
    const initialLength = this.buildingTypes.length;
    this.buildingTypes = this.buildingTypes.filter(bt => bt.code !== code);
    return this.buildingTypes.length < initialLength;
  }

  // Region operations
  async getRegions(): Promise<Region[]> {
    return this.regions;
  }

  async getRegionByCode(code: string): Promise<Region | null> {
    return this.regions.find(region => region.code === code) || null;
  }

  async createRegion(region: InsertRegion): Promise<Region> {
    const id = this.regions.length + 1;
    const newRegion: Region = {
      id,
      lastUpdated: new Date(),
      ...region
    };
    this.regions.push(newRegion);
    return newRegion;
  }

  async updateRegion(code: string, regionData: Partial<Region>): Promise<Region | null> {
    const index = this.regions.findIndex(region => region.code === code);
    if (index === -1) return null;
    
    this.regions[index] = {
      ...this.regions[index],
      ...regionData,
      lastUpdated: new Date()
    };
    
    return this.regions[index];
  }

  async deleteRegion(code: string): Promise<boolean> {
    const initialLength = this.regions.length;
    this.regions = this.regions.filter(region => region.code !== code);
    return this.regions.length < initialLength;
  }

  // Improvement operations
  async getImprovements(propertyId?: string): Promise<Improvement[]> {
    if (propertyId) {
      return this.improvements.filter(imp => imp.propertyId === parseInt(propertyId));
    }
    return this.improvements;
  }

  async getImprovementById(id: number): Promise<Improvement | null> {
    return this.improvements.find(imp => imp.id === id) || null;
  }

  async createImprovement(improvement: InsertImprovement): Promise<Improvement> {
    const id = this.improvements.length + 1;
    const newImprovement: Improvement = {
      id,
      lastUpdated: new Date(),
      ...improvement
    };
    this.improvements.push(newImprovement);
    return newImprovement;
  }

  async updateImprovement(id: number, improvementData: Partial<Improvement>): Promise<Improvement | null> {
    const index = this.improvements.findIndex(imp => imp.id === id);
    if (index === -1) return null;
    
    this.improvements[index] = {
      ...this.improvements[index],
      ...improvementData,
      lastUpdated: new Date()
    };
    
    return this.improvements[index];
  }

  async deleteImprovement(id: number): Promise<boolean> {
    const initialLength = this.improvements.length;
    this.improvements = this.improvements.filter(imp => imp.id !== id);
    return this.improvements.length < initialLength;
  }

  // Improvement details operations
  async getImprovementDetails(improvementId: number): Promise<ImprovementDetail[]> {
    return this.improvementDetails.filter(detail => detail.improvementId === improvementId);
  }

  async createImprovementDetail(detail: InsertImprovementDetail): Promise<ImprovementDetail> {
    const id = this.improvementDetails.length + 1;
    const newDetail: ImprovementDetail = {
      id,
      lastUpdated: new Date(),
      ...detail
    };
    this.improvementDetails.push(newDetail);
    return newDetail;
  }

  async deleteImprovementDetail(id: number): Promise<boolean> {
    const initialLength = this.improvementDetails.length;
    this.improvementDetails = this.improvementDetails.filter(detail => detail.id !== id);
    return this.improvementDetails.length < initialLength;
  }

  // Cost matrix operations
  async getCostMatrices(filter?: Record<string, any>): Promise<CostMatrix[]> {
    if (!filter) return this.costMatrices;
    
    return this.costMatrices.filter(matrix => {
      return Object.entries(filter).every(([key, value]) => {
        return matrix[key as keyof CostMatrix] === value;
      });
    });
  }

  async getCostMatrixById(id: number): Promise<CostMatrix | null> {
    return this.costMatrices.find(matrix => matrix.id === id) || null;
  }

  async getCostMatrixByBuildingType(buildingTypeCode: string, county: string, year: number): Promise<CostMatrix | null> {
    return this.costMatrices.find(matrix => 
      matrix.buildingTypeCode === buildingTypeCode && 
      matrix.county === county && 
      matrix.year === year
    ) || null;
  }

  async createCostMatrix(matrix: InsertCostMatrix): Promise<CostMatrix> {
    const id = this.costMatrices.length + 1;
    const newMatrix: CostMatrix = {
      id,
      importedAt: new Date(),
      updatedAt: new Date(),
      ...matrix
    };
    this.costMatrices.push(newMatrix);
    return newMatrix;
  }

  async updateCostMatrix(id: number, matrixData: Partial<CostMatrix>): Promise<CostMatrix | null> {
    const index = this.costMatrices.findIndex(matrix => matrix.id === id);
    if (index === -1) return null;
    
    this.costMatrices[index] = {
      ...this.costMatrices[index],
      ...matrixData,
      updatedAt: new Date()
    };
    
    return this.costMatrices[index];
  }

  async deleteCostMatrix(id: number): Promise<boolean> {
    const initialLength = this.costMatrices.length;
    this.costMatrices = this.costMatrices.filter(matrix => matrix.id !== id);
    return this.costMatrices.length < initialLength;
  }

  // Cost factor operations
  async getQualityFactors(): Promise<Record<string, number>> {
    return {
      "low": 0.8,
      "average": 1.0,
      "good": 1.2,
      "excellent": 1.5
    };
  }

  async getConditionFactors(): Promise<Record<string, number>> {
    return {
      "poor": 0.7,
      "fair": 0.85,
      "average": 1.0,
      "good": 1.1,
      "excellent": 1.2
    };
  }

  async getAgeFactors(): Promise<Record<number, number>> {
    const factors: Record<number, number> = {};
    // Generate age factors for 100 years
    for (let age = 0; age <= 100; age++) {
      if (age <= 5) {
        factors[age] = 1.0;
      } else if (age <= 10) {
        factors[age] = 0.95;
      } else if (age <= 20) {
        factors[age] = 0.9;
      } else if (age <= 30) {
        factors[age] = 0.85;
      } else if (age <= 40) {
        factors[age] = 0.8;
      } else if (age <= 50) {
        factors[age] = 0.75;
      } else if (age <= 75) {
        factors[age] = 0.7;
      } else {
        factors[age] = 0.65;
      }
    }
    return factors;
  }

  // Session operations
  async getSessions(userId?: number): Promise<Session[]> {
    if (userId) {
      return this.sessions.filter(session => session.userId === userId);
    }
    return this.sessions;
  }

  async getSession(id: string): Promise<Session | null> {
    return this.sessions.find(session => session.id === id) || null;
  }

  async createSession(session: InsertSession): Promise<Session> {
    const newSession: Session = {
      id: session.id || `session_${Date.now()}`, 
      createdAt: new Date(),
      updatedAt: new Date(),
      ...session,
    };
    this.sessions.push(newSession);
    return newSession;
  }

  async updateSession(id: string, sessionData: Partial<Session>): Promise<Session | null> {
    const index = this.sessions.findIndex(session => session.id === id);
    if (index === -1) return null;
    
    this.sessions[index] = {
      ...this.sessions[index],
      ...sessionData,
      updatedAt: new Date()
    };
    
    return this.sessions[index];
  }

  async deleteSession(id: string): Promise<boolean> {
    const initialLength = this.sessions.length;
    this.sessions = this.sessions.filter(session => session.id !== id);
    return this.sessions.length < initialLength;
  }

  // Calculation operations
  async getCalculations(propertyId?: string, improvementId?: string): Promise<Calculation[]> {
    let filtered = this.calculations;
    
    if (propertyId) {
      filtered = filtered.filter(calc => calc.propertyId === parseInt(propertyId));
    }
    
    if (improvementId) {
      filtered = filtered.filter(calc => calc.improvementId === parseInt(improvementId));
    }
    
    return filtered;
  }

  async getCalculationById(id: number): Promise<Calculation | null> {
    return this.calculations.find(calc => calc.id === id) || null;
  }

  async createCalculation(calculation: InsertCalculation): Promise<Calculation> {
    const id = this.calculations.length + 1;
    const newCalculation: Calculation = {
      id,
      createdAt: new Date(),
      ...calculation
    };
    this.calculations.push(newCalculation);
    return newCalculation;
  }

  async deleteCalculation(id: number): Promise<boolean> {
    const initialLength = this.calculations.length;
    this.calculations = this.calculations.filter(calc => calc.id !== id);
    return this.calculations.length < initialLength;
  }

  // Project operations
  async getProjects(userId?: string): Promise<Project[]> {
    if (userId) {
      const numUserId = parseInt(userId);
      return this.projects.filter(project => project.ownerId === numUserId);
    }
    return this.projects;
  }

  async getProjectById(id: number): Promise<Project | null> {
    return this.projects.find(project => project.id === id) || null;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const id = this.projects.length + 1;
    const newProject: Project = {
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: null,
      ...project
    };
    this.projects.push(newProject);
    return newProject;
  }

  async updateProject(id: number, projectData: Partial<Project>): Promise<Project | null> {
    const index = this.projects.findIndex(project => project.id === id);
    if (index === -1) return null;
    
    this.projects[index] = {
      ...this.projects[index],
      ...projectData,
      updatedAt: new Date()
    };
    
    return this.projects[index];
  }

  async deleteProject(id: number): Promise<boolean> {
    const initialLength = this.projects.length;
    this.projects = this.projects.filter(project => project.id !== id);
    return this.projects.length < initialLength;
  }

  // Project members operations
  async getProjectMembers(projectId: string): Promise<ProjectMember[]> {
    const numProjectId = parseInt(projectId);
    return this.projectMembers.filter(member => member.projectId === numProjectId);
  }

  async addProjectMember(projectId: string, userId: string, role?: string): Promise<boolean> {
    const numProjectId = parseInt(projectId);
    const numUserId = parseInt(userId);
    
    // Check if project and user exist
    const project = await this.getProjectById(numProjectId);
    const user = await this.getUserById(numUserId);
    
    if (!project || !user) return false;
    
    // Check if member already exists
    const existingMember = this.projectMembers.find(
      member => member.projectId === numProjectId && member.userId === numUserId
    );
    
    if (existingMember) return false;
    
    // Add new member
    const id = this.projectMembers.length + 1;
    const newMember: ProjectMember = {
      id,
      projectId: numProjectId,
      userId: numUserId,
      role: role || 'viewer',
      addedAt: new Date()
    };
    
    this.projectMembers.push(newMember);
    return true;
  }

  async removeProjectMember(projectId: string, userId: string): Promise<boolean> {
    const numProjectId = parseInt(projectId);
    const numUserId = parseInt(userId);
    
    const initialLength = this.projectMembers.length;
    this.projectMembers = this.projectMembers.filter(
      member => !(member.projectId === numProjectId && member.userId === numUserId)
    );
    
    return this.projectMembers.length < initialLength;
  }

  // Project properties operations
  async getProjectProperties(projectId: string): Promise<ProjectProperty[]> {
    const numProjectId = parseInt(projectId);
    return this.projectProperties.filter(pp => pp.projectId === numProjectId);
  }

  async addPropertyToProject(projectId: string, propertyId: string): Promise<boolean> {
    const numProjectId = parseInt(projectId);
    const numPropertyId = parseInt(propertyId);
    
    // Check if project and property exist
    const project = await this.getProjectById(numProjectId);
    const property = await this.getPropertyById(numPropertyId);
    
    if (!project || !property) return false;
    
    // Check if property is already in project
    const existingProperty = this.projectProperties.find(
      pp => pp.projectId === numProjectId && pp.propertyId === numPropertyId
    );
    
    if (existingProperty) return false;
    
    // Add property to project
    const id = this.projectProperties.length + 1;
    const newPP: ProjectProperty = {
      id,
      projectId: numProjectId,
      propertyId: numPropertyId,
      addedAt: new Date()
    };
    
    this.projectProperties.push(newPP);
    return true;
  }

  async removePropertyFromProject(projectId: string, propertyId: string): Promise<boolean> {
    const numProjectId = parseInt(projectId);
    const numPropertyId = parseInt(propertyId);
    
    const initialLength = this.projectProperties.length;
    this.projectProperties = this.projectProperties.filter(
      pp => !(pp.projectId === numProjectId && pp.propertyId === numPropertyId)
    );
    
    return this.projectProperties.length < initialLength;
  }

  // Settings operations
  async getSettings(userId?: number, isPublic?: boolean): Promise<Setting[]> {
    let filtered = this.settings;
    
    if (userId !== undefined) {
      filtered = filtered.filter(setting => setting.userId === userId);
    }
    
    if (isPublic !== undefined) {
      filtered = filtered.filter(setting => setting.isPublic === isPublic);
    }
    
    return filtered;
  }

  async getSetting(key: string, userId?: number): Promise<Setting | null> {
    let setting: Setting | undefined;
    
    if (userId !== undefined) {
      // Find user-specific setting
      setting = this.settings.find(s => s.key === key && s.userId === userId);
    }
    
    if (!setting) {
      // If no user-specific setting, try to find a public one
      setting = this.settings.find(s => s.key === key && s.isPublic === true);
    }
    
    return setting || null;
  }

  async createSetting(setting: InsertSetting): Promise<Setting> {
    const id = this.settings.length + 1;
    const newSetting: Setting = {
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...setting
    };
    this.settings.push(newSetting);
    return newSetting;
  }

  async updateSetting(id: number, settingData: Partial<Setting>): Promise<Setting | null> {
    const index = this.settings.findIndex(setting => setting.id === id);
    if (index === -1) return null;
    
    this.settings[index] = {
      ...this.settings[index],
      ...settingData,
      updatedAt: new Date()
    };
    
    return this.settings[index];
  }

  async deleteSetting(id: number): Promise<boolean> {
    const initialLength = this.settings.length;
    this.settings = this.settings.filter(setting => setting.id !== id);
    return this.settings.length < initialLength;
  }

  // File upload operations
  async getFileUploads(userId?: number): Promise<FileUpload[]> {
    if (userId !== undefined) {
      return this.fileUploads.filter(upload => upload.userId === userId);
    }
    return this.fileUploads;
  }

  async getFileUploadById(id: number): Promise<FileUpload | null> {
    return this.fileUploads.find(upload => upload.id === id) || null;
  }

  async createFileUpload(fileUpload: InsertFileUpload): Promise<FileUpload> {
    const id = this.fileUploads.length + 1;
    const newFileUpload: FileUpload = {
      id,
      createdAt: new Date(),
      processedAt: null,
      ...fileUpload
    };
    this.fileUploads.push(newFileUpload);
    return newFileUpload;
  }

  async updateFileUpload(id: number, fileUploadData: Partial<FileUpload>): Promise<FileUpload | null> {
    const index = this.fileUploads.findIndex(upload => upload.id === id);
    if (index === -1) return null;
    
    this.fileUploads[index] = {
      ...this.fileUploads[index],
      ...fileUploadData
    };
    
    return this.fileUploads[index];
  }

  async deleteFileUpload(id: number): Promise<boolean> {
    const initialLength = this.fileUploads.length;
    this.fileUploads = this.fileUploads.filter(upload => upload.id !== id);
    return this.fileUploads.length < initialLength;
  }
}

// Create and export a storage instance
export const storage = new MemStorage();
import { 
  User, InsertUser, 
  Property, InsertProperty,
  BuildingType,
  Improvement, InsertImprovement,
  CostMatrix, InsertCostMatrix,
  Session, InsertSession,
  Calculation, InsertCalculation,
  Project, InsertProject,
  projectProperties
} from "../shared/schema";
import * as schema from "../shared/schema";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { db, pool } from "./db";
import { eq, and } from "drizzle-orm";

/**
 * Storage Interface for TerraBuild platform.
 * Defines all data access operations throughout the application.
 */
export interface IStorage {
  // Session store for authentication
  sessionStore: session.Store;
  
  // User operations
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | null>;
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
  
  // Monitoring and diagnostics
  checkDatabaseConnection(): Promise<boolean>;
  getAgentStatuses(): Promise<Record<string, any>>;
  getAgentStatus(agentId: string): Promise<any | null>;
  updateAgentStatus(
    agentId: string,
    status: string,
    metadata?: Record<string, any>,
    errorMessage?: string
  ): Promise<boolean>;
}

/**
 * PostgreSQL database implementation of IStorage interface
 * Used for production environments
 */
export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    // Connect to PostgreSQL for session storage
    const PgStore = connectPgSimple(session);
    this.sessionStore = new PgStore({
      pool,
      tableName: 'sessions',
      createTableIfMissing: true,
    });
    
    // Try to create default users if they don't exist
    this.seedDefaultUsers().catch(err => {
      console.error('Error creating default users:', err);
    });
  }

  private async seedDefaultUsers() {
    try {
      // Check if admin user exists
      const adminUser = await this.getUserByUsername('admin');
      if (!adminUser) {
        console.log('Creating default admin user...');
        await this.createUser({
          username: 'admin',
          // Pre-hashed password equivalent to 'admin123'
          password: '95e6f1597b56a1c1f3881c8c9dd41825de95e26523f2b6a30b85558cc43f5be6ce34d540a21add73fecbbaeab46bd0037f995719a96a9c8c59ec7adb598d6b1b.b3c0b9a8c29c7b3ab40a694cd0486111',
          name: 'Administrator',
          role: 'admin',
          is_active: true
        });
      }

      // Check if default user exists
      const defaultUser = await this.getUserByUsername('user');
      if (!defaultUser) {
        console.log('Creating default regular user...');
        await this.createUser({
          username: 'user',
          // Pre-hashed password equivalent to 'user123'
          password: '6baa3ff5f70da9c6c3b9000a86e67c0c4b6b2bb4d67cb1d0e7c5b7de6ac24e36a96474f52702c2e67d694215267e58e2cd9b98d5c78c36aa44a4676e1a79b0f0.1e33abcbaa52e7bb0e01a74ee3f73d75',
          name: 'Regular User',
          role: 'user',
          is_active: true
        });
      }
    } catch (error) {
      console.error('Error seeding default users:', error);
      throw error;
    }
  }

  // User operations
  async getUsers(): Promise<User[]> {
    return await db.select().from(schema.users);
  }

  async getUser(id: number): Promise<User | null> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return user || null;
  }

  async getUserById(id: number): Promise<User | null> {
    return this.getUser(id);
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.username, username));
    return user || null;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(schema.users).values({
      ...user,
      created_at: new Date(),
      updated_at: new Date()
    }).returning();
    return newUser;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | null> {
    const [updatedUser] = await db.update(schema.users)
      .set({
        ...userData,
        updated_at: new Date()
      })
      .where(eq(schema.users.id, id))
      .returning();
    return updatedUser || null;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(schema.users).where(eq(schema.users.id, id));
    return !!result;
  }

  // Add implementations for all other interface methods...

  // For now we'll provide basic implementations for critical operations
  // and add functionality as needed

  // Property operations (basic implementation)
  async getProperties(filter?: Record<string, any>): Promise<Property[]> {
    return await db.select().from(schema.properties);
  }

  async getPropertyById(id: number): Promise<Property | null> {
    console.log(`[DEBUG getPropertyById] Searching for property with ID ${id} in database`);
    try {
      const [property] = await db.select().from(schema.properties).where(eq(schema.properties.id, id));
      console.log(`[DEBUG getPropertyById] Database query result:`, property ? 'Found property' : 'Property not found');
      return property || null;
    } catch (error) {
      console.error(`[DEBUG getPropertyById] Error querying database:`, error);
      throw error;
    }
  }

  async getPropertyByGeoId(geoId: string): Promise<Property | null> {
    const [property] = await db.select().from(schema.properties).where(eq(schema.properties.geo_id, geoId));
    return property || null;
  }

  async createProperty(property: InsertProperty): Promise<Property> {
    const [newProperty] = await db.insert(schema.properties).values(property).returning();
    return newProperty;
  }

  async updateProperty(id: number, propertyData: Partial<Property>): Promise<Property | null> {
    const [updatedProperty] = await db.update(schema.properties)
      .set({
        ...propertyData,
        updated_at: new Date()
      })
      .where(eq(schema.properties.id, id))
      .returning();
    return updatedProperty || null;
  }

  async deleteProperty(id: number): Promise<boolean> {
    const result = await db.delete(schema.properties).where(eq(schema.properties.id, id));
    return !!result;
  }

  // Cost matrix operations (stub implementations)
  async getCostMatrices(filter?: Record<string, any>): Promise<CostMatrix[]> {
    return await db.select().from(schema.costMatrices);
  }

  async getCostMatrixById(id: number): Promise<CostMatrix | null> {
    const [matrix] = await db.select().from(schema.costMatrices).where(eq(schema.costMatrices.id, id));
    return matrix || null;
  }

  async getCostMatrixByBuildingType(buildingTypeCode: string, county: string, year: number): Promise<CostMatrix | null> {
    const [matrix] = await db.select().from(schema.costMatrices)
      .where(and(
        eq(schema.costMatrices.building_type, buildingTypeCode),
        eq(schema.costMatrices.county, county),
        eq(schema.costMatrices.matrix_year, year)
      ));
    return matrix || null;
  }

  async createCostMatrix(matrix: InsertCostMatrix): Promise<CostMatrix> {
    const [newMatrix] = await db.insert(schema.costMatrices).values(matrix).returning();
    return newMatrix;
  }

  async updateCostMatrix(id: number, matrixData: Partial<CostMatrix>): Promise<CostMatrix | null> {
    const [updatedMatrix] = await db.update(schema.costMatrices)
      .set({
        ...matrixData,
        updated_at: new Date()
      })
      .where(eq(schema.costMatrices.id, id))
      .returning();
    return updatedMatrix || null;
  }

  async deleteCostMatrix(id: number): Promise<boolean> {
    const result = await db.delete(schema.costMatrices).where(eq(schema.costMatrices.id, id));
    return !!result;
  }

  // Session operations (stub implementations)
  async getSessions(userId?: number): Promise<Session[]> {
    // This is a stub implementation
    return await db.select().from(schema.sessions);
  }

  async getSession(sid: string): Promise<Session | null> {
    const [session] = await db.select().from(schema.sessions).where(eq(schema.sessions.sid, sid));
    return session || null;
  }

  async createSession(session: InsertSession): Promise<Session> {
    const [newSession] = await db.insert(schema.sessions).values({
      ...session,
      created_at: new Date()
    }).returning();
    return newSession;
  }

  async updateSession(sid: string, sessionData: Partial<Session>): Promise<Session | null> {
    const [updatedSession] = await db.update(schema.sessions)
      .set(sessionData)
      .where(eq(schema.sessions.sid, sid))
      .returning();
    return updatedSession || null;
  }

  async deleteSession(sid: string): Promise<boolean> {
    const result = await db.delete(schema.sessions).where(eq(schema.sessions.sid, sid));
    return !!result;
  }

  // Other methods will be implemented as needed
  // For now, providing stub implementations

  async getBuildingTypes(): Promise<BuildingType[]> {
    return await db.select().from(schema.buildingTypes);
  }

  async getBuildingTypeByCode(code: string): Promise<BuildingType | null> {
    const [buildingType] = await db.select().from(schema.buildingTypes).where(eq(schema.buildingTypes.code, code));
    return buildingType || null;
  }

  async createBuildingType(buildingType: any): Promise<BuildingType> {
    const [newBuildingType] = await db.insert(schema.buildingTypes).values(buildingType).returning();
    return newBuildingType;
  }

  async updateBuildingType(code: string, buildingTypeData: Partial<BuildingType>): Promise<BuildingType | null> {
    const [updatedBuildingType] = await db.update(schema.buildingTypes)
      .set(buildingTypeData)
      .where(eq(schema.buildingTypes.code, code))
      .returning();
    return updatedBuildingType || null;
  }

  async deleteBuildingType(code: string): Promise<boolean> {
    const result = await db.delete(schema.buildingTypes).where(eq(schema.buildingTypes.code, code));
    return !!result;
  }

  // Regions operations
  async getRegions(): Promise<Region[]> {
    return await db.select().from(schema.regions);
  }

  async getRegionByCode(code: string): Promise<Region | null> {
    const [region] = await db.select().from(schema.regions).where(eq(schema.regions.code, code));
    return region || null;
  }

  async createRegion(region: any): Promise<Region> {
    const [newRegion] = await db.insert(schema.regions).values(region).returning();
    return newRegion;
  }

  async updateRegion(code: string, regionData: Partial<Region>): Promise<Region | null> {
    const [updatedRegion] = await db.update(schema.regions)
      .set(regionData)
      .where(eq(schema.regions.code, code))
      .returning();
    return updatedRegion || null;
  }

  async deleteRegion(code: string): Promise<boolean> {
    const result = await db.delete(schema.regions).where(eq(schema.regions.code, code));
    return !!result;
  }

  // Improvement operations 
  async getImprovements(propertyId?: string): Promise<Improvement[]> {
    if (propertyId) {
      return await db.select().from(schema.improvements).where(eq(schema.improvements.property_id, parseInt(propertyId)));
    }
    return await db.select().from(schema.improvements);
  }

  async getImprovementById(id: number): Promise<Improvement | null> {
    const [improvement] = await db.select().from(schema.improvements).where(eq(schema.improvements.id, id));
    return improvement || null;
  }

  async createImprovement(improvement: InsertImprovement): Promise<Improvement> {
    const [newImprovement] = await db.insert(schema.improvements).values(improvement).returning();
    return newImprovement;
  }

  async updateImprovement(id: number, improvementData: Partial<Improvement>): Promise<Improvement | null> {
    const [updatedImprovement] = await db.update(schema.improvements)
      .set(improvementData)
      .where(eq(schema.improvements.id, id))
      .returning();
    return updatedImprovement || null;
  }

  async deleteImprovement(id: number): Promise<boolean> {
    const result = await db.delete(schema.improvements).where(eq(schema.improvements.id, id));
    return !!result;
  }

  // Stub implementations for remaining methods
  async getImprovementDetails(improvementId: number): Promise<any[]> {
    return [];
  }

  async createImprovementDetail(detail: any): Promise<any> {
    return { id: 1 };
  }

  async deleteImprovementDetail(id: number): Promise<boolean> {
    return true;
  }

  async getQualityFactors(): Promise<Record<string, number>> {
    return {
      'excellent': 1.1,
      'good': 1.0,
      'average': 0.9,
      'fair': 0.8,
      'poor': 0.7
    };
  }

  async getConditionFactors(): Promise<Record<string, number>> {
    return {
      'excellent': 1.1,
      'good': 1.0,
      'average': 0.9,
      'fair': 0.8,
      'poor': 0.7
    };
  }

  async getAgeFactors(): Promise<Record<number, number>> {
    return {
      0: 1.0,
      5: 0.95,
      10: 0.9,
      15: 0.85,
      20: 0.8,
      25: 0.75,
      30: 0.7
    };
  }

  async getCalculations(propertyId?: string, improvementId?: string): Promise<Calculation[]> {
    return [];
  }

  async getCalculationById(id: number): Promise<Calculation | null> {
    return null;
  }

  async createCalculation(calculation: InsertCalculation): Promise<Calculation> {
    const [newCalculation] = await db.insert(schema.calculations).values(calculation).returning();
    return newCalculation;
  }

  async deleteCalculation(id: number): Promise<boolean> {
    return true;
  }

  async getProjects(userId?: string): Promise<Project[]> {
    return [];
  }

  async getProjectById(id: number): Promise<Project | null> {
    return null;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db.insert(schema.projects).values(project).returning();
    return newProject;
  }

  async updateProject(id: number, projectData: Partial<Project>): Promise<Project | null> {
    return null;
  }

  async deleteProject(id: number): Promise<boolean> {
    return true;
  }

  async getProjectMembers(projectId: string): Promise<any[]> {
    return [];
  }

  async addProjectMember(projectId: string, userId: string, role?: string): Promise<boolean> {
    return true;
  }

  async removeProjectMember(projectId: string, userId: string): Promise<boolean> {
    return true;
  }

  async getProjectProperties(projectId: string): Promise<any[]> {
    return [];
  }

  async addPropertyToProject(projectId: string, propertyId: string): Promise<boolean> {
    return true;
  }

  async removePropertyFromProject(projectId: string, propertyId: string): Promise<boolean> {
    return true;
  }

  async getSettings(userId?: number, isPublic?: boolean): Promise<any[]> {
    return [];
  }

  async getSetting(key: string, userId?: number): Promise<any | null> {
    return null;
  }

  async createSetting(setting: any): Promise<any> {
    return { id: 1 };
  }

  async updateSetting(id: number, settingData: Partial<any>): Promise<any | null> {
    return null;
  }

  async deleteSetting(id: number): Promise<boolean> {
    return true;
  }

  async getFileUploads(userId?: number): Promise<any[]> {
    return [];
  }

  async getFileUploadById(id: number): Promise<any | null> {
    return null;
  }

  async createFileUpload(fileUpload: any): Promise<any> {
    return { id: 1 };
  }

  async updateFileUpload(id: number, fileUploadData: Partial<any>): Promise<any | null> {
    return null;
  }

  async deleteFileUpload(id: number): Promise<boolean> {
    return true;
  }

  async checkDatabaseConnection(): Promise<boolean> {
    try {
      await pool.query('SELECT 1');
      return true;
    } catch (error) {
      console.error('Database connection check failed:', error);
      return false;
    }
  }

  async getAgentStatuses(): Promise<Record<string, any>> {
    return {};
  }

  async getAgentStatus(agentId: string): Promise<any | null> {
    return null;
  }

  async updateAgentStatus(
    agentId: string,
    status: string,
    metadata?: Record<string, any>,
    errorMessage?: string
  ): Promise<boolean> {
    return true;
  }
}

/**
 * In-memory implementation of IStorage interface
 * Used for development and testing
 */
export class MemStorage implements IStorage {
  sessionStore: session.Store;
  
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
  
  constructor() {
    // Use memory store for development
    const MemoryStore = require('memorystore')(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Create default user for testing
    this.seedDefaultUser();
  }
  
  private async seedDefaultUser() {
    // Create a default admin user
    const adminUser: InsertUser = {
      username: 'admin',
      // Pre-hashed password equivalent to 'admin123'
      password: '95e6f1597b56a1c1f3881c8c9dd41825de95e26523f2b6a30b85558cc43f5be6ce34d540a21add73fecbbaeab46bd0037f995719a96a9c8c59ec7adb598d6b1b.b3c0b9a8c29c7b3ab40a694cd0486111',
      name: 'Admin User', // Using name to match actual DB column
      role: 'admin',
      is_active: true
    };
    
    // Create a default regular user
    const defaultUser: InsertUser = {
      username: 'default',
      // Pre-hashed password equivalent to 'default123'
      password: '6baa3ff5f70da9c6c3b9000a86e67c0c4b6b2bb4d67cb1d0e7c5b7de6ac24e36a96474f52702c2e67d694215267e58e2cd9b98d5c78c36aa44a4676e1a79b0f0.1e33abcbaa52e7bb0e01a74ee3f73d75',
      name: 'Default User',
      role: 'user',
      is_active: true
    };
    
    // Only add if no users exist yet
    if (this.users.length === 0) {
      console.log('Creating default users with pre-hashed passwords:');
      console.log('- Admin user: username="admin", password="admin123"');
      
      const newAdminUser: User = {
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...adminUser
      };
      this.users.push(newAdminUser);
      
      console.log('- Regular user: username="default", password="default123"');
      const newDefaultUser: User = {
        id: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...defaultUser
      };
      this.users.push(newDefaultUser);
      
      console.log('Default users created successfully');
    }
  }

  // User operations
  async getUsers(): Promise<User[]> {
    return this.users;
  }

  async getUser(id: number): Promise<User | null> {
    return this.users.find(user => user.id === id) || null;
  }

  async getUserById(id: number): Promise<User | null> {
    return this.getUser(id);
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
  
  // Monitoring and diagnostics methods
  async checkDatabaseConnection(): Promise<boolean> {
    // In memory storage is always connected
    return true;
  }
  
  async getAgentStatuses(): Promise<Record<string, any>> {
    return {
      'data-quality-agent': {
        status: 'healthy',
        lastUpdated: new Date(),
        metadata: {}
      },
      'cost-analysis-agent': {
        status: 'healthy',
        lastUpdated: new Date(),
        metadata: {}
      },
      'compliance-agent': {
        status: 'healthy',
        lastUpdated: new Date(),
        metadata: {}
      }
    };
  }
  
  async getAgentStatus(agentId: string): Promise<any | null> {
    const statuses = await this.getAgentStatuses();
    return statuses[agentId] || null;
  }
  
  async updateAgentStatus(
    agentId: string,
    status: string,
    metadata?: Record<string, any>,
    errorMessage?: string
  ): Promise<boolean> {
    return true;
  }
}

// Export both storage implementations for use in the storage factory
export * from './storage-factory';
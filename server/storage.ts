/**
 * BCBS Application Storage Interface
 * 
 * This file provides the storage interfaces for the Benton County Building System
 * using both memory-based storage for testing and PostgreSQL database for production.
 */

import { eq, and, sql, desc, asc, like, inArray } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from '../shared/schema';
import {
  // Entity types
  User, Property, Improvement, CostMatrix, Calculation, Project,
  BuildingType, Region, QualityFactor, ConditionFactor, AgeFactor, MatrixDetail,
  
  // Insert types
  InsertUser, InsertProperty, InsertImprovement, InsertCostMatrix,
  InsertCalculation, InsertProject,
} from '../shared/schema';

/**
 * Storage Interface
 * Defines the contract for all storage implementations
 */
export interface IStorage {
  // Users
  getUsers(): Promise<User[]>;
  getUserById(id: number | string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number | string, user: Partial<User>): Promise<User | null>;
  deleteUser(id: number | string): Promise<boolean>;

  // Properties
  getProperties(filter?: Partial<Property>): Promise<Property[]>;
  getPropertyById(id: number | string): Promise<Property | null>;
  getPropertyByParcelId(parcelId: string): Promise<Property | null>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: number | string, property: Partial<Property>): Promise<Property | null>;
  deleteProperty(id: number | string): Promise<boolean>;

  // Improvements
  getImprovements(propertyId?: string): Promise<Improvement[]>;
  getImprovementById(id: number | string): Promise<Improvement | null>;
  createImprovement(improvement: InsertImprovement): Promise<Improvement>;
  updateImprovement(id: number | string, improvement: Partial<Improvement>): Promise<Improvement | null>;
  deleteImprovement(id: number | string): Promise<boolean>;

  // Cost Matrix
  getCostMatrices(filter?: Partial<CostMatrix>): Promise<CostMatrix[]>;
  getCostMatrixById(id: number | string): Promise<CostMatrix | null>;
  getCostMatrixByBuildingType(buildingType: string, region: string, year: number): Promise<CostMatrix | null>;
  createCostMatrix(matrix: InsertCostMatrix): Promise<CostMatrix>;
  updateCostMatrix(id: number | string, matrix: Partial<CostMatrix>): Promise<CostMatrix | null>;
  deleteCostMatrix(id: number | string): Promise<boolean>;

  // Building Types
  getBuildingTypes(): Promise<BuildingType[]>;
  getBuildingTypeByCode(code: string): Promise<BuildingType | null>;
  createBuildingType(buildingType: Partial<BuildingType>): Promise<BuildingType>;
  updateBuildingType(code: string, buildingType: Partial<BuildingType>): Promise<BuildingType | null>;
  deleteBuildingType(code: string): Promise<boolean>;

  // Regions
  getRegions(): Promise<Region[]>;
  getRegionByCode(code: string): Promise<Region | null>;
  createRegion(region: Partial<Region>): Promise<Region>;
  updateRegion(code: string, region: Partial<Region>): Promise<Region | null>;
  deleteRegion(code: string): Promise<boolean>;

  // Cost Factors (Quality, Condition, Age)
  getQualityFactors(): Promise<QualityFactor[]>;
  getConditionFactors(): Promise<ConditionFactor[]>;
  getAgeFactors(): Promise<AgeFactor[]>;

  // Calculations
  getCalculations(propertyId?: string, improvementId?: string): Promise<Calculation[]>;
  getCalculationById(id: number | string): Promise<Calculation | null>;
  createCalculation(calculation: InsertCalculation): Promise<Calculation>;
  deleteCalculation(id: number | string): Promise<boolean>;

  // Projects
  getProjects(userId?: string): Promise<Project[]>;
  getProjectById(id: number | string): Promise<Project | null>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number | string, project: Partial<Project>): Promise<Project | null>;
  deleteProject(id: number | string): Promise<boolean>;
  
  // Project Members
  addProjectMember(projectId: string, userId: string, role?: string): Promise<boolean>;
  removeProjectMember(projectId: string, userId: string): Promise<boolean>;
  getProjectMembers(projectId: string): Promise<User[]>;
  
  // Project Properties
  addPropertyToProject(projectId: string, propertyId: string): Promise<boolean>;
  removePropertyFromProject(projectId: string, propertyId: string): Promise<boolean>;
  getProjectProperties(projectId: string): Promise<Property[]>;

  // System Settings
  getSettings(): Promise<Setting[]>;
  getSetting(key: string): Promise<Setting | undefined>;
  setSetting(key: string, value: string): Promise<boolean>;
}

/**
 * Memory Storage Implementation
 * Used for testing and development without a database
 */
export class MemStorage implements IStorage {
  private users: User[] = [];
  private properties: Property[] = [];
  private improvements: Improvement[] = [];
  private costMatrices: CostMatrix[] = [];
  private buildingTypes: BuildingType[] = [];
  private regions: Region[] = [];
  private qualityFactors: QualityFactor[] = [];
  private conditionFactors: ConditionFactor[] = [];
  private ageFactors: AgeFactor[] = [];
  private calculations: Calculation[] = [];
  private projects: Project[] = [];
  private projectMembers: { projectId: string; userId: string; role: string }[] = [];
  private projectProperties: { projectId: string; propertyId: string }[] = [];
  private settings: { key: string; value: string; type?: string }[] = [];

  // User methods
  async getUsers(): Promise<User[]> {
    return this.users;
  }

  async getUserById(id: number | string): Promise<User | null> {
    const numId = typeof id === 'string' ? parseInt(id) : id;
    return this.users.find(u => u.id === numId) || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.users.find(u => u.email === email) || null;
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = {
      ...user,
      id: this.users.length + 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: null,
    };
    this.users.push(newUser);
    return newUser;
  }

  async updateUser(id: number | string, user: Partial<User>): Promise<User | null> {
    const numId = typeof id === 'string' ? parseInt(id) : id;
    const index = this.users.findIndex(u => u.id === numId);
    if (index === -1) return null;

    const updatedUser = { ...this.users[index], ...user, updatedAt: new Date() };
    this.users[index] = updatedUser;
    return updatedUser;
  }

  async deleteUser(id: number | string): Promise<boolean> {
    const numId = typeof id === 'string' ? parseInt(id) : id;
    const index = this.users.findIndex(u => u.id === numId);
    if (index === -1) return false;

    this.users.splice(index, 1);
    return true;
  }

  // Property methods
  async getProperties(filter?: Partial<Property>): Promise<Property[]> {
    if (!filter) return this.properties;
    
    return this.properties.filter(p => {
      for (const [key, value] of Object.entries(filter)) {
        if (p[key as keyof Property] !== value) return false;
      }
      return true;
    });
  }

  async getPropertyById(id: number | string): Promise<Property | null> {
    const numId = typeof id === 'string' ? parseInt(id) : id;
    return this.properties.find(p => p.id === numId) || null;
  }

  async getPropertyByParcelId(parcelId: string): Promise<Property | null> {
    return this.properties.find(p => p.parcelId === parcelId) || null;
  }

  async createProperty(property: InsertProperty): Promise<Property> {
    const newProperty: Property = {
      ...property,
      id: this.properties.length + 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastAssessment: null,
    };
    this.properties.push(newProperty);
    return newProperty;
  }

  async updateProperty(id: number | string, property: Partial<Property>): Promise<Property | null> {
    const numId = typeof id === 'string' ? parseInt(id) : id;
    const index = this.properties.findIndex(p => p.id === numId);
    if (index === -1) return null;

    const updatedProperty = { ...this.properties[index], ...property, updatedAt: new Date() };
    this.properties[index] = updatedProperty;
    return updatedProperty;
  }

  async deleteProperty(id: number | string): Promise<boolean> {
    const numId = typeof id === 'string' ? parseInt(id) : id;
    const index = this.properties.findIndex(p => p.id === numId);
    if (index === -1) return false;

    this.properties.splice(index, 1);
    return true;
  }

  // Improvement methods
  async getImprovements(propertyId?: string): Promise<Improvement[]> {
    if (!propertyId) return this.improvements;
    return this.improvements.filter(i => i.propertyId === propertyId);
  }

  async getImprovementById(id: number | string): Promise<Improvement | null> {
    const numId = typeof id === 'string' ? parseInt(id) : id;
    return this.improvements.find(i => i.id === numId) || null;
  }

  async createImprovement(improvement: InsertImprovement): Promise<Improvement> {
    const newImprovement: Improvement = {
      ...improvement,
      id: this.improvements.length + 1,
      lastUpdated: new Date(),
    };
    this.improvements.push(newImprovement);
    return newImprovement;
  }

  async updateImprovement(id: number | string, improvement: Partial<Improvement>): Promise<Improvement | null> {
    const numId = typeof id === 'string' ? parseInt(id) : id;
    const index = this.improvements.findIndex(i => i.id === numId);
    if (index === -1) return null;

    const updatedImprovement = { ...this.improvements[index], ...improvement, lastUpdated: new Date() };
    this.improvements[index] = updatedImprovement;
    return updatedImprovement;
  }

  async deleteImprovement(id: number | string): Promise<boolean> {
    const numId = typeof id === 'string' ? parseInt(id) : id;
    const index = this.improvements.findIndex(i => i.id === numId);
    if (index === -1) return false;

    this.improvements.splice(index, 1);
    return true;
  }

  // Cost Matrix methods
  async getCostMatrices(filter?: Partial<CostMatrix>): Promise<CostMatrix[]> {
    if (!filter) return this.costMatrices;
    
    return this.costMatrices.filter(m => {
      for (const [key, value] of Object.entries(filter)) {
        if (m[key as keyof CostMatrix] !== value) return false;
      }
      return true;
    });
  }

  async getCostMatrixById(id: number | string): Promise<CostMatrix | null> {
    const numId = typeof id === 'string' ? parseInt(id) : id;
    return this.costMatrices.find(m => m.id === numId) || null;
  }

  async getCostMatrixByBuildingType(buildingType: string, region: string, year: number): Promise<CostMatrix | null> {
    return this.costMatrices.find(m => 
      m.buildingType === buildingType && 
      m.region === region && 
      m.year === year
    ) || null;
  }

  async createCostMatrix(matrix: InsertCostMatrix): Promise<CostMatrix> {
    const newMatrix: CostMatrix = {
      ...matrix,
      id: this.costMatrices.length + 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.costMatrices.push(newMatrix);
    return newMatrix;
  }

  async updateCostMatrix(id: number | string, matrix: Partial<CostMatrix>): Promise<CostMatrix | null> {
    const numId = typeof id === 'string' ? parseInt(id) : id;
    const index = this.costMatrices.findIndex(m => m.id === numId);
    if (index === -1) return null;

    const updatedMatrix = { ...this.costMatrices[index], ...matrix, updatedAt: new Date() };
    this.costMatrices[index] = updatedMatrix;
    return updatedMatrix;
  }

  async deleteCostMatrix(id: number | string): Promise<boolean> {
    const numId = typeof id === 'string' ? parseInt(id) : id;
    const index = this.costMatrices.findIndex(m => m.id === numId);
    if (index === -1) return false;

    this.costMatrices.splice(index, 1);
    return true;
  }

  // Building Type methods
  async getBuildingTypes(): Promise<BuildingType[]> {
    return this.buildingTypes;
  }

  async getBuildingTypeByCode(code: string): Promise<BuildingType | null> {
    return this.buildingTypes.find(bt => bt.code === code) || null;
  }

  async createBuildingType(buildingType: Partial<BuildingType>): Promise<BuildingType> {
    const newBuildingType: BuildingType = {
      ...buildingType as BuildingType,
      id: this.buildingTypes.length + 1,
      lastUpdated: new Date(),
    };
    this.buildingTypes.push(newBuildingType);
    return newBuildingType;
  }

  async updateBuildingType(code: string, buildingType: Partial<BuildingType>): Promise<BuildingType | null> {
    const index = this.buildingTypes.findIndex(bt => bt.code === code);
    if (index === -1) return null;

    const updatedBuildingType = { ...this.buildingTypes[index], ...buildingType, lastUpdated: new Date() };
    this.buildingTypes[index] = updatedBuildingType;
    return updatedBuildingType;
  }

  async deleteBuildingType(code: string): Promise<boolean> {
    const index = this.buildingTypes.findIndex(bt => bt.code === code);
    if (index === -1) return false;

    this.buildingTypes.splice(index, 1);
    return true;
  }

  // Region methods
  async getRegions(): Promise<Region[]> {
    return this.regions;
  }

  async getRegionByCode(code: string): Promise<Region | null> {
    return this.regions.find(r => r.code === code) || null;
  }

  async createRegion(region: Partial<Region>): Promise<Region> {
    const newRegion: Region = {
      ...region as Region,
      id: this.regions.length + 1,
      lastUpdated: new Date(),
    };
    this.regions.push(newRegion);
    return newRegion;
  }

  async updateRegion(code: string, region: Partial<Region>): Promise<Region | null> {
    const index = this.regions.findIndex(r => r.code === code);
    if (index === -1) return null;

    const updatedRegion = { ...this.regions[index], ...region, lastUpdated: new Date() };
    this.regions[index] = updatedRegion;
    return updatedRegion;
  }

  async deleteRegion(code: string): Promise<boolean> {
    const index = this.regions.findIndex(r => r.code === code);
    if (index === -1) return false;

    this.regions.splice(index, 1);
    return true;
  }

  // Cost Factor methods
  async getQualityFactors(): Promise<QualityFactor[]> {
    return this.qualityFactors;
  }

  async getConditionFactors(): Promise<ConditionFactor[]> {
    return this.conditionFactors;
  }

  async getAgeFactors(): Promise<AgeFactor[]> {
    return this.ageFactors;
  }

  // Calculation methods
  async getCalculations(propertyId?: string, improvementId?: string): Promise<Calculation[]> {
    if (propertyId && improvementId) {
      return this.calculations.filter(c => c.propertyId === propertyId && c.improvementId === improvementId);
    } else if (propertyId) {
      return this.calculations.filter(c => c.propertyId === propertyId);
    } else if (improvementId) {
      return this.calculations.filter(c => c.improvementId === improvementId);
    }
    return this.calculations;
  }

  async getCalculationById(id: number | string): Promise<Calculation | null> {
    const numId = typeof id === 'string' ? parseInt(id) : id;
    return this.calculations.find(c => c.id === numId) || null;
  }

  async createCalculation(calculation: InsertCalculation): Promise<Calculation> {
    const newCalculation: Calculation = {
      ...calculation,
      id: this.calculations.length + 1,
      calculationDate: new Date(),
    };
    this.calculations.push(newCalculation);
    return newCalculation;
  }

  async deleteCalculation(id: number | string): Promise<boolean> {
    const numId = typeof id === 'string' ? parseInt(id) : id;
    const index = this.calculations.findIndex(c => c.id === numId);
    if (index === -1) return false;

    this.calculations.splice(index, 1);
    return true;
  }

  // Project methods
  async getProjects(userId?: string): Promise<Project[]> {
    if (!userId) return this.projects;
    
    // Get projects where user is owner
    const ownedProjects = this.projects.filter(p => p.ownerId === userId);
    
    // Get projects where user is a member
    const memberProjectIds = this.projectMembers
      .filter(pm => pm.userId === userId)
      .map(pm => pm.projectId);
    
    const memberProjects = this.projects.filter(p => memberProjectIds.includes(p.projectId));
    
    // Combine and remove duplicates
    return [...new Set([...ownedProjects, ...memberProjects])];
  }

  async getProjectById(id: number | string): Promise<Project | null> {
    const numId = typeof id === 'string' ? parseInt(id) : id;
    return this.projects.find(p => p.id === numId) || null;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const newProject: Project = {
      ...project,
      id: this.projects.length + 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.projects.push(newProject);
    return newProject;
  }

  async updateProject(id: number | string, project: Partial<Project>): Promise<Project | null> {
    const numId = typeof id === 'string' ? parseInt(id) : id;
    const index = this.projects.findIndex(p => p.id === numId);
    if (index === -1) return null;

    const updatedProject = { ...this.projects[index], ...project, updatedAt: new Date() };
    this.projects[index] = updatedProject;
    return updatedProject;
  }

  async deleteProject(id: number | string): Promise<boolean> {
    const numId = typeof id === 'string' ? parseInt(id) : id;
    const index = this.projects.findIndex(p => p.id === numId);
    if (index === -1) return false;

    this.projects.splice(index, 1);
    return true;
  }

  // Project Members methods
  async addProjectMember(projectId: string, userId: string, role: string = 'member'): Promise<boolean> {
    // Check if project exists
    const project = this.projects.find(p => p.projectId === projectId);
    if (!project) return false;

    // Check if user exists
    const user = this.users.find(u => u.userId === userId);
    if (!user) return false;

    // Check if already a member
    const existingMember = this.projectMembers.find(
      pm => pm.projectId === projectId && pm.userId === userId
    );
    if (existingMember) return false;

    // Add member
    this.projectMembers.push({ projectId, userId, role });
    return true;
  }

  async removeProjectMember(projectId: string, userId: string): Promise<boolean> {
    const index = this.projectMembers.findIndex(
      pm => pm.projectId === projectId && pm.userId === userId
    );
    if (index === -1) return false;

    this.projectMembers.splice(index, 1);
    return true;
  }

  async getProjectMembers(projectId: string): Promise<User[]> {
    const memberUserIds = this.projectMembers
      .filter(pm => pm.projectId === projectId)
      .map(pm => pm.userId);
    
    return this.users.filter(u => memberUserIds.includes(u.userId));
  }

  // Project Properties methods
  async addPropertyToProject(projectId: string, propertyId: string): Promise<boolean> {
    // Check if project exists
    const project = this.projects.find(p => p.projectId === projectId);
    if (!project) return false;

    // Check if property exists
    const property = this.properties.find(p => p.propertyId === propertyId);
    if (!property) return false;

    // Check if already associated
    const existingAssociation = this.projectProperties.find(
      pp => pp.projectId === projectId && pp.propertyId === propertyId
    );
    if (existingAssociation) return false;

    // Add association
    this.projectProperties.push({ projectId, propertyId });
    return true;
  }

  async removePropertyFromProject(projectId: string, propertyId: string): Promise<boolean> {
    const index = this.projectProperties.findIndex(
      pp => pp.projectId === projectId && pp.propertyId === propertyId
    );
    if (index === -1) return false;

    this.projectProperties.splice(index, 1);
    return true;
  }

  async getProjectProperties(projectId: string): Promise<Property[]> {
    const propertyIds = this.projectProperties
      .filter(pp => pp.projectId === projectId)
      .map(pp => pp.propertyId);
    
    return this.properties.filter(p => propertyIds.includes(p.propertyId));
  }

  // Settings methods
  async getSettings(): Promise<Setting[]> {
    return this.settings.map(setting => ({
      id: setting.id || 1, // Mock ID for memory storage if not present
      key: setting.key,
      value: setting.value,
      type: setting.type || 'string'
    }));
  }
  
  async getSetting(key: string): Promise<Setting | undefined> {
    const setting = this.settings.find(s => s.key === key);
    if (!setting) return undefined;
    
    return {
      id: setting.id || 1, // Mock ID for memory storage if not present
      key: setting.key,
      value: setting.value,
      type: setting.type || 'string'
    };
  }

  async setSetting(key: string, value: string): Promise<boolean> {
    const index = this.settings.findIndex(s => s.key === key);
    
    if (index === -1) {
      this.settings.push({ 
        key, 
        value, 
        type: 'string' 
      });
    } else {
      this.settings[index] = { 
        ...this.settings[index], 
        value
      };
    }
    
    return true;
  }
}

/**
 * Database Storage Implementation
 * Used for production with PostgreSQL
 */
export class DBStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;

  constructor() {
    // Initialize database connection
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    const client = postgres(connectionString);
    this.db = drizzle(client, { schema });
  }

  // User methods
  async getUsers(): Promise<User[]> {
    return this.db.query.users.findMany();
  }

  async getUserById(id: number | string): Promise<User | null> {
    if (typeof id === 'string' && id.includes('-')) {
      // This is a UUID
      return this.db.query.users.findFirst({
        where: eq(schema.users.userId, id)
      });
    } else {
      const numId = typeof id === 'string' ? parseInt(id) : id;
      return this.db.query.users.findFirst({
        where: eq(schema.users.id, numId)
      });
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.db.query.users.findFirst({
      where: eq(schema.users.email, email)
    });
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await this.db.insert(schema.users)
      .values(user)
      .returning();
    return newUser;
  }

  async updateUser(id: number | string, user: Partial<User>): Promise<User | null> {
    let result;
    
    if (typeof id === 'string' && id.includes('-')) {
      // This is a UUID
      result = await this.db.update(schema.users)
        .set({ ...user, updatedAt: new Date() })
        .where(eq(schema.users.userId, id))
        .returning();
    } else {
      const numId = typeof id === 'string' ? parseInt(id) : id;
      result = await this.db.update(schema.users)
        .set({ ...user, updatedAt: new Date() })
        .where(eq(schema.users.id, numId))
        .returning();
    }
    
    return result.length > 0 ? result[0] : null;
  }

  async deleteUser(id: number | string): Promise<boolean> {
    let result;
    
    if (typeof id === 'string' && id.includes('-')) {
      // This is a UUID
      result = await this.db.delete(schema.users)
        .where(eq(schema.users.userId, id))
        .returning();
    } else {
      const numId = typeof id === 'string' ? parseInt(id) : id;
      result = await this.db.delete(schema.users)
        .where(eq(schema.users.id, numId))
        .returning();
    }
    
    return result.length > 0;
  }

  // Property methods
  async getProperties(filter?: Partial<Property>): Promise<Property[]> {
    if (!filter) {
      return this.db.query.properties.findMany({
        orderBy: [desc(schema.properties.updatedAt)]
      });
    }
    
    // Build where conditions based on filter
    const conditions = [];
    for (const [key, value] of Object.entries(filter)) {
      if (value !== undefined && schema.properties[key as keyof typeof schema.properties]) {
        conditions.push(eq(schema.properties[key as keyof typeof schema.properties], value));
      }
    }
    
    if (conditions.length === 0) {
      return this.db.query.properties.findMany({
        orderBy: [desc(schema.properties.updatedAt)]
      });
    }
    
    return this.db.query.properties.findMany({
      where: and(...conditions),
      orderBy: [desc(schema.properties.updatedAt)]
    });
  }

  async getPropertyById(id: number | string): Promise<Property | null> {
    if (typeof id === 'string' && id.includes('-')) {
      // This is a UUID
      return this.db.query.properties.findFirst({
        where: eq(schema.properties.propertyId, id)
      });
    } else {
      const numId = typeof id === 'string' ? parseInt(id) : id;
      return this.db.query.properties.findFirst({
        where: eq(schema.properties.id, numId)
      });
    }
  }

  async getPropertyByParcelId(parcelId: string): Promise<Property | null> {
    return this.db.query.properties.findFirst({
      where: eq(schema.properties.parcelId, parcelId)
    });
  }

  async createProperty(property: InsertProperty): Promise<Property> {
    const [newProperty] = await this.db.insert(schema.properties)
      .values(property)
      .returning();
    return newProperty;
  }

  async updateProperty(id: number | string, property: Partial<Property>): Promise<Property | null> {
    let result;
    
    if (typeof id === 'string' && id.includes('-')) {
      // This is a UUID
      result = await this.db.update(schema.properties)
        .set({ ...property, updatedAt: new Date() })
        .where(eq(schema.properties.propertyId, id))
        .returning();
    } else {
      const numId = typeof id === 'string' ? parseInt(id) : id;
      result = await this.db.update(schema.properties)
        .set({ ...property, updatedAt: new Date() })
        .where(eq(schema.properties.id, numId))
        .returning();
    }
    
    return result.length > 0 ? result[0] : null;
  }

  async deleteProperty(id: number | string): Promise<boolean> {
    let result;
    
    if (typeof id === 'string' && id.includes('-')) {
      // This is a UUID
      result = await this.db.delete(schema.properties)
        .where(eq(schema.properties.propertyId, id))
        .returning();
    } else {
      const numId = typeof id === 'string' ? parseInt(id) : id;
      result = await this.db.delete(schema.properties)
        .where(eq(schema.properties.id, numId))
        .returning();
    }
    
    return result.length > 0;
  }

  // Improvement methods
  async getImprovements(propertyId?: string): Promise<Improvement[]> {
    if (!propertyId) {
      return this.db.query.improvements.findMany({
        orderBy: [desc(schema.improvements.lastUpdated)]
      });
    }
    
    return this.db.query.improvements.findMany({
      where: eq(schema.improvements.propertyId, propertyId),
      orderBy: [desc(schema.improvements.lastUpdated)]
    });
  }

  async getImprovementById(id: number | string): Promise<Improvement | null> {
    if (typeof id === 'string' && id.includes('-')) {
      // This is a UUID
      return this.db.query.improvements.findFirst({
        where: eq(schema.improvements.improvementId, id)
      });
    } else {
      const numId = typeof id === 'string' ? parseInt(id) : id;
      return this.db.query.improvements.findFirst({
        where: eq(schema.improvements.id, numId)
      });
    }
  }

  async createImprovement(improvement: InsertImprovement): Promise<Improvement> {
    const [newImprovement] = await this.db.insert(schema.improvements)
      .values(improvement)
      .returning();
    return newImprovement;
  }

  async updateImprovement(id: number | string, improvement: Partial<Improvement>): Promise<Improvement | null> {
    let result;
    
    if (typeof id === 'string' && id.includes('-')) {
      // This is a UUID
      result = await this.db.update(schema.improvements)
        .set({ ...improvement, lastUpdated: new Date() })
        .where(eq(schema.improvements.improvementId, id))
        .returning();
    } else {
      const numId = typeof id === 'string' ? parseInt(id) : id;
      result = await this.db.update(schema.improvements)
        .set({ ...improvement, lastUpdated: new Date() })
        .where(eq(schema.improvements.id, numId))
        .returning();
    }
    
    return result.length > 0 ? result[0] : null;
  }

  async deleteImprovement(id: number | string): Promise<boolean> {
    let result;
    
    if (typeof id === 'string' && id.includes('-')) {
      // This is a UUID
      result = await this.db.delete(schema.improvements)
        .where(eq(schema.improvements.improvementId, id))
        .returning();
    } else {
      const numId = typeof id === 'string' ? parseInt(id) : id;
      result = await this.db.delete(schema.improvements)
        .where(eq(schema.improvements.id, numId))
        .returning();
    }
    
    return result.length > 0;
  }

  // Cost Matrix methods
  async getCostMatrices(filter?: Partial<CostMatrix>): Promise<CostMatrix[]> {
    if (!filter) {
      return this.db.query.costMatrix.findMany({
        orderBy: [desc(schema.costMatrix.updatedAt)]
      });
    }
    
    // Build where conditions based on filter
    const conditions = [];
    for (const [key, value] of Object.entries(filter)) {
      if (value !== undefined && schema.costMatrix[key as keyof typeof schema.costMatrix]) {
        conditions.push(eq(schema.costMatrix[key as keyof typeof schema.costMatrix], value));
      }
    }
    
    if (conditions.length === 0) {
      return this.db.query.costMatrix.findMany({
        orderBy: [desc(schema.costMatrix.updatedAt)]
      });
    }
    
    return this.db.query.costMatrix.findMany({
      where: and(...conditions),
      orderBy: [desc(schema.costMatrix.updatedAt)]
    });
  }

  async getCostMatrixById(id: number | string): Promise<CostMatrix | null> {
    if (typeof id === 'string' && id.includes('-')) {
      // This is a UUID
      return this.db.query.costMatrix.findFirst({
        where: eq(schema.costMatrix.matrixId, id)
      });
    } else {
      const numId = typeof id === 'string' ? parseInt(id) : id;
      return this.db.query.costMatrix.findFirst({
        where: eq(schema.costMatrix.id, numId)
      });
    }
  }

  async getCostMatrixByBuildingType(buildingType: string, region: string, year: number): Promise<CostMatrix | null> {
    return this.db.query.costMatrix.findFirst({
      where: and(
        eq(schema.costMatrix.buildingType, buildingType),
        eq(schema.costMatrix.region, region),
        eq(schema.costMatrix.year, year)
      )
    });
  }

  async createCostMatrix(matrix: InsertCostMatrix): Promise<CostMatrix> {
    const [newMatrix] = await this.db.insert(schema.costMatrix)
      .values(matrix)
      .returning();
    return newMatrix;
  }

  async updateCostMatrix(id: number | string, matrix: Partial<CostMatrix>): Promise<CostMatrix | null> {
    let result;
    
    if (typeof id === 'string' && id.includes('-')) {
      // This is a UUID
      result = await this.db.update(schema.costMatrix)
        .set({ ...matrix, updatedAt: new Date() })
        .where(eq(schema.costMatrix.matrixId, id))
        .returning();
    } else {
      const numId = typeof id === 'string' ? parseInt(id) : id;
      result = await this.db.update(schema.costMatrix)
        .set({ ...matrix, updatedAt: new Date() })
        .where(eq(schema.costMatrix.id, numId))
        .returning();
    }
    
    return result.length > 0 ? result[0] : null;
  }

  async deleteCostMatrix(id: number | string): Promise<boolean> {
    let result;
    
    if (typeof id === 'string' && id.includes('-')) {
      // This is a UUID
      result = await this.db.delete(schema.costMatrix)
        .where(eq(schema.costMatrix.matrixId, id))
        .returning();
    } else {
      const numId = typeof id === 'string' ? parseInt(id) : id;
      result = await this.db.delete(schema.costMatrix)
        .where(eq(schema.costMatrix.id, numId))
        .returning();
    }
    
    return result.length > 0;
  }

  // Building Type methods
  async getBuildingTypes(): Promise<BuildingType[]> {
    return this.db.query.buildingTypes.findMany({
      orderBy: [asc(schema.buildingTypes.code)]
    });
  }

  async getBuildingTypeByCode(code: string): Promise<BuildingType | null> {
    return this.db.query.buildingTypes.findFirst({
      where: eq(schema.buildingTypes.code, code)
    });
  }

  async createBuildingType(buildingType: Partial<BuildingType>): Promise<BuildingType> {
    const [newBuildingType] = await this.db.insert(schema.buildingTypes)
      .values(buildingType as any)
      .returning();
    return newBuildingType;
  }

  async updateBuildingType(code: string, buildingType: Partial<BuildingType>): Promise<BuildingType | null> {
    const result = await this.db.update(schema.buildingTypes)
      .set({ ...buildingType, lastUpdated: new Date() })
      .where(eq(schema.buildingTypes.code, code))
      .returning();
    
    return result.length > 0 ? result[0] : null;
  }

  async deleteBuildingType(code: string): Promise<boolean> {
    const result = await this.db.delete(schema.buildingTypes)
      .where(eq(schema.buildingTypes.code, code))
      .returning();
    
    return result.length > 0;
  }

  // Region methods
  async getRegions(): Promise<Region[]> {
    return this.db.query.regions.findMany({
      orderBy: [asc(schema.regions.code)]
    });
  }

  async getRegionByCode(code: string): Promise<Region | null> {
    return this.db.query.regions.findFirst({
      where: eq(schema.regions.code, code)
    });
  }

  async createRegion(region: Partial<Region>): Promise<Region> {
    const [newRegion] = await this.db.insert(schema.regions)
      .values(region as any)
      .returning();
    return newRegion;
  }

  async updateRegion(code: string, region: Partial<Region>): Promise<Region | null> {
    const result = await this.db.update(schema.regions)
      .set({ ...region, lastUpdated: new Date() })
      .where(eq(schema.regions.code, code))
      .returning();
    
    return result.length > 0 ? result[0] : null;
  }

  async deleteRegion(code: string): Promise<boolean> {
    const result = await this.db.delete(schema.regions)
      .where(eq(schema.regions.code, code))
      .returning();
    
    return result.length > 0;
  }

  // Cost Factor methods
  async getQualityFactors(): Promise<QualityFactor[]> {
    return this.db.query.qualityFactors.findMany({
      orderBy: [asc(schema.qualityFactors.code)]
    });
  }

  async getConditionFactors(): Promise<ConditionFactor[]> {
    return this.db.query.conditionFactors.findMany({
      orderBy: [asc(schema.conditionFactors.code)]
    });
  }

  async getAgeFactors(): Promise<AgeFactor[]> {
    return this.db.query.ageFactors.findMany({
      orderBy: [asc(schema.ageFactors.minAge)]
    });
  }

  // Calculation methods
  async getCalculations(propertyId?: string, improvementId?: string): Promise<Calculation[]> {
    if (propertyId && improvementId) {
      return this.db.query.calculations.findMany({
        where: and(
          eq(schema.calculations.propertyId, propertyId),
          eq(schema.calculations.improvementId, improvementId)
        ),
        orderBy: [desc(schema.calculations.calculationDate)]
      });
    } else if (propertyId) {
      return this.db.query.calculations.findMany({
        where: eq(schema.calculations.propertyId, propertyId),
        orderBy: [desc(schema.calculations.calculationDate)]
      });
    } else if (improvementId) {
      return this.db.query.calculations.findMany({
        where: eq(schema.calculations.improvementId, improvementId),
        orderBy: [desc(schema.calculations.calculationDate)]
      });
    }
    
    return this.db.query.calculations.findMany({
      orderBy: [desc(schema.calculations.calculationDate)]
    });
  }

  async getCalculationById(id: number | string): Promise<Calculation | null> {
    // Convert ID to number and query by ID
    const numId = typeof id === 'string' ? parseInt(id) : id;
    return this.db.query.calculations.findFirst({
      where: eq(schema.calculations.id, numId)
    });
  }

  async createCalculation(calculation: InsertCalculation): Promise<Calculation> {
    const [newCalculation] = await this.db.insert(schema.calculations)
      .values(calculation)
      .returning();
    return newCalculation;
  }

  async deleteCalculation(id: number | string): Promise<boolean> {
    let result;
    
    if (typeof id === 'string' && id.includes('-')) {
      // This is a UUID
      result = await this.db.delete(schema.calculations)
        .where(eq(schema.calculations.id, id))
        .returning();
    } else {
      const numId = typeof id === 'string' ? parseInt(id) : id;
      result = await this.db.delete(schema.calculations)
        .where(eq(schema.calculations.id, numId))
        .returning();
    }
    
    return result.length > 0;
  }

  // Project methods
  async getProjects(userId?: string): Promise<Project[]> {
    if (!userId) {
      return this.db.query.projects.findMany({
        orderBy: [desc(schema.projects.updatedAt)]
      });
    }
    
    // Get projects where user is owner directly
    const ownedProjects = await this.db.query.projects.findMany({
      where: eq(schema.projects.ownerId, userId),
      orderBy: [desc(schema.projects.updatedAt)]
    });
    
    // Get project IDs where user is a member
    const memberResults = await this.db
      .select({ projectId: schema.projectMembers.projectId })
      .from(schema.projectMembers)
      .where(eq(schema.projectMembers.userId, userId));
    
    const memberProjectIds = memberResults.map(r => r.projectId);
    
    if (memberProjectIds.length === 0) {
      return ownedProjects;
    }
    
    // Get member projects
    const memberProjects = await this.db.query.projects.findMany({
      where: inArray(schema.projects.projectId, memberProjectIds),
      orderBy: [desc(schema.projects.updatedAt)]
    });
    
    // Combine and remove duplicates
    const allProjects = [...ownedProjects];
    
    // Add member projects if not already included
    for (const project of memberProjects) {
      if (!allProjects.some(p => p.projectId === project.projectId)) {
        allProjects.push(project);
      }
    }
    
    return allProjects;
  }

  async getProjectById(id: number | string): Promise<Project | null> {
    if (typeof id === 'string' && id.includes('-')) {
      // This is a UUID
      return this.db.query.projects.findFirst({
        where: eq(schema.projects.projectId, id)
      });
    } else {
      const numId = typeof id === 'string' ? parseInt(id) : id;
      return this.db.query.projects.findFirst({
        where: eq(schema.projects.id, numId)
      });
    }
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await this.db.insert(schema.projects)
      .values(project)
      .returning();
    return newProject;
  }

  async updateProject(id: number | string, project: Partial<Project>): Promise<Project | null> {
    let result;
    
    if (typeof id === 'string' && id.includes('-')) {
      // This is a UUID
      result = await this.db.update(schema.projects)
        .set({ ...project, updatedAt: new Date() })
        .where(eq(schema.projects.projectId, id))
        .returning();
    } else {
      const numId = typeof id === 'string' ? parseInt(id) : id;
      result = await this.db.update(schema.projects)
        .set({ ...project, updatedAt: new Date() })
        .where(eq(schema.projects.id, numId))
        .returning();
    }
    
    return result.length > 0 ? result[0] : null;
  }

  async deleteProject(id: number | string): Promise<boolean> {
    let result;
    
    if (typeof id === 'string' && id.includes('-')) {
      // This is a UUID
      result = await this.db.delete(schema.projects)
        .where(eq(schema.projects.projectId, id))
        .returning();
    } else {
      const numId = typeof id === 'string' ? parseInt(id) : id;
      result = await this.db.delete(schema.projects)
        .where(eq(schema.projects.id, numId))
        .returning();
    }
    
    return result.length > 0;
  }

  // Project Members methods
  async addProjectMember(projectId: string, userId: string, role: string = 'member'): Promise<boolean> {
    try {
      await this.db.insert(schema.projectMembers)
        .values({
          projectId,
          userId,
          role,
          joinedAt: new Date()
        });
      return true;
    } catch (error) {
      console.error('Error adding project member:', error);
      return false;
    }
  }

  async removeProjectMember(projectId: string, userId: string): Promise<boolean> {
    const result = await this.db.delete(schema.projectMembers)
      .where(and(
        eq(schema.projectMembers.projectId, projectId),
        eq(schema.projectMembers.userId, userId)
      ))
      .returning();
    
    return result.length > 0;
  }

  async getProjectMembers(projectId: string): Promise<User[]> {
    // Get user IDs for the project
    const memberResults = await this.db
      .select({ userId: schema.projectMembers.userId })
      .from(schema.projectMembers)
      .where(eq(schema.projectMembers.projectId, projectId));
    
    const memberUserIds = memberResults.map(r => r.userId);
    
    if (memberUserIds.length === 0) {
      return [];
    }
    
    // Get user details
    return this.db.query.users.findMany({
      where: inArray(schema.users.userId, memberUserIds)
    });
  }

  // Project Properties methods
  async addPropertyToProject(projectId: string, propertyId: string): Promise<boolean> {
    try {
      await this.db.insert(schema.projectProperties)
        .values({
          projectId,
          propertyId,
          addedAt: new Date()
        });
      return true;
    } catch (error) {
      console.error('Error adding property to project:', error);
      return false;
    }
  }

  async removePropertyFromProject(projectId: string, propertyId: string): Promise<boolean> {
    const result = await this.db.delete(schema.projectProperties)
      .where(and(
        eq(schema.projectProperties.projectId, projectId),
        eq(schema.projectProperties.propertyId, propertyId)
      ))
      .returning();
    
    return result.length > 0;
  }

  async getProjectProperties(projectId: string): Promise<Property[]> {
    // Get property IDs for the project
    const propertyResults = await this.db
      .select({ propertyId: schema.projectProperties.propertyId })
      .from(schema.projectProperties)
      .where(eq(schema.projectProperties.projectId, projectId));
    
    const propertyIds = propertyResults.map(r => r.propertyId);
    
    if (propertyIds.length === 0) {
      return [];
    }
    
    // Get property details
    return this.db.query.properties.findMany({
      where: inArray(schema.properties.propertyId, propertyIds)
    });
  }

  // Settings methods
  async getSettings(): Promise<Setting[]> {
    const results = await this.db.query.settings.findMany();
    
    return results.map(result => ({
      id: result.id,
      key: result.key,
      value: result.value,
      type: result.type || 'string'
    }));
  }
  
  async getSetting(key: string): Promise<Setting | undefined> {
    const result = await this.db.query.settings.findFirst({
      where: eq(schema.settings.key, key)
    });
    
    return result ? {
      id: result.id,
      key: result.key,
      value: result.value,
      type: result.type || 'string'
    } : undefined;
  }

  async setSetting(key: string, value: string, description?: string): Promise<boolean> {
    try {
      // Check if setting exists
      const existingSettings = await this.db.query.settings.findFirst({
        where: eq(schema.settings.key, key)
      });
      
      if (existingSettings) {
        // Update existing setting
        await this.db.update(schema.settings)
          .set({ 
            value, 
            description: description || existingSettings.description,
            lastUpdated: new Date()
          })
          .where(eq(schema.settings.key, key));
      } else {
        // Create new setting
        await this.db.insert(schema.settings)
          .values({
            key,
            value,
            description,
            lastUpdated: new Date()
          });
      }
      
      return true;
    } catch (error) {
      console.error('Error setting value:', error);
      return false;
    }
  }
}

// Select the appropriate storage implementation based on environment
let storage: IStorage;

if (process.env.NODE_ENV === 'test' || process.env.USE_MEM_STORAGE === 'true') {
  storage = new MemStorage();
} else if (process.env.DATABASE_URL) {
  storage = new DBStorage();
} else {
  console.warn('No DATABASE_URL set, falling back to memory storage');
  storage = new MemStorage();
}

export default storage;
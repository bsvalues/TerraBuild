/**
 * TerraBuild Database Storage Implementation
 * 
 * This file provides the PostgreSQL database implementation of the storage interface.
 */

import { eq, and, sql, desc, asc, like, inArray } from 'drizzle-orm';
import { db } from './db';
import * as schema from '../shared/schema';
import {
  User, InsertUser,
  Property, InsertProperty,
  BuildingType, InsertBuildingType,
  Region, InsertRegion,
  Improvement, InsertImprovement,
  ImprovementDetail, InsertImprovementDetail,
  CostMatrix, InsertCostMatrix,
  Session, InsertSession,
  SessionHistory, InsertSessionHistory,
  Insight, InsertInsight,
  Export, InsertExport,
  Calculation, InsertCalculation,
  Project, InsertProject,
  ProjectMember, InsertProjectMember,
  ProjectProperty, InsertProjectProperty,
  Setting, InsertSetting,
  FileUpload, InsertFileUpload
} from '../shared/schema';

import { IStorage } from './storage';

/**
 * Database Storage Implementation
 * Used for production with PostgreSQL database
 */
export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | null> {
    const result = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return result[0] || null;
  }
  
  // Alias for getUser to maintain compatibility with IStorage interface
  async getUserById(id: number): Promise<User | null> {
    return this.getUser(id);
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const result = await db.select().from(schema.users).where(eq(schema.users.username, username));
    return result[0] || null;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [result] = await db.insert(schema.users).values(user).returning();
    return result;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | null> {
    const [result] = await db
      .update(schema.users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(schema.users.id, id))
      .returning();
    return result || null;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(schema.users);
  }
  
  // Alias for getAllUsers to maintain compatibility with IStorage interface
  async getUsers(): Promise<User[]> {
    return this.getAllUsers();
  }
  
  async deleteUser(id: number): Promise<boolean> {
    try {
      await db.delete(schema.users).where(eq(schema.users.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }
  
  // Property methods
  async getProperties(filter?: Record<string, any>): Promise<Property[]> {
    // Implement when Property schema is available
    return [];
  }
  
  async getPropertyById(id: number): Promise<Property | null> {
    // Implement when Property schema is available
    return null;
  }
  
  async getPropertyByGeoId(geoId: string): Promise<Property | null> {
    // Implement when Property schema is available
    return null;
  }
  
  async createProperty(property: InsertProperty): Promise<Property> {
    // Implement when Property schema is available
    throw new Error("Method not implemented");
  }
  
  async updateProperty(id: number, propertyData: Partial<Property>): Promise<Property | null> {
    // Implement when Property schema is available
    return null;
  }
  
  async deleteProperty(id: number): Promise<boolean> {
    // Implement when Property schema is available
    return false;
  }
  
  // Building type methods
  async getBuildingTypes(): Promise<BuildingType[]> {
    // Implement when BuildingType schema is available
    return [];
  }
  
  async getBuildingTypeByCode(code: string): Promise<BuildingType | null> {
    // Implement when BuildingType schema is available
    return null;
  }
  
  async createBuildingType(buildingType: InsertBuildingType): Promise<BuildingType> {
    // Implement when BuildingType schema is available
    throw new Error("Method not implemented");
  }
  
  async updateBuildingType(code: string, buildingTypeData: Partial<BuildingType>): Promise<BuildingType | null> {
    // Implement when BuildingType schema is available
    return null;
  }
  
  async deleteBuildingType(code: string): Promise<boolean> {
    // Implement when BuildingType schema is available
    return false;
  }
  
  // Region operations
  async getRegions(): Promise<Region[]> {
    // Implement when Region schema is available
    return [];
  }
  
  async getRegionByCode(code: string): Promise<Region | null> {
    // Implement when Region schema is available
    return null;
  }
  
  async createRegion(region: InsertRegion): Promise<Region> {
    // Implement when Region schema is available
    throw new Error("Method not implemented");
  }
  
  async updateRegion(code: string, regionData: Partial<Region>): Promise<Region | null> {
    // Implement when Region schema is available
    return null;
  }
  
  async deleteRegion(code: string): Promise<boolean> {
    // Implement when Region schema is available
    return false;
  }
  
  // Improvement operations
  async getImprovements(propertyId?: string): Promise<Improvement[]> {
    // Implement when Improvement schema is available
    return [];
  }
  
  async getImprovementById(id: number): Promise<Improvement | null> {
    // Implement when Improvement schema is available
    return null;
  }
  
  async createImprovement(improvement: InsertImprovement): Promise<Improvement> {
    // Implement when Improvement schema is available
    throw new Error("Method not implemented");
  }
  
  async updateImprovement(id: number, improvementData: Partial<Improvement>): Promise<Improvement | null> {
    // Implement when Improvement schema is available
    return null;
  }
  
  async deleteImprovement(id: number): Promise<boolean> {
    // Implement when Improvement schema is available
    return false;
  }
  
  // Improvement details operations
  async getImprovementDetails(improvementId: number): Promise<ImprovementDetail[]> {
    // Implement when ImprovementDetail schema is available
    return [];
  }
  
  async createImprovementDetail(detail: InsertImprovementDetail): Promise<ImprovementDetail> {
    // Implement when ImprovementDetail schema is available
    throw new Error("Method not implemented");
  }
  
  async deleteImprovementDetail(id: number): Promise<boolean> {
    // Implement when ImprovementDetail schema is available
    return false;
  }

  // Cost Matrix methods
  async getCostMatrix(id: number): Promise<CostMatrix | null> {
    // Using costMatrix (singular) which is the correct table name
    const result = await db.select().from(schema.costMatrix).where(eq(schema.costMatrix.id, id));
    return result[0] || null;
  }

  async getCostMatrixByBuildingType(buildingTypeCode: string, county: string, year: number): Promise<CostMatrix | null> {
    // Using costMatrix (singular) which is the correct table name
    // Field names match the actual database schema columns
    const result = await db.select().from(schema.costMatrix).where(
      and(
        eq(schema.costMatrix.building_type, buildingTypeCode), 
        eq(schema.costMatrix.county, county),
        eq(schema.costMatrix.matrix_year, year) // Using matrix_year which is the field in the database
      )
    );
    return result[0] || null;
  }

  async createCostMatrix(matrix: InsertCostMatrix): Promise<CostMatrix> {
    // Using costMatrix (singular) which is the correct table name
    const [result] = await db.insert(schema.costMatrix).values(matrix).returning();
    return result;
  }

  async updateCostMatrix(id: number, matrixData: Partial<CostMatrix>): Promise<CostMatrix | null> {
    // Using costMatrix (singular) which is the correct table name
    // Using updated_at which is the field in the database
    const [result] = await db
      .update(schema.costMatrix)
      .set({ ...matrixData, updated_at: new Date() })
      .where(eq(schema.costMatrix.id, id))
      .returning();
    return result || null;
  }

  async getAllCostMatrices(): Promise<CostMatrix[]> {
    // Using costMatrix (singular) which is the correct table name
    return await db.select().from(schema.costMatrix);
  }

  async getCostMatricesByCounty(county: string): Promise<CostMatrix[]> {
    // Using costMatrix (singular) which is the correct table name
    // and 'county' field from the actual database structure
    return await db.select().from(schema.costMatrix).where(eq(schema.costMatrix.county, county));
  }
  
  // Alias for compatibility with IStorage interface
  async getCostMatrices(filter?: Record<string, any>): Promise<CostMatrix[]> {
    if (!filter) {
      return this.getAllCostMatrices();
    }
    
    if (filter.county) {
      return this.getCostMatricesByCounty(filter.county);
    }
    
    // Implement more filters as needed
    return this.getAllCostMatrices();
  }
  
  // Alias for compatibility with IStorage interface
  async getCostMatrixById(id: number): Promise<CostMatrix | null> {
    return this.getCostMatrix(id);
  }
  
  async deleteCostMatrix(id: number): Promise<boolean> {
    try {
      // Using costMatrix (singular) which is the correct table name
      await db.delete(schema.costMatrix).where(eq(schema.costMatrix.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting cost matrix:', error);
      return false;
    }
  }

  // Session methods
  async getSession(id: string): Promise<Session | null> {
    const result = await db.select().from(schema.sessions).where(eq(schema.sessions.id, id));
    return result[0] || null;
  }

  async createSession(session: InsertSession): Promise<Session> {
    const [result] = await db.insert(schema.sessions).values(session).returning();
    return result;
  }

  async updateSession(id: string, sessionData: Partial<Session>): Promise<Session | null> {
    const [result] = await db
      .update(schema.sessions)
      .set({ ...sessionData, updatedAt: new Date() })
      .where(eq(schema.sessions.id, id))
      .returning();
    return result || null;
  }

  async getUserSessions(userId: number): Promise<Session[]> {
    return await db.select().from(schema.sessions).where(eq(schema.sessions.userId, userId));
  }

  async getAllSessions(): Promise<Session[]> {
    return await db.select().from(schema.sessions);
  }

  // Session History methods
  async createSessionHistory(history: InsertSessionHistory): Promise<SessionHistory> {
    const [result] = await db.insert(schema.sessionHistory).values(history).returning();
    return result;
  }

  async getSessionHistory(sessionId: string): Promise<SessionHistory[]> {
    return await db
      .select()
      .from(schema.sessionHistory)
      .where(eq(schema.sessionHistory.sessionId, sessionId))
      .orderBy(desc(schema.sessionHistory.createdAt));
  }

  // Insight methods
  async createInsight(insight: InsertInsight): Promise<Insight> {
    const [result] = await db.insert(schema.insights).values(insight).returning();
    return result;
  }

  async getSessionInsights(sessionId: string): Promise<Insight[]> {
    return await db
      .select()
      .from(schema.insights)
      .where(eq(schema.insights.sessionId, sessionId))
      .orderBy(desc(schema.insights.createdAt));
  }

  async updateInsight(id: number, insightData: Partial<Insight>): Promise<Insight | null> {
    const [result] = await db
      .update(schema.insights)
      .set(insightData)
      .where(eq(schema.insights.id, id))
      .returning();
    return result || null;
  }

  // Export methods
  async createExport(exportData: InsertExport): Promise<Export> {
    const [result] = await db.insert(schema.exports).values(exportData).returning();
    return result;
  }

  async getSessionExports(sessionId: string): Promise<Export[]> {
    return await db
      .select()
      .from(schema.exports)
      .where(eq(schema.exports.sessionId, sessionId))
      .orderBy(desc(schema.exports.createdAt));
  }

  async getUserExports(userId: number): Promise<Export[]> {
    return await db
      .select()
      .from(schema.exports)
      .where(eq(schema.exports.userId, userId))
      .orderBy(desc(schema.exports.createdAt));
  }

  // Relations queries
  async getSessionWithDetails(sessionId: string): Promise<any> {
    // First get the session
    const session = await this.getSession(sessionId);
    if (!session) return null;

    // Get related data
    const [user, costMatrix, history, insights, exports] = await Promise.all([
      session.userId ? this.getUser(session.userId) : undefined,
      session.costMatrixId ? this.getCostMatrix(session.costMatrixId) : undefined,
      this.getSessionHistory(sessionId),
      this.getSessionInsights(sessionId),
      this.getSessionExports(sessionId)
    ]);

    return {
      ...session,
      user,
      costMatrix,
      history,
      insights,
      exports
    };
  }

  // Cost factor methods
  async getQualityFactors(): Promise<Record<string, number>> {
    // Return hardcoded factors for now
    return {
      'economy': 0.8,
      'average': 1.0,
      'good': 1.2,
      'excellent': 1.5,
      'luxury': 1.8
    };
  }

  async getConditionFactors(): Promise<Record<string, number>> {
    // Return hardcoded factors for now
    return {
      'poor': 0.7,
      'fair': 0.85,
      'average': 1.0,
      'good': 1.15,
      'excellent': 1.3
    };
  }

  async getAgeFactors(): Promise<Record<number, number>> {
    // Return hardcoded factors for now
    // Key is age in years, value is the factor
    const factors: Record<number, number> = {};
    
    // New buildings (0-1 years)
    factors[0] = 1.0;
    factors[1] = 1.0;
    
    // 2-10 years: small decrease
    for (let i = 2; i <= 10; i++) {
      factors[i] = 1.0 - (i - 1) * 0.01;
    }
    
    // 11-50 years: larger decrease
    for (let i = 11; i <= 50; i++) {
      factors[i] = 0.91 - (i - 10) * 0.012;
    }
    
    // 51+ years: minimum factor
    for (let i = 51; i <= 100; i++) {
      factors[i] = 0.45;
    }
    
    return factors;
  }

  // Session methods for IStorage interface compatibility
  async getSessions(userId?: number): Promise<Session[]> {
    if (userId) {
      return this.getUserSessions(userId);
    }
    return this.getAllSessions();
  }
  
  async deleteSession(id: string): Promise<boolean> {
    try {
      await db.delete(schema.sessions).where(eq(schema.sessions.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting session:', error);
      return false;
    }
  }
  
  // Calculation methods
  async getCalculations(propertyId?: string, improvementId?: string): Promise<Calculation[]> {
    let query = db.select().from(schema.calculations);
    
    if (propertyId) {
      query = query.where(eq(schema.calculations.propertyId, parseInt(propertyId)));
    }
    
    if (improvementId) {
      query = query.where(eq(schema.calculations.improvementId, parseInt(improvementId)));
    }
    
    return await query;
  }
  
  async getCalculationById(id: number): Promise<Calculation | null> {
    const result = await db.select().from(schema.calculations).where(eq(schema.calculations.id, id));
    return result[0] || null;
  }
  
  async createCalculation(calculation: InsertCalculation): Promise<Calculation> {
    const [result] = await db.insert(schema.calculations).values(calculation).returning();
    return result;
  }
  
  async deleteCalculation(id: number): Promise<boolean> {
    try {
      await db.delete(schema.calculations).where(eq(schema.calculations.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting calculation:', error);
      return false;
    }
  }
  
  // Project related methods
  async getProjects(userId?: string): Promise<Project[]> {
    let query = db.select().from(schema.projects);
    
    if (userId) {
      query = query.where(eq(schema.projects.userId, parseInt(userId)));
    }
    
    return await query;
  }
  
  async getProjectById(id: number): Promise<Project | null> {
    const result = await db.select().from(schema.projects).where(eq(schema.projects.id, id));
    return result[0] || null;
  }
  
  async createProject(project: InsertProject): Promise<Project> {
    const [result] = await db.insert(schema.projects).values(project).returning();
    return result;
  }
  
  async updateProject(id: number, projectData: Partial<Project>): Promise<Project | null> {
    const [result] = await db
      .update(schema.projects)
      .set({ ...projectData, updatedAt: new Date() })
      .where(eq(schema.projects.id, id))
      .returning();
    return result || null;
  }
  
  async deleteProject(id: number): Promise<boolean> {
    try {
      await db.delete(schema.projects).where(eq(schema.projects.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting project:', error);
      return false;
    }
  }
  
  // Project members methods
  async getProjectMembers(projectId: string): Promise<ProjectMember[]> {
    return await db
      .select()
      .from(schema.projectMembers)
      .where(eq(schema.projectMembers.projectId, parseInt(projectId)));
  }
  
  async addProjectMember(projectId: string, userId: string, role?: string): Promise<boolean> {
    try {
      await db.insert(schema.projectMembers).values({
        projectId: parseInt(projectId),
        userId: parseInt(userId),
        role: role || 'member',
      });
      return true;
    } catch (error) {
      console.error('Error adding project member:', error);
      return false;
    }
  }
  
  async removeProjectMember(projectId: string, userId: string): Promise<boolean> {
    try {
      await db
        .delete(schema.projectMembers)
        .where(
          and(
            eq(schema.projectMembers.projectId, parseInt(projectId)),
            eq(schema.projectMembers.userId, parseInt(userId))
          )
        );
      return true;
    } catch (error) {
      console.error('Error removing project member:', error);
      return false;
    }
  }

  // Project properties methods
  async getProjectProperties(projectId: string): Promise<ProjectProperty[]> {
    return await db
      .select()
      .from(schema.projectProperties)
      .where(eq(schema.projectProperties.projectId, parseInt(projectId)));
  }
  
  async addPropertyToProject(projectId: string, propertyId: string): Promise<boolean> {
    try {
      await db.insert(schema.projectProperties).values({
        projectId: parseInt(projectId),
        propertyId: parseInt(propertyId),
      });
      return true;
    } catch (error) {
      console.error('Error adding property to project:', error);
      return false;
    }
  }
  
  async removePropertyFromProject(projectId: string, propertyId: string): Promise<boolean> {
    try {
      await db
        .delete(schema.projectProperties)
        .where(
          and(
            eq(schema.projectProperties.projectId, parseInt(projectId)),
            eq(schema.projectProperties.propertyId, parseInt(propertyId))
          )
        );
      return true;
    } catch (error) {
      console.error('Error removing property from project:', error);
      return false;
    }
  }
  
  // Settings methods
  async getSettings(userId?: number, isPublic?: boolean): Promise<Setting[]> {
    let query = db.select().from(schema.settings);
    
    if (userId !== undefined) {
      query = query.where(eq(schema.settings.userId, userId));
    }
    
    if (isPublic !== undefined) {
      query = query.where(eq(schema.settings.isPublic, isPublic));
    }
    
    return await query;
  }
  
  async getSetting(key: string, userId?: number): Promise<Setting | null> {
    let query = db.select().from(schema.settings).where(eq(schema.settings.key, key));
    
    if (userId !== undefined) {
      query = query.where(eq(schema.settings.userId, userId));
    }
    
    const result = await query;
    return result[0] || null;
  }
  
  async createSetting(setting: InsertSetting): Promise<Setting> {
    const [result] = await db.insert(schema.settings).values(setting).returning();
    return result;
  }
  
  async updateSetting(id: number, settingData: Partial<Setting>): Promise<Setting | null> {
    const [result] = await db
      .update(schema.settings)
      .set({ ...settingData, updatedAt: new Date() })
      .where(eq(schema.settings.id, id))
      .returning();
    return result || null;
  }
  
  async deleteSetting(id: number): Promise<boolean> {
    try {
      await db.delete(schema.settings).where(eq(schema.settings.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting setting:', error);
      return false;
    }
  }
  
  // File upload methods
  async getFileUploads(userId?: number): Promise<FileUpload[]> {
    let query = db.select().from(schema.fileUploads);
    
    if (userId !== undefined) {
      query = query.where(eq(schema.fileUploads.userId, userId));
    }
    
    return await query;
  }
  
  async getFileUploadById(id: number): Promise<FileUpload | null> {
    const result = await db.select().from(schema.fileUploads).where(eq(schema.fileUploads.id, id));
    return result[0] || null;
  }
  
  async createFileUpload(fileUpload: InsertFileUpload): Promise<FileUpload> {
    const [result] = await db.insert(schema.fileUploads).values(fileUpload).returning();
    return result;
  }
  
  async updateFileUpload(id: number, fileUploadData: Partial<FileUpload>): Promise<FileUpload | null> {
    const [result] = await db
      .update(schema.fileUploads)
      .set({ ...fileUploadData, updatedAt: new Date() })
      .where(eq(schema.fileUploads.id, id))
      .returning();
    return result || null;
  }
  
  async deleteFileUpload(id: number): Promise<boolean> {
    try {
      await db.delete(schema.fileUploads).where(eq(schema.fileUploads.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting file upload:', error);
      return false;
    }
  }
  
  // Database utility methods
  async checkDatabaseConnection(): Promise<boolean> {
    try {
      await db.execute(sql`SELECT 1`);
      return true;
    } catch (error) {
      console.error('Database connection check failed:', error);
      return false;
    }
  }
  
  // Agent status methods for monitoring
  async getAgentStatuses(): Promise<Record<string, any>> {
    try {
      const results = await db.select().from(schema.agentStatuses);
      
      // Convert array to object with agent IDs as keys
      const statuses: Record<string, any> = {};
      results.forEach(status => {
        statuses[status.agentId] = {
          status: status.status,
          lastUpdated: status.updatedAt,
          metadata: status.metadata,
          errorMessage: status.errorMessage
        };
      });
      
      return statuses;
    } catch (error) {
      console.error('Error fetching agent statuses:', error);
      return {};
    }
  }
  
  async getAgentStatus(agentId: string): Promise<any | null> {
    try {
      const [status] = await db
        .select()
        .from(schema.agentStatuses)
        .where(eq(schema.agentStatuses.agentId, agentId));
      
      if (!status) return null;
      
      return {
        agentId: status.agentId,
        status: status.status,
        lastUpdated: status.updatedAt,
        metadata: status.metadata,
        errorMessage: status.errorMessage
      };
    } catch (error) {
      console.error(`Error fetching agent status for ${agentId}:`, error);
      return null;
    }
  }
  
  async updateAgentStatus(
    agentId: string,
    status: string,
    metadata?: Record<string, any>,
    errorMessage?: string
  ): Promise<boolean> {
    try {
      // Check if the agent status already exists
      const existingStatus = await this.getAgentStatus(agentId);
      
      if (existingStatus) {
        // Update existing status
        await db
          .update(schema.agentStatuses)
          .set({
            status,
            metadata: metadata || existingStatus.metadata,
            errorMessage: errorMessage || null,
            updatedAt: new Date()
          })
          .where(eq(schema.agentStatuses.agentId, agentId));
      } else {
        // Create new status
        await db
          .insert(schema.agentStatuses)
          .values({
            agentId,
            status,
            metadata: metadata || {},
            errorMessage: errorMessage || null,
            createdAt: new Date(),
            updatedAt: new Date()
          });
      }
      
      return true;
    } catch (error) {
      console.error(`Error updating agent status for ${agentId}:`, error);
      return false;
    }
  }
}
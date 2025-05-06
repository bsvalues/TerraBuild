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
  CostMatrix, InsertCostMatrix,
  Session, InsertSession,
  SessionHistory, InsertSessionHistory,
  Insight, InsertInsight,
  Export, InsertExport
} from '../shared/schema';

import { IStorage } from './storage';

/**
 * Database Storage Implementation
 * Used for production with PostgreSQL database
 */
export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.username, username));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const [result] = await db.insert(schema.users).values(user).returning();
    return result;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [result] = await db
      .update(schema.users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(schema.users.id, id))
      .returning();
    return result;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(schema.users);
  }

  // Cost Matrix methods
  async getCostMatrix(id: number): Promise<CostMatrix | undefined> {
    const result = await db.select().from(schema.costMatrices).where(eq(schema.costMatrices.id, id));
    return result[0];
  }

  async getCostMatrixByBuildingType(buildingTypeCode: string, county: string, year: number): Promise<CostMatrix | undefined> {
    const result = await db.select().from(schema.costMatrices).where(
      and(
        eq(schema.costMatrices.buildingTypeCode, buildingTypeCode),
        eq(schema.costMatrices.county, county),
        eq(schema.costMatrices.year, year)
      )
    );
    return result[0];
  }

  async createCostMatrix(matrix: InsertCostMatrix): Promise<CostMatrix> {
    const [result] = await db.insert(schema.costMatrices).values(matrix).returning();
    return result;
  }

  async updateCostMatrix(id: number, matrixData: Partial<CostMatrix>): Promise<CostMatrix | undefined> {
    const [result] = await db
      .update(schema.costMatrices)
      .set({ ...matrixData, updatedAt: new Date() })
      .where(eq(schema.costMatrices.id, id))
      .returning();
    return result;
  }

  async getAllCostMatrices(): Promise<CostMatrix[]> {
    return await db.select().from(schema.costMatrices);
  }

  async getCostMatricesByCounty(county: string): Promise<CostMatrix[]> {
    return await db.select().from(schema.costMatrices).where(eq(schema.costMatrices.county, county));
  }

  // Session methods
  async getSession(id: string): Promise<Session | undefined> {
    const result = await db.select().from(schema.sessions).where(eq(schema.sessions.id, id));
    return result[0];
  }

  async createSession(session: InsertSession): Promise<Session> {
    const [result] = await db.insert(schema.sessions).values(session).returning();
    return result;
  }

  async updateSession(id: string, sessionData: Partial<Session>): Promise<Session | undefined> {
    const [result] = await db
      .update(schema.sessions)
      .set({ ...sessionData, updatedAt: new Date() })
      .where(eq(schema.sessions.id, id))
      .returning();
    return result;
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

  async updateInsight(id: number, insightData: Partial<Insight>): Promise<Insight | undefined> {
    const [result] = await db
      .update(schema.insights)
      .set(insightData)
      .where(eq(schema.insights.id, id))
      .returning();
    return result;
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
}
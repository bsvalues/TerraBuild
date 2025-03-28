import { IStorage } from './storage';
import { db } from './db';
import { eq, and } from 'drizzle-orm';
import { 
  User, InsertUser,
  Environment, InsertEnvironment,
  ApiEndpoint, InsertApiEndpoint,
  Setting, InsertSetting,
  Activity, InsertActivity,
  RepositoryStatus, InsertRepositoryStatus,
  BuildingCost, InsertBuildingCost,
  CostFactor, InsertCostFactor,
  users, environments, apiEndpoints, settings, activities, repositoryStatus,
  buildingCosts, costFactors
} from '@shared/schema';

export class PostgresStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }
  
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  
  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(users)
      .set(user)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }
  
  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }
  
  // Environments
  async getAllEnvironments(): Promise<Environment[]> {
    return await db.select().from(environments);
  }
  
  async getEnvironment(id: number): Promise<Environment | undefined> {
    const result = await db.select().from(environments).where(eq(environments.id, id));
    return result[0];
  }
  
  async createEnvironment(env: InsertEnvironment): Promise<Environment> {
    const result = await db.insert(environments).values(env).returning();
    return result[0];
  }
  
  // API Endpoints
  async getAllApiEndpoints(): Promise<ApiEndpoint[]> {
    return await db.select().from(apiEndpoints);
  }
  
  async getApiEndpoint(id: number): Promise<ApiEndpoint | undefined> {
    const result = await db.select().from(apiEndpoints).where(eq(apiEndpoints.id, id));
    return result[0];
  }
  
  async createApiEndpoint(endpoint: InsertApiEndpoint): Promise<ApiEndpoint> {
    const result = await db.insert(apiEndpoints).values(endpoint).returning();
    return result[0];
  }
  
  async updateApiEndpointStatus(id: number, status: string): Promise<ApiEndpoint | undefined> {
    const result = await db.update(apiEndpoints)
      .set({ status })
      .where(eq(apiEndpoints.id, id))
      .returning();
    return result[0];
  }
  
  async deleteApiEndpoint(id: number): Promise<void> {
    await db.delete(apiEndpoints).where(eq(apiEndpoints.id, id));
  }
  
  // Settings
  async getAllSettings(): Promise<Setting[]> {
    return await db.select().from(settings);
  }
  
  async getSetting(key: string): Promise<Setting | undefined> {
    const result = await db.select().from(settings).where(eq(settings.key, key));
    return result[0];
  }
  
  async updateSetting(key: string, value: string): Promise<Setting | undefined> {
    const result = await db.update(settings)
      .set({ value })
      .where(eq(settings.key, key))
      .returning();
    return result[0];
  }
  
  async createSetting(setting: InsertSetting): Promise<Setting> {
    const result = await db.insert(settings).values(setting).returning();
    return result[0];
  }
  
  // Activities
  async getAllActivities(): Promise<Activity[]> {
    return await db.select().from(activities);
  }
  
  async createActivity(activity: InsertActivity): Promise<Activity> {
    const result = await db.insert(activities).values(activity).returning();
    return result[0];
  }
  
  // Repository Status
  async getRepositoryStatus(): Promise<RepositoryStatus | undefined> {
    const result = await db.select().from(repositoryStatus).limit(1);
    return result[0];
  }
  
  async createRepositoryStatus(repoStatus: InsertRepositoryStatus): Promise<RepositoryStatus> {
    // Include the current timestamp for clonedAt
    const result = await db.insert(repositoryStatus)
      .values({
        ...repoStatus,
        clonedAt: new Date()
      })
      .returning();
    return result[0];
  }
  
  async updateRepositoryStatus(id: number, status: string, steps: any[]): Promise<RepositoryStatus | undefined> {
    const result = await db.update(repositoryStatus)
      .set({ status, steps })
      .where(eq(repositoryStatus.id, id))
      .returning();
    return result[0];
  }

  // Building Costs
  async getAllBuildingCosts(): Promise<BuildingCost[]> {
    return await db.select().from(buildingCosts);
  }

  async getBuildingCost(id: number): Promise<BuildingCost | undefined> {
    const result = await db.select().from(buildingCosts).where(eq(buildingCosts.id, id));
    return result[0];
  }

  async createBuildingCost(cost: InsertBuildingCost): Promise<BuildingCost> {
    const result = await db.insert(buildingCosts)
      .values({
        ...cost,
        updatedAt: new Date()
      })
      .returning();
    return result[0];
  }

  async updateBuildingCost(id: number, cost: Partial<InsertBuildingCost>): Promise<BuildingCost | undefined> {
    const result = await db.update(buildingCosts)
      .set({
        ...cost,
        updatedAt: new Date()
      })
      .where(eq(buildingCosts.id, id))
      .returning();
    return result[0];
  }

  async deleteBuildingCost(id: number): Promise<void> {
    await db.delete(buildingCosts).where(eq(buildingCosts.id, id));
  }

  // Cost Factors
  async getAllCostFactors(): Promise<CostFactor[]> {
    return await db.select().from(costFactors);
  }

  async getCostFactorsByRegionAndType(region: string, buildingType: string): Promise<CostFactor | undefined> {
    const result = await db.select().from(costFactors).where(
      and(
        eq(costFactors.region, region),
        eq(costFactors.buildingType, buildingType)
      )
    );
    return result[0];
  }

  async createCostFactor(factor: InsertCostFactor): Promise<CostFactor> {
    const result = await db.insert(costFactors).values(factor).returning();
    return result[0];
  }

  async updateCostFactor(id: number, factor: Partial<InsertCostFactor>): Promise<CostFactor | undefined> {
    const result = await db.update(costFactors)
      .set(factor)
      .where(eq(costFactors.id, id))
      .returning();
    return result[0];
  }

  async deleteCostFactor(id: number): Promise<void> {
    await db.delete(costFactors).where(eq(costFactors.id, id));
  }
}
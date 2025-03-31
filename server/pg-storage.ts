import { IStorage } from './storage';
import { db } from './db';
import { eq, and, desc } from 'drizzle-orm';
import { 
  User, InsertUser,
  Environment, InsertEnvironment,
  ApiEndpoint, InsertApiEndpoint,
  Setting, InsertSetting,
  Activity, InsertActivity,
  RepositoryStatus, InsertRepositoryStatus,
  BuildingCost, InsertBuildingCost,
  CostFactor, InsertCostFactor,
  MaterialType, InsertMaterialType,
  MaterialCost, InsertMaterialCost,
  BuildingCostMaterial, InsertBuildingCostMaterial,
  CalculationHistory, InsertCalculationHistory,
  users, environments, apiEndpoints, settings, activities, repositoryStatus,
  buildingCosts, costFactors, materialTypes, materialCosts, buildingCostMaterials,
  calculationHistory
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

  // Material Types
  async getAllMaterialTypes(): Promise<MaterialType[]> {
    return await db.select().from(materialTypes);
  }

  async getMaterialType(id: number): Promise<MaterialType | undefined> {
    const result = await db.select().from(materialTypes).where(eq(materialTypes.id, id));
    return result[0];
  }

  async getMaterialTypeByCode(code: string): Promise<MaterialType | undefined> {
    const result = await db.select().from(materialTypes).where(eq(materialTypes.code, code));
    return result[0];
  }

  async createMaterialType(materialType: InsertMaterialType): Promise<MaterialType> {
    const result = await db.insert(materialTypes).values(materialType).returning();
    return result[0];
  }

  async updateMaterialType(id: number, materialType: Partial<InsertMaterialType>): Promise<MaterialType | undefined> {
    const result = await db.update(materialTypes)
      .set(materialType)
      .where(eq(materialTypes.id, id))
      .returning();
    return result[0];
  }

  async deleteMaterialType(id: number): Promise<void> {
    await db.delete(materialTypes).where(eq(materialTypes.id, id));
  }

  // Material Costs
  async getAllMaterialCosts(): Promise<MaterialCost[]> {
    return await db.select().from(materialCosts);
  }

  async getMaterialCostsByBuildingType(buildingType: string): Promise<MaterialCost[]> {
    return await db.select().from(materialCosts)
      .where(eq(materialCosts.buildingType, buildingType));
  }

  async getMaterialCostsByRegion(region: string): Promise<MaterialCost[]> {
    return await db.select().from(materialCosts)
      .where(eq(materialCosts.region, region));
  }

  async getMaterialCostsByBuildingTypeAndRegion(buildingType: string, region: string): Promise<MaterialCost[]> {
    return await db.select().from(materialCosts)
      .where(and(
        eq(materialCosts.buildingType, buildingType),
        eq(materialCosts.region, region)
      ));
  }

  async getMaterialCost(id: number): Promise<MaterialCost | undefined> {
    const result = await db.select().from(materialCosts).where(eq(materialCosts.id, id));
    return result[0];
  }

  async createMaterialCost(materialCost: InsertMaterialCost): Promise<MaterialCost> {
    const result = await db.insert(materialCosts).values({
      ...materialCost,
      updatedAt: new Date()
    }).returning();
    return result[0];
  }

  async updateMaterialCost(id: number, materialCost: Partial<InsertMaterialCost>): Promise<MaterialCost | undefined> {
    const result = await db.update(materialCosts)
      .set({
        ...materialCost,
        updatedAt: new Date()
      })
      .where(eq(materialCosts.id, id))
      .returning();
    return result[0];
  }

  async deleteMaterialCost(id: number): Promise<void> {
    await db.delete(materialCosts).where(eq(materialCosts.id, id));
  }

  // Building Cost Materials
  async getBuildingCostMaterials(buildingCostId: number): Promise<BuildingCostMaterial[]> {
    return await db.select().from(buildingCostMaterials)
      .where(eq(buildingCostMaterials.buildingCostId, buildingCostId));
  }

  async createBuildingCostMaterial(material: InsertBuildingCostMaterial): Promise<BuildingCostMaterial> {
    const result = await db.insert(buildingCostMaterials).values(material).returning();
    return result[0];
  }

  async deleteAllBuildingCostMaterials(buildingCostId: number): Promise<void> {
    await db.delete(buildingCostMaterials)
      .where(eq(buildingCostMaterials.buildingCostId, buildingCostId));
  }

  // Calculate Materials Breakdown
  async calculateMaterialsBreakdown(
    region: string, 
    buildingType: string, 
    squareFootage: number, 
    complexityMultiplier: number = 1
  ): Promise<any> {
    // Get all the material costs for this region and building type
    const materialCosts = await this.getMaterialCostsByBuildingTypeAndRegion(buildingType, region);
    
    if (materialCosts.length === 0) {
      throw new Error(`No material costs found for ${buildingType} in ${region}`);
    }
    
    // Get the cost factor for this region and building type
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
    return await db.select().from(calculationHistory).orderBy(desc(calculationHistory.createdAt));
  }
  
  async getCalculationHistoryByUserId(userId: number): Promise<CalculationHistory[]> {
    return await db.select().from(calculationHistory)
      .where(eq(calculationHistory.userId, userId))
      .orderBy(desc(calculationHistory.createdAt));
  }
  
  async getCalculationHistory(id: number): Promise<CalculationHistory | undefined> {
    const result = await db.select().from(calculationHistory).where(eq(calculationHistory.id, id));
    return result[0];
  }
  
  async createCalculationHistory(calculation: InsertCalculationHistory): Promise<CalculationHistory> {
    const result = await db.insert(calculationHistory).values(calculation).returning();
    return result[0];
  }
  
  async deleteCalculationHistory(id: number): Promise<void> {
    await db.delete(calculationHistory).where(eq(calculationHistory.id, id));
  }
}
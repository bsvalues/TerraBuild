/**
 * PostgreSQL Property Storage Implementation
 * 
 * This file extends the PostgreSQL storage implementation with property data methods.
 */

import { PostgresStorage } from './pg-storage';
import { db } from './db';
import { eq, and, desc, asc, ne, isNull, isNotNull, inArray, sql } from 'drizzle-orm';
import {
  properties, improvements, improvementDetails, improvementItems, landDetails,
  Property, InsertProperty,
  Improvement, InsertImprovement,
  ImprovementDetail, InsertImprovementDetail,
  ImprovementItem, InsertImprovementItem,
  LandDetail, InsertLandDetail
} from '@shared/property-schema';

export class PropertyPostgresStorage extends PostgresStorage {
  // Property Methods
  async getAllProperties(options?: { limit?: number; offset?: number }): Promise<Property[]> {
    let query = db.select().from(properties).orderBy(properties.propId);
    
    if (options?.offset) {
      query = query.offset(options.offset);
    }
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    return await query.execute();
  }
  
  async getProperty(id: number): Promise<Property | undefined> {
    const results = await db.select().from(properties).where(eq(properties.id, id)).execute();
    return results[0];
  }
  
  async getPropertyByPropId(propId: number): Promise<Property | undefined> {
    const results = await db.select().from(properties).where(eq(properties.propId, propId)).execute();
    return results[0];
  }
  
  async createProperty(property: InsertProperty): Promise<Property> {
    const results = await db.insert(properties).values({
      ...property,
      importedAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return results[0];
  }
  
  async updateProperty(id: number, property: Partial<InsertProperty>): Promise<Property | undefined> {
    const results = await db.update(properties)
      .set({ ...property, updatedAt: new Date() })
      .where(eq(properties.id, id))
      .returning();
    return results[0];
  }
  
  async deleteProperty(id: number): Promise<void> {
    await db.delete(properties).where(eq(properties.id, id));
  }
  
  async bulkInsertProperties(props: InsertProperty[]): Promise<{ count: number }> {
    if (props.length === 0) return { count: 0 };
    
    const results = await db.insert(properties).values(
      props.map(prop => ({
        ...prop,
        importedAt: new Date(),
        updatedAt: new Date()
      }))
    ).returning();
    
    return { count: results.length };
  }
  
  // Improvement Methods
  async getImprovementsByPropertyId(propId: number): Promise<Improvement[]> {
    return await db.select().from(improvements).where(eq(improvements.propId, propId)).execute();
  }
  
  async getImprovement(id: number): Promise<Improvement | undefined> {
    const results = await db.select().from(improvements).where(eq(improvements.id, id)).execute();
    return results[0];
  }
  
  async createImprovement(improvement: InsertImprovement): Promise<Improvement> {
    const results = await db.insert(improvements).values({
      ...improvement,
      importedAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return results[0];
  }
  
  async updateImprovement(id: number, improvement: Partial<InsertImprovement>): Promise<Improvement | undefined> {
    const results = await db.update(improvements)
      .set({ ...improvement, updatedAt: new Date() })
      .where(eq(improvements.id, id))
      .returning();
    return results[0];
  }
  
  async deleteImprovement(id: number): Promise<void> {
    await db.delete(improvements).where(eq(improvements.id, id));
  }
  
  async bulkInsertImprovements(items: InsertImprovement[]): Promise<{ count: number }> {
    if (items.length === 0) return { count: 0 };
    
    const results = await db.insert(improvements).values(
      items.map(item => ({
        ...item,
        importedAt: new Date(),
        updatedAt: new Date()
      }))
    ).returning();
    
    return { count: results.length };
  }
  
  // Improvement Detail Methods
  async getImprovementDetailsByImprovementId(imprvId: number): Promise<ImprovementDetail[]> {
    return await db.select().from(improvementDetails).where(eq(improvementDetails.imprvId, imprvId));
  }
  
  async getImprovementDetail(id: number): Promise<ImprovementDetail | undefined> {
    const results = await db.select().from(improvementDetails).where(eq(improvementDetails.id, id));
    return results[0];
  }
  
  async createImprovementDetail(detail: InsertImprovementDetail): Promise<ImprovementDetail> {
    const results = await db.insert(improvementDetails).values({
      ...detail,
      importedAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return results[0];
  }
  
  async updateImprovementDetail(id: number, detail: Partial<InsertImprovementDetail>): Promise<ImprovementDetail | undefined> {
    const results = await db.update(improvementDetails)
      .set({ ...detail, updatedAt: new Date() })
      .where(eq(improvementDetails.id, id))
      .returning();
    return results[0];
  }
  
  async deleteImprovementDetail(id: number): Promise<void> {
    await db.delete(improvementDetails).where(eq(improvementDetails.id, id));
  }
  
  async bulkInsertImprovementDetails(details: InsertImprovementDetail[]): Promise<{ count: number }> {
    if (details.length === 0) return { count: 0 };
    
    const results = await db.insert(improvementDetails).values(
      details.map(detail => ({
        ...detail,
        importedAt: new Date(),
        updatedAt: new Date()
      }))
    ).returning();
    
    return { count: results.length };
  }
  
  // Improvement Item Methods
  async getImprovementItemsByImprovementId(imprvId: number): Promise<ImprovementItem[]> {
    return await db.select().from(improvementItems).where(eq(improvementItems.imprvId, imprvId));
  }
  
  async getImprovementItem(id: number): Promise<ImprovementItem | undefined> {
    const results = await db.select().from(improvementItems).where(eq(improvementItems.id, id));
    return results[0];
  }
  
  async createImprovementItem(item: InsertImprovementItem): Promise<ImprovementItem> {
    const results = await db.insert(improvementItems).values({
      ...item,
      importedAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return results[0];
  }
  
  async updateImprovementItem(id: number, item: Partial<InsertImprovementItem>): Promise<ImprovementItem | undefined> {
    const results = await db.update(improvementItems)
      .set({ ...item, updatedAt: new Date() })
      .where(eq(improvementItems.id, id))
      .returning();
    return results[0];
  }
  
  async deleteImprovementItem(id: number): Promise<void> {
    await db.delete(improvementItems).where(eq(improvementItems.id, id));
  }
  
  async bulkInsertImprovementItems(items: InsertImprovementItem[]): Promise<{ count: number }> {
    if (items.length === 0) return { count: 0 };
    
    const results = await db.insert(improvementItems).values(
      items.map(item => ({
        ...item,
        importedAt: new Date(),
        updatedAt: new Date()
      }))
    ).returning();
    
    return { count: results.length };
  }
  
  // Land Detail Methods
  async getLandDetailsByPropertyId(propId: number): Promise<LandDetail[]> {
    return await db.select().from(landDetails).where(eq(landDetails.propId, propId));
  }
  
  async getLandDetail(id: number): Promise<LandDetail | undefined> {
    const results = await db.select().from(landDetails).where(eq(landDetails.id, id));
    return results[0];
  }
  
  async createLandDetail(detail: InsertLandDetail): Promise<LandDetail> {
    const results = await db.insert(landDetails).values({
      ...detail,
      importedAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return results[0];
  }
  
  async updateLandDetail(id: number, detail: Partial<InsertLandDetail>): Promise<LandDetail | undefined> {
    const results = await db.update(landDetails)
      .set({ ...detail, updatedAt: new Date() })
      .where(eq(landDetails.id, id))
      .returning();
    return results[0];
  }
  
  async deleteLandDetail(id: number): Promise<void> {
    await db.delete(landDetails).where(eq(landDetails.id, id));
  }
  
  async bulkInsertLandDetails(details: InsertLandDetail[]): Promise<{ count: number }> {
    if (details.length === 0) return { count: 0 };
    
    const results = await db.insert(landDetails).values(
      details.map(detail => ({
        ...detail,
        importedAt: new Date(),
        updatedAt: new Date()
      }))
    ).returning();
    
    return { count: results.length };
  }
  
  // Property Data Import
  async importPropertyData(options: {
    propertiesFile?: string | Buffer;
    improvementsFile: string | Buffer;
    improvementDetailsFile: string | Buffer;
    improvementItemsFile: string | Buffer;
    landDetailsFile: string | Buffer;
    batchSize?: number;
    userId: number;
  }): Promise<{
    properties: { processed: number, success: number, errors: any[] },
    improvements: { processed: number, success: number, errors: any[] },
    improvementDetails: { processed: number, success: number, errors: any[] },
    improvementItems: { processed: number, success: number, errors: any[] },
    landDetails: { processed: number, success: number, errors: any[] }
  }> {
    // Import implementation is in the property-data-import.ts file
    const { importPropertyData } = require('./property-data-import');
    return importPropertyData(this, options);
  }
}
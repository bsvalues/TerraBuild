/**
 * External API Storage Interface for Building Cost Building System
 * 
 * This module provides database interactions for external API integrations
 * such as materials price caching.
 */
import { db } from "../db";
import { 
  InsertMaterialsPriceCache, 
  MaterialsPriceCache, 
  materialsPriceCache 
} from "@shared/schema";
import { eq, and, lt, gt } from "drizzle-orm";

// Materials Price Cache related functions
export async function getMaterialPrice(
  materialCode: string, 
  region: string, 
  source: string
): Promise<MaterialsPriceCache | undefined> {
  const results = await db.select().from(materialsPriceCache)
    .where(and(
      eq(materialsPriceCache.materialCode, materialCode),
      eq(materialsPriceCache.region, region),
      eq(materialsPriceCache.source, source)
    ));
  return results[0];
}

export async function getMaterialPricesByRegion(
  region: string, 
  source?: string
): Promise<MaterialsPriceCache[]> {
  let query = db.select().from(materialsPriceCache)
    .where(eq(materialsPriceCache.region, region));
  
  if (source) {
    query = query.where(eq(materialsPriceCache.source, source));
  }
  
  return query;
}

export async function getMaterialPricesByCode(
  materialCode: string, 
  source?: string
): Promise<MaterialsPriceCache[]> {
  let query = db.select().from(materialsPriceCache)
    .where(eq(materialsPriceCache.materialCode, materialCode));
  
  if (source) {
    query = query.where(eq(materialsPriceCache.source, source));
  }
  
  return query;
}

export async function getValidMaterialPrices(): Promise<MaterialsPriceCache[]> {
  const now = new Date();
  return db.select().from(materialsPriceCache)
    .where(gt(materialsPriceCache.validUntil, now));
}

export async function getExpiredMaterialPrices(): Promise<MaterialsPriceCache[]> {
  const now = new Date();
  return db.select().from(materialsPriceCache)
    .where(lt(materialsPriceCache.validUntil, now));
}

export async function saveMaterialPrice(data: InsertMaterialsPriceCache): Promise<MaterialsPriceCache> {
  // Check if the entry already exists
  const existing = await getMaterialPrice(
    data.materialCode, 
    data.region, 
    data.source
  );
  
  if (existing) {
    // Update the existing entry
    const results = await db.update(materialsPriceCache)
      .set({
        price: data.price,
        unit: data.unit,
        validUntil: data.validUntil,
        metadata: data.metadata,
        fetchedAt: new Date()
      })
      .where(and(
        eq(materialsPriceCache.materialCode, data.materialCode),
        eq(materialsPriceCache.region, data.region),
        eq(materialsPriceCache.source, data.source)
      ))
      .returning();
    return results[0];
  } else {
    // Insert a new entry
    const results = await db.insert(materialsPriceCache).values(data).returning();
    return results[0];
  }
}

export async function deleteMaterialPrice(
  materialCode: string, 
  region: string, 
  source: string
): Promise<void> {
  await db.delete(materialsPriceCache)
    .where(and(
      eq(materialsPriceCache.materialCode, materialCode),
      eq(materialsPriceCache.region, region),
      eq(materialsPriceCache.source, source)
    ));
}

export async function clearExpiredMaterialPrices(): Promise<number> {
  const now = new Date();
  const result = await db.delete(materialsPriceCache)
    .where(lt(materialsPriceCache.validUntil, now))
    .returning();
  
  return result.length;
}
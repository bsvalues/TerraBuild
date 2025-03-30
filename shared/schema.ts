import { pgTable, text, serial, integer, boolean, timestamp, json, decimal, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"),
  name: text("name"),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
  name: true,
  isActive: true,
});

// Environment
export const environments = pgTable("environments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertEnvironmentSchema = createInsertSchema(environments);

// API Endpoints
export const apiEndpoints = pgTable("api_endpoints", {
  id: serial("id").primaryKey(),
  path: text("path").notNull(),
  method: text("method").notNull(),
  status: text("status").notNull().default("online"),
  requiresAuth: boolean("requires_auth").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertApiEndpointSchema = createInsertSchema(apiEndpoints).pick({
  path: true,
  method: true,
  status: true,
  requiresAuth: true,
});

// Settings
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value"),
  type: text("type").notNull().default("string"),
});

export const insertSettingSchema = createInsertSchema(settings);

// Activities
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  action: text("action").notNull(),
  icon: text("icon").notNull(),
  iconColor: text("icon_color").notNull().default("primary"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertActivitySchema = createInsertSchema(activities).pick({
  action: true,
  icon: true,
  iconColor: true,
});

// Repository status
export const repositoryStatus = pgTable("repository_status", {
  id: serial("id").primaryKey(),
  sourceRepo: text("source_repo").notNull(),
  targetRepo: text("target_repo").notNull(),
  status: text("status").notNull().default("pending"),
  steps: json("steps").notNull().default([]),
  clonedAt: timestamp("cloned_at"),
});

export const insertRepositoryStatusSchema = createInsertSchema(repositoryStatus).pick({
  sourceRepo: true,
  targetRepo: true,
  status: true,
  steps: true,
});

// Building Costs
export const buildingCosts = pgTable("building_costs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  region: text("region").notNull(),
  buildingType: text("building_type").notNull(),
  squareFootage: integer("square_footage").notNull(),
  costPerSqft: decimal("cost_per_sqft", { precision: 10, scale: 2 }).notNull(),
  totalCost: decimal("total_cost", { precision: 14, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertBuildingCostSchema = createInsertSchema(buildingCosts).pick({
  name: true,
  region: true,
  buildingType: true,
  squareFootage: true,
  costPerSqft: true,
  totalCost: true,
});

// Cost Factors
export const costFactors = pgTable("cost_factors", {
  id: serial("id").primaryKey(),
  region: text("region").notNull(),
  buildingType: text("building_type").notNull(),
  baseCost: decimal("base_cost", { precision: 10, scale: 2 }).notNull(),
  complexityFactor: decimal("complexity_factor", { precision: 5, scale: 2 }).notNull().default("1.0"),
  regionFactor: decimal("region_factor", { precision: 5, scale: 2 }).notNull().default("1.0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCostFactorSchema = createInsertSchema(costFactors).pick({
  region: true,
  buildingType: true,
  baseCost: true,
  complexityFactor: true,
  regionFactor: true,
});

// Define types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Environment = typeof environments.$inferSelect;
export type InsertEnvironment = z.infer<typeof insertEnvironmentSchema>;

export type ApiEndpoint = typeof apiEndpoints.$inferSelect;
export type InsertApiEndpoint = z.infer<typeof insertApiEndpointSchema>;

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

export type RepositoryStatus = typeof repositoryStatus.$inferSelect;
export type InsertRepositoryStatus = z.infer<typeof insertRepositoryStatusSchema>;

export type BuildingCost = typeof buildingCosts.$inferSelect;
export type InsertBuildingCost = z.infer<typeof insertBuildingCostSchema>;

// Material Types
export const materialTypes = pgTable("material_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  description: text("description"),
  unit: text("unit").notNull().default("sqft"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMaterialTypeSchema = createInsertSchema(materialTypes).pick({
  name: true,
  code: true,
  description: true,
  unit: true,
});

// Material Costs by Building Type
export const materialCosts = pgTable("material_costs", {
  id: serial("id").primaryKey(),
  materialTypeId: integer("material_type_id").notNull(),
  buildingType: text("building_type").notNull(),
  region: text("region").notNull(),
  costPerUnit: decimal("cost_per_unit", { precision: 10, scale: 2 }).notNull(),
  defaultPercentage: decimal("default_percentage", { precision: 5, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => {
  return {
    uniqueMaterialBuilding: uniqueIndex("material_building_region_idx").on(
      table.materialTypeId, 
      table.buildingType,
      table.region
    ),
  };
});

export const insertMaterialCostSchema = createInsertSchema(materialCosts).pick({
  materialTypeId: true,
  buildingType: true,
  region: true,
  costPerUnit: true,
  defaultPercentage: true,
});

// Building Cost Materials (for saved estimates)
export const buildingCostMaterials = pgTable("building_cost_materials", {
  id: serial("id").primaryKey(),
  buildingCostId: integer("building_cost_id").notNull(),
  materialTypeId: integer("material_type_id").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  costPerUnit: decimal("cost_per_unit", { precision: 10, scale: 2 }).notNull(),
  percentage: decimal("percentage", { precision: 5, scale: 2 }).notNull(),
  totalCost: decimal("total_cost", { precision: 14, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertBuildingCostMaterialSchema = createInsertSchema(buildingCostMaterials).pick({
  buildingCostId: true,
  materialTypeId: true,
  quantity: true,
  costPerUnit: true,
  percentage: true,
  totalCost: true,
});

export type CostFactor = typeof costFactors.$inferSelect;
export type InsertCostFactor = z.infer<typeof insertCostFactorSchema>;

export type MaterialType = typeof materialTypes.$inferSelect;
export type InsertMaterialType = z.infer<typeof insertMaterialTypeSchema>;

export type MaterialCost = typeof materialCosts.$inferSelect;
export type InsertMaterialCost = z.infer<typeof insertMaterialCostSchema>;

export type BuildingCostMaterial = typeof buildingCostMaterials.$inferSelect;
export type InsertBuildingCostMaterial = z.infer<typeof insertBuildingCostMaterialSchema>;

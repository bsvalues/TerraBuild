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

// Calculation History
export const calculationHistory = pgTable("calculation_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name"),
  region: text("region").notNull(),
  buildingType: text("building_type").notNull(),
  propertyClass: text("property_class"),
  squareFootage: integer("square_footage").notNull(),
  baseCost: decimal("base_cost", { precision: 10, scale: 2 }).notNull(),
  regionFactor: decimal("region_factor", { precision: 5, scale: 2 }).notNull(),
  complexityFactor: decimal("complexity_factor", { precision: 5, scale: 2 }).notNull(),
  conditionFactor: decimal("condition_factor", { precision: 5, scale: 2 }),
  costPerSqft: decimal("cost_per_sqft", { precision: 10, scale: 2 }).notNull(),
  totalCost: decimal("total_cost", { precision: 14, scale: 2 }).notNull(),
  materialsBreakdown: json("materials_breakdown"),
  taxLotId: text("tax_lot_id"),
  propertyId: text("property_id"),
  assessmentYear: integer("assessment_year"),
  yearBuilt: integer("year_built"),
  condition: text("condition"),
  depreciationAmount: decimal("depreciation_amount", { precision: 14, scale: 2 }),
  assessedValue: decimal("assessed_value", { precision: 14, scale: 2 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCalculationHistorySchema = createInsertSchema(calculationHistory).pick({
  userId: true,
  name: true,
  region: true,
  buildingType: true,
  propertyClass: true,
  squareFootage: true,
  baseCost: true,
  regionFactor: true,
  complexityFactor: true,
  conditionFactor: true,
  costPerSqft: true,
  totalCost: true,
  materialsBreakdown: true,
  taxLotId: true,
  propertyId: true,
  assessmentYear: true,
  yearBuilt: true,
  condition: true,
  depreciationAmount: true,
  assessedValue: true,
});

export type CalculationHistory = typeof calculationHistory.$inferSelect;
export type InsertCalculationHistory = z.infer<typeof insertCalculationHistorySchema>;

// Benton County Assessment Matrix Tables
export const bentonMatrixAxis = pgTable("benton_matrix_axis", {
  id: serial("id").primaryKey(),
  matrixYear: integer("matrix_year").notNull(),
  axisCd: text("axis_cd").notNull(),
  dataType: text("data_type").notNull(),
  lookupQuery: text("lookup_query"),
  matrixType: text("matrix_type").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertBentonMatrixAxisSchema = createInsertSchema(bentonMatrixAxis).pick({
  matrixYear: true,
  axisCd: true,
  dataType: true,
  lookupQuery: true,
  matrixType: true,
});

export const bentonMatrix = pgTable("benton_matrix", {
  id: serial("id").primaryKey(),
  matrixId: integer("matrix_id").notNull(),
  matrixYear: integer("matrix_year").notNull(),
  label: text("label").notNull(),
  axis1: text("axis_1").notNull(),
  axis2: text("axis_2").notNull(),
  matrixDescription: text("matrix_description").notNull(),
  operator: text("operator").notNull(),
  defaultCellValue: decimal("default_cell_value", { precision: 10, scale: 2 }).notNull(),
  bInterpolate: boolean("b_interpolate").notNull().default(false),
  matrixType: text("matrix_type").notNull(),
  matrixSubTypeCd: text("matrix_sub_type_cd"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertBentonMatrixSchema = createInsertSchema(bentonMatrix).pick({
  matrixId: true,
  matrixYear: true,
  label: true,
  axis1: true,
  axis2: true,
  matrixDescription: true,
  operator: true,
  defaultCellValue: true,
  bInterpolate: true,
  matrixType: true,
  matrixSubTypeCd: true,
});

export const bentonMatrixDetail = pgTable("benton_matrix_detail", {
  id: serial("id").primaryKey(),
  matrixId: integer("matrix_id").notNull(),
  matrixYear: integer("matrix_year").notNull(),
  axis1Value: text("axis_1_value").notNull(),
  axis2Value: text("axis_2_value").notNull(),
  cellValue: decimal("cell_value", { precision: 14, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertBentonMatrixDetailSchema = createInsertSchema(bentonMatrixDetail).pick({
  matrixId: true,
  matrixYear: true,
  axis1Value: true,
  axis2Value: true,
  cellValue: true,
});

export const bentonImprvSchedMatrixAssoc = pgTable("benton_imprv_sched_matrix_assoc", {
  id: serial("id").primaryKey(),
  imprvDetMethCd: text("imprv_det_meth_cd").notNull(),
  imprvDetTypeCd: text("imprv_det_type_cd").notNull(),
  imprvDetClassCd: text("imprv_det_class_cd").notNull(),
  imprvYr: integer("imprv_yr").notNull(),
  matrixId: integer("matrix_id").notNull(),
  matrixOrder: integer("matrix_order").notNull(),
  adjFactor: integer("adj_factor").notNull(),
  imprvDetSubClassCd: text("imprv_det_sub_class_cd").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertBentonImprvSchedMatrixAssocSchema = createInsertSchema(bentonImprvSchedMatrixAssoc).pick({
  imprvDetMethCd: true,
  imprvDetTypeCd: true,
  imprvDetClassCd: true,
  imprvYr: true,
  matrixId: true,
  matrixOrder: true,
  adjFactor: true,
  imprvDetSubClassCd: true,
});

export const bentonDepreciationMatrix = pgTable("benton_depreciation_matrix", {
  id: serial("id").primaryKey(),
  valSubElement: text("val_sub_element").notNull(),
  matrixId: integer("matrix_id").notNull(),
  age: integer("age").notNull(),
  factor: integer("factor").notNull(),
  conditionMapped: text("condition_mapped").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertBentonDepreciationMatrixSchema = createInsertSchema(bentonDepreciationMatrix).pick({
  valSubElement: true,
  matrixId: true,
  age: true,
  factor: true,
  conditionMapped: true,
});

export type BentonMatrixAxis = typeof bentonMatrixAxis.$inferSelect;
export type InsertBentonMatrixAxis = z.infer<typeof insertBentonMatrixAxisSchema>;

export type BentonMatrix = typeof bentonMatrix.$inferSelect;
export type InsertBentonMatrix = z.infer<typeof insertBentonMatrixSchema>;

export type BentonMatrixDetail = typeof bentonMatrixDetail.$inferSelect;
export type InsertBentonMatrixDetail = z.infer<typeof insertBentonMatrixDetailSchema>;

export type BentonImprvSchedMatrixAssoc = typeof bentonImprvSchedMatrixAssoc.$inferSelect;
export type InsertBentonImprvSchedMatrixAssoc = z.infer<typeof insertBentonImprvSchedMatrixAssocSchema>;

export type BentonDepreciationMatrix = typeof bentonDepreciationMatrix.$inferSelect;
export type InsertBentonDepreciationMatrix = z.infer<typeof insertBentonDepreciationMatrixSchema>;

// Cost Matrix (simplified representation from Excel data)
export const costMatrix = pgTable("cost_matrix", {
  id: serial("id").primaryKey(),
  region: text("region").notNull(),
  buildingType: text("building_type").notNull(),
  buildingTypeDescription: text("building_type_description").notNull(),
  baseCost: decimal("base_cost", { precision: 14, scale: 2 }).notNull(),
  matrixYear: integer("matrix_year").notNull(),
  sourceMatrixId: integer("source_matrix_id").notNull(),
  matrixDescription: text("matrix_description").notNull(),   // Renamed from sourceMatrixDescription
  dataPoints: integer("data_points").notNull().default(0),
  minCost: decimal("min_cost", { precision: 14, scale: 2 }),
  maxCost: decimal("max_cost", { precision: 14, scale: 2 }),
  complexityFactorBase: decimal("complexity_factor_base", { precision: 5, scale: 2 }).notNull().default("1.0"),
  qualityFactorBase: decimal("quality_factor_base", { precision: 5, scale: 2 }).notNull().default("1.0"),
  conditionFactorBase: decimal("condition_factor_base", { precision: 5, scale: 2 }).notNull().default("1.0"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => {
  return {
    regionBuildingTypeIdx: uniqueIndex("region_building_type_year_idx").on(
      table.region, 
      table.buildingType,
      table.matrixYear
    ),
  };
});

export const insertCostMatrixSchema = createInsertSchema(costMatrix).pick({
  region: true,
  buildingType: true,
  buildingTypeDescription: true,
  baseCost: true,
  matrixYear: true,
  sourceMatrixId: true,
  matrixDescription: true,     // Updated to match the renamed field
  dataPoints: true,
  minCost: true,
  maxCost: true,
  complexityFactorBase: true,
  qualityFactorBase: true,
  conditionFactorBase: true,
  isActive: true,
});

export type CostMatrix = typeof costMatrix.$inferSelect;
export type InsertCostMatrix = z.infer<typeof insertCostMatrixSchema>;

// Cost Factor Presets
export const costFactorPresets = pgTable("cost_factor_presets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  userId: integer("user_id").notNull(),
  weights: json("weights").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCostFactorPresetSchema = createInsertSchema(costFactorPresets).pick({
  name: true,
  description: true,
  userId: true,
  weights: true,
  isDefault: true,
});

export type CostFactorPreset = typeof costFactorPresets.$inferSelect;
export type InsertCostFactorPreset = z.infer<typeof insertCostFactorPresetSchema>;

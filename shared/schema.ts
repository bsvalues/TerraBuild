/**
 * BCBS Application Database Schema
 * 
 * This file defines the schema for the Benton County Building System database.
 * It includes all tables, relationships, and types used throughout the application.
 */

import { relations, sql } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, boolean, real, json, uuid } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Re-export file upload schema
export * from './fileUploadSchema';

/*********************
 * USERS & AUTH
 *********************/

// Users Table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').defaultRandom().notNull().unique(),
  email: text('email').notNull().unique(),
  name: text('name'),
  role: text('role').default('user').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastLogin: timestamp('last_login'),
  preferences: json('preferences').$type<{ theme?: string; notifications?: boolean }>(),
});

// User Sessions Table
export const userSessions = pgTable('user_sessions', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.userId, { onDelete: 'cascade' }),
  sessionToken: text('session_token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastActivity: timestamp('last_activity'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
});

/*********************
 * PROPERTIES & IMPROVEMENTS
 *********************/

// Properties Table
export const properties = pgTable('properties', {
  id: serial('id').primaryKey(),
  propertyId: uuid('property_id').defaultRandom().notNull().unique(),
  parcelId: text('parcel_id').notNull().unique(),
  address: text('address').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  zip: text('zip').notNull(),
  county: text('county').notNull().default('Benton'),
  ownerName: text('owner_name'),
  latitude: real('latitude'),
  longitude: real('longitude'),
  propertyType: text('property_type').notNull(),
  zoning: text('zoning'),
  acreage: real('acreage'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastAssessment: timestamp('last_assessment'),
  assessedValue: integer('assessed_value'),
  totalValue: integer('total_value'),
  landValue: integer('land_value'),
  metaData: json('meta_data').$type<Record<string, any>>(),
});

// Property Improvements Table
export const improvements = pgTable('improvements', {
  id: serial('id').primaryKey(),
  improvementId: uuid('improvement_id').defaultRandom().notNull().unique(),
  propertyId: uuid('property_id').notNull().references(() => properties.propertyId, { onDelete: 'cascade' }),
  buildingType: text('building_type').notNull(),
  description: text('description').notNull(),
  yearBuilt: integer('year_built').notNull(),
  quality: text('quality').notNull(),
  condition: text('condition').notNull(),
  squareFeet: integer('square_feet').notNull(),
  stories: integer('stories').notNull().default(1),
  basementType: text('basement_type'),
  basementFinished: boolean('basement_finished').default(false),
  exteriorWall: text('exterior_wall'),
  roofType: text('roof_type'),
  heatingType: text('heating_type'),
  coolingType: text('cooling_type'),
  garageType: text('garage_type'),
  garageSquareFeet: integer('garage_square_feet').default(0),
  costPerSqFt: real('cost_per_sqft'),
  calculatedValue: integer('calculated_value'),
  depreciatedValue: integer('depreciated_value'),
  lastUpdated: timestamp('last_updated').defaultNow(),
  // For specific regional characteristics
  region: text('region').notNull().default('BC-CENTRAL'),
  adjustmentFactor: real('adjustment_factor').default(1.0),
  documentReference: text('document_reference'),
  imageUrls: json('image_urls').$type<string[]>(),
  additionalFeatures: json('additional_features').$type<Record<string, any>>(),
});

// Improvement Details Table (for granular improvement data)
export const improvementDetails = pgTable('improvement_details', {
  id: serial('id').primaryKey(),
  improvementId: uuid('improvement_id').notNull().references(() => improvements.improvementId, { onDelete: 'cascade' }),
  categoryType: text('category_type').notNull(),
  componentType: text('component_type').notNull(),
  description: text('description'),
  quantity: integer('quantity').default(1),
  unit: text('unit'),
  unitCost: real('unit_cost'),
  totalCost: real('total_cost'),
  adjustmentFactor: real('adjustment_factor').default(1.0),
  qualityGrade: text('quality_grade'),
  yearInstalled: integer('year_installed'),
  condition: text('condition'),
  normalizedValue: real('normalized_value'),
  lastUpdated: timestamp('last_updated').defaultNow(),
  notes: text('notes'),
  calculationMethod: text('calculation_method'),
});

// Land Details Table
export const landDetails = pgTable('land_details', {
  id: serial('id').primaryKey(),
  propertyId: uuid('property_id').notNull().references(() => properties.propertyId, { onDelete: 'cascade' }),
  landType: text('land_type').notNull(),
  acreage: real('acreage').notNull(),
  landValue: integer('land_value'),
  valuePerAcre: real('value_per_acre'),
  zone: text('zone'),
  topography: text('topography'),
  access: text('access'),
  utilities: text('utilities'),
  soilType: text('soil_type'),
  waterRights: boolean('water_rights').default(false),
  floodZone: text('flood_zone'),
  frontage: real('frontage'),
  depth: real('depth'),
  shape: text('shape'),
  lastUpdated: timestamp('last_updated').defaultNow(),
  additionalNotes: text('additional_notes'),
});

/*********************
 * COST MATRIX & FACTORS
 *********************/

// Building Types Table
export const buildingTypes = pgTable('building_types', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category'),
  baseRateMin: real('base_rate_min'),
  baseRateMax: real('base_rate_max'),
  baseRateAvg: real('base_rate_avg'),
  lastUpdated: timestamp('last_updated').defaultNow(),
  source: text('source'),
  isActive: boolean('is_active').default(true),
});

// Regions Table
export const regions = pgTable('regions', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  state: text('state').notNull(),
  county: text('county'),
  multiplier: real('multiplier').notNull().default(1.0),
  lastUpdated: timestamp('last_updated').defaultNow(),
  source: text('source'),
  isActive: boolean('is_active').default(true),
});

// Cost Matrix Table
export const costMatrix = pgTable('cost_matrix', {
  id: serial('id').primaryKey(),
  buildingType: text('building_type').notNull(),
  region: text('region').notNull(),
  year: integer('matrix_year').notNull(),
  baseRate: real('base_cost').notNull(),
  description: text('matrix_description'),
  sourceMatrixId: integer('source_matrix_id'),
  buildingTypeDescription: text('building_type_description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  isActive: boolean('is_active').default(true),
  complexityFactorBase: real('complexity_factor_base').default(1.0),
  qualityFactorBase: real('quality_factor_base').default(1.0),
  conditionFactorBase: real('condition_factor_base').default(1.0),
  dataPoints: integer('data_points'),
  minCost: real('min_cost'),
  maxCost: real('max_cost'),
  county: text('county'),
  state: text('state'),
});

// Matrix Detail Table (Note: This table definition doesn't match the actual database
// and is kept for compatibility with the code. The real data is in benton_matrix_detail.)
export const matrixDetail = pgTable('benton_matrix_detail', {
  id: serial('id').primaryKey(),
  matrixId: integer('matrix_id').notNull(),
  qualityGrade: text('quality_grade'),
  sizeRange: text('size_range'),
  costPerSqFt: real('cost_per_sqft'),
  description: text('description'),
  adjustmentFactor: real('adjustment_factor').default(1.0),
  lastUpdated: timestamp('last_updated').defaultNow(),
});

// Quality Factors Table
export const qualityFactors = pgTable('quality_factors', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  multiplier: real('multiplier').notNull(),
  buildingType: text('building_type').references(() => buildingTypes.code),
  lastUpdated: timestamp('last_updated').defaultNow(),
  source: text('source'),
  isActive: boolean('is_active').default(true),
});

// Condition Factors Table
export const conditionFactors = pgTable('condition_factors', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  multiplier: real('multiplier').notNull(),
  lastUpdated: timestamp('last_updated').defaultNow(),
  source: text('source'),
  isActive: boolean('is_active').default(true),
});

// Age Factors Table
export const ageFactors = pgTable('age_factors', {
  id: serial('id').primaryKey(),
  minAge: integer('min_age').notNull(),
  maxAge: integer('max_age').notNull(),
  multiplier: real('multiplier').notNull(),
  description: text('description'),
  buildingType: text('building_type').references(() => buildingTypes.code),
  lastUpdated: timestamp('last_updated').defaultNow(),
  source: text('source'),
  isActive: boolean('is_active').default(true),
});

/*********************
 * CALCULATIONS & HISTORY
 *********************/

// Calculation History Table
export const calculations = pgTable('calculation_history', {
  id: serial('id').primaryKey(),
  userId: integer('user_id'),
  squareFootage: integer('square_footage'),
  createdAt: timestamp('created_at').defaultNow(),
  buildingType: text('building_type'),
  assessedValue: text('assessed_value'),
  baseCost: text('base_cost'),
  costPerSqft: text('cost_per_sqft'),
  totalCost: text('total_cost'),
  quality: text('quality'),
  complexity: text('complexity'),
  condition: text('condition'),
  qualityFactor: text('quality_factor'),
  complexityFactor: text('complexity_factor'),
  conditionFactor: text('condition_factor'),
  regionFactor: text('region_factor'),
  name: text('name'),
  adjustedCost: text('adjusted_cost'),
  region: text('region'),
});

/*********************
 * PROJECTS & COLLABORATION
 *********************/

// Projects Table
export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  projectId: uuid('project_id').defaultRandom().notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  ownerId: uuid('owner_id').notNull().references(() => users.userId),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  status: text('status').default('active').notNull(),
  isPublic: boolean('is_public').default(false),
  metadata: json('metadata').$type<Record<string, any>>(),
});

// Project Members Table
export const projectMembers = pgTable('project_members', {
  id: serial('id').primaryKey(),
  projectId: uuid('project_id').notNull().references(() => projects.projectId, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.userId, { onDelete: 'cascade' }),
  role: text('role').default('member').notNull(),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
  invitedBy: uuid('invited_by').references(() => users.userId),
  lastActivity: timestamp('last_activity'),
});

// Project Properties Table
export const projectProperties = pgTable('project_properties', {
  id: serial('id').primaryKey(),
  projectId: uuid('project_id').notNull().references(() => projects.projectId, { onDelete: 'cascade' }),
  propertyId: uuid('property_id').notNull().references(() => properties.propertyId, { onDelete: 'cascade' }),
  addedAt: timestamp('added_at').defaultNow().notNull(),
  addedBy: uuid('added_by').references(() => users.userId),
  notes: text('notes'),
});

/*********************
 * SYSTEM SETTINGS
 *********************/

// System Settings Table
export const settings = pgTable('settings', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  type: text('type').default('string'),
});

// Cost Matrix Import History
export const matrixImports = pgTable('matrix_imports', {
  id: serial('id').primaryKey(),
  importId: uuid('import_id').defaultRandom().notNull().unique(),
  fileName: text('file_name').notNull(),
  fileSize: integer('file_size'),
  importDate: timestamp('import_date').defaultNow().notNull(),
  importedBy: uuid('imported_by').references(() => users.userId),
  status: text('status').notNull(),
  recordsProcessed: integer('records_processed'),
  recordsImported: integer('records_imported'),
  recordsFailed: integer('records_failed'),
  errors: json('errors').$type<string[]>(),
  source: text('source'),
  year: integer('year'),
});

// Data Import History
export const dataImports = pgTable('data_imports', {
  id: serial('id').primaryKey(),
  importId: uuid('import_id').defaultRandom().notNull().unique(),
  importType: text('import_type').notNull(),
  fileName: text('file_name'),
  importDate: timestamp('import_date').defaultNow().notNull(),
  importedBy: uuid('imported_by').references(() => users.userId),
  status: text('status').notNull(),
  recordsProcessed: integer('records_processed'),
  recordsImported: integer('records_imported'),
  recordsFailed: integer('records_failed'),
  errors: json('errors').$type<string[]>(),
  source: text('source'),
  notes: text('notes'),
});

/*********************
 * RELATIONS
 *********************/

// User relations
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(userSessions),
  ownedProjects: many(projects, { relationName: 'projectOwner' }),
  projectMemberships: many(projectMembers),
  calculations: many(calculations),
}));

// Properties relations
export const propertiesRelations = relations(properties, ({ many }) => ({
  improvements: many(improvements),
  landDetails: many(landDetails),
  calculations: many(calculations),
  projectAssociations: many(projectProperties),
}));

// Improvements relations
export const improvementsRelations = relations(improvements, ({ one, many }) => ({
  property: one(properties, {
    fields: [improvements.propertyId],
    references: [properties.propertyId],
  }),
  details: many(improvementDetails),
  calculations: many(calculations),
}));

// Building Types relations
export const buildingTypesRelations = relations(buildingTypes, ({ many }) => ({
  costMatrices: many(costMatrix),
  qualityFactors: many(qualityFactors),
  ageFactors: many(ageFactors),
}));

// Regions relations
export const regionsRelations = relations(regions, ({ many }) => ({
  costMatrices: many(costMatrix),
}));

// Cost Matrix relations
export const costMatrixRelations = relations(costMatrix, ({ one, many }) => ({
  buildingTypeData: one(buildingTypes, {
    fields: [costMatrix.buildingType],
    references: [buildingTypes.code],
  }),
  regionData: one(regions, {
    fields: [costMatrix.region],
    references: [regions.code],
  }),
  details: many(matrixDetail),
}));

// Projects relations
export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, {
    fields: [projects.ownerId],
    references: [users.userId],
    relationName: 'projectOwner',
  }),
  members: many(projectMembers),
  properties: many(projectProperties),
}));

/*********************
 * INSERT SCHEMAS
 *********************/

// User Insert Schema
export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, createdAt: true, updatedAt: true, lastLogin: true });

// Property Insert Schema
export const insertPropertySchema = createInsertSchema(properties)
  .omit({ id: true, createdAt: true, updatedAt: true, lastAssessment: true });

// Improvement Insert Schema
export const insertImprovementSchema = createInsertSchema(improvements)
  .omit({ id: true, lastUpdated: true });

// Cost Matrix Insert Schema
export const insertCostMatrixSchema = createInsertSchema(costMatrix)
  .omit({ id: true, createdAt: true, updatedAt: true });

// Calculation Insert Schema
export const insertCalculationSchema = createInsertSchema(calculations)
  .omit({ id: true, calculationDate: true });

// Project Insert Schema
export const insertProjectSchema = createInsertSchema(projects)
  .omit({ id: true, createdAt: true, updatedAt: true });

// Settings Insert Schema
export const insertSettingSchema = createInsertSchema(settings)
  .omit({ id: true });

/*********************
 * TYPES
 *********************/

// Type definitions from schema
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;

export type Improvement = typeof improvements.$inferSelect;
export type InsertImprovement = z.infer<typeof insertImprovementSchema>;

export type CostMatrix = typeof costMatrix.$inferSelect;
export type InsertCostMatrix = z.infer<typeof insertCostMatrixSchema>;

export type Calculation = typeof calculations.$inferSelect;
export type InsertCalculation = z.infer<typeof insertCalculationSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type BuildingType = typeof buildingTypes.$inferSelect;
export type Region = typeof regions.$inferSelect;
export type QualityFactor = typeof qualityFactors.$inferSelect;
export type ConditionFactor = typeof conditionFactors.$inferSelect;
export type AgeFactor = typeof ageFactors.$inferSelect;
export type MatrixDetail = typeof matrixDetail.$inferSelect;
export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;
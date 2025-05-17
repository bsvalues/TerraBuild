/**
 * Shared Schema for BCBS Application
 * 
 * This file defines the database schema and types used throughout the application.
 */

import { 
  pgTable,
  text,
  serial,
  integer,
  boolean,
  date,
  timestamp,
  varchar,
  primaryKey,
  doublePrecision
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/**
 * Users Table
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  name: varchar("name", { length: 100 }),
  role: varchar("role", { length: 50 }).default("user"),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, created_at: true, updated_at: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

/**
 * Sessions Table
 */
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  sid: varchar("sid", { length: 255 }).notNull().unique(),
  sess: text("sess").notNull(),
  expire: timestamp("expire").notNull(),
  created_at: timestamp("created_at").defaultNow()
});

export const insertSessionSchema = createInsertSchema(sessions)
  .omit({ id: true, created_at: true });

export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;

/**
 * Properties Table
 */
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  geo_id: varchar("geo_id", { length: 100 }).unique(),
  parcel_id: varchar("parcel_id", { length: 100 }),
  address: varchar("address", { length: 255 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  zip: varchar("zip", { length: 20 }),
  county: varchar("county", { length: 100 }),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  property_type: varchar("property_type", { length: 50 }),
  land_area: doublePrecision("land_area"),
  land_value: integer("land_value"),
  total_value: integer("total_value"),
  year_built: integer("year_built"),
  bedrooms: integer("bedrooms"),
  bathrooms: doublePrecision("bathrooms"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

export const insertPropertySchema = createInsertSchema(properties)
  .omit({ id: true, created_at: true, updated_at: true });

export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Property = typeof properties.$inferSelect;

/**
 * Improvements Table
 */
export const improvements = pgTable("improvements", {
  id: serial("id").primaryKey(),
  property_id: integer("property_id").references(() => properties.id),
  improvement_type: varchar("improvement_type", { length: 100 }),
  building_type: varchar("building_type", { length: 100 }),
  quality: varchar("quality", { length: 50 }),
  condition: varchar("condition", { length: 50 }),
  year_built: integer("year_built"),
  square_feet: integer("square_feet"),
  stories: integer("stories"),
  value: integer("value"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

export const insertImprovementSchema = createInsertSchema(improvements)
  .omit({ id: true, created_at: true, updated_at: true });

export type InsertImprovement = z.infer<typeof insertImprovementSchema>;
export type Improvement = typeof improvements.$inferSelect;

/**
 * Cost Matrix Table
 */
export const costMatrices = pgTable("cost_matrices", {
  id: serial("id").primaryKey(),
  building_type: varchar("building_type", { length: 50 }).notNull(),
  building_type_description: varchar("building_type_description", { length: 255 }),
  region: varchar("region", { length: 50 }).notNull(),
  matrix_year: integer("matrix_year").notNull(),
  base_cost: doublePrecision("base_cost").notNull(),
  county: varchar("county", { length: 100 }),
  state: varchar("state", { length: 50 }),
  matrix_description: text("matrix_description"),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

export const insertCostMatrixSchema = createInsertSchema(costMatrices)
  .omit({ id: true, created_at: true, updated_at: true });

export type InsertCostMatrix = z.infer<typeof insertCostMatrixSchema>;
export type CostMatrix = typeof costMatrices.$inferSelect;

/**
 * Calculation Table
 */
export const calculations = pgTable("calculations", {
  id: serial("id").primaryKey(),
  property_id: integer("property_id").references(() => properties.id),
  improvement_id: integer("improvement_id").references(() => improvements.id),
  matrix_id: integer("matrix_id").references(() => costMatrices.id),
  base_cost: doublePrecision("base_cost"),
  quality_factor: doublePrecision("quality_factor"),
  condition_factor: doublePrecision("condition_factor"),
  age_factor: doublePrecision("age_factor"),
  region_factor: doublePrecision("region_factor"),
  calculated_value: doublePrecision("calculated_value"),
  calculation_date: timestamp("calculation_date").defaultNow(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

export const insertCalculationSchema = createInsertSchema(calculations)
  .omit({ id: true, calculation_date: true, created_at: true, updated_at: true });

export type InsertCalculation = z.infer<typeof insertCalculationSchema>;
export type Calculation = typeof calculations.$inferSelect;

/**
 * Projects Table
 */
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  user_id: integer("user_id").references(() => users.id),
  status: varchar("status", { length: 50 }).default("draft"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

export const insertProjectSchema = createInsertSchema(projects)
  .omit({ id: true, created_at: true, updated_at: true });

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

/**
 * Project Properties Junction Table
 */
export const projectProperties = pgTable("project_properties", {
  id: serial("id").primaryKey(),
  project_id: integer("project_id").references(() => projects.id).notNull(),
  property_id: integer("property_id").references(() => properties.id).notNull(),
});

/**
 * Building Types Table
 */
export const buildingTypes = pgTable("building_types", {
  code: varchar("code", { length: 50 }).primaryKey(),
  description: varchar("description", { length: 255 }),
  category: varchar("category", { length: 100 }),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

export type BuildingType = typeof buildingTypes.$inferSelect;

/**
 * Regions Table
 */
export const regions = pgTable("regions", {
  code: varchar("code", { length: 50 }).primaryKey(),
  name: varchar("name", { length: 255 }),
  state: varchar("state", { length: 50 }),
  county: varchar("county", { length: 100 }),
  type: varchar("type", { length: 50 }),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

export type Region = typeof regions.$inferSelect;

/**
 * Settings Table
 */
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 255 }).notNull().unique(),
  key_prefix: varchar("key_prefix", { length: 100 }),
  value: text("value"),
  is_public: boolean("is_public").default(false),
  user_id: integer("user_id").references(() => users.id),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

export const insertSettingSchema = createInsertSchema(settings)
  .omit({ id: true, created_at: true, updated_at: true });

export type InsertSetting = z.infer<typeof insertSettingSchema>;
export type Setting = typeof settings.$inferSelect;

/**
 * Validation Reports Table
 */
export const validationReports = pgTable("validation_reports", {
  id: serial("id").primaryKey(),
  batch_id: varchar("batch_id", { length: 255 }).notNull().unique(),
  entity_type: varchar("entity_type", { length: 50 }).notNull(),
  report_data: text("report_data").notNull(), // JSON stringified report
  user_id: integer("user_id").references(() => users.id),
  pass_rate: doublePrecision("pass_rate"),
  total_records: integer("total_records"),
  passed_records: integer("passed_records"),
  failed_records: integer("failed_records"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

export const insertValidationReportSchema = createInsertSchema(validationReports)
  .omit({ id: true, created_at: true, updated_at: true });

export type InsertValidationReport = z.infer<typeof insertValidationReportSchema>;
export type ValidationReport = typeof validationReports.$inferSelect;

/**
 * Import Jobs Table
 */
export const importJobs = pgTable("import_jobs", {
  id: varchar("id", { length: 255 }).primaryKey(), // UUID
  user_id: integer("user_id").references(() => users.id),
  file_name: varchar("file_name", { length: 255 }),
  status: varchar("status", { length: 50 }).notNull(), // pending, processing, completed, error
  total_count: integer("total_count").default(0),
  pass_count: integer("pass_count").default(0),
  fail_count: integer("fail_count").default(0),
  started_at: timestamp("started_at").defaultNow(),
  completed_at: timestamp("completed_at"),
  metadata: text("metadata"), // JSON stringified metadata
  error_message: text("error_message"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

export const insertImportJobSchema = createInsertSchema(importJobs)
  .omit({ created_at: true, updated_at: true });

export type InsertImportJob = z.infer<typeof insertImportJobSchema>;
export type ImportJob = typeof importJobs.$inferSelect;

/**
 * Import Batches Table (for storing raw import data)
 */
export const importBatches = pgTable("import_batches", {
  id: serial("id").primaryKey(),
  batch_id: varchar("batch_id", { length: 255 }).notNull(),
  records_data: text("records_data").notNull(), // JSON stringified records
  start_index: integer("start_index").default(0),
  created_at: timestamp("created_at").defaultNow()
});

export const insertImportBatchSchema = createInsertSchema(importBatches)
  .omit({ id: true, created_at: true });

export type InsertImportBatch = z.infer<typeof insertImportBatchSchema>;
export type ImportBatch = typeof importBatches.$inferSelect;

/**
 * Activities Table (for tracking user activities)
 */
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  entity_type: varchar("entity_type", { length: 50 }),
  entity_id: varchar("entity_id", { length: 255 }),
  details: text("details"), // JSON stringified details
  created_at: timestamp("created_at").defaultNow()
});

export const insertActivitySchema = createInsertSchema(activities)
  .omit({ id: true, created_at: true });

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;
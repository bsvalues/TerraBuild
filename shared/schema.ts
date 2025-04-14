import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { 
  pgTable, text, serial, timestamp, varchar, uuid, boolean, json, integer, date, decimal, 
  jsonb, primaryKey, foreignKey
} from "drizzle-orm/pg-core";

// Define the users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  uuid: uuid("uuid").defaultRandom().notNull().unique(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  name: varchar("name", { length: 100 }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  role: varchar("role", { length: 20 }).default("user").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Create a Zod schema for inserting into the users table
export const insertUserSchema = createInsertSchema(users).omit({ id: true, uuid: true, created_at: true, updated_at: true });

// Create Zod schema for user login
export const loginUserSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6).max(100),
});

// Define types for TypeScript
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;

// Other database tables required by the server
// Activities for tracking user actions
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  action: text("action").notNull(),
  icon: varchar("icon", { length: 50 }),
  iconColor: varchar("icon_color", { length: 50 }),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  details: json("details"),
});

export const insertActivitySchema = createInsertSchema(activities).omit({ id: true, timestamp: true });

// Environment settings
export const environments = pgTable("environments", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// API endpoints
export const apiEndpoints = pgTable("api_endpoints", {
  id: serial("id").primaryKey(),
  path: varchar("path", { length: 255 }).notNull().unique(),
  method: varchar("method", { length: 10 }).notNull(),
  description: text("description"),
  active: boolean("active").default(true).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Application settings
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value"),
  description: text("description"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSettingSchema = createInsertSchema(settings).omit({ id: true, created_at: true, updated_at: true });

// Repository status for version control
export const repositoryStatus = pgTable("repository_status", {
  id: serial("id").primaryKey(),
  last_commit: varchar("last_commit", { length: 100 }),
  branch: varchar("branch", { length: 100 }),
  status: varchar("status", { length: 20 }),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

// Define types for all tables
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = typeof activities.$inferInsert;

export type Environment = typeof environments.$inferSelect;
export type InsertEnvironment = typeof environments.$inferInsert;

export type ApiEndpoint = typeof apiEndpoints.$inferSelect;
export type InsertApiEndpoint = typeof apiEndpoints.$inferInsert;

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = typeof settings.$inferInsert;
export type InsertSettingType = z.infer<typeof insertSettingSchema>;

export type RepositoryStatus = typeof repositoryStatus.$inferSelect;
export type InsertRepositoryStatus = typeof repositoryStatus.$inferInsert;

// Synchronization tables
export const syncHistory = pgTable("sync_history", {
  id: serial("id").primaryKey(),
  connectionId: integer("connection_id").notNull(),
  scheduleId: integer("schedule_id"),
  scheduleName: varchar("schedule_name", { length: 100 }),
  status: varchar("status", { length: 50 }).notNull(),
  startTime: timestamp("start_time").defaultNow().notNull(),
  endTime: timestamp("end_time"),
  filesTransferred: integer("files_transferred").default(0),
  totalBytes: integer("total_bytes").default(0),
  details: json("details"),
  errors: json("errors").default([]),
});

export const syncSchedules = pgTable("sync_schedules", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  connectionId: integer("connection_id").notNull(),
  source: json("source").notNull(),
  destination: json("destination").notNull(),
  frequency: varchar("frequency", { length: 50 }).notNull(),
  time: varchar("time", { length: 10 }),
  dayOfWeek: integer("day_of_week"),
  dayOfMonth: integer("day_of_month"),
  options: json("options").default({}),
  enabled: boolean("enabled").default(true),
  status: varchar("status", { length: 50 }).default("pending"),
  lastRun: timestamp("last_run"),
  nextRun: timestamp("next_run"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const ftpConnections = pgTable("ftp_connections", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  host: varchar("host", { length: 255 }).notNull(),
  port: integer("port").default(21),
  username: varchar("username", { length: 100 }).notNull(),
  password: varchar("password", { length: 255 }),
  secure: boolean("secure").default(false),
  passive: boolean("passive").default(true),
  status: varchar("status", { length: 50 }).default("disconnected"),
  lastConnected: timestamp("last_connected"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const connectionHistory = pgTable("connection_history", {
  id: serial("id").primaryKey(),
  connectionId: integer("connection_id").notNull(),
  status: varchar("status", { length: 50 }).notNull(),
  details: json("details"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type SyncHistory = typeof syncHistory.$inferSelect;
export type InsertSyncHistory = typeof syncHistory.$inferInsert;

export type SyncSchedule = typeof syncSchedules.$inferSelect;
export type InsertSyncSchedule = typeof syncSchedules.$inferInsert;

export const insertFTPConnectionSchema = createInsertSchema(ftpConnections).omit({ id: true, createdAt: true, updatedAt: true, lastConnected: true });
export const insertConnectionHistorySchema = createInsertSchema(connectionHistory).omit({ id: true, timestamp: true });

export type FTPConnection = typeof ftpConnections.$inferSelect;
export type InsertFTPConnection = z.infer<typeof insertFTPConnectionSchema>;

export type ConnectionHistory = typeof connectionHistory.$inferSelect;
export type InsertConnectionHistory = z.infer<typeof insertConnectionHistorySchema>;

// Import records
export const importRecords = pgTable("import_records", {
  id: serial("id").primaryKey(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileType: varchar("file_type", { length: 50 }).notNull(),
  importType: varchar("import_type", { length: 50 }).notNull(),
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  details: json("details").default({}),
  recordCount: integer("record_count").default(0),
  errorCount: integer("error_count").default(0),
  startTime: timestamp("start_time").defaultNow().notNull(),
  endTime: timestamp("end_time"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type ImportRecord = typeof importRecords.$inferSelect;
export type InsertImportRecord = typeof importRecords.$inferInsert;

// Define the cost matrix tables
export const costMatrix = pgTable("cost_matrix", {
  id: serial("id").primaryKey(),
  matrix_id: varchar("matrix_id", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  year: varchar("year", { length: 4 }).notNull(),
  description: text("description"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const costMatrixEntry = pgTable("cost_matrix_entry", {
  id: serial("id").primaryKey(),
  matrix_id: varchar("matrix_id", { length: 50 }).notNull(),
  building_type: varchar("building_type", { length: 50 }).notNull(),
  region: varchar("region", { length: 50 }).notNull(),
  base_cost: varchar("base_cost", { length: 20 }).notNull(),
  county: varchar("county", { length: 50 }),
  state: varchar("state", { length: 50 }),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Property schema
export const property = pgTable("property", {
  id: serial("id").primaryKey(),
  propId: varchar("prop_id", { length: 50 }).notNull().unique(),
  block: varchar("block", { length: 50 }),
  tractOr: varchar("tract_or", { length: 50 }),
  lot: varchar("lot", { length: 50 }),
  address: varchar("address", { length: 255 }),
  citystate: varchar("citystate", { length: 100 }),
  zip: varchar("zip", { length: 20 }),
  owner: varchar("owner", { length: 100 }),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const improvement = pgTable("improvement", {
  id: serial("id").primaryKey(),
  propId: varchar("prop_id", { length: 50 }).notNull(),
  apprId: varchar("appr_id", { length: 50 }).notNull().unique(),
  improvementType: varchar("improvement_type", { length: 50 }),
  yearBuilt: varchar("year_built", { length: 4 }),
  squareFeet: varchar("square_feet", { length: 20 }),
  grade: varchar("grade", { length: 20 }),
  condition: varchar("condition", { length: 20 }),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Create insert schemas
export const insertCostMatrixSchema = createInsertSchema(costMatrix).omit({ id: true, created_at: true, updated_at: true });
export const insertCostMatrixEntrySchema = createInsertSchema(costMatrixEntry).omit({ id: true, created_at: true });
export const insertPropertySchema = createInsertSchema(property).omit({ id: true, created_at: true, updated_at: true });
export const insertImprovementSchema = createInsertSchema(improvement).omit({ id: true, created_at: true });

// Define types for TypeScript
export type CostMatrix = typeof costMatrix.$inferSelect;
export type InsertCostMatrix = z.infer<typeof insertCostMatrixSchema>;
export type CostMatrixEntry = typeof costMatrixEntry.$inferSelect;
export type InsertCostMatrixEntry = z.infer<typeof insertCostMatrixEntrySchema>;
export type Property = typeof property.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Improvement = typeof improvement.$inferSelect;
export type InsertImprovement = z.infer<typeof insertImprovementSchema>;

// Building Cost related tables
export const buildingCosts = pgTable("building_costs", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  baseRate: decimal("base_rate").notNull(),
  regionMultiplier: decimal("region_multiplier").default("1.0"),
  qualityGrade: varchar("quality_grade", { length: 10 }),
  yearBuilt: integer("year_built"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const costFactors = pgTable("cost_factors", {
  id: serial("id").primaryKey(),
  buildingType: varchar("building_type", { length: 50 }).notNull(),
  region: varchar("region", { length: 50 }).notNull(),
  factorType: varchar("factor_type", { length: 50 }).notNull(),
  value: decimal("value").notNull(),
  notes: text("notes"),
  active: boolean("active").default(true),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const materialTypes = pgTable("material_types", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  category: varchar("category", { length: 50 }),
  description: text("description"),
  unit: varchar("unit", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const materialCosts = pgTable("material_costs", {
  id: serial("id").primaryKey(),
  materialTypeId: integer("material_type_id").references(() => materialTypes.id),
  cost: decimal("cost").notNull(),
  region: varchar("region", { length: 50 }).notNull(),
  effectiveDate: date("effective_date").notNull(),
  expirationDate: date("expiration_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const buildingCostMaterials = pgTable("building_cost_materials", {
  id: serial("id").primaryKey(),
  buildingCostId: integer("building_cost_id").references(() => buildingCosts.id),
  materialTypeId: integer("material_type_id").references(() => materialTypes.id),
  quantity: decimal("quantity").notNull(),
  unitCost: decimal("unit_cost").notNull(),
  totalCost: decimal("total_cost").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const calculationHistory = pgTable("calculation_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  buildingType: varchar("building_type", { length: 50 }).notNull(),
  sqFeet: integer("sq_feet"),
  region: varchar("region", { length: 50 }),
  quality: varchar("quality", { length: 20 }),
  yearBuilt: integer("year_built"),
  inputParams: json("input_params"),
  resultValue: decimal("result_value"),
  calculationDate: timestamp("calculation_date").defaultNow().notNull(),
  confidenceLevel: varchar("confidence_level", { length: 20 }),
  notes: text("notes"),
});

export const costFactorPresets = pgTable("cost_factor_presets", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  factorValues: json("factor_values").notNull(),
  isDefault: boolean("is_default").default(false),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const fileUploads = pgTable("file_uploads", {
  id: serial("id").primaryKey(),
  filename: varchar("filename", { length: 255 }).notNull(),
  originalFilename: varchar("original_filename", { length: 255 }).notNull(),
  path: varchar("path", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }),
  size: integer("size").notNull(),
  purpose: varchar("purpose", { length: 50 }),
  uploadedBy: integer("uploaded_by").references(() => users.id),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const whatIfScenarios = pgTable("what_if_scenarios", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  baseParams: json("base_params").notNull(),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const scenarioVariations = pgTable("scenario_variations", {
  id: serial("id").primaryKey(),
  scenarioId: integer("scenario_id").references(() => whatIfScenarios.id).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  changedParams: json("changed_params").notNull(),
  resultValue: decimal("result_value"),
  comparisonValue: decimal("comparison_value"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sharedProjects = pgTable("shared_projects", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  isPublic: boolean("is_public").default(false),
  createdById: integer("created_by_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  status: varchar("status", { length: 50 }).default("active"),
});

export const projectMembers = pgTable("project_members", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => sharedProjects.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  role: varchar("role", { length: 50 }).default("viewer").notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  invitedBy: integer("invited_by").references(() => users.id),
});

export const projectItems = pgTable("project_items", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => sharedProjects.id).notNull(),
  itemType: varchar("item_type", { length: 50 }).notNull(),
  itemId: integer("item_id").notNull(),
  addedBy: integer("added_by").references(() => users.id).notNull(),
  addedAt: timestamp("added_at").defaultNow().notNull(),
});

export const projectInvitations = pgTable("project_invitations", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => sharedProjects.id).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).default("viewer").notNull(),
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  invitedBy: integer("invited_by").references(() => users.id).notNull(),
  invitedAt: timestamp("invited_at").defaultNow().notNull(),
  respondedAt: timestamp("responded_at"),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  targetType: varchar("target_type", { length: 50 }).notNull(),
  targetId: integer("target_id").notNull(),
  parentCommentId: integer("parent_comment_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isResolved: boolean("is_resolved").default(false),
  isEdited: boolean("is_edited").default(false),
});

export const sharedLinks = pgTable("shared_links", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => sharedProjects.id).notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  accessLevel: varchar("access_level", { length: 50 }).default("viewer").notNull(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  description: text("description"),
});

// Define types for the additional tables
// Insert schemas for building costs
export const insertBuildingCostSchema = createInsertSchema(buildingCosts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCostFactorSchema = createInsertSchema(costFactors).omit({ id: true, createdAt: true });
export const insertMaterialTypeSchema = createInsertSchema(materialTypes).omit({ id: true, createdAt: true });
export const insertMaterialCostSchema = createInsertSchema(materialCosts).omit({ id: true, createdAt: true });
export const insertBuildingCostMaterialSchema = createInsertSchema(buildingCostMaterials).omit({ id: true, createdAt: true });
export const insertCalculationHistorySchema = createInsertSchema(calculationHistory).omit({ id: true, calculationDate: true });
export const insertCostFactorPresetSchema = createInsertSchema(costFactorPresets).omit({ id: true, createdAt: true, updatedAt: true });
export const insertFileUploadSchema = createInsertSchema(fileUploads).omit({ id: true, uploadedAt: true });
export const insertWhatIfScenarioSchema = createInsertSchema(whatIfScenarios).omit({ id: true, createdAt: true, updatedAt: true });
export const insertScenarioVariationSchema = createInsertSchema(scenarioVariations).omit({ id: true, createdAt: true, updatedAt: true });

// Define types
export type BuildingCost = typeof buildingCosts.$inferSelect;
export type InsertBuildingCost = z.infer<typeof insertBuildingCostSchema>;

export type CostFactor = typeof costFactors.$inferSelect;
export type InsertCostFactor = z.infer<typeof insertCostFactorSchema>;

export type MaterialType = typeof materialTypes.$inferSelect;
export type InsertMaterialType = z.infer<typeof insertMaterialTypeSchema>;

export type MaterialCost = typeof materialCosts.$inferSelect;
export type InsertMaterialCost = z.infer<typeof insertMaterialCostSchema>;

export type BuildingCostMaterial = typeof buildingCostMaterials.$inferSelect;
export type InsertBuildingCostMaterial = z.infer<typeof insertBuildingCostMaterialSchema>;

export type CalculationHistory = typeof calculationHistory.$inferSelect;
export type InsertCalculationHistory = z.infer<typeof insertCalculationHistorySchema>;

export type CostFactorPreset = typeof costFactorPresets.$inferSelect;
export type InsertCostFactorPreset = z.infer<typeof insertCostFactorPresetSchema>;

export type FileUpload = typeof fileUploads.$inferSelect;
export type InsertFileUpload = z.infer<typeof insertFileUploadSchema>;

export type WhatIfScenario = typeof whatIfScenarios.$inferSelect;
export type InsertWhatIfScenario = z.infer<typeof insertWhatIfScenarioSchema>;

export type ScenarioVariation = typeof scenarioVariations.$inferSelect;
export type InsertScenarioVariation = z.infer<typeof insertScenarioVariationSchema>;

// Insert schemas for shared projects
export const insertSharedProjectSchema = createInsertSchema(sharedProjects).omit({ id: true, createdAt: true, updatedAt: true });
export const insertProjectMemberSchema = createInsertSchema(projectMembers).omit({ id: true, joinedAt: true });
export const insertProjectItemSchema = createInsertSchema(projectItems).omit({ id: true, addedAt: true });
export const insertProjectInvitationSchema = createInsertSchema(projectInvitations).omit({ id: true, invitedAt: true, respondedAt: true });
export const insertCommentSchema = createInsertSchema(comments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSharedLinkSchema = createInsertSchema(sharedLinks).omit({ id: true, createdAt: true });

// Define types
export type SharedProject = typeof sharedProjects.$inferSelect;
export type InsertSharedProject = z.infer<typeof insertSharedProjectSchema>;

export type ProjectMember = typeof projectMembers.$inferSelect;
export type InsertProjectMember = z.infer<typeof insertProjectMemberSchema>;

export type ProjectItem = typeof projectItems.$inferSelect;
export type InsertProjectItem = z.infer<typeof insertProjectItemSchema>;

export type ProjectInvitation = typeof projectInvitations.$inferSelect;
export type InsertProjectInvitation = z.infer<typeof insertProjectInvitationSchema>;

export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export type SharedLink = typeof sharedLinks.$inferSelect;
export type InsertSharedLink = z.infer<typeof insertSharedLinkSchema>;

// Project Activities
export const projectActivities = pgTable("project_activities", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => sharedProjects.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  activityType: varchar("activity_type", { length: 100 }).notNull(),
  activityData: json("activity_data").default({}),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertProjectActivitySchema = createInsertSchema(projectActivities).omit({ id: true, timestamp: true });

export type ProjectActivity = typeof projectActivities.$inferSelect;
export type InsertProjectActivity = z.infer<typeof insertProjectActivitySchema>;
import { relations } from "drizzle-orm";
import { pgTable, serial, text, timestamp, boolean, integer, jsonb, uuid, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name"),
  role: text("role").default("user"),
  county: text("county"),
  department: text("department"),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Building types table
export const buildingTypes = pgTable("building_types", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category"),
  defaultComplexity: real("default_complexity").default(1.0),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Regions table
export const regions = pgTable("regions", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  state: text("state").notNull(),
  costFactor: real("cost_factor").default(1.0),
  description: text("description"),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Geographic Regions table
export const geographicRegions = pgTable("geographic_regions", {
  id: serial("id").primaryKey(),
  regionCode: text("region_code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  state: text("state"),
  countyCode: text("county_code"),
  boundaryData: jsonb("boundary_data"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Geographic Municipalities table
export const geographicMunicipalities = pgTable("geographic_municipalities", {
  id: serial("id").primaryKey(),
  municipalityCode: text("municipality_code").notNull().unique(),
  name: text("name").notNull(),
  regionId: integer("region_id").references(() => geographicRegions.id),
  description: text("description"),
  boundaryData: jsonb("boundary_data"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Geographic Neighborhoods table
export const geographicNeighborhoods = pgTable("geographic_neighborhoods", {
  id: serial("id").primaryKey(),
  hoodCd: text("hood_cd").notNull().unique(),
  name: text("name").notNull(),
  municipalityId: integer("municipality_id").references(() => geographicMunicipalities.id),
  description: text("description"),
  boundaryData: jsonb("boundary_data"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Properties table - Updated to match actual database schema
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  prop_id: integer("prop_id"),
  geo_id: text("geo_id"),
  legal_desc: text("legal_desc"),
  legal_desc_2: text("legal_desc_2"),
  legal_acreage: real("legal_acreage"),
  property_use_cd: text("property_use_cd"),
  property_use_desc: text("property_use_desc"),
  hood_cd: text("hood_cd"),
  appraised_val: real("appraised_val"),
  assessed_val: real("assessed_val"),
  market: real("market"),
  land_hstd_val: real("land_hstd_val"),
  land_non_hstd_val: real("land_non_hstd_val"),
  imprv_hstd_val: real("imprv_hstd_val"),
  imprv_non_hstd_val: real("imprv_non_hstd_val"),
  township_section: text("township_section"),
  township_code: text("township_code"),
  range_code: text("range_code"),
  tract_or_lot: text("tract_or_lot"),
  block: text("block"),
  image_path: text("image_path"),
  is_active: boolean("is_active").default(true),
  imported_at: timestamp("imported_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Property value history table
export const propertyValueHistory = pgTable("property_value_history", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id),
  valuationDate: timestamp("valuation_date").notNull(),
  appraisedValue: real("appraised_value"),
  assessedValue: real("assessed_value"),
  landValue: real("land_value"),
  improvementValue: real("improvement_value"),
  valueSource: text("value_source"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Improvements table
export const improvements = pgTable("improvements", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id),
  buildingType: text("building_type").references(() => buildingTypes.code),
  description: text("description"),
  yearBuilt: integer("year_built"),
  sqFeet: real("sq_feet"),
  quality: text("quality"),
  condition: text("condition"),
  stories: real("stories"),
  details: jsonb("details"),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Improvement details table
export const improvementDetails = pgTable("improvement_details", {
  id: serial("id").primaryKey(),
  improvementId: integer("improvement_id").references(() => improvements.id),
  category: text("category").notNull(),
  subcategory: text("subcategory"),
  value: text("value"),
  description: text("description"),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Cost matrix tables (original tables needed by storytelling service)
export const costMatrix = pgTable("cost_matrix", {
  id: serial("id").primaryKey(),
  buildingType: text("building_type").references(() => buildingTypes.code),
  buildingTypeDescription: text("building_type_description"),
  region: text("region").references(() => regions.code),
  matrix_year: integer("matrix_year").notNull(),
  base_cost: real("base_cost").notNull(),
  matrix_description: text("matrix_description"),
  source_matrix_id: integer("source_matrix_id"),
  data_points: integer("data_points"),
  min_cost: real("min_cost"),
  max_cost: real("max_cost"),
  complexity_factor_base: real("complexity_factor_base"),
  quality_factor_base: real("quality_factor_base"),
  condition_factor_base: real("condition_factor_base"),
  is_active: boolean("is_active").default(true),
  county: text("county"),
  state: text("state"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Matrix detail table
export const matrixDetail = pgTable("matrix_detail", {
  id: serial("id").primaryKey(),
  matrixId: integer("matrix_id").references(() => costMatrix.id),
  qualityGrade: text("quality_grade").notNull(),
  sizeBracket: text("size_bracket"),
  adjustmentFactor: real("adjustment_factor").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Cost matrix table (our new design)
export const costMatrices = pgTable("cost_matrices", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  year: integer("year").notNull(),
  county: text("county").notNull(),
  region: text("region"),
  buildingTypeCode: text("building_type_code").notNull(),
  buildingTypeDescription: text("building_type_description"),
  qualityGrade: text("quality_grade"),
  baseRate: text("base_rate").notNull(),
  adjustmentFactors: jsonb("adjustment_factors").notNull(),
  source: text("source"),
  importedBy: integer("imported_by").references(() => users.id),
  importedAt: timestamp("imported_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  active: boolean("active").default(true),
});

// Sessions table
export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: integer("user_id").references(() => users.id),
  costMatrixId: integer("cost_matrix_id").references(() => costMatrices.id),
  propertyId: text("property_id"),
  propertyAddress: text("property_address"),
  propertyDetails: jsonb("property_details"),
  valuation: jsonb("valuation"),
  status: text("status").default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

// Audit logs for session history
export const sessionHistory = pgTable("session_history", {
  id: serial("id").primaryKey(),
  sessionId: uuid("session_id").references(() => sessions.id),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(),
  details: jsonb("details"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Agent insights table
export const insights = pgTable("insights", {
  id: serial("id").primaryKey(),
  sessionId: uuid("session_id").references(() => sessions.id),
  agentId: text("agent_id").notNull(),
  agentName: text("agent_name").notNull(),
  insightType: text("insight_type").notNull(),
  content: text("content").notNull(),
  data: jsonb("data"),
  confidence: text("confidence"),
  status: text("status").default("active"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Exports table
export const exports = pgTable("exports", {
  id: serial("id").primaryKey(),
  sessionId: uuid("session_id").references(() => sessions.id),
  userId: integer("user_id").references(() => users.id),
  exportType: text("export_type").notNull(), // pdf, json, etc.
  filename: text("filename").notNull(),
  data: jsonb("data"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Table relations
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  costMatrices: many(costMatrices),
  exports: many(exports),
  sessionHistory: many(sessionHistory),
}));

export const buildingTypesRelations = relations(buildingTypes, ({ many }) => ({
  improvements: many(improvements),
  costMatrices: many(costMatrix),
}));

export const regionsRelations = relations(regions, ({ many }) => ({
  costMatrices: many(costMatrix),
}));

export const propertiesRelations = relations(properties, ({ many }) => ({
  improvements: many(improvements),
  valueHistory: many(propertyValueHistory),
}));

export const propertyValueHistoryRelations = relations(propertyValueHistory, ({ one }) => ({
  property: one(properties, {
    fields: [propertyValueHistory.propertyId],
    references: [properties.id],
  }),
}));

export const improvementsRelations = relations(improvements, ({ one, many }) => ({
  property: one(properties, {
    fields: [improvements.propertyId],
    references: [properties.id],
  }),
  buildingType: one(buildingTypes, {
    fields: [improvements.buildingType],
    references: [buildingTypes.code],
  }),
  details: many(improvementDetails),
}));

export const improvementDetailsRelations = relations(improvementDetails, ({ one }) => ({
  improvement: one(improvements, {
    fields: [improvementDetails.improvementId],
    references: [improvements.id],
  }),
}));

export const costMatrixRelations = relations(costMatrix, ({ one, many }) => ({
  buildingType: one(buildingTypes, {
    fields: [costMatrix.buildingType],
    references: [buildingTypes.code],
  }),
  region: one(regions, {
    fields: [costMatrix.region],
    references: [regions.code],
  }),
  details: many(matrixDetail),
}));

export const matrixDetailRelations = relations(matrixDetail, ({ one }) => ({
  costMatrix: one(costMatrix, {
    fields: [matrixDetail.matrixId],
    references: [costMatrix.id],
  }),
}));

export const costMatricesRelations = relations(costMatrices, ({ one, many }) => ({
  importedByUser: one(users, {
    fields: [costMatrices.importedBy],
    references: [users.id],
  }),
  sessions: many(sessions),
}));

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
  costMatrix: one(costMatrices, {
    fields: [sessions.costMatrixId],
    references: [costMatrices.id],
  }),
  history: many(sessionHistory),
  insights: many(insights),
  exports: many(exports),
}));

export const sessionHistoryRelations = relations(sessionHistory, ({ one }) => ({
  session: one(sessions, {
    fields: [sessionHistory.sessionId],
    references: [sessions.id],
  }),
  user: one(users, {
    fields: [sessionHistory.userId],
    references: [users.id],
  }),
}));

export const insightsRelations = relations(insights, ({ one }) => ({
  session: one(sessions, {
    fields: [insights.sessionId],
    references: [sessions.id],
  }),
}));

export const exportsRelations = relations(exports, ({ one }) => ({
  session: one(sessions, {
    fields: [exports.sessionId],
    references: [sessions.id],
  }),
  user: one(users, {
    fields: [exports.userId],
    references: [users.id],
  }),
}));

// Types
export type User = typeof users.$inferSelect;
export type BuildingType = typeof buildingTypes.$inferSelect;
export type Region = typeof regions.$inferSelect;
export type Property = typeof properties.$inferSelect;
export type PropertyValueHistory = typeof propertyValueHistory.$inferSelect;
export type Improvement = typeof improvements.$inferSelect;
export type ImprovementDetail = typeof improvementDetails.$inferSelect;
export type CostMatrix = typeof costMatrices.$inferSelect;
export type CostMatrixOriginal = typeof costMatrix.$inferSelect;
export type MatrixDetail = typeof matrixDetail.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type SessionHistory = typeof sessionHistory.$inferSelect;
export type Insight = typeof insights.$inferSelect;
export type Export = typeof exports.$inferSelect;
export type Calculation = typeof calculations.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type ProjectMember = typeof projectMembers.$inferSelect;
export type ProjectProperty = typeof projectProperties.$inferSelect;
export type FileUpload = typeof fileUploads.$inferSelect;

// Calculation table
export const calculations = pgTable("calculations", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").references(() => properties.id),
  improvementId: integer("improvement_id").references(() => improvements.id),
  userId: integer("user_id").references(() => users.id),
  buildingType: text("building_type").references(() => buildingTypes.code),
  year: integer("year").notNull(),
  quality: text("quality"),
  condition: text("condition"),
  baseRate: real("base_rate").notNull(),
  totalArea: real("total_area").notNull(),
  adjustmentFactors: jsonb("adjustment_factors"),
  resultValue: real("result_value").notNull(),
  confidence: real("confidence").default(1.0),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Projects table
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  ownerId: integer("owner_id").references(() => users.id),
  status: text("status").default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// File uploads table
export const fileUploads = pgTable("file_uploads", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  filename: text("filename").notNull(),
  originalFilename: text("original_filename"),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size"),
  status: text("status").default("pending"),
  processingDetails: jsonb("processing_details"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  processedAt: timestamp("processed_at"),
});

// Settings table for application and user settings
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(),
  key: text("key").notNull(),
  value: jsonb("value"),
  userId: integer("user_id").references(() => users.id),
  description: text("description"),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Project members table
export const projectMembers = pgTable("project_members", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  userId: integer("user_id").references(() => users.id),
  role: text("role").default("viewer"),
  addedAt: timestamp("added_at").defaultNow(),
});

// Project properties table
export const projectProperties = pgTable("project_properties", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  propertyId: integer("property_id").references(() => properties.id),
  addedAt: timestamp("added_at").defaultNow(),
});

// Relations
export const calculationsRelations = relations(calculations, ({ one }) => ({
  property: one(properties, {
    fields: [calculations.propertyId],
    references: [properties.id],
  }),
  improvement: one(improvements, {
    fields: [calculations.improvementId],
    references: [improvements.id],
  }),
  user: one(users, {
    fields: [calculations.userId],
    references: [users.id],
  }),
  buildingTypeRelation: one(buildingTypes, {
    fields: [calculations.buildingType],
    references: [buildingTypes.code],
  }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, {
    fields: [projects.ownerId],
    references: [users.id],
  }),
  members: many(projectMembers),
  properties: many(projectProperties),
}));

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
  project: one(projects, {
    fields: [projectMembers.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [projectMembers.userId],
    references: [users.id],
  }),
}));

export const projectPropertiesRelations = relations(projectProperties, ({ one }) => ({
  project: one(projects, {
    fields: [projectProperties.projectId],
    references: [projects.id],
  }),
  property: one(properties, {
    fields: [projectProperties.propertyId],
    references: [properties.id],
  }),
}));

export const fileUploadsRelations = relations(fileUploads, ({ one }) => ({
  user: one(users, {
    fields: [fileUploads.userId],
    references: [users.id],
  }),
}));

export const settingsRelations = relations(settings, ({ one }) => ({
  user: one(users, {
    fields: [settings.userId],
    references: [users.id],
  }),
}));

// Insert schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertBuildingTypeSchema = createInsertSchema(buildingTypes).omit({ id: true, lastUpdated: true });
export const insertRegionSchema = createInsertSchema(regions).omit({ id: true, lastUpdated: true });
export const insertPropertySchema = createInsertSchema(properties).omit({ id: true, imported_at: true, updated_at: true });
export const insertImprovementSchema = createInsertSchema(improvements).omit({ id: true, lastUpdated: true });
export const insertImprovementDetailSchema = createInsertSchema(improvementDetails).omit({ id: true, lastUpdated: true });
export const insertCostMatrixSchema = createInsertSchema(costMatrices).omit({ id: true, importedAt: true, updatedAt: true });
export const insertCostMatrixOriginalSchema = createInsertSchema(costMatrix).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMatrixDetailSchema = createInsertSchema(matrixDetail).omit({ id: true, createdAt: true });
export const insertSessionSchema = createInsertSchema(sessions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSessionHistorySchema = createInsertSchema(sessionHistory).omit({ id: true, createdAt: true });
export const insertInsightSchema = createInsertSchema(insights).omit({ id: true, createdAt: true });
export const insertExportSchema = createInsertSchema(exports).omit({ id: true, createdAt: true });
export const insertCalculationSchema = createInsertSchema(calculations).omit({ id: true, createdAt: true });
export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, createdAt: true, updatedAt: true, completedAt: true });
export const insertProjectMemberSchema = createInsertSchema(projectMembers).omit({ id: true, addedAt: true });
export const insertProjectPropertySchema = createInsertSchema(projectProperties).omit({ id: true, addedAt: true });
export const insertFileUploadSchema = createInsertSchema(fileUploads).omit({ id: true, createdAt: true, processedAt: true });
export const insertSettingSchema = createInsertSchema(settings).omit({ id: true, createdAt: true, updatedAt: true });

// Insert types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertBuildingType = z.infer<typeof insertBuildingTypeSchema>;
export type InsertRegion = z.infer<typeof insertRegionSchema>;
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type InsertImprovement = z.infer<typeof insertImprovementSchema>;
export type InsertImprovementDetail = z.infer<typeof insertImprovementDetailSchema>;
export type InsertCostMatrix = z.infer<typeof insertCostMatrixSchema>;
export type InsertCostMatrixOriginal = z.infer<typeof insertCostMatrixOriginalSchema>;
export type InsertMatrixDetail = z.infer<typeof insertMatrixDetailSchema>;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type InsertSessionHistory = z.infer<typeof insertSessionHistorySchema>;
export type InsertInsight = z.infer<typeof insertInsightSchema>;
export type InsertExport = z.infer<typeof insertExportSchema>;
export type InsertCalculation = z.infer<typeof insertCalculationSchema>;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type InsertProjectMember = z.infer<typeof insertProjectMemberSchema>;
export type InsertProjectProperty = z.infer<typeof insertProjectPropertySchema>;
export type InsertFileUpload = z.infer<typeof insertFileUploadSchema>;
export type InsertSetting = z.infer<typeof insertSettingSchema>;
export type Setting = typeof settings.$inferSelect;
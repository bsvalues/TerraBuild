import { pgTable, text, serial, integer, boolean, timestamp, decimal, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Benton County Property Data Tables

// Properties
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  propId: integer("prop_id").notNull().unique(),
  block: text("block"),
  tractOrLot: text("tract_or_lot"),
  legalDesc: text("legal_desc"),
  legalDesc2: text("legal_desc_2"),
  townshipSection: text("township_section"),
  townshipCode: text("township_code"),
  rangeCode: text("range_code"),
  townshipQSection: text("township_q_section"),
  cycle: text("cycle"),
  propertyUseCd: text("property_use_cd"),
  propertyUseDesc: text("property_use_desc"),
  market: decimal("market", { precision: 14, scale: 2 }),
  landHstdVal: decimal("land_hstd_val", { precision: 14, scale: 2 }),
  landNonHstdVal: decimal("land_non_hstd_val", { precision: 14, scale: 2 }),
  imprvHstdVal: decimal("imprv_hstd_val", { precision: 14, scale: 2 }),
  imprvNonHstdVal: decimal("imprv_non_hstd_val", { precision: 14, scale: 2 }),
  hoodCd: text("hood_cd"),
  absSubdvCd: text("abs_subdv_cd"),
  appraisedVal: decimal("appraised_val", { precision: 14, scale: 2 }),
  assessedVal: decimal("assessed_val", { precision: 14, scale: 2 }),
  legalAcreage: decimal("legal_acreage", { precision: 10, scale: 4 }),
  propTypeCd: text("prop_type_cd"),
  imagePath: text("image_path"),
  geoId: text("geo_id"),
  isActive: boolean("is_active").default(true),
  tca: text("tca"),
  importedAt: timestamp("imported_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPropertySchema = createInsertSchema(properties).omit({ 
  id: true,
  importedAt: true,
  updatedAt: true
});

// Property Improvements
export const improvements = pgTable("improvements", {
  id: serial("id").primaryKey(),
  propId: integer("prop_id").notNull(),
  imprvId: integer("imprv_id").notNull(),
  imprvDesc: text("imprv_desc"),
  imprvVal: decimal("imprv_val", { precision: 14, scale: 2 }),
  livingArea: decimal("living_area", { precision: 10, scale: 1 }),
  primaryUseCd: text("primary_use_cd"),
  stories: decimal("stories", { precision: 3, scale: 1 }),
  actualYearBuilt: integer("actual_year_built"),
  totalArea: decimal("total_area", { precision: 10, scale: 1 }),
  importedAt: timestamp("imported_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => {
  return {
    propImprvIdx: uniqueIndex("prop_imprv_idx").on(table.propId, table.imprvId)
  };
});

export const insertImprovementSchema = createInsertSchema(improvements).omit({ 
  id: true,
  importedAt: true,
  updatedAt: true
});

// Improvement Details
export const improvementDetails = pgTable("improvement_details", {
  id: serial("id").primaryKey(),
  propId: integer("prop_id").notNull(),
  imprvId: integer("imprv_id").notNull(),
  livingArea: decimal("living_area", { precision: 10, scale: 1 }),
  belowGradeLivingArea: decimal("below_grade_living_area", { precision: 10, scale: 1 }),
  conditionCd: text("condition_cd"),
  imprvDetSubClassCd: text("imprv_det_sub_class_cd"),
  yrBuilt: integer("yr_built"),
  actualAge: integer("actual_age"),
  numStories: decimal("num_stories", { precision: 3, scale: 1 }),
  imprvDetTypeCd: text("imprv_det_type_cd"),
  imprvDetDesc: text("imprv_det_desc"),
  imprvDetArea: decimal("imprv_det_area", { precision: 10, scale: 1 }),
  imprvDetClassCd: text("imprv_det_class_cd"),
  importedAt: timestamp("imported_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertImprovementDetailSchema = createInsertSchema(improvementDetails).omit({ 
  id: true,
  importedAt: true,
  updatedAt: true
});

// Improvement Items
export const improvementItems = pgTable("improvement_items", {
  id: serial("id").primaryKey(),
  imprvId: integer("imprv_id").notNull(),
  propId: integer("prop_id").notNull(),
  bedrooms: decimal("bedrooms", { precision: 4, scale: 2 }),
  baths: decimal("baths", { precision: 4, scale: 2 }),
  halfBath: decimal("halfbath", { precision: 4, scale: 2 }),
  foundation: text("foundation"),
  extwallDesc: text("extwall_desc"),
  roofcoverDesc: text("roofcover_desc"),
  hvacDesc: text("hvac_desc"),
  fireplaces: decimal("fireplaces", { precision: 4, scale: 2 }),
  sprinkler: boolean("sprinkler"),
  framingClass: text("framing_class"),
  comHvac: text("com_hvac"),
  importedAt: timestamp("imported_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => {
  return {
    imprvItemsIdx: uniqueIndex("imprv_items_idx").on(table.propId, table.imprvId)
  };
});

export const insertImprovementItemSchema = createInsertSchema(improvementItems).omit({ 
  id: true,
  importedAt: true,
  updatedAt: true
});

// Land Details
export const landDetails = pgTable("land_details", {
  id: serial("id").primaryKey(),
  propId: integer("prop_id").notNull(),
  sizeAcres: decimal("size_acres", { precision: 10, scale: 4 }),
  sizeSquareFeet: decimal("size_square_feet", { precision: 14, scale: 2 }),
  landTypeCd: text("land_type_cd"),
  landSoilCode: text("land_soil_code"),
  agUseCd: text("ag_use_cd"),
  primaryUseCd: text("primary_use_cd"),
  importedAt: timestamp("imported_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertLandDetailSchema = createInsertSchema(landDetails).omit({ 
  id: true,
  importedAt: true,
  updatedAt: true
});

// Export types
export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;

export type Improvement = typeof improvements.$inferSelect;
export type InsertImprovement = z.infer<typeof insertImprovementSchema>;

export type ImprovementDetail = typeof improvementDetails.$inferSelect;
export type InsertImprovementDetail = z.infer<typeof insertImprovementDetailSchema>;

export type ImprovementItem = typeof improvementItems.$inferSelect;
export type InsertImprovementItem = z.infer<typeof insertImprovementItemSchema>;

export type LandDetail = typeof landDetails.$inferSelect;
export type InsertLandDetail = z.infer<typeof insertLandDetailSchema>;
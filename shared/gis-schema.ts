import { 
  pgTable,
  text,
  serial,
  integer,
  boolean,
  date,
  timestamp,
  varchar,
  doublePrecision,
  jsonb,
  index,
  uniqueIndex
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const gisLayers = pgTable("gis_layers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  source: varchar("source", { length: 255 }),
  geometry_type: varchar("geometry_type", { length: 50 }),
  srid: integer("srid").default(4326),
  bounds: jsonb("bounds"),
  metadata: jsonb("metadata"),
  is_active: boolean("is_active").default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
}, (table) => ({
  nameIdx: index("gis_layers_name_idx").on(table.name),
  typeIdx: index("gis_layers_type_idx").on(table.type)
}));

export const gisFeatures = pgTable("gis_features", {
  id: serial("id").primaryKey(),
  layer_id: integer("layer_id").references(() => gisLayers.id).notNull(),
  feature_id: varchar("feature_id", { length: 100 }),
  geometry: jsonb("geometry").notNull(),
  properties: jsonb("properties"),
  centroid_lat: doublePrecision("centroid_lat"),
  centroid_lng: doublePrecision("centroid_lng"),
  area: doublePrecision("area"),
  perimeter: doublePrecision("perimeter"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
}, (table) => ({
  layerIdx: index("gis_features_layer_idx").on(table.layer_id),
  centroidIdx: index("gis_features_centroid_idx").on(table.centroid_lat, table.centroid_lng),
  featureIdIdx: index("gis_features_feature_id_idx").on(table.feature_id)
}));

export const spatialAnalysis = pgTable("spatial_analysis", {
  id: serial("id").primaryKey(),
  analysis_type: varchar("analysis_type", { length: 50 }).notNull(),
  input_layers: jsonb("input_layers").notNull(),
  parameters: jsonb("parameters"),
  results: jsonb("results"),
  status: varchar("status", { length: 20 }).default("pending"),
  started_at: timestamp("started_at"),
  completed_at: timestamp("completed_at"),
  created_by: integer("created_by"),
  created_at: timestamp("created_at").defaultNow()
}, (table) => ({
  typeIdx: index("spatial_analysis_type_idx").on(table.analysis_type),
  statusIdx: index("spatial_analysis_status_idx").on(table.status)
}));

export const propertyGeometry = pgTable("property_geometry", {
  id: serial("id").primaryKey(),
  property_id: integer("property_id").notNull(),
  parcel_geometry: jsonb("parcel_geometry"),
  building_footprints: jsonb("building_footprints"),
  boundary_points: jsonb("boundary_points"),
  elevation_data: jsonb("elevation_data"),
  slope_analysis: jsonb("slope_analysis"),
  flood_zone: varchar("flood_zone", { length: 50 }),
  soil_type: varchar("soil_type", { length: 100 }),
  vegetation_cover: doublePrecision("vegetation_cover"),
  impervious_surface: doublePrecision("impervious_surface"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
}, (table) => ({
  propertyIdx: uniqueIndex("property_geometry_property_idx").on(table.property_id),
  floodZoneIdx: index("property_geometry_flood_zone_idx").on(table.flood_zone)
}));

export const marketAreas = pgTable("market_areas", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  area_code: varchar("area_code", { length: 20 }).unique(),
  geometry: jsonb("geometry").notNull(),
  market_type: varchar("market_type", { length: 50 }),
  price_per_sqft_avg: doublePrecision("price_per_sqft_avg"),
  price_per_sqft_median: doublePrecision("price_per_sqft_median"),
  appreciation_rate: doublePrecision("appreciation_rate"),
  inventory_months: doublePrecision("inventory_months"),
  sales_volume: integer("sales_volume"),
  active_listings: integer("active_listings"),
  demographics: jsonb("demographics"),
  amenities: jsonb("amenities"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
}, (table) => ({
  areaCodeIdx: uniqueIndex("market_areas_area_code_idx").on(table.area_code),
  marketTypeIdx: index("market_areas_market_type_idx").on(table.market_type)
}));

export const valuationZones = pgTable("valuation_zones", {
  id: serial("id").primaryKey(),
  zone_code: varchar("zone_code", { length: 20 }).unique().notNull(),
  zone_name: varchar("zone_name", { length: 100 }),
  geometry: jsonb("geometry").notNull(),
  base_land_value: doublePrecision("base_land_value"),
  adjustment_factors: jsonb("adjustment_factors"),
  zoning_restrictions: jsonb("zoning_restrictions"),
  development_potential: varchar("development_potential", { length: 50 }),
  infrastructure_quality: integer("infrastructure_quality"),
  environmental_factors: jsonb("environmental_factors"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
}, (table) => ({
  zoneCodeIdx: uniqueIndex("valuation_zones_zone_code_idx").on(table.zone_code)
}));

export const gisAnalysisResults = pgTable("gis_analysis_results", {
  id: serial("id").primaryKey(),
  property_id: integer("property_id").notNull(),
  analysis_date: timestamp("analysis_date").defaultNow(),
  proximity_scores: jsonb("proximity_scores"),
  accessibility_metrics: jsonb("accessibility_metrics"),
  environmental_risk: jsonb("environmental_risk"),
  development_constraints: jsonb("development_constraints"),
  market_position: jsonb("market_position"),
  comparables_analysis: jsonb("comparables_analysis"),
  ai_insights: jsonb("ai_insights"),
  confidence_score: doublePrecision("confidence_score"),
  created_at: timestamp("created_at").defaultNow()
}, (table) => ({
  propertyIdx: index("gis_analysis_results_property_idx").on(table.property_id),
  analysisDateIdx: index("gis_analysis_results_date_idx").on(table.analysis_date),
  confidenceIdx: index("gis_analysis_results_confidence_idx").on(table.confidence_score)
}));

export const insertGisLayerSchema = createInsertSchema(gisLayers)
  .omit({ id: true, created_at: true, updated_at: true });

export const insertGisFeatureSchema = createInsertSchema(gisFeatures)
  .omit({ id: true, created_at: true, updated_at: true });

export const insertSpatialAnalysisSchema = createInsertSchema(spatialAnalysis)
  .omit({ id: true, created_at: true });

export const insertPropertyGeometrySchema = createInsertSchema(propertyGeometry)
  .omit({ id: true, created_at: true, updated_at: true });

export const insertMarketAreaSchema = createInsertSchema(marketAreas)
  .omit({ id: true, created_at: true, updated_at: true });

export const insertValuationZoneSchema = createInsertSchema(valuationZones)
  .omit({ id: true, created_at: true, updated_at: true });

export const insertGisAnalysisResultSchema = createInsertSchema(gisAnalysisResults)
  .omit({ id: true, created_at: true });

export type InsertGisLayer = z.infer<typeof insertGisLayerSchema>;
export type GisLayer = typeof gisLayers.$inferSelect;

export type InsertGisFeature = z.infer<typeof insertGisFeatureSchema>;
export type GisFeature = typeof gisFeatures.$inferSelect;

export type InsertSpatialAnalysis = z.infer<typeof insertSpatialAnalysisSchema>;
export type SpatialAnalysis = typeof spatialAnalysis.$inferSelect;

export type InsertPropertyGeometry = z.infer<typeof insertPropertyGeometrySchema>;
export type PropertyGeometry = typeof propertyGeometry.$inferSelect;

export type InsertMarketArea = z.infer<typeof insertMarketAreaSchema>;
export type MarketArea = typeof marketAreas.$inferSelect;

export type InsertValuationZone = z.infer<typeof insertValuationZoneSchema>;
export type ValuationZone = typeof valuationZones.$inferSelect;

export type InsertGisAnalysisResult = z.infer<typeof insertGisAnalysisResultSchema>;
export type GisAnalysisResult = typeof gisAnalysisResults.$inferSelect;
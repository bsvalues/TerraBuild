CREATE TABLE "activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"action" text NOT NULL,
	"icon" text NOT NULL,
	"icon_color" text DEFAULT 'primary' NOT NULL,
	"details" json,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_endpoints" (
	"id" serial PRIMARY KEY NOT NULL,
	"path" text NOT NULL,
	"method" text NOT NULL,
	"status" text DEFAULT 'online' NOT NULL,
	"requires_auth" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "benton_depreciation_matrix" (
	"id" serial PRIMARY KEY NOT NULL,
	"val_sub_element" text NOT NULL,
	"matrix_id" integer NOT NULL,
	"age" integer NOT NULL,
	"factor" integer NOT NULL,
	"condition_mapped" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "benton_imprv_sched_matrix_assoc" (
	"id" serial PRIMARY KEY NOT NULL,
	"imprv_det_meth_cd" text NOT NULL,
	"imprv_det_type_cd" text NOT NULL,
	"imprv_det_class_cd" text NOT NULL,
	"imprv_yr" integer NOT NULL,
	"matrix_id" integer NOT NULL,
	"matrix_order" integer NOT NULL,
	"adj_factor" integer NOT NULL,
	"imprv_det_sub_class_cd" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "benton_matrix" (
	"id" serial PRIMARY KEY NOT NULL,
	"matrix_id" integer NOT NULL,
	"matrix_year" integer NOT NULL,
	"label" text NOT NULL,
	"axis_1" text NOT NULL,
	"axis_2" text NOT NULL,
	"matrix_description" text NOT NULL,
	"operator" text NOT NULL,
	"default_cell_value" numeric(10, 2) NOT NULL,
	"b_interpolate" boolean DEFAULT false NOT NULL,
	"matrix_type" text NOT NULL,
	"matrix_sub_type_cd" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "benton_matrix_axis" (
	"id" serial PRIMARY KEY NOT NULL,
	"matrix_year" integer NOT NULL,
	"axis_cd" text NOT NULL,
	"data_type" text NOT NULL,
	"lookup_query" text,
	"matrix_type" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "benton_matrix_detail" (
	"id" serial PRIMARY KEY NOT NULL,
	"matrix_id" integer NOT NULL,
	"matrix_year" integer NOT NULL,
	"axis_1_value" text NOT NULL,
	"axis_2_value" text NOT NULL,
	"cell_value" numeric(14, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "building_cost_materials" (
	"id" serial PRIMARY KEY NOT NULL,
	"building_cost_id" integer NOT NULL,
	"material_type_id" integer NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"cost_per_unit" numeric(10, 2) NOT NULL,
	"percentage" numeric(5, 2) NOT NULL,
	"total_cost" numeric(14, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "building_costs" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"region" text NOT NULL,
	"building_type" text NOT NULL,
	"square_footage" integer NOT NULL,
	"cost_per_sqft" numeric(10, 2) NOT NULL,
	"total_cost" numeric(14, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calculation_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text,
	"region" text NOT NULL,
	"building_type" text NOT NULL,
	"square_footage" integer NOT NULL,
	"base_cost" text NOT NULL,
	"region_factor" text NOT NULL,
	"complexity" text NOT NULL,
	"complexity_factor" text NOT NULL,
	"quality" text,
	"quality_factor" text,
	"condition" text,
	"condition_factor" text,
	"cost_per_sqft" text NOT NULL,
	"total_cost" text NOT NULL,
	"adjusted_cost" text NOT NULL,
	"assessed_value" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"target_type" text NOT NULL,
	"target_id" integer NOT NULL,
	"content" text NOT NULL,
	"parent_comment_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_resolved" boolean DEFAULT false NOT NULL,
	"is_edited" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "connection_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"connection_type" text NOT NULL,
	"status" text NOT NULL,
	"message" text NOT NULL,
	"details" json DEFAULT '{}'::json NOT NULL,
	"user_id" integer,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cost_factor_presets" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"user_id" integer NOT NULL,
	"weights" json NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cost_factors" (
	"id" serial PRIMARY KEY NOT NULL,
	"region" text NOT NULL,
	"building_type" text NOT NULL,
	"base_cost" numeric(10, 2) NOT NULL,
	"complexity_factor" numeric(5, 2) DEFAULT '1.0' NOT NULL,
	"region_factor" numeric(5, 2) DEFAULT '1.0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cost_matrix" (
	"id" serial PRIMARY KEY NOT NULL,
	"region" text NOT NULL,
	"building_type" text NOT NULL,
	"building_type_description" text NOT NULL,
	"base_cost" numeric(14, 2) NOT NULL,
	"matrix_year" integer NOT NULL,
	"source_matrix_id" integer NOT NULL,
	"matrix_description" text NOT NULL,
	"data_points" integer DEFAULT 0 NOT NULL,
	"min_cost" numeric(14, 2),
	"max_cost" numeric(14, 2),
	"complexity_factor_base" numeric(5, 2) DEFAULT '1.0' NOT NULL,
	"quality_factor_base" numeric(5, 2) DEFAULT '1.0' NOT NULL,
	"condition_factor_base" numeric(5, 2) DEFAULT '1.0' NOT NULL,
	"county" text,
	"state" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "environments" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "environments_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "file_uploads" (
	"id" serial PRIMARY KEY NOT NULL,
	"file_name" text NOT NULL,
	"file_type" text NOT NULL,
	"file_size" integer NOT NULL,
	"uploaded_by" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"processed_items" integer DEFAULT 0 NOT NULL,
	"total_items" integer,
	"error_count" integer DEFAULT 0 NOT NULL,
	"errors" json DEFAULT '[]'::json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ftp_connections" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"host" text NOT NULL,
	"port" integer DEFAULT 21 NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"secure" boolean DEFAULT false NOT NULL,
	"passive_mode" boolean DEFAULT true NOT NULL,
	"default_path" text DEFAULT '/',
	"description" text,
	"last_connected" timestamp,
	"status" text DEFAULT 'unknown' NOT NULL,
	"created_by" integer NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "material_costs" (
	"id" serial PRIMARY KEY NOT NULL,
	"material_type_id" integer NOT NULL,
	"building_type" text NOT NULL,
	"region" text NOT NULL,
	"cost_per_unit" numeric(10, 2) NOT NULL,
	"default_percentage" numeric(5, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "material_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"unit" text DEFAULT 'sqft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "material_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "materials_price_cache" (
	"id" serial PRIMARY KEY NOT NULL,
	"material_code" text NOT NULL,
	"source" text NOT NULL,
	"region" text NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"unit" text NOT NULL,
	"fetched_at" timestamp DEFAULT now() NOT NULL,
	"valid_until" timestamp NOT NULL,
	"metadata" json
);
--> statement-breakpoint
CREATE TABLE "project_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"activity_type" text NOT NULL,
	"activity_data" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_invitations" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"invited_by" integer NOT NULL,
	"role" text DEFAULT 'viewer' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"invited_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"item_type" text NOT NULL,
	"item_id" integer NOT NULL,
	"added_by" integer NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"role" text DEFAULT 'viewer' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"invited_by" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repository_status" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_repo" text NOT NULL,
	"target_repo" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"steps" json DEFAULT '[]'::json NOT NULL,
	"cloned_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "scenario_impacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"scenario_id" integer NOT NULL,
	"analysis_type" text NOT NULL,
	"impact_summary" json NOT NULL,
	"calculated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scenario_variations" (
	"id" serial PRIMARY KEY NOT NULL,
	"scenario_id" integer NOT NULL,
	"name" text NOT NULL,
	"parameter_key" text NOT NULL,
	"original_value" json NOT NULL,
	"new_value" json NOT NULL,
	"impact_value" numeric(14, 2),
	"impact_percentage" numeric(5, 2),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" text,
	"type" text DEFAULT 'string' NOT NULL,
	CONSTRAINT "settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "shared_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"token" text NOT NULL,
	"access_level" text DEFAULT 'view' NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"description" text,
	CONSTRAINT "shared_links_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "shared_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_by_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"schedule_id" integer NOT NULL,
	"connection_id" integer NOT NULL,
	"schedule_name" text NOT NULL,
	"start_time" timestamp DEFAULT now() NOT NULL,
	"end_time" timestamp,
	"status" text NOT NULL,
	"files_transferred" integer DEFAULT 0 NOT NULL,
	"total_bytes" integer DEFAULT 0 NOT NULL,
	"errors" text[] DEFAULT '{}' NOT NULL,
	"details" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_schedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"connection_id" integer NOT NULL,
	"source" jsonb NOT NULL,
	"destination" jsonb NOT NULL,
	"frequency" text NOT NULL,
	"time" text,
	"day_of_week" integer,
	"day_of_month" integer,
	"options" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"last_run" timestamp,
	"next_run" timestamp,
	"status" text DEFAULT 'idle',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"name" text,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "what_if_scenarios" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"base_calculation_id" integer,
	"parameters" json NOT NULL,
	"results" json DEFAULT '{}'::json NOT NULL,
	"is_saved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "improvement_details" (
	"id" serial PRIMARY KEY NOT NULL,
	"prop_id" integer NOT NULL,
	"imprv_id" integer NOT NULL,
	"living_area" numeric(10, 1),
	"below_grade_living_area" numeric(10, 1),
	"condition_cd" text,
	"imprv_det_sub_class_cd" text,
	"yr_built" integer,
	"actual_age" integer,
	"num_stories" numeric(3, 1),
	"imprv_det_type_cd" text,
	"imprv_det_desc" text,
	"imprv_det_area" numeric(10, 1),
	"imprv_det_class_cd" text,
	"imported_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "improvement_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"imprv_id" integer NOT NULL,
	"prop_id" integer NOT NULL,
	"bedrooms" numeric(4, 2),
	"baths" numeric(4, 2),
	"halfbath" numeric(4, 2),
	"foundation" text,
	"extwall_desc" text,
	"roofcover_desc" text,
	"hvac_desc" text,
	"fireplaces" numeric(4, 2),
	"sprinkler" boolean,
	"framing_class" text,
	"com_hvac" text,
	"imported_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "improvements" (
	"id" serial PRIMARY KEY NOT NULL,
	"prop_id" integer NOT NULL,
	"imprv_id" integer NOT NULL,
	"imprv_desc" text,
	"imprv_val" numeric(14, 2),
	"living_area" numeric(10, 1),
	"primary_use_cd" text,
	"stories" numeric(3, 1),
	"actual_year_built" integer,
	"total_area" numeric(10, 1),
	"imported_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "land_details" (
	"id" serial PRIMARY KEY NOT NULL,
	"prop_id" integer NOT NULL,
	"size_acres" numeric(10, 4),
	"size_square_feet" numeric(14, 2),
	"land_type_cd" text,
	"land_soil_code" text,
	"ag_use_cd" text,
	"primary_use_cd" text,
	"imported_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" serial PRIMARY KEY NOT NULL,
	"prop_id" integer NOT NULL,
	"block" text,
	"tract_or_lot" text,
	"legal_desc" text,
	"legal_desc_2" text,
	"township_section" text,
	"township_code" text,
	"range_code" text,
	"township_q_section" text,
	"cycle" text,
	"property_use_cd" text,
	"property_use_desc" text,
	"market" numeric(14, 2),
	"land_hstd_val" numeric(14, 2),
	"land_non_hstd_val" numeric(14, 2),
	"imprv_hstd_val" numeric(14, 2),
	"imprv_non_hstd_val" numeric(14, 2),
	"hood_cd" text,
	"abs_subdv_cd" text,
	"appraised_val" numeric(14, 2),
	"assessed_val" numeric(14, 2),
	"legal_acreage" numeric(10, 4),
	"prop_type_cd" text,
	"image_path" text,
	"geo_id" text,
	"is_active" boolean DEFAULT true,
	"tca" text,
	"imported_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "properties_prop_id_unique" UNIQUE("prop_id")
);
--> statement-breakpoint
ALTER TABLE "project_activities" ADD CONSTRAINT "project_activities_project_id_shared_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."shared_projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_activities" ADD CONSTRAINT "project_activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_invitations" ADD CONSTRAINT "project_invitations_project_id_shared_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."shared_projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_invitations" ADD CONSTRAINT "project_invitations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_invitations" ADD CONSTRAINT "project_invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_items" ADD CONSTRAINT "project_items_project_id_shared_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."shared_projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_items" ADD CONSTRAINT "project_items_added_by_users_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_project_id_shared_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."shared_projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shared_links" ADD CONSTRAINT "shared_links_project_id_shared_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."shared_projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shared_links" ADD CONSTRAINT "shared_links_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shared_projects" ADD CONSTRAINT "shared_projects_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "target_type_id_idx" ON "comments" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE UNIQUE INDEX "region_building_type_year_idx" ON "cost_matrix" USING btree ("region","building_type","matrix_year");--> statement-breakpoint
CREATE UNIQUE INDEX "material_building_region_idx" ON "material_costs" USING btree ("material_type_id","building_type","region");--> statement-breakpoint
CREATE UNIQUE INDEX "material_code_source_region_idx" ON "materials_price_cache" USING btree ("material_code","source","region");--> statement-breakpoint
CREATE UNIQUE INDEX "project_invitation_idx" ON "project_invitations" USING btree ("project_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "project_item_idx" ON "project_items" USING btree ("project_id","item_type","item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "project_user_idx" ON "project_members" USING btree ("project_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "imprv_items_idx" ON "improvement_items" USING btree ("prop_id","imprv_id");--> statement-breakpoint
CREATE UNIQUE INDEX "prop_imprv_idx" ON "improvements" USING btree ("prop_id","imprv_id");
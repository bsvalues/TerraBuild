/**
 * Supabase Database Types
 * 
 * This file contains TypeScript type definitions for the Supabase database schema.
 * These types help provide type safety when interacting with the database.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      scenarios: {
        Row: {
          id: number;
          name: string;
          description: string | null;
          parameters: Json;
          user_id: number;
          base_calculation_id: number | null;
          created_at: string;
          updated_at: string | null;
          is_saved: boolean;
          results: Json | null;
        };
        Insert: {
          id?: number;
          name: string;
          description?: string | null;
          parameters: Json;
          user_id: number;
          base_calculation_id?: number | null;
          created_at?: string;
          updated_at?: string | null;
          is_saved?: boolean;
          results?: Json | null;
        };
        Update: {
          id?: number;
          name?: string;
          description?: string | null;
          parameters?: Json;
          user_id?: number;
          base_calculation_id?: number | null;
          created_at?: string;
          updated_at?: string | null;
          is_saved?: boolean;
          results?: Json | null;
        };
      };
      variations: {
        Row: {
          id: number;
          scenario_id: number;
          name: string;
          parameter_changes: Json;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: number;
          scenario_id: number;
          name: string;
          parameter_changes: Json;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: number;
          scenario_id?: number;
          name?: string;
          parameter_changes?: Json;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      impacts: {
        Row: {
          id: number;
          scenario_id: number;
          parameter_key: string;
          original_value: Json;
          new_value: Json;
          impact_value: string | null;
          impact_percentage: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          scenario_id: number;
          parameter_key: string;
          original_value: Json;
          new_value: Json;
          impact_value?: string | null;
          impact_percentage?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          scenario_id?: number;
          parameter_key?: string;
          original_value?: Json;
          new_value?: Json;
          impact_value?: string | null;
          impact_percentage?: string | null;
          created_at?: string;
        };
      };
      properties: {
        Row: {
          id: number;
          prop_id: string;
          block: string;
          tract_or_lot: string;
          parcel: string;
          address: string;
          county: string;
          state: string;
          zip_code: string;
          property_type: string;
          status: string;
          created_at: string;
          updated_at: string | null;
          geo_location: Json | null;
        };
        Insert: {
          id?: number;
          prop_id: string;
          block?: string;
          tract_or_lot?: string;
          parcel?: string;
          address: string;
          county: string;
          state: string;
          zip_code: string;
          property_type: string;
          status?: string;
          created_at?: string;
          updated_at?: string | null;
          geo_location?: Json | null;
        };
        Update: {
          id?: number;
          prop_id?: string;
          block?: string;
          tract_or_lot?: string;
          parcel?: string;
          address?: string;
          county?: string;
          state?: string;
          zip_code?: string;
          property_type?: string;
          status?: string;
          created_at?: string;
          updated_at?: string | null;
          geo_location?: Json | null;
        };
      };
      improvements: {
        Row: {
          id: number;
          property_id: number;
          improvement_type: string;
          improvement_id: string;
          building_type: string;
          year_built: number;
          grade: string;
          condition: string;
          sq_footage: number;
          stories: number;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: number;
          property_id: number;
          improvement_type: string;
          improvement_id: string;
          building_type: string;
          year_built: number;
          grade: string;
          condition: string;
          sq_footage: number;
          stories: number;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: number;
          property_id?: number;
          improvement_type?: string;
          improvement_id?: string;
          building_type?: string;
          year_built?: number;
          grade?: string;
          condition?: string;
          sq_footage?: number;
          stories?: number;
          created_at?: string;
          updated_at?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
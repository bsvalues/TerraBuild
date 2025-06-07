/**
 * Supabase Storage Implementation
 * 
 * This class provides an implementation of the IStorage interface using Supabase
 * for cloud-based data persistence.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { IStorage } from './storage';

export class SupabaseStorage implements IStorage {
  private supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  /**
   * Check if the Supabase connection is working
   */
  async checkConnection(): Promise<boolean> {
    try {
      // Attempt a simple query to check connection
      const { data, error } = await this.supabase
        .from('settings')
        .select('key')
        .limit(1);
      
      if (error) {
        console.warn('[supabase] Connection check failed:', error.message);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('[supabase] Connection check exception:', error);
      return false;
    }
  }

  // Implement IStorage interface methods
  async getAllCosts(): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('building_costs')
      .select('*');
      
    if (error) throw new Error(`Error fetching costs: ${error.message}`);
    return data || [];
  }
  
  async getCostById(id: number): Promise<any> {
    const { data, error } = await this.supabase
      .from('building_costs')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw new Error(`Error fetching cost by ID: ${error.message}`);
    return data;
  }
  
  async createCost(data: any): Promise<any> {
    const { data: createdCost, error } = await this.supabase
      .from('building_costs')
      .insert(data)
      .select('*')
      .single();
      
    if (error) throw new Error(`Error creating cost: ${error.message}`);
    return createdCost;
  }
  
  async updateCost(id: number, data: any): Promise<any> {
    const { data: updatedCost, error } = await this.supabase
      .from('building_costs')
      .update(data)
      .eq('id', id)
      .select('*')
      .single();
      
    if (error) throw new Error(`Error updating cost: ${error.message}`);
    return updatedCost;
  }
  
  async deleteCost(id: number): Promise<void> {
    const { error } = await this.supabase
      .from('building_costs')
      .delete()
      .eq('id', id);
      
    if (error) throw new Error(`Error deleting cost: ${error.message}`);
  }
  
  async getCostFactors(): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('cost_factors')
      .select('*');
      
    if (error) throw new Error(`Error fetching cost factors: ${error.message}`);
    return data || [];
  }
  
  async getCostFactorsByRegionAndBuildingType(region: string, buildingType: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('cost_factors')
      .select('*')
      .eq('region', region)
      .eq('building_type', buildingType);
      
    if (error) throw new Error(`Error fetching cost factors by region and building type: ${error.message}`);
    return data || [];
  }
  
  async createCostFactor(data: any): Promise<any> {
    const { data: createdFactor, error } = await this.supabase
      .from('cost_factors')
      .insert(data)
      .select('*')
      .single();
      
    if (error) throw new Error(`Error creating cost factor: ${error.message}`);
    return createdFactor;
  }
  
  async updateCostFactor(id: number, data: any): Promise<any> {
    const { data: updatedFactor, error } = await this.supabase
      .from('cost_factors')
      .update(data)
      .eq('id', id)
      .select('*')
      .single();
      
    if (error) throw new Error(`Error updating cost factor: ${error.message}`);
    return updatedFactor;
  }
  
  async deleteCostFactor(id: number): Promise<void> {
    const { error } = await this.supabase
      .from('cost_factors')
      .delete()
      .eq('id', id);
      
    if (error) throw new Error(`Error deleting cost factor: ${error.message}`);
  }
  
  async getUsers(): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*');
      
    if (error) throw new Error(`Error fetching users: ${error.message}`);
    return data || [];
  }
  
  async getUserById(id: number): Promise<any> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw new Error(`Error fetching user by ID: ${error.message}`);
    return data;
  }
  
  async getUserByEmail(email: string): Promise<any> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
      
    if (error && error.code !== 'PGRST116') { // Not found error
      throw new Error(`Error fetching user by email: ${error.message}`);
    }
    return data;
  }
  
  async createUser(data: any): Promise<any> {
    const { data: createdUser, error } = await this.supabase
      .from('users')
      .insert(data)
      .select('*')
      .single();
      
    if (error) throw new Error(`Error creating user: ${error.message}`);
    return createdUser;
  }
  
  async updateUser(id: number, data: any): Promise<any> {
    const { data: updatedUser, error } = await this.supabase
      .from('users')
      .update(data)
      .eq('id', id)
      .select('*')
      .single();
      
    if (error) throw new Error(`Error updating user: ${error.message}`);
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<void> {
    const { error } = await this.supabase
      .from('users')
      .delete()
      .eq('id', id);
      
    if (error) throw new Error(`Error deleting user: ${error.message}`);
  }
  
  async getCostMatrices(): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('cost_matrices')
      .select('*');
      
    if (error) throw new Error(`Error fetching cost matrices: ${error.message}`);
    return data || [];
  }
  
  async getCostMatrixById(id: number): Promise<any> {
    const { data, error } = await this.supabase
      .from('cost_matrices')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw new Error(`Error fetching cost matrix by ID: ${error.message}`);
    return data;
  }
  
  async getCostMatrixByRegionAndBuildingType(region: string, buildingType: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('cost_matrices')
      .select('*')
      .eq('region', region)
      .eq('building_type', buildingType);
      
    if (error) throw new Error(`Error fetching cost matrix by region and building type: ${error.message}`);
    return data || [];
  }
  
  async createCostMatrix(data: any): Promise<any> {
    const { data: createdMatrix, error } = await this.supabase
      .from('cost_matrices')
      .insert(data)
      .select('*')
      .single();
      
    if (error) throw new Error(`Error creating cost matrix: ${error.message}`);
    return createdMatrix;
  }
  
  async updateCostMatrix(id: number, data: any): Promise<any> {
    const { data: updatedMatrix, error } = await this.supabase
      .from('cost_matrices')
      .update(data)
      .eq('id', id)
      .select('*')
      .single();
      
    if (error) throw new Error(`Error updating cost matrix: ${error.message}`);
    return updatedMatrix;
  }
  
  async deleteCostMatrix(id: number): Promise<void> {
    const { error } = await this.supabase
      .from('cost_matrices')
      .delete()
      .eq('id', id);
      
    if (error) throw new Error(`Error deleting cost matrix: ${error.message}`);
  }
  
  async getAllProperties(options?: { limit?: number, offset?: number }): Promise<any[]> {
    let query = this.supabase
      .from('properties')
      .select('*');
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }
    
    const { data, error } = await query;
      
    if (error) throw new Error(`Error fetching properties: ${error.message}`);
    return data || [];
  }
  
  async getPropertyById(id: number): Promise<any> {
    const { data, error } = await this.supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw new Error(`Error fetching property by ID: ${error.message}`);
    return data;
  }
  
  async getPropertyByPropId(propId: string): Promise<any> {
    const { data, error } = await this.supabase
      .from('properties')
      .select('*')
      .eq('propId', propId)
      .single();
      
    if (error && error.code !== 'PGRST116') { // Not found error
      throw new Error(`Error fetching property by propId: ${error.message}`);
    }
    return data;
  }
  
  async createProperty(data: any): Promise<any> {
    const { data: createdProperty, error } = await this.supabase
      .from('properties')
      .insert(data)
      .select('*')
      .single();
      
    if (error) throw new Error(`Error creating property: ${error.message}`);
    return createdProperty;
  }
  
  async updateProperty(id: number, data: any): Promise<any> {
    const { data: updatedProperty, error } = await this.supabase
      .from('properties')
      .update(data)
      .eq('id', id)
      .select('*')
      .single();
      
    if (error) throw new Error(`Error updating property: ${error.message}`);
    return updatedProperty;
  }
  
  async deleteProperty(id: number): Promise<void> {
    const { error } = await this.supabase
      .from('properties')
      .delete()
      .eq('id', id);
      
    if (error) throw new Error(`Error deleting property: ${error.message}`);
  }
  
  // Add additional methods as needed to implement the IStorage interface
}
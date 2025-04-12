/**
 * Supabase Routes
 * 
 * This file provides routes to interact with the Supabase database.
 * It serves as the bridge between the Express server and Supabase.
 */

import express from 'express';
import { getSupabaseClient, isSupabaseConfigured } from '../utils/supabaseClient';
import { z } from 'zod';

const router = express.Router();

// GET /api/supabase/status - Get Supabase configuration status
router.get('/status', async (req, res) => {
  try {
    const isConfigured = isSupabaseConfigured();
    
    if (!isConfigured) {
      return res.status(500).json({
        error: 'Supabase not configured',
        message: 'Supabase environment variables are missing',
        timestamp: new Date().toISOString()
      });
    }
    
    const supabase = getSupabaseClient();
    
    // Test connection with a simple query
    const { data, error } = await supabase.from('scenarios').select('count');
    
    if (error) {
      return res.status(500).json({
        error: 'Supabase connection error',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({
      status: 'connected',
      message: 'Successfully connected to Supabase',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error checking Supabase status:', error);
    res.status(500).json({
      error: 'Failed to check Supabase connection',
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
});

// POST /api/supabase/scenarios - Create a new scenario in Supabase
router.post('/scenarios', async (req, res) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(500).json({
        error: 'Supabase not configured',
        message: 'Supabase environment variables are missing',
        timestamp: new Date().toISOString()
      });
    }
    
    // Validate the scenario data
    const scenarioSchema = z.object({
      name: z.string().min(1, "Name is required"),
      description: z.string().optional(),
      parameters: z.record(z.unknown()).default({}),
      user_id: z.number().int().positive(),
      base_calculation_id: z.number().int().positive().optional(),
      is_saved: z.boolean().default(false)
    });
    
    try {
      const validatedData = scenarioSchema.parse(req.body);
      
      const supabase = getSupabaseClient();
      
      // Insert the new scenario
      const { data, error } = await supabase
        .from('scenarios')
        .insert(validatedData)
        .select('*')
        .single();
      
      if (error) {
        return res.status(400).json({
          error: 'Failed to create scenario',
          message: error.message,
          timestamp: new Date().toISOString()
        });
      }
      
      res.status(201).json(data);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          message: validationError.errors,
          timestamp: new Date().toISOString()
        });
      }
      throw validationError;
    }
  } catch (error) {
    console.error('Error creating scenario in Supabase:', error);
    res.status(500).json({
      error: 'Server error',
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/supabase/scenarios - Get all scenarios from Supabase
router.get('/scenarios', async (req, res) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(500).json({
        error: 'Supabase not configured',
        message: 'Supabase environment variables are missing',
        timestamp: new Date().toISOString()
      });
    }
    
    const supabase = getSupabaseClient();
    
    // Get userId from query parameter or use -1 as fallback (for development)
    const userId = parseInt(req.query.userId as string) || -1;
    
    // Query Supabase for scenarios
    let query = supabase.from('scenarios').select('*');
    
    // Add filter by user_id if provided and not -1
    if (userId !== -1) {
      query = query.eq('user_id', userId);
    }
    
    // Add sorting by created_at (newest first)
    query = query.order('created_at', { ascending: false });
    
    const { data, error } = await query;
    
    if (error) {
      return res.status(500).json({
        error: 'Failed to fetch scenarios',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching scenarios from Supabase:', error);
    res.status(500).json({
      error: 'Server error',
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/supabase/scenarios/:id - Get a scenario by ID from Supabase
router.get('/scenarios/:id', async (req, res) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(500).json({
        error: 'Supabase not configured',
        message: 'Supabase environment variables are missing',
        timestamp: new Date().toISOString()
      });
    }
    
    const scenarioId = parseInt(req.params.id);
    if (isNaN(scenarioId)) {
      return res.status(400).json({
        error: 'Invalid scenario ID',
        message: 'Scenario ID must be a number',
        timestamp: new Date().toISOString()
      });
    }
    
    const supabase = getSupabaseClient();
    
    // Query Supabase for the specific scenario
    const { data, error } = await supabase
      .from('scenarios')
      .select('*')
      .eq('id', scenarioId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Scenario not found',
          message: `No scenario found with ID ${scenarioId}`,
          timestamp: new Date().toISOString()
        });
      }
      
      return res.status(500).json({
        error: 'Failed to fetch scenario',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching scenario from Supabase:', error);
    res.status(500).json({
      error: 'Server error',
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
});

// PATCH /api/supabase/scenarios/:id - Update a scenario by ID in Supabase
router.patch('/scenarios/:id', async (req, res) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(500).json({
        error: 'Supabase not configured',
        message: 'Supabase environment variables are missing',
        timestamp: new Date().toISOString()
      });
    }
    
    const scenarioId = parseInt(req.params.id);
    if (isNaN(scenarioId)) {
      return res.status(400).json({
        error: 'Invalid scenario ID',
        message: 'Scenario ID must be a number',
        timestamp: new Date().toISOString()
      });
    }
    
    // Validate the update data
    const updateSchema = z.object({
      name: z.string().min(1, "Name is required").optional(),
      description: z.string().optional(),
      parameters: z.record(z.unknown()).optional(),
      base_calculation_id: z.number().int().positive().optional(),
      is_saved: z.boolean().optional()
    });
    
    try {
      const validatedData = updateSchema.parse(req.body);
      
      // Add updated_at timestamp
      const dataToUpdate = {
        ...validatedData,
        updated_at: new Date().toISOString()
      };
      
      const supabase = getSupabaseClient();
      
      // Update the scenario
      const { data, error } = await supabase
        .from('scenarios')
        .update(dataToUpdate)
        .eq('id', scenarioId)
        .select('*')
        .single();
      
      if (error) {
        return res.status(400).json({
          error: 'Failed to update scenario',
          message: error.message,
          timestamp: new Date().toISOString()
        });
      }
      
      if (!data) {
        return res.status(404).json({
          error: 'Scenario not found',
          message: `No scenario found with ID ${scenarioId}`,
          timestamp: new Date().toISOString()
        });
      }
      
      res.json(data);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          message: validationError.errors,
          timestamp: new Date().toISOString()
        });
      }
      throw validationError;
    }
  } catch (error) {
    console.error('Error updating scenario in Supabase:', error);
    res.status(500).json({
      error: 'Server error',
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
});

// DELETE /api/supabase/scenarios/:id - Delete a scenario by ID from Supabase
router.delete('/scenarios/:id', async (req, res) => {
  try {
    if (!isSupabaseConfigured()) {
      return res.status(500).json({
        error: 'Supabase not configured',
        message: 'Supabase environment variables are missing',
        timestamp: new Date().toISOString()
      });
    }
    
    const scenarioId = parseInt(req.params.id);
    if (isNaN(scenarioId)) {
      return res.status(400).json({
        error: 'Invalid scenario ID',
        message: 'Scenario ID must be a number',
        timestamp: new Date().toISOString()
      });
    }
    
    const supabase = getSupabaseClient();
    
    // Delete the scenario
    const { error } = await supabase
      .from('scenarios')
      .delete()
      .eq('id', scenarioId);
    
    if (error) {
      return res.status(400).json({
        error: 'Failed to delete scenario',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting scenario from Supabase:', error);
    res.status(500).json({
      error: 'Server error',
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
/**
 * Manifest Handler
 * 
 * This module provides functions for reading and writing agent manifests
 */

import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import chalk from 'chalk';
import ora from 'ora';

/**
 * Read and parse an agent manifest file
 * @param {string} filePath - Path to the manifest file
 * @returns {Promise<Object>} Parsed manifest object
 */
export async function readManifest(filePath) {
  try {
    const spinner = ora(`Reading manifest from ${filePath}`).start();
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      spinner.fail(`File not found: ${filePath}`);
      throw new Error(`Manifest file not found: ${filePath}`);
    }
    
    // Read file
    const fileContent = await fs.readFile(filePath, 'utf8');
    
    // Parse as YAML
    let manifest;
    try {
      manifest = yaml.load(fileContent);
      spinner.succeed(`Manifest loaded from ${filePath}`);
    } catch (error) {
      spinner.fail(`Failed to parse manifest`);
      throw new Error(`Failed to parse manifest as YAML: ${error.message}`);
    }
    
    return manifest;
  } catch (error) {
    // If the error is already formatted, just re-throw it
    if (error.message.startsWith('Manifest file not found') || 
        error.message.startsWith('Failed to parse manifest')) {
      throw error;
    }
    
    // Otherwise format a new error
    throw new Error(`Error reading manifest: ${error.message}`);
  }
}

/**
 * Write a manifest object to a file
 * @param {Object} manifest - Manifest object to write
 * @param {string} filePath - Path to save the manifest
 * @returns {Promise<void>}
 */
export async function writeManifest(manifest, filePath) {
  try {
    const spinner = ora(`Writing manifest to ${filePath}`).start();
    
    // Create directory if it doesn't exist
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    
    // Convert to YAML
    const yamlContent = yaml.dump(manifest, {
      indent: 2,
      lineWidth: 100,
      noRefs: true
    });
    
    // Write file
    await fs.writeFile(filePath, yamlContent, 'utf8');
    
    spinner.succeed(`Manifest saved to ${filePath}`);
  } catch (error) {
    throw new Error(`Error writing manifest: ${error.message}`);
  }
}

/**
 * Create a new empty manifest
 * @param {string} environment - Target environment (dev, staging, prod)
 * @returns {Object} New manifest object
 */
export function createEmptyManifest(environment = 'dev') {
  return {
    version: '1.0.0',
    environment,
    default_settings: {
      memory: 'persistent',
      feedback_loop: true,
      log_level: 'info',
      metrics_enabled: true,
      sensitivity: 'medium'
    },
    agents: [],
    coordination: {
      conflict_resolution: 'priority_based',
      agent_priorities: [],
      communication_allowed: true,
      shared_memory_enabled: true,
      orchestrator: 'default',
      max_concurrent_agents: 5,
      health_check_interval: '30s',
      retry_policy: {
        max_retries: 3,
        backoff_factor: 2,
        initial_delay: '1s'
      }
    },
    observability: {
      metrics_endpoint: '/metrics',
      logging: {
        format: 'json',
        destination: 'stdout',
        additional_outputs: []
      },
      tracing: {
        enabled: true,
        sampler_type: 'probabilistic',
        sampler_param: 0.1,
        exporter: 'jaeger'
      },
      alerting: {
        channels: []
      }
    }
  };
}

/**
 * Get a template manifest for a specific agent type
 * @param {string} agentType - Type of agent (e.g., 'factor-tuner', 'benchmark-guard')
 * @returns {Object} Agent template
 */
export function getAgentTemplate(agentType) {
  // Base template
  const baseTemplate = {
    name: '',
    version: '1.0.0',
    description: '',
    mode: 'autonomous',
    memory: 'persistent',
    sensitivity: 'medium',
    feedback_loop: true
  };
  
  // Agent-specific templates
  const templates = {
    'factor-tuner': {
      ...baseTemplate,
      name: 'factor-tuner',
      description: 'Optimizes adjustment factors for cost calculations',
      schedule: '0 */6 * * *', // Every 6 hours
      on_anomaly: 'suggest_correction',
      settings: {
        optimization_algorithm: 'bayesian',
        convergence_threshold: '0.01',
        max_iterations: 100
      }
    },
    'benchmark-guard': {
      ...baseTemplate,
      name: 'benchmark-guard',
      description: 'Monitors and validates benchmark data accuracy',
      mode: 'watchdog',
      alert_threshold: '0.15',
      sensitivity: 'high',
      on_anomaly: 'log_and_notify',
      settings: {
        benchmark_dataset: 'historical_benchmarks',
        detection_algorithm: 'isolation_forest',
        confidence_threshold: '0.85'
      }
    },
    'curve-trainer': {
      ...baseTemplate,
      name: 'curve-trainer',
      description: 'Trains and updates cost prediction curves',
      schedule: '0 0 * * 1', // Every Monday at midnight
      max_outputs: 5,
      settings: {
        training_algorithm: 'gradient_boost',
        cross_validation: 'true',
        feature_selection: 'auto'
      }
    },
    'scenario-agent': {
      ...baseTemplate,
      name: 'scenario-agent',
      description: 'Creates what-if scenarios for cost impact analysis',
      mode: 'suggestive',
      trigger_on: 'user_request',
      settings: {
        scenario_types: 'market,regulatory,environmental',
        max_variations: 5,
        probability_weighting: 'true'
      }
    },
    'boe-arguer': {
      ...baseTemplate,
      name: 'boe-arguer',
      description: 'Generates arguments and evidence for BOE hearings',
      mode: 'collaborative',
      settings: {
        case_database: 'precedent_db',
        evidence_threshold: 'substantial',
        legal_framework: 'washington_state'
      }
    }
  };
  
  return templates[agentType] || baseTemplate;
}
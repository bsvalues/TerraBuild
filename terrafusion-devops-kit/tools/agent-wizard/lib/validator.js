/**
 * Agent Manifest Validator
 * 
 * Validates the structure and content of agent manifest files
 */

/**
 * Validate an agent manifest
 * @param {Object} manifest - The agent manifest to validate
 * @returns {Object} Validation result with valid flag, errors, warnings, and fixes
 */
export function validateManifest(manifest) {
  const result = {
    valid: true,
    errors: [],
    warnings: [],
    autoFixable: false,
    fixes: []
  };
  
  // Validate manifest structure
  validateStructure(manifest, result);
  
  // If there are structural errors, don't continue with detailed validation
  if (result.errors.length > 0) {
    result.valid = false;
    return result;
  }
  
  // Validate version
  validateVersion(manifest, result);
  
  // Validate environment
  validateEnvironment(manifest, result);
  
  // Validate default settings
  validateDefaultSettings(manifest, result);
  
  // Validate agents
  validateAgents(manifest, result);
  
  // Validate coordination
  validateCoordination(manifest, result);
  
  // Validate observability
  validateObservability(manifest, result);
  
  // Set valid flag
  result.valid = result.errors.length === 0;
  
  // Determine if auto-fixable
  result.autoFixable = result.fixes.length > 0;
  
  return result;
}

/**
 * Validate the basic structure of the manifest
 * @param {Object} manifest - The manifest to validate
 * @param {Object} result - Validation result object
 */
function validateStructure(manifest, result) {
  if (!manifest) {
    result.errors.push('Manifest is empty or invalid');
    return;
  }
  
  // Check required top-level fields
  const requiredFields = ['version', 'agents'];
  for (const field of requiredFields) {
    if (!manifest[field]) {
      result.errors.push(`Missing required field: ${field}`);
      
      // Add fix for version
      if (field === 'version') {
        result.fixes.push({
          path: 'version',
          value: '1.0.0',
          description: 'Add default version 1.0.0'
        });
      }
      
      // Add fix for agents
      if (field === 'agents') {
        result.fixes.push({
          path: 'agents',
          value: [],
          description: 'Initialize empty agents array'
        });
      }
    }
  }
  
  // Check that agents is an array
  if (manifest.agents && !Array.isArray(manifest.agents)) {
    result.errors.push('Field "agents" must be an array');
  }
}

/**
 * Validate the manifest version
 * @param {Object} manifest - The manifest to validate
 * @param {Object} result - Validation result object
 */
function validateVersion(manifest, result) {
  if (!manifest.version) return; // Already handled in structure validation
  
  // Check version format (semver)
  const semverRegex = /^\d+\.\d+\.\d+$/;
  if (!semverRegex.test(manifest.version)) {
    result.errors.push(`Invalid version format: ${manifest.version}. Should be in semver format (e.g., 1.0.0)`);
    
    // Add fix for invalid version
    result.fixes.push({
      path: 'version',
      value: '1.0.0',
      description: 'Set version to 1.0.0'
    });
  }
}

/**
 * Validate the environment setting
 * @param {Object} manifest - The manifest to validate
 * @param {Object} result - Validation result object
 */
function validateEnvironment(manifest, result) {
  if (!manifest.environment) {
    result.warnings.push('Missing environment field, will use default');
    
    // Add fix for missing environment
    result.fixes.push({
      path: 'environment',
      value: 'dev',
      description: 'Set environment to dev'
    });
    
    return;
  }
  
  // Check environment value
  const validEnvironments = ['dev', 'staging', 'prod', 'production', 'test'];
  if (!validEnvironments.includes(manifest.environment)) {
    result.warnings.push(`Unusual environment value: ${manifest.environment}. Common values are: dev, staging, prod`);
  }
}

/**
 * Validate default settings
 * @param {Object} manifest - The manifest to validate
 * @param {Object} result - Validation result object
 */
function validateDefaultSettings(manifest, result) {
  if (!manifest.default_settings) {
    result.warnings.push('Missing default_settings, defaults will be used');
    
    // Add fix for missing default_settings
    result.fixes.push({
      path: 'default_settings',
      value: {
        memory: 'persistent',
        feedback_loop: true,
        log_level: 'info',
        metrics_enabled: true,
        sensitivity: 'medium'
      },
      description: 'Add default settings'
    });
    
    return;
  }
  
  const settings = manifest.default_settings;
  
  // Check memory setting
  if (settings.memory && !['persistent', 'ephemeral', 'none'].includes(settings.memory)) {
    result.errors.push(`Invalid memory value in default_settings: ${settings.memory}`);
    
    // Add fix for invalid memory
    result.fixes.push({
      path: 'default_settings.memory',
      value: 'persistent',
      description: 'Set memory to persistent'
    });
  }
  
  // Check log_level
  if (settings.log_level && !['debug', 'info', 'warn', 'error'].includes(settings.log_level)) {
    result.errors.push(`Invalid log_level value in default_settings: ${settings.log_level}`);
    
    // Add fix for invalid log_level
    result.fixes.push({
      path: 'default_settings.log_level',
      value: 'info',
      description: 'Set log_level to info'
    });
  }
  
  // Check sensitivity
  if (settings.sensitivity && !['low', 'medium', 'high'].includes(settings.sensitivity)) {
    result.errors.push(`Invalid sensitivity value in default_settings: ${settings.sensitivity}`);
    
    // Add fix for invalid sensitivity
    result.fixes.push({
      path: 'default_settings.sensitivity',
      value: 'medium',
      description: 'Set sensitivity to medium'
    });
  }
  
  // Check feedback_loop and metrics_enabled are booleans
  if (settings.feedback_loop !== undefined && typeof settings.feedback_loop !== 'boolean') {
    result.errors.push(`feedback_loop in default_settings must be a boolean`);
    
    // Add fix for invalid feedback_loop
    result.fixes.push({
      path: 'default_settings.feedback_loop',
      value: true,
      description: 'Set feedback_loop to true'
    });
  }
  
  if (settings.metrics_enabled !== undefined && typeof settings.metrics_enabled !== 'boolean') {
    result.errors.push(`metrics_enabled in default_settings must be a boolean`);
    
    // Add fix for invalid metrics_enabled
    result.fixes.push({
      path: 'default_settings.metrics_enabled',
      value: true,
      description: 'Set metrics_enabled to true'
    });
  }
}

/**
 * Validate agents configuration
 * @param {Object} manifest - The manifest to validate
 * @param {Object} result - Validation result object
 */
function validateAgents(manifest, result) {
  if (!Array.isArray(manifest.agents)) return; // Already handled in structure validation
  
  if (manifest.agents.length === 0) {
    result.warnings.push('No agents defined in manifest');
    return;
  }
  
  // Validate each agent
  manifest.agents.forEach((agent, index) => {
    // Check required fields
    const requiredFields = ['name', 'version', 'mode'];
    for (const field of requiredFields) {
      if (!agent[field]) {
        result.errors.push(`Agent at index ${index} is missing required field: ${field}`);
      }
    }
    
    // Skip further validation if required fields are missing
    if (requiredFields.some(field => !agent[field])) {
      return;
    }
    
    // Check mode
    const validModes = ['autonomous', 'suggestive', 'watchdog', 'collaborative'];
    if (!validModes.includes(agent.mode)) {
      result.errors.push(`Invalid mode for agent "${agent.name}": ${agent.mode}`);
    }
    
    // Check mode-specific requirements
    if (agent.mode === 'autonomous' && !agent.schedule) {
      result.errors.push(`Autonomous agent "${agent.name}" is missing required field: schedule`);
    }
    
    if (agent.mode === 'suggestive' && !agent.trigger_on) {
      result.errors.push(`Suggestive agent "${agent.name}" is missing required field: trigger_on`);
    }
    
    if (agent.mode === 'watchdog' && !agent.alert_threshold) {
      result.errors.push(`Watchdog agent "${agent.name}" is missing required field: alert_threshold`);
    }
    
    // Check version format (semver)
    const semverRegex = /^\d+\.\d+\.\d+$/;
    if (!semverRegex.test(agent.version)) {
      result.errors.push(`Invalid version format for agent "${agent.name}": ${agent.version}`);
    }
    
    // Check schedule format for autonomous agents
    if (agent.mode === 'autonomous' && agent.schedule) {
      const cronRegex = /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/;
      if (!cronRegex.test(agent.schedule)) {
        result.warnings.push(`Cron schedule for agent "${agent.name}" may be invalid: ${agent.schedule}`);
      }
    }
    
    // Check optional fields
    if (agent.memory && !['persistent', 'ephemeral', 'none'].includes(agent.memory)) {
      result.errors.push(`Invalid memory value for agent "${agent.name}": ${agent.memory}`);
    }
    
    if (agent.sensitivity && !['low', 'medium', 'high'].includes(agent.sensitivity)) {
      result.errors.push(`Invalid sensitivity value for agent "${agent.name}": ${agent.sensitivity}`);
    }
    
    if (agent.on_anomaly && !['suggest_correction', 'log_and_notify', 'auto_correct'].includes(agent.on_anomaly)) {
      result.errors.push(`Invalid on_anomaly value for agent "${agent.name}": ${agent.on_anomaly}`);
    }
    
    // Check feedback_loop is a boolean
    if (agent.feedback_loop !== undefined && typeof agent.feedback_loop !== 'boolean') {
      result.errors.push(`feedback_loop for agent "${agent.name}" must be a boolean`);
    }
    
    // Check alert_threshold is a number or string representing a number/percentage
    if (agent.alert_threshold) {
      const threshold = parseFloat(agent.alert_threshold);
      if (isNaN(threshold)) {
        result.errors.push(`alert_threshold for agent "${agent.name}" must be a number or percentage`);
      }
    }
    
    // Check max_outputs is a number if present
    if (agent.max_outputs !== undefined) {
      const maxOutputs = parseInt(agent.max_outputs, 10);
      if (isNaN(maxOutputs)) {
        result.errors.push(`max_outputs for agent "${agent.name}" must be a number`);
      }
    }
    
    // Check source is an array if present
    if (agent.source && !Array.isArray(agent.source)) {
      result.errors.push(`source for agent "${agent.name}" must be an array`);
    }
    
    // Check settings is an object if present
    if (agent.settings && typeof agent.settings !== 'object') {
      result.errors.push(`settings for agent "${agent.name}" must be an object`);
    }
  });
  
  // Check for duplicate agent names
  const agentNames = manifest.agents.map(a => a.name);
  const uniqueAgentNames = new Set(agentNames);
  
  if (uniqueAgentNames.size < agentNames.length) {
    result.errors.push('Duplicate agent names found in manifest');
    
    // Find the duplicates
    const counts = {};
    const duplicates = [];
    
    for (const name of agentNames) {
      counts[name] = (counts[name] || 0) + 1;
      if (counts[name] > 1 && !duplicates.includes(name)) {
        duplicates.push(name);
      }
    }
    
    // Add specific details about duplicates
    for (const name of duplicates) {
      result.errors.push(`Agent name "${name}" is used ${counts[name]} times`);
    }
  }
}

/**
 * Validate coordination settings
 * @param {Object} manifest - The manifest to validate
 * @param {Object} result - Validation result object
 */
function validateCoordination(manifest, result) {
  if (!manifest.coordination) {
    result.warnings.push('Missing coordination section, defaults will be used');
    
    // Add fix for missing coordination
    result.fixes.push({
      path: 'coordination',
      value: {
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
      description: 'Add default coordination settings'
    });
    
    return;
  }
  
  const coordination = manifest.coordination;
  
  // Check conflict_resolution
  const validResolutionTypes = ['priority_based', 'timestamp_based', 'consensus', 'manual'];
  if (coordination.conflict_resolution && !validResolutionTypes.includes(coordination.conflict_resolution)) {
    result.errors.push(`Invalid conflict_resolution value: ${coordination.conflict_resolution}`);
    
    // Add fix for invalid conflict_resolution
    result.fixes.push({
      path: 'coordination.conflict_resolution',
      value: 'priority_based',
      description: 'Set conflict_resolution to priority_based'
    });
  }
  
  // Check agent_priorities is an array
  if (coordination.agent_priorities && !Array.isArray(coordination.agent_priorities)) {
    result.errors.push('agent_priorities must be an array');
    
    // Add fix for invalid agent_priorities
    result.fixes.push({
      path: 'coordination.agent_priorities',
      value: [],
      description: 'Initialize agent_priorities as empty array'
    });
  }
  
  // Check agent_priorities contains valid agent names
  if (Array.isArray(coordination.agent_priorities) && Array.isArray(manifest.agents)) {
    const validAgentNames = manifest.agents.map(a => a.name);
    
    for (const name of coordination.agent_priorities) {
      if (!validAgentNames.includes(name)) {
        result.warnings.push(`Agent "${name}" in agent_priorities does not exist in agents list`);
      }
    }
    
    // Check if all agents are in priorities
    for (const name of validAgentNames) {
      if (!coordination.agent_priorities.includes(name)) {
        result.warnings.push(`Agent "${name}" is not included in agent_priorities`);
      }
    }
  }
  
  // Check communication_allowed and shared_memory_enabled are booleans
  if (coordination.communication_allowed !== undefined && typeof coordination.communication_allowed !== 'boolean') {
    result.errors.push('communication_allowed must be a boolean');
    
    // Add fix for invalid communication_allowed
    result.fixes.push({
      path: 'coordination.communication_allowed',
      value: true,
      description: 'Set communication_allowed to true'
    });
  }
  
  if (coordination.shared_memory_enabled !== undefined && typeof coordination.shared_memory_enabled !== 'boolean') {
    result.errors.push('shared_memory_enabled must be a boolean');
    
    // Add fix for invalid shared_memory_enabled
    result.fixes.push({
      path: 'coordination.shared_memory_enabled',
      value: true,
      description: 'Set shared_memory_enabled to true'
    });
  }
  
  // Check max_concurrent_agents is a number
  if (coordination.max_concurrent_agents !== undefined) {
    const maxAgents = parseInt(coordination.max_concurrent_agents, 10);
    if (isNaN(maxAgents) || maxAgents <= 0) {
      result.errors.push('max_concurrent_agents must be a positive number');
      
      // Add fix for invalid max_concurrent_agents
      result.fixes.push({
        path: 'coordination.max_concurrent_agents',
        value: 5,
        description: 'Set max_concurrent_agents to 5'
      });
    }
  }
  
  // Check health_check_interval format
  if (coordination.health_check_interval) {
    const timeUnitRegex = /^(\d+)([smhd])$/;
    if (!timeUnitRegex.test(coordination.health_check_interval)) {
      result.errors.push(`Invalid health_check_interval format: ${coordination.health_check_interval}. Use format like 30s, 5m, 1h`);
      
      // Add fix for invalid health_check_interval
      result.fixes.push({
        path: 'coordination.health_check_interval',
        value: '30s',
        description: 'Set health_check_interval to 30s'
      });
    }
  }
  
  // Check retry_policy
  if (!coordination.retry_policy) {
    result.warnings.push('Missing retry_policy in coordination, defaults will be used');
    
    // Add fix for missing retry_policy
    result.fixes.push({
      path: 'coordination.retry_policy',
      value: {
        max_retries: 3,
        backoff_factor: 2,
        initial_delay: '1s'
      },
      description: 'Add default retry_policy'
    });
  } else {
    const retry = coordination.retry_policy;
    
    // Check max_retries is a number
    if (retry.max_retries !== undefined) {
      const maxRetries = parseInt(retry.max_retries, 10);
      if (isNaN(maxRetries) || maxRetries < 0) {
        result.errors.push('max_retries in retry_policy must be a non-negative number');
        
        // Add fix for invalid max_retries
        result.fixes.push({
          path: 'coordination.retry_policy.max_retries',
          value: 3,
          description: 'Set max_retries to 3'
        });
      }
    }
    
    // Check backoff_factor is a number
    if (retry.backoff_factor !== undefined) {
      const backoffFactor = parseFloat(retry.backoff_factor);
      if (isNaN(backoffFactor) || backoffFactor <= 0) {
        result.errors.push('backoff_factor in retry_policy must be a positive number');
        
        // Add fix for invalid backoff_factor
        result.fixes.push({
          path: 'coordination.retry_policy.backoff_factor',
          value: 2,
          description: 'Set backoff_factor to 2'
        });
      }
    }
    
    // Check initial_delay format
    if (retry.initial_delay) {
      const timeUnitRegex = /^(\d+)([smhd]|ms)$/;
      if (!timeUnitRegex.test(retry.initial_delay)) {
        result.errors.push(`Invalid initial_delay format in retry_policy: ${retry.initial_delay}. Use format like 1s, 500ms, 1m`);
        
        // Add fix for invalid initial_delay
        result.fixes.push({
          path: 'coordination.retry_policy.initial_delay',
          value: '1s',
          description: 'Set initial_delay to 1s'
        });
      }
    }
  }
}

/**
 * Validate observability settings
 * @param {Object} manifest - The manifest to validate
 * @param {Object} result - Validation result object
 */
function validateObservability(manifest, result) {
  if (!manifest.observability) {
    result.warnings.push('Missing observability section, defaults will be used');
    
    // Add fix for missing observability
    result.fixes.push({
      path: 'observability',
      value: {
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
      },
      description: 'Add default observability settings'
    });
    
    return;
  }
  
  const observability = manifest.observability;
  
  // Check logging
  if (!observability.logging) {
    result.warnings.push('Missing logging configuration in observability');
    
    // Add fix for missing logging
    result.fixes.push({
      path: 'observability.logging',
      value: {
        format: 'json',
        destination: 'stdout',
        additional_outputs: []
      },
      description: 'Add default logging configuration'
    });
  } else {
    const logging = observability.logging;
    
    // Check format
    const validFormats = ['json', 'text', 'pretty'];
    if (logging.format && !validFormats.includes(logging.format)) {
      result.errors.push(`Invalid logging format: ${logging.format}`);
      
      // Add fix for invalid format
      result.fixes.push({
        path: 'observability.logging.format',
        value: 'json',
        description: 'Set logging format to json'
      });
    }
    
    // Check destination
    const validDestinations = ['stdout', 'stderr', 'file', 'syslog'];
    if (logging.destination && !validDestinations.includes(logging.destination)) {
      result.errors.push(`Invalid logging destination: ${logging.destination}`);
      
      // Add fix for invalid destination
      result.fixes.push({
        path: 'observability.logging.destination',
        value: 'stdout',
        description: 'Set logging destination to stdout'
      });
    }
    
    // Check additional_outputs is an array
    if (logging.additional_outputs && !Array.isArray(logging.additional_outputs)) {
      result.errors.push('additional_outputs in logging must be an array');
      
      // Add fix for invalid additional_outputs
      result.fixes.push({
        path: 'observability.logging.additional_outputs',
        value: [],
        description: 'Initialize additional_outputs as empty array'
      });
    }
    
    // Check each additional output
    if (Array.isArray(logging.additional_outputs)) {
      logging.additional_outputs.forEach((output, index) => {
        if (!output.type) {
          result.errors.push(`Logging output at index ${index} is missing required field: type`);
        }
        
        if (!output.url) {
          result.errors.push(`Logging output at index ${index} is missing required field: url`);
        }
      });
    }
  }
  
  // Check tracing
  if (!observability.tracing) {
    result.warnings.push('Missing tracing configuration in observability');
    
    // Add fix for missing tracing
    result.fixes.push({
      path: 'observability.tracing',
      value: {
        enabled: true,
        sampler_type: 'probabilistic',
        sampler_param: 0.1,
        exporter: 'jaeger'
      },
      description: 'Add default tracing configuration'
    });
  } else {
    const tracing = observability.tracing;
    
    // Check enabled is a boolean
    if (tracing.enabled !== undefined && typeof tracing.enabled !== 'boolean') {
      result.errors.push('enabled in tracing must be a boolean');
      
      // Add fix for invalid enabled
      result.fixes.push({
        path: 'observability.tracing.enabled',
        value: true,
        description: 'Set tracing enabled to true'
      });
    }
    
    // Only check other fields if tracing is enabled
    if (tracing.enabled) {
      // Check sampler_type
      const validSamplerTypes = ['probabilistic', 'rate_limiting', 'always_on', 'always_off'];
      if (tracing.sampler_type && !validSamplerTypes.includes(tracing.sampler_type)) {
        result.errors.push(`Invalid tracing sampler_type: ${tracing.sampler_type}`);
        
        // Add fix for invalid sampler_type
        result.fixes.push({
          path: 'observability.tracing.sampler_type',
          value: 'probabilistic',
          description: 'Set tracing sampler_type to probabilistic'
        });
      }
      
      // Check sampler_param
      if (tracing.sampler_param !== undefined) {
        const param = parseFloat(tracing.sampler_param);
        if (isNaN(param)) {
          result.errors.push('sampler_param in tracing must be a number');
          
          // Add fix for invalid sampler_param
          result.fixes.push({
            path: 'observability.tracing.sampler_param',
            value: 0.1,
            description: 'Set tracing sampler_param to 0.1'
          });
        } else if (tracing.sampler_type === 'probabilistic' && (param < 0 || param > 1)) {
          result.errors.push('sampler_param for probabilistic sampling must be between 0 and 1');
          
          // Add fix for invalid probabilistic sampler_param
          result.fixes.push({
            path: 'observability.tracing.sampler_param',
            value: 0.1,
            description: 'Set tracing sampler_param to 0.1'
          });
        }
      }
      
      // Check exporter
      const validExporters = ['jaeger', 'zipkin', 'otlp', 'console'];
      if (tracing.exporter && !validExporters.includes(tracing.exporter)) {
        result.errors.push(`Invalid tracing exporter: ${tracing.exporter}`);
        
        // Add fix for invalid exporter
        result.fixes.push({
          path: 'observability.tracing.exporter',
          value: 'jaeger',
          description: 'Set tracing exporter to jaeger'
        });
      }
    }
  }
  
  // Check alerting
  if (!observability.alerting) {
    result.warnings.push('Missing alerting configuration in observability');
    
    // Add fix for missing alerting
    result.fixes.push({
      path: 'observability.alerting',
      value: {
        channels: []
      },
      description: 'Add default alerting configuration'
    });
  } else {
    const alerting = observability.alerting;
    
    // Check channels is an array
    if (!Array.isArray(alerting.channels)) {
      result.errors.push('channels in alerting must be an array');
      
      // Add fix for invalid channels
      result.fixes.push({
        path: 'observability.alerting.channels',
        value: [],
        description: 'Initialize alerting channels as empty array'
      });
      
      return;
    }
    
    // Check each channel
    alerting.channels.forEach((channel, index) => {
      if (!channel.name) {
        result.errors.push(`Alert channel at index ${index} is missing required field: name`);
      }
      
      // Check that at least webhook or recipients is present
      if (!channel.webhook && !channel.recipients) {
        result.warnings.push(`Alert channel "${channel.name}" has neither webhook nor recipients`);
      }
    });
  }
}
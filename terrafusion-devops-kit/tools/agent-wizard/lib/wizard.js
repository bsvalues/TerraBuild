/**
 * Agent Wizard - Interactive CLI for configuring agents
 */

import enquirer from 'enquirer';
import chalk from 'chalk';
import ora from 'ora';
import { table } from 'table';
import { validateManifest } from './validator.js';

/**
 * Main wizard function for configuring agents
 * @param {Object} manifest - Current agent manifest
 * @param {string} environment - Target environment
 * @returns {Object} Updated manifest
 */
export async function agentWizard(manifest, environment) {
  console.log(chalk.cyan('\n📋 TerraFusion Agent Configuration Wizard'));
  console.log(chalk.dim(`Configuring agents for ${chalk.bold(environment)} environment\n`));

  // Create a working copy of the manifest
  const updatedManifest = JSON.parse(JSON.stringify(manifest));
  
  // Main wizard loop
  let exit = false;
  while (!exit) {
    const action = await selectAction();
    
    switch (action) {
      case 'add':
        await addAgent(updatedManifest);
        break;
      case 'edit':
        await editAgent(updatedManifest);
        break;
      case 'remove':
        await removeAgent(updatedManifest);
        break;
      case 'defaults':
        await editDefaultSettings(updatedManifest);
        break;
      case 'coordination':
        await editCoordinationSettings(updatedManifest);
        break;
      case 'observability':
        await editObservabilitySettings(updatedManifest);
        break;
      case 'validate':
        await validateManifestInteractive(updatedManifest);
        break;
      case 'exit':
        exit = true;
        break;
    }
    
    // Only validate when not exiting and not already validating
    if (!exit && action !== 'validate') {
      // Quick validation after each action
      const validationResult = validateManifest(updatedManifest);
      if (!validationResult.valid) {
        console.log(chalk.yellow('\n⚠️ Warning: Current manifest has validation issues'));
        console.log(chalk.yellow('Run validation to see details or fix before saving.'));
      }
    }
  }
  
  // Final confirmation before returning
  const { confirm } = await enquirer.prompt({
    type: 'confirm',
    name: 'confirm',
    message: 'Save changes to the manifest?',
    initial: true
  });
  
  if (!confirm) {
    throw new Error('Manifest changes discarded');
  }
  
  // Set environment in the manifest
  updatedManifest.environment = environment;
  
  return updatedManifest;
}

/**
 * Prompt for selecting an action
 * @returns {string} Selected action
 */
async function selectAction() {
  const { action } = await enquirer.prompt({
    type: 'select',
    name: 'action',
    message: 'What would you like to do?',
    choices: [
      { name: 'add', message: 'Add a new agent' },
      { name: 'edit', message: 'Edit an existing agent' },
      { name: 'remove', message: 'Remove an agent' },
      { name: 'defaults', message: 'Edit default settings' },
      { name: 'coordination', message: 'Edit coordination settings' },
      { name: 'observability', message: 'Edit observability settings' },
      { name: 'validate', message: 'Validate the manifest' },
      { name: 'exit', message: 'Save and exit' }
    ]
  });
  
  return action;
}

/**
 * Add a new agent to the manifest
 * @param {Object} manifest - Agent manifest
 */
async function addAgent(manifest) {
  console.log(chalk.cyan('\n➕ Add a new agent'));
  
  // Collect basic agent information
  const { name } = await enquirer.prompt({
    type: 'input',
    name: 'name',
    message: 'Agent name (e.g., factor-tuner):',
    validate: value => {
      if (!value) return 'Name is required';
      if (manifest.agents.some(a => a.name === value)) {
        return 'An agent with this name already exists';
      }
      return true;
    }
  });
  
  const { version } = await enquirer.prompt({
    type: 'input',
    name: 'version',
    message: 'Agent version:',
    initial: '1.0.0',
    validate: value => value ? true : 'Version is required'
  });
  
  const { description } = await enquirer.prompt({
    type: 'input',
    name: 'description',
    message: 'Agent description (optional):',
  });
  
  const { mode } = await enquirer.prompt({
    type: 'select',
    name: 'mode',
    message: 'Agent execution mode:',
    choices: [
      { name: 'autonomous', message: 'Autonomous - Runs on a schedule' },
      { name: 'suggestive', message: 'Suggestive - Triggered by events' },
      { name: 'watchdog', message: 'Watchdog - Monitors system health' },
      { name: 'collaborative', message: 'Collaborative - Works with other agents' }
    ]
  });
  
  // Collect mode-specific settings
  let modeSpecificSettings = {};
  
  if (mode === 'autonomous') {
    const { schedule } = await enquirer.prompt({
      type: 'input',
      name: 'schedule',
      message: 'Cron schedule (e.g., */30 * * * * for every 30 minutes):',
      initial: '0 * * * *', // Default: every hour
      validate: value => value ? true : 'Schedule is required for autonomous mode'
    });
    modeSpecificSettings.schedule = schedule;
  }
  
  if (mode === 'suggestive') {
    const { trigger } = await enquirer.prompt({
      type: 'input',
      name: 'trigger',
      message: 'Trigger event:',
      initial: 'data_update',
      validate: value => value ? true : 'Trigger is required for suggestive mode'
    });
    modeSpecificSettings.trigger_on = trigger;
  }
  
  if (mode === 'watchdog') {
    const { threshold } = await enquirer.prompt({
      type: 'input',
      name: 'threshold',
      message: 'Alert threshold:',
      initial: '0.8',
      validate: value => value ? true : 'Threshold is required for watchdog mode'
    });
    modeSpecificSettings.alert_threshold = threshold;
  }
  
  // Additional settings
  const { memory } = await enquirer.prompt({
    type: 'select',
    name: 'memory',
    message: 'Memory persistence:',
    choices: ['persistent', 'ephemeral', 'none'],
    initial: manifest.default_settings?.memory || 'persistent'
  });
  
  const { sensitivity } = await enquirer.prompt({
    type: 'select',
    name: 'sensitivity',
    message: 'Sensitivity level:',
    choices: ['low', 'medium', 'high'],
    initial: manifest.default_settings?.sensitivity || 'medium'
  });
  
  const { feedback } = await enquirer.prompt({
    type: 'confirm',
    name: 'feedback',
    message: 'Enable feedback loop?',
    initial: manifest.default_settings?.feedback_loop || true
  });
  
  // Create the new agent object
  const newAgent = {
    name,
    version,
    description,
    mode,
    ...modeSpecificSettings,
    memory,
    sensitivity,
    feedback_loop: feedback
  };
  
  // Add additional settings
  const { additionalSettings } = await enquirer.prompt({
    type: 'confirm',
    name: 'additionalSettings',
    message: 'Add custom settings?',
    initial: false
  });
  
  if (additionalSettings) {
    newAgent.settings = await collectCustomSettings({});
  }
  
  // Add the new agent to the manifest
  manifest.agents.push(newAgent);
  
  console.log(chalk.green(`\n✅ Agent "${name}" added successfully!`));
}

/**
 * Edit an existing agent
 * @param {Object} manifest - Agent manifest
 */
async function editAgent(manifest) {
  if (!manifest.agents || manifest.agents.length === 0) {
    console.log(chalk.yellow('\n⚠️ No agents found in manifest'));
    return;
  }
  
  console.log(chalk.cyan('\n✏️ Edit an existing agent'));
  
  // Select agent to edit
  const { agentName } = await enquirer.prompt({
    type: 'select',
    name: 'agentName',
    message: 'Select an agent to edit:',
    choices: manifest.agents.map(agent => ({
      name: agent.name,
      message: `${agent.name} (${agent.mode}, v${agent.version})`
    }))
  });
  
  // Find the agent
  const agentIndex = manifest.agents.findIndex(a => a.name === agentName);
  const agent = manifest.agents[agentIndex];
  
  // Show current agent details
  console.log(chalk.dim('\nCurrent agent configuration:'));
  const agentDetails = Object.entries(agent).map(([key, value]) => {
    if (typeof value === 'object') {
      return [key, JSON.stringify(value)];
    }
    return [key, value];
  });
  
  console.log(table(agentDetails));
  
  // Select property to edit
  const editableProperties = Object.keys(agent).filter(k => k !== 'name');
  
  const { propertyToEdit } = await enquirer.prompt({
    type: 'select',
    name: 'propertyToEdit',
    message: 'Select a property to edit:',
    choices: [
      ...editableProperties,
      'settings',
      'back'
    ]
  });
  
  if (propertyToEdit === 'back') {
    return;
  }
  
  // Edit the selected property
  if (propertyToEdit === 'settings') {
    agent.settings = await collectCustomSettings(agent.settings || {});
  } else if (propertyToEdit === 'mode') {
    // Handle mode changes specially
    const { newMode } = await enquirer.prompt({
      type: 'select',
      name: 'newMode',
      message: 'Select a new mode:',
      choices: [
        { name: 'autonomous', message: 'Autonomous - Runs on a schedule' },
        { name: 'suggestive', message: 'Suggestive - Triggered by events' },
        { name: 'watchdog', message: 'Watchdog - Monitors system health' },
        { name: 'collaborative', message: 'Collaborative - Works with other agents' }
      ],
      initial: agent.mode
    });
    
    agent.mode = newMode;
    
    // Add or remove mode-specific properties
    if (newMode === 'autonomous' && !agent.schedule) {
      const { schedule } = await enquirer.prompt({
        type: 'input',
        name: 'schedule',
        message: 'Cron schedule:',
        initial: '0 * * * *',
        validate: value => value ? true : 'Schedule is required for autonomous mode'
      });
      agent.schedule = schedule;
    }
    
    if (newMode === 'suggestive' && !agent.trigger_on) {
      const { trigger } = await enquirer.prompt({
        type: 'input',
        name: 'trigger',
        message: 'Trigger event:',
        initial: 'data_update',
        validate: value => value ? true : 'Trigger is required for suggestive mode'
      });
      agent.trigger_on = trigger;
    }
    
    if (newMode === 'watchdog' && !agent.alert_threshold) {
      const { threshold } = await enquirer.prompt({
        type: 'input',
        name: 'threshold',
        message: 'Alert threshold:',
        initial: '0.8',
        validate: value => value ? true : 'Threshold is required for watchdog mode'
      });
      agent.alert_threshold = threshold;
    }
    
    // Remove irrelevant properties
    if (newMode !== 'autonomous') delete agent.schedule;
    if (newMode !== 'suggestive') delete agent.trigger_on;
    if (newMode !== 'watchdog') delete agent.alert_threshold;
  } else {
    // Simple string/boolean editing
    const currentValue = agent[propertyToEdit];
    const promptType = typeof currentValue === 'boolean' ? 'confirm' : 'input';
    
    const { newValue } = await enquirer.prompt({
      type: promptType,
      name: 'newValue',
      message: `Enter new value for ${propertyToEdit}:`,
      initial: currentValue
    });
    
    agent[propertyToEdit] = newValue;
  }
  
  // Update the agent in the manifest
  manifest.agents[agentIndex] = agent;
  
  console.log(chalk.green(`\n✅ Agent "${agentName}" updated successfully!`));
}

/**
 * Remove an agent from the manifest
 * @param {Object} manifest - Agent manifest
 */
async function removeAgent(manifest) {
  if (!manifest.agents || manifest.agents.length === 0) {
    console.log(chalk.yellow('\n⚠️ No agents found in manifest'));
    return;
  }
  
  console.log(chalk.cyan('\n🗑️ Remove an agent'));
  
  // Select agent to remove
  const { agentName } = await enquirer.prompt({
    type: 'select',
    name: 'agentName',
    message: 'Select an agent to remove:',
    choices: manifest.agents.map(agent => ({
      name: agent.name,
      message: `${agent.name} (${agent.mode}, v${agent.version})`
    }))
  });
  
  // Confirm removal
  const { confirm } = await enquirer.prompt({
    type: 'confirm',
    name: 'confirm',
    message: `Are you sure you want to remove agent "${agentName}"?`,
    initial: false
  });
  
  if (!confirm) {
    console.log(chalk.dim('Agent removal cancelled.'));
    return;
  }
  
  // Remove the agent
  const initialLength = manifest.agents.length;
  manifest.agents = manifest.agents.filter(a => a.name !== agentName);
  
  if (manifest.agents.length < initialLength) {
    console.log(chalk.green(`\n✅ Agent "${agentName}" removed successfully!`));
  } else {
    console.log(chalk.red(`\n❌ Failed to remove agent "${agentName}"`));
  }
}

/**
 * Edit default settings
 * @param {Object} manifest - Agent manifest
 */
async function editDefaultSettings(manifest) {
  console.log(chalk.cyan('\n⚙️ Edit Default Settings'));
  
  // Ensure default_settings exists
  if (!manifest.default_settings) {
    manifest.default_settings = {
      memory: 'persistent',
      feedback_loop: true,
      log_level: 'info',
      metrics_enabled: true,
      sensitivity: 'medium'
    };
  }
  
  // Show current settings
  console.log(chalk.dim('\nCurrent default settings:'));
  const settingsTable = Object.entries(manifest.default_settings).map(([key, value]) => [key, value]);
  console.log(table(settingsTable));
  
  // Edit settings
  manifest.default_settings = await collectDefaultSettings(manifest.default_settings);
  
  console.log(chalk.green('\n✅ Default settings updated successfully!'));
}

/**
 * Edit coordination settings
 * @param {Object} manifest - Agent manifest
 */
async function editCoordinationSettings(manifest) {
  console.log(chalk.cyan('\n🔄 Edit Coordination Settings'));
  
  // Ensure coordination exists
  if (!manifest.coordination) {
    manifest.coordination = {
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
    };
  }
  
  // Show current settings
  console.log(chalk.dim('\nCurrent coordination settings:'));
  const coordSettings = Object.entries(manifest.coordination).map(([key, value]) => {
    if (typeof value === 'object') {
      return [key, JSON.stringify(value)];
    }
    return [key, value];
  });
  
  console.log(table(coordSettings));
  
  // Select property to edit
  const editableProperties = [
    'conflict_resolution',
    'agent_priorities',
    'communication_allowed',
    'shared_memory_enabled',
    'orchestrator', 
    'max_concurrent_agents',
    'health_check_interval',
    'retry_policy',
    'back'
  ];
  
  const { propertyToEdit } = await enquirer.prompt({
    type: 'select',
    name: 'propertyToEdit',
    message: 'Select a property to edit:',
    choices: editableProperties
  });
  
  if (propertyToEdit === 'back') {
    return;
  }
  
  // Edit the selected property
  if (propertyToEdit === 'retry_policy') {
    // Edit retry policy object
    const retry = manifest.coordination.retry_policy;
    
    const { maxRetries } = await enquirer.prompt({
      type: 'input',
      name: 'maxRetries',
      message: 'Maximum retries:',
      initial: retry.max_retries,
      validate: value => !isNaN(value) ? true : 'Must be a number'
    });
    
    const { backoffFactor } = await enquirer.prompt({
      type: 'input',
      name: 'backoffFactor',
      message: 'Backoff factor:',
      initial: retry.backoff_factor,
      validate: value => !isNaN(value) ? true : 'Must be a number'
    });
    
    const { initialDelay } = await enquirer.prompt({
      type: 'input',
      name: 'initialDelay',
      message: 'Initial delay (e.g., 1s, 500ms):',
      initial: retry.initial_delay
    });
    
    manifest.coordination.retry_policy = {
      max_retries: parseInt(maxRetries, 10),
      backoff_factor: parseFloat(backoffFactor),
      initial_delay: initialDelay
    };
  } else if (propertyToEdit === 'agent_priorities') {
    // Edit agent priorities array
    const agentNames = manifest.agents.map(a => a.name);
    
    const { priorities } = await enquirer.prompt({
      type: 'sort',
      name: 'priorities',
      message: 'Sort agents by priority (highest first):',
      choices: agentNames
    });
    
    manifest.coordination.agent_priorities = priorities;
  } else if (typeof manifest.coordination[propertyToEdit] === 'boolean') {
    // Toggle boolean values
    const { value } = await enquirer.prompt({
      type: 'confirm',
      name: 'value',
      message: `Enable ${propertyToEdit}?`,
      initial: manifest.coordination[propertyToEdit]
    });
    
    manifest.coordination[propertyToEdit] = value;
  } else {
    // Edit simple values
    const { value } = await enquirer.prompt({
      type: 'input',
      name: 'value',
      message: `Enter new value for ${propertyToEdit}:`,
      initial: manifest.coordination[propertyToEdit]
    });
    
    manifest.coordination[propertyToEdit] = value;
  }
  
  console.log(chalk.green('\n✅ Coordination settings updated successfully!'));
}

/**
 * Edit observability settings
 * @param {Object} manifest - Agent manifest
 */
async function editObservabilitySettings(manifest) {
  console.log(chalk.cyan('\n📊 Edit Observability Settings'));
  
  // Ensure observability exists
  if (!manifest.observability) {
    manifest.observability = {
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
    };
  }
  
  // Show current settings
  console.log(chalk.dim('\nCurrent observability settings:'));
  const obsSettings = [
    ['metrics_endpoint', manifest.observability.metrics_endpoint],
    ['logging.format', manifest.observability.logging.format],
    ['logging.destination', manifest.observability.logging.destination],
    ['tracing.enabled', manifest.observability.tracing.enabled],
    ['tracing.sampler_type', manifest.observability.tracing.sampler_type],
    ['tracing.sampler_param', manifest.observability.tracing.sampler_param],
    ['tracing.exporter', manifest.observability.tracing.exporter],
    ['alerting.channels', manifest.observability.alerting.channels.length + ' channels']
  ];
  
  console.log(table(obsSettings));
  
  // Select category to edit
  const { category } = await enquirer.prompt({
    type: 'select',
    name: 'category',
    message: 'Select a category to edit:',
    choices: ['metrics', 'logging', 'tracing', 'alerting', 'back']
  });
  
  if (category === 'back') {
    return;
  }
  
  // Edit the selected category
  if (category === 'metrics') {
    const { endpoint } = await enquirer.prompt({
      type: 'input',
      name: 'endpoint',
      message: 'Metrics endpoint:',
      initial: manifest.observability.metrics_endpoint
    });
    
    manifest.observability.metrics_endpoint = endpoint;
  } else if (category === 'logging') {
    const { format } = await enquirer.prompt({
      type: 'select',
      name: 'format',
      message: 'Log format:',
      choices: ['json', 'text', 'pretty'],
      initial: manifest.observability.logging.format
    });
    
    const { destination } = await enquirer.prompt({
      type: 'select',
      name: 'destination',
      message: 'Log destination:',
      choices: ['stdout', 'file', 'syslog'],
      initial: manifest.observability.logging.destination
    });
    
    manifest.observability.logging.format = format;
    manifest.observability.logging.destination = destination;
    
    // Handle additional outputs
    const { additionalOutputs } = await enquirer.prompt({
      type: 'confirm',
      name: 'additionalOutputs',
      message: 'Configure additional log outputs?',
      initial: false
    });
    
    if (additionalOutputs) {
      manifest.observability.logging.additional_outputs = await configureLogOutputs(
        manifest.observability.logging.additional_outputs || []
      );
    }
  } else if (category === 'tracing') {
    const { enabled } = await enquirer.prompt({
      type: 'confirm',
      name: 'enabled',
      message: 'Enable tracing?',
      initial: manifest.observability.tracing.enabled
    });
    
    manifest.observability.tracing.enabled = enabled;
    
    if (enabled) {
      const { samplerType } = await enquirer.prompt({
        type: 'select',
        name: 'samplerType',
        message: 'Sampler type:',
        choices: ['probabilistic', 'rate_limiting', 'always_on', 'always_off'],
        initial: manifest.observability.tracing.sampler_type
      });
      
      let samplerParam = manifest.observability.tracing.sampler_param;
      
      if (samplerType === 'probabilistic') {
        const { param } = await enquirer.prompt({
          type: 'input',
          name: 'param',
          message: 'Sampler parameter (0.0-1.0):',
          initial: samplerParam,
          validate: value => (!isNaN(value) && value >= 0 && value <= 1) ? true : 'Must be between 0 and 1'
        });
        samplerParam = parseFloat(param);
      } else if (samplerType === 'rate_limiting') {
        const { param } = await enquirer.prompt({
          type: 'input',
          name: 'param',
          message: 'Traces per second:',
          initial: samplerParam,
          validate: value => !isNaN(value) ? true : 'Must be a number'
        });
        samplerParam = parseFloat(param);
      }
      
      const { exporter } = await enquirer.prompt({
        type: 'select',
        name: 'exporter',
        message: 'Tracing exporter:',
        choices: ['jaeger', 'zipkin', 'otlp', 'console'],
        initial: manifest.observability.tracing.exporter
      });
      
      manifest.observability.tracing.sampler_type = samplerType;
      manifest.observability.tracing.sampler_param = samplerParam;
      manifest.observability.tracing.exporter = exporter;
    }
  } else if (category === 'alerting') {
    // Edit alerting channels
    manifest.observability.alerting.channels = await configureAlertChannels(
      manifest.observability.alerting.channels || []
    );
  }
  
  console.log(chalk.green('\n✅ Observability settings updated successfully!'));
}

/**
 * Collect agent settings interactively
 * @param {Object} existingSettings - Existing settings
 * @returns {Object} Updated settings
 */
async function collectCustomSettings(existingSettings) {
  const settings = { ...existingSettings };
  let editing = true;
  
  console.log(chalk.cyan('\n⚙️ Custom Agent Settings'));
  
  while (editing) {
    // Show current settings
    console.log(chalk.dim('\nCurrent settings:'));
    
    if (Object.keys(settings).length === 0) {
      console.log(chalk.dim('No custom settings defined'));
    } else {
      const settingsTable = Object.entries(settings).map(([key, value]) => [key, value]);
      console.log(table(settingsTable));
    }
    
    // Select action
    const { action } = await enquirer.prompt({
      type: 'select',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { name: 'add', message: 'Add a setting' },
        { name: 'edit', message: 'Edit a setting' },
        { name: 'remove', message: 'Remove a setting' },
        { name: 'done', message: 'Done editing settings' }
      ]
    });
    
    if (action === 'done') {
      editing = false;
    } else if (action === 'add') {
      // Add a new setting
      const { key } = await enquirer.prompt({
        type: 'input',
        name: 'key',
        message: 'Setting key:',
        validate: value => value ? true : 'Key is required'
      });
      
      const { value } = await enquirer.prompt({
        type: 'input',
        name: 'value',
        message: `Value for ${key}:`,
      });
      
      settings[key] = value;
    } else if (action === 'edit') {
      // Edit an existing setting
      if (Object.keys(settings).length === 0) {
        console.log(chalk.yellow('No settings to edit'));
        continue;
      }
      
      const { key } = await enquirer.prompt({
        type: 'select',
        name: 'key',
        message: 'Select a setting to edit:',
        choices: Object.keys(settings)
      });
      
      const { value } = await enquirer.prompt({
        type: 'input',
        name: 'value',
        message: `New value for ${key}:`,
        initial: settings[key]
      });
      
      settings[key] = value;
    } else if (action === 'remove') {
      // Remove a setting
      if (Object.keys(settings).length === 0) {
        console.log(chalk.yellow('No settings to remove'));
        continue;
      }
      
      const { key } = await enquirer.prompt({
        type: 'select',
        name: 'key',
        message: 'Select a setting to remove:',
        choices: Object.keys(settings)
      });
      
      delete settings[key];
    }
  }
  
  return settings;
}

/**
 * Collect default settings interactively
 * @param {Object} existingSettings - Existing settings
 * @returns {Object} Updated settings
 */
async function collectDefaultSettings(existingSettings) {
  const settings = { ...existingSettings };
  
  // Memory type
  const { memory } = await enquirer.prompt({
    type: 'select',
    name: 'memory',
    message: 'Default memory type:',
    choices: ['persistent', 'ephemeral', 'none'],
    initial: settings.memory || 'persistent'
  });
  
  // Feedback loop
  const { feedbackLoop } = await enquirer.prompt({
    type: 'confirm',
    name: 'feedbackLoop',
    message: 'Enable feedback loop by default?',
    initial: settings.feedback_loop !== undefined ? settings.feedback_loop : true
  });
  
  // Log level
  const { logLevel } = await enquirer.prompt({
    type: 'select',
    name: 'logLevel',
    message: 'Default log level:',
    choices: ['debug', 'info', 'warn', 'error'],
    initial: settings.log_level || 'info'
  });
  
  // Metrics
  const { metricsEnabled } = await enquirer.prompt({
    type: 'confirm',
    name: 'metricsEnabled',
    message: 'Enable metrics by default?',
    initial: settings.metrics_enabled !== undefined ? settings.metrics_enabled : true
  });
  
  // Sensitivity
  const { sensitivity } = await enquirer.prompt({
    type: 'select',
    name: 'sensitivity',
    message: 'Default sensitivity:',
    choices: ['low', 'medium', 'high'],
    initial: settings.sensitivity || 'medium'
  });
  
  return {
    memory,
    feedback_loop: feedbackLoop,
    log_level: logLevel,
    metrics_enabled: metricsEnabled,
    sensitivity
  };
}

/**
 * Configure additional log outputs
 * @param {Array} existingOutputs - Existing outputs
 * @returns {Array} Updated outputs
 */
async function configureLogOutputs(existingOutputs) {
  const outputs = [...existingOutputs];
  let editing = true;
  
  console.log(chalk.cyan('\n📝 Configure Log Outputs'));
  
  while (editing) {
    // Show current outputs
    console.log(chalk.dim('\nCurrent log outputs:'));
    
    if (outputs.length === 0) {
      console.log(chalk.dim('No additional log outputs configured'));
    } else {
      const outputsTable = outputs.map((output, index) => [
        index + 1,
        output.type,
        output.url || 'N/A'
      ]);
      outputsTable.unshift(['#', 'Type', 'URL']);
      console.log(table(outputsTable));
    }
    
    // Select action
    const { action } = await enquirer.prompt({
      type: 'select',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { name: 'add', message: 'Add a log output' },
        { name: 'remove', message: 'Remove a log output' },
        { name: 'done', message: 'Done editing log outputs' }
      ]
    });
    
    if (action === 'done') {
      editing = false;
    } else if (action === 'add') {
      // Add a new output
      const { type } = await enquirer.prompt({
        type: 'select',
        name: 'type',
        message: 'Output type:',
        choices: ['file', 'http', 'elastic', 'loki', 'syslog']
      });
      
      const { url } = await enquirer.prompt({
        type: 'input',
        name: 'url',
        message: 'Output URL or path:',
        validate: value => value ? true : 'URL or path is required'
      });
      
      outputs.push({ type, url });
    } else if (action === 'remove') {
      // Remove an output
      if (outputs.length === 0) {
        console.log(chalk.yellow('No outputs to remove'));
        continue;
      }
      
      const { index } = await enquirer.prompt({
        type: 'select',
        name: 'index',
        message: 'Select an output to remove:',
        choices: outputs.map((output, i) => ({
          name: i.toString(),
          message: `${i + 1}: ${output.type} - ${output.url}`
        }))
      });
      
      outputs.splice(parseInt(index, 10), 1);
    }
  }
  
  return outputs;
}

/**
 * Configure alert channels
 * @param {Array} existingChannels - Existing channels
 * @returns {Array} Updated channels
 */
async function configureAlertChannels(existingChannels) {
  const channels = [...existingChannels];
  let editing = true;
  
  console.log(chalk.cyan('\n🔔 Configure Alert Channels'));
  
  while (editing) {
    // Show current channels
    console.log(chalk.dim('\nCurrent alert channels:'));
    
    if (channels.length === 0) {
      console.log(chalk.dim('No alert channels configured'));
    } else {
      const channelsTable = channels.map((channel, index) => [
        index + 1,
        channel.name,
        channel.webhook || 'N/A',
        channel.recipients || 'N/A'
      ]);
      channelsTable.unshift(['#', 'Name', 'Webhook', 'Recipients']);
      console.log(table(channelsTable));
    }
    
    // Select action
    const { action } = await enquirer.prompt({
      type: 'select',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { name: 'add', message: 'Add an alert channel' },
        { name: 'edit', message: 'Edit an alert channel' },
        { name: 'remove', message: 'Remove an alert channel' },
        { name: 'done', message: 'Done editing alert channels' }
      ]
    });
    
    if (action === 'done') {
      editing = false;
    } else if (action === 'add') {
      // Add a new channel
      const { name } = await enquirer.prompt({
        type: 'input',
        name: 'name',
        message: 'Channel name:',
        validate: value => value ? true : 'Name is required'
      });
      
      const { type } = await enquirer.prompt({
        type: 'select',
        name: 'type',
        message: 'Channel type:',
        choices: ['slack', 'email', 'webhook', 'pagerduty']
      });
      
      const newChannel = { name };
      
      if (type === 'slack' || type === 'webhook' || type === 'pagerduty') {
        const { webhook } = await enquirer.prompt({
          type: 'input',
          name: 'webhook',
          message: 'Webhook URL:',
          validate: value => value ? true : 'Webhook URL is required'
        });
        
        newChannel.webhook = webhook;
      }
      
      if (type === 'email') {
        const { recipients } = await enquirer.prompt({
          type: 'input',
          name: 'recipients',
          message: 'Email recipients (comma-separated):',
          validate: value => value ? true : 'At least one recipient is required'
        });
        
        newChannel.recipients = recipients;
      }
      
      channels.push(newChannel);
    } else if (action === 'edit') {
      // Edit a channel
      if (channels.length === 0) {
        console.log(chalk.yellow('No channels to edit'));
        continue;
      }
      
      const { index } = await enquirer.prompt({
        type: 'select',
        name: 'index',
        message: 'Select a channel to edit:',
        choices: channels.map((channel, i) => ({
          name: i.toString(),
          message: `${i + 1}: ${channel.name}`
        }))
      });
      
      const channelIndex = parseInt(index, 10);
      const channel = channels[channelIndex];
      
      // Edit name
      const { name } = await enquirer.prompt({
        type: 'input',
        name: 'name',
        message: 'Channel name:',
        initial: channel.name,
        validate: value => value ? true : 'Name is required'
      });
      
      // Edit webhook
      let webhook = channel.webhook;
      const { editWebhook } = await enquirer.prompt({
        type: 'confirm',
        name: 'editWebhook',
        message: 'Edit webhook URL?',
        initial: !!webhook
      });
      
      if (editWebhook) {
        const { value } = await enquirer.prompt({
          type: 'input',
          name: 'value',
          message: 'Webhook URL:',
          initial: webhook,
          validate: value => value ? true : 'Webhook URL is required'
        });
        
        webhook = value;
      }
      
      // Edit recipients
      let recipients = channel.recipients;
      const { editRecipients } = await enquirer.prompt({
        type: 'confirm',
        name: 'editRecipients',
        message: 'Edit email recipients?',
        initial: !!recipients
      });
      
      if (editRecipients) {
        const { value } = await enquirer.prompt({
          type: 'input',
          name: 'value',
          message: 'Email recipients (comma-separated):',
          initial: recipients,
          validate: value => value ? true : 'At least one recipient is required'
        });
        
        recipients = value;
      }
      
      // Update channel
      channels[channelIndex] = {
        name,
        ...(webhook ? { webhook } : {}),
        ...(recipients ? { recipients } : {})
      };
    } else if (action === 'remove') {
      // Remove a channel
      if (channels.length === 0) {
        console.log(chalk.yellow('No channels to remove'));
        continue;
      }
      
      const { index } = await enquirer.prompt({
        type: 'select',
        name: 'index',
        message: 'Select a channel to remove:',
        choices: channels.map((channel, i) => ({
          name: i.toString(),
          message: `${i + 1}: ${channel.name}`
        }))
      });
      
      channels.splice(parseInt(index, 10), 1);
    }
  }
  
  return channels;
}

/**
 * Validate manifest and show results interactively
 * @param {Object} manifest - Agent manifest
 */
async function validateManifestInteractive(manifest) {
  console.log(chalk.cyan('\n🔍 Validating Agent Manifest'));
  
  const spinner = ora('Validating manifest...').start();
  
  // Simulate a slight delay for UX
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const validationResult = validateManifest(manifest);
  
  if (validationResult.valid) {
    spinner.succeed('Manifest is valid!');
    console.log(chalk.green(`\n✅ All validation checks passed`));
    console.log(chalk.dim(`Found ${manifest.agents.length} agents configured.`));
  } else {
    spinner.fail('Manifest validation failed');
    console.error(chalk.red('\n❌ Validation errors:'));
    
    validationResult.errors.forEach(error => {
      console.error(chalk.red(`  - ${error}`));
    });
    
    if (validationResult.warnings.length > 0) {
      console.warn(chalk.yellow('\n⚠️ Warnings:'));
      validationResult.warnings.forEach(warning => {
        console.warn(chalk.yellow(`  - ${warning}`));
      });
    }
    
    // Offer to fix common issues
    if (validationResult.autoFixable) {
      const { autoFix } = await enquirer.prompt({
        type: 'confirm',
        name: 'autoFix',
        message: 'Would you like to attempt to automatically fix these issues?',
        initial: true
      });
      
      if (autoFix) {
        const fixSpinner = ora('Applying fixes...').start();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Apply fixes to the manifest
        validationResult.fixes.forEach(fix => {
          // Use eval-like approach to apply the fix
          const parts = fix.path.split('.');
          let current = manifest;
          
          for (let i = 0; i < parts.length - 1; i++) {
            // Create objects if they don't exist
            if (!current[parts[i]]) {
              current[parts[i]] = {};
            }
            current = current[parts[i]];
          }
          
          // Apply the value
          current[parts[parts.length - 1]] = fix.value;
        });
        
        fixSpinner.succeed('Fixes applied');
        
        // Validate again to confirm fixes
        const revalidation = validateManifest(manifest);
        if (revalidation.valid) {
          console.log(chalk.green('\n✅ All issues fixed successfully!'));
        } else {
          console.log(chalk.yellow('\n⚠️ Some issues remain. Please fix them manually.'));
        }
      }
    }
  }
}
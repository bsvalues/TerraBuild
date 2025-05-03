/**
 * Agent Configuration Wizard
 * Interactive wizard for creating and configuring agent manifests
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { config } from '../lib/config';

// Agent template definitions
interface AgentTemplate {
  name: string;
  description: string;
  manifest: any;
}

// Example agent templates
const agentTemplates: AgentTemplate[] = [
  {
    name: 'basic',
    description: 'Basic agent with minimal configuration',
    manifest: {
      version: '1.0.0',
      name: 'basic-agent',
      description: 'Basic agent with minimal configuration',
      type: 'service',
      capabilities: ['basic-processing'],
      runtime: {
        memory: '256Mi',
        cpu: '0.1',
      },
      endpoints: {
        http: {
          port: 8080,
          path: '/api/v1',
        },
      },
    },
  },
  {
    name: 'data-processor',
    description: 'Specialized agent for data processing tasks',
    manifest: {
      version: '1.0.0',
      name: 'data-processor',
      description: 'Specialized agent for data processing tasks',
      type: 'processor',
      capabilities: ['data-processing', 'data-validation', 'data-transformation'],
      runtime: {
        memory: '512Mi',
        cpu: '0.5',
      },
      dependencies: [
        {
          name: 'database',
          type: 'postgresql',
          required: true,
        },
      ],
      endpoints: {
        http: {
          port: 8080,
          path: '/api/v1/process',
        },
        grpc: {
          port: 9090,
        },
      },
      scaling: {
        minReplicas: 1,
        maxReplicas: 5,
        targetCPUUtilization: 80,
      },
    },
  },
  {
    name: 'ai-inference',
    description: 'AI model inference agent with GPU support',
    manifest: {
      version: '1.0.0',
      name: 'ai-inference',
      description: 'AI model inference agent with GPU support',
      type: 'inference',
      capabilities: ['model-inference', 'prediction'],
      runtime: {
        memory: '2Gi',
        cpu: '1.0',
        gpu: '1',
      },
      model: {
        type: 'tensorflow',
        path: '/models/main',
        version: '2.0.0',
      },
      endpoints: {
        http: {
          port: 8080,
          path: '/api/v1/predict',
        },
      },
      scaling: {
        minReplicas: 1,
        maxReplicas: 3,
        targetGPUUtilization: 70,
      },
    },
  },
];

/**
 * Create an agent manifest using the interactive wizard
 * @param options Command options
 */
export async function createWizard(options: any): Promise<void> {
  console.log(chalk.cyan('\n🧙 TerraFusion Agent Configuration Wizard'));
  console.log(chalk.gray('Let\'s create or update an agent manifest\n'));

  // Start with a template or from scratch
  const { startWithTemplate } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'startWithTemplate',
      message: 'Would you like to start with a template?',
      default: true,
    },
  ]);

  let manifest: any = {};

  if (startWithTemplate) {
    // Present template options
    const templateChoices = agentTemplates.map(template => ({
      name: `${template.name} - ${template.description}`,
      value: template.name,
    }));

    const { templateName } = await inquirer.prompt([
      {
        type: 'list',
        name: 'templateName',
        message: 'Select a template:',
        choices: templateChoices,
      },
    ]);

    // Find the selected template
    const template = agentTemplates.find(t => t.name === templateName);
    if (template) {
      manifest = { ...template.manifest };
      console.log(chalk.green(`Using the ${template.name} template as a starting point.`));
    }
  } else {
    // Basic information for a new agent
    const baseInfo = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Agent name (lowercase, no spaces):',
        validate: (input) => {
          if (/^[a-z0-9-]+$/.test(input)) {
            return true;
          }
          return 'Agent name must be lowercase alphanumeric with hyphens only';
        },
      },
      {
        type: 'input',
        name: 'description',
        message: 'Description:',
      },
      {
        type: 'list',
        name: 'type',
        message: 'Agent type:',
        choices: [
          { name: 'Service - Long-running service agent', value: 'service' },
          { name: 'Processor - Data processing agent', value: 'processor' },
          { name: 'Inference - AI model inference agent', value: 'inference' },
          { name: 'Scheduler - Task scheduling agent', value: 'scheduler' },
          { name: 'Custom - Custom agent type', value: 'custom' },
        ],
      },
    ]);

    manifest = {
      version: '1.0.0',
      name: baseInfo.name,
      description: baseInfo.description,
      type: baseInfo.type,
      capabilities: [],
      runtime: {
        memory: '256Mi',
        cpu: '0.1',
      },
      endpoints: {
        http: {
          port: 8080,
          path: '/api/v1',
        },
      },
    };
  }

  // Configure capabilities
  const { capabilities } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'capabilities',
      message: 'Select agent capabilities:',
      choices: [
        { name: 'Basic Processing', value: 'basic-processing' },
        { name: 'Data Processing', value: 'data-processing' },
        { name: 'Data Validation', value: 'data-validation' },
        { name: 'Data Transformation', value: 'data-transformation' },
        { name: 'Model Training', value: 'model-training' },
        { name: 'Model Inference', value: 'model-inference' },
        { name: 'Prediction', value: 'prediction' },
        { name: 'Anomaly Detection', value: 'anomaly-detection' },
        { name: 'Task Scheduling', value: 'task-scheduling' },
        { name: 'Notification', value: 'notification' },
      ],
      default: manifest.capabilities || [],
    },
  ]);

  manifest.capabilities = capabilities;

  // Configure runtime resources
  const runtime = await inquirer.prompt([
    {
      type: 'input',
      name: 'memory',
      message: 'Memory request (e.g., 256Mi, 1Gi):',
      default: manifest.runtime?.memory || '256Mi',
    },
    {
      type: 'input',
      name: 'cpu',
      message: 'CPU request (e.g., 0.1, 0.5, 1.0):',
      default: manifest.runtime?.cpu || '0.1',
    },
    {
      type: 'confirm',
      name: 'needsGpu',
      message: 'Does this agent need GPU resources?',
      default: !!manifest.runtime?.gpu,
    },
  ]);

  manifest.runtime = {
    memory: runtime.memory,
    cpu: runtime.cpu,
  };

  if (runtime.needsGpu) {
    const { gpuCount } = await inquirer.prompt([
      {
        type: 'input',
        name: 'gpuCount',
        message: 'GPU count:',
        default: manifest.runtime?.gpu || '1',
      },
    ]);
    manifest.runtime.gpu = gpuCount;
  }

  // Configure scaling
  const { needsScaling } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'needsScaling',
      message: 'Configure auto-scaling?',
      default: !!manifest.scaling,
    },
  ]);

  if (needsScaling) {
    const scaling = await inquirer.prompt([
      {
        type: 'input',
        name: 'minReplicas',
        message: 'Minimum replicas:',
        default: manifest.scaling?.minReplicas || '1',
        validate: (input) => {
          const num = parseInt(input, 10);
          return !isNaN(num) && num >= 0 ? true : 'Must be a non-negative integer';
        },
      },
      {
        type: 'input',
        name: 'maxReplicas',
        message: 'Maximum replicas:',
        default: manifest.scaling?.maxReplicas || '5',
        validate: (input) => {
          const num = parseInt(input, 10);
          return !isNaN(num) && num > 0 ? true : 'Must be a positive integer';
        },
      },
      {
        type: 'input',
        name: 'targetCPUUtilization',
        message: 'Target CPU utilization percentage:',
        default: manifest.scaling?.targetCPUUtilization || '80',
        validate: (input) => {
          const num = parseInt(input, 10);
          return !isNaN(num) && num > 0 && num <= 100 ? true : 'Must be between 1 and 100';
        },
      },
    ]);

    manifest.scaling = {
      minReplicas: parseInt(scaling.minReplicas, 10),
      maxReplicas: parseInt(scaling.maxReplicas, 10),
      targetCPUUtilization: parseInt(scaling.targetCPUUtilization, 10),
    };
  }

  // Save the manifest
  const { saveManifest } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'saveManifest',
      message: 'Save the agent manifest?',
      default: true,
    },
  ]);

  if (saveManifest) {
    const { manifestPath } = await inquirer.prompt([
      {
        type: 'input',
        name: 'manifestPath',
        message: 'Path to save the manifest:',
        default: path.join(process.cwd(), `agent-${manifest.name}.yaml`),
      },
    ]);

    try {
      const manifestYaml = yaml.dump(manifest, { indent: 2 });
      fs.writeFileSync(manifestPath, manifestYaml, 'utf-8');
      console.log(chalk.green(`\n✅ Agent manifest saved to ${manifestPath}`));

      // Set as the current manifest path in config
      const { setAsDefault } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'setAsDefault',
          message: 'Set this as the default manifest path?',
          default: true,
        },
      ]);

      if (setAsDefault) {
        config.setManifestPath(manifestPath);
        console.log(chalk.green('Default manifest path updated'));
      }
    } catch (error) {
      console.error(chalk.red(`Error saving manifest: ${error}`));
    }
  } else {
    // Just display the manifest
    console.log(chalk.cyan('\nGenerated Agent Manifest:'));
    console.log(chalk.yellow(yaml.dump(manifest, { indent: 2 })));
  }

  console.log(chalk.cyan('\n🎉 Agent configuration complete!'));
  console.log(chalk.gray('Use "agentctl validate" to validate the manifest before deployment\n'));
}
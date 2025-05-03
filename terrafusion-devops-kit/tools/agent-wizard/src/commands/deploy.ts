/**
 * Agent Deployment Commands
 * Deploy agents to the target environment
 */

import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import ora from 'ora';
import { execSync } from 'child_process';
import { config } from '../lib/config';
import { validateManifest } from './validate';

/**
 * Get all agent manifests from a directory
 * @param directory Directory to search for agent manifests
 * @returns Array of agent manifest paths
 */
function findAgentManifests(directory: string): string[] {
  try {
    const files = fs.readdirSync(directory);
    return files
      .filter(file => file.endsWith('.yaml') || file.endsWith('.yml'))
      .filter(file => {
        try {
          const content = fs.readFileSync(path.join(directory, file), 'utf-8');
          const manifest = yaml.load(content);
          return manifest && manifest.name && (manifest.type || manifest.agent);
        } catch (error) {
          return false;
        }
      })
      .map(file => path.join(directory, file));
  } catch (error) {
    console.error(chalk.red(`Error finding agent manifests: ${error}`));
    return [];
  }
}

/**
 * Get agent information from a manifest file
 * @param manifestPath Path to the agent manifest
 * @returns Agent information or null if invalid
 */
function getAgentInfo(manifestPath: string): { name: string; type: string } | null {
  try {
    const content = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = yaml.load(content) as any;
    
    if (!manifest || !manifest.name) {
      return null;
    }
    
    return {
      name: manifest.name,
      type: manifest.type || manifest.agent || 'unknown',
    };
  } catch (error) {
    return null;
  }
}

/**
 * Apply Kubernetes manifests for an agent
 * @param manifestPath Path to the agent manifest
 * @param options Deployment options
 * @returns Promise resolving when deployment is complete
 */
async function applyKubernetesManifests(manifestPath: string, options: any): Promise<void> {
  try {
    // In a real implementation, this would generate Kubernetes manifests from the agent manifest
    // and deploy them using kubectl or a Kubernetes client library
    
    const kubeContext = config.getKubeContext();
    const agentInfo = getAgentInfo(manifestPath);
    
    if (!agentInfo) {
      throw new Error('Invalid agent manifest');
    }
    
    // For the prototype, we'll simulate deployment using a delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Example kubectl command that would be run in a real implementation
    const kubectlCommand = `kubectl apply -f ${manifestPath} --context=${kubeContext} --replicas=${options.replicas}`;
    
    // Log the command that would be executed
    console.log(chalk.gray(`\n Would execute: ${kubectlCommand}`));
    
    return;
  } catch (error) {
    throw new Error(`Failed to apply Kubernetes manifests: ${error}`);
  }
}

/**
 * Deploy a specific agent
 * @param agentName Name of the agent to deploy
 * @param options Deployment options
 */
export async function deployAgent(agentName: string, options: any): Promise<void> {
  console.log(chalk.cyan(`\n🚀 Deploying agent: ${agentName}`));
  
  const spinner = ora('Preparing deployment...').start();
  
  try {
    // Get the manifest path
    let manifestPath = '';
    
    // If the agent name is a valid path, use it directly
    if (fs.existsSync(agentName) && (agentName.endsWith('.yaml') || agentName.endsWith('.yml'))) {
      manifestPath = agentName;
    } else {
      // Otherwise, look for a manifest with the agent name
      const manifestDir = path.dirname(config.getManifestPath());
      const manifests = findAgentManifests(manifestDir);
      
      manifestPath = manifests.find(m => {
        const info = getAgentInfo(m);
        return info && info.name === agentName;
      }) || '';
      
      if (!manifestPath) {
        spinner.fail();
        console.error(chalk.red(`Error: Could not find manifest for agent "${agentName}"`));
        return;
      }
    }
    
    spinner.text = 'Validating manifest...';
    
    // Validate the manifest if requested
    if (options.validation !== false) {
      const validationOptions = { path: manifestPath, fix: options.fix || false };
      await validateManifest(validationOptions);
      
      // Check if validation failed and not forcing deployment
      if (process.exitCode === 1 && !options.force) {
        spinner.fail();
        console.error(chalk.red('\nDeployment aborted due to validation errors'));
        console.log(chalk.yellow('Use --force to deploy anyway, or --fix to attempt to fix issues\n'));
        return;
      }
    }
    
    spinner.text = 'Deploying agent...';
    
    // Deploy the agent
    await applyKubernetesManifests(manifestPath, options);
    
    spinner.succeed(chalk.green('Agent deployed successfully'));
    
    // Show deployment information
    const agentInfo = getAgentInfo(manifestPath);
    
    if (agentInfo) {
      console.log(chalk.cyan(`\n📋 Deployment Summary:`));
      console.log(chalk.gray(`  Agent: ${agentInfo.name}`));
      console.log(chalk.gray(`  Type: ${agentInfo.type}`));
      console.log(chalk.gray(`  Replicas: ${options.replicas}`));
      console.log(chalk.gray(`  Environment: ${config.getCurrentEnvironment()}`));
      
      if (config.getKubeContext()) {
        console.log(chalk.gray(`  Kubernetes Context: ${config.getKubeContext()}`));
      }
      
      console.log(chalk.gray(`  Manifest: ${manifestPath}`));
    }
    
    console.log(chalk.green('\n✅ Deployment complete\n'));
  } catch (error) {
    spinner.fail();
    console.error(chalk.red(`\nError deploying agent: ${error}\n`));
  }
}

/**
 * Deploy all agents from a directory
 * @param options Deployment options
 */
export async function deployAllAgents(options: any): Promise<void> {
  console.log(chalk.cyan('\n🚀 Deploying all agents'));
  
  try {
    // Get the manifest directory
    const manifestDir = path.dirname(config.getManifestPath());
    console.log(chalk.gray(`Searching for agent manifests in ${manifestDir}`));
    
    // Find all agent manifests
    const manifests = findAgentManifests(manifestDir);
    
    if (manifests.length === 0) {
      console.error(chalk.yellow(`\n⚠️ No agent manifests found in ${manifestDir}\n`));
      return;
    }
    
    console.log(chalk.gray(`Found ${manifests.length} agent manifests`));
    
    // Deploy each agent
    for (const manifestPath of manifests) {
      const agentInfo = getAgentInfo(manifestPath);
      
      if (agentInfo) {
        console.log(chalk.cyan(`\n📦 Deploying agent: ${agentInfo.name} (${agentInfo.type})`));
        
        const deployOptions = { ...options, path: manifestPath };
        await deployAgent(manifestPath, deployOptions);
      }
    }
    
    console.log(chalk.green(`\n✅ All ${manifests.length} agents deployed successfully\n`));
  } catch (error) {
    console.error(chalk.red(`\nError deploying agents: ${error}\n`));
  }
}
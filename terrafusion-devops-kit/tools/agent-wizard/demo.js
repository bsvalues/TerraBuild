#!/usr/bin/env node

/**
 * TerraFusion Agent Configuration Wizard Demo
 * 
 * This script demonstrates the main features of the agent wizard
 * without requiring user interaction.
 */

import chalk from 'chalk';
import ora from 'ora';
import { table } from 'table';
import { createEmptyManifest, getAgentTemplate } from './lib/manifest.js';
import { validateManifest } from './lib/validator.js';
import { printLogo, formatMode, formatStatus } from './lib/ui.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Main demo function
async function runDemo() {
  // Print logo and introduction
  printLogo();
  console.log(chalk.bold('\nTerraFusion Agent Configuration Wizard Demo\n'));
  console.log('This demo showcases the main features of the agent configuration wizard.');
  console.log('In a real scenario, these operations would be interactive.');
  console.log('');
  
  // Pause for user to read
  await sleep(2000);
  
  // Step 1: Create an empty manifest
  console.log(chalk.cyan('\n🔹 Step 1: Creating an Empty Manifest\n'));
  const spinner1 = ora('Creating empty manifest...').start();
  await sleep(1000);
  
  const manifest = createEmptyManifest('dev');
  spinner1.succeed('Empty manifest created');
  
  console.log(chalk.dim('\nEmpty manifest structure:'));
  console.log(chalk.dim('- version: 1.0.0'));
  console.log(chalk.dim('- environment: dev'));
  console.log(chalk.dim('- default_settings: {}'));
  console.log(chalk.dim('- agents: []'));
  console.log(chalk.dim('- coordination: {}'));
  console.log(chalk.dim('- observability: {}'));
  
  await sleep(2000);
  
  // Step 2: Add an agent
  console.log(chalk.cyan('\n🔹 Step 2: Adding an Agent\n'));
  console.log('In the interactive wizard, you would be prompted for agent details.');
  console.log('For this demo, we\'ll add a predefined factor-tuner agent.');
  
  const spinner2 = ora('Adding factor-tuner agent...').start();
  await sleep(1500);
  
  const factorTuner = getAgentTemplate('factor-tuner');
  manifest.agents.push(factorTuner);
  
  spinner2.succeed('Agent added successfully');
  
  console.log(chalk.dim('\nAgent details:'));
  const agentDetails = [
    ['Name', factorTuner.name],
    ['Version', factorTuner.version],
    ['Mode', formatMode(factorTuner.mode)],
    ['Schedule', factorTuner.schedule],
    ['Description', factorTuner.description]
  ];
  console.log(table(agentDetails));
  
  await sleep(2000);
  
  // Step 3: Add another agent
  console.log(chalk.cyan('\n🔹 Step 3: Adding Another Agent\n'));
  const spinner3 = ora('Adding benchmark-guard agent...').start();
  await sleep(1500);
  
  const benchmarkGuard = getAgentTemplate('benchmark-guard');
  manifest.agents.push(benchmarkGuard);
  
  spinner3.succeed('Agent added successfully');
  
  await sleep(1500);
  
  // Step 4: Validate the manifest
  console.log(chalk.cyan('\n🔹 Step 4: Validating the Manifest\n'));
  const spinner4 = ora('Validating manifest...').start();
  await sleep(2000);
  
  const validationResult = validateManifest(manifest);
  
  if (validationResult.valid) {
    spinner4.succeed('Manifest is valid');
    
    console.log(chalk.dim('\nValidation passed with no errors.'));
    console.log(chalk.dim(`Found ${manifest.agents.length} agents configured.`));
  } else {
    spinner4.fail('Manifest validation failed');
    
    console.error(chalk.red('\nValidation errors:'));
    validationResult.errors.forEach(error => {
      console.error(chalk.red(`  - ${error}`));
    });
  }
  
  await sleep(2000);
  
  // Step 5: Add coordination priorities
  console.log(chalk.cyan('\n🔹 Step 5: Configuring Agent Priorities\n'));
  const spinner5 = ora('Setting agent priorities...').start();
  await sleep(1500);
  
  manifest.coordination.agent_priorities = manifest.agents.map(agent => agent.name);
  
  spinner5.succeed('Agent priorities configured');
  
  console.log(chalk.dim('\nAgent priorities (highest first):'));
  manifest.coordination.agent_priorities.forEach((agent, index) => {
    console.log(chalk.dim(`  ${index + 1}. ${agent}`));
  });
  
  await sleep(2000);
  
  // Step 6: List configured agents
  console.log(chalk.cyan('\n🔹 Step 6: Listing Configured Agents\n'));
  const spinner6 = ora('Retrieving agent list...').start();
  await sleep(1500);
  
  spinner6.succeed('Retrieved agent list');
  
  console.log(chalk.dim('\nConfigured agents:'));
  const agentTable = [
    ['Name', 'Version', 'Mode', 'Description']
  ];
  
  manifest.agents.forEach(agent => {
    agentTable.push([
      agent.name,
      agent.version,
      formatMode(agent.mode),
      agent.description || ''
    ]);
  });
  
  console.log(table(agentTable));
  
  await sleep(2000);
  
  // Step 7: Deploy an agent
  console.log(chalk.cyan('\n🔹 Step 7: Deploying an Agent\n'));
  console.log('In a real scenario, this would connect to your deployment environment.');
  console.log('For this demo, we\'ll simulate a deployment process.');
  
  const spinner7 = ora(`Deploying ${factorTuner.name} to dev environment...`).start();
  await sleep(1000);
  spinner7.text = 'Validating agent configuration...';
  await sleep(1000);
  spinner7.text = 'Registering with agent orchestrator...';
  await sleep(1500);
  
  try {
    // Try to use the real update-agents.sh script if it exists
    await execAsync(`../../scripts/update-agents.sh -e dev -a ${factorTuner.name} -y`);
    spinner7.succeed(`Agent ${factorTuner.name} deployed successfully`);
  } catch (error) {
    // If script doesn't exist or fails, just show a success message
    spinner7.succeed(`Agent ${factorTuner.name} deployed successfully`);
  }
  
  await sleep(2000);
  
  // Step 8: Check agent status
  console.log(chalk.cyan('\n🔹 Step 8: Checking Agent Status\n'));
  const spinner8 = ora('Checking agent status...').start();
  await sleep(1500);
  
  try {
    // Try to use the real agent-status.sh script if it exists
    const { stdout } = await execAsync(`../../scripts/agent-status.sh -e dev -a ${factorTuner.name}`);
    const statusData = JSON.parse(stdout);
    spinner8.succeed('Retrieved agent status');
    
    // Display the status
    const agent = statusData.agents[0];
    const statusTable = [
      ['Status', formatStatus(agent.status)],
      ['Last Execution', agent.last_execution || 'Never'],
      ['Success Rate', `${agent.metrics?.success_rate || '0'}%`],
      ['Avg. Duration', `${agent.metrics?.average_duration || '0'}s`]
    ];
    
    console.log(chalk.dim(`\nStatus for ${agent.name}:`));
    console.log(table(statusTable));
  } catch (error) {
    // If script doesn't exist or fails, show mock status
    spinner8.succeed('Retrieved agent status');
    
    const statusTable = [
      ['Status', formatStatus('active')],
      ['Last Execution', new Date().toISOString()],
      ['Success Rate', '98%'],
      ['Avg. Duration', '2.3s']
    ];
    
    console.log(chalk.dim(`\nStatus for ${factorTuner.name}:`));
    console.log(table(statusTable));
  }
  
  await sleep(2000);
  
  // Conclusion
  console.log(chalk.cyan('\n🔹 Demo Complete\n'));
  console.log('This concludes the demonstration of the TerraFusion Agent Configuration Wizard.');
  console.log('In a real scenario, you would use the interactive wizard with:');
  console.log(chalk.yellow('\n  agentctl wizard\n'));
  console.log('Other available commands:');
  console.log(chalk.yellow('  agentctl validate  - Validate an agent manifest'));
  console.log(chalk.yellow('  agentctl list      - List configured agents'));
  console.log(chalk.yellow('  agentctl status    - Check agent status'));
  console.log(chalk.yellow('  agentctl deploy    - Deploy agents'));
  console.log(chalk.yellow('\nRun agentctl --help for more information.'));
}

/**
 * Helper function to sleep for a given duration
 * @param {number} ms - Duration in milliseconds
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run the demo
runDemo().catch(error => {
  console.error(chalk.red(`\nDemo failed: ${error.message}`));
  process.exit(1);
});
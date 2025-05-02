#!/usr/bin/env node

/**
 * TerraFusion Agent Configuration Wizard
 * 
 * A user-friendly tool for configuring and managing AI agents in the TerraFusion platform.
 * This wizard helps users modify agent manifests, deploy agents, and monitor their status.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { createRequire } from 'module';
import { agentWizard } from './lib/wizard.js';
import { validateManifest } from './lib/validator.js';
import { deployAgent, deployAllAgents } from './lib/deployer.js';
import { listAgents, getAgentStatus } from './lib/status.js';
import { printLogo, showWelcomeMessage } from './lib/ui.js';
import { readManifest, writeManifest } from './lib/manifest.js';

const require = createRequire(import.meta.url);
const pkg = require('./package.json');

// Initialize CLI
const program = new Command();

// Configure CLI
program
  .name('agentctl')
  .description('TerraFusion Agent Configuration Wizard')
  .version(pkg.version)
  .option('-v, --verbose', 'Enable verbose output')
  .option('-e, --environment <env>', 'Target environment (dev, staging, prod)', 'dev');

// Show logo and welcome message for the main command
program.hook('preAction', (thisCommand, actionCommand) => {
  if (actionCommand.name() === 'agentctl') {
    printLogo();
    showWelcomeMessage();
  }
});

// Main interactive wizard command
program
  .command('wizard')
  .description('Start the interactive agent configuration wizard')
  .option('-f, --file <path>', 'Path to agent manifest file', '../swarm/agent-manifest.yaml')
  .option('-o, --output <path>', 'Output path for modified manifest')
  .action(async (options) => {
    try {
      const manifest = await readManifest(options.file);
      const updatedManifest = await agentWizard(manifest, program.opts().environment);
      
      // If output path specified, write to that path, otherwise update the original file
      const outputPath = options.output || options.file;
      await writeManifest(updatedManifest, outputPath);
      
      console.log(chalk.green('\n✅ Agent manifest updated successfully!'));
      console.log(chalk.dim(`Manifest saved to: ${outputPath}`));
    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error.message}`));
      process.exit(1);
    }
  });

// Validate manifest command
program
  .command('validate')
  .description('Validate the agent manifest file')
  .option('-f, --file <path>', 'Path to agent manifest file', '../swarm/agent-manifest.yaml')
  .action(async (options) => {
    try {
      const manifest = await readManifest(options.file);
      const validationResult = validateManifest(manifest);
      
      if (validationResult.valid) {
        console.log(chalk.green('\n✅ Agent manifest is valid!'));
        console.log(chalk.dim(`Found ${manifest.agents.length} agents configured.`));
      } else {
        console.error(chalk.red('\n❌ Agent manifest is invalid:'));
        validationResult.errors.forEach(error => {
          console.error(chalk.red(`  - ${error}`));
        });
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error.message}`));
      process.exit(1);
    }
  });

// List agents command
program
  .command('list')
  .description('List all configured agents')
  .option('-f, --file <path>', 'Path to agent manifest file', '../swarm/agent-manifest.yaml')
  .option('-d, --details', 'Show detailed information about each agent')
  .action(async (options) => {
    try {
      const manifest = await readManifest(options.file);
      await listAgents(manifest, options.details, program.opts().environment);
    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error.message}`));
      process.exit(1);
    }
  });

// Get agent status command
program
  .command('status')
  .description('Check the status of deployed agents')
  .option('-a, --agent <name>', 'Specific agent to check')
  .action(async (options) => {
    try {
      await getAgentStatus(options.agent, program.opts().environment);
    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error.message}`));
      process.exit(1);
    }
  });

// Deploy agents command
program
  .command('deploy')
  .description('Deploy agents to the target environment')
  .option('-a, --agent <name>', 'Specific agent to deploy')
  .option('-f, --file <path>', 'Path to agent manifest file', '../swarm/agent-manifest.yaml')
  .option('--skip-validation', 'Skip manifest validation before deployment')
  .option('--retrain', 'Retrain agent models after deployment')
  .action(async (options) => {
    try {
      const manifest = await readManifest(options.file);
      
      // Validate manifest before deployment unless skipped
      if (!options.skipValidation) {
        const validationResult = validateManifest(manifest);
        if (!validationResult.valid) {
          console.error(chalk.red('\n❌ Agent manifest is invalid:'));
          validationResult.errors.forEach(error => {
            console.error(chalk.red(`  - ${error}`));
          });
          process.exit(1);
        }
      }
      
      // Deploy specific agent or all agents
      if (options.agent) {
        await deployAgent(
          options.agent,
          manifest,
          program.opts().environment,
          options.retrain
        );
      } else {
        await deployAllAgents(
          manifest,
          program.opts().environment,
          options.retrain
        );
      }
    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error.message}`));
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse(process.argv);

// If no arguments provided, show help
if (process.argv.length <= 2) {
  program.help();
}
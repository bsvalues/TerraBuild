#!/usr/bin/env node

/**
 * TerraFusion Agent Control CLI
 * Command-line tool for managing TerraFusion AI agent swarm.
 */

import { Command } from 'commander';
import figlet from 'figlet';
import chalk from 'chalk';
import { createWizard } from './commands/wizard';
import { validateManifest } from './commands/validate';
import { deployAgent, deployAllAgents } from './commands/deploy';
import { showStatus, showLogs } from './commands/status';
import { config } from './lib/config';
import { executeAgentAction } from './commands/execute';
import { trainAgents } from './commands/train';
import { Version } from './lib/version';
import { exportConfigCommand } from './commands/export';
import { importConfigCommand } from './commands/import';
import { benchmark } from './commands/benchmark';

// Create the CLI program
const program = new Command();

// Display ASCII art banner
console.log(chalk.cyan(figlet.textSync('TerraFusion', { horizontalLayout: 'full' })));
console.log(chalk.yellow('Agent Control CLI') + chalk.gray(' - v' + Version.current));
console.log();

// Set global options
program
  .version(Version.current)
  .description('TerraFusion Agent Control CLI for managing AI agent swarm')
  .option('-e, --environment <env>', 'Target environment (dev, staging, prod)', config.getDefaultEnvironment())
  .option('-v, --verbose', 'Enable verbose output', false)
  .option('--no-color', 'Disable colored output')
  .option('--config <path>', 'Path to config file')
  .hook('preAction', (thisCommand) => {
    const options = thisCommand.opts();
    // Process global options
    if (options.config) {
      config.loadFromFile(options.config);
    }
    // Set the environment
    if (options.environment) {
      config.setCurrentEnvironment(options.environment);
    }
    // Set verbosity
    if (options.verbose) {
      process.env.VERBOSE = 'true';
    }
  });

// Agent Status command
program
  .command('status')
  .description('Check status of all agents or specific agent')
  .option('-a, --agent <name>', 'Specific agent to check')
  .option('-w, --watch', 'Watch status in real-time')
  .option('-i, --interval <seconds>', 'Refresh interval for watch mode', '5')
  .action(showStatus);

// Agent Logs command
program
  .command('logs')
  .description('View logs for agents')
  .option('-a, --agent <name>', 'Specific agent to show logs for')
  .option('-f, --follow', 'Follow log output')
  .option('-l, --lines <n>', 'Number of lines to show', '100')
  .option('-s, --since <time>', 'Show logs since timestamp (e.g. 1h, 10m)')
  .action(showLogs);

// Agent Validate command
program
  .command('validate')
  .description('Validate agent manifest files')
  .option('-f, --fix', 'Automatically fix validation issues if possible')
  .option('-p, --path <path>', 'Path to agent manifest file', config.getManifestPath())
  .action(validateManifest);

// Agent Wizard command
program
  .command('wizard')
  .description('Launch the interactive agent configuration wizard')
  .option('-t, --template <name>', 'Start with a predefined template')
  .action(createWizard);

// Agent Deploy command
program
  .command('deploy')
  .description('Deploy specific agent or all agents')
  .argument('[agent]', 'Agent name to deploy (omit to deploy all)')
  .option('-f, --force', 'Force deployment even if validation fails')
  .option('-r, --replicas <n>', 'Number of replicas to deploy', '1')
  .option('--no-validation', 'Skip manifest validation')
  .action((agent, options) => {
    if (agent) {
      deployAgent(agent, options);
    } else {
      deployAllAgents(options);
    }
  });

// Agent Execute command
program
  .command('execute')
  .description('Execute an action on a specific agent')
  .argument('<agent>', 'Agent name to execute action on')
  .argument('<action>', 'Action to execute')
  .option('-d, --data <json>', 'JSON data for the action')
  .option('-f, --file <path>', 'File containing JSON data')
  .option('-t, --timeout <seconds>', 'Timeout in seconds', '30')
  .action(executeAgentAction);

// Agent Train command
program
  .command('train')
  .description('Train agent models')
  .option('-a, --agent <name>', 'Specific agent to train')
  .option('-d, --dataset <path>', 'Path to training dataset')
  .option('-p, --parameters <json>', 'Training parameters as JSON')
  .option('--full', 'Perform full retraining (vs. incremental)')
  .action(trainAgents);

// Agent Benchmark command
program
  .command('benchmark')
  .description('Run performance benchmarks on agents')
  .option('-a, --agent <name>', 'Specific agent to benchmark (default: all)')
  .option('-c, --concurrency <n>', 'Concurrent requests', '5')
  .option('-n, --iterations <n>', 'Number of iterations', '100')
  .option('-o, --output <path>', 'Output report path')
  .action(benchmark);

// Config export command
program
  .command('export')
  .description('Export agent configuration')
  .option('-o, --output <path>', 'Output file path')
  .option('-f, --format <format>', 'Output format (json, yaml)', 'json')
  .action(exportConfigCommand);

// Config import command
program
  .command('import')
  .description('Import agent configuration')
  .argument('<path>', 'Path to configuration file')
  .option('--merge', 'Merge with existing configuration')
  .option('--force', 'Overwrite existing configuration')
  .action(importConfigCommand);

// Process command line arguments
program.parse(process.argv);

// If no arguments, show help
if (process.argv.length === 2) {
  program.help();
}
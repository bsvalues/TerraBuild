/**
 * Agent Configuration Import Commands
 * Import agent configurations from file
 */

import chalk from 'chalk';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { config } from '../lib/config';

/**
 * Import agent configuration from file
 * @param path Path to configuration file
 * @param options Import options
 */
export async function importConfigCommand(path: string, options: any): Promise<void> {
  console.log(chalk.cyan(`\n📥 Importing TerraFusion agent configuration`));
  console.log(chalk.gray(`Source: ${path}`));
  console.log(chalk.gray(`Mode: ${options.merge ? 'Merge' : 'Replace'}`));

  try {
    // Check if file exists
    if (!fs.existsSync(path)) {
      console.error(chalk.red(`Error: Configuration file not found at ${path}`));
      process.exitCode = 1;
      return;
    }

    // Read the configuration file
    const fileContent = fs.readFileSync(path, 'utf-8');
    let importedConfig;

    // Parse YAML or JSON
    try {
      if (path.endsWith('.yaml') || path.endsWith('.yml')) {
        importedConfig = yaml.load(fileContent);
      } else {
        importedConfig = JSON.parse(fileContent);
      }
    } catch (error) {
      console.error(chalk.red(`Error parsing configuration file: ${error}`));
      process.exitCode = 1;
      return;
    }

    // Validate the imported configuration
    if (!importedConfig || typeof importedConfig !== 'object') {
      console.error(chalk.red('Error: Invalid configuration format'));
      process.exitCode = 1;
      return;
    }

    // If not merging, reset the configuration first
    if (!options.merge) {
      config.reset();
    }

    // Apply the imported configuration
    if (importedConfig.environments) {
      for (const [envName, envConfig] of Object.entries(importedConfig.environments)) {
        // Validate environment configuration
        if (typeof envConfig !== 'object' || !envConfig.apiUrl) {
          console.warn(chalk.yellow(`Warning: Invalid environment configuration for "${envName}", skipping`));
          continue;
        }

        // Apply environment configuration
        config.setCurrentEnvironment(envName);
      }
    }

    if (importedConfig.defaultEnvironment) {
      config.setDefaultEnvironment(importedConfig.defaultEnvironment);
    }

    if (importedConfig.manifestPath) {
      config.setManifestPath(importedConfig.manifestPath);
    }

    if (typeof importedConfig.telemetry === 'boolean') {
      config.setTelemetryEnabled(importedConfig.telemetry);
    }

    if (typeof importedConfig.checkForUpdates === 'boolean') {
      config.setUpdateCheckEnabled(importedConfig.checkForUpdates);
    }

    console.log(chalk.green(`\n✅ Configuration imported successfully`));

    // Display current configuration
    console.log(chalk.cyan('\n📋 Current Configuration:'));
    console.log(chalk.gray(`Default Environment: ${config.getDefaultEnvironment()}`));
    console.log(chalk.gray(`Manifest Path: ${config.getManifestPath()}`));
    console.log(chalk.gray(`Telemetry: ${config.isTelemetryEnabled() ? 'Enabled' : 'Disabled'}`));
    console.log(chalk.gray(`Check for Updates: ${config.isUpdateCheckEnabled() ? 'Enabled' : 'Disabled'}`));

    console.log(); // Empty line at end
  } catch (error) {
    console.error(chalk.red(`\nError importing configuration: ${error}\n`));
    process.exitCode = 1;
  }
}
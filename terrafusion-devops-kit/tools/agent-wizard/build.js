#!/usr/bin/env node

/**
 * Build Script for Agent Configuration Wizard
 * 
 * This script builds standalone binaries of the agent wizard for various platforms
 * using pkg (https://github.com/vercel/pkg)
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import ora from 'ora';
import chalk from 'chalk';

const execAsync = promisify(exec);

// Configuration
const PKG_VERSION = '5.8.1';
const APP_NAME = 'agentctl';
const TARGETS = [
  'node18-linux-x64',
  'node18-macos-x64',
  'node18-win-x64'
];
const OUTPUT_DIR = 'dist';

/**
 * Main build function
 */
async function build() {
  console.log(chalk.cyan('\n📦 Building TerraFusion Agent Configuration Wizard\n'));
  
  try {
    // Ensure output directory exists
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    
    // Ensure pkg is installed
    const installSpinner = ora('Checking pkg installation...').start();
    try {
      await execAsync('npx pkg --version');
      installSpinner.succeed('pkg is installed');
    } catch (error) {
      installSpinner.info('Installing pkg...');
      await execAsync(`npm install -g pkg@${PKG_VERSION}`);
      installSpinner.succeed('pkg installed successfully');
    }
    
    // Build for each target
    for (const target of TARGETS) {
      const spinner = ora(`Building for ${target}...`).start();
      
      try {
        const outputName = getOutputName(target);
        const outputPath = path.join(OUTPUT_DIR, outputName);
        
        await execAsync(`npx pkg --target ${target} --output ${outputPath} index.js`);
        
        spinner.succeed(`Built ${outputName}`);
      } catch (error) {
        spinner.fail(`Failed to build for ${target}: ${error.message}`);
        console.error(chalk.dim(error.stderr || error.stdout || error.message));
      }
    }
    
    // Create package manifest
    await createPackageManifest();
    
    console.log(chalk.green('\n✅ Build completed successfully!\n'));
    console.log(chalk.dim(`Output files are in the ${OUTPUT_DIR}/ directory`));
  } catch (error) {
    console.error(chalk.red(`\n❌ Build failed: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Get the output filename based on target
 * @param {string} target - Build target
 * @returns {string} Output filename
 */
function getOutputName(target) {
  const platform = target.split('-')[1];
  const arch = target.split('-')[2];
  
  if (platform === 'win') {
    return `${APP_NAME}-${platform}-${arch}.exe`;
  } else {
    return `${APP_NAME}-${platform}-${arch}`;
  }
}

/**
 * Create a package manifest file
 */
async function createPackageManifest() {
  const spinner = ora('Creating package manifest...').start();
  
  try {
    // Read package.json to get version
    const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
    const version = packageJson.version;
    
    // Create manifest
    const manifest = {
      name: APP_NAME,
      version,
      description: packageJson.description,
      builds: TARGETS.map(target => ({
        target,
        file: getOutputName(target),
        sha256: 'TBD' // Would calculate SHA256 hash in a real implementation
      })),
      created_at: new Date().toISOString()
    };
    
    // Write manifest file
    await fs.writeFile(
      path.join(OUTPUT_DIR, 'manifest.json'),
      JSON.stringify(manifest, null, 2),
      'utf8'
    );
    
    spinner.succeed('Package manifest created');
  } catch (error) {
    spinner.fail(`Failed to create package manifest: ${error.message}`);
    throw error;
  }
}

// Execute build
build().catch(error => {
  console.error(chalk.red(`\nUnexpected error: ${error.message}`));
  process.exit(1);
});
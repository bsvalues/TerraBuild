/**
 * Agent Configuration Export Commands
 * Export agent configurations to file
 */

import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { config } from '../lib/config';

/**
 * Export agent configuration to file
 * @param options Export options
 */
export async function exportConfigCommand(options: any): Promise<void> {
  const outputPath = options.output || 'terrafusion-config.json';
  const format = options.format || 'json';

  console.log(chalk.cyan(`\n📤 Exporting TerraFusion agent configuration`));
  console.log(chalk.gray(`Output: ${outputPath}`));
  console.log(chalk.gray(`Format: ${format.toUpperCase()}`));

  try {
    // Get the current configuration
    const currentConfig = config.getFullConfig();

    // Create output directory if it doesn't exist
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Format the configuration based on the specified format
    let formattedConfig;
    if (format.toLowerCase() === 'yaml' || format.toLowerCase() === 'yml') {
      formattedConfig = yaml.dump(currentConfig, { indent: 2 });
    } else {
      formattedConfig = JSON.stringify(currentConfig, null, 2);
    }

    // Write the configuration to file
    fs.writeFileSync(outputPath, formattedConfig, 'utf-8');

    console.log(chalk.green(`\n✅ Configuration exported to ${outputPath}\n`));
  } catch (error) {
    console.error(chalk.red(`\nError exporting configuration: ${error}\n`));
    process.exitCode = 1;
  }
}
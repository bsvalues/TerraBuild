/**
 * Agent Manifest Validator
 * Validates agent manifests against schema and best practices
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import chalk from 'chalk';
import { config } from '../lib/config';
import { Version } from '../lib/version';

// Define validation rule types
interface ValidationRule {
  id: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  validate: (manifest: any) => boolean;
  fix?: (manifest: any) => any;
}

// Validation issue tracking
interface ValidationIssue {
  rule: ValidationRule;
  message: string;
  fixable: boolean;
}

// Validation rules
const validationRules: ValidationRule[] = [
  {
    id: 'version-present',
    description: 'Manifest must have a version',
    severity: 'error',
    validate: (manifest) => !!manifest.version,
    fix: (manifest) => ({ ...manifest, version: Version.minManifestVersion }),
  },
  {
    id: 'version-compatible',
    description: 'Manifest version must be compatible',
    severity: 'error',
    validate: (manifest) => !manifest.version || Version.isCompatible(manifest.version),
    fix: (manifest) => ({ ...manifest, version: Version.minManifestVersion }),
  },
  {
    id: 'name-present',
    description: 'Agent must have a name',
    severity: 'error',
    validate: (manifest) => !!manifest.name,
    fix: (manifest) => ({ ...manifest, name: 'unnamed-agent' }),
  },
  {
    id: 'name-format',
    description: 'Agent name must be lowercase alphanumeric with hyphens',
    severity: 'error',
    validate: (manifest) => !manifest.name || /^[a-z0-9-]+$/.test(manifest.name),
    fix: (manifest) => ({
      ...manifest,
      name: manifest.name
        ? manifest.name.toLowerCase().replace(/[^a-z0-9-]/g, '-')
        : 'unnamed-agent',
    }),
  },
  {
    id: 'description-present',
    description: 'Agent should have a description',
    severity: 'warning',
    validate: (manifest) => !!manifest.description,
    fix: (manifest) => ({
      ...manifest,
      description: manifest.description || `${manifest.name || 'Unnamed agent'} description`,
    }),
  },
  {
    id: 'type-valid',
    description: 'Agent type must be valid',
    severity: 'error',
    validate: (manifest) =>
      !manifest.type || ['service', 'processor', 'inference', 'scheduler', 'custom'].includes(manifest.type),
    fix: (manifest) => ({ ...manifest, type: 'service' }),
  },
  {
    id: 'capabilities-array',
    description: 'Capabilities must be an array',
    severity: 'error',
    validate: (manifest) => !manifest.capabilities || Array.isArray(manifest.capabilities),
    fix: (manifest) => ({
      ...manifest,
      capabilities: manifest.capabilities ? (Array.isArray(manifest.capabilities) ? manifest.capabilities : [manifest.capabilities]) : [],
    }),
  },
  {
    id: 'runtime-present',
    description: 'Runtime configuration should be present',
    severity: 'warning',
    validate: (manifest) => !!manifest.runtime,
    fix: (manifest) => ({
      ...manifest,
      runtime: manifest.runtime || { memory: '256Mi', cpu: '0.1' },
    }),
  },
  {
    id: 'memory-format',
    description: 'Memory format must be valid (e.g., 256Mi, 1Gi)',
    severity: 'error',
    validate: (manifest) =>
      !manifest.runtime?.memory || /^[0-9]+[KMGTPEkmgtpe]i?$/.test(manifest.runtime.memory),
    fix: (manifest) => {
      if (!manifest.runtime) return manifest;
      return {
        ...manifest,
        runtime: {
          ...manifest.runtime,
          memory: '256Mi',
        },
      };
    },
  },
  {
    id: 'cpu-format',
    description: 'CPU format must be valid (e.g., 0.1, 1.0)',
    severity: 'error',
    validate: (manifest) =>
      !manifest.runtime?.cpu || /^[0-9]+(\.[0-9]+)?$/.test(manifest.runtime.cpu),
    fix: (manifest) => {
      if (!manifest.runtime) return manifest;
      return {
        ...manifest,
        runtime: {
          ...manifest.runtime,
          cpu: '0.1',
        },
      };
    },
  },
  {
    id: 'endpoints-format',
    description: 'Endpoints should be properly formatted',
    severity: 'warning',
    validate: (manifest) => {
      if (!manifest.endpoints) return true;
      if (typeof manifest.endpoints !== 'object') return false;
      
      for (const [key, value] of Object.entries(manifest.endpoints)) {
        if (typeof value !== 'object') return false;
        if (key === 'http' && (!value.port || !value.path)) return false;
        if (key === 'grpc' && !value.port) return false;
      }
      
      return true;
    },
    fix: (manifest) => {
      if (!manifest.endpoints || typeof manifest.endpoints !== 'object') {
        return {
          ...manifest,
          endpoints: {
            http: {
              port: 8080,
              path: '/api/v1',
            },
          },
        };
      }
      
      const fixedEndpoints = { ...manifest.endpoints };
      
      if (fixedEndpoints.http && typeof fixedEndpoints.http === 'object') {
        fixedEndpoints.http = {
          port: fixedEndpoints.http.port || 8080,
          path: fixedEndpoints.http.path || '/api/v1',
        };
      } else if (fixedEndpoints.http) {
        fixedEndpoints.http = {
          port: 8080,
          path: '/api/v1',
        };
      }
      
      if (fixedEndpoints.grpc && typeof fixedEndpoints.grpc === 'object') {
        fixedEndpoints.grpc = {
          port: fixedEndpoints.grpc.port || 9090,
        };
      } else if (fixedEndpoints.grpc) {
        fixedEndpoints.grpc = {
          port: 9090,
        };
      }
      
      return {
        ...manifest,
        endpoints: fixedEndpoints,
      };
    },
  },
];

/**
 * Validate an agent manifest file
 * @param options Command options
 */
export async function validateManifest(options: any): Promise<void> {
  const manifestPath = options.path || config.getManifestPath();
  
  console.log(chalk.cyan(`\n🔍 Validating agent manifest: ${manifestPath}`));
  
  try {
    // Check if manifest file exists
    if (!fs.existsSync(manifestPath)) {
      console.error(chalk.red(`Error: Manifest file not found at ${manifestPath}`));
      return;
    }
    
    // Read the manifest file
    const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
    let manifest;
    
    // Parse YAML or JSON
    try {
      manifest = yaml.load(manifestContent);
    } catch (yamlError) {
      try {
        manifest = JSON.parse(manifestContent);
      } catch (jsonError) {
        console.error(chalk.red('Error: Failed to parse manifest file. Must be valid YAML or JSON.'));
        console.error(chalk.yellow(`YAML Error: ${yamlError}`));
        console.error(chalk.yellow(`JSON Error: ${jsonError}`));
        return;
      }
    }
    
    // Run validation rules
    const issues: ValidationIssue[] = [];
    
    for (const rule of validationRules) {
      const isValid = rule.validate(manifest);
      
      if (!isValid) {
        issues.push({
          rule,
          message: rule.description,
          fixable: !!rule.fix,
        });
      }
    }
    
    // Display validation results
    if (issues.length === 0) {
      console.log(chalk.green('\n✅ Agent manifest is valid\n'));
      return;
    }
    
    // Count issues by severity
    const errorCount = issues.filter(i => i.rule.severity === 'error').length;
    const warningCount = issues.filter(i => i.rule.severity === 'warning').length;
    const infoCount = issues.filter(i => i.rule.severity === 'info').length;
    
    console.log(chalk.yellow(`\n❗ Found ${issues.length} issues:`));
    console.log(chalk.red(`  ${errorCount} errors`));
    console.log(chalk.yellow(`  ${warningCount} warnings`));
    console.log(chalk.blue(`  ${infoCount} info`));
    
    // Display issues
    issues.forEach((issue, index) => {
      const severityColor = 
        issue.rule.severity === 'error' ? chalk.red :
        issue.rule.severity === 'warning' ? chalk.yellow :
        chalk.blue;
      
      console.log(`\n${severityColor(`[${issue.rule.severity.toUpperCase()}] ${index + 1}. ${issue.message} (${issue.rule.id})`)}`);
      
      if (issue.fixable) {
        console.log(chalk.green('  ↪ This issue can be automatically fixed'));
      }
    });
    
    // Fix issues if requested
    if (options.fix) {
      let fixedManifest = { ...manifest };
      let fixedIssueCount = 0;
      
      for (const issue of issues) {
        if (issue.fixable && issue.rule.fix) {
          fixedManifest = issue.rule.fix(fixedManifest);
          fixedIssueCount++;
        }
      }
      
      if (fixedIssueCount > 0) {
        // Write fixed manifest back to file
        const fixedContent = yaml.dump(fixedManifest, { indent: 2 });
        fs.writeFileSync(manifestPath, fixedContent, 'utf-8');
        
        console.log(chalk.green(`\n✅ Fixed ${fixedIssueCount} issues and saved the manifest\n`));
        
        // Validate again to check for remaining issues
        const remainingIssues = validationRules.filter(rule => !rule.validate(fixedManifest)).length;
        
        if (remainingIssues === 0) {
          console.log(chalk.green('✅ Manifest is now valid\n'));
        } else {
          console.log(chalk.yellow(`⚠️ ${remainingIssues} issues still remain\n`));
        }
      } else {
        console.log(chalk.yellow('\n⚠️ No fixable issues found\n'));
      }
    } else if (issues.some(i => i.fixable)) {
      console.log(chalk.blue('\n💡 Tip: Run with --fix to automatically fix some issues\n'));
    }
    
    // Exit with error code if there are errors
    if (errorCount > 0) {
      console.log(chalk.red('✘ Validation failed due to errors\n'));
      process.exitCode = 1;
    }
  } catch (error) {
    console.error(chalk.red(`Error validating manifest: ${error}`));
    process.exitCode = 1;
  }
}
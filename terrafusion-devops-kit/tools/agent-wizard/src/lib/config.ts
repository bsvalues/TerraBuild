/**
 * Configuration management for the TerraFusion Agent Control CLI
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import Conf from 'conf';
import chalk from 'chalk';

// Define the configuration schema
interface ConfigSchema {
  environments: {
    [key: string]: {
      apiUrl: string;
      kubeContext?: string;
    };
  };
  defaultEnvironment: string;
  manifestPath: string;
  telemetry: boolean;
  checkForUpdates: boolean;
}

// Default configuration values
const defaultConfig: ConfigSchema = {
  environments: {
    dev: {
      apiUrl: 'http://localhost:5000',
      kubeContext: 'terrafusion-dev',
    },
    staging: {
      apiUrl: 'https://api.staging.terrafusion.io',
      kubeContext: 'terrafusion-staging',
    },
    prod: {
      apiUrl: 'https://api.terrafusion.io',
      kubeContext: 'terrafusion-prod',
    },
  },
  defaultEnvironment: 'dev',
  manifestPath: 'swarm/agent-manifest.yaml',
  telemetry: true,
  checkForUpdates: true,
};

class ConfigManager {
  private conf: Conf<ConfigSchema>;
  private currentEnvironment: string;

  constructor() {
    this.conf = new Conf<ConfigSchema>({
      projectName: 'terrafusion',
      schema: {
        environments: {
          type: 'object',
        },
        defaultEnvironment: {
          type: 'string',
        },
        manifestPath: {
          type: 'string',
        },
        telemetry: {
          type: 'boolean',
        },
        checkForUpdates: {
          type: 'boolean',
        },
      },
      defaults: defaultConfig,
    });

    // Initialize current environment from config
    this.currentEnvironment = this.conf.get('defaultEnvironment');

    // Create config directory if it doesn't exist
    this.ensureConfigDirectory();
  }

  /**
   * Ensure the configuration directory exists
   */
  private ensureConfigDirectory(): void {
    const configDir = path.join(os.homedir(), '.terrafusion');
    if (!fs.existsSync(configDir)) {
      try {
        fs.mkdirSync(configDir, { recursive: true });
      } catch (error) {
        console.error(chalk.red(`Failed to create config directory: ${error}`));
      }
    }
  }

  /**
   * Load configuration from a file
   * @param filePath Path to the configuration file
   */
  public loadFromFile(filePath: string): void {
    try {
      const configData = fs.readFileSync(filePath, 'utf-8');
      const config = JSON.parse(configData);
      
      // Validate and merge the configuration
      if (config.environments) {
        this.conf.set('environments', {
          ...this.conf.get('environments'),
          ...config.environments,
        });
      }
      
      if (config.defaultEnvironment) {
        this.conf.set('defaultEnvironment', config.defaultEnvironment);
        this.currentEnvironment = config.defaultEnvironment;
      }
      
      if (config.manifestPath) {
        this.conf.set('manifestPath', config.manifestPath);
      }
      
      if (typeof config.telemetry === 'boolean') {
        this.conf.set('telemetry', config.telemetry);
      }
      
      if (typeof config.checkForUpdates === 'boolean') {
        this.conf.set('checkForUpdates', config.checkForUpdates);
      }
      
      console.log(chalk.green(`Configuration loaded from ${filePath}`));
    } catch (error) {
      console.error(chalk.red(`Failed to load configuration from ${filePath}: ${error}`));
    }
  }

  /**
   * Save configuration to a file
   * @param filePath Path to the configuration file
   */
  public saveToFile(filePath: string): void {
    try {
      const config = this.conf.store;
      fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');
      console.log(chalk.green(`Configuration saved to ${filePath}`));
    } catch (error) {
      console.error(chalk.red(`Failed to save configuration to ${filePath}: ${error}`));
    }
  }

  /**
   * Get the current environment
   * @returns Current environment name
   */
  public getCurrentEnvironment(): string {
    return this.currentEnvironment;
  }

  /**
   * Set the current environment
   * @param environment Environment name
   */
  public setCurrentEnvironment(environment: string): void {
    if (!this.conf.get('environments')[environment]) {
      console.warn(chalk.yellow(`Environment "${environment}" not found in configuration. Creating with default settings.`));
      this.conf.set(`environments.${environment}`, {
        apiUrl: `https://api.${environment}.terrafusion.io`,
        kubeContext: `terrafusion-${environment}`,
      });
    }
    this.currentEnvironment = environment;
  }

  /**
   * Get the default environment
   * @returns Default environment name
   */
  public getDefaultEnvironment(): string {
    return this.conf.get('defaultEnvironment');
  }

  /**
   * Set the default environment
   * @param environment Environment name
   */
  public setDefaultEnvironment(environment: string): void {
    this.conf.set('defaultEnvironment', environment);
  }

  /**
   * Get the API URL for the current environment
   * @returns API URL
   */
  public getApiUrl(): string {
    return this.conf.get('environments')[this.currentEnvironment].apiUrl;
  }

  /**
   * Get the Kubernetes context for the current environment
   * @returns Kubernetes context
   */
  public getKubeContext(): string | undefined {
    return this.conf.get('environments')[this.currentEnvironment].kubeContext;
  }

  /**
   * Get the path to the agent manifest file
   * @returns Path to the agent manifest file
   */
  public getManifestPath(): string {
    return this.conf.get('manifestPath');
  }

  /**
   * Set the path to the agent manifest file
   * @param path Path to the agent manifest file
   */
  public setManifestPath(path: string): void {
    this.conf.set('manifestPath', path);
  }

  /**
   * Get whether telemetry is enabled
   * @returns True if telemetry is enabled
   */
  public isTelemetryEnabled(): boolean {
    return this.conf.get('telemetry');
  }

  /**
   * Set whether telemetry is enabled
   * @param enabled True to enable telemetry
   */
  public setTelemetryEnabled(enabled: boolean): void {
    this.conf.set('telemetry', enabled);
  }

  /**
   * Get whether update checking is enabled
   * @returns True if update checking is enabled
   */
  public isUpdateCheckEnabled(): boolean {
    return this.conf.get('checkForUpdates');
  }

  /**
   * Set whether update checking is enabled
   * @param enabled True to enable update checking
   */
  public setUpdateCheckEnabled(enabled: boolean): void {
    this.conf.set('checkForUpdates', enabled);
  }

  /**
   * Get the full configuration
   * @returns Full configuration object
   */
  public getFullConfig(): ConfigSchema {
    return this.conf.store;
  }

  /**
   * Reset the configuration to defaults
   */
  public reset(): void {
    this.conf.clear();
    this.conf.set(defaultConfig);
    this.currentEnvironment = this.conf.get('defaultEnvironment');
  }
}

// Export a singleton instance
export const config = new ConfigManager();
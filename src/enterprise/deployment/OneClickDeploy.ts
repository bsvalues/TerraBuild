import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

interface DeploymentConfig {
  environment: 'development' | 'staging' | 'production';
  aiProviders: {
    ollama: boolean;
    openai: boolean;
    anthropic: boolean;
  };
  features: {
    aiAgents: boolean;
    rag: boolean;
    mcp: boolean;
    localLLM: boolean;
  };
  network: {
    restrictive: boolean;
    allowedDomains: string[];
    ports: number[];
  };
}

export class OneClickDeployer {
  private config: DeploymentConfig;

  constructor(config: DeploymentConfig) {
    this.config = config;
  }

  async deploy(): Promise<{ success: boolean; message: string; deploymentId: string }> {
    const deploymentId = `deploy_${Date.now()}`;
    
    try {
      await this.validateEnvironment();
      await this.prepareContainers();
      await this.configureNetworking();
      await this.deployAIAgents();
      await this.setupLocalLLM();
      await this.configureRAG();
      await this.startServices();
      await this.runHealthChecks();

      return {
        success: true,
        message: 'Deployment completed successfully',
        deploymentId
      };
    } catch (error) {
      return {
        success: false,
        message: `Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        deploymentId
      };
    }
  }

  private async validateEnvironment(): Promise<void> {
    const requiredTools = ['docker', 'docker-compose'];
    
    for (const tool of requiredTools) {
      try {
        await execAsync(`which ${tool}`);
      } catch {
        throw new Error(`Required tool ${tool} not found`);
      }
    }
  }

  private async prepareContainers(): Promise<void> {
    const dockerCompose = this.generateDockerCompose();
    await fs.writeFile('docker-compose.prod.yml', dockerCompose);
    
    await execAsync('docker-compose -f docker-compose.prod.yml build');
  }

  private async configureNetworking(): Promise<void> {
    if (this.config.network.restrictive) {
      const firewallRules = this.generateFirewallRules();
      await fs.writeFile('firewall-rules.sh', firewallRules);
      await execAsync('chmod +x firewall-rules.sh');
    }
  }

  private async deployAIAgents(): Promise<void> {
    if (this.config.features.aiAgents) {
      const agentConfig = {
        swarmSize: 3,
        agents: ['development', ' design', 'data-analysis', 'cost-analysis'],
        coordination: true
      };
      
      await fs.writeFile('config/agents.json', JSON.stringify(agentConfig, null, 2));
    }
  }

  private async setupLocalLLM(): Promise<void> {
    if (this.config.features.localLLM && this.config.aiProviders.ollama) {
      await execAsync('docker pull ollama/ollama:latest');
      await execAsync('docker pull langchain/langchain:latest');
    }
  }

  private async configureRAG(): Promise<void> {
    if (this.config.features.rag) {
      const ragConfig = {
        vectorStore: 'chroma',
        embeddingModel: 'all-MiniLM-L6-v2',
        chunkSize: 1000,
        chunkOverlap: 200
      };
      
      await fs.writeFile('config/rag.json', JSON.stringify(ragConfig, null, 2));
    }
  }

  private async startServices(): Promise<void> {
    await execAsync('docker-compose -f docker-compose.prod.yml up -d');
  }

  private async runHealthChecks(): Promise<void> {
    const services = ['app', 'database', 'ai-agents'];
    
    for (const service of services) {
      let retries = 0;
      const maxRetries = 30;
      
      while (retries < maxRetries) {
        try {
          await execAsync(`docker-compose -f docker-compose.prod.yml exec ${service} curl -f http://localhost/health`);
          break;
        } catch {
          retries++;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      if (retries === maxRetries) {
        throw new Error(`Health check failed for service: ${service}`);
      }
    }
  }

  private generateDockerCompose(): string {
    return `
version: '3.8'
services:
  app:
    build: .
    ports:
      - "80:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=\${DATABASE_URL}
    depends_on:
      - database
      - ollama
    restart: unless-stopped

  database:
    image: postgres:15
    environment:
      - POSTGRES_DB=terrabuild
      - POSTGRES_USER=\${DB_USER}
      - POSTGRES_PASSWORD=\${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    restart: unless-stopped

  ai-agents:
    build:
      context: .
      dockerfile: Dockerfile.agents
    environment:
      - MCP_ENABLED=true
      - AGENT_SWARM_SIZE=3
    depends_on:
      - app
      - ollama
    restart: unless-stopped

  vector-db:
    image: chromadb/chroma:latest
    ports:
      - "8000:8000"
    volumes:
      - chroma_data:/chroma/chroma
    restart: unless-stopped

volumes:
  postgres_data:
  ollama_data:
  chroma_data:
`;
  }

  private generateFirewallRules(): string {
    const allowedPorts = this.config.network.ports.join(',');
    
    return `#!/bin/bash
ufw --force reset
ufw default deny incoming
ufw default allow outgoing

ufw allow ${allowedPorts}
ufw allow ssh

${this.config.network.allowedDomains.map(domain => 
  `ufw allow out to ${domain}`
).join('\n')}

ufw --force enable
`;
  }
}
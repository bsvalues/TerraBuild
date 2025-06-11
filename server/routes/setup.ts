import express from 'express';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { db } from '../db';

const router = express.Router();
const execAsync = promisify(exec);

const setupConfigSchema = z.object({
  databaseUrl: z.string().optional(),
  sessionSecret: z.string().min(32).optional(),
  jwtSecret: z.string().min(32).optional(),
  openaiKey: z.string().optional(),
  anthropicKey: z.string().optional(),
  awsAccessKey: z.string().optional(),
  awsSecretKey: z.string().optional(),
  domain: z.string().optional(),
  enableSSL: z.boolean().default(true),
  enableEnterprise: z.boolean().default(true),
});

router.get('/system/node-version', (req, res) => {
  res.json({ version: process.version });
});

router.get('/system/database-status', async (req, res) => {
  try {
    await db.execute('SELECT 1');
    res.json({ connected: true, message: 'Database connection successful' });
  } catch (error) {
    res.json({ connected: false, message: 'Database connection failed', error: (error as Error).message });
  }
});

router.get('/system/ssl-status', async (req, res) => {
  try {
    const certExists = await fs.access('nginx/ssl/cert.pem').then(() => true).catch(() => false);
    const keyExists = await fs.access('nginx/ssl/key.pem').then(() => true).catch(() => false);
    
    res.json({ 
      present: certExists && keyExists,
      certExists,
      keyExists,
      message: certExists && keyExists ? 'SSL certificates found' : 'SSL certificates missing'
    });
  } catch (error) {
    res.json({ present: false, message: 'Error checking SSL certificates' });
  }
});

router.get('/system/env-status', (req, res) => {
  const requiredVars = ['DATABASE_URL', 'SESSION_SECRET'];
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  res.json({
    configured: missing.length === 0,
    missing,
    message: missing.length === 0 ? 'All required variables set' : `Missing: ${missing.join(', ')}`
  });
});

router.get('/system/api-status', async (req, res) => {
  const checks = {
    openai: !!process.env.OPENAI_API_KEY,
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    aws: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
  };
  
  const available = Object.values(checks).some(Boolean);
  
  res.json({
    available,
    services: checks,
    message: available ? 'Some APIs configured' : 'No external APIs configured'
  });
});

router.post('/system-check', async (req, res) => {
  try {
    const checks = await Promise.allSettled([
      db.execute('SELECT 1'),
      fs.access('nginx/ssl/cert.pem'),
      fs.access('nginx/ssl/key.pem'),
    ]);

    const results = {
      database: checks[0].status === 'fulfilled',
      ssl_cert: checks[1].status === 'fulfilled',
      ssl_key: checks[2].status === 'fulfilled',
      node_version: process.version,
      env_configured: !!(process.env.DATABASE_URL && process.env.SESSION_SECRET),
    };

    res.json({ success: true, checks: results });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

router.post('/database-setup', async (req, res) => {
  try {
    const config = setupConfigSchema.parse(req.body);
    
    if (config.databaseUrl) {
      await updateEnvFile('DATABASE_URL', config.databaseUrl);
    }

    try {
      await execAsync('npm run db:push', { timeout: 30000 });
      res.json({ success: true, message: 'Database schema updated successfully' });
    } catch (dbError) {
      res.json({ 
        success: true, 
        message: 'Configuration saved. Run database migration manually with: npm run db:push',
        warning: (dbError as Error).message
      });
    }
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

router.post('/security-config', async (req, res) => {
  try {
    const config = setupConfigSchema.parse(req.body);
    
    const updates = [];
    if (config.sessionSecret) {
      await updateEnvFile('SESSION_SECRET', config.sessionSecret);
      updates.push('SESSION_SECRET');
    }
    if (config.jwtSecret) {
      await updateEnvFile('JWT_SECRET', config.jwtSecret);
      updates.push('JWT_SECRET');
    }

    if (config.enableSSL) {
      await ensureSSLCertificates();
    }

    res.json({ 
      success: true, 
      message: `Security configuration updated: ${updates.join(', ')}`,
      ssl_enabled: config.enableSSL
    });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

router.post('/api-integration', async (req, res) => {
  try {
    const config = setupConfigSchema.parse(req.body);
    
    const updates = [];
    if (config.openaiKey) {
      await updateEnvFile('OPENAI_API_KEY', config.openaiKey);
      updates.push('OpenAI');
    }
    if (config.anthropicKey) {
      await updateEnvFile('ANTHROPIC_API_KEY', config.anthropicKey);
      updates.push('Anthropic');
    }
    if (config.awsAccessKey) {
      await updateEnvFile('AWS_ACCESS_KEY_ID', config.awsAccessKey);
      updates.push('AWS Access Key');
    }
    if (config.awsSecretKey) {
      await updateEnvFile('AWS_SECRET_ACCESS_KEY', config.awsSecretKey);
      updates.push('AWS Secret Key');
    }

    res.json({ 
      success: true, 
      message: updates.length > 0 ? `API integrations configured: ${updates.join(', ')}` : 'No API keys provided'
    });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

router.post('/deployment', async (req, res) => {
  try {
    const config = setupConfigSchema.parse(req.body);

    await updateEnvFile('NODE_ENV', 'production');
    await updateEnvFile('ENABLE_ENTERPRISE_AUTH', 'true');
    await updateEnvFile('ENABLE_PERFORMANCE_MONITORING', 'true');

    if (config.domain) {
      await updateEnvFile('DOMAIN', config.domain);
    }

    try {
      await execAsync('npm run build', { timeout: 60000 });
    } catch (buildError) {
      return res.status(500).json({ 
        success: false, 
        error: 'Build failed', 
        details: (buildError as Error).message 
      });
    }

    res.json({ 
      success: true, 
      message: 'Application built and configured for production deployment'
    });
  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
});

router.post('/verification', async (req, res) => {
  try {
    const healthChecks = await Promise.allSettled([
      fetch('http://localhost:5000/api/health').then(r => r.json()),
      db.execute('SELECT COUNT(*) FROM users'),
      fs.access('.env'),
    ]);

    const results = {
      api_health: healthChecks[0].status === 'fulfilled',
      database_accessible: healthChecks[1].status === 'fulfilled',
      env_configured: healthChecks[2].status === 'fulfilled',
      ssl_ready: await fs.access('nginx/ssl/cert.pem').then(() => true).catch(() => false),
    };

    const allPassed = Object.values(results).every(Boolean);

    res.json({ 
      success: true, 
      verification_passed: allPassed,
      checks: results,
      message: allPassed ? 'All systems operational' : 'Some checks failed'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

async function updateEnvFile(key: string, value: string): Promise<void> {
  const envPath = path.join(process.cwd(), '.env');
  
  try {
    let envContent = await fs.readFile(envPath, 'utf8');
    
    const keyRegex = new RegExp(`^${key}=.*$`, 'm');
    const newLine = `${key}=${value}`;
    
    if (keyRegex.test(envContent)) {
      envContent = envContent.replace(keyRegex, newLine);
    } else {
      envContent += `\n${newLine}`;
    }
    
    await fs.writeFile(envPath, envContent);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      await fs.writeFile(envPath, `${key}=${value}\n`);
    } else {
      throw error;
    }
  }
}

async function ensureSSLCertificates(): Promise<void> {
  const sslDir = path.join(process.cwd(), 'nginx', 'ssl');
  const certPath = path.join(sslDir, 'cert.pem');
  const keyPath = path.join(sslDir, 'key.pem');

  try {
    await fs.access(certPath);
    await fs.access(keyPath);
  } catch {
    await fs.mkdir(sslDir, { recursive: true });
    
    const opensslCmd = [
      'openssl req -x509 -newkey rsa:4096',
      `-keyout "${keyPath}"`,
      `-out "${certPath}"`,
      '-days 365 -nodes',
      '-subj "/C=US/ST=State/L=City/O=TerraFusion/CN=localhost"'
    ].join(' ');

    await execAsync(opensslCmd);
    
    await fs.chmod(keyPath, 0o600);
    await fs.chmod(certPath, 0o644);
  }
}

export default router;
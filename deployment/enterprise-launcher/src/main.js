const { app, BrowserWindow, Menu, shell, ipcMain, dialog, powerMonitor, screen } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const { spawn, exec } = require('child_process');
const fs = require('fs').promises;
const os = require('os');
const si = require('systeminformation');
const portfinder = require('portfinder');
const checkDiskSpace = require('check-disk-space').default;
const winston = require('winston');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Global variables
let mainWindow;
let splashWindow;
let serverProcesses = {};
let deploymentConfig = {};
let systemInfo = {};
let isDeploymentActive = false;

// Environment configuration
const isDev = process.env.NODE_ENV === 'development';
const APP_DATA_PATH = path.join(os.homedir(), '.terrafusion-enterprise');
const LOGS_PATH = path.join(APP_DATA_PATH, 'logs');
const CONFIG_PATH = path.join(APP_DATA_PATH, 'config');

// Logging configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'terrafusion-launcher' },
  transports: [
    new winston.transports.File({ filename: path.join(LOGS_PATH, 'error.log'), level: 'error' }),
    new winston.transports.File({ filename: path.join(LOGS_PATH, 'combined.log') }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Initialize application directories
async function initializeDirectories() {
  try {
    await fs.mkdir(APP_DATA_PATH, { recursive: true });
    await fs.mkdir(LOGS_PATH, { recursive: true });
    await fs.mkdir(CONFIG_PATH, { recursive: true });
    logger.info('Application directories initialized');
  } catch (error) {
    logger.error('Failed to initialize directories:', error);
  }
}

// System information gathering
async function gatherSystemInfo() {
  try {
    const [cpu, mem, osInfo, graphics, network, diskSpace] = await Promise.all([
      si.cpu(),
      si.mem(),
      si.osInfo(),
      si.graphics(),
      si.networkInterfaces(),
      checkDiskSpace(os.homedir())
    ]);

    systemInfo = {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      electronVersion: process.versions.electron,
      cpu: {
        manufacturer: cpu.manufacturer,
        brand: cpu.brand,
        cores: cpu.cores,
        physicalCores: cpu.physicalCores,
        speed: cpu.speed
      },
      memory: {
        total: Math.round(mem.total / 1024 / 1024 / 1024) + ' GB',
        available: Math.round(mem.available / 1024 / 1024 / 1024) + ' GB',
        used: Math.round(mem.used / 1024 / 1024 / 1024) + ' GB'
      },
      os: {
        platform: osInfo.platform,
        distro: osInfo.distro,
        release: osInfo.release,
        codename: osInfo.codename,
        kernel: osInfo.kernel,
        arch: osInfo.arch
      },
      graphics: graphics.controllers.map(gpu => ({
        vendor: gpu.vendor,
        model: gpu.model,
        vram: gpu.vram
      })),
      network: network.filter(iface => !iface.internal).map(iface => ({
        iface: iface.iface,
        type: iface.type,
        ip4: iface.ip4,
        ip6: iface.ip6
      })),
      diskSpace: {
        free: Math.round(diskSpace.free / 1024 / 1024 / 1024) + ' GB',
        size: Math.round(diskSpace.size / 1024 / 1024 / 1024) + ' GB'
      }
    };

    logger.info('System information gathered successfully');
    return systemInfo;
  } catch (error) {
    logger.error('Failed to gather system information:', error);
    return {};
  }
}

// Create splash screen
function createSplashWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  
  splashWindow = new BrowserWindow({
    width: 500,
    height: 350,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
    resizable: false,
    x: Math.round((width - 500) / 2),
    y: Math.round((height - 350) / 2),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  splashWindow.loadFile(path.join(__dirname, 'views', 'splash.html'));
  
  splashWindow.on('closed', () => {
    splashWindow = null;
  });
}

// Create main application window
function createMainWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  
  mainWindow = new BrowserWindow({
    width: Math.min(1600, width - 100),
    height: Math.min(1000, height - 100),
    minWidth: 1200,
    minHeight: 800,
    show: false,
    icon: path.join(__dirname, '..', 'assets', 'icons', 'icon.png'),
    titleBarStyle: 'default',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'views', 'launcher.html'));

  mainWindow.once('ready-to-show', () => {
    if (splashWindow) {
      splashWindow.close();
    }
    mainWindow.show();
    
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    stopAllServices();
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Prevent navigation to external sites
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    if (parsedUrl.origin !== 'file://') {
      event.preventDefault();
    }
  });
}

// Port management
async function findAvailablePort(startPort = 8000) {
  try {
    portfinder.basePort = startPort;
    const port = await portfinder.getPortPromise();
    logger.info(`Found available port: ${port}`);
    return port;
  } catch (error) {
    logger.error('Failed to find available port:', error);
    throw error;
  }
}

// Service management
async function startTerraFusionService(config = {}) {
  try {
    const port = await findAvailablePort(8000);
    const resourcePath = isDev 
      ? path.join(__dirname, '..', '..', '..')
      : path.join(process.resourcesPath, 'terrafusion-app');

    logger.info(`Starting TerraFusion service on port ${port}`);
    
    const serverProcess = spawn('npm', ['run', 'dev'], {
      cwd: resourcePath,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        PORT: port,
        NODE_ENV: 'production',
        ELECTRON_DEPLOYMENT: 'true',
        ...config.env
      }
    });

    serverProcess.stdout.on('data', (data) => {
      const message = data.toString();
      logger.info(`TerraFusion stdout: ${message}`);
      
      if (mainWindow) {
        mainWindow.webContents.send('service-log', {
          service: 'terrafusion',
          level: 'info',
          message: message.trim(),
          timestamp: new Date().toISOString()
        });
      }
    });

    serverProcess.stderr.on('data', (data) => {
      const message = data.toString();
      logger.error(`TerraFusion stderr: ${message}`);
      
      if (mainWindow) {
        mainWindow.webContents.send('service-log', {
          service: 'terrafusion',
          level: 'error',
          message: message.trim(),
          timestamp: new Date().toISOString()
        });
      }
    });

    serverProcess.on('close', (code) => {
      logger.info(`TerraFusion process exited with code ${code}`);
      delete serverProcesses.terrafusion;
      
      if (mainWindow) {
        mainWindow.webContents.send('service-status', {
          service: 'terrafusion',
          status: 'stopped',
          code
        });
      }
    });

    serverProcesses.terrafusion = {
      process: serverProcess,
      port,
      status: 'starting',
      config
    };

    // Wait for service to be ready
    await waitForServiceReady(`http://localhost:${port}/api/health`, 60000);
    
    serverProcesses.terrafusion.status = 'running';
    
    if (mainWindow) {
      mainWindow.webContents.send('service-status', {
        service: 'terrafusion',
        status: 'running',
        port,
        url: `http://localhost:${port}`
      });
    }

    logger.info('TerraFusion service started successfully');
    return { port, url: `http://localhost:${port}` };
    
  } catch (error) {
    logger.error('Failed to start TerraFusion service:', error);
    throw error;
  }
}

// Wait for service to be ready
async function waitForServiceReady(url, timeout = 30000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      const response = await axios.get(url, { timeout: 2000 });
      if (response.status === 200) {
        return true;
      }
    } catch (error) {
      // Service not ready yet, continue waiting
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  throw new Error(`Service at ${url} failed to become ready within ${timeout}ms`);
}

// Stop all running services
function stopAllServices() {
  Object.keys(serverProcesses).forEach(serviceName => {
    const service = serverProcesses[serviceName];
    if (service.process && !service.process.killed) {
      logger.info(`Stopping service: ${serviceName}`);
      service.process.kill('SIGTERM');
      
      // Force kill if it doesn't stop gracefully
      setTimeout(() => {
        if (!service.process.killed) {
          service.process.kill('SIGKILL');
        }
      }, 5000);
    }
  });
  
  serverProcesses = {};
}

// Deployment orchestration
async function executeDeployment(config) {
  isDeploymentActive = true;
  deploymentConfig = config;
  
  const deploymentId = uuidv4();
  logger.info(`Starting deployment ${deploymentId} with config:`, config);

  try {
    // Deployment steps
    const steps = [
      { id: 'validation', name: 'System Validation', weight: 10 },
      { id: 'preparation', name: 'Environment Preparation', weight: 15 },
      { id: 'services', name: 'Starting Core Services', weight: 25 },
      { id: 'database', name: 'Database Initialization', weight: 20 },
      { id: 'ai-agents', name: 'AI Agent Deployment', weight: 15 },
      { id: 'testing', name: 'Health Checks', weight: 10 },
      { id: 'finalization', name: 'Deployment Finalization', weight: 5 }
    ];

    let currentProgress = 0;
    
    for (const step of steps) {
      if (!isDeploymentActive) {
        throw new Error('Deployment cancelled by user');
      }

      if (mainWindow) {
        mainWindow.webContents.send('deployment-step', {
          deploymentId,
          step: step.id,
          name: step.name,
          status: 'running',
          progress: currentProgress
        });
      }

      await executeDeploymentStep(step, config, deploymentId);
      
      currentProgress += step.weight;
      
      if (mainWindow) {
        mainWindow.webContents.send('deployment-step', {
          deploymentId,
          step: step.id,
          name: step.name,
          status: 'completed',
          progress: currentProgress
        });
      }
    }

    // Deployment completed successfully
    if (mainWindow) {
      mainWindow.webContents.send('deployment-completed', {
        deploymentId,
        status: 'success',
        services: Object.keys(serverProcesses).map(name => ({
          name,
          status: serverProcesses[name].status,
          port: serverProcesses[name].port,
          url: `http://localhost:${serverProcesses[name].port}`
        }))
      });
    }

    logger.info(`Deployment ${deploymentId} completed successfully`);
    
  } catch (error) {
    logger.error(`Deployment ${deploymentId} failed:`, error);
    
    if (mainWindow) {
      mainWindow.webContents.send('deployment-failed', {
        deploymentId,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
    
    // Cleanup on failure
    stopAllServices();
  } finally {
    isDeploymentActive = false;
  }
}

// Execute individual deployment step
async function executeDeploymentStep(step, config, deploymentId) {
  logger.info(`Executing deployment step: ${step.id}`);
  
  switch (step.id) {
    case 'validation':
      await validateSystemRequirements();
      break;
      
    case 'preparation':
      await prepareEnvironment(config);
      break;
      
    case 'services':
      await startTerraFusionService(config);
      break;
      
    case 'database':
      await initializeDatabase(config);
      break;
      
    case 'ai-agents':
      await deployAIAgents(config);
      break;
      
    case 'testing':
      await performHealthChecks();
      break;
      
    case 'finalization':
      await finalizeDeployment(config, deploymentId);
      break;
      
    default:
      throw new Error(`Unknown deployment step: ${step.id}`);
  }
  
  // Simulate step execution time
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
}

// System validation
async function validateSystemRequirements() {
  const requirements = {
    minMemory: 4 * 1024 * 1024 * 1024, // 4GB
    minDiskSpace: 10 * 1024 * 1024 * 1024, // 10GB
    requiredPorts: [8000, 8001, 8002]
  };

  // Check memory
  const mem = await si.mem();
  if (mem.total < requirements.minMemory) {
    throw new Error(`Insufficient memory. Required: 4GB, Available: ${Math.round(mem.total / 1024 / 1024 / 1024)}GB`);
  }

  // Check disk space
  const diskSpace = await checkDiskSpace(os.homedir());
  if (diskSpace.free < requirements.minDiskSpace) {
    throw new Error(`Insufficient disk space. Required: 10GB, Available: ${Math.round(diskSpace.free / 1024 / 1024 / 1024)}GB`);
  }

  logger.info('System validation completed successfully');
}

// Environment preparation
async function prepareEnvironment(config) {
  // Create necessary directories
  await initializeDirectories();
  
  // Save deployment configuration
  await fs.writeFile(
    path.join(CONFIG_PATH, 'deployment.json'),
    JSON.stringify(config, null, 2)
  );
  
  logger.info('Environment preparation completed');
}

// Database initialization
async function initializeDatabase(config) {
  // Simulate database initialization
  logger.info('Initializing database...');
  
  // In a real implementation, this would:
  // - Check for existing database
  // - Run migrations
  // - Set up initial data
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  logger.info('Database initialization completed');
}

// AI Agents deployment
async function deployAIAgents(config) {
  logger.info('Deploying AI agents...');
  
  // In a real implementation, this would:
  // - Start AI agent services
  // - Load AI models
  // - Configure agent coordination
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  logger.info('AI agents deployment completed');
}

// Health checks
async function performHealthChecks() {
  logger.info('Performing health checks...');
  
  for (const serviceName of Object.keys(serverProcesses)) {
    const service = serverProcesses[serviceName];
    try {
      await axios.get(`http://localhost:${service.port}/api/health`, { timeout: 5000 });
      logger.info(`Health check passed for ${serviceName}`);
    } catch (error) {
      throw new Error(`Health check failed for ${serviceName}: ${error.message}`);
    }
  }
  
  logger.info('All health checks completed successfully');
}

// Finalize deployment
async function finalizeDeployment(config, deploymentId) {
  logger.info('Finalizing deployment...');
  
  // Save deployment record
  const deploymentRecord = {
    id: deploymentId,
    timestamp: new Date().toISOString(),
    config,
    services: Object.keys(serverProcesses).map(name => ({
      name,
      port: serverProcesses[name].port,
      status: serverProcesses[name].status
    })),
    systemInfo
  };
  
  await fs.writeFile(
    path.join(CONFIG_PATH, `deployment-${deploymentId}.json`),
    JSON.stringify(deploymentRecord, null, 2)
  );
  
  logger.info('Deployment finalization completed');
}

// Create application menu
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Deployment',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-action', 'new-deployment');
            }
          }
        },
        {
          label: 'Load Configuration',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openFile'],
              filters: [
                { name: 'JSON Config', extensions: ['json'] }
              ]
            });
            
            if (!result.canceled && result.filePaths.length > 0) {
              try {
                const configData = await fs.readFile(result.filePaths[0], 'utf8');
                const config = JSON.parse(configData);
                
                if (mainWindow) {
                  mainWindow.webContents.send('load-configuration', config);
                }
              } catch (error) {
                dialog.showErrorBox('Error', `Failed to load configuration: ${error.message}`);
              }
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => app.quit()
        }
      ]
    },
    {
      label: 'Services',
      submenu: [
        {
          label: 'Start All Services',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-action', 'start-services');
            }
          }
        },
        {
          label: 'Stop All Services',
          click: () => {
            stopAllServices();
            if (mainWindow) {
              mainWindow.webContents.send('menu-action', 'services-stopped');
            }
          }
        },
        {
          label: 'Restart Services',
          click: () => {
            stopAllServices();
            setTimeout(() => {
              if (mainWindow) {
                mainWindow.webContents.send('menu-action', 'restart-services');
              }
            }, 2000);
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About TerraFusion Enterprise',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About TerraFusion Enterprise',
              message: 'TerraFusion Enterprise Launcher v2.0.0',
              detail: 'Enterprise-Grade Property Valuation Platform\nOne-Click Deployment System'
            });
          }
        },
        {
          label: 'Documentation',
          click: () => {
            shell.openExternal('https://docs.terrafusion.com');
          }
        },
        {
          label: 'Check for Updates',
          click: () => {
            autoUpdater.checkForUpdatesAndNotify();
          }
        }
      ]
    }
  ];

  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC handlers
function setupIpcHandlers() {
  ipcMain.handle('get-system-info', async () => {
    return await gatherSystemInfo();
  });

  ipcMain.handle('start-deployment', async (event, config) => {
    if (isDeploymentActive) {
      throw new Error('Deployment already in progress');
    }
    
    await executeDeployment(config);
    return { success: true };
  });

  ipcMain.handle('cancel-deployment', async () => {
    isDeploymentActive = false;
    stopAllServices();
    return { success: true };
  });

  ipcMain.handle('get-service-status', async () => {
    return Object.keys(serverProcesses).map(name => ({
      name,
      status: serverProcesses[name].status,
      port: serverProcesses[name].port,
      url: `http://localhost:${serverProcesses[name].port}`
    }));
  });

  ipcMain.handle('open-service', async (event, serviceName) => {
    const service = serverProcesses[serviceName];
    if (service && service.port) {
      shell.openExternal(`http://localhost:${service.port}`);
      return { success: true };
    }
    throw new Error(`Service ${serviceName} not found or not running`);
  });

  ipcMain.handle('get-logs', async (event, service, lines = 100) => {
    try {
      const logFile = path.join(LOGS_PATH, service ? `${service}.log` : 'combined.log');
      const data = await fs.readFile(logFile, 'utf8');
      const logLines = data.split('\n').slice(-lines);
      return logLines;
    } catch (error) {
      logger.error('Failed to read logs:', error);
      return [];
    }
  });

  ipcMain.handle('export-configuration', async (event, config) => {
    const result = await dialog.showSaveDialog(mainWindow, {
      filters: [
        { name: 'JSON Config', extensions: ['json'] }
      ],
      defaultPath: 'terrafusion-config.json'
    });
    
    if (!result.canceled) {
      await fs.writeFile(result.filePath, JSON.stringify(config, null, 2));
      return { success: true, path: result.filePath };
    }
    
    return { success: false };
  });
}

// Auto-updater events
autoUpdater.on('checking-for-update', () => {
  logger.info('Checking for update...');
});

autoUpdater.on('update-available', (info) => {
  logger.info('Update available:', info);
});

autoUpdater.on('update-not-available', (info) => {
  logger.info('Update not available');
});

autoUpdater.on('error', (err) => {
  logger.error('Error in auto-updater:', err);
});

autoUpdater.on('download-progress', (progressObj) => {
  const log_message = `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}% (${progressObj.transferred}/${progressObj.total})`;
  logger.info(log_message);
});

autoUpdater.on('update-downloaded', (info) => {
  logger.info('Update downloaded');
  autoUpdater.quitAndInstall();
});

// Application event handlers
app.whenReady().then(async () => {
  await initializeDirectories();
  await gatherSystemInfo();
  
  createSplashWindow();
  createMenu();
  setupIpcHandlers();
  
  // Show splash for a minimum time to display branding
  setTimeout(() => {
    createMainWindow();
  }, 3000);

  // Check for updates
  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    stopAllServices();
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

app.on('before-quit', () => {
  stopAllServices();
});

// Handle power events
powerMonitor.on('suspend', () => {
  logger.info('System is going to sleep');
  // Optionally pause services
});

powerMonitor.on('resume', () => {
  logger.info('System resumed from sleep');
  // Optionally resume services
});

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, focus our window instead
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// Export for testing
module.exports = {
  startTerraFusionService,
  stopAllServices,
  executeDeployment,
  gatherSystemInfo
};
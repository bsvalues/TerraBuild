const { app, BrowserWindow, Menu, shell, ipcMain, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const { spawn } = require('child_process');
const fetch = require('node-fetch');

let mainWindow;
let serverProcess;
let splashWindow;

const isDev = process.env.NODE_ENV === 'development';
const serverPort = process.env.PORT || 5000;

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  splashWindow.loadFile(path.join(__dirname, 'renderer', 'splash.html'));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    show: false,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

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
    if (serverProcess) {
      serverProcess.kill();
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

async function startServer() {
  return new Promise((resolve, reject) => {
    const serverPath = isDev 
      ? path.join(__dirname, '..', '..', 'server') 
      : path.join(process.resourcesPath, 'app', 'server');
    
    serverProcess = spawn('npm', ['run', 'start'], {
      cwd: serverPath,
      stdio: 'pipe',
      env: { ...process.env, PORT: serverPort }
    });

    serverProcess.stdout.on('data', (data) => {
      console.log(`Server: ${data}`);
      if (data.toString().includes('serving on port')) {
        resolve();
      }
    });

    serverProcess.stderr.on('data', (data) => {
      console.error(`Server Error: ${data}`);
    });

    serverProcess.on('close', (code) => {
      console.log(`Server process exited with code ${code}`);
      if (code !== 0) {
        reject(new Error(`Server failed to start with code ${code}`));
      }
    });

    setTimeout(() => {
      reject(new Error('Server startup timeout'));
    }, 30000);
  });
}

async function waitForServer() {
  const maxAttempts = 30;
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`http://localhost:${serverPort}/api/health`);
      if (response.ok) {
        return true;
      }
    } catch (error) {
      console.log(`Waiting for server... attempt ${attempts + 1}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    attempts++;
  }
  
  throw new Error('Server failed to respond');
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Project',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-action', 'new-project');
          }
        },
        {
          label: 'Open Project',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openDirectory'],
              title: 'Select Project Directory'
            });
            
            if (!result.canceled) {
              mainWindow.webContents.send('menu-action', 'open-project', result.filePaths[0]);
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
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
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About TerraFusion',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About TerraFusion Enterprise',
              message: 'TerraFusion Enterprise v1.0.0',
              detail: 'AI-Powered Geospatial Property Valuation Platform\nBuilt for County Governments'
            });
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

app.whenReady().then(async () => {
  createSplashWindow();
  createMenu();
  
  try {
    await startServer();
    await waitForServer();
    
    createWindow();
    mainWindow.loadURL(`http://localhost:${serverPort}`);
    
    autoUpdater.checkForUpdatesAndNotify();
  } catch (error) {
    console.error('Failed to start application:', error);
    dialog.showErrorBox('Startup Error', `Failed to start TerraFusion: ${error.message}`);
    app.quit();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

autoUpdater.on('checking-for-update', () => {
  console.log('Checking for update...');
});

autoUpdater.on('update-available', (info) => {
  console.log('Update available.');
});

autoUpdater.on('update-not-available', (info) => {
  console.log('Update not available.');
});

autoUpdater.on('error', (err) => {
  console.log('Error in auto-updater. ' + err);
});

autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
  console.log(log_message);
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('Update downloaded');
  autoUpdater.quitAndInstall();
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('restart-app', () => {
  app.relaunch();
  app.exit();
});
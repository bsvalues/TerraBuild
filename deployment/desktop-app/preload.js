const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  restartApp: () => ipcRenderer.invoke('restart-app'),
  
  onMenuAction: (callback) => {
    ipcRenderer.on('menu-action', (event, action, data) => {
      callback(action, data);
    });
  },
  
  removeMenuActionListener: () => {
    ipcRenderer.removeAllListeners('menu-action');
  },
  
  platform: process.platform,
  
  openExternal: (url) => {
    ipcRenderer.send('open-external', url);
  }
});

window.addEventListener('DOMContentLoaded', () => {
  console.log('TerraFusion Desktop Application Loaded');
});
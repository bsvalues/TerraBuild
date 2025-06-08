const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // System information
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  
  // Deployment management
  startDeployment: (config) => ipcRenderer.invoke('start-deployment', config),
  cancelDeployment: () => ipcRenderer.invoke('cancel-deployment'),
  
  // Service management
  getServiceStatus: () => ipcRenderer.invoke('get-service-status'),
  openService: (serviceName) => ipcRenderer.invoke('open-service', serviceName),
  
  // Logging
  getLogs: (service, lines) => ipcRenderer.invoke('get-logs', service, lines),
  
  // Configuration
  exportConfiguration: (config) => ipcRenderer.invoke('export-configuration', config),
  
  // Event listeners
  onServiceLog: (callback) => ipcRenderer.on('service-log', callback),
  onServiceStatus: (callback) => ipcRenderer.on('service-status', callback),
  onDeploymentStep: (callback) => ipcRenderer.on('deployment-step', callback),
  onDeploymentCompleted: (callback) => ipcRenderer.on('deployment-completed', callback),
  onDeploymentFailed: (callback) => ipcRenderer.on('deployment-failed', callback),
  onMenuAction: (callback) => ipcRenderer.on('menu-action', callback),
  onLoadConfiguration: (callback) => ipcRenderer.on('load-configuration', callback),
  
  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
  
  // App information
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  restartApp: () => ipcRenderer.invoke('restart-app'),
  
  // Utility functions
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),
  showErrorBox: (title, content) => ipcRenderer.invoke('show-error-box', title, content)
});
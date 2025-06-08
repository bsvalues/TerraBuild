/**
 * TerraFusion Enterprise Launcher JavaScript
 * Handles all UI interactions and deployment orchestration
 */

class TerraFusionLauncher {
    constructor() {
        this.currentScreen = 'welcome-screen';
        this.deploymentState = {
            active: false,
            progress: 0,
            currentStep: null,
            steps: []
        };
        this.systemInfo = {};
        this.services = [];
        this.logEntries = [];
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.setupElectronListeners();
        await this.loadSystemInfo();
        this.updateSystemStatus();
        
        // Initialize the welcome screen
        this.showScreen('welcome-screen');
    }

    setupEventListeners() {
        // Navigation buttons
        document.getElementById('quick-deploy-btn')?.addEventListener('click', () => {
            this.startQuickDeployment();
        });
        
        document.getElementById('custom-deploy-btn')?.addEventListener('click', () => {
            this.showScreen('config-screen');
        });
        
        document.getElementById('back-btn')?.addEventListener('click', () => {
            this.showScreen('welcome-screen');
        });
        
        // Configuration form
        document.getElementById('deployment-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.startCustomDeployment();
        });
        
        document.getElementById('save-config-btn')?.addEventListener('click', () => {
            this.saveConfiguration();
        });
        
        // Progress screen controls
        document.getElementById('cancel-deployment-btn')?.addEventListener('click', () => {
            this.cancelDeployment();
        });
        
        document.getElementById('clear-log-btn')?.addEventListener('click', () => {
            this.clearLog();
        });
        
        // Success screen actions
        document.getElementById('open-app-btn')?.addEventListener('click', () => {
            this.openApplication();
        });
        
        document.getElementById('new-deployment-btn')?.addEventListener('click', () => {
            this.showScreen('welcome-screen');
        });
        
        // Header controls
        document.getElementById('refresh-btn')?.addEventListener('click', () => {
            this.refreshSystemInfo();
        });
        
        // Footer controls
        document.getElementById('view-logs-btn')?.addEventListener('click', () => {
            this.viewLogs();
        });
        
        document.getElementById('services-btn')?.addEventListener('click', () => {
            this.toggleServicesPanel();
        });
        
        document.getElementById('settings-btn')?.addEventListener('click', () => {
            this.openSettings();
        });
        
        // Services panel
        document.getElementById('close-services-btn')?.addEventListener('click', () => {
            this.closeServicesPanel();
        });
    }

    setupElectronListeners() {
        if (window.electronAPI) {
            // Listen for service logs
            window.electronAPI.onServiceLog((event, logData) => {
                this.addLogEntry(logData);
            });
            
            // Listen for service status updates
            window.electronAPI.onServiceStatus((event, statusData) => {
                this.updateServiceStatus(statusData);
            });
            
            // Listen for deployment progress
            window.electronAPI.onDeploymentStep((event, stepData) => {
                this.updateDeploymentProgress(stepData);
            });
            
            // Listen for deployment completion
            window.electronAPI.onDeploymentCompleted((event, completionData) => {
                this.handleDeploymentSuccess(completionData);
            });
            
            // Listen for deployment failure
            window.electronAPI.onDeploymentFailed((event, errorData) => {
                this.handleDeploymentFailure(errorData);
            });
            
            // Listen for menu actions
            window.electronAPI.onMenuAction((event, action, data) => {
                this.handleMenuAction(action, data);
            });
            
            // Listen for configuration loading
            window.electronAPI.onLoadConfiguration((event, config) => {
                this.loadConfiguration(config);
            });
        }
    }

    async loadSystemInfo() {
        try {
            if (window.electronAPI) {
                this.systemInfo = await window.electronAPI.getSystemInfo();
                this.updateSystemInfoDisplay();
                this.updateSystemStatus('online');
            }
        } catch (error) {
            console.error('Failed to load system info:', error);
            this.updateSystemStatus('error');
        }
    }

    updateSystemInfoDisplay() {
        const platformInfo = document.getElementById('platform-info');
        const memoryInfo = document.getElementById('memory-info');
        const storageInfo = document.getElementById('storage-info');
        const networkInfo = document.getElementById('network-info');

        if (platformInfo && this.systemInfo.platform) {
            platformInfo.textContent = `${this.systemInfo.os?.platform || this.systemInfo.platform} ${this.systemInfo.arch}`;
        }
        
        if (memoryInfo && this.systemInfo.memory) {
            memoryInfo.textContent = `${this.systemInfo.memory.available} / ${this.systemInfo.memory.total}`;
        }
        
        if (storageInfo && this.systemInfo.diskSpace) {
            storageInfo.textContent = `${this.systemInfo.diskSpace.free} free`;
        }
        
        if (networkInfo && this.systemInfo.network?.length > 0) {
            const activeInterface = this.systemInfo.network.find(iface => iface.ip4) || this.systemInfo.network[0];
            networkInfo.textContent = activeInterface ? `${activeInterface.type} - ${activeInterface.ip4 || 'No IP'}` : 'No network';
        }
    }

    updateSystemStatus(status = 'online') {
        const statusElement = document.getElementById('system-status');
        if (!statusElement) return;

        const indicator = statusElement.querySelector('.status-indicator');
        const text = statusElement.querySelector('span');
        
        if (indicator) {
            indicator.className = `status-indicator ${status}`;
        }
        
        if (text) {
            const statusText = {
                online: 'System Ready',
                offline: 'System Offline',
                error: 'System Error',
                warning: 'System Warning'
            };
            text.textContent = statusText[status] || 'Unknown Status';
        }
    }

    async refreshSystemInfo() {
        this.updateSystemStatus('warning');
        await this.loadSystemInfo();
        await this.refreshServices();
    }

    async refreshServices() {
        try {
            if (window.electronAPI) {
                this.services = await window.electronAPI.getServiceStatus();
                this.updateServicesDisplay();
            }
        } catch (error) {
            console.error('Failed to refresh services:', error);
        }
    }

    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show target screen
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenId;
        }
    }

    async startQuickDeployment() {
        const defaultConfig = {
            deploymentType: 'local',
            appName: 'TerraFusion Enterprise',
            port: 5000,
            environment: 'production',
            enableSSL: false,
            enableMonitoring: true,
            enableAIAgents: true,
            enableBackup: false,
            enableAnalytics: false
        };
        
        await this.executeDeployment(defaultConfig);
    }

    async startCustomDeployment() {
        const form = document.getElementById('deployment-form');
        const formData = new FormData(form);
        
        const config = {
            deploymentType: formData.get('deployment-type'),
            appName: formData.get('app-name'),
            port: parseInt(formData.get('port')),
            domain: formData.get('domain'),
            environment: formData.get('environment'),
            enableSSL: formData.has('enable-ssl'),
            enableMonitoring: formData.has('enable-monitoring'),
            enableAIAgents: formData.has('enable-ai-agents'),
            enableBackup: formData.has('enable-backup'),
            enableAnalytics: formData.has('enable-analytics')
        };
        
        await this.executeDeployment(config);
    }

    async executeDeployment(config) {
        this.deploymentState.active = true;
        this.deploymentState.progress = 0;
        this.deploymentState.config = config;
        
        this.showScreen('progress-screen');
        this.initializeDeploymentSteps();
        
        try {
            if (window.electronAPI) {
                await window.electronAPI.startDeployment(config);
            } else {
                // Fallback for testing without Electron
                await this.simulateDeployment(config);
            }
        } catch (error) {
            console.error('Deployment failed:', error);
            this.handleDeploymentFailure({ error: error.message });
        }
    }

    initializeDeploymentSteps() {
        const steps = [
            { id: 'validation', name: 'System Validation', status: 'pending' },
            { id: 'preparation', name: 'Environment Preparation', status: 'pending' },
            { id: 'services', name: 'Starting Core Services', status: 'pending' },
            { id: 'database', name: 'Database Initialization', status: 'pending' },
            { id: 'ai-agents', name: 'AI Agent Deployment', status: 'pending' },
            { id: 'testing', name: 'Health Checks', status: 'pending' },
            { id: 'finalization', name: 'Deployment Finalization', status: 'pending' }
        ];
        
        this.deploymentState.steps = steps;
        this.renderDeploymentSteps();
        this.addLogEntry({
            level: 'info',
            message: 'Deployment started',
            timestamp: new Date().toISOString()
        });
    }

    renderDeploymentSteps() {
        const container = document.getElementById('deployment-steps');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.deploymentState.steps.forEach((step, index) => {
            const stepElement = document.createElement('div');
            stepElement.className = 'step-item';
            stepElement.innerHTML = `
                <div class="step-icon ${step.status}">
                    ${index + 1}
                </div>
                <div class="step-content">
                    <div class="step-name">${step.name}</div>
                    <div class="step-description">${this.getStepDescription(step.id)}</div>
                </div>
            `;
            container.appendChild(stepElement);
        });
    }

    getStepDescription(stepId) {
        const descriptions = {
            validation: 'Checking system requirements and prerequisites',
            preparation: 'Setting up deployment environment and configuration',
            services: 'Launching TerraFusion application services',
            database: 'Initializing database and running migrations',
            'ai-agents': 'Deploying and configuring AI analysis agents',
            testing: 'Running health checks and validation tests',
            finalization: 'Completing deployment and cleanup'
        };
        return descriptions[stepId] || 'Processing step...';
    }

    updateDeploymentProgress(stepData) {
        const { step, status, progress } = stepData;
        
        // Update step status
        const stepIndex = this.deploymentState.steps.findIndex(s => s.id === step);
        if (stepIndex !== -1) {
            this.deploymentState.steps[stepIndex].status = status;
        }
        
        // Update overall progress
        this.deploymentState.progress = progress;
        this.updateProgressDisplay(progress, stepData.name);
        
        // Re-render steps
        this.renderDeploymentSteps();
        
        // Add log entry
        this.addLogEntry({
            level: status === 'completed' ? 'success' : 'info',
            message: `${stepData.name}: ${status}`,
            timestamp: new Date().toISOString()
        });
    }

    updateProgressDisplay(progress, stepName) {
        const progressPercentage = document.getElementById('progress-percentage');
        const progressStep = document.getElementById('progress-step');
        const progressRing = document.querySelector('.progress-ring');
        
        if (progressPercentage) {
            progressPercentage.textContent = `${Math.round(progress)}%`;
        }
        
        if (progressStep) {
            progressStep.textContent = stepName || 'Processing...';
        }
        
        if (progressRing) {
            const circumference = 2 * Math.PI * 90; // radius = 90
            const strokeDashoffset = circumference - (progress / 100) * circumference;
            progressRing.style.strokeDashoffset = strokeDashoffset;
        }
        
        // Update subtitle
        const subtitle = document.getElementById('progress-subtitle');
        if (subtitle) {
            if (progress < 100) {
                subtitle.textContent = `Step ${Math.floor(progress / 14.3) + 1} of 7: ${stepName || 'Processing...'}`;
            } else {
                subtitle.textContent = 'Deployment completed successfully!';
            }
        }
    }

    async simulateDeployment(config) {
        // Simulate deployment for testing without Electron
        const steps = this.deploymentState.steps;
        
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            const progress = ((i + 1) / steps.length) * 100;
            
            this.updateDeploymentProgress({
                step: step.id,
                name: step.name,
                status: 'running',
                progress: Math.floor(progress * 0.8) // 80% when running
            });
            
            // Simulate processing time
            await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
            
            this.updateDeploymentProgress({
                step: step.id,
                name: step.name,
                status: 'completed',
                progress: Math.floor(progress)
            });
        }
        
        // Simulate successful completion
        setTimeout(() => {
            this.handleDeploymentSuccess({
                deploymentId: 'sim-' + Date.now(),
                services: [
                    { name: 'terrafusion', status: 'running', port: 5000, url: 'http://localhost:5000' }
                ]
            });
        }, 1000);
    }

    handleDeploymentSuccess(completionData) {
        this.deploymentState.active = false;
        this.services = completionData.services || [];
        
        this.showScreen('success-screen');
        this.renderDeploymentSummary(completionData);
        
        this.addLogEntry({
            level: 'success',
            message: 'Deployment completed successfully',
            timestamp: new Date().toISOString()
        });
    }

    handleDeploymentFailure(errorData) {
        this.deploymentState.active = false;
        
        this.addLogEntry({
            level: 'error',
            message: `Deployment failed: ${errorData.error}`,
            timestamp: new Date().toISOString()
        });
        
        // Show error dialog or update UI to show failure state
        alert(`Deployment failed: ${errorData.error}`);
        this.showScreen('welcome-screen');
    }

    renderDeploymentSummary(completionData) {
        const container = document.getElementById('deployment-summary');
        if (!container) return;
        
        const config = this.deploymentState.config;
        const services = completionData.services || [];
        
        container.innerHTML = `
            <div class="summary-item">
                <span class="summary-label">Application Name</span>
                <span class="summary-value">${config.appName}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Deployment Type</span>
                <span class="summary-value">${config.deploymentType}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Environment</span>
                <span class="summary-value">${config.environment}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Services Running</span>
                <span class="summary-value">${services.length} service${services.length !== 1 ? 's' : ''}</span>
            </div>
            ${services.map(service => `
                <div class="summary-item">
                    <span class="summary-label">${service.name}</span>
                    <span class="summary-value">
                        <a href="${service.url}" class="btn-link">Open ${service.url}</a>
                    </span>
                </div>
            `).join('')}
        `;
    }

    async cancelDeployment() {
        if (!this.deploymentState.active) return;
        
        if (confirm('Are you sure you want to cancel the deployment?')) {
            try {
                if (window.electronAPI) {
                    await window.electronAPI.cancelDeployment();
                }
                
                this.deploymentState.active = false;
                this.addLogEntry({
                    level: 'warning',
                    message: 'Deployment cancelled by user',
                    timestamp: new Date().toISOString()
                });
                
                this.showScreen('welcome-screen');
            } catch (error) {
                console.error('Failed to cancel deployment:', error);
            }
        }
    }

    async openApplication() {
        if (this.services.length > 0) {
            const mainService = this.services.find(s => s.name === 'terrafusion') || this.services[0];
            if (window.electronAPI) {
                try {
                    await window.electronAPI.openService(mainService.name);
                } catch (error) {
                    console.error('Failed to open service:', error);
                }
            } else {
                // Fallback to opening URL
                window.open(mainService.url, '_blank');
            }
        }
    }

    async saveConfiguration() {
        const form = document.getElementById('deployment-form');
        const formData = new FormData(form);
        
        const config = {
            deploymentType: formData.get('deployment-type'),
            appName: formData.get('app-name'),
            port: parseInt(formData.get('port')),
            domain: formData.get('domain'),
            environment: formData.get('environment'),
            enableSSL: formData.has('enable-ssl'),
            enableMonitoring: formData.has('enable-monitoring'),
            enableAIAgents: formData.has('enable-ai-agents'),
            enableBackup: formData.has('enable-backup'),
            enableAnalytics: formData.has('enable-analytics')
        };
        
        try {
            if (window.electronAPI) {
                const result = await window.electronAPI.exportConfiguration(config);
                if (result.success) {
                    alert(`Configuration saved to: ${result.path}`);
                }
            } else {
                // Fallback for web
                const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'terrafusion-config.json';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('Failed to save configuration:', error);
            alert('Failed to save configuration');
        }
    }

    loadConfiguration(config) {
        const form = document.getElementById('deployment-form');
        if (!form) return;
        
        // Populate form fields
        Object.keys(config).forEach(key => {
            const field = form.querySelector(`[name="${key}"]`);
            if (field) {
                if (field.type === 'checkbox') {
                    field.checked = config[key];
                } else if (field.type === 'radio') {
                    const radio = form.querySelector(`[name="${key}"][value="${config[key]}"]`);
                    if (radio) radio.checked = true;
                } else {
                    field.value = config[key];
                }
            }
        });
        
        this.showScreen('config-screen');
    }

    addLogEntry(logData) {
        const { level, message, timestamp } = logData;
        this.logEntries.push({ level, message, timestamp });
        
        const container = document.getElementById('deployment-log');
        if (!container) return;
        
        const logElement = document.createElement('div');
        logElement.className = `log-entry ${level}`;
        
        const time = new Date(timestamp).toLocaleTimeString();
        logElement.innerHTML = `
            <span class="log-time">[${time}]</span>
            <span class="log-message">${message}</span>
        `;
        
        container.appendChild(logElement);
        container.scrollTop = container.scrollHeight;
        
        // Limit log entries to prevent memory issues
        if (this.logEntries.length > 1000) {
            this.logEntries = this.logEntries.slice(-500);
            const logElements = container.children;
            while (logElements.length > 500) {
                container.removeChild(logElements[0]);
            }
        }
    }

    clearLog() {
        this.logEntries = [];
        const container = document.getElementById('deployment-log');
        if (container) {
            container.innerHTML = '';
        }
    }

    updateServiceStatus(statusData) {
        const { service, status, port, url } = statusData;
        
        const serviceIndex = this.services.findIndex(s => s.name === service);
        if (serviceIndex !== -1) {
            this.services[serviceIndex] = { ...this.services[serviceIndex], status, port, url };
        } else {
            this.services.push({ name: service, status, port, url });
        }
        
        this.updateServicesDisplay();
    }

    updateServicesDisplay() {
        const container = document.getElementById('services-list');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.services.forEach(service => {
            const serviceElement = document.createElement('div');
            serviceElement.className = 'service-item';
            serviceElement.innerHTML = `
                <div class="service-header">
                    <span class="service-name">${service.name}</span>
                    <span class="service-status ${service.status}">${service.status}</span>
                </div>
                <div class="service-info">
                    ${service.port ? `Port: ${service.port}` : ''}
                    ${service.url ? `<br>URL: ${service.url}` : ''}
                </div>
                <div class="service-actions">
                    ${service.status === 'running' ? `
                        <button class="btn-primary" onclick="launcher.openService('${service.name}')">Open</button>
                    ` : ''}
                    <button class="btn-secondary" onclick="launcher.restartService('${service.name}')">Restart</button>
                </div>
            `;
            container.appendChild(serviceElement);
        });
    }

    async openService(serviceName) {
        try {
            if (window.electronAPI) {
                await window.electronAPI.openService(serviceName);
            }
        } catch (error) {
            console.error('Failed to open service:', error);
        }
    }

    async restartService(serviceName) {
        // Implement service restart logic
        console.log(`Restarting service: ${serviceName}`);
    }

    toggleServicesPanel() {
        const panel = document.getElementById('services-panel');
        if (panel) {
            panel.classList.toggle('open');
            if (panel.classList.contains('open')) {
                this.refreshServices();
            }
        }
    }

    closeServicesPanel() {
        const panel = document.getElementById('services-panel');
        if (panel) {
            panel.classList.remove('open');
        }
    }

    viewLogs() {
        // Implement log viewer
        console.log('Opening log viewer...');
    }

    openSettings() {
        // Implement settings dialog
        console.log('Opening settings...');
    }

    handleMenuAction(action, data) {
        switch (action) {
            case 'new-deployment':
                this.showScreen('welcome-screen');
                break;
            case 'start-services':
                // Handle start services
                break;
            case 'services-stopped':
                this.services = [];
                this.updateServicesDisplay();
                break;
            case 'restart-services':
                // Handle restart services
                break;
            default:
                console.log('Unknown menu action:', action);
        }
    }
}

// Initialize the launcher when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.launcher = new TerraFusionLauncher();
});
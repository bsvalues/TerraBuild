/**
 * TerraFusion Desktop Deployment Manager - Renderer Process
 * Enterprise-grade user interface controller
 */

class TerraFusionDeploymentUI {
  constructor() {
    this.currentScreen = 'welcome-screen';
    this.deploymentConfig = {};
    this.systemInfo = {};
    this.prerequisites = {};
    this.deploymentSteps = [];
    this.currentStepIndex = 0;
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadSystemInfo();
    this.showScreen('welcome-screen');
  }

  setupEventListeners() {
    // Welcome screen actions
    document.getElementById('start-deployment-btn').addEventListener('click', () => {
      this.showConfigurationScreen();
    });

    document.getElementById('check-prerequisites-btn').addEventListener('click', () => {
      this.checkSystemPrerequisites();
    });

    // Configuration screen actions
    document.getElementById('deployment-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.startDeploymentProcess();
    });

    document.getElementById('back-to-welcome').addEventListener('click', () => {
      this.showScreen('welcome-screen');
    });

    // Progress screen actions
    document.getElementById('cancel-deployment').addEventListener('click', () => {
      this.cancelDeployment();
    });

    // Success screen actions
    document.getElementById('open-app').addEventListener('click', () => {
      this.openApplicationURL();
    });

    document.getElementById('open-monitoring').addEventListener('click', () => {
      this.openMonitoringURL();
    });

    document.getElementById('new-deployment').addEventListener('click', () => {
      this.resetToWelcome();
    });

    // IPC event listeners
    window.electronAPI?.on('system-info', (info) => {
      this.systemInfo = info;
      this.displaySystemInfo();
    });

    window.electronAPI?.on('deployment-progress', (data) => {
      this.updateDeploymentProgress(data);
    });

    window.electronAPI?.on('deployment-complete', (urls) => {
      this.showDeploymentSuccess(urls);
    });

    window.electronAPI?.on('deployment-error', (error) => {
      this.handleDeploymentError(error);
    });

    window.electronAPI?.on('deployment-cancelled', () => {
      this.handleDeploymentCancellation();
    });
  }

  async loadSystemInfo() {
    try {
      if (window.electronAPI?.invoke) {
        this.systemInfo = await window.electronAPI.invoke('get-system-info');
        this.displaySystemInfo();
      }
    } catch (error) {
      console.error('Failed to load system info:', error);
    }
  }

  displaySystemInfo() {
    const container = document.getElementById('system-info');
    if (!container) return;

    const infoItems = [
      { label: 'Operating System', value: this.formatPlatform(this.systemInfo.platform) },
      { label: 'Architecture', value: this.systemInfo.arch },
      { label: 'CPU Cores', value: this.systemInfo.cpus },
      { label: 'Memory', value: `${this.systemInfo.memory} GB` },
      { label: 'Hostname', value: this.systemInfo.hostname },
      { label: 'User', value: this.systemInfo.user },
      { label: 'Node.js', value: this.systemInfo.node }
    ];

    container.innerHTML = infoItems.map(item => `
      <div class="info-item">
        <span class="info-label">${item.label}</span>
        <span class="info-value">${item.value}</span>
      </div>
    `).join('');
  }

  formatPlatform(platform) {
    const platforms = {
      'win32': 'Windows',
      'darwin': 'macOS',
      'linux': 'Linux'
    };
    return platforms[platform] || platform;
  }

  async checkSystemPrerequisites() {
    const button = document.getElementById('check-prerequisites-btn');
    const originalText = button.innerHTML;
    
    button.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" class="animate-spin">
        <path d="M12 4V2A10 10 0 0 0 2 12h2a8 8 0 0 1 8-8z"/>
      </svg>
      Checking...
    `;
    button.disabled = true;

    try {
      if (window.electronAPI?.invoke) {
        this.prerequisites = await window.electronAPI.invoke('check-prerequisites');
        this.displayPrerequisitesModal();
      }
    } catch (error) {
      console.error('Failed to check prerequisites:', error);
      this.showErrorModal('Failed to check system prerequisites');
    } finally {
      button.innerHTML = originalText;
      button.disabled = false;
    }
  }

  displayPrerequisitesModal() {
    const modal = this.createModal('System Prerequisites Check', `
      <div class="prerequisites-grid">
        ${Object.entries(this.prerequisites).map(([tool, installed]) => `
          <div class="prerequisite-item ${installed ? 'installed' : 'missing'}">
            <div class="prerequisite-icon">
              ${installed ? '✓' : '✗'}
            </div>
            <div class="prerequisite-info">
              <span class="prerequisite-name">${this.formatToolName(tool)}</span>
              <span class="prerequisite-status">${installed ? 'Installed' : 'Not Found'}</span>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="prerequisites-summary">
        <p>
          ${Object.values(this.prerequisites).every(Boolean) 
            ? 'All prerequisites are installed. You can proceed with deployment.' 
            : 'Some prerequisites are missing. Please install them before proceeding.'}
        </p>
      </div>
    `);

    document.body.appendChild(modal);
  }

  formatToolName(tool) {
    const names = {
      docker: 'Docker',
      node: 'Node.js',
      git: 'Git',
      kubectl: 'Kubernetes CLI',
      helm: 'Helm',
      terraform: 'Terraform'
    };
    return names[tool] || tool;
  }

  showConfigurationScreen() {
    this.showScreen('config-screen');
  }

  async startDeploymentProcess() {
    const formData = new FormData(document.getElementById('deployment-form'));
    this.deploymentConfig = Object.fromEntries(formData.entries());
    
    // Collect checkbox values
    const checkboxes = document.querySelectorAll('#deployment-form input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      this.deploymentConfig[checkbox.name] = checkbox.checked;
    });

    this.showScreen('progress-screen');
    this.initializeProgressScreen();

    try {
      if (window.electronAPI?.invoke) {
        await window.electronAPI.invoke('start-deployment', this.deploymentConfig);
      }
    } catch (error) {
      console.error('Failed to start deployment:', error);
      this.handleDeploymentError({ message: error.message, step: 'init' });
    }
  }

  initializeProgressScreen() {
    this.deploymentSteps = [
      { id: 'init', name: 'Initializing Deployment', progress: 0, status: 'pending' },
      { id: 'environment', name: 'Setting Up Environment', progress: 0, status: 'pending' },
      { id: 'dependencies', name: 'Installing Dependencies', progress: 0, status: 'pending' },
      { id: 'database', name: 'Configuring Database', progress: 0, status: 'pending' },
      { id: 'build', name: 'Building Application', progress: 0, status: 'pending' },
      { id: 'docker', name: 'Creating Docker Images', progress: 0, status: 'pending' },
      { id: 'cloud', name: 'Deploying to Cloud', progress: 0, status: 'pending' },
      { id: 'ssl', name: 'Configuring SSL/TLS', progress: 0, status: 'pending' },
      { id: 'monitoring', name: 'Setting Up Monitoring', progress: 0, status: 'pending' },
      { id: 'complete', name: 'Deployment Complete', progress: 0, status: 'pending' }
    ];

    this.renderDeploymentSteps();
    this.updateProgressCircle(0);
  }

  renderDeploymentSteps() {
    const container = document.getElementById('deployment-steps');
    if (!container) return;

    container.innerHTML = this.deploymentSteps.map((step, index) => `
      <div class="step-item ${step.status}" data-step="${step.id}">
        <div class="step-icon">${index + 1}</div>
        <div class="step-content">
          <div class="step-title">${step.name}</div>
          <div class="step-description">
            ${step.status === 'active' ? 'In progress...' : 
              step.status === 'completed' ? 'Completed successfully' : 
              'Pending...'}
          </div>
        </div>
        <div class="step-progress">
          <div class="step-progress-bar">
            <div class="step-progress-fill" style="width: ${step.progress}%"></div>
          </div>
        </div>
      </div>
    `).join('');
  }

  updateDeploymentProgress(data) {
    const { currentStep, progress, message, steps } = data;
    
    // Update overall progress
    this.updateProgressCircle(progress);
    document.getElementById('progress-subtitle').textContent = message;
    
    // Update step status
    if (steps) {
      this.deploymentSteps = steps.map((step, index) => ({
        ...step,
        status: index < data.stepIndex ? 'completed' : 
                index === data.stepIndex ? 'active' : 'pending'
      }));
      this.renderDeploymentSteps();
    }

    // Add log entry
    this.addLogEntry(message);
  }

  updateProgressCircle(percentage) {
    const circle = document.querySelector('.progress-ring-progress');
    const text = document.getElementById('progress-percentage');
    const step = document.getElementById('progress-step');
    
    if (circle && text) {
      const circumference = 339.29;
      const offset = circumference - (percentage / 100) * circumference;
      circle.style.strokeDashoffset = offset;
      text.textContent = `${Math.round(percentage)}%`;
    }

    if (step) {
      const currentStepData = this.deploymentSteps.find(s => s.status === 'active');
      step.textContent = currentStepData ? currentStepData.name : 'Processing...';
    }
  }

  addLogEntry(message) {
    const container = document.getElementById('deployment-log');
    if (!container) return;

    const timestamp = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `
      <span class="log-time">[${timestamp}]</span>
      <span class="log-message">${message}</span>
    `;

    container.appendChild(entry);
    container.scrollTop = container.scrollHeight;
  }

  showDeploymentSuccess(urls) {
    this.showScreen('success-screen');
    
    if (urls.url) {
      document.getElementById('app-url').textContent = urls.url;
    }
    if (urls.adminUrl) {
      document.getElementById('admin-url').textContent = urls.adminUrl;
    }
    if (urls.monitoring) {
      document.getElementById('monitoring-url').textContent = urls.monitoring;
    }
  }

  handleDeploymentError(error) {
    this.showErrorModal(`Deployment failed at step: ${error.step}`, error.message);
  }

  handleDeploymentCancellation() {
    this.showInfoModal('Deployment Cancelled', 'The deployment process has been cancelled.');
    setTimeout(() => {
      this.showScreen('welcome-screen');
    }, 2000);
  }

  async cancelDeployment() {
    if (confirm('Are you sure you want to cancel the deployment?')) {
      try {
        if (window.electronAPI?.invoke) {
          await window.electronAPI.invoke('cancel-deployment');
        }
      } catch (error) {
        console.error('Failed to cancel deployment:', error);
      }
    }
  }

  async openApplicationURL() {
    const url = document.getElementById('app-url').textContent;
    if (window.electronAPI?.invoke) {
      await window.electronAPI.invoke('open-external', url);
    }
  }

  async openMonitoringURL() {
    const url = document.getElementById('monitoring-url').textContent;
    if (window.electronAPI?.invoke) {
      await window.electronAPI.invoke('open-external', url);
    }
  }

  resetToWelcome() {
    this.showScreen('welcome-screen');
    this.deploymentConfig = {};
    this.deploymentSteps = [];
    this.currentStepIndex = 0;
    
    // Reset form
    document.getElementById('deployment-form').reset();
    
    // Clear log
    const logContainer = document.getElementById('deployment-log');
    if (logContainer) {
      logContainer.innerHTML = `
        <div class="log-entry">
          <span class="log-time">[00:00:00]</span>
          <span class="log-message">Deployment manager initialized</span>
        </div>
      `;
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

  createModal(title, content) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-container">
        <div class="modal-header">
          <h3>${title}</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-content">
          ${content}
        </div>
        <div class="modal-actions">
          <button class="btn-secondary modal-close">Close</button>
        </div>
      </div>
    `;

    // Add close functionality
    modal.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => {
        document.body.removeChild(modal);
      });
    });

    // Close on overlay click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });

    return modal;
  }

  showErrorModal(title, message) {
    const modal = this.createModal(title, `
      <div class="error-content">
        <div class="error-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        <p class="error-message">${message}</p>
      </div>
    `);

    document.body.appendChild(modal);
  }

  showInfoModal(title, message) {
    const modal = this.createModal(title, `
      <div class="info-content">
        <div class="info-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
          </svg>
        </div>
        <p class="info-message">${message}</p>
      </div>
    `);

    document.body.appendChild(modal);
  }
}

// Utility function for copying to clipboard
window.copyToClipboard = async (elementId) => {
  const element = document.getElementById(elementId);
  if (element) {
    try {
      await navigator.clipboard.writeText(element.textContent);
      
      // Show feedback
      const button = element.nextElementSibling;
      if (button && button.classList.contains('btn-copy')) {
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        button.style.background = 'var(--success-color)';
        button.style.color = 'white';
        
        setTimeout(() => {
          button.textContent = originalText;
          button.style.background = '';
          button.style.color = '';
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }
};

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new TerraFusionDeploymentUI();
});

// Add modal styles to the page
const modalStyles = `
<style>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-container {
  background: var(--surface-dark);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  min-width: 400px;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: var(--shadow-large);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  margin: 0;
  color: var(--text-primary);
  font-size: 1.25rem;
  font-weight: 600;
}

.modal-close {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: var(--transition);
}

.modal-close:hover {
  background: var(--surface-light);
  color: var(--text-primary);
}

.modal-content {
  padding: 2rem;
}

.modal-actions {
  padding: 1rem 2rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
}

.prerequisites-grid {
  display: grid;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.prerequisite-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--surface-light);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
}

.prerequisite-item.installed {
  border-color: var(--success-color);
  background: rgba(16, 185, 129, 0.1);
}

.prerequisite-item.missing {
  border-color: var(--error-color);
  background: rgba(239, 68, 68, 0.1);
}

.prerequisite-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
}

.prerequisite-item.installed .prerequisite-icon {
  background: var(--success-color);
  color: white;
}

.prerequisite-item.missing .prerequisite-icon {
  background: var(--error-color);
  color: white;
}

.prerequisite-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.prerequisite-name {
  font-weight: 600;
  color: var(--text-primary);
}

.prerequisite-status {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.prerequisites-summary {
  padding: 1rem;
  background: var(--background-dark);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
}

.prerequisites-summary p {
  margin: 0;
  color: var(--text-secondary);
}

.error-content, .info-content {
  text-align: center;
}

.error-icon, .info-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 1rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-icon {
  background: var(--error-color);
  color: white;
}

.info-icon {
  background: var(--primary-color);
  color: var(--background-dark);
}

.error-message, .info-message {
  color: var(--text-secondary);
  line-height: 1.6;
}

.step-progress {
  width: 100px;
  margin-left: auto;
}

.step-progress-bar {
  width: 100%;
  height: 4px;
  background: var(--surface-light);
  border-radius: 2px;
  overflow: hidden;
}

.step-progress-fill {
  height: 100%;
  background: var(--primary-color);
  transition: width 0.3s ease;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', modalStyles);
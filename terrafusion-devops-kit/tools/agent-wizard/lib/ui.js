/**
 * UI Components for the Agent Configuration Wizard
 */

import chalk from 'chalk';
import terminalLink from 'terminal-link';

/**
 * Print the TerraFusion ASCII logo
 */
export function printLogo() {
  console.log(chalk.cyan(`
  ████████╗███████╗██████╗ ██████╗  █████╗ ███████╗██╗   ██╗███████╗██╗ ██████╗ ███╗   ██╗
  ╚══██╔══╝██╔════╝██╔══██╗██╔══██╗██╔══██╗██╔════╝██║   ██║██╔════╝██║██╔═══██╗████╗  ██║
     ██║   █████╗  ██████╔╝██████╔╝███████║█████╗  ██║   ██║███████╗██║██║   ██║██╔██╗ ██║
     ██║   ██╔══╝  ██╔══██╗██╔══██╗██╔══██║██╔══╝  ██║   ██║╚════██║██║██║   ██║██║╚██╗██║
     ██║   ███████╗██║  ██║██║  ██║██║  ██║██║     ╚██████╔╝███████║██║╚██████╔╝██║ ╚████║
     ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝      ╚═════╝ ╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝
                         █████╗  ██████╗ ███████╗███╗   ██╗████████╗ ██████╗████████╗██╗     
                        ██╔══██╗██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝██╔════╝╚══██╔══╝██║     
                        ███████║██║  ███╗█████╗  ██╔██╗ ██║   ██║   ██║        ██║   ██║     
                        ██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ██║   ██║        ██║   ██║     
                        ██║  ██║╚██████╔╝███████╗██║ ╚████║   ██║   ╚██████╗   ██║   ███████╗
                        ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝    ╚═════╝   ╚═╝   ╚══════╝
                                         ██╗    ██╗██╗███████╗ █████╗ ██████╗ ██████╗ 
                                         ██║    ██║██║╚══███╔╝██╔══██╗██╔══██╗██╔══██╗
                                         ██║ █╗ ██║██║  ███╔╝ ███████║██████╔╝██║  ██║
                                         ██║███╗██║██║ ███╔╝  ██╔══██║██╔══██╗██║  ██║
                                         ╚███╔███╔╝██║███████╗██║  ██║██║  ██║██████╔╝
                                          ╚══╝╚══╝ ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ 
`));
}

/**
 * Show a welcome message with links to documentation
 */
export function showWelcomeMessage() {
  const docsLink = terminalLink('online documentation', 'https://docs.terrafusion.io/agent-config');
  const supportLink = terminalLink('contact support', 'mailto:support@terrafusion.io');
  
  console.log(chalk.bold('Welcome to the TerraFusion Agent Configuration Wizard!'));
  console.log('This tool helps you configure and manage AI agents in the TerraFusion platform.');
  console.log(`For more information, see the ${docsLink} or ${supportLink}.\n`);
}

/**
 * Format a mode description with icon
 * @param {string} mode - Agent mode
 * @returns {string} - Formatted mode with icon
 */
export function formatMode(mode) {
  const icons = {
    autonomous: '🤖',
    suggestive: '💡',
    watchdog: '🔍',
    collaborative: '👥'
  };
  
  return `${icons[mode] || '➡️'} ${mode}`;
}

/**
 * Format agent status with color
 * @param {string} status - Agent status
 * @returns {string} - Colored status
 */
export function formatStatus(status) {
  const colors = {
    active: chalk.green('● Active'),
    inactive: chalk.gray('○ Inactive'),
    error: chalk.red('✖ Error'),
    warning: chalk.yellow('⚠ Warning'),
    running: chalk.blue('⟳ Running')
  };
  
  return colors[status.toLowerCase()] || status;
}

/**
 * Format a time duration in a human-readable format
 * @param {number} seconds - Duration in seconds
 * @returns {string} - Formatted duration
 */
export function formatDuration(seconds) {
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
}

/**
 * Format memory size in a human-readable format
 * @param {number} bytes - Size in bytes
 * @returns {string} - Formatted size
 */
export function formatBytes(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  } else if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  } else {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
}

/**
 * Format a cron expression in a more human-readable format
 * @param {string} cronExpression - Cron expression
 * @returns {string} - Human-readable schedule
 */
export function formatCron(cronExpression) {
  const parts = cronExpression.split(' ');
  if (parts.length !== 5) {
    return cronExpression;
  }
  
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
  
  // Some common patterns
  if (minute === '0' && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return 'Every hour at minute 0';
  }
  
  if (minute === '0' && hour === '0' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return 'Daily at midnight';
  }
  
  if (minute === '0' && hour === '0' && dayOfMonth === '*' && month === '*' && dayOfWeek === '0') {
    return 'Every Sunday at midnight';
  }
  
  if (minute.startsWith('*/')) {
    const interval = minute.substring(2);
    return `Every ${interval} minutes`;
  }
  
  if (hour.startsWith('*/')) {
    const interval = hour.substring(2);
    return `Every ${interval} hours at minute ${minute}`;
  }
  
  // Fallback to the original expression
  return cronExpression;
}

/**
 * Format sensitivity level with color
 * @param {string} level - Sensitivity level
 * @returns {string} - Colored sensitivity level
 */
export function formatSensitivity(level) {
  const colors = {
    low: chalk.green('⬇️ Low'),
    medium: chalk.blue('➡️ Medium'),
    high: chalk.red('⬆️ High')
  };
  
  return colors[level.toLowerCase()] || level;
}

/**
 * Format an anomaly handling strategy with icon
 * @param {string} strategy - Anomaly handling strategy
 * @returns {string} - Formatted strategy with icon
 */
export function formatAnomalyStrategy(strategy) {
  const icons = {
    'suggest_correction': '💬',
    'log_and_notify': '📝',
    'auto_correct': '🔄'
  };
  
  const formatted = strategy.replace(/_/g, ' ');
  return `${icons[strategy] || '⚙️'} ${formatted}`;
}
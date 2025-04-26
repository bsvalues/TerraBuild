/**
 * DORA Metrics Collection Script for BCBS Application
 * 
 * This script collects and reports DORA (DevOps Research and Assessment) metrics:
 * 1. Deployment Frequency
 * 2. Lead Time for Changes
 * 3. Mean Time to Restore (MTTR)
 * 4. Change Failure Rate
 * 
 * Usage:
 *   node scripts/collect-dora-metrics.js [options]
 * 
 * Options:
 *   --days=N      Number of days to look back (default: 30)
 *   --format=fmt  Output format: json, csv, or console (default: console)
 *   --output=file Output file path (default: dora-metrics.json or dora-metrics.csv)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  if (arg.includes('=')) {
    const [key, value] = arg.split('=');
    acc[key.replace('--', '')] = value;
  } else if (arg.startsWith('--')) {
    acc[arg.replace('--', '')] = true;
  }
  return acc;
}, {});

// Default configuration
const config = {
  days: parseInt(args.days || '30', 10),
  format: args.format || 'console',
  output: args.output || (args.format === 'csv' ? 'dora-metrics.csv' : 'dora-metrics.json'),
};

/**
 * Get deployment frequency data
 * @returns {Object} Deployment frequency data
 */
function getDeploymentFrequency() {
  try {
    // In a real implementation, this would query deployment data from GitHub, 
    // AWS deployments, or other deployment sources
    
    // Mock data for illustration
    return {
      total: 24,
      perDay: 0.8,
      frequency: 'Multiple times per week', // Could be: multiple times per day, daily, weekly, monthly
      trend: '+5% from previous period',
      data: [
        { date: '2025-04-25', count: 1 },
        { date: '2025-04-24', count: 2 },
        { date: '2025-04-23', count: 0 },
        // Additional data points...
      ]
    };
  } catch (error) {
    console.error('Error retrieving deployment frequency:', error.message);
    return {
      total: 0,
      perDay: 0,
      frequency: 'Unknown',
      trend: 'N/A',
      data: []
    };
  }
}

/**
 * Get lead time for changes data
 * @returns {Object} Lead time data
 */
function getLeadTimeForChanges() {
  try {
    // In a real implementation, this would calculate time from commit to deployment
    // by querying git commit history and deployment timestamps
    
    // Mock data for illustration
    return {
      averageHours: 18.5,
      medianHours: 12.3,
      p90Hours: 48.2, // 90th percentile
      trend: '-10% from previous period',
      data: [
        { prId: 'PR-123', commitToMergeHours: 8.2, mergeToDeployHours: 2.5 },
        { prId: 'PR-124', commitToMergeHours: 24.1, mergeToDeployHours: 1.0 },
        // Additional data points...
      ]
    };
  } catch (error) {
    console.error('Error retrieving lead time for changes:', error.message);
    return {
      averageHours: 0,
      medianHours: 0,
      p90Hours: 0,
      trend: 'N/A',
      data: []
    };
  }
}

/**
 * Get mean time to restore (MTTR) data
 * @returns {Object} MTTR data
 */
function getMeanTimeToRestore() {
  try {
    // In a real implementation, this would calculate time from incident to restoration
    // by querying incident tracking systems
    
    // Mock data for illustration
    return {
      averageMinutes: 45.2,
      medianMinutes: 32.5,
      p90Minutes: 120.0, // 90th percentile
      trend: '-15% from previous period',
      data: [
        { incidentId: 'INC-001', durationMinutes: 25, severity: 'medium' },
        { incidentId: 'INC-002', durationMinutes: 120, severity: 'high' },
        // Additional data points...
      ]
    };
  } catch (error) {
    console.error('Error retrieving mean time to restore:', error.message);
    return {
      averageMinutes: 0,
      medianMinutes: 0,
      p90Minutes: 0,
      trend: 'N/A',
      data: []
    };
  }
}

/**
 * Get change failure rate data
 * @returns {Object} Change failure rate data
 */
function getChangeFailureRate() {
  try {
    // In a real implementation, this would calculate failure rate
    // by comparing failed deployments to total deployments
    
    // Mock data for illustration
    return {
      rate: 8.3, // percentage
      failedDeployments: 2,
      totalDeployments: 24,
      trend: '+2% from previous period',
      data: [
        { deploymentId: 'DEPLOY-123', status: 'success', date: '2025-04-25' },
        { deploymentId: 'DEPLOY-124', status: 'failed', date: '2025-04-24', reason: 'Integration test failure' },
        // Additional data points...
      ]
    };
  } catch (error) {
    console.error('Error retrieving change failure rate:', error.message);
    return {
      rate: 0,
      failedDeployments: 0,
      totalDeployments: 0,
      trend: 'N/A',
      data: []
    };
  }
}

/**
 * Collect DORA metrics
 */
function collectMetrics() {
  console.log(`Collecting DORA metrics for the past ${config.days} days...`);
  
  const metrics = {
    timestamp: new Date().toISOString(),
    period: {
      days: config.days,
      start: new Date(Date.now() - (config.days * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    },
    deploymentFrequency: getDeploymentFrequency(),
    leadTimeForChanges: getLeadTimeForChanges(),
    meanTimeToRestore: getMeanTimeToRestore(),
    changeFailureRate: getChangeFailureRate(),
  };
  
  // Add performance classification based on DORA research
  metrics.classification = {
    deploymentFrequency: classifyDeploymentFrequency(metrics.deploymentFrequency.perDay),
    leadTimeForChanges: classifyLeadTime(metrics.leadTimeForChanges.averageHours),
    meanTimeToRestore: classifyMTTR(metrics.meanTimeToRestore.averageMinutes),
    changeFailureRate: classifyChangeFailureRate(metrics.changeFailureRate.rate),
    overall: 'Medium' // This would be calculated based on all metrics
  };
  
  return metrics;
}

/**
 * Classify deployment frequency according to DORA standards
 */
function classifyDeploymentFrequency(deploymentsPerDay) {
  if (deploymentsPerDay >= 1) return 'Elite';
  if (deploymentsPerDay >= 1/7) return 'High';
  if (deploymentsPerDay >= 1/30) return 'Medium';
  return 'Low';
}

/**
 * Classify lead time according to DORA standards
 */
function classifyLeadTime(leadTimeHours) {
  if (leadTimeHours <= 24) return 'Elite';
  if (leadTimeHours <= 24*7) return 'High';
  if (leadTimeHours <= 24*30) return 'Medium';
  return 'Low';
}

/**
 * Classify MTTR according to DORA standards
 */
function classifyMTTR(mttrMinutes) {
  if (mttrMinutes <= 60) return 'Elite';
  if (mttrMinutes <= 60*24) return 'High';
  if (mttrMinutes <= 60*24*7) return 'Medium';
  return 'Low';
}

/**
 * Classify change failure rate according to DORA standards
 */
function classifyChangeFailureRate(changeFailureRate) {
  if (changeFailureRate <= 15) return 'Elite';
  if (changeFailureRate <= 20) return 'High';
  if (changeFailureRate <= 30) return 'Medium';
  return 'Low';
}

/**
 * Output metrics in the requested format
 */
function outputMetrics(metrics) {
  switch (config.format) {
    case 'json':
      fs.writeFileSync(
        config.output,
        JSON.stringify(metrics, null, 2)
      );
      console.log(`Metrics saved to ${config.output}`);
      break;
      
    case 'csv':
      const csvHeader = 'Metric,Value,Classification,Trend\n';
      const csvRows = [
        `"Deployment Frequency",${metrics.deploymentFrequency.perDay},${metrics.classification.deploymentFrequency},${metrics.deploymentFrequency.trend}`,
        `"Lead Time for Changes (hours)",${metrics.leadTimeForChanges.averageHours},${metrics.classification.leadTimeForChanges},${metrics.leadTimeForChanges.trend}`,
        `"Mean Time to Restore (minutes)",${metrics.meanTimeToRestore.averageMinutes},${metrics.classification.meanTimeToRestore},${metrics.meanTimeToRestore.trend}`,
        `"Change Failure Rate (%)",${metrics.changeFailureRate.rate},${metrics.classification.changeFailureRate},${metrics.changeFailureRate.trend}`,
        `"Overall Classification",,"${metrics.classification.overall}",`
      ].join('\n');
      
      fs.writeFileSync(
        config.output,
        csvHeader + csvRows
      );
      console.log(`Metrics saved to ${config.output}`);
      break;
      
    case 'console':
    default:
      console.log('\nDORA Metrics Summary:');
      console.log('====================');
      console.log(`Period: ${metrics.period.start} to ${metrics.period.end} (${config.days} days)`);
      console.log('\n1. Deployment Frequency:');
      console.log(`   Value: ${metrics.deploymentFrequency.perDay.toFixed(2)} deployments per day (${metrics.deploymentFrequency.total} total)`);
      console.log(`   Classification: ${metrics.classification.deploymentFrequency}`);
      console.log(`   Trend: ${metrics.deploymentFrequency.trend}`);
      
      console.log('\n2. Lead Time for Changes:');
      console.log(`   Value: ${metrics.leadTimeForChanges.averageHours.toFixed(1)} hours (average)`);
      console.log(`   Classification: ${metrics.classification.leadTimeForChanges}`);
      console.log(`   Trend: ${metrics.leadTimeForChanges.trend}`);
      
      console.log('\n3. Mean Time to Restore:');
      console.log(`   Value: ${metrics.meanTimeToRestore.averageMinutes.toFixed(1)} minutes (average)`);
      console.log(`   Classification: ${metrics.classification.meanTimeToRestore}`);
      console.log(`   Trend: ${metrics.meanTimeToRestore.trend}`);
      
      console.log('\n4. Change Failure Rate:');
      console.log(`   Value: ${metrics.changeFailureRate.rate.toFixed(1)}% (${metrics.changeFailureRate.failedDeployments} of ${metrics.changeFailureRate.totalDeployments})`);
      console.log(`   Classification: ${metrics.classification.changeFailureRate}`);
      console.log(`   Trend: ${metrics.changeFailureRate.trend}`);
      
      console.log('\nOverall Classification:');
      console.log(`   ${metrics.classification.overall}`);
      break;
  }
}

// Main execution
try {
  const metrics = collectMetrics();
  outputMetrics(metrics);
} catch (error) {
  console.error('Error collecting DORA metrics:', error.message);
  process.exit(1);
}
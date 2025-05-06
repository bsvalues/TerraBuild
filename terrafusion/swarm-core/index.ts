/**
 * TerraBuild AI Swarm - Entry Point
 * 
 * This file serves as the entry point for the TerraBuild AI Swarm framework.
 * It demonstrates how to initialize the swarm and run sample tasks.
 */

import { SwarmRunner } from './SwarmRunner';

async function main() {
  console.log('Initializing TerraBuild AI Swarm framework...');
  
  // Create a swarm runner with all agents enabled
  const swarmRunner = new SwarmRunner({
    enabledAgents: [
      'factortuner',
      'benchmarkguard',
      'curvetrainer',
      'scenarioagent'
      // 'boearguer' will be added when implemented
    ],
    logLevel: 'info',
    dataPath: '../data',
    maxConcurrentTasks: 5
  });
  
  // Initialize the swarm
  const initialized = await swarmRunner.initialize();
  
  if (!initialized) {
    console.error('Failed to initialize the TerraBuild AI Swarm');
    process.exit(1);
  }
  
  console.log('TerraBuild AI Swarm initialized successfully');
  
  try {
    // Check if demo mode is requested
    const args = process.argv.slice(2);
    const demoType = args[0] || 'none';
    
    if (demoType !== 'none') {
      console.log(`Running demo workflow: ${demoType}`);
      
      // Run the requested demo workflow
      const result = await swarmRunner.runDemoWorkflow(demoType);
      
      console.log('Demo workflow completed successfully:');
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log('No demo requested. Swarm is ready for tasks.');
      console.log('Available demo types:');
      console.log('  - cost-assessment: Demonstrates cost factor tuning and validation');
      console.log('  - scenario-analysis: Demonstrates scenario creation, analysis, and comparison');
      console.log('  - sensitivity-analysis: Demonstrates cost curve training and sensitivity analysis');
      console.log('');
      console.log('Usage: ts-node index.ts [demo-type]');
    }
  } catch (error) {
    console.error('Error running demo workflow:', error);
  } finally {
    // Shutdown the swarm
    await swarmRunner.shutdown();
    console.log('TerraBuild AI Swarm shut down');
  }
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
/**
 * TerraBuild AI Agent Framework - Swarm Runner
 * 
 * This file provides a central entry point for initializing and running
 * the AI agent swarm, orchestrating all specialized agents to work together.
 */

import { SwarmCoordinator, SwarmConfig } from './SwarmCoordinator';
import { FactorTuner } from './agents/FactorTuner';
import { BenchmarkGuard } from './agents/BenchmarkGuard';
import { CurveTrainer } from './agents/CurveTrainer';
import { ScenarioAgent } from './agents/ScenarioAgent';
import { BOEArguer } from './agents/BOEArguer';

export interface SwarmRunnerConfig {
  enabledAgents: string[];
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  dataPath?: string;
  maxConcurrentTasks?: number;
  coordinatorConfig?: Partial<SwarmConfig>;
}

export class SwarmRunner {
  private coordinator: SwarmCoordinator;
  private config: SwarmRunnerConfig;
  private agentInstances: Map<string, any> = new Map();
  private isRunning: boolean = false;

  constructor(config: SwarmRunnerConfig) {
    this.config = {
      ...config,
      logLevel: config.logLevel || 'info',
      dataPath: config.dataPath || './data',
      maxConcurrentTasks: config.maxConcurrentTasks || 5
    };

    // Create coordinator with config
    const coordinatorConfig: SwarmConfig = {
      id: `terrabuild-swarm-${Date.now()}`,
      name: 'TerraBuild AI Swarm',
      description: 'AI agent swarm for infrastructure cost assessments',
      version: '3.0.0',
      parameters: {
        maxConcurrentTasks: this.config.maxConcurrentTasks,
        dataPath: this.config.dataPath,
        logLevel: this.config.logLevel,
        ...this.config.coordinatorConfig?.parameters
      }
    };

    this.coordinator = new SwarmCoordinator(coordinatorConfig);
  }

  /**
   * Initialize the swarm with all enabled agents
   */
  public async initialize(): Promise<boolean> {
    console.log(`[SwarmRunner] Initializing TerraBuild AI Swarm...`);

    try {
      // Create and register all enabled agents
      await this.initializeAgents();

      // Initialize the coordinator (which will initialize all agents)
      const success = await this.coordinator.initialize();

      if (success) {
        this.isRunning = true;
        console.log(`[SwarmRunner] TerraBuild AI Swarm initialized successfully`);
      } else {
        console.error(`[SwarmRunner] Failed to initialize TerraBuild AI Swarm`);
      }

      return success;
    } catch (error) {
      console.error(`[SwarmRunner] Error initializing TerraBuild AI Swarm:`, error);
      return false;
    }
  }

  /**
   * Shutdown the swarm
   */
  public async shutdown(): Promise<boolean> {
    console.log(`[SwarmRunner] Shutting down TerraBuild AI Swarm...`);

    try {
      const success = await this.coordinator.shutdown();
      this.isRunning = false;

      if (success) {
        console.log(`[SwarmRunner] TerraBuild AI Swarm shut down successfully`);
      } else {
        console.error(`[SwarmRunner] Failed to shut down TerraBuild AI Swarm properly`);
      }

      return success;
    } catch (error) {
      console.error(`[SwarmRunner] Error shutting down TerraBuild AI Swarm:`, error);
      return false;
    }
  }

  /**
   * Check if the swarm is running
   */
  public isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Get status of the swarm and all agents
   */
  public getStatus(): Record<string, any> {
    return this.coordinator.getStatus();
  }

  /**
   * Run a task with the specified agent
   */
  public async runAgentTask(
    agentId: string,
    taskType: string,
    taskData: Record<string, any>
  ): Promise<Record<string, any>> {
    if (!this.isRunning) {
      throw new Error('Swarm is not running');
    }

    const agent = this.coordinator.getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent with ID ${agentId} not found`);
    }

    // Submit task to agent
    const taskId = await agent.submitTask({
      type: taskType,
      priority: 'normal',
      data: taskData
    });

    // Wait for task to complete
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        const task = agent.getTask(taskId);
        if (!task) {
          clearInterval(checkInterval);
          reject(new Error(`Task ${taskId} not found`));
          return;
        }

        if (task.status === 'completed') {
          clearInterval(checkInterval);
          resolve(task.result);
        } else if (task.status === 'failed') {
          clearInterval(checkInterval);
          reject(new Error(task.error || 'Task failed'));
        }
      }, 100);
    });
  }

  /**
   * Run a composite task involving multiple agents
   */
  public async runSwarmTask(
    description: string,
    agentTasks: Record<string, {
      type: string;
      data: Record<string, any>;
      priority?: 'low' | 'normal' | 'high' | 'critical';
    }>
  ): Promise<Record<string, any>> {
    if (!this.isRunning) {
      throw new Error('Swarm is not running');
    }

    // Format agent tasks for coordinator
    const formattedTasks: Record<string, any> = {};
    
    for (const [agentId, taskConfig] of Object.entries(agentTasks)) {
      formattedTasks[agentId] = {
        type: taskConfig.type,
        priority: taskConfig.priority || 'normal',
        data: taskConfig.data
      };
    }

    // Create and submit the composite task
    const taskId = await this.coordinator.createTask(description, formattedTasks);

    // Wait for task to complete
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        const task = this.coordinator.getTask(taskId);
        if (!task) {
          clearInterval(checkInterval);
          reject(new Error(`Task ${taskId} not found`));
          return;
        }

        if (task.status === 'completed') {
          clearInterval(checkInterval);
          resolve(task.result);
        } else if (task.status === 'failed') {
          clearInterval(checkInterval);
          reject(new Error(task.error || 'Task failed'));
        }
      }, 100);
    });
  }

  /**
   * Initialize and register all enabled agents
   */
  private async initializeAgents(): Promise<void> {
    console.log(`[SwarmRunner] Creating agent instances...`);

    // Initialize each enabled agent
    for (const agentType of this.config.enabledAgents) {
      switch (agentType.toLowerCase()) {
        case 'factortuner':
          const factorTuner = new FactorTuner();
          this.agentInstances.set(factorTuner.getConfig().id, factorTuner);
          this.coordinator.registerAgent(factorTuner);
          console.log(`[SwarmRunner] Registered FactorTuner agent`);
          break;

        case 'benchmarkguard':
          const benchmarkGuard = new BenchmarkGuard();
          this.agentInstances.set(benchmarkGuard.getConfig().id, benchmarkGuard);
          this.coordinator.registerAgent(benchmarkGuard);
          console.log(`[SwarmRunner] Registered BenchmarkGuard agent`);
          break;

        case 'curvetrainer':
          const curveTrainer = new CurveTrainer();
          this.agentInstances.set(curveTrainer.getConfig().id, curveTrainer);
          this.coordinator.registerAgent(curveTrainer);
          console.log(`[SwarmRunner] Registered CurveTrainer agent`);
          break;

        case 'scenarioagent':
          const scenarioAgent = new ScenarioAgent();
          this.agentInstances.set(scenarioAgent.getConfig().id, scenarioAgent);
          this.coordinator.registerAgent(scenarioAgent);
          console.log(`[SwarmRunner] Registered ScenarioAgent agent`);
          break;

        case 'boearguer':
          const boeArguer = new BOEArguer();
          this.agentInstances.set(boeArguer.getConfig().id, boeArguer);
          this.coordinator.registerAgent(boeArguer);
          console.log(`[SwarmRunner] Registered BOEArguer agent`);
          break;

        default:
          console.warn(`[SwarmRunner] Unknown agent type: ${agentType}`);
      }
    }

    console.log(`[SwarmRunner] Created ${this.agentInstances.size} agent instances`);
  }

  /**
   * Run a predefined workflow for demonstration
   */
  public async runDemoWorkflow(demoType: string): Promise<Record<string, any>> {
    if (!this.isRunning) {
      throw new Error('Swarm is not running');
    }

    console.log(`[SwarmRunner] Running demo workflow: ${demoType}`);

    switch (demoType) {
      case 'cost-assessment':
        return this.runCostAssessmentDemo();
      
      case 'scenario-analysis':
        return this.runScenarioAnalysisDemo();
      
      case 'sensitivity-analysis':
        return this.runSensitivityAnalysisDemo();
      
      case 'boe-appeal':
        return this.runBOEAppealDemo();
      
      default:
        throw new Error(`Unknown demo type: ${demoType}`);
    }
  }

  /**
   * Run a demonstration of cost assessment workflow
   */
  private async runCostAssessmentDemo(): Promise<Record<string, any>> {
    console.log(`[SwarmRunner] Running cost assessment demo workflow`);

    // Step 1: Tune cost factors with FactorTuner
    console.log(`[SwarmRunner] Step 1: Tuning cost factors...`);
    const factorTunerResult = await this.runAgentTask('factor-tuner', 'factor:tune', {
      factorIds: ['material:concrete', 'material:steel', 'labor:carpentry', 'labor:electrical', 'equipment:excavator'],
      regionCode: 'BENTON',
      economicIndicators: {
        CPI: 310.4,
        MATERIAL_INDEX: 225.8,
        LABOR_INDEX: 195.6
      }
    });

    // Step 2: Validate results with BenchmarkGuard
    console.log(`[SwarmRunner] Step 2: Validating results...`);
    const benchmarkGuardResult = await this.runAgentTask('benchmark-guard', 'assessment:validate', {
      assessment: {
        id: 'demo_assessment',
        propertyId: 'demo_property',
        parcelNumber: 'DEMO-12345',
        buildingType: 'single_family',
        buildingSize: 2500,
        yearBuilt: 2010,
        quality: 'good',
        condition: 'good',
        region: 'BENTON',
        totalValue: 450000,
        landValue: 100000,
        improvementValue: 350000,
        assessmentDate: new Date(),
        calculationMethod: 'cost-approach'
      }
    });

    // Combine and return results
    return {
      demoType: 'cost-assessment',
      factorTuningResults: factorTunerResult,
      benchmarkResults: benchmarkGuardResult,
      summary: {
        message: 'Cost assessment demo workflow completed successfully',
        timestamp: new Date()
      }
    };
  }

  /**
   * Run a demonstration of scenario analysis workflow
   */
  private async runScenarioAnalysisDemo(): Promise<Record<string, any>> {
    console.log(`[SwarmRunner] Running scenario analysis demo workflow`);

    // Step 1: Create baseline scenario
    console.log(`[SwarmRunner] Step 1: Creating baseline scenario...`);
    const createBaselineResult = await this.runAgentTask('scenario-agent', 'scenario:create', {
      name: 'Baseline 2025 Projection',
      description: 'Standard projection based on current economic indicators',
      baselineYear: 2022,
      targetYear: 2025,
      parameters: {
        materialBaseCost: 100,
        laborBaseCost: 80,
        otherBaseCost: 50,
        projectSize: 10000
      },
      assumptions: {
        economicUncertainty: 'medium',
        materialShortageRisk: 'low',
        laborShortageRisk: 'medium'
      }
    });

    const baselineScenarioId = createBaselineResult.scenarioId;

    // Step 2: Create alternative scenario
    console.log(`[SwarmRunner] Step 2: Creating alternative scenario...`);
    const createAlternativeResult = await this.runAgentTask('scenario-agent', 'scenario:create', {
      name: 'High Inflation 2025',
      description: 'Projection assuming higher than expected inflation',
      baselineYear: 2022,
      targetYear: 2025,
      parameters: {
        materialBaseCost: 100,
        laborBaseCost: 80,
        otherBaseCost: 50,
        projectSize: 10000
      },
      assumptions: {
        materialCostIndex: 1.05,
        laborCostIndex: 1.045,
        generalInflation: 1.04,
        economicUncertainty: 'high',
        materialShortageRisk: 'medium',
        laborShortageRisk: 'medium'
      }
    });

    const alternativeScenarioId = createAlternativeResult.scenarioId;

    // Step 3: Analyze baseline scenario
    console.log(`[SwarmRunner] Step 3: Analyzing baseline scenario...`);
    await this.runAgentTask('scenario-agent', 'scenario:analyze', {
      scenarioId: baselineScenarioId,
      includeRiskAnalysis: true
    });

    // Step 4: Analyze alternative scenario
    console.log(`[SwarmRunner] Step 4: Analyzing alternative scenario...`);
    await this.runAgentTask('scenario-agent', 'scenario:analyze', {
      scenarioId: alternativeScenarioId,
      includeRiskAnalysis: true
    });

    // Step 5: Compare scenarios
    console.log(`[SwarmRunner] Step 5: Comparing scenarios...`);
    const comparisonResult = await this.runAgentTask('scenario-agent', 'scenario:compare', {
      scenarioIds: [baselineScenarioId, alternativeScenarioId],
      metrics: ['totalCost', 'costPerSquareFoot', 'materialCost', 'laborCost', 'riskScore']
    });

    // Combine and return results
    return {
      demoType: 'scenario-analysis',
      baselineScenarioId,
      alternativeScenarioId,
      comparison: comparisonResult,
      summary: {
        message: 'Scenario analysis demo workflow completed successfully',
        timestamp: new Date()
      }
    };
  }

  /**
   * Run a demonstration of sensitivity analysis workflow
   */
  private async runSensitivityAnalysisDemo(): Promise<Record<string, any>> {
    console.log(`[SwarmRunner] Running sensitivity analysis demo workflow`);

    // Step 1: Train cost curve
    console.log(`[SwarmRunner] Step 1: Training cost curve...`);
    const curveTrainingResult = await this.runAgentTask('curve-trainer', 'curve:train', {
      curveType: 'polynomial',
      inputDimension: 'size',
      outputDimension: 'actualCost',
      buildingTypes: ['single_family'],
      minDataPoints: 10,
      maxIterations: 1000,
      targetAccuracy: 0.85,
      constraints: {
        degree: 2
      }
    });

    const curveId = curveTrainingResult.curveId;

    // Step 2: Evaluate curve
    console.log(`[SwarmRunner] Step 2: Evaluating cost curve...`);
    const evaluationResult = await this.runAgentTask('curve-trainer', 'curve:evaluate', {
      curveId,
      testRatio: 0.2
    });

    // Step 3: Perform sensitivity analysis
    console.log(`[SwarmRunner] Step 3: Performing sensitivity analysis...`);
    const sensitivityFactors = [
      {
        id: 'projectSize',
        name: 'Project Size',
        baseValue: 10000,
        minValue: 5000,
        maxValue: 20000,
        stepSize: 1000,
        impact: 'high'
      },
      {
        id: 'materialCostIndex',
        name: 'Material Cost Inflation',
        baseValue: 1.02,
        minValue: 1.0,
        maxValue: 1.05,
        stepSize: 0.005,
        impact: 'high'
      },
      {
        id: 'laborCostIndex',
        name: 'Labor Cost Inflation',
        baseValue: 1.025,
        minValue: 1.01,
        maxValue: 1.05,
        stepSize: 0.005,
        impact: 'high'
      }
    ];

    // Create a scenario for sensitivity analysis
    const createScenarioResult = await this.runAgentTask('scenario-agent', 'scenario:create', {
      name: 'Sensitivity Test Scenario',
      description: 'Scenario for sensitivity analysis',
      baselineYear: 2022,
      targetYear: 2025,
      parameters: {
        materialBaseCost: 100,
        laborBaseCost: 80,
        otherBaseCost: 50,
        projectSize: 10000
      }
    });

    const scenarioId = createScenarioResult.scenarioId;

    // Analyze the scenario first
    await this.runAgentTask('scenario-agent', 'scenario:analyze', {
      scenarioId
    });

    // Perform sensitivity analysis
    const sensitivityResult = await this.runAgentTask('scenario-agent', 'sensitivity:analyze', {
      scenarioId,
      factors: sensitivityFactors,
      range: 0.2,
      steps: 5
    });

    // Combine and return results
    return {
      demoType: 'sensitivity-analysis',
      curveId,
      curveAccuracy: curveTrainingResult.accuracy,
      evaluationResults: evaluationResult,
      scenarioId,
      sensitivityResults: sensitivityResult,
      summary: {
        message: 'Sensitivity analysis demo workflow completed successfully',
        timestamp: new Date()
      }
    };
  }

  /**
   * Run a demonstration of BOE appeal argument generation workflow
   */
  private async runBOEAppealDemo(): Promise<Record<string, any>> {
    console.log(`[SwarmRunner] Running BOE appeal demo workflow`);

    // Step 1: First, analyze a case using the BOEArguer agent
    console.log(`[SwarmRunner] Step 1: Analyzing appeal case...`);
    
    const caseDetails = {
      propertyId: "BC-2025-12345",
      ownerName: "Smith Family Trust",
      currentAssessment: 575000,
      proposedAssessment: 490000,
      propertyDetails: {
        type: "single_family_residence",
        address: "1234 Vineyard View, Benton County, WA 99320",
        yearBuilt: 2005,
        squareFeet: 2850,
        lotSize: 0.35,
        features: [
          "4 bedrooms", 
          "3 bathrooms", 
          "2-car garage", 
          "partial basement with water damage",
          "outdated HVAC system",
          "cracked driveway"
        ]
      },
      comparableSales: [
        {
          address: "1342 Valley Vista Dr, Benton County, WA 99320",
          saleDate: new Date("2024-11-15"),
          salePrice: 495000,
          squareFeet: 2750,
          yearBuilt: 2007,
          distance: 0.8
        },
        {
          address: "2250 Hillside Terrace, Benton County, WA 99320",
          saleDate: new Date("2024-10-22"),
          salePrice: 512000,
          squareFeet: 3100,
          yearBuilt: 2003,
          distance: 1.2
        },
        {
          address: "875 Orchard Lane, Benton County, WA 99320",
          saleDate: new Date("2024-12-05"),
          salePrice: 479000,
          squareFeet: 2600,
          yearBuilt: 2008,
          distance: 0.5
        }
      ],
      assessorRationale: "Initial assessment based on mass appraisal model using standard condition adjustments for neighborhood and age of property.",
      appealBasis: "overvaluation"
    };

    const caseAnalysis = await this.runAgentTask('boe-arguer', 'boe:analyze-case', {
      caseDetails
    });

    // Step 2: Get relevant precedents
    console.log(`[SwarmRunner] Step 2: Finding relevant precedents...`);
    const precedents = await this.runAgentTask('boe-arguer', 'boe:find-precedents', {
      appealBasis: caseDetails.appealBasis,
      propertyType: caseDetails.propertyDetails.type
    });

    // Step 3: Get relevant statutes
    console.log(`[SwarmRunner] Step 3: Finding relevant statutes...`);
    const statutes = await this.runAgentTask('boe-arguer', 'boe:cite-statutes', {
      appealBasis: caseDetails.appealBasis
    });

    // Step 4: Generate the appeal argument
    console.log(`[SwarmRunner] Step 4: Generating appeal argument...`);
    const appealArgument = await this.runAgentTask('boe-arguer', 'boe:generate-argument', {
      caseDetails,
      desiredTone: 'professional',
      includeCitations: true,
      maxLength: 1500,
      focusAreas: [
        "Comparable sales analysis",
        "Property condition issues",
        "Proper adjustments for defects"
      ]
    });

    // Step 5: Get factor analysis from FactorTuner to support the appeal
    console.log(`[SwarmRunner] Step 5: Requesting factor analysis support...`);
    
    // Use the agent-to-agent communication capability
    // This demonstrates how BOEArguer can request assistance from another agent
    let factorAnalysis;
    try {
      // Get the BOEArguer instance
      const boeArguer = this.agentInstances.get('boe-arguer');
      
      if (boeArguer) {
        // Use the requestAgentAssistance method to get help from FactorTuner
        factorAnalysis = await boeArguer.requestAgentAssistance(
          'factor-tuner', 
          'factor:analyze',
          {
            regionCode: 'BENTON',
            factorTypes: ['condition', 'quality', 'age'],
            propertyType: caseDetails.propertyDetails.type,
            yearBuilt: caseDetails.propertyDetails.yearBuilt
          }
        );
      } else {
        factorAnalysis = { error: "BOEArguer agent not found" };
      }
    } catch (error) {
      console.error(`[SwarmRunner] Error in agent-to-agent communication:`, error);
      factorAnalysis = { error: error.message };
    }

    // Combine and return results
    return {
      demoType: 'boe-appeal',
      caseDetails,
      caseAnalysis,
      precedents,
      statutes,
      appealArgument,
      factorAnalysis,
      summary: {
        message: 'BOE appeal argument demo workflow completed successfully',
        timestamp: new Date()
      }
    };
  }
}
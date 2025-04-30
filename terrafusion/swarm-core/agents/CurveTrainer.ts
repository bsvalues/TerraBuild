/**
 * TerraBuild AI Swarm - CurveTrainer Agent
 * 
 * This specialized agent develops cost curves to accurately model non-linear
 * relationships in building costs based on various factors.
 */

import { Agent, AgentConfig, AgentTask } from '../Agent';

export interface CostCurve {
  id: string;
  name: string;
  description: string;
  type: 'linear' | 'polynomial' | 'exponential' | 'logarithmic' | 'piecewise';
  parameters: Record<string, any>;
  domain: { min: number; max: number };
  inputDimension: string;
  outputDimension: string;
  accuracy: number;
  lastUpdated: Date;
  version: number;
}

export interface CostDataPoint {
  id: string;
  buildingType: string;
  size: number;
  yearBuilt: number;
  quality: string;
  region: string;
  actualCost: number;
  predictedCost?: number;
  factorValues: Record<string, number>;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface CurveTrainingRequest {
  curveType: 'linear' | 'polynomial' | 'exponential' | 'logarithmic' | 'piecewise';
  inputDimension: string;
  outputDimension: string;
  buildingTypes?: string[];
  regions?: string[];
  minDataPoints?: number;
  maxIterations?: number;
  targetAccuracy?: number;
  constraints?: Record<string, any>;
}

export class CurveTrainer extends Agent {
  private curves: Map<string, CostCurve> = new Map();
  private dataPoints: CostDataPoint[] = [];
  private dimensionValidators: Map<string, (value: any) => boolean> = new Map();
  private trainingLogs: Map<string, Array<Record<string, any>>> = new Map();

  constructor() {
    const config: AgentConfig = {
      id: 'curve-trainer',
      name: 'CurveTrainer',
      description: 'Develops specialized cost curves to accurately model non-linear relationships in building costs',
      version: '1.0.0',
      capabilities: [
        'curve:train',
        'curve:evaluate',
        'curve:apply',
        'curve:export',
        'data:analyze'
      ]
    };
    
    super(config);
  }

  /**
   * Initialize the agent with dimension validators and load existing data
   */
  public async initialize(): Promise<boolean> {
    try {
      // Set up dimension validators
      this.setupDimensionValidators();
      
      // Load existing cost curves
      await this.loadCostCurves();
      
      // Load historical data points
      await this.loadDataPoints();
      
      return super.initialize();
    } catch (error) {
      console.error('Failed to initialize CurveTrainer agent:', error);
      return false;
    }
  }

  /**
   * Process a task submitted to the agent
   */
  protected async processTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) {
      console.error(`Task ${taskId} not found`);
      return;
    }

    try {
      // Update task status to processing
      task.status = 'processing';
      this.tasks.set(taskId, task);
      
      // Process based on task type
      switch (task.type) {
        case 'curve:train':
          await this.processTrainCurveTask(task);
          break;
        case 'curve:evaluate':
          await this.processEvaluateCurveTask(task);
          break;
        case 'curve:apply':
          await this.processApplyCurveTask(task);
          break;
        case 'curve:export':
          await this.processExportCurveTask(task);
          break;
        case 'data:analyze':
          await this.processAnalyzeDataTask(task);
          break;
        default:
          throw new Error(`Unsupported task type: ${task.type}`);
      }
    } catch (error) {
      console.error(`Error processing task ${taskId}:`, error);
      this.failTask(taskId, error.message);
    }
  }

  /**
   * Process a task to train a new cost curve
   */
  private async processTrainCurveTask(task: AgentTask): Promise<void> {
    const request = task.data as CurveTrainingRequest;
    
    // Validate the request
    if (!request.inputDimension || !request.outputDimension) {
      throw new Error('Input and output dimensions are required');
    }
    
    if (!this.dimensionValidators.has(request.inputDimension)) {
      throw new Error(`Unknown input dimension: ${request.inputDimension}`);
    }
    
    if (!this.dimensionValidators.has(request.outputDimension)) {
      throw new Error(`Unknown output dimension: ${request.outputDimension}`);
    }
    
    // Filter data points based on request parameters
    let filteredData = [...this.dataPoints];
    
    if (request.buildingTypes && request.buildingTypes.length > 0) {
      filteredData = filteredData.filter(dp => 
        request.buildingTypes!.includes(dp.buildingType)
      );
    }
    
    if (request.regions && request.regions.length > 0) {
      filteredData = filteredData.filter(dp => 
        request.regions!.includes(dp.region)
      );
    }
    
    // Check if we have enough data points
    const minDataPoints = request.minDataPoints || 10;
    if (filteredData.length < minDataPoints) {
      throw new Error(`Insufficient data points (${filteredData.length}) for training. Minimum required: ${minDataPoints}`);
    }
    
    // Train the curve
    const { curve, trainingLog } = await this.trainCurve(
      request.curveType,
      request.inputDimension,
      request.outputDimension,
      filteredData,
      request.maxIterations || 1000,
      request.targetAccuracy || 0.85,
      request.constraints
    );
    
    // Store the trained curve
    this.curves.set(curve.id, curve);
    
    // Store the training log
    this.trainingLogs.set(curve.id, trainingLog);
    
    // Complete the task with results
    this.completeTask(task.id, {
      message: `Successfully trained ${request.curveType} curve for ${request.inputDimension} to ${request.outputDimension}`,
      curveId: curve.id,
      curve,
      accuracy: curve.accuracy,
      dataPointsUsed: filteredData.length,
      trainingIterations: trainingLog.length,
      timestamp: new Date()
    });
  }

  /**
   * Process a task to evaluate a cost curve
   */
  private async processEvaluateCurveTask(task: AgentTask): Promise<void> {
    const { curveId, testData, testRatio } = task.data;
    
    // Get the curve
    const curve = this.curves.get(curveId);
    if (!curve) {
      throw new Error(`Curve with ID ${curveId} not found`);
    }
    
    // Get test data
    let testDataPoints;
    
    if (testData && Array.isArray(testData)) {
      // Use provided test data
      testDataPoints = testData;
    } else {
      // Split existing data into training and testing sets
      const ratio = testRatio || 0.2; // Default to 20% test data
      
      // Filter data points to match curve dimensions
      const relevantData = this.dataPoints.filter(dp => 
        dp.factorValues[curve.inputDimension] !== undefined &&
        dp[curve.outputDimension as keyof CostDataPoint] !== undefined
      );
      
      // Shuffle and split
      const shuffled = [...relevantData].sort(() => 0.5 - Math.random());
      const testSize = Math.floor(shuffled.length * ratio);
      
      testDataPoints = shuffled.slice(0, testSize);
    }
    
    if (testDataPoints.length === 0) {
      throw new Error('No test data points available for evaluation');
    }
    
    // Evaluate the curve on test data
    const evaluationResults = this.evaluateCurve(curve, testDataPoints);
    
    // Complete the task with results
    this.completeTask(task.id, {
      curveId,
      curveName: curve.name,
      curveType: curve.type,
      testDataPoints: testDataPoints.length,
      results: evaluationResults,
      timestamp: new Date()
    });
  }

  /**
   * Process a task to apply a cost curve to new data
   */
  private async processApplyCurveTask(task: AgentTask): Promise<void> {
    const { curveId, inputData } = task.data;
    
    // Get the curve
    const curve = this.curves.get(curveId);
    if (!curve) {
      throw new Error(`Curve with ID ${curveId} not found`);
    }
    
    // Validate input data
    if (!inputData || !Array.isArray(inputData) || inputData.length === 0) {
      throw new Error('Valid input data array is required');
    }
    
    // Apply the curve to each input
    const results = inputData.map(input => {
      const inputValue = input[curve.inputDimension];
      
      if (inputValue === undefined) {
        return {
          input,
          error: `Missing input dimension: ${curve.inputDimension}`
        };
      }
      
      // Validate input is within domain
      if (inputValue < curve.domain.min || inputValue > curve.domain.max) {
        return {
          input,
          warning: `Input value ${inputValue} is outside curve domain [${curve.domain.min}, ${curve.domain.max}]`,
          outputValue: this.applyCurve(curve, inputValue)
        };
      }
      
      // Apply the curve
      const outputValue = this.applyCurve(curve, inputValue);
      
      return {
        input,
        outputValue,
        outputDimension: curve.outputDimension
      };
    });
    
    // Complete the task with results
    this.completeTask(task.id, {
      curveId,
      curveName: curve.name,
      inputCount: inputData.length,
      results,
      timestamp: new Date()
    });
  }

  /**
   * Process a task to export a cost curve
   */
  private async processExportCurveTask(task: AgentTask): Promise<void> {
    const { curveId, format } = task.data;
    
    // Get the curve
    const curve = this.curves.get(curveId);
    if (!curve) {
      throw new Error(`Curve with ID ${curveId} not found`);
    }
    
    // Export the curve in the requested format
    let exportedData;
    switch (format) {
      case 'json':
        exportedData = JSON.stringify(curve, null, 2);
        break;
      case 'csv':
        exportedData = this.exportCurveToCSV(curve);
        break;
      case 'function':
        exportedData = this.exportCurveAsFunction(curve);
        break;
      case 'mathml':
        exportedData = this.exportCurveToMathML(curve);
        break;
      default:
        exportedData = JSON.stringify(curve, null, 2);
    }
    
    // Complete the task with results
    this.completeTask(task.id, {
      curveId,
      curveName: curve.name,
      format: format || 'json',
      data: exportedData,
      timestamp: new Date()
    });
  }

  /**
   * Process a task to analyze data for curve training
   */
  private async processAnalyzeDataTask(task: AgentTask): Promise<void> {
    const { dimensions, buildingTypes, regions } = task.data;
    
    // Filter data points based on parameters
    let filteredData = [...this.dataPoints];
    
    if (buildingTypes && buildingTypes.length > 0) {
      filteredData = filteredData.filter(dp => 
        buildingTypes.includes(dp.buildingType)
      );
    }
    
    if (regions && regions.length > 0) {
      filteredData = filteredData.filter(dp => 
        regions.includes(dp.region)
      );
    }
    
    if (filteredData.length === 0) {
      throw new Error('No data points match the specified criteria');
    }
    
    // Analyze specified dimensions or all dimensions
    const dimensionsToAnalyze = dimensions || 
      Object.keys(filteredData[0].factorValues).concat(['size', 'actualCost']);
    
    const analysis = {};
    
    for (const dimension of dimensionsToAnalyze) {
      if (dimension === 'size' || dimension === 'actualCost' || dimension === 'yearBuilt') {
        // Built-in dimensions
        analysis[dimension] = this.analyzeNumericDimension(
          filteredData.map(dp => dp[dimension as keyof CostDataPoint] as number)
        );
      } else if (filteredData[0].factorValues[dimension] !== undefined) {
        // Factor value dimensions
        analysis[dimension] = this.analyzeNumericDimension(
          filteredData.map(dp => dp.factorValues[dimension])
        );
      }
    }
    
    // Find correlations between dimensions
    const correlations = this.findCorrelations(filteredData, dimensionsToAnalyze);
    
    // Recommend curves based on analysis
    const recommendations = this.recommendCurves(analysis, correlations);
    
    // Complete the task with results
    this.completeTask(task.id, {
      dataPointsAnalyzed: filteredData.length,
      buildingTypesIncluded: [...new Set(filteredData.map(dp => dp.buildingType))],
      regionsIncluded: [...new Set(filteredData.map(dp => dp.region))],
      dimensionAnalysis: analysis,
      correlations,
      recommendations,
      timestamp: new Date()
    });
  }

  /**
   * Train a cost curve based on data points
   */
  private async trainCurve(
    curveType: 'linear' | 'polynomial' | 'exponential' | 'logarithmic' | 'piecewise',
    inputDimension: string,
    outputDimension: string,
    dataPoints: CostDataPoint[],
    maxIterations: number,
    targetAccuracy: number,
    constraints?: Record<string, any>
  ): Promise<{ curve: CostCurve; trainingLog: Array<Record<string, any>> }> {
    // Initialize training log
    const trainingLog: Array<Record<string, any>> = [];
    
    // Extract input and output values
    const inputValues = dataPoints.map(dp => 
      dp.factorValues[inputDimension] !== undefined 
        ? dp.factorValues[inputDimension] 
        : dp[inputDimension as keyof CostDataPoint]
    );
    
    const outputValues = dataPoints.map(dp => 
      dp[outputDimension as keyof CostDataPoint]
    );
    
    // Determine domain
    const domain = {
      min: Math.min(...inputValues),
      max: Math.max(...inputValues)
    };
    
    // Initialize parameters based on curve type
    let parameters: Record<string, any>;
    let accuracy = 0;
    
    switch (curveType) {
      case 'linear':
        parameters = await this.trainLinearCurve(
          inputValues, 
          outputValues, 
          maxIterations, 
          targetAccuracy,
          trainingLog
        );
        break;
        
      case 'polynomial':
        const degree = constraints?.degree || 2;
        parameters = await this.trainPolynomialCurve(
          inputValues, 
          outputValues, 
          degree,
          maxIterations, 
          targetAccuracy,
          trainingLog
        );
        break;
        
      case 'exponential':
        parameters = await this.trainExponentialCurve(
          inputValues, 
          outputValues, 
          maxIterations, 
          targetAccuracy,
          trainingLog
        );
        break;
        
      case 'logarithmic':
        parameters = await this.trainLogarithmicCurve(
          inputValues, 
          outputValues, 
          maxIterations, 
          targetAccuracy,
          trainingLog
        );
        break;
        
      case 'piecewise':
        const segments = constraints?.segments || 3;
        parameters = await this.trainPiecewiseCurve(
          inputValues, 
          outputValues, 
          segments,
          maxIterations, 
          targetAccuracy,
          trainingLog
        );
        break;
        
      default:
        throw new Error(`Unsupported curve type: ${curveType}`);
    }
    
    // Calculate final accuracy
    const predictions = inputValues.map(input => 
      this.evaluateCurveAtPoint(curveType, parameters, input)
    );
    
    accuracy = this.calculateAccuracy(outputValues, predictions);
    
    // Create the curve object
    const curve: CostCurve = {
      id: `curve_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `${inputDimension}-to-${outputDimension} ${curveType} curve`,
      description: `A ${curveType} curve mapping ${inputDimension} to ${outputDimension}`,
      type: curveType,
      parameters,
      domain,
      inputDimension,
      outputDimension,
      accuracy,
      lastUpdated: new Date(),
      version: 1
    };
    
    return { curve, trainingLog };
  }

  /**
   * Train a linear curve (y = mx + b)
   */
  private async trainLinearCurve(
    inputValues: number[],
    outputValues: number[],
    maxIterations: number,
    targetAccuracy: number,
    trainingLog: Array<Record<string, any>>
  ): Promise<Record<string, any>> {
    // Initial parameters
    let m = 1.0;
    let b = 0.0;
    
    // Learning rate
    const learningRate = 0.001;
    
    // Train using gradient descent
    let iteration = 0;
    let bestAccuracy = 0;
    let bestParams = { m, b };
    
    while (iteration < maxIterations) {
      // Calculate predictions
      const predictions = inputValues.map(x => m * x + b);
      
      // Calculate errors
      const errors = predictions.map((pred, i) => pred - outputValues[i]);
      
      // Calculate gradients
      const gradientM = (2 / inputValues.length) * 
        errors.reduce((sum, error, i) => sum + error * inputValues[i], 0);
      const gradientB = (2 / inputValues.length) * 
        errors.reduce((sum, error) => sum + error, 0);
      
      // Update parameters
      m -= learningRate * gradientM;
      b -= learningRate * gradientB;
      
      // Calculate accuracy
      const accuracy = this.calculateAccuracy(outputValues, predictions);
      
      // Log progress
      if (iteration % 100 === 0) {
        trainingLog.push({
          iteration,
          m,
          b,
          accuracy,
          meanError: errors.reduce((sum, err) => sum + Math.abs(err), 0) / errors.length
        });
      }
      
      // Check if we've improved
      if (accuracy > bestAccuracy) {
        bestAccuracy = accuracy;
        bestParams = { m, b };
        
        // Check if we've reached target accuracy
        if (accuracy >= targetAccuracy) {
          break;
        }
      }
      
      iteration++;
    }
    
    // Final log entry
    trainingLog.push({
      iteration,
      m: bestParams.m,
      b: bestParams.b,
      accuracy: bestAccuracy,
      final: true
    });
    
    return bestParams;
  }

  /**
   * Train a polynomial curve (y = a0 + a1*x + a2*x^2 + ... + an*x^n)
   */
  private async trainPolynomialCurve(
    inputValues: number[],
    outputValues: number[],
    degree: number,
    maxIterations: number,
    targetAccuracy: number,
    trainingLog: Array<Record<string, any>>
  ): Promise<Record<string, any>> {
    // Initial parameters (all zeros except a0 = mean of outputs)
    const coefficients = Array(degree + 1).fill(0);
    coefficients[0] = outputValues.reduce((sum, y) => sum + y, 0) / outputValues.length;
    
    // Learning rate
    const learningRate = 0.0001;
    
    // Train using gradient descent
    let iteration = 0;
    let bestAccuracy = 0;
    let bestCoefficients = [...coefficients];
    
    while (iteration < maxIterations) {
      // Calculate predictions
      const predictions = inputValues.map(x => {
        let y = 0;
        for (let i = 0; i <= degree; i++) {
          y += coefficients[i] * Math.pow(x, i);
        }
        return y;
      });
      
      // Calculate errors
      const errors = predictions.map((pred, i) => pred - outputValues[i]);
      
      // Calculate gradients and update coefficients
      for (let j = 0; j <= degree; j++) {
        const gradient = (2 / inputValues.length) * 
          errors.reduce((sum, error, i) => sum + error * Math.pow(inputValues[i], j), 0);
        
        coefficients[j] -= learningRate * gradient;
      }
      
      // Calculate accuracy
      const accuracy = this.calculateAccuracy(outputValues, predictions);
      
      // Log progress
      if (iteration % 100 === 0) {
        trainingLog.push({
          iteration,
          coefficients: [...coefficients],
          accuracy,
          meanError: errors.reduce((sum, err) => sum + Math.abs(err), 0) / errors.length
        });
      }
      
      // Check if we've improved
      if (accuracy > bestAccuracy) {
        bestAccuracy = accuracy;
        bestCoefficients = [...coefficients];
        
        // Check if we've reached target accuracy
        if (accuracy >= targetAccuracy) {
          break;
        }
      }
      
      iteration++;
    }
    
    // Final log entry
    trainingLog.push({
      iteration,
      coefficients: bestCoefficients,
      accuracy: bestAccuracy,
      final: true
    });
    
    return { coefficients: bestCoefficients };
  }

  /**
   * Train an exponential curve (y = a * e^(b*x))
   */
  private async trainExponentialCurve(
    inputValues: number[],
    outputValues: number[],
    maxIterations: number,
    targetAccuracy: number,
    trainingLog: Array<Record<string, any>>
  ): Promise<Record<string, any>> {
    // Take natural log of output values to linearize
    // ln(y) = ln(a) + b*x
    const logOutputs = outputValues.map(y => Math.log(Math.max(y, 0.0001))); // Avoid log(0)
    
    // Solve linear regression for ln(y) = ln(a) + b*x
    const linearParams = await this.trainLinearCurve(
      inputValues,
      logOutputs,
      maxIterations,
      targetAccuracy,
      []
    );
    
    // Convert back to exponential parameters
    const a = Math.exp(linearParams.b); // b in linear is ln(a) in exponential
    const b = linearParams.m;         // m in linear is b in exponential
    
    // Calculate predictions
    const predictions = inputValues.map(x => a * Math.exp(b * x));
    
    // Calculate accuracy
    const accuracy = this.calculateAccuracy(outputValues, predictions);
    
    // Log final result
    trainingLog.push({
      a,
      b,
      accuracy,
      final: true
    });
    
    return { a, b };
  }

  /**
   * Train a logarithmic curve (y = a + b * ln(x))
   */
  private async trainLogarithmicCurve(
    inputValues: number[],
    outputValues: number[],
    maxIterations: number,
    targetAccuracy: number,
    trainingLog: Array<Record<string, any>>
  ): Promise<Record<string, any>> {
    // Transform input values to their natural log
    const logInputs = inputValues.map(x => Math.log(Math.max(x, 0.0001))); // Avoid log(0)
    
    // Solve linear regression for y = a + b*ln(x)
    const linearParams = await this.trainLinearCurve(
      logInputs,
      outputValues,
      maxIterations,
      targetAccuracy,
      []
    );
    
    // Map parameters to logarithmic form
    const a = linearParams.b; // Intercept
    const b = linearParams.m; // Coefficient of ln(x)
    
    // Calculate predictions
    const predictions = inputValues.map(x => a + b * Math.log(Math.max(x, 0.0001)));
    
    // Calculate accuracy
    const accuracy = this.calculateAccuracy(outputValues, predictions);
    
    // Log final result
    trainingLog.push({
      a,
      b,
      accuracy,
      final: true
    });
    
    return { a, b };
  }

  /**
   * Train a piecewise linear curve
   */
  private async trainPiecewiseCurve(
    inputValues: number[],
    outputValues: number[],
    segments: number,
    maxIterations: number,
    targetAccuracy: number,
    trainingLog: Array<Record<string, any>>
  ): Promise<Record<string, any>> {
    // Determine breakpoints by dividing the input range into segments
    const minInput = Math.min(...inputValues);
    const maxInput = Math.max(...inputValues);
    const range = maxInput - minInput;
    
    const breakpoints = Array(segments - 1).fill(0).map((_, i) => 
      minInput + range * (i + 1) / segments
    );
    
    // Initialize segment parameters (slope and intercept for each segment)
    const segmentParams = Array(segments).fill(0).map(() => ({ m: 1.0, b: 0.0 }));
    
    // Learning rate
    const learningRate = 0.001;
    
    // Train using gradient descent
    let iteration = 0;
    let bestAccuracy = 0;
    let bestParams = JSON.parse(JSON.stringify(segmentParams));
    
    while (iteration < maxIterations) {
      // Calculate predictions
      const predictions = inputValues.map(x => {
        // Find the appropriate segment
        let segmentIndex = 0;
        while (segmentIndex < segments - 1 && x >= breakpoints[segmentIndex]) {
          segmentIndex++;
        }
        
        // Apply the segment parameters
        const { m, b } = segmentParams[segmentIndex];
        return m * x + b;
      });
      
      // Calculate errors
      const errors = predictions.map((pred, i) => pred - outputValues[i]);
      
      // Update parameters for each segment
      for (let s = 0; s < segments; s++) {
        const segmentPoints = inputValues.map((x, i) => {
          // Determine if this point belongs to the current segment
          let inSegment = false;
          if (s === 0) {
            inSegment = x < breakpoints[0];
          } else if (s === segments - 1) {
            inSegment = x >= breakpoints[segments - 2];
          } else {
            inSegment = x >= breakpoints[s - 1] && x < breakpoints[s];
          }
          
          return inSegment ? { x, error: errors[i] } : null;
        }).filter(p => p !== null) as Array<{ x: number; error: number }>;
        
        if (segmentPoints.length > 0) {
          // Calculate gradients
          const gradientM = (2 / segmentPoints.length) * 
            segmentPoints.reduce((sum, p) => sum + p.error * p.x, 0);
          const gradientB = (2 / segmentPoints.length) * 
            segmentPoints.reduce((sum, p) => sum + p.error, 0);
          
          // Update parameters
          segmentParams[s].m -= learningRate * gradientM;
          segmentParams[s].b -= learningRate * gradientB;
        }
      }
      
      // Calculate accuracy
      const accuracy = this.calculateAccuracy(outputValues, predictions);
      
      // Log progress
      if (iteration % 100 === 0) {
        trainingLog.push({
          iteration,
          segmentParams: JSON.parse(JSON.stringify(segmentParams)),
          breakpoints: [...breakpoints],
          accuracy,
          meanError: errors.reduce((sum, err) => sum + Math.abs(err), 0) / errors.length
        });
      }
      
      // Check if we've improved
      if (accuracy > bestAccuracy) {
        bestAccuracy = accuracy;
        bestParams = JSON.parse(JSON.stringify(segmentParams));
        
        // Check if we've reached target accuracy
        if (accuracy >= targetAccuracy) {
          break;
        }
      }
      
      iteration++;
    }
    
    // Final log entry
    trainingLog.push({
      iteration,
      segmentParams: bestParams,
      breakpoints,
      accuracy: bestAccuracy,
      final: true
    });
    
    return { segmentParams: bestParams, breakpoints };
  }

  /**
   * Evaluate a curve at a specific input point
   */
  private evaluateCurveAtPoint(
    curveType: string,
    parameters: Record<string, any>,
    input: number
  ): number {
    switch (curveType) {
      case 'linear':
        return parameters.m * input + parameters.b;
        
      case 'polynomial': {
        const { coefficients } = parameters;
        let result = 0;
        for (let i = 0; i < coefficients.length; i++) {
          result += coefficients[i] * Math.pow(input, i);
        }
        return result;
      }
        
      case 'exponential':
        return parameters.a * Math.exp(parameters.b * input);
        
      case 'logarithmic':
        return parameters.a + parameters.b * Math.log(Math.max(input, 0.0001));
        
      case 'piecewise': {
        const { segmentParams, breakpoints } = parameters;
        
        // Find the appropriate segment
        let segmentIndex = 0;
        while (segmentIndex < breakpoints.length && input >= breakpoints[segmentIndex]) {
          segmentIndex++;
        }
        
        // Apply the segment parameters
        const { m, b } = segmentParams[segmentIndex];
        return m * input + b;
      }
        
      default:
        throw new Error(`Unsupported curve type: ${curveType}`);
    }
  }

  /**
   * Evaluate a curve on multiple test data points
   */
  private evaluateCurve(
    curve: CostCurve,
    testData: CostDataPoint[]
  ): Record<string, any> {
    // Extract input and output values
    const inputValues = testData.map(dp => 
      dp.factorValues[curve.inputDimension] !== undefined 
        ? dp.factorValues[curve.inputDimension] 
        : dp[curve.inputDimension as keyof CostDataPoint]
    ) as number[];
    
    const actualOutputs = testData.map(dp => 
      dp[curve.outputDimension as keyof CostDataPoint]
    ) as number[];
    
    // Make predictions
    const predictions = inputValues.map(input => 
      this.applyCurve(curve, input)
    );
    
    // Calculate error metrics
    const errors = predictions.map((pred, i) => pred - actualOutputs[i]);
    const absoluteErrors = errors.map(e => Math.abs(e));
    
    const meanError = errors.reduce((sum, e) => sum + e, 0) / errors.length;
    const meanAbsoluteError = absoluteErrors.reduce((sum, e) => sum + e, 0) / absoluteErrors.length;
    const maxError = Math.max(...absoluteErrors);
    
    // Calculate accuracy
    const accuracy = this.calculateAccuracy(actualOutputs, predictions);
    
    // Calculate R-squared (coefficient of determination)
    const mean = actualOutputs.reduce((sum, y) => sum + y, 0) / actualOutputs.length;
    const ssTotal = actualOutputs.reduce((sum, y) => sum + Math.pow(y - mean, 2), 0);
    const ssResidual = errors.reduce((sum, e) => sum + Math.pow(e, 2), 0);
    const rSquared = 1 - (ssResidual / ssTotal);
    
    // Individual point results
    const pointResults = testData.map((dp, i) => ({
      input: inputValues[i],
      actual: actualOutputs[i],
      predicted: predictions[i],
      error: errors[i],
      percentError: (errors[i] / actualOutputs[i]) * 100
    }));
    
    return {
      testPoints: testData.length,
      accuracy,
      rSquared,
      meanError,
      meanAbsoluteError,
      maxError,
      standardDeviation: Math.sqrt(errors.reduce((sum, e) => sum + Math.pow(e - meanError, 2), 0) / errors.length),
      pointResults: pointResults.slice(0, 10) // Limit to first 10 for brevity
    };
  }

  /**
   * Apply a curve to calculate an output value for a given input
   */
  private applyCurve(curve: CostCurve, input: number): number {
    return this.evaluateCurveAtPoint(curve.type, curve.parameters, input);
  }

  /**
   * Calculate accuracy score between actual and predicted values
   */
  private calculateAccuracy(actual: number[], predicted: number[]): number {
    if (actual.length !== predicted.length || actual.length === 0) {
      return 0;
    }
    
    // Calculate average absolute percentage error
    const mape = actual.reduce((sum, actualValue, i) => {
      if (actualValue === 0) return sum;
      return sum + Math.abs((actualValue - predicted[i]) / actualValue);
    }, 0) / actual.length;
    
    // Convert to accuracy (1 - MAPE), with a minimum of 0
    return Math.max(0, 1 - mape);
  }

  /**
   * Set up validators for various dimensions
   */
  private setupDimensionValidators(): void {
    // Basic validators for common dimensions
    this.dimensionValidators.set('size', value => typeof value === 'number' && value > 0);
    this.dimensionValidators.set('yearBuilt', value => typeof value === 'number' && value > 1800 && value <= new Date().getFullYear());
    this.dimensionValidators.set('actualCost', value => typeof value === 'number' && value >= 0);
    this.dimensionValidators.set('predictedCost', value => typeof value === 'number' && value >= 0);
    
    // Factor value validators
    this.dimensionValidators.set('material:concrete', value => typeof value === 'number' && value >= 0);
    this.dimensionValidators.set('material:steel', value => typeof value === 'number' && value >= 0);
    this.dimensionValidators.set('labor:carpentry', value => typeof value === 'number' && value >= 0);
    this.dimensionValidators.set('labor:electrical', value => typeof value === 'number' && value >= 0);
    this.dimensionValidators.set('equipment:excavator', value => typeof value === 'number' && value >= 0);
  }

  /**
   * Load existing cost curves (simulation)
   */
  private async loadCostCurves(): Promise<void> {
    // Simulate loading curves from database or file
    const sampleCurves: CostCurve[] = [
      {
        id: 'curve_size_to_cost_linear',
        name: 'Size to Cost (Linear)',
        description: 'A linear curve mapping building size to cost',
        type: 'linear',
        parameters: { m: 125.5, b: 50000 },
        domain: { min: 500, max: 10000 },
        inputDimension: 'size',
        outputDimension: 'actualCost',
        accuracy: 0.82,
        lastUpdated: new Date(),
        version: 1
      },
      {
        id: 'curve_size_to_cost_polynomial',
        name: 'Size to Cost (Polynomial)',
        description: 'A second-degree polynomial curve mapping building size to cost',
        type: 'polynomial',
        parameters: { 
          coefficients: [75000, 100, -0.005]
        },
        domain: { min: 500, max: 10000 },
        inputDimension: 'size',
        outputDimension: 'actualCost',
        accuracy: 0.87,
        lastUpdated: new Date(),
        version: 1
      }
    ];
    
    // Store in map
    sampleCurves.forEach(curve => {
      this.curves.set(curve.id, curve);
    });
  }

  /**
   * Load data points for training (simulation)
   */
  private async loadDataPoints(): Promise<void> {
    // Simulate loading data points from database or file
    this.dataPoints = Array(100).fill(0).map((_, i) => {
      const size = 500 + Math.random() * 9500; // 500 to 10000
      const yearBuilt = 1950 + Math.floor(Math.random() * 70); // 1950 to 2020
      const quality = ['low', 'medium', 'high'][Math.floor(Math.random() * 3)];
      const region = ['BENTON', 'KING', 'SPOKANE'][Math.floor(Math.random() * 3)];
      const buildingType = ['single_family', 'multi_family', 'commercial'][Math.floor(Math.random() * 3)];
      
      const materialConcrete = 100 + Math.random() * 50; // 100 to 150
      const materialSteel = 2000 + Math.random() * 500; // 2000 to 2500
      const laborCarpentry = 40 + Math.random() * 20; // 40 to 60
      const laborElectrical = 60 + Math.random() * 15; // 60 to 75
      const equipmentExcavator = 325 + Math.random() * 50; // 325 to 375
      
      // Simulate actual cost with some randomization
      let baseCost = 75000 + 100 * size - 0.005 * Math.pow(size, 2);
      
      // Adjust for quality
      if (quality === 'low') baseCost *= 0.8;
      if (quality === 'high') baseCost *= 1.3;
      
      // Adjust for region
      if (region === 'KING') baseCost *= 1.25;
      if (region === 'SPOKANE') baseCost *= 0.9;
      
      // Add some noise
      const actualCost = baseCost * (0.9 + Math.random() * 0.2);
      
      return {
        id: `dp_${i}`,
        buildingType,
        size,
        yearBuilt,
        quality,
        region,
        actualCost,
        factorValues: {
          'material:concrete': materialConcrete,
          'material:steel': materialSteel,
          'labor:carpentry': laborCarpentry,
          'labor:electrical': laborElectrical,
          'equipment:excavator': equipmentExcavator
        },
        metadata: {},
        timestamp: new Date()
      };
    });
  }

  /**
   * Analyze a numeric dimension
   */
  private analyzeNumericDimension(values: number[]): Record<string, any> {
    // Calculate basic statistics
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    const sum = values.reduce((acc, val) => acc + val, 0);
    const mean = sum / values.length;
    
    // Calculate variance and standard deviation
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    // Calculate median
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 === 0
      ? (sorted[middle - 1] + sorted[middle]) / 2
      : sorted[middle];
    
    // Check for normality
    const skewness = this.calculateSkewness(values, mean, stdDev);
    const kurtosis = this.calculateKurtosis(values, mean, stdDev);
    
    // Check for outliers (values outside 3 standard deviations)
    const lowerBound = mean - 3 * stdDev;
    const upperBound = mean + 3 * stdDev;
    const outliers = values.filter(val => val < lowerBound || val > upperBound);
    
    return {
      count: values.length,
      min,
      max,
      range,
      mean,
      median,
      stdDev,
      variance,
      coefficientOfVariation: (stdDev / mean) * 100,
      skewness,
      kurtosis,
      normalDistribution: Math.abs(skewness) < 1 && Math.abs(kurtosis) < 1,
      outlierCount: outliers.length,
      outliersPercent: (outliers.length / values.length) * 100
    };
  }

  /**
   * Calculate skewness of a distribution
   */
  private calculateSkewness(values: number[], mean: number, stdDev: number): number {
    if (values.length === 0 || stdDev === 0) return 0;
    
    const cubedDiffs = values.map(value => Math.pow((value - mean) / stdDev, 3));
    return (cubedDiffs.reduce((acc, val) => acc + val, 0) / values.length);
  }

  /**
   * Calculate kurtosis of a distribution
   */
  private calculateKurtosis(values: number[], mean: number, stdDev: number): number {
    if (values.length === 0 || stdDev === 0) return 0;
    
    const fourthPowerDiffs = values.map(value => Math.pow((value - mean) / stdDev, 4));
    return (fourthPowerDiffs.reduce((acc, val) => acc + val, 0) / values.length) - 3;
  }

  /**
   * Find correlations between dimensions
   */
  private findCorrelations(
    dataPoints: CostDataPoint[],
    dimensions: string[]
  ): Array<{ dimension1: string; dimension2: string; correlation: number }> {
    const correlations = [];
    
    // Calculate correlations between each pair of dimensions
    for (let i = 0; i < dimensions.length; i++) {
      for (let j = i + 1; j < dimensions.length; j++) {
        const dim1 = dimensions[i];
        const dim2 = dimensions[j];
        
        // Extract values for each dimension
        const values1 = dataPoints.map(dp => {
          if (dim1 === 'size' || dim1 === 'actualCost' || dim1 === 'yearBuilt') {
            return dp[dim1 as keyof CostDataPoint] as number;
          } else {
            return dp.factorValues[dim1];
          }
        }).filter(v => v !== undefined);
        
        const values2 = dataPoints.map(dp => {
          if (dim2 === 'size' || dim2 === 'actualCost' || dim2 === 'yearBuilt') {
            return dp[dim2 as keyof CostDataPoint] as number;
          } else {
            return dp.factorValues[dim2];
          }
        }).filter(v => v !== undefined);
        
        // Calculate correlation coefficient
        const correlation = this.calculateCorrelation(values1, values2);
        
        if (!isNaN(correlation)) {
          correlations.push({
            dimension1: dim1,
            dimension2: dim2,
            correlation
          });
        }
      }
    }
    
    // Sort by absolute correlation (strongest first)
    return correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
  }

  /**
   * Calculate Pearson correlation coefficient
   */
  private calculateCorrelation(values1: number[], values2: number[]): number {
    if (values1.length !== values2.length || values1.length === 0) {
      return NaN;
    }
    
    // Calculate means
    const mean1 = values1.reduce((sum, val) => sum + val, 0) / values1.length;
    const mean2 = values2.reduce((sum, val) => sum + val, 0) / values2.length;
    
    // Calculate covariance and standard deviations
    let covariance = 0;
    let stdDev1 = 0;
    let stdDev2 = 0;
    
    for (let i = 0; i < values1.length; i++) {
      const diff1 = values1[i] - mean1;
      const diff2 = values2[i] - mean2;
      
      covariance += diff1 * diff2;
      stdDev1 += diff1 * diff1;
      stdDev2 += diff2 * diff2;
    }
    
    if (stdDev1 === 0 || stdDev2 === 0) {
      return 0; // No variation in at least one variable
    }
    
    return covariance / (Math.sqrt(stdDev1) * Math.sqrt(stdDev2));
  }

  /**
   * Recommend curves based on data analysis
   */
  private recommendCurves(
    analysis: Record<string, any>,
    correlations: Array<{ dimension1: string; dimension2: string; correlation: number }>
  ): Array<{ inputDimension: string; outputDimension: string; curveType: string; reason: string; score: number }> {
    const recommendations = [];
    
    // Look at strongest correlations for dimension pairs
    const strongPairs = correlations
      .filter(c => Math.abs(c.correlation) > 0.5)
      .slice(0, 5);
    
    for (const pair of strongPairs) {
      const { dimension1, dimension2, correlation } = pair;
      
      // For each strong correlation, recommend a curve type based on analysis
      let dimension1Analysis;
      let dimension2Analysis;
      
      if (analysis[dimension1]) {
        dimension1Analysis = analysis[dimension1];
      }
      
      if (analysis[dimension2]) {
        dimension2Analysis = analysis[dimension2];
      }
      
      if (!dimension1Analysis || !dimension2Analysis) continue;
      
      // Determine which dimension should be input vs output
      // Usually we want to predict cost, so if one is cost, it's the output
      let inputDimension, outputDimension;
      
      if (dimension1 === 'actualCost') {
        outputDimension = dimension1;
        inputDimension = dimension2;
      } else if (dimension2 === 'actualCost') {
        outputDimension = dimension2;
        inputDimension = dimension1;
      } else {
        // Otherwise choose the one with lower coefficient of variation as input
        if (dimension1Analysis.coefficientOfVariation < dimension2Analysis.coefficientOfVariation) {
          inputDimension = dimension1;
          outputDimension = dimension2;
        } else {
          inputDimension = dimension2;
          outputDimension = dimension1;
        }
      }
      
      // Get the analysis objects
      const inputAnalysis = inputDimension === dimension1 ? dimension1Analysis : dimension2Analysis;
      const outputAnalysis = outputDimension === dimension1 ? dimension1Analysis : dimension2Analysis;
      
      // Recommend curve type based on data characteristics
      const recommendations = this.recommendCurveType(
        inputDimension,
        outputDimension,
        inputAnalysis,
        outputAnalysis,
        correlation
      );
      
      // Add to overall recommendations
      recommendations.forEach(rec => {
        rec.score *= Math.abs(correlation); // Scale score by correlation strength
        recommendations.push(rec);
      });
    }
    
    // Sort by score (highest first) and return top 5
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }

  /**
   * Recommend a curve type based on data characteristics
   */
  private recommendCurveType(
    inputDimension: string,
    outputDimension: string,
    inputAnalysis: Record<string, any>,
    outputAnalysis: Record<string, any>,
    correlation: number
  ): Array<{ inputDimension: string; outputDimension: string; curveType: string; reason: string; score: number }> {
    const recommendations = [];
    
    // Check for non-linearity in the data
    const inputSkewness = Math.abs(inputAnalysis.skewness);
    const outputSkewness = Math.abs(outputAnalysis.skewness);
    
    const inputNormal = inputAnalysis.normalDistribution;
    const outputNormal = outputAnalysis.normalDistribution;
    
    // Strong positive correlation suggests linear relationship
    if (correlation > 0.8 && inputNormal && outputNormal) {
      recommendations.push({
        inputDimension,
        outputDimension,
        curveType: 'linear',
        reason: 'Strong linear correlation detected',
        score: 0.9
      });
    }
    
    // Check for logarithmic relationship
    if (inputSkewness > 1.5 && outputSkewness < 1.0) {
      recommendations.push({
        inputDimension,
        outputDimension,
        curveType: 'logarithmic',
        reason: 'Input has high positive skew, logarithmic model recommended',
        score: 0.8
      });
    }
    
    // Check for exponential relationship
    if (inputSkewness < 1.0 && outputSkewness > 1.5) {
      recommendations.push({
        inputDimension,
        outputDimension,
        curveType: 'exponential',
        reason: 'Output has high positive skew, exponential model recommended',
        score: 0.8
      });
    }
    
    // Check for polynomial relationship (when both have moderate skew)
    if ((inputSkewness > 0.5 || outputSkewness > 0.5) && 
        Math.abs(correlation) > 0.6) {
      recommendations.push({
        inputDimension,
        outputDimension,
        curveType: 'polynomial',
        reason: 'Moderate skew in data suggests polynomial relationship',
        score: 0.75
      });
    }
    
    // If high outlier percentage, recommend piecewise
    if (inputAnalysis.outliersPercent > 5 || outputAnalysis.outliersPercent > 5) {
      recommendations.push({
        inputDimension,
        outputDimension,
        curveType: 'piecewise',
        reason: 'Significant outliers detected, piecewise model may better capture segments',
        score: 0.7
      });
    }
    
    // If no specific recommendation, add a general linear one
    if (recommendations.length === 0) {
      recommendations.push({
        inputDimension,
        outputDimension,
        curveType: 'linear',
        reason: 'Default recommendation as a starting point',
        score: 0.5
      });
    }
    
    return recommendations;
  }

  /**
   * Export a curve to CSV format
   */
  private exportCurveToCSV(curve: CostCurve): string {
    // Generate header
    let csv = `${curve.inputDimension},${curve.outputDimension}\n`;
    
    // Generate sample points
    const { min, max } = curve.domain;
    const range = max - min;
    const points = 100; // Number of points to generate
    
    for (let i = 0; i < points; i++) {
      const input = min + (range * i) / (points - 1);
      const output = this.applyCurve(curve, input);
      csv += `${input},${output}\n`;
    }
    
    return csv;
  }

  /**
   * Export a curve as a JavaScript function
   */
  private exportCurveAsFunction(curve: CostCurve): string {
    let functionCode = '';
    
    switch (curve.type) {
      case 'linear':
        functionCode = `
/**
 * ${curve.name} - ${curve.description}
 * A linear function mapping ${curve.inputDimension} to ${curve.outputDimension}
 * Domain: [${curve.domain.min}, ${curve.domain.max}]
 * Accuracy: ${curve.accuracy.toFixed(4)}
 * Last updated: ${curve.lastUpdated.toISOString()}
 */
function calculate${curve.outputDimension.charAt(0).toUpperCase() + curve.outputDimension.slice(1)}(${curve.inputDimension}) {
  // Linear curve: y = mx + b
  const m = ${curve.parameters.m};
  const b = ${curve.parameters.b};
  
  return m * ${curve.inputDimension} + b;
}`;
        break;
        
      case 'polynomial':
        functionCode = `
/**
 * ${curve.name} - ${curve.description}
 * A polynomial function mapping ${curve.inputDimension} to ${curve.outputDimension}
 * Domain: [${curve.domain.min}, ${curve.domain.max}]
 * Accuracy: ${curve.accuracy.toFixed(4)}
 * Last updated: ${curve.lastUpdated.toISOString()}
 */
function calculate${curve.outputDimension.charAt(0).toUpperCase() + curve.outputDimension.slice(1)}(${curve.inputDimension}) {
  // Polynomial curve: y = a0 + a1*x + a2*x^2 + ... + an*x^n
  const coefficients = ${JSON.stringify(curve.parameters.coefficients)};
  
  let result = 0;
  for (let i = 0; i < coefficients.length; i++) {
    result += coefficients[i] * Math.pow(${curve.inputDimension}, i);
  }
  
  return result;
}`;
        break;
        
      case 'exponential':
        functionCode = `
/**
 * ${curve.name} - ${curve.description}
 * An exponential function mapping ${curve.inputDimension} to ${curve.outputDimension}
 * Domain: [${curve.domain.min}, ${curve.domain.max}]
 * Accuracy: ${curve.accuracy.toFixed(4)}
 * Last updated: ${curve.lastUpdated.toISOString()}
 */
function calculate${curve.outputDimension.charAt(0).toUpperCase() + curve.outputDimension.slice(1)}(${curve.inputDimension}) {
  // Exponential curve: y = a * e^(b*x)
  const a = ${curve.parameters.a};
  const b = ${curve.parameters.b};
  
  return a * Math.exp(b * ${curve.inputDimension});
}`;
        break;
        
      case 'logarithmic':
        functionCode = `
/**
 * ${curve.name} - ${curve.description}
 * A logarithmic function mapping ${curve.inputDimension} to ${curve.outputDimension}
 * Domain: [${curve.domain.min}, ${curve.domain.max}]
 * Accuracy: ${curve.accuracy.toFixed(4)}
 * Last updated: ${curve.lastUpdated.toISOString()}
 */
function calculate${curve.outputDimension.charAt(0).toUpperCase() + curve.outputDimension.slice(1)}(${curve.inputDimension}) {
  // Logarithmic curve: y = a + b * ln(x)
  const a = ${curve.parameters.a};
  const b = ${curve.parameters.b};
  
  // Avoid log(0)
  const safeInput = Math.max(${curve.inputDimension}, 0.0001);
  
  return a + b * Math.log(safeInput);
}`;
        break;
        
      case 'piecewise':
        functionCode = `
/**
 * ${curve.name} - ${curve.description}
 * A piecewise linear function mapping ${curve.inputDimension} to ${curve.outputDimension}
 * Domain: [${curve.domain.min}, ${curve.domain.max}]
 * Accuracy: ${curve.accuracy.toFixed(4)}
 * Last updated: ${curve.lastUpdated.toISOString()}
 */
function calculate${curve.outputDimension.charAt(0).toUpperCase() + curve.outputDimension.slice(1)}(${curve.inputDimension}) {
  // Piecewise linear curve
  const breakpoints = ${JSON.stringify(curve.parameters.breakpoints)};
  const segmentParams = ${JSON.stringify(curve.parameters.segmentParams)};
  
  // Find appropriate segment
  let segmentIndex = 0;
  while (segmentIndex < breakpoints.length && ${curve.inputDimension} >= breakpoints[segmentIndex]) {
    segmentIndex++;
  }
  
  // Apply segment formula: y = mx + b
  const { m, b } = segmentParams[segmentIndex];
  
  return m * ${curve.inputDimension} + b;
}`;
        break;
        
      default:
        functionCode = `// Unsupported curve type: ${curve.type}`;
    }
    
    return functionCode;
  }

  /**
   * Export a curve to MathML format
   */
  private exportCurveToMathML(curve: CostCurve): string {
    let mathml = '';
    
    switch (curve.type) {
      case 'linear':
        mathml = `
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <mrow>
    <mi>${curve.outputDimension}</mi>
    <mo>=</mo>
    <mn>${curve.parameters.m}</mn>
    <mo>×</mo>
    <mi>${curve.inputDimension}</mi>
    <mo>+</mo>
    <mn>${curve.parameters.b}</mn>
  </mrow>
</math>`;
        break;
        
      case 'polynomial': {
        const { coefficients } = curve.parameters;
        
        mathml = `
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <mrow>
    <mi>${curve.outputDimension}</mi>
    <mo>=</mo>`;
        
        for (let i = 0; i < coefficients.length; i++) {
          const coef = coefficients[i];
          
          if (i > 0 && coef >= 0) {
            mathml += `<mo>+</mo>`;
          }
          
          mathml += `<mn>${coef}</mn>`;
          
          if (i > 0) {
            mathml += `<mo>×</mo>
    <msup>
      <mi>${curve.inputDimension}</mi>
      <mn>${i}</mn>
    </msup>`;
          }
        }
        
        mathml += `
  </mrow>
</math>`;
        break;
      }
        
      case 'exponential':
        mathml = `
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <mrow>
    <mi>${curve.outputDimension}</mi>
    <mo>=</mo>
    <mn>${curve.parameters.a}</mn>
    <mo>×</mo>
    <msup>
      <mi>e</mi>
      <mrow>
        <mn>${curve.parameters.b}</mn>
        <mo>×</mo>
        <mi>${curve.inputDimension}</mi>
      </mrow>
    </msup>
  </mrow>
</math>`;
        break;
        
      case 'logarithmic':
        mathml = `
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <mrow>
    <mi>${curve.outputDimension}</mi>
    <mo>=</mo>
    <mn>${curve.parameters.a}</mn>
    <mo>+</mo>
    <mn>${curve.parameters.b}</mn>
    <mo>×</mo>
    <mi>ln</mi>
    <mo>(</mo>
    <mi>${curve.inputDimension}</mi>
    <mo>)</mo>
  </mrow>
</math>`;
        break;
        
      case 'piecewise': {
        const { breakpoints, segmentParams } = curve.parameters;
        
        mathml = `
<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">
  <mrow>
    <mi>${curve.outputDimension}</mi>
    <mo>=</mo>
    <mfenced separators="|">
      <mtable>`;
        
        for (let i = 0; i < segmentParams.length; i++) {
          const { m, b } = segmentParams[i];
          
          mathml += `
        <mtr>
          <mtd>
            <mrow>
              <mn>${m}</mn>
              <mo>×</mo>
              <mi>${curve.inputDimension}</mi>
              <mo>+</mo>
              <mn>${b}</mn>
            </mrow>
          </mtd>
          <mtd>`;
          
          if (i === 0) {
            mathml += `
              <mrow>
                <mi>${curve.inputDimension}</mi>
                <mo>&lt;</mo>
                <mn>${breakpoints[0]}</mn>
              </mrow>`;
          } else if (i === segmentParams.length - 1) {
            mathml += `
              <mrow>
                <mi>${curve.inputDimension}</mi>
                <mo>&ge;</mo>
                <mn>${breakpoints[breakpoints.length - 1]}</mn>
              </mrow>`;
          } else {
            mathml += `
              <mrow>
                <mn>${breakpoints[i-1]}</mn>
                <mo>&le;</mo>
                <mi>${curve.inputDimension}</mi>
                <mo>&lt;</mo>
                <mn>${breakpoints[i]}</mn>
              </mrow>`;
          }
          
          mathml += `
          </mtd>
        </mtr>`;
        }
        
        mathml += `
      </mtable>
    </mfenced>
  </mrow>
</math>`;
        break;
      }
        
      default:
        mathml = `<p>Unsupported curve type: ${curve.type}</p>`;
    }
    
    return mathml;
  }
}
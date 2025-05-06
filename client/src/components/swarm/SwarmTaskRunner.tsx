/**
 * TerraBuild AI Swarm - Task Runner Component
 * 
 * This component provides a user interface for running tasks with specific agents.
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { runAgentTask } from '@/lib/swarmClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, AlertCircle } from 'lucide-react';

// Define form schema
const taskFormSchema = z.object({
  agentId: z.string().min(1, {
    message: 'Please select an agent',
  }),
  taskType: z.string().min(1, {
    message: 'Please select a task type',
  }),
  taskData: z.string().min(5, {
    message: 'Task data must be at least 5 characters',
  }),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

// Predefined agent information
const agents = [
  {
    id: 'factor-tuner',
    name: 'FactorTuner',
    tasks: [
      { id: 'factor:tune', name: 'Tune Factors' },
      { id: 'factor:analyze', name: 'Analyze Factors' },
      { id: 'factor:recommend', name: 'Recommend Factors' },
      { id: 'region:analyze', name: 'Analyze Region' }
    ]
  },
  {
    id: 'benchmark-guard',
    name: 'BenchmarkGuard',
    tasks: [
      { id: 'assessment:validate', name: 'Validate Assessment' },
      { id: 'assessment:benchmark', name: 'Benchmark Assessment' },
      { id: 'outlier:detect', name: 'Detect Outliers' },
      { id: 'rule:evaluate', name: 'Evaluate Rule' },
      { id: 'quality:report', name: 'Generate Quality Report' }
    ]
  },
  {
    id: 'curve-trainer',
    name: 'CurveTrainer',
    tasks: [
      { id: 'curve:train', name: 'Train Curve' },
      { id: 'curve:evaluate', name: 'Evaluate Curve' },
      { id: 'curve:apply', name: 'Apply Curve' },
      { id: 'curve:export', name: 'Export Curve' },
      { id: 'data:analyze', name: 'Analyze Data' }
    ]
  },
  {
    id: 'scenario-agent',
    name: 'ScenarioAgent',
    tasks: [
      { id: 'scenario:create', name: 'Create Scenario' },
      { id: 'scenario:analyze', name: 'Analyze Scenario' },
      { id: 'scenario:compare', name: 'Compare Scenarios' },
      { id: 'sensitivity:analyze', name: 'Analyze Sensitivity' },
      { id: 'risk:evaluate', name: 'Evaluate Risks' }
    ]
  },
  {
    id: 'boe-arguer',
    name: 'BOEArguer',
    tasks: [
      { id: 'boe:generate-argument', name: 'Generate Appeal Argument' },
      { id: 'boe:analyze-case', name: 'Analyze Appeal Case' },
      { id: 'boe:find-precedents', name: 'Find Case Precedents' },
      { id: 'boe:cite-statutes', name: 'Cite Relevant Statutes' }
    ]
  }
];

// Task templates
const taskTemplates: Record<string, string> = {
  'factor:tune': JSON.stringify({
    factorIds: ['material:concrete', 'material:steel', 'labor:carpentry'],
    regionCode: 'BENTON',
    economicIndicators: {
      CPI: 310.4,
      MATERIAL_INDEX: 225.8
    }
  }, null, 2),
  'assessment:validate': JSON.stringify({
    assessment: {
      id: 'assessment_id',
      propertyId: 'property_id',
      parcelNumber: 'ABC123',
      buildingType: 'single_family',
      buildingSize: 2500,
      yearBuilt: 2010,
      quality: 'good',
      condition: 'good',
      region: 'BENTON',
      totalValue: 450000,
      landValue: 100000,
      improvementValue: 350000,
      assessmentDate: new Date().toISOString(),
      calculationMethod: 'cost-approach'
    }
  }, null, 2),
  'curve:train': JSON.stringify({
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
  }, null, 2),
  'scenario:create': JSON.stringify({
    name: 'Example Scenario',
    description: 'A scenario for testing',
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
  }, null, 2),
  'boe:generate-argument': JSON.stringify({
    caseDetails: {
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
          saleDate: new Date("2024-11-15").toISOString(),
          salePrice: 495000,
          squareFeet: 2750,
          yearBuilt: 2007,
          distance: 0.8
        },
        {
          address: "2250 Hillside Terrace, Benton County, WA 99320",
          saleDate: new Date("2024-10-22").toISOString(),
          salePrice: 512000,
          squareFeet: 3100,
          yearBuilt: 2003,
          distance: 1.2
        }
      ],
      assessorRationale: "Initial assessment based on mass appraisal model using standard condition adjustments for neighborhood and age of property.",
      appealBasis: "overvaluation"
    },
    desiredTone: "professional",
    includeCitations: true,
    maxLength: 1500,
    focusAreas: [
      "Comparable sales analysis",
      "Property condition issues",
      "Proper adjustments for defects"
    ]
  }, null, 2),
  'boe:analyze-case': JSON.stringify({
    caseDetails: {
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
          saleDate: new Date("2024-11-15").toISOString(),
          salePrice: 495000,
          squareFeet: 2750,
          yearBuilt: 2007,
          distance: 0.8
        }
      ],
      appealBasis: "overvaluation"
    }
  }, null, 2),
  'boe:find-precedents': JSON.stringify({
    appealBasis: "overvaluation",
    propertyType: "single_family_residence"
  }, null, 2),
  'boe:cite-statutes': JSON.stringify({
    appealBasis: "overvaluation"
  }, null, 2)
};

interface SwarmTaskRunnerProps {
  isActive: boolean;
}

export function SwarmTaskRunner({ isActive }: SwarmTaskRunnerProps) {
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [taskResult, setTaskResult] = useState<any>(null);
  
  // Create form
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      agentId: '',
      taskType: '',
      taskData: '{}'
    },
  });
  
  // Task execution mutation
  const taskMutation = useMutation({
    mutationFn: async ({ agentId, taskType, taskData }: TaskFormValues) => {
      // Parse JSON task data
      const parsedData = JSON.parse(taskData);
      return runAgentTask(agentId, taskType, parsedData);
    },
    onSuccess: (data) => {
      setTaskResult({
        success: true,
        data: data.result
      });
    },
    onError: (error: any) => {
      setTaskResult({
        success: false,
        error: error.message || 'Failed to run task'
      });
    }
  });
  
  // Handle agent selection
  const handleAgentChange = (value: string) => {
    setSelectedAgentId(value);
    form.setValue('agentId', value);
    form.setValue('taskType', '');
    form.setValue('taskData', '{}');
  };
  
  // Handle task type selection
  const handleTaskTypeChange = (value: string) => {
    form.setValue('taskType', value);
    
    // Set template data for the selected task if available
    if (taskTemplates[value]) {
      form.setValue('taskData', taskTemplates[value]);
    } else {
      form.setValue('taskData', '{}');
    }
  };
  
  // Get tasks for selected agent
  const getTasksForAgent = () => {
    const agent = agents.find(a => a.id === selectedAgentId);
    return agent ? agent.tasks : [];
  };
  
  // Submit handler
  const onSubmit = (values: TaskFormValues) => {
    setTaskResult(null);
    taskMutation.mutate(values);
  };
  
  return (
    <div className="space-y-6 py-4">
      <h3 className="text-lg font-medium">Run Agent Task</h3>
      <p className="text-sm text-gray-500">
        Select an agent and task type, then provide the necessary task data in JSON format.
      </p>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Agent Selection */}
          <FormField
            control={form.control}
            name="agentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Agent</FormLabel>
                <Select
                  disabled={!isActive}
                  onValueChange={(value) => handleAgentChange(value)}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an agent" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Choose which AI agent will process your task
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Task Type Selection */}
          <FormField
            control={form.control}
            name="taskType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Task Type</FormLabel>
                <Select
                  disabled={!selectedAgentId || !isActive}
                  onValueChange={(value) => handleTaskTypeChange(value)}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a task type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {getTasksForAgent().map((task) => (
                      <SelectItem key={task.id} value={task.id}>
                        {task.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Select the type of task to run
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Task Data */}
          <FormField
            control={form.control}
            name="taskData"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Task Data (JSON)</FormLabel>
                <FormControl>
                  <Textarea
                    disabled={!selectedAgentId || !form.getValues().taskType || !isActive}
                    className="font-mono h-[200px]"
                    placeholder="Enter task data as JSON"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Provide the data needed for this task in JSON format
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button 
            type="submit" 
            disabled={!isActive || taskMutation.isPending}
          >
            {taskMutation.isPending ? "Running Task..." : "Run Task"}
          </Button>
        </form>
      </Form>
      
      {/* Task Results */}
      {taskResult && (
        <Card className="mt-6">
          <CardContent className="pt-6">
            {taskResult.success ? (
              <div className="space-y-4">
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <h3 className="text-lg font-medium">Task Completed Successfully</h3>
                </div>
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium mb-2">Result:</h4>
                  <pre className="text-xs overflow-auto max-h-[300px] p-2 bg-white border rounded">
                    {JSON.stringify(taskResult.data, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {taskResult.error}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building, 
  Construction, 
  Clock, 
  Calendar, 
  DollarSign, 
  BarChart3, 
  Wrench, 
  Truck,
  ArrowRight,
  Loader2,
  RefreshCw,
  PlayCircle,
  PauseCircle,
  SkipBack,
  SkipForward
} from 'lucide-react';

// Define interface for animation elements
interface AnimationElement {
  id: string;
  type: string;
  position: [number, number]; // Tuple type for [x, y] position
}

// Define interface for lifecycle stage
interface LifecycleStage {
  id: string;
  title: string;
  color: string;
  description: string;
  costPercentage: number;
  timelinePercentage: number;
  activities: string[];
  risks: string[];
  metrics: Record<string, string>;
  animation: {
    elements: AnimationElement[];
  };
}

// Define the lifecycle stages with more detailed visualization data
const LIFECYCLE_STAGES: LifecycleStage[] = [
  {
    id: 'planning',
    title: 'Planning',
    color: '#3B82F6', // blue-500
    description: 'The planning phase involves assessing needs, setting project scope, budgeting, and creating detailed designs.',
    costPercentage: 5,
    timelinePercentage: 15,
    activities: [
      'Needs assessment',
      'Feasibility studies',
      'Environmental impact studies',
      'Preliminary design',
      'Budget development',
      'Stakeholder consultations'
    ],
    risks: [
      'Incomplete requirements gathering',
      'Unrealistic budget constraints',
      'Regulatory compliance issues'
    ],
    metrics: {
      costAccuracy: '±15-20%',
      keyDecisions: 'High impact',
      flexibility: 'Highest'
    },
    animation: {
      elements: [
        { id: 'blueprint', type: 'blueprint', position: [20, 30] },
        { id: 'pencil', type: 'drawing', position: [60, 40] },
        { id: 'meeting', type: 'people', position: [40, 60] }
      ]
    }
  },
  {
    id: 'design',
    title: 'Design',
    color: '#8B5CF6', // violet-500
    description: 'Detailed architectural and engineering designs are created, incorporating all technical specifications and requirements.',
    costPercentage: 10,
    timelinePercentage: 20,
    activities: [
      'Architectural design',
      'Structural engineering',
      'Mechanical systems design',
      'Electrical systems design',
      'Material specifications',
      'Construction documents'
    ],
    risks: [
      'Design errors and omissions',
      'Scope creep',
      'Material availability constraints'
    ],
    metrics: {
      costAccuracy: '±10-15%',
      keyDecisions: 'High impact',
      flexibility: 'High'
    },
    animation: {
      elements: [
        { id: 'architect', type: 'person', position: [30, 40] },
        { id: 'computerModel', type: 'computer', position: [50, 30] },
        { id: 'blueprint', type: 'blueprint', position: [70, 50] }
      ]
    }
  },
  {
    id: 'permitting',
    title: 'Permitting',
    color: '#10B981', // emerald-500
    description: 'Securing necessary approvals and permits from regulatory agencies before construction can begin.',
    costPercentage: 3,
    timelinePercentage: 10,
    activities: [
      'Zoning approvals',
      'Building permits',
      'Environmental permits',
      'Utility connections approval',
      'Public hearings',
      'Regulatory compliance verification'
    ],
    risks: [
      'Permit delays',
      'Unexpected regulatory requirements',
      'Public opposition'
    ],
    metrics: {
      costAccuracy: '±10%',
      keyDecisions: 'Medium impact',
      flexibility: 'Medium'
    },
    animation: {
      elements: [
        { id: 'documents', type: 'papers', position: [40, 30] },
        { id: 'government', type: 'building', position: [60, 40] },
        { id: 'stamp', type: 'approval', position: [30, 60] }
      ]
    }
  },
  {
    id: 'construction',
    title: 'Construction',
    color: '#F59E0B', // amber-500
    description: 'The physical building phase where the infrastructure is constructed according to the approved designs.',
    costPercentage: 60,
    timelinePercentage: 30,
    activities: [
      'Site preparation',
      'Foundation work',
      'Structural framing',
      'Utility installation',
      'Enclosure and roofing',
      'Interior systems installation',
      'Landscaping'
    ],
    risks: [
      'Weather delays',
      'Labor shortages',
      'Material cost increases',
      'Safety incidents',
      'Unforeseen site conditions'
    ],
    metrics: {
      costAccuracy: '±5-10%',
      keyDecisions: 'Medium impact',
      flexibility: 'Low'
    },
    animation: {
      elements: [
        { id: 'crane', type: 'equipment', position: [30, 20] },
        { id: 'building', type: 'structure', position: [50, 50] },
        { id: 'workers', type: 'people', position: [70, 70] }
      ]
    }
  },
  {
    id: 'commissioning',
    title: 'Commissioning',
    color: '#EC4899', // pink-500
    description: 'Testing and verifying all systems work as designed before the project is officially complete and handed over.',
    costPercentage: 7,
    timelinePercentage: 5,
    activities: [
      'Systems testing',
      'Performance verification',
      'Training operations staff',
      'Documentation compilation',
      'Deficiency correction',
      'Final inspections'
    ],
    risks: [
      'System performance issues',
      'Integration failures',
      'Incomplete documentation',
      'Training gaps'
    ],
    metrics: {
      costAccuracy: '±5%',
      keyDecisions: 'Medium impact',
      flexibility: 'Low'
    },
    animation: {
      elements: [
        { id: 'inspector', type: 'person', position: [40, 40] },
        { id: 'clipboard', type: 'checklist', position: [60, 30] },
        { id: 'systems', type: 'controls', position: [50, 70] }
      ]
    }
  },
  {
    id: 'operation',
    title: 'Operation',
    color: '#3B82F6', // blue-500
    description: 'The day-to-day functioning of the infrastructure, including regular maintenance and management.',
    costPercentage: 100, // Over lifetime (shown differently)
    timelinePercentage: 0, // Ongoing (shown differently)
    activities: [
      'Regular inspections',
      'Preventive maintenance',
      'Systems monitoring',
      'User support',
      'Utility management',
      'Budget administration'
    ],
    risks: [
      'Operational disruptions',
      'Higher than expected costs',
      'System failures',
      'Staff turnover'
    ],
    metrics: {
      annualCost: '2-4% of asset value',
      operationalLife: '30-50 years',
      maintenanceInterval: 'Continuous'
    },
    animation: {
      elements: [
        { id: 'staff', type: 'people', position: [30, 50] },
        { id: 'building', type: 'structure', position: [60, 40] },
        { id: 'maintenance', type: 'tools', position: [50, 70] }
      ]
    }
  },
  {
    id: 'renovation',
    title: 'Renovation',
    color: '#F97316', // orange-500
    description: 'Periodic major updates to extend the infrastructure\'s lifespan or improve functionality.',
    costPercentage: 40, // % of original cost
    timelinePercentage: 15,
    activities: [
      'Condition assessment',
      'Renovation planning',
      'Systems upgrades',
      'Structural repairs',
      'Interior modernization',
      'Energy efficiency improvements'
    ],
    risks: [
      'Unexpected existing conditions',
      'Operational disruptions',
      'Compatibility with existing systems',
      'Historical preservation requirements'
    ],
    metrics: {
      frequency: 'Every 15-20 years',
      scope: '20-40% of systems',
      costRange: '30-50% of new construction'
    },
    animation: {
      elements: [
        { id: 'oldBuilding', type: 'structure', position: [30, 40] },
        { id: 'renovationTeam', type: 'people', position: [50, 60] },
        { id: 'newElements', type: 'materials', position: [70, 50] }
      ]
    }
  },
  {
    id: 'end-of-life',
    title: 'End-of-Life',
    color: '#6B7280', // gray-500
    description: 'The final phase where infrastructure is decommissioned, demolished, or repurposed when its useful life is complete.',
    costPercentage: 15, // % of original cost
    timelinePercentage: 5,
    activities: [
      'Decommissioning planning',
      'Asset recovery',
      'Controlled demolition',
      'Material recycling',
      'Site remediation',
      'Future use planning'
    ],
    risks: [
      'Environmental hazards',
      'Disposal regulations',
      'Demolition safety',
      'Incomplete records'
    ],
    metrics: {
      recoveryValue: '5-15% of materials',
      disposalCost: 'Highly variable',
      timeframe: '6-18 months'
    },
    animation: {
      elements: [
        { id: 'oldBuilding', type: 'structure', position: [40, 30] },
        { id: 'demolition', type: 'equipment', position: [60, 50] },
        { id: 'recycling', type: 'materials', position: [30, 70] }
      ]
    }
  }
];

// Animation elements for each stage
const AnimationElement: React.FC<{
  type: string,
  position: [number, number],
  color: string,
  isActive: boolean
}> = ({ type, position, color, isActive }) => {
  // Define different animations based on element type
  const getAnimation = () => {
    switch (type) {
      case 'blueprint':
        return (
          <motion.div 
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: isActive ? 1 : 0.3, 
              scale: isActive ? 1 : 0.8,
              rotate: isActive ? [0, 5, 0, -5, 0] : 0
            }}
            transition={{ 
              duration: 0.8, 
              repeat: isActive ? Infinity : 0, 
              repeatDelay: 3
            }}
            style={{ 
              left: `${position[0]}%`, 
              top: `${position[1]}%`,
              backgroundColor: `${color}22`,
              borderColor: color
            }}
            className="absolute w-16 h-20 border-2 rounded flex items-center justify-center"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="12" y1="18" x2="12" y2="12"></line>
              <line x1="9" y1="15" x2="15" y2="15"></line>
            </svg>
          </motion.div>
        );
        
      case 'building':
      case 'structure':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: isActive ? 1 : 0.3, 
              y: isActive ? 0 : 10,
              scale: isActive ? [1, 1.02, 1] : 1
            }}
            transition={{ 
              duration: 1.5, 
              repeat: isActive ? Infinity : 0, 
              repeatDelay: 2
            }}
            style={{ 
              left: `${position[0]}%`, 
              top: `${position[1]}%` 
            }}
            className="absolute"
          >
            <Building size={32} color={color} />
          </motion.div>
        );
        
      case 'people':
      case 'person':
        return (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: isActive ? 1 : 0.3, 
              x: isActive ? [0, 10, 0, -10, 0] : 0
            }}
            transition={{ 
              duration: 3, 
              repeat: isActive ? Infinity : 0, 
              repeatDelay: 1
            }}
            style={{ 
              left: `${position[0]}%`, 
              top: `${position[1]}%` 
            }}
            className="absolute"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </motion.div>
        );
        
      case 'equipment':
        return (
          <motion.div 
            initial={{ opacity: 0, rotate: -10 }}
            animate={{ 
              opacity: isActive ? 1 : 0.3, 
              rotate: isActive ? [0, 5, 0] : 0,
              y: isActive ? [0, -5, 0] : 0
            }}
            transition={{ 
              duration: 2, 
              repeat: isActive ? Infinity : 0, 
              repeatDelay: 1
            }}
            style={{ 
              left: `${position[0]}%`, 
              top: `${position[1]}%` 
            }}
            className="absolute"
          >
            <Construction size={32} color={color} />
          </motion.div>
        );
        
      case 'tools':
        return (
          <motion.div 
            initial={{ opacity: 0, rotate: 0 }}
            animate={{ 
              opacity: isActive ? 1 : 0.3, 
              rotate: isActive ? [0, 30, 0, -30, 0] : 0
            }}
            transition={{ 
              duration: 2, 
              repeat: isActive ? Infinity : 0, 
              repeatDelay: 1
            }}
            style={{ 
              left: `${position[0]}%`, 
              top: `${position[1]}%` 
            }}
            className="absolute"
          >
            <Wrench size={28} color={color} />
          </motion.div>
        );
        
      default:
        return (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: isActive ? 1 : 0.3, 
              scale: isActive ? 1 : 0.8 
            }}
            style={{ 
              left: `${position[0]}%`, 
              top: `${position[1]}%`,
              backgroundColor: `${color}22`,
              borderColor: color
            }}
            className="absolute w-8 h-8 rounded-full border flex items-center justify-center"
          >
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }}></div>
          </motion.div>
        );
    }
  };
  
  return getAnimation();
};

// Component for the animated scene
const AnimatedScene: React.FC<{ 
  stageData: typeof LIFECYCLE_STAGES[0],
  isActive: boolean
}> = ({ stageData, isActive }) => {
  return (
    <div className="relative w-full h-64 bg-muted/20 rounded-lg overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 flex items-center justify-center opacity-10">
        <div className="text-9xl font-bold">{stageData.title[0]}</div>
      </div>
      
      {/* Stage-specific animation elements */}
      {stageData.animation.elements.map((element) => (
        <AnimationElement 
          key={element.id}
          type={element.type}
          position={element.position}
          color={stageData.color}
          isActive={isActive}
        />
      ))}
      
      {/* Cost indicator */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 10 }}
        className="absolute bottom-4 right-4 bg-background/80 p-2 rounded-md flex items-center"
      >
        <DollarSign size={16} className="mr-1" />
        <span className="text-xs font-medium">
          {stageData.id === 'operation' 
            ? 'Ongoing costs' 
            : `${stageData.costPercentage}% of budget`}
        </span>
      </motion.div>
    </div>
  );
};

interface LifecycleStageDetailProps {
  stageData: typeof LIFECYCLE_STAGES[0];
}

// Component to display detailed information about a lifecycle stage
const LifecycleStageDetail: React.FC<LifecycleStageDetailProps> = ({ stageData }) => {
  return (
    <div className="space-y-4">
      <Tabs defaultValue="overview">
        <TabsList className="w-full">
          <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
          <TabsTrigger value="activities" className="flex-1">Activities</TabsTrigger>
          <TabsTrigger value="risks" className="flex-1">Risks</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-4">
          <p className="text-sm text-muted-foreground">{stageData.description}</p>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-muted/30 p-3 rounded-md">
              <div className="flex items-center text-sm font-medium">
                <Clock size={16} className="mr-2" /> Timeline
              </div>
              <p className="mt-1 text-sm">
                {stageData.id === 'operation' 
                  ? '30-50 years (asset lifespan)' 
                  : `${stageData.timelinePercentage}% of project timeline`}
              </p>
            </div>
            
            <div className="bg-muted/30 p-3 rounded-md">
              <div className="flex items-center text-sm font-medium">
                <DollarSign size={16} className="mr-2" /> Cost Impact
              </div>
              <p className="mt-1 text-sm">
                {stageData.id === 'operation' 
                  ? stageData.metrics.annualCost
                  : stageData.id === 'renovation'
                    ? stageData.metrics.costRange
                    : `${stageData.costPercentage}% of total budget`}
              </p>
            </div>
          </div>
          
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Key Metrics</h4>
            <div className="bg-muted/30 p-3 rounded-md">
              <dl className="text-sm">
                {Object.entries(stageData.metrics).map(([key, value]) => (
                  <div key={key} className="grid grid-cols-2 gap-2 mb-1">
                    <dt className="font-medium">{key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="activities" className="mt-4">
          <ul className="space-y-2">
            {stageData.activities.map((activity, index) => (
              <motion.li 
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start"
              >
                <ArrowRight size={16} className="mr-2 mt-1 flex-shrink-0 text-primary" />
                <span className="text-sm">{activity}</span>
              </motion.li>
            ))}
          </ul>
        </TabsContent>
        
        <TabsContent value="risks" className="mt-4">
          <ul className="space-y-2">
            {stageData.risks.map((risk, index) => (
              <motion.li 
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start bg-muted/30 p-2 rounded-md"
              >
                <span className="text-sm">{risk}</span>
              </motion.li>
            ))}
          </ul>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Main component for the Infrastructure Lifecycle Animation
const InfrastructureLifecycleAnimation: React.FC = () => {
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Function to move to the next stage
  const nextStage = () => {
    setActiveStageIndex(prev => (prev + 1) % LIFECYCLE_STAGES.length);
  };
  
  // Function to move to the previous stage
  const prevStage = () => {
    setActiveStageIndex(prev => (prev - 1 + LIFECYCLE_STAGES.length) % LIFECYCLE_STAGES.length);
  };
  
  // Toggle auto-play functionality
  const toggleAutoPlay = () => {
    setIsAutoPlaying(prev => !prev);
  };
  
  // Handle auto-play functionality
  useEffect(() => {
    if (isAutoPlaying) {
      // Reset progress
      setProgress(0);
      
      // Create a timer that updates progress every 50ms
      progressIntervalRef.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            return 0;
          }
          return prev + 1;
        });
      }, 50);
      
      // Create a timer to advance to the next stage
      autoPlayTimerRef.current = setTimeout(() => {
        nextStage();
      }, 5000); // 5 seconds per stage
      
      return () => {
        if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      };
    }
  }, [isAutoPlaying, activeStageIndex]);
  
  // When progress reaches 100%, move to next stage
  useEffect(() => {
    if (progress >= 100 && isAutoPlaying) {
      nextStage();
    }
  }, [progress]);
  
  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);
  
  // Get the current stage data
  const activeStage = LIFECYCLE_STAGES[activeStageIndex];
  
  return (
    <div className="w-full p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Infrastructure Lifecycle Animation</h2>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleAutoPlay}
            className="flex items-center"
          >
            {isAutoPlaying ? (
              <>
                <PauseCircle size={16} className="mr-2" />
                Pause
              </>
            ) : (
              <>
                <PlayCircle size={16} className="mr-2" />
                Play
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* Progress indicators */}
      <div className="w-full">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          {LIFECYCLE_STAGES.map((stage, index) => (
            <div 
              key={stage.id}
              className="flex flex-col items-center"
              style={{ 
                width: `${100 / LIFECYCLE_STAGES.length}%`, 
                color: index === activeStageIndex ? stage.color : undefined
              }}
            >
              <span className="truncate max-w-[80px] text-center font-medium">
                {stage.title}
              </span>
            </div>
          ))}
        </div>
        
        <div className="relative mb-2">
          <Progress 
            value={(activeStageIndex / (LIFECYCLE_STAGES.length - 1)) * 100} 
            className="h-2"
            style={{ 
              backgroundColor: '#e5e7eb', // gray-200
              '--tw-progress-bar-color': activeStage.color
            } as React.CSSProperties}
          />
          
          {/* Stage markers */}
          <div className="absolute top-0 left-0 w-full flex justify-between -mt-1 px-[1px]">
            {LIFECYCLE_STAGES.map((stage, index) => (
              <motion.button
                key={stage.id}
                initial={{ scale: 0.8 }}
                animate={{ 
                  scale: index === activeStageIndex ? 1.2 : 1,
                  backgroundColor: index <= activeStageIndex ? stage.color : '#e5e7eb'
                }}
                onClick={() => setActiveStageIndex(index)}
                className="w-4 h-4 rounded-full transition-colors border border-background"
                style={{ backgroundColor: index <= activeStageIndex ? stage.color : '#e5e7eb' }}
              />
            ))}
          </div>
        </div>
        
        {/* Auto-play progress */}
        {isAutoPlaying && (
          <Progress 
            value={progress} 
            className="h-1 mb-4" 
            style={{ '--tw-progress-bar-color': activeStage.color } as React.CSSProperties}
          />
        )}
      </div>
      
      {/* Main content grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left column - Animation */}
        <Card className="p-4 relative overflow-hidden">
          <h3 
            className="text-xl font-bold mb-3"
            style={{ color: activeStage.color }}
          >
            {activeStage.title}
          </h3>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStage.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <AnimatedScene 
                stageData={activeStage} 
                isActive={true} 
              />
            </motion.div>
          </AnimatePresence>
          
          {/* Navigation controls */}
          <div className="flex justify-between mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={prevStage}
              disabled={isAutoPlaying}
            >
              <SkipBack size={16} className="mr-2" />
              Previous
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={nextStage}
              disabled={isAutoPlaying}
            >
              Next
              <SkipForward size={16} className="ml-2" />
            </Button>
          </div>
        </Card>
        
        {/* Right column - Details */}
        <Card className="p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStage.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <LifecycleStageDetail stageData={activeStage} />
            </motion.div>
          </AnimatePresence>
        </Card>
      </div>
      
      {/* Full lifecycle visualization */}
      <Card className="p-4">
        <h3 className="text-xl font-bold mb-4">Complete Lifecycle Overview</h3>
        <div className="relative h-20 mb-2">
          {LIFECYCLE_STAGES.map((stage, index) => {
            // Calculate width percentage based on timeline percentage
            // Special case for operation which is displayed differently
            const width = stage.id === 'operation' 
              ? 30 // Give operation a fixed percentage of the width
              : stage.timelinePercentage;
            
            // Calculate the total of all other stages to determine position
            const position = LIFECYCLE_STAGES
              .slice(0, index)
              .reduce((acc, s) => acc + (s.id === 'operation' ? 30 : s.timelinePercentage), 0);
            
            const adjustedPosition = stage.id === 'operation' 
              ? position - 15 // Center the operation phase
              : position;
            
            return (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0.7, y: 10 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  scale: index === activeStageIndex ? 1.05 : 1
                }}
                className="absolute h-full rounded-md flex flex-col justify-between p-2"
                style={{
                  left: `${adjustedPosition}%`,
                  width: `${width}%`,
                  backgroundColor: `${stage.color}22`,
                  borderLeft: `4px solid ${stage.color}`,
                  zIndex: index === activeStageIndex ? 10 : 5,
                  transform: `translateX(${index === activeStageIndex ? '-2px' : '0'})` // Slight offset for active stage
                }}
              >
                <div className="text-xs font-medium truncate" style={{ color: stage.color }}>
                  {stage.title}
                </div>
                <div className="text-xs text-muted-foreground">
                  {stage.id === 'operation' 
                    ? '30-50 years' 
                    : `${stage.timelinePercentage}%`}
                </div>
              </motion.div>
            );
          })}
        </div>
        
        {/* Cost impact graph */}
        <h4 className="text-sm font-medium mt-6 mb-2">Relative Cost Impact</h4>
        <div className="relative h-16 bg-muted/20 rounded-md">
          {LIFECYCLE_STAGES.map((stage, index) => {
            // Skip operation as it's handled differently
            if (stage.id === 'operation') return null;
            
            // Calculate position based on where in the lifecycle this occurs
            const position = (index / (LIFECYCLE_STAGES.length - 1)) * 100;
            
            // Height based on cost percentage, max 100%
            const height = Math.min(100, stage.costPercentage * 1.5); // Scale for visibility
            
            return (
              <motion.div
                key={`cost-${stage.id}`}
                initial={{ height: 0 }}
                animate={{ 
                  height: `${height}%`,
                  opacity: index === activeStageIndex ? 1 : 0.7
                }}
                className="absolute bottom-0 w-8 rounded-t-md"
                style={{
                  left: `calc(${position}% - 1rem)`,
                  backgroundColor: stage.color
                }}
              >
                <div className="absolute -top-5 left-0 w-full text-center">
                  <span className="text-xs font-medium" style={{ color: stage.color }}>
                    {stage.costPercentage}%
                  </span>
                </div>
              </motion.div>
            );
          })}
          
          {/* Special operation cost indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute top-0 right-0 p-2 bg-background/80 rounded-md"
          >
            <span className="text-xs">Operation: ~2-4% of asset value annually</span>
          </motion.div>
        </div>
      </Card>
    </div>
  );
};

export default InfrastructureLifecycleAnimation;
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building, 
  Construction, 
  Clock, 
  BarChart4, 
  Wrench, 
  LifeBuoy, 
  Recycle, 
  AlertTriangle,
  Zap,
  Truck,
  DollarSign,
  Hammer,
  FileText,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Define the lifecycle stages for infrastructure
const LIFECYCLE_STAGES = [
  {
    id: 'planning',
    title: 'Planning & Design',
    icon: <FileText className="h-16 w-16 text-blue-500" />,
    description: 'Initial project planning, requirements gathering, and design specifications',
    costImpact: 'Low initial investment, high long-term impact',
    duration: '10-15% of project timeline',
    keyActivities: [
      'Requirements gathering',
      'Stakeholder consultations',
      'Preliminary designs',
      'Cost estimations',
      'Feasibility studies'
    ]
  },
  {
    id: 'approval',
    title: 'Approval & Funding',
    icon: <DollarSign className="h-16 w-16 text-green-500" />,
    description: 'Securing necessary approvals and funding allocations for the project',
    costImpact: 'Budget allocation phase, establishes financial boundaries',
    duration: '5-10% of project timeline',
    keyActivities: [
      'Budget approval',
      'Grant applications',
      'Funding allocation',
      'Regulatory clearances',
      'Environmental impact assessments'
    ]
  },
  {
    id: 'construction',
    title: 'Construction',
    icon: <Construction className="h-16 w-16 text-yellow-500" />,
    description: 'The actual building phase where physical infrastructure is created',
    costImpact: 'Highest cost phase, 60-70% of total project budget',
    duration: '30-40% of project timeline',
    keyActivities: [
      'Site preparation',
      'Foundation work',
      'Structure construction',
      'Utility installation',
      'Progress monitoring and quality control'
    ]
  },
  {
    id: 'commissioning',
    title: 'Commissioning',
    icon: <Zap className="h-16 w-16 text-purple-500" />,
    description: 'Testing and verifying all systems work as designed before handover',
    costImpact: 'Moderate cost, crucial for preventing future expenses',
    duration: '5-10% of project timeline',
    keyActivities: [
      'Systems testing',
      'Performance verification',
      'Deficiency correction',
      'Documentation finalization',
      'Training staff on operations'
    ]
  },
  {
    id: 'operation',
    title: 'Operation & Maintenance',
    icon: <Wrench className="h-16 w-16 text-blue-600" />,
    description: 'Day-to-day operations and regular maintenance to ensure functionality',
    costImpact: 'Ongoing costs spread over decades, typically 2-3% of asset value annually',
    duration: 'Longest phase, typically 30+ years',
    keyActivities: [
      'Regular inspections',
      'Preventive maintenance',
      'Operational adjustments',
      'Performance monitoring',
      'Minor repairs and upgrades'
    ]
  },
  {
    id: 'renovation',
    title: 'Renovation & Upgrade',
    icon: <Hammer className="h-16 w-16 text-orange-500" />,
    description: 'Periodic major updates to extend lifespan and improve functionality',
    costImpact: 'Periodic large investments, typically every 15-20 years',
    duration: 'Cyclical, 5-15% of original construction time',
    keyActivities: [
      'Assessment of current conditions',
      'Technology upgrades',
      'Structural reinforcement',
      'Energy efficiency improvements',
      'Compliance with updated codes'
    ]
  },
  {
    id: 'end-of-life',
    title: 'End-of-Life',
    icon: <Recycle className="h-16 w-16 text-green-600" />,
    description: 'Decommissioning, demolition, or repurposing when useful life is complete',
    costImpact: 'Significant final costs, offset by recycling/salvage value',
    duration: '5-10% of project timeline',
    keyActivities: [
      'Decommissioning planning',
      'Asset recovery and recycling',
      'Demolition or dismantling',
      'Site remediation',
      'Final documentation'
    ]
  }
];

// Animation variants for framer-motion
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5
    }
  }
};

// The main component
const InfrastructureLifecycleStoryTeller: React.FC = () => {
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);
  
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
      const progressInterval = setInterval(() => {
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
        clearTimeout(autoPlayTimerRef.current as NodeJS.Timeout);
        clearInterval(progressInterval);
      };
    }
  }, [isAutoPlaying, activeStageIndex]);
  
  // When progress reaches 100%, move to next stage
  useEffect(() => {
    if (progress >= 100 && isAutoPlaying) {
      nextStage();
    }
  }, [progress]);
  
  // Get the current stage data
  const activeStage = LIFECYCLE_STAGES[activeStageIndex];
  
  return (
    <div className="w-full p-4 bg-background">
      <h2 className="text-3xl font-bold text-center mb-8">Infrastructure Lifecycle Storyteller</h2>
      
      {/* Progress bar for overall lifecycle */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>Planning</span>
          <span>Construction</span>
          <span>Operation</span>
          <span>End-of-Life</span>
        </div>
        <div className="relative">
          <Progress value={(activeStageIndex / (LIFECYCLE_STAGES.length - 1)) * 100} className="h-2" />
          
          {/* Stage markers */}
          <div className="absolute top-0 left-0 w-full flex justify-between -mt-1">
            {LIFECYCLE_STAGES.map((stage, index) => (
              <TooltipProvider key={stage.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setActiveStageIndex(index)}
                      className={`w-4 h-4 rounded-full transition-colors ${
                        index <= activeStageIndex 
                          ? 'bg-primary' 
                          : 'bg-muted border border-input'
                      }`}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{stage.title}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </div>
      </div>
      
      {/* Auto-play progress */}
      {isAutoPlaying && (
        <Progress value={progress} className="h-1 mb-4" />
      )}
      
      {/* Main content area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Left column - Visual representation */}
        <Card className="p-6 col-span-1 flex flex-col items-center justify-center bg-muted/30">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStage.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center text-center"
            >
              {activeStage.icon}
              <h3 className="text-xl font-semibold mt-4">{activeStage.title}</h3>
              <div className="text-sm text-muted-foreground mt-2">
                <Clock className="inline-block w-4 h-4 mr-1" />
                {activeStage.duration}
              </div>
            </motion.div>
          </AnimatePresence>
        </Card>
        
        {/* Right column - Details and information */}
        <Card className="p-6 col-span-1 lg:col-span-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStage.id}
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={containerVariants}
            >
              <motion.div variants={itemVariants}>
                <h3 className="text-2xl font-bold">{activeStage.title}</h3>
                <p className="text-muted-foreground mt-2">{activeStage.description}</p>
              </motion.div>
              
              <Separator className="my-4" />
              
              <motion.div variants={itemVariants}>
                <div className="flex items-center mb-2">
                  <BarChart4 className="w-5 h-5 mr-2 text-primary" />
                  <h4 className="font-semibold">Cost Impact</h4>
                </div>
                <p className="text-sm ml-7">{activeStage.costImpact}</p>
              </motion.div>
              
              <Separator className="my-4" />
              
              <motion.div variants={itemVariants}>
                <div className="flex items-center mb-2">
                  <AlertTriangle className="w-5 h-5 mr-2 text-primary" />
                  <h4 className="font-semibold">Key Activities</h4>
                </div>
                <ul className="list-disc list-inside text-sm ml-7 space-y-1">
                  {activeStage.keyActivities.map((activity, index) => (
                    <motion.li 
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                    >
                      {activity}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </Card>
      </div>
      
      {/* Controls */}
      <div className="flex justify-center space-x-4">
        <Button 
          variant="outline" 
          size="icon"
          onClick={prevStage}
          disabled={isAutoPlaying}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <Button 
          variant={isAutoPlaying ? "secondary" : "default"} 
          onClick={toggleAutoPlay}
        >
          {isAutoPlaying ? "Pause Story" : "Auto-Play Story"}
        </Button>
        
        <Button 
          variant="outline" 
          size="icon"
          onClick={nextStage}
          disabled={isAutoPlaying}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default InfrastructureLifecycleStoryTeller;
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { InfoIcon, AlertTriangle, ArrowRight, Play, Pause, SkipBack, SkipForward } from "lucide-react";
// We'll implement just one visualization type for now
// import { Infrastructure2DLifecycle } from "./Infrastructure2DLifecycle";
// import { Infrastructure3DLifecycle } from "./Infrastructure3DLifecycle";

// Define the lifecycle stages
const lifecycleStages = [
  {
    id: "planning",
    title: "Planning & Design",
    description: "Initial assessment, requirements gathering, and architectural design of the infrastructure.",
    activities: [
      "Site selection and evaluation",
      "Preliminary design and cost estimation",
      "Environmental impact assessment",
      "Stakeholder consultation",
      "Regulatory compliance planning"
    ],
    duration: "6-12 months",
    costPercentage: 5,
    riskLevel: "Medium"
  },
  {
    id: "construction",
    title: "Construction & Implementation",
    description: "Physical building and development of the infrastructure asset.",
    activities: [
      "Site preparation and foundation work",
      "Structural construction",
      "Utility installation",
      "Equipment and systems integration",
      "Quality assurance testing"
    ],
    duration: "1-3 years",
    costPercentage: 40,
    riskLevel: "High"
  },
  {
    id: "operation",
    title: "Operation & Maintenance",
    description: "Day-to-day management, usage, and maintenance of the infrastructure.",
    activities: [
      "Regular inspections and maintenance",
      "Operational management",
      "Performance monitoring",
      "Minor repairs and upgrades",
      "User support and services"
    ],
    duration: "15-30 years",
    costPercentage: 35,
    riskLevel: "Low"
  },
  {
    id: "renovation",
    title: "Renovation & Upgrade",
    description: "Major improvements, modernization, and capacity expansions.",
    activities: [
      "Condition assessment",
      "Technology and systems upgrades",
      "Structural reinforcement",
      "Energy efficiency improvements",
      "Capacity expansion"
    ],
    duration: "1-2 years",
    costPercentage: 15,
    riskLevel: "Medium"
  },
  {
    id: "endOfLife",
    title: "End-of-Life Management",
    description: "Decommissioning, demolition, or repurposing of the infrastructure.",
    activities: [
      "Decommissioning plan development",
      "Safe removal of hazardous materials",
      "Demolition or dismantling",
      "Site remediation",
      "Material recycling and waste management"
    ],
    duration: "6-18 months",
    costPercentage: 5,
    riskLevel: "High"
  }
];

// Risk level to color mapping
const riskColorMap = {
  "Low": "bg-green-100 text-green-800",
  "Medium": "bg-yellow-100 text-yellow-800",
  "High": "bg-red-100 text-red-800"
};

export function InfrastructureLifecycleStoryTeller() {
  const [activeStage, setActiveStage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Calculate cumulative cost percentage up to the current stage
  const cumulativeCost = lifecycleStages
    .slice(0, activeStage + 1)
    .reduce((sum, stage) => sum + stage.costPercentage, 0);
  
  const currentStage = lifecycleStages[activeStage];
  
  // Handle stage navigation
  const goToNextStage = () => {
    if (activeStage < lifecycleStages.length - 1) {
      setActiveStage(activeStage + 1);
    }
  };
  
  const goToPreviousStage = () => {
    if (activeStage > 0) {
      setActiveStage(activeStage - 1);
    }
  };
  
  // Toggle play/pause of animation
  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };
  
  // Handle autoplay logic
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying) {
      interval = setInterval(() => {
        setActiveStage(prev => {
          if (prev < lifecycleStages.length - 1) {
            return prev + 1;
          } else {
            setIsPlaying(false); // Stop playing when we reach the end
            return prev;
          }
        });
      }, 5000); // Change stage every 5 seconds
    }
    
    return () => clearInterval(interval);
  }, [isPlaying]);
  
  return (
    <div className="container mx-auto py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Visualization */}
        <div className="lg:col-span-2">
          <Card className="w-full h-full shadow-lg border-0">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle>Infrastructure Lifecycle Visualization</CardTitle>
                <Badge variant="outline" className="bg-[#e6eef2] text-[#243E4D] border-none">
                  Interactive View
                </Badge>
              </div>
              <CardDescription>
                Interactive visualization of infrastructure assets across their lifecycle
              </CardDescription>
            </CardHeader>
            
            <CardContent className="h-[500px] bg-gray-50 rounded-md flex items-center justify-center">
              <div className="flex flex-col items-center justify-center text-center p-8">
                <div className={`w-32 h-32 rounded-full mb-4 flex items-center justify-center text-3xl font-bold ${
                  activeStage === 0 ? 'bg-blue-100 text-blue-800' :
                  activeStage === 1 ? 'bg-yellow-100 text-yellow-800' :
                  activeStage === 2 ? 'bg-green-100 text-green-800' :
                  activeStage === 3 ? 'bg-purple-100 text-purple-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {activeStage + 1}
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">{currentStage.title}</h3>
                <p className="text-gray-600 max-w-md">
                  {currentStage.description}
                </p>
                <div className="mt-6 w-full max-w-md">
                  <div className="flex justify-between w-full">
                    {lifecycleStages.map((stage, index) => (
                      <div 
                        key={index}
                        className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer 
                          ${index === activeStage 
                            ? 'bg-[#29B7D3] text-white' 
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                        onClick={() => setActiveStage(index)}
                      >
                        {index + 1}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="pt-4 flex justify-between items-center">
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={goToPreviousStage}
                  disabled={activeStage === 0}
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button
                  variant={isPlaying ? "outline" : "default"}
                  size="sm"
                  onClick={togglePlayPause}
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  <span className="ml-2">{isPlaying ? "Pause" : "Play"} Animation</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={goToNextStage}
                  disabled={activeStage === lifecycleStages.length - 1}
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>
              
              <Badge 
                variant="outline" 
                className="text-[#243E4D] bg-[#e6eef2] border-none"
              >
                {currentStage.title}
              </Badge>
            </CardFooter>
          </Card>
          
          {/* Timeline progress */}
          <div className="mt-4">
            <div className="flex justify-between items-center mb-1 text-sm text-gray-500">
              <span>Planning</span>
              <span>Construction</span>
              <span>Operation</span>
              <span>Renovation</span>
              <span>End-of-Life</span>
            </div>
            <div className="relative">
              <Progress value={(activeStage / (lifecycleStages.length - 1)) * 100} className="h-2" />
              <div className="flex justify-between absolute w-full top-2">
                {lifecycleStages.map((_, index) => (
                  <div 
                    key={index}
                    className={`w-3 h-3 rounded-full -mt-[5px] ${index <= activeStage ? 'bg-[#29B7D3]' : 'bg-gray-300'}`}
                    style={{ marginLeft: index === 0 ? '0' : index === lifecycleStages.length - 1 ? '-6px' : '' }}
                  />
                ))}
              </div>
            </div>
          </div>
          
          {/* Cost Estimation Summary */}
          <Card className="mt-6 shadow-md border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Lifecycle Cost Distribution</CardTitle>
              <CardDescription>
                Approximate cost breakdown across all lifecycle stages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Current Stage Cost: {currentStage.costPercentage}%</span>
                  <span>Cumulative Cost: {cumulativeCost}%</span>
                </div>
                
                <div className="w-full h-6 bg-gray-100 rounded-full overflow-hidden">
                  {lifecycleStages.map((stage, index) => (
                    <div 
                      key={index}
                      className="h-full float-left" 
                      style={{ 
                        width: `${stage.costPercentage}%`,
                        backgroundColor: index === activeStage ? '#29B7D3' : 
                                         index < activeStage ? '#a0d2e2' : '#e6eef2'
                      }}
                    />
                  ))}
                </div>
                
                <div className="flex justify-between">
                  {lifecycleStages.map((stage, index) => (
                    <div key={index} className="text-center">
                      <div 
                        className="w-3 h-3 mx-auto mb-1 rounded-full"
                        style={{ backgroundColor: index === activeStage ? '#29B7D3' : '#e6eef2' }}
                      />
                      <div className="text-xs">{stage.costPercentage}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Right column - Stage details */}
        <div>
          <Card className="shadow-lg border-0 h-full">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle>{currentStage.title}</CardTitle>
                <Badge 
                  variant="outline" 
                  className={riskColorMap[currentStage.riskLevel as keyof typeof riskColorMap]}
                >
                  {currentStage.riskLevel} Risk
                </Badge>
              </div>
              <CardDescription>
                Typical Duration: {currentStage.duration}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">Overview</h3>
                <p className="text-gray-600">
                  {currentStage.description}
                </p>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Key Activities</h3>
                <ul className="space-y-2">
                  {currentStage.activities.map((activity, index) => (
                    <li key={index} className="flex items-start">
                      <ArrowRight className="h-4 w-4 text-[#29B7D3] mt-1 mr-2 flex-shrink-0" />
                      <span className="text-gray-600">{activity}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-medium mb-2">Cost Considerations</h3>
                <div className="bg-[#e6eef2] rounded-md p-3 text-[#243E4D]">
                  <div className="flex justify-between mb-1">
                    <span>Stage Cost:</span>
                    <span className="font-medium">{currentStage.costPercentage}% of total</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cumulative Cost:</span>
                    <span className="font-medium">{cumulativeCost}% of total</span>
                  </div>
                </div>
              </div>
              
              {activeStage === 0 && (
                <Alert variant="default" className="bg-blue-50 border-blue-200">
                  <InfoIcon className="h-4 w-4 text-blue-500" />
                  <AlertTitle>Benton County Cost Matrix Available</AlertTitle>
                  <AlertDescription>
                    Access detailed cost estimation matrices specific to Benton County for this planning stage.
                  </AlertDescription>
                </Alert>
              )}
              
              {activeStage === 4 && (
                <Alert variant="default" className="bg-amber-50 border-amber-200">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <AlertTitle>Environmental Considerations</AlertTitle>
                  <AlertDescription>
                    End-of-life management requires careful planning for environmental impact mitigation and materials recycling.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
            
            <CardFooter>
              <div className="w-full">
                <Button 
                  variant="default" 
                  className="w-full"
                  onClick={goToNextStage}
                  disabled={activeStage === lifecycleStages.length - 1}
                >
                  {activeStage < lifecycleStages.length - 1 ? 'Continue to Next Stage' : 'Lifecycle Complete'}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default InfrastructureLifecycleStoryTeller;
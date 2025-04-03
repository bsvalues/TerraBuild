import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HardHat, Home, Building, Construction, Hammer, DollarSign, Wrench, Ruler, Clock, PlayCircle } from 'lucide-react';

// Define animation types
export type ConstructionAnimationType = 
  | 'foundation' 
  | 'framing' 
  | 'plumbing' 
  | 'electrical' 
  | 'finishes'
  | 'complete';

interface CostImpactAnimationProps {
  buildingType: string;
  baseCost: number;
  complexityFactor: number;
  conditionFactor: number;
  regionalMultiplier: number;
  ageDepreciation: number;
  onAnimationComplete?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

const CostImpactAnimation: React.FC<CostImpactAnimationProps> = ({
  buildingType,
  baseCost,
  complexityFactor,
  conditionFactor,
  regionalMultiplier,
  ageDepreciation,
  onAnimationComplete,
  size = 'md'
}) => {
  const [currentStage, setCurrentStage] = useState<ConstructionAnimationType>('foundation');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentCost, setCurrentCost] = useState(baseCost);
  const [showFactors, setShowFactors] = useState(false);
  
  // Size mapping
  const sizeMap = {
    sm: {
      container: 'h-48',
      iconSize: 'h-8 w-8',
      fontSize: 'text-sm',
      building: 'h-16 w-16'
    },
    md: {
      container: 'h-64',
      iconSize: 'h-12 w-12',
      fontSize: 'text-base',
      building: 'h-24 w-24'
    },
    lg: {
      container: 'h-96',
      iconSize: 'h-16 w-16',
      fontSize: 'text-lg',
      building: 'h-32 w-32'
    }
  };
  
  // Building colors based on building type
  const getBuildingColor = () => {
    switch(buildingType) {
      case 'RESIDENTIAL':
        return '#3CAB36'; // Green for residential
      case 'COMMERCIAL':
        return '#29B7D3'; // Blue for commercial
      case 'INDUSTRIAL':
        return '#243E4D'; // Dark teal for industrial
      default:
        return '#3CAB36';
    }
  };
  
  // Play through all animations in sequence
  const playAnimation = () => {
    setIsPlaying(true);
    setCurrentStage('foundation');
    setCurrentCost(baseCost);
    setShowFactors(false);
  };
  
  // Advance to the next construction stage
  useEffect(() => {
    if (!isPlaying) return;
    
    const stages: ConstructionAnimationType[] = ['foundation', 'framing', 'plumbing', 'electrical', 'finishes', 'complete'];
    const currentIndex = stages.indexOf(currentStage);
    
    const timer = setTimeout(() => {
      if (currentIndex < stages.length - 1) {
        setCurrentStage(stages[currentIndex + 1]);
        
        // Update cost based on stage
        if (currentIndex === 0) { // After foundation, apply complexity
          setCurrentCost(prev => prev * complexityFactor);
        } else if (currentIndex === 1) { // After framing, apply condition
          setCurrentCost(prev => prev * conditionFactor);
        } else if (currentIndex === 2) { // After plumbing, apply regional
          setCurrentCost(prev => prev * regionalMultiplier);
        } else if (currentIndex === 3) { // After electrical, apply age
          setCurrentCost(prev => prev * (1 - ageDepreciation/100));
        } else if (currentIndex === 4) { // Complete
          setShowFactors(true);
          if (onAnimationComplete) {
            onAnimationComplete();
          }
        }
      } else {
        setIsPlaying(false);
      }
    }, 2000); // 2 seconds per stage
    
    return () => clearTimeout(timer);
  }, [isPlaying, currentStage, complexityFactor, conditionFactor, regionalMultiplier, ageDepreciation, onAnimationComplete]);
  
  // Get the appropriate icon for the current stage
  const getStageIcon = () => {
    switch(currentStage) {
      case 'foundation':
        return <HardHat className={sizeMap[size].iconSize} />;
      case 'framing':
        return <Hammer className={sizeMap[size].iconSize} />;
      case 'plumbing':
        return <Wrench className={sizeMap[size].iconSize} />;
      case 'electrical':
        return <Construction className={sizeMap[size].iconSize} />;
      case 'finishes':
        return <Ruler className={sizeMap[size].iconSize} />;
      case 'complete':
        return buildingType === 'RESIDENTIAL' 
          ? <Home className={sizeMap[size].iconSize} /> 
          : <Building className={sizeMap[size].iconSize} />;
      default:
        return <HardHat className={sizeMap[size].iconSize} />;
    }
  };
  
  // Get the text description for the current stage
  const getStageDescription = () => {
    switch(currentStage) {
      case 'foundation':
        return 'Base Cost';
      case 'framing':
        return 'Complexity Factor';
      case 'plumbing':
        return 'Condition Factor';
      case 'electrical':
        return 'Regional Adjustment';
      case 'finishes':
        return 'Age Depreciation';
      case 'complete':
        return 'Final Cost Estimate';
      default:
        return 'Base Cost';
    }
  };
  
  return (
    <div className={`relative ${sizeMap[size].container} bg-gray-50 rounded-lg border overflow-hidden`}>
      {/* Construction site background */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-100 to-gray-200 flex items-center justify-center">
        {/* Construction animation area */}
        <div className="relative">
          {/* Building animation */}
          <AnimatePresence>
            <motion.div
              key={currentStage}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.2, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center"
            >
              <div className={`${sizeMap[size].building} mb-4 flex items-center justify-center`} style={{ color: getBuildingColor() }}>
                {getStageIcon()}
              </div>
              
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className={`text-center ${sizeMap[size].fontSize}`}
              >
                <p className="font-medium text-gray-700">{getStageDescription()}</p>
                <p className="text-2xl font-bold mt-1 flex items-center justify-center">
                  <DollarSign className="h-5 w-5" />
                  {Math.round(currentCost).toLocaleString()}
                </p>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      
      {/* Playback controls */}
      <div className="absolute bottom-2 right-2">
        <button 
          onClick={playAnimation}
          disabled={isPlaying}
          className={`p-2 rounded-full bg-white shadow hover:bg-gray-100 transition-colors ${isPlaying ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isPlaying ? <Clock className="h-5 w-5" /> : <PlayCircle className="h-5 w-5" />}
        </button>
      </div>
      
      {/* Cost factors breakdown (shown after animation) */}
      {showFactors && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-2 left-2 right-12 bg-white bg-opacity-90 rounded p-2 text-xs"
        >
          <div className="flex justify-between items-center mb-1">
            <span>Base:</span>
            <span>${baseCost.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center mb-1">
            <span>Complexity:</span>
            <span>×{complexityFactor.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center mb-1">
            <span>Condition:</span>
            <span>×{conditionFactor.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center mb-1">
            <span>Regional:</span>
            <span>×{regionalMultiplier.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Age:</span>
            <span>−{ageDepreciation}%</span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CostImpactAnimation;
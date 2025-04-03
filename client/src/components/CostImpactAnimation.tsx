import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HardHat, Home, Building, Construction, Hammer, DollarSign, 
  Wrench, Ruler, Clock, PlayCircle, Dices, Briefcase, MapPin,
  HeartPulse, AreaChart, BadgeDollarSign, Repeat
} from 'lucide-react';

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
  region?: string;
  buildingAge?: number;
  squareFootage?: number; 
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
  region = 'MIDWEST',
  buildingAge = 0,
  squareFootage = 1000,
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
        return <DollarSign className={sizeMap[size].iconSize} />;
      case 'framing':
        return <Dices className={sizeMap[size].iconSize} />;
      case 'plumbing':
        return <HeartPulse className={sizeMap[size].iconSize} />;
      case 'electrical':
        return <MapPin className={sizeMap[size].iconSize} />;
      case 'finishes':
        return <Clock className={sizeMap[size].iconSize} />;
      case 'complete':
        return buildingType === 'RESIDENTIAL' 
          ? <Home className={sizeMap[size].iconSize} /> 
          : buildingType === 'COMMERCIAL'
            ? <Briefcase className={sizeMap[size].iconSize} />
            : <Building className={sizeMap[size].iconSize} />;
      default:
        return <HardHat className={sizeMap[size].iconSize} />;
    }
  };
  
  // Get the stage color
  const getStageColor = () => {
    switch(currentStage) {
      case 'foundation':
        return '#243E4D'; // Base cost - dark teal
      case 'framing':
        return '#3F51B5'; // Complexity - indigo
      case 'plumbing':
        return '#3CAB36'; // Condition - green
      case 'electrical':
        return '#29B7D3'; // Regional - light blue
      case 'finishes':
        return ageDepreciation > 0 ? '#F5A623' : '#3CAB36'; // Age - orange/amber (or green if new)
      case 'complete':
        return getBuildingColor(); // Final - building type color
      default:
        return '#243E4D';
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
  
  // Get explanatory text for each stage
  const getStageExplanation = () => {
    switch(currentStage) {
      case 'foundation':
        return `Base cost for ${buildingTypes[buildingType]} building at $${(baseCost / squareFootage).toFixed(0)}/sq ft`;
      case 'framing':
        return `${complexityFactor > 1 ? 'Complex' : 'Simple'} design increases cost by ${Math.abs((complexityFactor - 1) * 100).toFixed(0)}%`;
      case 'plumbing':
        return `${conditionFactor > 1 ? 'Excellent' : 'Standard'} condition adds ${Math.abs((conditionFactor - 1) * 100).toFixed(0)}% to value`;
      case 'electrical':
        return `Regional cost factor for ${region.replace('_', ' ').toLowerCase()} area`;
      case 'finishes':
        return ageDepreciation > 0 
          ? `${buildingAge} years old reduces value by ${ageDepreciation}%` 
          : 'New building - no depreciation applied';
      case 'complete':
        return `Final calculation complete for ${squareFootage} sq ft`;
      default:
        return '';
    }
  };
  
  // Get building type label
  const buildingTypes: Record<string, string> = {
    'RESIDENTIAL': 'residential',
    'COMMERCIAL': 'commercial',
    'INDUSTRIAL': 'industrial'
  };
  
  return (
    <div className={`relative ${sizeMap[size].container} bg-gray-50 rounded-lg border overflow-hidden`}>
      {/* Construction site background */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-100 to-gray-200 flex items-center justify-center overflow-hidden">
        {/* Blueprint grid pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full bg-[#29B7D3]" 
            style={{
              backgroundImage: 'linear-gradient(white 2px, transparent 2px), linear-gradient(90deg, white 2px, transparent 2px)',
              backgroundSize: '20px 20px',
            }}
          />
        </div>
        
        {/* Construction animation area */}
        <div className="relative z-10">
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
              <div 
                className={`${sizeMap[size].building} mb-4 flex items-center justify-center rounded-full p-4`} 
                style={{ 
                  color: 'white',
                  backgroundColor: getStageColor()
                }}
              >
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
                <p className="text-xs text-gray-600 mt-2 max-w-[220px]">
                  {getStageExplanation()}
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
          className="absolute bottom-2 left-2 right-12 bg-white bg-opacity-95 rounded-md p-3 text-xs shadow-md"
        >
          <h4 className="font-semibold text-gray-800 mb-2 border-b pb-1">Cost Breakdown</h4>
          <div className="flex justify-between items-center mb-1">
            <span className="flex items-center">
              <DollarSign className="h-3 w-3 mr-1 text-[#243E4D]" />
              Base Cost:
            </span>
            <span className="font-medium">${baseCost.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center mb-1">
            <span className="flex items-center">
              <Dices className="h-3 w-3 mr-1 text-[#3F51B5]" />
              Complexity:
            </span>
            <span 
              className={`font-medium ${complexityFactor > 1 ? 'text-[#3F51B5]' : 'text-gray-600'}`}
            >
              ×{complexityFactor.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center mb-1">
            <span className="flex items-center">
              <HeartPulse className="h-3 w-3 mr-1 text-[#3CAB36]" />
              Condition:
            </span>
            <span 
              className={`font-medium ${conditionFactor > 1 ? 'text-[#3CAB36]' : 'text-gray-600'}`}
            >
              ×{conditionFactor.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center mb-1">
            <span className="flex items-center">
              <MapPin className="h-3 w-3 mr-1 text-[#29B7D3]" />
              Regional:
            </span>
            <span 
              className={`font-medium ${regionalMultiplier > 1 ? 'text-[#29B7D3]' : 'text-gray-600'}`}
            >
              ×{regionalMultiplier.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center mb-1">
            <span className="flex items-center">
              <Clock className="h-3 w-3 mr-1 text-[#F5A623]" />
              Age Depreciation:
            </span>
            <span 
              className={`font-medium ${ageDepreciation > 0 ? 'text-[#F5A623]' : 'text-[#3CAB36]'}`}
            >
              {ageDepreciation > 0 ? `−${ageDepreciation}%` : 'None'}
            </span>
          </div>
          <div className="flex justify-between items-center mt-2 pt-1 border-t font-semibold">
            <span>Final Cost:</span>
            <span className="text-[#243E4D]">${Math.round(currentCost).toLocaleString()}</span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CostImpactAnimation;
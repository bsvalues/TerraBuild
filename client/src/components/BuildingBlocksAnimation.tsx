import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { PlayCircle, PauseCircle, RefreshCw } from 'lucide-react';

interface BuildingBlock {
  id: string;
  category: string;
  cost: number;
  percentage: number;
  height: number;
  width: number;
  color: string;
  x: number;
  y: number;
}

interface BuildingBlocksAnimationProps {
  costBreakdown: { category: string, cost: number }[];
  totalCost: number;
  onReady?: () => void;
}

const BuildingBlocksAnimation: React.FC<BuildingBlocksAnimationProps> = ({
  costBreakdown,
  totalCost,
  onReady
}) => {
  const [blocks, setBlocks] = useState<BuildingBlock[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Colors for different types of building blocks
  const categoryColors: Record<string, string> = {
    'Base Cost': '#3b82f6', // blue
    'Foundations': '#f59e0b', // amber
    'Framing': '#84cc16', // lime
    'Exterior': '#14b8a6', // teal
    'Roofing': '#ef4444', // red
    'Interior': '#8b5cf6', // violet
    'Electrical': '#ec4899', // pink
    'Plumbing': '#06b6d4', // cyan
    'Hvac': '#f97316', // orange
    'Finishes': '#a855f7', // purple
    'Regional Adjustment': '#0ea5e9', // sky
    'Complexity': '#10b981', // emerald
    'Condition': '#6366f1', // indigo
    // Default color for other categories
    'default': '#6b7280' // gray
  };
  
  // Initialize blocks based on cost breakdown
  useEffect(() => {
    if (!costBreakdown || costBreakdown.length === 0 || !containerRef.current) return;
    
    const createBlocks = () => {
      const containerWidth = containerRef.current?.clientWidth || 600;
      const containerHeight = containerRef.current?.clientHeight || 400;
      const maxBlockWidth = 80;
      const spacing = 10;
      
      // Filter out zero or negative costs
      const validBreakdown = costBreakdown.filter(item => item.cost > 0);
      
      // Create blocks with calculated heights based on cost percentage
      const newBlocks = validBreakdown.map((item, index) => {
        const percentage = (item.cost / totalCost) * 100;
        const blockHeight = Math.max(20, (percentage / 100) * (containerHeight * 0.8));
        const blockWidth = Math.min(maxBlockWidth, (containerWidth / validBreakdown.length) - spacing);
        
        // Position blocks evenly in container
        const xPos = (containerWidth - (blockWidth * validBreakdown.length) - (spacing * (validBreakdown.length - 1))) / 2
                    + (index * (blockWidth + spacing));
        
        // Start position is below container
        const yPos = containerHeight;
        
        return {
          id: `block-${index}`,
          category: item.category,
          cost: item.cost,
          percentage,
          height: blockHeight,
          width: blockWidth,
          color: categoryColors[item.category] || categoryColors.default,
          x: xPos,
          y: yPos // Start position is below the container
        };
      });
      
      setBlocks(newBlocks);
      setIsReady(true);
      if (onReady) onReady();
    };
    
    createBlocks();
    
    // Window resize handler
    const handleResize = () => {
      createBlocks();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [costBreakdown, totalCost, onReady]);
  
  // Start animation
  const startAnimation = () => {
    setIsPlaying(true);
    
    toast({
      title: "Animation Started",
      description: "Watch as the building blocks stack up based on costs!",
      duration: 3000,
    });
  };
  
  // Pause animation
  const pauseAnimation = () => {
    setIsPlaying(false);
  };
  
  // Reset animation
  const resetAnimation = () => {
    setIsPlaying(false);
    
    // Create a new copy of blocks with reset positions
    if (containerRef.current) {
      const containerHeight = containerRef.current.clientHeight;
      setBlocks(prevBlocks => 
        prevBlocks.map(block => ({
          ...block,
          y: containerHeight // Reset Y position to be below container
        }))
      );
    }
    
    // Short delay before allowing another play
    setTimeout(() => {
      toast({
        title: "Animation Reset",
        description: "Building blocks have been reset and are ready to play again!",
        duration: 2000,
      });
    }, 500);
  };
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  // Calculate animation position for each block
  const getTargetY = (index: number) => {
    if (!containerRef.current) return 0;
    
    const containerHeight = containerRef.current.clientHeight;
    const block = blocks[index];
    
    // Ground level is at the bottom of the container
    const groundLevel = containerHeight - 10; // Small margin from bottom
    
    return groundLevel - block.height;
  };
  
  return (
    <div className="w-full flex flex-col items-center">
      <div className="mb-4 flex space-x-4">
        <Button
          variant="outline"
          onClick={startAnimation}
          disabled={!isReady || isPlaying}
          className="flex items-center"
        >
          <PlayCircle className="mr-2 h-4 w-4" />
          Play Animation
        </Button>
        <Button
          variant="outline"
          onClick={pauseAnimation}
          disabled={!isPlaying}
          className="flex items-center"
        >
          <PauseCircle className="mr-2 h-4 w-4" />
          Pause
        </Button>
        <Button
          variant="outline"
          onClick={resetAnimation}
          className="flex items-center"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Reset
        </Button>
      </div>
      
      <div 
        ref={containerRef} 
        className="w-full border border-gray-200 rounded-lg bg-gray-50 relative overflow-hidden"
        style={{ height: '400px' }}
      >
        {/* Ground */}
        <div 
          className="absolute left-0 right-0 bottom-0 h-2 bg-gray-300"
          style={{ boxShadow: '0px -2px 5px rgba(0,0,0,0.1)' }}
        />
        
        {/* Building blocks */}
        <AnimatePresence>
          {blocks.map((block, index) => (
            <motion.div
              key={block.id}
              initial={{ x: block.x, y: block.y }}
              animate={{ 
                x: block.x,
                y: isPlaying ? getTargetY(index) : block.y,
                transition: { 
                  type: 'spring',
                  delay: isPlaying ? index * 0.2 : 0,
                  bounce: 0.3,
                  duration: 1.5
                }
              }}
              className="absolute flex flex-col justify-end items-center cursor-pointer"
              style={{ 
                width: `${block.width}px`, 
                height: `${block.height}px`,
              }}
              whileHover={{ scale: 1.05 }}
            >
              {/* Block body */}
              <div 
                className="w-full h-full rounded-t-lg relative group"
                style={{ 
                  backgroundColor: block.color,
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.1)'
                }}
              >
                {/* Tooltip on hover */}
                <div className="opacity-0 group-hover:opacity-100 absolute -top-16 left-1/2 transform -translate-x-1/2 bg-black text-white p-2 rounded shadow-lg text-xs transition-opacity w-max z-10">
                  <div className="font-bold">{block.category}</div>
                  <div>{formatCurrency(block.cost)}</div>
                  <div>{block.percentage.toFixed(1)}% of total</div>
                  <div className="w-2 h-2 transform rotate-45 bg-black absolute -bottom-1 left-1/2 -ml-1"></div>
                </div>
                
                {/* Block windows/details for visual interest */}
                {block.height > 40 && (
                  <>
                    <div className="absolute top-1/4 left-1/4 w-1/4 h-1/6 bg-white opacity-30 rounded-sm"></div>
                    <div className="absolute top-1/2 left-1/4 w-1/4 h-1/6 bg-white opacity-30 rounded-sm"></div>
                    <div className="absolute top-1/4 right-1/4 w-1/4 h-1/6 bg-white opacity-30 rounded-sm"></div>
                    <div className="absolute top-1/2 right-1/4 w-1/4 h-1/6 bg-white opacity-30 rounded-sm"></div>
                  </>
                )}
              </div>
              
              {/* Category label at the bottom */}
              <div 
                className="absolute bottom-0 w-full text-center overflow-hidden whitespace-nowrap text-ellipsis px-1"
                style={{ fontSize: '10px', backgroundColor: 'rgba(0,0,0,0.7)', color: 'white', maxHeight: '14px' }}
              >
                {block.category}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      <div className="text-xs text-gray-500 mt-2 text-center">
        Building blocks represent the cost breakdown. Click play to see them stack up!
      </div>
    </div>
  );
};

export default BuildingBlocksAnimation;
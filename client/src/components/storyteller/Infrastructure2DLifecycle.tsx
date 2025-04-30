import React, { useEffect, useRef, useState } from 'react';

interface Infrastructure2DLifecycleProps {
  stage: number;
  isPlaying: boolean;
}

// Define the lifecycle stages and their visual representation
const stages = [
  { name: "planning", color: "#8ecae6" },
  { name: "construction", color: "#219ebc" },
  { name: "operation", color: "#023047" },
  { name: "renovation", color: "#ffb703" },
  { name: "endOfLife", color: "#fb8500" }
];

export function Infrastructure2DLifecycle({ stage, isPlaying }: Infrastructure2DLifecycleProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animationFrameId, setAnimationFrameId] = useState<number | null>(null);
  
  // Animation parameters
  const [animationProgress, setAnimationProgress] = useState(0);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    drawBackground(ctx, canvas.width, canvas.height);
    
    // Draw infrastructure based on current stage
    drawInfrastructure(ctx, canvas.width, canvas.height, stage, animationProgress);
    
    // Handle animation
    if (isPlaying) {
      const animate = () => {
        setAnimationProgress(prev => {
          if (prev >= 1) return 0;
          return prev + 0.01;
        });
        
        const id = requestAnimationFrame(animate);
        setAnimationFrameId(id);
        return id;
      };
      
      const id = animate();
      return () => {
        if (id) cancelAnimationFrame(id);
      };
    } else if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      setAnimationFrameId(null);
    }
  }, [stage, isPlaying, animationProgress]);
  
  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full" 
      style={{ maxWidth: '100%', maxHeight: '100%' }}
    />
  );
}

// Draw the background elements (sky, ground, etc.)
function drawBackground(ctx: CanvasRenderingContext2D, width: number, height: number) {
  // Sky gradient
  const skyGradient = ctx.createLinearGradient(0, 0, 0, height * 0.7);
  skyGradient.addColorStop(0, '#87CEEB');
  skyGradient.addColorStop(1, '#E0F7FF');
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, width, height * 0.7);
  
  // Ground
  const groundGradient = ctx.createLinearGradient(0, height * 0.7, 0, height);
  groundGradient.addColorStop(0, '#8CBA80');
  groundGradient.addColorStop(1, '#6B8E23');
  ctx.fillStyle = groundGradient;
  ctx.fillRect(0, height * 0.7, width, height * 0.3);
  
  // Sun
  ctx.beginPath();
  ctx.arc(width * 0.85, height * 0.15, 40, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFF88';
  ctx.fill();
  
  // Clouds
  drawCloud(ctx, width * 0.2, height * 0.2, 60);
  drawCloud(ctx, width * 0.5, height * 0.15, 40);
  drawCloud(ctx, width * 0.75, height * 0.25, 50);
  
  // Trees
  drawTree(ctx, width * 0.1, height * 0.7, 60);
  drawTree(ctx, width * 0.15, height * 0.7, 50);
  drawTree(ctx, width * 0.85, height * 0.7, 70);
  drawTree(ctx, width * 0.9, height * 0.7, 60);
}

// Draw a cloud at the specified position
function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.beginPath();
  ctx.arc(x, y, size / 2, 0, Math.PI * 2);
  ctx.arc(x + size / 2, y - size / 4, size / 3, 0, Math.PI * 2);
  ctx.arc(x + size, y, size / 2, 0, Math.PI * 2);
  ctx.arc(x + size / 2, y + size / 4, size / 3, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.fill();
}

// Draw a tree at the specified position
function drawTree(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  // Tree trunk
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(x - size / 10, y - size, size / 5, size);
  
  // Tree foliage
  ctx.beginPath();
  ctx.arc(x, y - size, size / 2, 0, Math.PI * 2);
  ctx.fillStyle = '#228B22';
  ctx.fill();
}

// Draw the infrastructure based on the current stage
function drawInfrastructure(ctx: CanvasRenderingContext2D, width: number, height: number, stageIndex: number, progress: number) {
  const centerX = width / 2;
  const groundY = height * 0.7;
  const buildingWidth = width * 0.4;
  const buildingMaxHeight = height * 0.5;
  
  switch (stageIndex) {
    case 0: // Planning
      drawPlanningStage(ctx, centerX, groundY, buildingWidth, buildingMaxHeight, progress);
      break;
    case 1: // Construction
      drawConstructionStage(ctx, centerX, groundY, buildingWidth, buildingMaxHeight, progress);
      break;
    case 2: // Operation
      drawOperationStage(ctx, centerX, groundY, buildingWidth, buildingMaxHeight, progress);
      break;
    case 3: // Renovation
      drawRenovationStage(ctx, centerX, groundY, buildingWidth, buildingMaxHeight, progress);
      break;
    case 4: // End of Life
      drawEndOfLifeStage(ctx, centerX, groundY, buildingWidth, buildingMaxHeight, progress);
      break;
  }
}

// Draw planning stage (blueprints, surveying)
function drawPlanningStage(ctx: CanvasRenderingContext2D, centerX: number, groundY: number, buildingWidth: number, buildingMaxHeight: number, progress: number) {
  // Draw blueprint
  const blueprintWidth = buildingWidth * 0.8;
  const blueprintHeight = buildingWidth * 0.6;
  const blueprintX = centerX - blueprintWidth / 2;
  const blueprintY = groundY - blueprintHeight - 20;
  
  // Blueprint paper
  ctx.fillStyle = '#e6eef2';
  ctx.fillRect(blueprintX, blueprintY, blueprintWidth, blueprintHeight);
  
  // Blueprint border
  ctx.strokeStyle = '#243E4D';
  ctx.lineWidth = 2;
  ctx.strokeRect(blueprintX, blueprintY, blueprintWidth, blueprintHeight);
  
  // Blueprint grid lines
  ctx.strokeStyle = '#29B7D3';
  ctx.lineWidth = 0.5;
  const gridSize = 20;
  
  // Draw grid lines based on animation progress
  const maxLines = Math.floor(blueprintWidth / gridSize);
  const linesToDraw = Math.floor(maxLines * progress * 2);
  
  for (let i = 0; i <= linesToDraw && i <= maxLines; i++) {
    // Vertical lines
    ctx.beginPath();
    ctx.moveTo(blueprintX + i * gridSize, blueprintY);
    ctx.lineTo(blueprintX + i * gridSize, blueprintY + blueprintHeight);
    ctx.stroke();
    
    // Horizontal lines
    if (i <= Math.floor(blueprintHeight / gridSize)) {
      ctx.beginPath();
      ctx.moveTo(blueprintX, blueprintY + i * gridSize);
      ctx.lineTo(blueprintX + blueprintWidth, blueprintY + i * gridSize);
      ctx.stroke();
    }
  }
  
  // Blueprint building outline - draw based on progress
  if (progress > 0.5) {
    const outlineProgress = (progress - 0.5) * 2; // Scale 0.5-1 to 0-1
    
    ctx.strokeStyle = '#243E4D';
    ctx.lineWidth = 2;
    
    // Building outline
    const bpBuildingWidth = blueprintWidth * 0.6;
    const bpBuildingHeight = blueprintHeight * 0.7;
    const bpBuildingX = blueprintX + (blueprintWidth - bpBuildingWidth) / 2;
    const bpBuildingY = blueprintY + (blueprintHeight - bpBuildingHeight) / 2;
    
    if (outlineProgress >= 0.25) {
      // Left wall
      ctx.beginPath();
      ctx.moveTo(bpBuildingX, bpBuildingY + bpBuildingHeight);
      ctx.lineTo(bpBuildingX, bpBuildingY);
      ctx.stroke();
    }
    
    if (outlineProgress >= 0.5) {
      // Roof
      ctx.beginPath();
      ctx.moveTo(bpBuildingX, bpBuildingY);
      ctx.lineTo(bpBuildingX + bpBuildingWidth, bpBuildingY);
      ctx.stroke();
    }
    
    if (outlineProgress >= 0.75) {
      // Right wall
      ctx.beginPath();
      ctx.moveTo(bpBuildingX + bpBuildingWidth, bpBuildingY);
      ctx.lineTo(bpBuildingX + bpBuildingWidth, bpBuildingY + bpBuildingHeight);
      ctx.stroke();
    }
    
    if (outlineProgress >= 1) {
      // Bottom
      ctx.beginPath();
      ctx.moveTo(bpBuildingX + bpBuildingWidth, bpBuildingY + bpBuildingHeight);
      ctx.lineTo(bpBuildingX, bpBuildingY + bpBuildingHeight);
      ctx.stroke();
      
      // Windows and door
      const windowWidth = bpBuildingWidth * 0.15;
      const windowHeight = bpBuildingHeight * 0.2;
      
      // Left window
      ctx.strokeRect(
        bpBuildingX + bpBuildingWidth * 0.2 - windowWidth / 2,
        bpBuildingY + bpBuildingHeight * 0.3,
        windowWidth,
        windowHeight
      );
      
      // Right window
      ctx.strokeRect(
        bpBuildingX + bpBuildingWidth * 0.8 - windowWidth / 2,
        bpBuildingY + bpBuildingHeight * 0.3,
        windowWidth,
        windowHeight
      );
      
      // Door
      ctx.strokeRect(
        bpBuildingX + bpBuildingWidth * 0.5 - windowWidth / 2,
        bpBuildingY + bpBuildingHeight - windowHeight * 1.5,
        windowWidth,
        windowHeight * 1.5
      );
    }
  }
  
  // Draw surveying equipment
  drawSurveyingEquipment(ctx, centerX + buildingWidth * 0.3, groundY, 60 * Math.min(1, progress * 2));
}

// Draw surveying equipment
function drawSurveyingEquipment(ctx: CanvasRenderingContext2D, x: number, y: number, height: number) {
  // Tripod
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - height * 0.3, y);
  ctx.lineTo(x - height * 0.15, y - height * 0.9);
  ctx.lineTo(x, y);
  ctx.moveTo(x, y);
  ctx.lineTo(x + height * 0.3, y);
  ctx.lineTo(x + height * 0.15, y - height * 0.9);
  ctx.lineTo(x, y);
  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Survey device
  ctx.fillStyle = '#2F4F4F';
  ctx.fillRect(x - height * 0.1, y - height, height * 0.2, height * 0.2);
  
  // Lens
  ctx.beginPath();
  ctx.arc(x, y - height * 0.9, height * 0.05, 0, Math.PI * 2);
  ctx.fillStyle = '#4682B4';
  ctx.fill();
}

// Draw construction stage
function drawConstructionStage(ctx: CanvasRenderingContext2D, centerX: number, groundY: number, buildingWidth: number, buildingMaxHeight: number, progress: number) {
  const buildingHeight = buildingMaxHeight * 0.8;
  const buildingX = centerX - buildingWidth / 2;
  const buildingY = groundY - buildingHeight;
  
  // Construction progress based on animation
  const constructionHeight = buildingHeight * progress;
  
  // Foundation
  ctx.fillStyle = '#8B8B8B';
  ctx.fillRect(buildingX - 10, groundY - 10, buildingWidth + 20, 10);
  
  // Building structure (incomplete)
  ctx.fillStyle = '#D3D3D3';
  ctx.fillRect(buildingX, groundY - constructionHeight, buildingWidth, constructionHeight);
  
  // Steel framework visible at the top of construction
  const frameworkHeight = 40;
  if (constructionHeight < buildingHeight && constructionHeight > 0) {
    const frameworkY = groundY - constructionHeight;
    const numBeams = 5;
    ctx.strokeStyle = '#A9A9A9';
    ctx.lineWidth = 3;
    
    // Vertical beams
    for (let i = 0; i <= numBeams; i++) {
      const beamX = buildingX + (buildingWidth / numBeams) * i;
      ctx.beginPath();
      ctx.moveTo(beamX, frameworkY);
      ctx.lineTo(beamX, Math.max(frameworkY - frameworkHeight, buildingY));
      ctx.stroke();
    }
    
    // Horizontal beams
    for (let i = 0; i <= frameworkHeight / 20; i++) {
      const beamY = frameworkY - i * 20;
      if (beamY >= buildingY) {
        ctx.beginPath();
        ctx.moveTo(buildingX, beamY);
        ctx.lineTo(buildingX + buildingWidth, beamY);
        ctx.stroke();
      }
    }
  }
  
  // Draw construction crane
  drawCrane(ctx, buildingX + buildingWidth + 50, groundY, buildingHeight, progress);
  
  // Construction workers
  if (progress > 0.2 && progress < 0.9) {
    drawConstructionWorker(ctx, buildingX - 30, groundY, 30);
    drawConstructionWorker(ctx, buildingX + buildingWidth + 20, groundY, 30);
  }
}

// Draw construction crane
function drawCrane(ctx: CanvasRenderingContext2D, x: number, y: number, height: number, progress: number) {
  const craneHeight = height * 1.2;
  const craneWidth = 100;
  
  // Base
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(x - 20, y - 10, 40, 10);
  
  // Vertical structure
  ctx.fillStyle = '#FF6347';
  ctx.fillRect(x - 5, y - craneHeight * progress, 10, craneHeight * progress);
  
  // Horizontal arm
  if (progress > 0.7) {
    ctx.fillRect(x - craneWidth / 2, y - craneHeight * progress, craneWidth, 10);
    
    // Hanging cable
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - craneWidth / 3, y - craneHeight * progress + 10);
    ctx.lineTo(x - craneWidth / 3, y - craneHeight * 0.5);
    ctx.stroke();
    
    // Hanging load
    ctx.fillStyle = '#8B8B8B';
    ctx.fillRect(x - craneWidth / 3 - 15, y - craneHeight * 0.5, 30, 20);
  }
}

// Draw construction worker
function drawConstructionWorker(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  // Hard hat
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc(x, y - size, size / 4, 0, Math.PI * 2);
  ctx.fill();
  
  // Body
  ctx.fillStyle = '#FF6347';
  ctx.fillRect(x - size / 6, y - size * 0.75, size / 3, size * 0.5);
  
  // Legs
  ctx.fillStyle = '#4682B4';
  ctx.fillRect(x - size / 6, y - size * 0.25, size / 6, size * 0.25);
  ctx.fillRect(x, y - size * 0.25, size / 6, size * 0.25);
  
  // Arms
  ctx.strokeStyle = '#FF6347';
  ctx.lineWidth = size / 6;
  ctx.beginPath();
  ctx.moveTo(x - size / 6, y - size * 0.6);
  ctx.lineTo(x - size / 2, y - size * 0.4);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(x + size / 6, y - size * 0.6);
  ctx.lineTo(x + size / 2, y - size * 0.4);
  ctx.stroke();
}

// Draw operation stage (completed building with activity)
function drawOperationStage(ctx: CanvasRenderingContext2D, centerX: number, groundY: number, buildingWidth: number, buildingMaxHeight: number, progress: number) {
  const buildingHeight = buildingMaxHeight * 0.8;
  const buildingX = centerX - buildingWidth / 2;
  const buildingY = groundY - buildingHeight;
  
  // Building structure
  ctx.fillStyle = '#EBEBEB';
  ctx.fillRect(buildingX, buildingY, buildingWidth, buildingHeight);
  
  // Building outline
  ctx.strokeStyle = '#A0A0A0';
  ctx.lineWidth = 2;
  ctx.strokeRect(buildingX, buildingY, buildingWidth, buildingHeight);
  
  // Windows and door
  drawBuildingDetails(ctx, buildingX, buildingY, buildingWidth, buildingHeight);
  
  // Add landscaping
  drawLandscaping(ctx, buildingX, buildingY, buildingWidth, groundY, progress);
  
  // People going in/out
  drawPeople(ctx, buildingX, buildingY, buildingWidth, groundY, progress);
  
  // Cars in parking
  drawCars(ctx, buildingX - buildingWidth * 0.5, groundY, buildingWidth, progress);
  
  // Operational effects: lights in windows at night
  if (progress > 0.5) {
    drawLights(ctx, buildingX, buildingY, buildingWidth, buildingHeight, (progress - 0.5) * 2);
  }
}

// Draw building details (windows, door)
function drawBuildingDetails(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
  const windowWidth = width * 0.15;
  const windowHeight = height * 0.15;
  const numFloors = 3;
  const numWindowsPerFloor = 4;
  
  // Draw windows
  ctx.fillStyle = '#87CEEB';
  ctx.strokeStyle = '#A0A0A0';
  ctx.lineWidth = 1;
  
  for (let floor = 0; floor < numFloors; floor++) {
    const floorY = y + height * 0.2 + floor * (height * 0.6 / numFloors);
    
    for (let w = 0; w < numWindowsPerFloor; w++) {
      const windowX = x + width * (0.1 + 0.8 * (w / (numWindowsPerFloor - 1)));
      
      // Skip the middle window on the ground floor (door location)
      if (floor === numFloors - 1 && w === Math.floor(numWindowsPerFloor / 2)) continue;
      
      ctx.fillRect(windowX - windowWidth / 2, floorY, windowWidth, windowHeight);
      ctx.strokeRect(windowX - windowWidth / 2, floorY, windowWidth, windowHeight);
    }
  }
  
  // Draw door
  const doorWidth = width * 0.15;
  const doorHeight = height * 0.25;
  const doorX = x + width / 2 - doorWidth / 2;
  const doorY = y + height - doorHeight;
  
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(doorX, doorY, doorWidth, doorHeight);
  ctx.strokeRect(doorX, doorY, doorWidth, doorHeight);
  
  // Door handle
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc(doorX + doorWidth * 0.8, doorY + doorHeight * 0.5, 3, 0, Math.PI * 2);
  ctx.fill();
}

// Draw landscaping around the building
function drawLandscaping(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, groundY: number, progress: number) {
  // Draw path to door
  const pathWidth = width * 0.2;
  ctx.fillStyle = '#D3D3D3';
  ctx.fillRect(x + width / 2 - pathWidth / 2, y + width, pathWidth, groundY - y - width);
  
  // Bushes
  const bushSize = width * 0.1;
  ctx.fillStyle = '#228B22';
  
  // Number of bushes based on progress
  const maxBushes = 8;
  const bushesToDraw = Math.floor(maxBushes * progress);
  
  for (let i = 0; i < bushesToDraw; i++) {
    const bushX = x + width * (0.1 + 0.8 * (i / (maxBushes - 1)));
    ctx.beginPath();
    ctx.arc(bushX, groundY - bushSize / 2, bushSize / 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Draw people around the building
function drawPeople(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, groundY: number, progress: number) {
  const personSize = width * 0.05;
  
  // Position people based on progress to simulate movement
  const positions = [
    { x: x - width * 0.3, y: groundY, dir: 1 },
    { x: x + width * 0.6, y: groundY, dir: -1 },
    { x: x + width / 2, y: groundY - personSize * 0.5, dir: 1 }
  ];
  
  positions.forEach((pos, i) => {
    // Move people around based on progress
    const offset = Math.sin(progress * Math.PI * 2 + i) * width * 0.2;
    drawPerson(ctx, pos.x + offset * pos.dir, pos.y, personSize, pos.dir > 0);
  });
}

// Draw a simple person
function drawPerson(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, facingRight: boolean) {
  // Head
  ctx.fillStyle = '#FFA07A';
  ctx.beginPath();
  ctx.arc(x, y - size, size / 3, 0, Math.PI * 2);
  ctx.fill();
  
  // Body
  ctx.fillStyle = facingRight ? '#4682B4' : '#6B8E23';
  ctx.fillRect(x - size / 4, y - size * 0.7, size / 2, size * 0.5);
  
  // Legs
  ctx.fillStyle = '#000000';
  ctx.fillRect(x - size / 4, y - size * 0.2, size / 6, size * 0.2);
  ctx.fillRect(x + size / 12, y - size * 0.2, size / 6, size * 0.2);
  
  // Arms
  ctx.strokeStyle = facingRight ? '#4682B4' : '#6B8E23';
  ctx.lineWidth = size / 6;
  ctx.beginPath();
  ctx.moveTo(x, y - size * 0.6);
  ctx.lineTo(x + (facingRight ? 1 : -1) * size / 2, y - size * 0.4);
  ctx.stroke();
}

// Draw cars in the parking area
function drawCars(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, progress: number) {
  const carWidth = width * 0.2;
  const carHeight = width * 0.08;
  
  // Number of cars based on progress
  const maxCars = 3;
  const carsToDraw = Math.floor(maxCars * progress);
  
  for (let i = 0; i < carsToDraw; i++) {
    const carX = x + i * (carWidth + 10);
    const carY = y - carHeight;
    const carColor = i === 0 ? '#FF0000' : i === 1 ? '#0000FF' : '#008000';
    
    // Car body
    ctx.fillStyle = carColor;
    ctx.fillRect(carX, carY, carWidth, carHeight);
    
    // Car top
    ctx.fillRect(carX + carWidth * 0.2, carY - carHeight * 0.6, carWidth * 0.6, carHeight * 0.6);
    
    // Windows
    ctx.fillStyle = '#D3D3D3';
    ctx.fillRect(carX + carWidth * 0.25, carY - carHeight * 0.5, carWidth * 0.5, carHeight * 0.4);
    
    // Wheels
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(carX + carWidth * 0.25, carY + carHeight, carHeight * 0.3, 0, Math.PI * 2);
    ctx.arc(carX + carWidth * 0.75, carY + carHeight, carHeight * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Draw lights in the windows (for night time)
function drawLights(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, intensity: number) {
  const windowWidth = width * 0.15;
  const windowHeight = height * 0.15;
  const numFloors = 3;
  const numWindowsPerFloor = 4;
  
  // Overlay a nighttime filter
  ctx.fillStyle = `rgba(10, 20, 50, ${intensity * 0.5})`;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  
  // Draw lights in random windows
  ctx.fillStyle = `rgba(255, 255, 200, ${intensity})`;
  
  for (let floor = 0; floor < numFloors; floor++) {
    const floorY = y + height * 0.2 + floor * (height * 0.6 / numFloors);
    
    for (let w = 0; w < numWindowsPerFloor; w++) {
      // Random lights in windows
      if (Math.random() > 0.5) {
        const windowX = x + width * (0.1 + 0.8 * (w / (numWindowsPerFloor - 1)));
        
        // Skip the middle window on the ground floor (door location)
        if (floor === numFloors - 1 && w === Math.floor(numWindowsPerFloor / 2)) continue;
        
        ctx.fillRect(windowX - windowWidth / 2, floorY, windowWidth, windowHeight);
        
        // Glow effect
        const glow = ctx.createRadialGradient(
          windowX, floorY + windowHeight / 2, 0,
          windowX, floorY + windowHeight / 2, windowWidth
        );
        glow.addColorStop(0, `rgba(255, 255, 200, ${intensity * 0.7})`);
        glow.addColorStop(1, 'rgba(255, 255, 200, 0)');
        
        ctx.fillStyle = glow;
        ctx.fillRect(
          windowX - windowWidth, floorY - windowHeight / 2,
          windowWidth * 2, windowHeight * 2
        );
        
        ctx.fillStyle = `rgba(255, 255, 200, ${intensity})`;
      }
    }
  }
}

// Draw renovation stage
function drawRenovationStage(ctx: CanvasRenderingContext2D, centerX: number, groundY: number, buildingWidth: number, buildingMaxHeight: number, progress: number) {
  const buildingHeight = buildingMaxHeight * 0.8;
  const buildingX = centerX - buildingWidth / 2;
  const buildingY = groundY - buildingHeight;
  
  // Building structure
  ctx.fillStyle = '#EBEBEB';
  ctx.fillRect(buildingX, buildingY, buildingWidth, buildingHeight);
  
  // Building outline
  ctx.strokeStyle = '#A0A0A0';
  ctx.lineWidth = 2;
  ctx.strokeRect(buildingX, buildingY, buildingWidth, buildingHeight);
  
  // Windows and door
  drawBuildingDetails(ctx, buildingX, buildingY, buildingWidth, buildingHeight);
  
  // Scaffolding on part of the building
  drawScaffolding(ctx, buildingX, buildingY, buildingWidth, buildingHeight, progress);
  
  // Construction equipment
  if (progress > 0.3) {
    drawConstructionEquipment(ctx, buildingX + buildingWidth * 1.1, groundY, 80);
  }
  
  // Workers on scaffolding
  if (progress > 0.5) {
    drawWorkerOnScaffolding(ctx, buildingX + buildingWidth * 0.3, buildingY + buildingHeight * 0.3, 30);
    drawWorkerOnScaffolding(ctx, buildingX + buildingWidth * 0.7, buildingY + buildingHeight * 0.6, 30);
  }
  
  // Renovation effects: partial new facade
  drawRenovationProgress(ctx, buildingX, buildingY, buildingWidth, buildingHeight, progress);
}

// Draw scaffolding on the building
function drawScaffolding(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, progress: number) {
  const scaffoldWidth = width;
  const scaffoldHeight = height * progress;
  
  // Vertical poles
  ctx.strokeStyle = '#C0C0C0';
  ctx.lineWidth = 3;
  
  const poleSpacing = width / 4;
  for (let i = 0; i <= 4; i++) {
    ctx.beginPath();
    ctx.moveTo(x + i * poleSpacing, y + height);
    ctx.lineTo(x + i * poleSpacing, y + height - scaffoldHeight);
    ctx.stroke();
  }
  
  // Horizontal connectors
  const levelSpacing = height / 5;
  for (let i = 0; i <= scaffoldHeight / levelSpacing; i++) {
    ctx.beginPath();
    ctx.moveTo(x, y + height - i * levelSpacing);
    ctx.lineTo(x + width, y + height - i * levelSpacing);
    ctx.stroke();
  }
  
  // Diagonal braces
  ctx.strokeStyle = '#A0A0A0';
  ctx.lineWidth = 2;
  
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < Math.floor(scaffoldHeight / levelSpacing); j++) {
      ctx.beginPath();
      ctx.moveTo(x + i * poleSpacing, y + height - j * levelSpacing);
      ctx.lineTo(x + (i + 1) * poleSpacing, y + height - (j + 1) * levelSpacing);
      ctx.stroke();
    }
  }
  
  // Platforms
  ctx.fillStyle = '#8B4513';
  for (let i = 1; i <= scaffoldHeight / levelSpacing; i++) {
    if (i % 2 === 1) { // Platforms on every other level
      ctx.fillRect(x, y + height - i * levelSpacing - 5, width, 10);
    }
  }
}

// Draw construction equipment (crane/lift)
function drawConstructionEquipment(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  // Base
  ctx.fillStyle = '#FF8C00';
  ctx.fillRect(x - size / 2, y - size / 10, size, size / 10);
  
  // Vertical lift
  ctx.fillStyle = '#FF8C00';
  ctx.fillRect(x - size / 20, y - size, size / 10, size);
  
  // Platform
  ctx.fillStyle = '#A0A0A0';
  ctx.fillRect(x - size / 3, y - size * 0.6, size / 1.5, size / 8);
  
  // Hydraulic arm
  ctx.strokeStyle = '#FF8C00';
  ctx.lineWidth = size / 15;
  ctx.beginPath();
  ctx.moveTo(x, y - size / 5);
  ctx.lineTo(x - size / 2, y - size * 0.6);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(x, y - size / 5);
  ctx.lineTo(x + size / 2, y - size * 0.6);
  ctx.stroke();
}

// Draw worker on scaffolding
function drawWorkerOnScaffolding(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  // Hard hat
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc(x, y - size / 2, size / 4, 0, Math.PI * 2);
  ctx.fill();
  
  // Upper body
  ctx.fillStyle = '#FF6347';
  ctx.fillRect(x - size / 6, y - size / 3, size / 3, size / 3);
  
  // Arms working
  ctx.strokeStyle = '#FF6347';
  ctx.lineWidth = size / 10;
  
  ctx.beginPath();
  ctx.moveTo(x, y - size / 4);
  ctx.lineTo(x + size / 3, y - size / 2);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(x, y - size / 4);
  ctx.lineTo(x - size / 3, y);
  ctx.stroke();
  
  // Tool in hand
  ctx.fillStyle = '#A0A0A0';
  ctx.fillRect(x + size / 3, y - size / 2, size / 5, size / 15);
}

// Draw renovation progress (new facade being installed)
function drawRenovationProgress(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, progress: number) {
  const newFacadeWidth = width;
  const newFacadeHeight = height * progress;
  
  // Overlay new facade on part of the building
  ctx.fillStyle = '#F5F5F5';
  ctx.fillRect(x, y + height - newFacadeHeight, newFacadeWidth, newFacadeHeight);
  
  // New facade pattern
  ctx.strokeStyle = '#E0E0E0';
  ctx.lineWidth = 1;
  
  const tileSize = 20;
  for (let i = 0; i <= newFacadeWidth / tileSize; i++) {
    for (let j = 0; j <= newFacadeHeight / tileSize; j++) {
      ctx.strokeRect(
        x + i * tileSize,
        y + height - newFacadeHeight + j * tileSize,
        tileSize,
        tileSize
      );
    }
  }
  
  // Mark renovated windows with new style
  const windowWidth = width * 0.15;
  const windowHeight = height * 0.15;
  const numFloors = 3;
  const numWindowsPerFloor = 4;
  
  ctx.fillStyle = '#B0E0E6';
  
  for (let floor = 0; floor < numFloors; floor++) {
    const floorY = y + height * 0.2 + floor * (height * 0.6 / numFloors);
    
    // Only draw new windows in the renovated portion
    if (y + height - floorY <= newFacadeHeight) {
      for (let w = 0; w < numWindowsPerFloor; w++) {
        const windowX = x + width * (0.1 + 0.8 * (w / (numWindowsPerFloor - 1)));
        
        // Skip the door location
        if (floor === numFloors - 1 && w === Math.floor(numWindowsPerFloor / 2)) continue;
        
        ctx.fillRect(windowX - windowWidth / 2, floorY, windowWidth, windowHeight);
        
        // Modern window frame
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(windowX - windowWidth / 2, floorY, windowWidth, windowHeight);
        
        // Window division
        ctx.beginPath();
        ctx.moveTo(windowX, floorY);
        ctx.lineTo(windowX, floorY + windowHeight);
        ctx.stroke();
      }
    }
  }
}

// Draw end-of-life stage
function drawEndOfLifeStage(ctx: CanvasRenderingContext2D, centerX: number, groundY: number, buildingWidth: number, buildingMaxHeight: number, progress: number) {
  const buildingHeight = buildingMaxHeight * 0.8;
  const buildingX = centerX - buildingWidth / 2;
  const buildingY = groundY - buildingHeight;
  
  if (progress < 0.5) {
    // Building being demolished
    drawDemolition(ctx, buildingX, buildingY, buildingWidth, buildingHeight, progress * 2);
  } else {
    // Site being cleared and remediated
    drawSiteRemediation(ctx, buildingX, buildingY, buildingWidth, buildingHeight, (progress - 0.5) * 2);
  }
}

// Draw building demolition
function drawDemolition(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, progress: number) {
  // Partially demolished building
  const remainingHeight = height * (1 - progress);
  
  // Building structure (what remains)
  ctx.fillStyle = '#EBEBEB';
  ctx.fillRect(x, y + height - remainingHeight, width, remainingHeight);
  
  // Building outline
  ctx.strokeStyle = '#A0A0A0';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y + height - remainingHeight, width, remainingHeight);
  
  // Rubble pile forming at the bottom
  const rubbleHeight = height * progress * 0.5;
  drawRubble(ctx, x, y + height - rubbleHeight, width, rubbleHeight, progress);
  
  // Dust cloud
  drawDustCloud(ctx, x, y, width, height, progress);
  
  // Demolition equipment
  drawDemolitionEquipment(ctx, x - width * 0.3, y + height, width * 0.4, progress);
}

// Draw rubble pile
function drawRubble(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, progress: number) {
  // Base rubble pile
  ctx.fillStyle = '#A0A0A0';
  ctx.beginPath();
  ctx.moveTo(x - width * 0.2, y + height);
  ctx.lineTo(x, y);
  ctx.lineTo(x + width, y);
  ctx.lineTo(x + width * 1.2, y + height);
  ctx.fill();
  
  // Rubble pieces
  ctx.fillStyle = '#D3D3D3';
  const numPieces = 20;
  
  for (let i = 0; i < numPieces * progress; i++) {
    const pieceX = x - width * 0.2 + (width * 1.4) * Math.random();
    const pieceY = y + height * Math.random();
    const pieceSize = 5 + Math.random() * 15;
    
    ctx.fillRect(pieceX, pieceY, pieceSize, pieceSize);
  }
  
  // Rebar sticking out
  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = 2;
  
  for (let i = 0; i < 10 * progress; i++) {
    const rebarX = x + width * Math.random();
    const rebarLength = 10 + Math.random() * 30;
    const rebarAngle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI / 2;
    
    ctx.beginPath();
    ctx.moveTo(rebarX, y + 5);
    ctx.lineTo(
      rebarX + Math.cos(rebarAngle) * rebarLength,
      y + 5 + Math.sin(rebarAngle) * rebarLength
    );
    ctx.stroke();
  }
}

// Draw dust cloud
function drawDustCloud(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, progress: number) {
  // Skip drawing if progress is too low or too high
  if (progress < 0.1 || progress > 0.9) return;
  
  // Calculate dust intensity based on progress
  const intensity = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
  
  // Draw dust cloud
  ctx.fillStyle = `rgba(200, 200, 200, ${intensity * 0.7})`;
  
  // Random dust particles
  for (let i = 0; i < 100 * intensity; i++) {
    const dustX = x - width * 0.5 + width * 2 * Math.random();
    const dustY = y + (height * 1.5) * Math.random();
    const dustSize = 2 + Math.random() * 10;
    
    ctx.beginPath();
    ctx.arc(dustX, dustY, dustSize, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Draw demolition equipment (excavator with wrecking ball or hydraulic hammer)
function drawDemolitionEquipment(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, progress: number) {
  // Draw excavator
  ctx.fillStyle = '#FFD700';
  
  // Tracks
  ctx.fillRect(x - size / 2, y - size * 0.1, size, size * 0.1);
  
  // Body
  ctx.fillRect(x - size * 0.3, y - size * 0.3, size * 0.6, size * 0.2);
  
  // Cab
  ctx.fillStyle = '#A0A0A0';
  ctx.fillRect(x - size * 0.2, y - size * 0.4, size * 0.4, size * 0.1);
  
  // Arm positioning based on progress
  const armAngle = -Math.PI / 4 - progress * Math.PI / 4;
  const armLength = size * 0.8;
  
  // Boom arm
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = size * 0.08;
  ctx.beginPath();
  ctx.moveTo(x, y - size * 0.25);
  ctx.lineTo(
    x + Math.cos(armAngle) * armLength,
    y - size * 0.25 + Math.sin(armAngle) * armLength
  );
  ctx.stroke();
  
  // Wrecking ball or hammer
  const toolX = x + Math.cos(armAngle) * armLength;
  const toolY = y - size * 0.25 + Math.sin(armAngle) * armLength;
  
  if (progress < 0.5) {
    // Wrecking ball
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(toolX, toolY, size * 0.15, 0, Math.PI * 2);
    ctx.fill();
    
    // Chain
    ctx.strokeStyle = '#A0A0A0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(armAngle) * (armLength - size * 0.2), y - size * 0.25 + Math.sin(armAngle) * (armLength - size * 0.2));
    ctx.lineTo(toolX, toolY - size * 0.15);
    ctx.stroke();
  } else {
    // Hydraulic hammer
    ctx.fillStyle = '#A0A0A0';
    ctx.fillRect(toolX - size * 0.1, toolY, size * 0.2, size * 0.3);
  }
}

// Draw site remediation (clearing and preparing for new use)
function drawSiteRemediation(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, progress: number) {
  // Cleared site with some remaining rubble
  const remainingRubble = 1 - progress;
  
  // Draw soil
  const soilGradient = ctx.createLinearGradient(x, y + height, x, y + height - height * 0.1);
  soilGradient.addColorStop(0, '#8B4513');
  soilGradient.addColorStop(1, '#A0522D');
  
  ctx.fillStyle = soilGradient;
  ctx.fillRect(x - width * 0.2, y + height - height * 0.1, width * 1.4, height * 0.1);
  
  // Remaining rubble
  if (remainingRubble > 0) {
    drawRubble(ctx, x, y + height - height * 0.1, width, height * 0.1 * remainingRubble, remainingRubble);
  }
  
  // Equipment working on site
  drawRemediationEquipment(ctx, x, y, width, height, progress);
  
  // New vegetation starting to grow
  if (progress > 0.7) {
    drawNewVegetation(ctx, x, y, width, height, (progress - 0.7) * 3);
  }
  
  // Site survey markers
  if (progress > 0.3) {
    drawSiteMarkers(ctx, x, y, width, height);
  }
}

// Draw remediation equipment
function drawRemediationEquipment(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, progress: number) {
  // Position based on progress
  const equipX = x + width * progress;
  
  // Bulldozer
  const bulldozerSize = width * 0.25;
  
  // Tracks
  ctx.fillStyle = '#000000';
  ctx.fillRect(equipX - bulldozerSize / 2, y + height - bulldozerSize * 0.2, bulldozerSize, bulldozerSize * 0.2);
  
  // Body
  ctx.fillStyle = '#FF8C00';
  ctx.fillRect(equipX - bulldozerSize * 0.4, y + height - bulldozerSize * 0.5, bulldozerSize * 0.8, bulldozerSize * 0.3);
  
  // Cab
  ctx.fillStyle = '#D3D3D3';
  ctx.fillRect(equipX - bulldozerSize * 0.3, y + height - bulldozerSize * 0.7, bulldozerSize * 0.6, bulldozerSize * 0.2);
  
  // Blade
  ctx.fillStyle = '#C0C0C0';
  ctx.fillRect(equipX - bulldozerSize * 0.6, y + height - bulldozerSize * 0.3, bulldozerSize * 0.2, bulldozerSize * 0.3);
  
  // Dirt being pushed
  ctx.fillStyle = '#8B4513';
  ctx.beginPath();
  ctx.moveTo(equipX - bulldozerSize * 0.6, y + height);
  ctx.lineTo(equipX - bulldozerSize * 0.6, y + height - bulldozerSize * 0.3);
  ctx.lineTo(equipX - bulldozerSize * 0.8, y + height - bulldozerSize * 0.1);
  ctx.lineTo(equipX - bulldozerSize * 0.8, y + height);
  ctx.fill();
}

// Draw new vegetation
function drawNewVegetation(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, intensity: number) {
  const numPlants = Math.floor(20 * intensity);
  
  for (let i = 0; i < numPlants; i++) {
    const plantX = x - width * 0.2 + width * 1.4 * Math.random();
    const plantSize = 5 + 15 * Math.random() * intensity;
    
    // Plant stem
    ctx.strokeStyle = '#228B22';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(plantX, y + height - height * 0.1);
    ctx.lineTo(plantX, y + height - height * 0.1 - plantSize);
    ctx.stroke();
    
    // Leaves
    ctx.fillStyle = '#32CD32';
    
    for (let j = 0; j < 3; j++) {
      const leafAngle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
      const leafLength = plantSize * 0.5 * Math.random();
      const leafWidth = plantSize * 0.3 * Math.random();
      const leafY = y + height - height * 0.1 - plantSize * Math.random() * 0.7;
      
      ctx.beginPath();
      ctx.ellipse(
        plantX + Math.cos(leafAngle) * leafLength / 2,
        leafY + Math.sin(leafAngle) * leafLength / 2,
        leafLength,
        leafWidth,
        leafAngle,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }
}

// Draw site survey markers
function drawSiteMarkers(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
  // Survey stakes
  ctx.fillStyle = '#FF6347';
  const numStakes = 4;
  
  for (let i = 0; i < numStakes; i++) {
    const stakeX = x - width * 0.2 + width * 1.4 * (i / (numStakes - 1));
    
    // Stake
    ctx.fillRect(stakeX - 2, y + height - height * 0.15, 4, height * 0.15);
    
    // Flag
    ctx.fillStyle = i % 2 === 0 ? '#FF6347' : '#FFD700';
    ctx.beginPath();
    ctx.moveTo(stakeX, y + height - height * 0.15);
    ctx.lineTo(stakeX + 15, y + height - height * 0.15 - 7);
    ctx.lineTo(stakeX, y + height - height * 0.15 - 15);
    ctx.fill();
  }
}
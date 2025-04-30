import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface Infrastructure3DLifecycleProps {
  stage: number;
  isPlaying: boolean;
}

export function Infrastructure3DLifecycle({ stage, isPlaying }: Infrastructure3DLifecycleProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0xf0f8ff, 1);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Create camera
    const aspectRatio = containerRef.current.clientWidth / containerRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(50, aspectRatio, 0.1, 1000);
    camera.position.set(10, 8, 15);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Add controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2;
    controlsRef.current = controls;

    // Add grid for reference
    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x888888);
    scene.add(gridHelper);

    // Add base environment
    addEnvironment(scene);

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      
      rendererRef.current.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Animation loop
    const animate = () => {
      if (!controlsRef.current || !rendererRef.current || !sceneRef.current || !cameraRef.current) return;
      
      controlsRef.current.update();
      rendererRef.current.render(sceneRef.current, cameraRef.current);
      
      animationFrameIdRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    setIsInitialized(true);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      
      if (containerRef.current && rendererRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      
      // Dispose of Three.js resources
      rendererRef.current?.dispose();
      
      // Clear references
      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
      controlsRef.current = null;
    };
  }, []);

  // Update scene based on current stage
  useEffect(() => {
    if (!isInitialized || !sceneRef.current) return;
    
    // Clear previous infrastructure models
    clearInfrastructure(sceneRef.current);
    
    // Add infrastructure based on stage
    addInfrastructure(sceneRef.current, stage);
    
  }, [stage, isInitialized]);

  // Handle animation effects
  useEffect(() => {
    if (!isInitialized || !sceneRef.current) return;
    
    let animationIds: number[] = [];
    
    if (isPlaying) {
      // Add animation effects based on current stage
      animationIds = animateStage(sceneRef.current, stage);
    }
    
    return () => {
      // Clear animations on unmount or when isPlaying changes
      animationIds.forEach(id => cancelAnimationFrame(id));
    };
  }, [isPlaying, stage, isInitialized]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full"
      style={{ 
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '0.375rem',
      }}
    >
      {/* Stage indicator overlay */}
      <div className="absolute bottom-4 left-4 bg-white/80 px-3 py-1 rounded-md text-sm text-gray-700 shadow-sm">
        {getStageLabel(stage)}
      </div>
    </div>
  );
}

// Helper function to get stage label
function getStageLabel(stage: number): string {
  const stages = [
    "Planning & Design",
    "Construction",
    "Operation",
    "Renovation",
    "End-of-Life"
  ];
  
  return stages[stage] || "Unknown Stage";
}

// Add basic environment elements (ground, sky, lighting)
function addEnvironment(scene: THREE.Scene) {
  // Add lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  
  const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
  sunLight.position.set(10, 15, 8);
  sunLight.castShadow = true;
  scene.add(sunLight);
  
  // Add ground
  const groundGeometry = new THREE.PlaneGeometry(50, 50);
  const groundMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x8cb369,
    roughness: 0.8,
    metalness: 0.2
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.01;
  ground.receiveShadow = true;
  ground.name = "ground";
  scene.add(ground);
  
  // Add sky hemisphere
  const skyColor = new THREE.Color(0x87ceeb);
  const groundColor = new THREE.Color(0xffffff);
  const hemisphereLight = new THREE.HemisphereLight(skyColor, groundColor, 0.6);
  scene.add(hemisphereLight);
  
  // Add some distant trees (simplified as cones)
  addDistantTrees(scene);
}

// Add distant trees to scene
function addDistantTrees(scene: THREE.Scene) {
  const treePositions = [
    { x: -15, z: -15 },
    { x: -12, z: -18 },
    { x: -18, z: -12 },
    { x: 15, z: -15 },
    { x: 18, z: -12 },
    { x: 15, z: 15 },
    { x: 18, z: 18 },
    { x: -15, z: 15 },
    { x: -18, z: 18 }
  ];
  
  // Create tree group
  const treeGroup = new THREE.Group();
  treeGroup.name = "distantTrees";
  
  treePositions.forEach(position => {
    // Tree trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 1.5, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(position.x, 0.75, position.z);
    trunk.castShadow = true;
    
    // Tree foliage
    const foliageGeometry = new THREE.ConeGeometry(1.5, 3, 8);
    const foliageMaterial = new THREE.MeshStandardMaterial({ color: 0x2e8b57 });
    const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
    foliage.position.set(position.x, 3, position.z);
    foliage.castShadow = true;
    
    treeGroup.add(trunk);
    treeGroup.add(foliage);
  });
  
  scene.add(treeGroup);
}

// Clear previous infrastructure models
function clearInfrastructure(scene: THREE.Scene) {
  // Remove objects with specific names related to infrastructure
  const objectsToRemove = [];
  
  scene.children.forEach(object => {
    if (
      object.name === "building" || 
      object.name === "constructionEquipment" || 
      object.name === "blueprints" ||
      object.name === "scaffolding" ||
      object.name === "renovationElements" ||
      object.name === "demolitionElements"
    ) {
      objectsToRemove.push(object);
    }
  });
  
  objectsToRemove.forEach(object => {
    scene.remove(object);
    // Dispose of geometries and materials
    if (object instanceof THREE.Mesh) {
      object.geometry.dispose();
      if (Array.isArray(object.material)) {
        object.material.forEach(material => material.dispose());
      } else {
        object.material.dispose();
      }
    }
  });
}

// Add infrastructure based on stage
function addInfrastructure(scene: THREE.Scene, stage: number) {
  switch(stage) {
    case 0:
      addPlanningStage(scene);
      break;
    case 1:
      addConstructionStage(scene);
      break;
    case 2:
      addOperationStage(scene);
      break;
    case 3:
      addRenovationStage(scene);
      break;
    case 4:
      addEndOfLifeStage(scene);
      break;
    default:
      console.warn(`Unknown stage: ${stage}`);
  }
}

// Planning & Design stage
function addPlanningStage(scene: THREE.Scene) {
  // Create a blueprint group
  const blueprintGroup = new THREE.Group();
  blueprintGroup.name = "blueprints";
  
  // Blueprint "paper"
  const paperGeometry = new THREE.BoxGeometry(6, 0.05, 4);
  const paperMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xe6eef2,
    roughness: 0.3,
    metalness: 0.2
  });
  const paper = new THREE.Mesh(paperGeometry, paperMaterial);
  paper.position.set(0, 0.025, 0);
  blueprintGroup.add(paper);
  
  // Blueprint grid lines
  const gridSize = 20;
  const gridStep = 0.2;
  const gridGeometry = new THREE.BufferGeometry();
  const gridPoints: number[] = [];
  
  // Create vertical lines
  for (let i = -3; i <= 3; i += gridStep) {
    gridPoints.push(i, 0.03, -2);
    gridPoints.push(i, 0.03, 2);
  }
  
  // Create horizontal lines
  for (let i = -2; i <= 2; i += gridStep) {
    gridPoints.push(-3, 0.03, i);
    gridPoints.push(3, 0.03, i);
  }
  
  gridGeometry.setAttribute('position', new THREE.Float32BufferAttribute(gridPoints, 3));
  
  const gridMaterial = new THREE.LineBasicMaterial({ color: 0x29b7d3, linewidth: 1 });
  const gridLines = new THREE.LineSegments(gridGeometry, gridMaterial);
  blueprintGroup.add(gridLines);
  
  // Building outline on blueprint
  const outlineGeometry = new THREE.BufferGeometry();
  const outlinePoints = [
    // Front wall
    -2, 0.04, 1,
    2, 0.04, 1,
    
    // Right wall
    2, 0.04, 1,
    2, 0.04, -1,
    
    // Back wall
    2, 0.04, -1,
    -2, 0.04, -1,
    
    // Left wall
    -2, 0.04, -1,
    -2, 0.04, 1,
    
    // Door
    -0.3, 0.04, 1,
    -0.3, 0.04, 1.1,
    -0.3, 0.04, 1.1,
    0.3, 0.04, 1.1,
    0.3, 0.04, 1.1,
    0.3, 0.04, 1,
    
    // Windows (front)
    -1.5, 0.04, 1,
    -1.5, 0.04, 1.05,
    -1.5, 0.04, 1.05,
    -1, 0.04, 1.05,
    -1, 0.04, 1.05,
    -1, 0.04, 1,
    
    1, 0.04, 1,
    1, 0.04, 1.05,
    1, 0.04, 1.05,
    1.5, 0.04, 1.05,
    1.5, 0.04, 1.05,
    1.5, 0.04, 1
  ];
  
  outlineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(outlinePoints, 3));
  
  const outlineMaterial = new THREE.LineBasicMaterial({ color: 0x243e4d, linewidth: 2 });
  const buildingOutline = new THREE.LineSegments(outlineGeometry, outlineMaterial);
  blueprintGroup.add(buildingOutline);
  
  // Add surveying equipment
  const surveyingEquipment = createSurveyingEquipment();
  surveyingEquipment.position.set(3, 0, 2);
  blueprintGroup.add(surveyingEquipment);
  
  // Add table for blueprint
  const tableGeometry = new THREE.BoxGeometry(7, 0.2, 5);
  const tableMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x8b4513,
    roughness: 0.8,
    metalness: 0.1
  });
  const table = new THREE.Mesh(tableGeometry, tableMaterial);
  table.position.set(0, -0.1, 0);
  blueprintGroup.add(table);
  
  // Table legs
  const legGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1, 8);
  const legMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
  
  const positions = [
    { x: -3, z: -2 },
    { x: 3, z: -2 },
    { x: 3, z: 2 },
    { x: -3, z: 2 }
  ];
  
  positions.forEach(pos => {
    const leg = new THREE.Mesh(legGeometry, legMaterial);
    leg.position.set(pos.x, -0.6, pos.z);
    blueprintGroup.add(leg);
  });
  
  scene.add(blueprintGroup);
}

// Create surveying equipment
function createSurveyingEquipment() {
  const group = new THREE.Group();
  
  // Tripod legs
  const legGeometry = new THREE.CylinderGeometry(0.03, 0.03, 1.5, 8);
  const legMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
  
  const leg1 = new THREE.Mesh(legGeometry, legMaterial);
  leg1.position.set(0, 0.75, 0);
  leg1.rotation.x = Math.PI / 6;
  leg1.rotation.z = Math.PI / 6;
  group.add(leg1);
  
  const leg2 = new THREE.Mesh(legGeometry, legMaterial);
  leg2.position.set(0, 0.75, 0);
  leg2.rotation.x = -Math.PI / 6;
  leg2.rotation.z = -Math.PI / 6;
  group.add(leg2);
  
  const leg3 = new THREE.Mesh(legGeometry, legMaterial);
  leg3.position.set(0, 0.75, 0);
  leg3.rotation.x = 0;
  leg3.rotation.z = -Math.PI / 6;
  group.add(leg3);
  
  // Survey device
  const deviceGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.2);
  const deviceMaterial = new THREE.MeshStandardMaterial({ color: 0x2f4f4f });
  const device = new THREE.Mesh(deviceGeometry, deviceMaterial);
  device.position.set(0, 1.5, 0);
  group.add(device);
  
  // Lens
  const lensGeometry = new THREE.CylinderGeometry(0.05, 0.08, 0.2, 16);
  const lensMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x4682b4,
    metalness: 0.8,
    roughness: 0.2
  });
  const lens = new THREE.Mesh(lensGeometry, lensMaterial);
  lens.position.set(0, 1.5, 0.2);
  lens.rotation.x = Math.PI / 2;
  group.add(lens);
  
  return group;
}

// Construction stage
function addConstructionStage(scene: THREE.Scene) {
  // Create a construction group
  const constructionGroup = new THREE.Group();
  constructionGroup.name = "constructionEquipment";
  
  // Base building structure (incomplete)
  const buildingGroup = createPartialBuilding(0.7);
  buildingGroup.name = "building";
  scene.add(buildingGroup);
  
  // Add construction crane
  const crane = createConstructionCrane();
  crane.position.set(6, 0, 0);
  constructionGroup.add(crane);
  
  // Add construction barriers
  const barriers = createConstructionBarriers();
  constructionGroup.add(barriers);
  
  // Add some construction materials
  const materials = createConstructionMaterials();
  constructionGroup.add(materials);
  
  scene.add(constructionGroup);
}

// Create a partial building in construction
function createPartialBuilding(completionRatio: number) {
  const group = new THREE.Group();
  
  // Foundation
  const foundationGeometry = new THREE.BoxGeometry(8, 0.5, 6);
  const concreteMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x8b8b8b,
    roughness: 0.9,
    metalness: 0.1
  });
  const foundation = new THREE.Mesh(foundationGeometry, concreteMaterial);
  foundation.position.set(0, 0.25, 0);
  group.add(foundation);
  
  // Building height based on completion ratio
  const fullHeight = 6;
  const currentHeight = fullHeight * completionRatio;
  
  if (completionRatio > 0) {
    // Building structure (walls)
    const wallGeometry = new THREE.BoxGeometry(7.5, currentHeight, 5.5);
    const wallMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xd3d3d3,
      roughness: 0.8,
      metalness: 0.2
    });
    const walls = new THREE.Mesh(wallGeometry, wallMaterial);
    walls.position.set(0, 0.5 + currentHeight / 2, 0);
    group.add(walls);
    
    // If construction is not complete, add scaffolding and steel framework
    if (completionRatio < 1) {
      // Steel framework at the top
      const framework = createSteelFramework(7.5, 5.5, fullHeight - currentHeight);
      framework.position.set(0, 0.5 + currentHeight, 0);
      group.add(framework);
      
      // Scaffolding
      const scaffolding = createScaffolding(8, fullHeight, 6);
      scaffolding.position.set(0, 0, 0);
      group.add(scaffolding);
    }
  }
  
  return group;
}

// Create steel framework
function createSteelFramework(width: number, depth: number, height: number) {
  const group = new THREE.Group();
  
  const beamMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xa9a9a9,
    roughness: 0.5,
    metalness: 0.8
  });
  
  // Vertical beams
  const verticalPositions = [
    { x: -width / 2, z: -depth / 2 },
    { x: width / 2, z: -depth / 2 },
    { x: width / 2, z: depth / 2 },
    { x: -width / 2, z: depth / 2 },
    { x: 0, z: -depth / 2 },
    { x: 0, z: depth / 2 },
    { x: -width / 2, z: 0 },
    { x: width / 2, z: 0 }
  ];
  
  verticalPositions.forEach(pos => {
    const beamGeometry = new THREE.CylinderGeometry(0.1, 0.1, height, 8);
    const beam = new THREE.Mesh(beamGeometry, beamMaterial);
    beam.position.set(pos.x, height / 2, pos.z);
    group.add(beam);
  });
  
  // Horizontal beams
  const levelHeight = height / 3;
  
  for (let level = 1; level <= 3; level++) {
    const y = level * levelHeight;
    
    // Front-back beams
    for (let x = -width / 2; x <= width / 2; x += width) {
      const beamGeometry = new THREE.CylinderGeometry(0.08, 0.08, depth, 8);
      const beam = new THREE.Mesh(beamGeometry, beamMaterial);
      beam.position.set(x, y, 0);
      beam.rotation.x = Math.PI / 2;
      group.add(beam);
    }
    
    // Left-right beams
    for (let z = -depth / 2; z <= depth / 2; z += depth) {
      const beamGeometry = new THREE.CylinderGeometry(0.08, 0.08, width, 8);
      const beam = new THREE.Mesh(beamGeometry, beamMaterial);
      beam.position.set(0, y, z);
      beam.rotation.z = Math.PI / 2;
      group.add(beam);
    }
  }
  
  return group;
}

// Create scaffolding
function createScaffolding(width: number, height: number, depth: number) {
  const group = new THREE.Group();
  
  const scaffoldMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xc0c0c0,
    roughness: 0.7,
    metalness: 0.3
  });
  
  const platformMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x8b4513,
    roughness: 0.9,
    metalness: 0.1
  });
  
  // Vertical poles
  const polePositions = [
    { x: -width / 2 - 0.5, z: -depth / 2 - 0.5 },
    { x: width / 2 + 0.5, z: -depth / 2 - 0.5 },
    { x: width / 2 + 0.5, z: depth / 2 + 0.5 },
    { x: -width / 2 - 0.5, z: depth / 2 + 0.5 }
  ];
  
  polePositions.forEach(pos => {
    const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, height, 8);
    const pole = new THREE.Mesh(poleGeometry, scaffoldMaterial);
    pole.position.set(pos.x, height / 2, pos.z);
    group.add(pole);
  });
  
  // Horizontal connectors
  const levelHeight = height / 3;
  
  for (let level = 1; level <= 3; level++) {
    const y = level * levelHeight;
    
    // Front connectors
    const frontConnectorGeometry = new THREE.CylinderGeometry(0.05, 0.05, width + 1, 8);
    const frontConnector = new THREE.Mesh(frontConnectorGeometry, scaffoldMaterial);
    frontConnector.position.set(0, y, -depth / 2 - 0.5);
    frontConnector.rotation.z = Math.PI / 2;
    group.add(frontConnector);
    
    // Back connectors
    const backConnectorGeometry = new THREE.CylinderGeometry(0.05, 0.05, width + 1, 8);
    const backConnector = new THREE.Mesh(backConnectorGeometry, scaffoldMaterial);
    backConnector.position.set(0, y, depth / 2 + 0.5);
    backConnector.rotation.z = Math.PI / 2;
    group.add(backConnector);
    
    // Left connectors
    const leftConnectorGeometry = new THREE.CylinderGeometry(0.05, 0.05, depth + 1, 8);
    const leftConnector = new THREE.Mesh(leftConnectorGeometry, scaffoldMaterial);
    leftConnector.position.set(-width / 2 - 0.5, y, 0);
    leftConnector.rotation.x = Math.PI / 2;
    group.add(leftConnector);
    
    // Right connectors
    const rightConnectorGeometry = new THREE.CylinderGeometry(0.05, 0.05, depth + 1, 8);
    const rightConnector = new THREE.Mesh(rightConnectorGeometry, scaffoldMaterial);
    rightConnector.position.set(width / 2 + 0.5, y, 0);
    rightConnector.rotation.x = Math.PI / 2;
    group.add(rightConnector);
    
    // Platforms (every other level)
    if (level % 2 === 1) {
      // Front platform
      const frontPlatformGeometry = new THREE.BoxGeometry(width + 1, 0.1, 1);
      const frontPlatform = new THREE.Mesh(frontPlatformGeometry, platformMaterial);
      frontPlatform.position.set(0, y - 0.05, -depth / 2 - 1);
      group.add(frontPlatform);
      
      // Back platform
      const backPlatformGeometry = new THREE.BoxGeometry(width + 1, 0.1, 1);
      const backPlatform = new THREE.Mesh(backPlatformGeometry, platformMaterial);
      backPlatform.position.set(0, y - 0.05, depth / 2 + 1);
      group.add(backPlatform);
      
      // Left platform
      const leftPlatformGeometry = new THREE.BoxGeometry(1, 0.1, depth + 1);
      const leftPlatform = new THREE.Mesh(leftPlatformGeometry, platformMaterial);
      leftPlatform.position.set(-width / 2 - 1, y - 0.05, 0);
      group.add(leftPlatform);
      
      // Right platform
      const rightPlatformGeometry = new THREE.BoxGeometry(1, 0.1, depth + 1);
      const rightPlatform = new THREE.Mesh(rightPlatformGeometry, platformMaterial);
      rightPlatform.position.set(width / 2 + 1, y - 0.05, 0);
      group.add(rightPlatform);
    }
  }
  
  return group;
}

// Create construction crane
function createConstructionCrane() {
  const group = new THREE.Group();
  
  const craneMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xff6347,
    roughness: 0.7,
    metalness: 0.3
  });
  
  // Base
  const baseGeometry = new THREE.BoxGeometry(2, 0.5, 2);
  const base = new THREE.Mesh(baseGeometry, craneMaterial);
  base.position.set(0, 0.25, 0);
  group.add(base);
  
  // Tower
  const towerGeometry = new THREE.BoxGeometry(1, 12, 1);
  const tower = new THREE.Mesh(towerGeometry, craneMaterial);
  tower.position.set(0, 6.25, 0);
  group.add(tower);
  
  // Jib (horizontal arm)
  const jibGeometry = new THREE.BoxGeometry(10, 0.5, 0.5);
  const jib = new THREE.Mesh(jibGeometry, craneMaterial);
  jib.position.set(4, 12, 0);
  group.add(jib);
  
  // Counter-jib
  const counterJibGeometry = new THREE.BoxGeometry(3, 0.5, 0.5);
  const counterJib = new THREE.Mesh(counterJibGeometry, craneMaterial);
  counterJib.position.set(-2.5, 12, 0);
  group.add(counterJib);
  
  // Counterweight
  const counterweightGeometry = new THREE.BoxGeometry(1, 1, 1.5);
  const counterweightMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
  const counterweight = new THREE.Mesh(counterweightGeometry, counterweightMaterial);
  counterweight.position.set(-3.5, 12, 0);
  group.add(counterweight);
  
  // Hook and cable
  const cableMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
  
  const cableGeometry = new THREE.BufferGeometry();
  const cablePoints = [
    5, 12, 0,
    5, 8, 0
  ];
  cableGeometry.setAttribute('position', new THREE.Float32BufferAttribute(cablePoints, 3));
  
  const cable = new THREE.Line(cableGeometry, cableMaterial);
  group.add(cable);
  
  // Hook
  const hookGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
  const hookMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
  const hook = new THREE.Mesh(hookGeometry, hookMaterial);
  hook.position.set(5, 7.6, 0);
  group.add(hook);
  
  return group;
}

// Create construction barriers
function createConstructionBarriers() {
  const group = new THREE.Group();
  
  const barrierMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xffa500,
    roughness: 0.8,
    metalness: 0.2
  });
  
  const stripeMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xffffff,
    roughness: 0.8,
    metalness: 0.2
  });
  
  const positions = [
    { x: -5, z: 5, rotation: 0 },
    { x: -5, z: 3, rotation: 0 },
    { x: -5, z: -3, rotation: 0 },
    { x: -5, z: -5, rotation: 0 },
    { x: 5, z: 5, rotation: 0 },
    { x: 5, z: 3, rotation: 0 },
    { x: 5, z: -3, rotation: 0 },
    { x: 5, z: -5, rotation: 0 },
    { x: -3, z: 5, rotation: Math.PI / 2 },
    { x: 0, z: 5, rotation: Math.PI / 2 },
    { x: 3, z: 5, rotation: Math.PI / 2 },
    { x: -3, z: -5, rotation: Math.PI / 2 },
    { x: 0, z: -5, rotation: Math.PI / 2 },
    { x: 3, z: -5, rotation: Math.PI / 2 }
  ];
  
  positions.forEach(pos => {
    const barrier = createBarrier(barrierMaterial, stripeMaterial);
    barrier.position.set(pos.x, 0, pos.z);
    barrier.rotation.y = pos.rotation;
    group.add(barrier);
  });
  
  return group;
}

// Create a single construction barrier
function createBarrier(barrierMaterial: THREE.Material, stripeMaterial: THREE.Material) {
  const group = new THREE.Group();
  
  // Base
  const baseGeometry = new THREE.BoxGeometry(2, 0.2, 0.5);
  const base = new THREE.Mesh(baseGeometry, barrierMaterial);
  base.position.set(0, 0.1, 0);
  group.add(base);
  
  // Vertical part
  const verticalGeometry = new THREE.BoxGeometry(2, 1, 0.1);
  
  // Create a pattern material (orange and white stripes)
  const materialArray = [
    barrierMaterial,
    barrierMaterial,
    stripeMaterial,
    stripeMaterial,
    barrierMaterial,
    barrierMaterial
  ];
  
  const vertical = new THREE.Mesh(verticalGeometry, materialArray);
  vertical.position.set(0, 0.7, 0);
  group.add(vertical);
  
  return group;
}

// Create construction materials
function createConstructionMaterials() {
  const group = new THREE.Group();
  
  // Create stack of bricks
  const brickMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xb22222,
    roughness: 0.9,
    metalness: 0.1
  });
  
  const brickStackGroup = new THREE.Group();
  
  // Create individual bricks in a stack
  for (let y = 0; y < 5; y++) {
    for (let x = 0; x < 3; x++) {
      const brickGeometry = new THREE.BoxGeometry(0.8, 0.3, 0.4);
      const brick = new THREE.Mesh(brickGeometry, brickMaterial);
      
      // Alternate brick direction every other row
      if (y % 2 === 0) {
        brick.position.set(-4 + x * 0.85, 0.15 + y * 0.3, -3);
      } else {
        brick.rotation.y = Math.PI / 2;
        brick.position.set(-4 + 0.85, 0.15 + y * 0.3, -3 + x * 0.45 - 0.45);
      }
      
      brickStackGroup.add(brick);
    }
  }
  
  group.add(brickStackGroup);
  
  // Create stack of lumber
  const lumberMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x8b4513,
    roughness: 0.8,
    metalness: 0.1
  });
  
  const lumberStackGroup = new THREE.Group();
  
  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 4; x++) {
      const lumberGeometry = new THREE.BoxGeometry(3, 0.3, 0.3);
      const lumber = new THREE.Mesh(lumberGeometry, lumberMaterial);
      lumber.position.set(-4, 0.15 + y * 0.35, 3 + x * 0.35);
      lumberStackGroup.add(lumber);
    }
  }
  
  group.add(lumberStackGroup);
  
  // Create pile of sand
  const sandGeometry = new THREE.ConeGeometry(1.5, 1, 16);
  const sandMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xd2b48c,
    roughness: 1.0,
    metalness: 0.0
  });
  const sand = new THREE.Mesh(sandGeometry, sandMaterial);
  sand.position.set(4, 0.5, 3);
  group.add(sand);
  
  // Create cement mixer
  const mixerGroup = new THREE.Group();
  mixerGroup.position.set(4, 0, -3);
  
  // Mixer base
  const baseGeometry = new THREE.BoxGeometry(1.5, 0.8, 1.5);
  const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x3cb371 });
  const base = new THREE.Mesh(baseGeometry, baseMaterial);
  base.position.set(0, 0.4, 0);
  mixerGroup.add(base);
  
  // Mixer drum
  const drumGeometry = new THREE.CylinderGeometry(0.6, 0.8, 1.2, 16);
  const drumMaterial = new THREE.MeshStandardMaterial({ color: 0x4682b4 });
  const drum = new THREE.Mesh(drumGeometry, drumMaterial);
  drum.position.set(0, 1.2, 0);
  drum.rotation.z = Math.PI / 4;
  mixerGroup.add(drum);
  
  // Mixer opening
  const openingGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16);
  const opening = new THREE.Mesh(openingGeometry, drumMaterial);
  opening.position.set(0.5, 1.5, 0);
  mixerGroup.add(opening);
  
  // Wheels
  const wheelGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.2, 16);
  const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
  
  const wheel1 = new THREE.Mesh(wheelGeometry, wheelMaterial);
  wheel1.position.set(0.6, 0.2, 0.5);
  wheel1.rotation.z = Math.PI / 2;
  mixerGroup.add(wheel1);
  
  const wheel2 = new THREE.Mesh(wheelGeometry, wheelMaterial);
  wheel2.position.set(0.6, 0.2, -0.5);
  wheel2.rotation.z = Math.PI / 2;
  mixerGroup.add(wheel2);
  
  const wheel3 = new THREE.Mesh(wheelGeometry, wheelMaterial);
  wheel3.position.set(-0.6, 0.2, 0.5);
  wheel3.rotation.z = Math.PI / 2;
  mixerGroup.add(wheel3);
  
  const wheel4 = new THREE.Mesh(wheelGeometry, wheelMaterial);
  wheel4.position.set(-0.6, 0.2, -0.5);
  wheel4.rotation.z = Math.PI / 2;
  mixerGroup.add(wheel4);
  
  group.add(mixerGroup);
  
  return group;
}

// Operation stage
function addOperationStage(scene: THREE.Scene) {
  // Create a completed building
  const building = createCompletedBuilding();
  building.name = "building";
  scene.add(building);
  
  // Add landscaping
  const landscaping = createLandscaping();
  landscaping.name = "landscaping";
  scene.add(landscaping);
  
  // Add people and cars
  const people = createPeopleAndCars();
  people.name = "peopleAndCars";
  scene.add(people);
}

// Create a completed building
function createCompletedBuilding() {
  const group = new THREE.Group();
  
  // Foundation
  const foundationGeometry = new THREE.BoxGeometry(8, 0.5, 6);
  const concreteMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x8b8b8b,
    roughness: 0.9,
    metalness: 0.1
  });
  const foundation = new THREE.Mesh(foundationGeometry, concreteMaterial);
  foundation.position.set(0, 0.25, 0);
  foundation.receiveShadow = true;
  group.add(foundation);
  
  // Building walls
  const wallGeometry = new THREE.BoxGeometry(7.5, 6, 5.5);
  const wallMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xebebeb,
    roughness: 0.8,
    metalness: 0.2
  });
  const walls = new THREE.Mesh(wallGeometry, wallMaterial);
  walls.position.set(0, 3.5, 0);
  walls.castShadow = true;
  walls.receiveShadow = true;
  group.add(walls);
  
  // Roof
  const roofGeometry = new THREE.BoxGeometry(8, 0.5, 6);
  const roofMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x708090,
    roughness: 0.7,
    metalness: 0.3
  });
  const roof = new THREE.Mesh(roofGeometry, roofMaterial);
  roof.position.set(0, 6.75, 0);
  roof.castShadow = true;
  group.add(roof);
  
  // Windows
  const windowMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x87ceeb,
    roughness: 0.3,
    metalness: 0.5,
    transparent: true,
    opacity: 0.8
  });
  
  const windowPositions = [
    // Front windows
    { x: -2.5, y: 4, z: 2.76, width: 1.2, height: 1.2 },
    { x: 0, y: 4, z: 2.76, width: 1.2, height: 1.2 },
    { x: 2.5, y: 4, z: 2.76, width: 1.2, height: 1.2 },
    { x: -2.5, y: 2, z: 2.76, width: 1.2, height: 1.2 },
    { x: 2.5, y: 2, z: 2.76, width: 1.2, height: 1.2 },
    
    // Back windows
    { x: -2.5, y: 4, z: -2.76, width: 1.2, height: 1.2 },
    { x: 0, y: 4, z: -2.76, width: 1.2, height: 1.2 },
    { x: 2.5, y: 4, z: -2.76, width: 1.2, height: 1.2 },
    { x: -2.5, y: 2, z: -2.76, width: 1.2, height: 1.2 },
    { x: 0, y: 2, z: -2.76, width: 1.2, height: 1.2 },
    { x: 2.5, y: 2, z: -2.76, width: 1.2, height: 1.2 },
    
    // Left windows
    { x: -3.76, y: 4, z: -1.5, width: 1.2, height: 1.2, rotate: true },
    { x: -3.76, y: 4, z: 1.5, width: 1.2, height: 1.2, rotate: true },
    { x: -3.76, y: 2, z: -1.5, width: 1.2, height: 1.2, rotate: true },
    { x: -3.76, y: 2, z: 1.5, width: 1.2, height: 1.2, rotate: true },
    
    // Right windows
    { x: 3.76, y: 4, z: -1.5, width: 1.2, height: 1.2, rotate: true },
    { x: 3.76, y: 4, z: 1.5, width: 1.2, height: 1.2, rotate: true },
    { x: 3.76, y: 2, z: -1.5, width: 1.2, height: 1.2, rotate: true },
    { x: 3.76, y: 2, z: 1.5, width: 1.2, height: 1.2, rotate: true }
  ];
  
  windowPositions.forEach(pos => {
    const windowGeometry = new THREE.BoxGeometry(
      pos.rotate ? 0.1 : pos.width,
      pos.height,
      pos.rotate ? pos.width : 0.1
    );
    const window = new THREE.Mesh(windowGeometry, windowMaterial);
    window.position.set(pos.x, pos.y, pos.z);
    group.add(window);
  });
  
  // Door
  const doorGeometry = new THREE.BoxGeometry(1.5, 2.5, 0.1);
  const doorMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x8b4513,
    roughness: 0.8,
    metalness: 0.2
  });
  const door = new THREE.Mesh(doorGeometry, doorMaterial);
  door.position.set(0, 1.75, 2.76);
  group.add(door);
  
  // Door handle
  const handleGeometry = new THREE.SphereGeometry(0.1, 8, 8);
  const handleMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xffd700,
    roughness: 0.2,
    metalness: 0.8
  });
  const handle = new THREE.Mesh(handleGeometry, handleMaterial);
  handle.position.set(0.5, 1.75, 2.82);
  group.add(handle);
  
  return group;
}

// Create landscaping around the building
function createLandscaping() {
  const group = new THREE.Group();
  
  // Walkway to building
  const walkwayGeometry = new THREE.BoxGeometry(2, 0.1, 6);
  const walkwayMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xd3d3d3,
    roughness: 0.9,
    metalness: 0.1
  });
  const walkway = new THREE.Mesh(walkwayGeometry, walkwayMaterial);
  walkway.position.set(0, 0.05, 5.5);
  walkway.receiveShadow = true;
  group.add(walkway);
  
  // Bushes
  const bushPositions = [
    { x: -3, z: 3 },
    { x: 3, z: 3 },
    { x: -3, z: -3 },
    { x: 3, z: -3 },
    { x: -2, z: 3 },
    { x: 2, z: 3 }
  ];
  
  const bushMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x228b22,
    roughness: 0.9,
    metalness: 0.1
  });
  
  bushPositions.forEach(pos => {
    const size = 0.3 + Math.random() * 0.3;
    const bushGeometry = new THREE.SphereGeometry(size, 8, 8);
    const bush = new THREE.Mesh(bushGeometry, bushMaterial);
    bush.position.set(pos.x, size, pos.z);
    bush.castShadow = true;
    bush.receiveShadow = true;
    group.add(bush);
  });
  
  // Small trees
  const treePositions = [
    { x: -4, z: 4 },
    { x: 4, z: 4 }
  ];
  
  treePositions.forEach(pos => {
    const tree = createSmallTree();
    tree.position.set(pos.x, 0, pos.z);
    group.add(tree);
  });
  
  // Grass patches
  const grassMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x7cfc00,
    roughness: 0.9,
    metalness: 0.1
  });
  
  for (let i = 0; i < 20; i++) {
    const patchGeometry = new THREE.CircleGeometry(0.5 + Math.random() * 1.5, 8);
    const patch = new THREE.Mesh(patchGeometry, grassMaterial);
    
    const x = (Math.random() - 0.5) * 14;
    const z = (Math.random() - 0.5) * 14;
    
    // Avoid placing on walkway or building
    if (Math.abs(x) < 4 && z > 0 && z < 9) continue;
    if (Math.abs(x) < 5 && Math.abs(z) < 4) continue;
    
    patch.position.set(x, 0.01, z);
    patch.rotation.x = -Math.PI / 2;
    patch.receiveShadow = true;
    group.add(patch);
  }
  
  // Parking area
  const parkingGeometry = new THREE.BoxGeometry(8, 0.05, 5);
  const parkingMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x2f4f4f,
    roughness: 0.9,
    metalness: 0.1
  });
  const parking = new THREE.Mesh(parkingGeometry, parkingMaterial);
  parking.position.set(0, 0.025, -6);
  parking.receiveShadow = true;
  group.add(parking);
  
  // Parking lines
  const lineMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xffffff,
    roughness: 0.9,
    metalness: 0.1
  });
  
  for (let i = -3; i <= 3; i += 2) {
    const lineGeometry = new THREE.BoxGeometry(0.1, 0.01, 4);
    const line = new THREE.Mesh(lineGeometry, lineMaterial);
    line.position.set(i, 0.03, -6);
    group.add(line);
  }
  
  return group;
}

// Create a small tree
function createSmallTree() {
  const group = new THREE.Group();
  
  // Tree trunk
  const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 1.5, 8);
  const trunkMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x8b4513,
    roughness: 0.9,
    metalness: 0.1
  });
  const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
  trunk.position.set(0, 0.75, 0);
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  group.add(trunk);
  
  // Tree foliage (several overlapping spheres)
  const foliageMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x228b22,
    roughness: 0.9,
    metalness: 0.1
  });
  
  const foliagePositions = [
    { x: 0, y: 2.5, z: 0, size: 1.2 },
    { x: 0.6, y: 2.2, z: 0, size: 0.9 },
    { x: -0.6, y: 2.3, z: 0, size: 0.8 },
    { x: 0, y: 2.2, z: 0.7, size: 0.9 },
    { x: 0, y: 2.3, z: -0.7, size: 0.8 }
  ];
  
  foliagePositions.forEach(pos => {
    const foliageGeometry = new THREE.SphereGeometry(pos.size, 8, 8);
    const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
    foliage.position.set(pos.x, pos.y, pos.z);
    foliage.castShadow = true;
    foliage.receiveShadow = true;
    group.add(foliage);
  });
  
  return group;
}

// Create people and cars
function createPeopleAndCars() {
  const group = new THREE.Group();
  
  // Add some people
  const personPositions = [
    { x: -1, z: 3, rotation: 0 },
    { x: 2, z: 4, rotation: -Math.PI / 3 },
    { x: 0, z: 8, rotation: -Math.PI / 2 }
  ];
  
  personPositions.forEach(pos => {
    const person = createPerson();
    person.position.set(pos.x, 0, pos.z);
    person.rotation.y = pos.rotation;
    group.add(person);
  });
  
  // Add cars in parking area
  const carPositions = [
    { x: -3, z: -6, color: 0xff0000, rotation: Math.PI / 2 },
    { x: -1, z: -6, color: 0x0000ff, rotation: Math.PI / 2 },
    { x: 2, z: -6, color: 0x008000, rotation: Math.PI / 2 }
  ];
  
  carPositions.forEach(pos => {
    const car = createCar(pos.color);
    car.position.set(pos.x, 0, pos.z);
    car.rotation.y = pos.rotation;
    group.add(car);
  });
  
  return group;
}

// Create a person
function createPerson() {
  const group = new THREE.Group();
  
  // Color options
  const skinColor = 0xffa07a;
  const shirtColor = 0x4682b4;
  const pantsColor = 0x000080;
  
  // Head
  const headGeometry = new THREE.SphereGeometry(0.15, 8, 8);
  const headMaterial = new THREE.MeshStandardMaterial({ color: skinColor });
  const head = new THREE.Mesh(headGeometry, headMaterial);
  head.position.set(0, 1.7, 0);
  group.add(head);
  
  // Body
  const bodyGeometry = new THREE.BoxGeometry(0.25, 0.5, 0.15);
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: shirtColor });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.set(0, 1.35, 0);
  group.add(body);
  
  // Legs
  const legGeometry = new THREE.BoxGeometry(0.12, 0.5, 0.12);
  const legMaterial = new THREE.MeshStandardMaterial({ color: pantsColor });
  
  const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
  leftLeg.position.set(-0.07, 0.9, 0);
  group.add(leftLeg);
  
  const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
  rightLeg.position.set(0.07, 0.9, 0);
  group.add(rightLeg);
  
  // Arms
  const armGeometry = new THREE.BoxGeometry(0.1, 0.4, 0.1);
  const armMaterial = new THREE.MeshStandardMaterial({ color: shirtColor });
  
  const leftArm = new THREE.Mesh(armGeometry, armMaterial);
  leftArm.position.set(-0.17, 1.35, 0);
  group.add(leftArm);
  
  const rightArm = new THREE.Mesh(armGeometry, armMaterial);
  rightArm.position.set(0.17, 1.35, 0);
  group.add(rightArm);
  
  // Make the person small
  group.scale.set(0.7, 0.7, 0.7);
  
  return group;
}

// Create a car
function createCar(color: number) {
  const group = new THREE.Group();
  
  // Car body
  const bodyGeometry = new THREE.BoxGeometry(1.8, 0.5, 0.9);
  const bodyMaterial = new THREE.MeshStandardMaterial({ 
    color: color,
    roughness: 0.3,
    metalness: 0.8
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.set(0, 0.4, 0);
  body.castShadow = true;
  group.add(body);
  
  // Car top
  const topGeometry = new THREE.BoxGeometry(1.0, 0.4, 0.85);
  const top = new THREE.Mesh(topGeometry, bodyMaterial);
  top.position.set(-0.1, 0.85, 0);
  top.castShadow = true;
  group.add(top);
  
  // Windows
  const windowMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x87ceeb,
    roughness: 0.1,
    metalness: 0.9,
    transparent: true,
    opacity: 0.7
  });
  
  // Windshield
  const windshieldGeometry = new THREE.BoxGeometry(0.1, 0.3, 0.8);
  const windshield = new THREE.Mesh(windshieldGeometry, windowMaterial);
  windshield.position.set(0.4, 0.85, 0);
  group.add(windshield);
  
  // Rear window
  const rearWindowGeometry = new THREE.BoxGeometry(0.1, 0.3, 0.8);
  const rearWindow = new THREE.Mesh(rearWindowGeometry, windowMaterial);
  rearWindow.position.set(-0.6, 0.85, 0);
  group.add(rearWindow);
  
  // Side windows
  const sideWindowGeometry = new THREE.BoxGeometry(0.95, 0.3, 0.1);
  
  const leftWindow = new THREE.Mesh(sideWindowGeometry, windowMaterial);
  leftWindow.position.set(-0.1, 0.85, 0.43);
  group.add(leftWindow);
  
  const rightWindow = new THREE.Mesh(sideWindowGeometry, windowMaterial);
  rightWindow.position.set(-0.1, 0.85, -0.43);
  group.add(rightWindow);
  
  // Wheels
  const wheelGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 16);
  const wheelMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x000000,
    roughness: 0.8,
    metalness: 0.2
  });
  
  const wheelPositions = [
    { x: -0.5, y: 0.2, z: 0.5 },
    { x: 0.5, y: 0.2, z: 0.5 },
    { x: -0.5, y: 0.2, z: -0.5 },
    { x: 0.5, y: 0.2, z: -0.5 }
  ];
  
  wheelPositions.forEach(pos => {
    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel.position.set(pos.x, pos.y, pos.z);
    wheel.rotation.z = Math.PI / 2;
    wheel.castShadow = true;
    group.add(wheel);
  });
  
  // Lights
  const headlightGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.2);
  const headlightMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xffff00,
    roughness: 0.1,
    metalness: 0.9,
    emissive: 0xffff00,
    emissiveIntensity: 0.5
  });
  
  const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
  leftHeadlight.position.set(0.9, 0.4, 0.3);
  group.add(leftHeadlight);
  
  const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
  rightHeadlight.position.set(0.9, 0.4, -0.3);
  group.add(rightHeadlight);
  
  // Taillights
  const taillightGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.2);
  const taillightMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xff0000,
    roughness: 0.1,
    metalness: 0.9,
    emissive: 0xff0000,
    emissiveIntensity: 0.5
  });
  
  const leftTaillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
  leftTaillight.position.set(-0.9, 0.4, 0.3);
  group.add(leftTaillight);
  
  const rightTaillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
  rightTaillight.position.set(-0.9, 0.4, -0.3);
  group.add(rightTaillight);
  
  return group;
}

// Renovation stage
function addRenovationStage(scene: THREE.Scene) {
  // Add a building being renovated
  const building = createCompletedBuilding();
  building.name = "building";
  scene.add(building);
  
  // Add scaffolding on one side
  const scaffolding = createScaffolding(8, 7, 1);
  scaffolding.position.set(0, 0, 3);
  scaffolding.name = "scaffolding";
  scene.add(scaffolding);
  
  // Add renovation equipment and materials
  const renovationElements = createRenovationElements();
  renovationElements.name = "renovationElements";
  scene.add(renovationElements);
}

// Create renovation equipment and materials
function createRenovationElements() {
  const group = new THREE.Group();
  
  // Add a construction lift
  const lift = createConstructionLift();
  lift.position.set(5, 0, 0);
  group.add(lift);
  
  // Add renovation materials
  const materials = createRenovationMaterials();
  group.add(materials);
  
  // Add a couple of workers on scaffolding
  const worker1 = createPerson();
  worker1.position.set(-2, 3.5, 3.6);
  worker1.rotation.y = Math.PI;
  group.add(worker1);
  
  const worker2 = createPerson();
  worker2.position.set(1, 5.5, 3.6);
  worker2.rotation.y = Math.PI;
  group.add(worker2);
  
  return group;
}

// Create a construction lift
function createConstructionLift() {
  const group = new THREE.Group();
  
  // Base
  const baseGeometry = new THREE.BoxGeometry(3, 0.5, 2);
  const baseMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xff8c00,
    roughness: 0.8,
    metalness: 0.3
  });
  const base = new THREE.Mesh(baseGeometry, baseMaterial);
  base.position.set(0, 0.25, 0);
  group.add(base);
  
  // Vertical support
  const supportGeometry = new THREE.BoxGeometry(0.5, 8, 0.5);
  const support = new THREE.Mesh(supportGeometry, baseMaterial);
  support.position.set(0, 4.25, 0);
  group.add(support);
  
  // Platform
  const platformGeometry = new THREE.BoxGeometry(2, 0.2, 1.5);
  const platformMaterial = new THREE.MeshStandardMaterial({ color: 0xa0a0a0 });
  const platform = new THREE.Mesh(platformGeometry, platformMaterial);
  platform.position.set(0, 3, 0);
  group.add(platform);
  
  // Railings
  const railingMaterial = new THREE.MeshStandardMaterial({ color: 0xff8c00 });
  
  // Back railing
  const backRailingGeometry = new THREE.BoxGeometry(2, 0.1, 0.05);
  const backRailing = new THREE.Mesh(backRailingGeometry, railingMaterial);
  backRailing.position.set(0, 3.5, -0.75);
  group.add(backRailing);
  
  // Left railing
  const leftRailingGeometry = new THREE.BoxGeometry(0.05, 0.1, 1.5);
  const leftRailing = new THREE.Mesh(leftRailingGeometry, railingMaterial);
  leftRailing.position.set(-1, 3.5, 0);
  group.add(leftRailing);
  
  // Right railing
  const rightRailingGeometry = new THREE.BoxGeometry(0.05, 0.1, 1.5);
  const rightRailing = new THREE.Mesh(rightRailingGeometry, railingMaterial);
  rightRailing.position.set(1, 3.5, 0);
  group.add(rightRailing);
  
  // Hydraulic arms
  const armMaterial = new THREE.MeshStandardMaterial({ color: 0x708090 });
  
  const arm1Geometry = new THREE.BoxGeometry(0.2, 3, 0.2);
  const arm1 = new THREE.Mesh(arm1Geometry, armMaterial);
  arm1.position.set(-0.5, 1.75, 0);
  arm1.rotation.z = Math.PI / 6;
  group.add(arm1);
  
  const arm2Geometry = new THREE.BoxGeometry(0.2, 3, 0.2);
  const arm2 = new THREE.Mesh(arm2Geometry, armMaterial);
  arm2.position.set(0.5, 1.75, 0);
  arm2.rotation.z = -Math.PI / 6;
  group.add(arm2);
  
  // Controls panel
  const panelGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.3);
  const panelMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
  const panel = new THREE.Mesh(panelGeometry, panelMaterial);
  panel.position.set(0, 3.2, -0.6);
  group.add(panel);
  
  return group;
}

// Create renovation materials
function createRenovationMaterials() {
  const group = new THREE.Group();
  
  // New facade panels
  const panelMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xf5f5f5,
    roughness: 0.2,
    metalness: 0.8
  });
  
  for (let i = 0; i < 5; i++) {
    const panelGeometry = new THREE.BoxGeometry(1, 2, 0.1);
    const panel = new THREE.Mesh(panelGeometry, panelMaterial);
    panel.position.set(-5, 0.2, -3 + i * 0.3);
    panel.rotation.x = Math.PI / 2;
    group.add(panel);
  }
  
  // Paint buckets
  const bucketGeometry = new THREE.CylinderGeometry(0.3, 0.25, 0.5, 16);
  const bucketColors = [0xffffff, 0x87ceeb, 0x90ee90];
  
  for (let i = 0; i < 3; i++) {
    const bucketMaterial = new THREE.MeshStandardMaterial({ 
      color: bucketColors[i],
      roughness: 0.7,
      metalness: 0.3
    });
    const bucket = new THREE.Mesh(bucketGeometry, bucketMaterial);
    bucket.position.set(-3, 0.25, 3 - i * 0.7);
    group.add(bucket);
  }
  
  // Toolbox
  const toolboxGeometry = new THREE.BoxGeometry(0.8, 0.4, 0.5);
  const toolboxMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
  const toolbox = new THREE.Mesh(toolboxGeometry, toolboxMaterial);
  toolbox.position.set(-2, 0.2, -3);
  group.add(toolbox);
  
  // Tools
  const toolMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x808080,
    roughness: 0.5,
    metalness: 0.7
  });
  
  // Ladder
  const ladder = createLadder();
  ladder.position.set(3, 0, 2);
  ladder.rotation.y = Math.PI / 4;
  group.add(ladder);
  
  return group;
}

// Create a ladder
function createLadder() {
  const group = new THREE.Group();
  
  const frameMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xa0a0a0,
    roughness: 0.7,
    metalness: 0.3
  });
  
  const stepMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x8b4513,
    roughness: 0.8,
    metalness: 0.1
  });
  
  // Ladder sides
  const side1Geometry = new THREE.BoxGeometry(0.1, 5, 0.1);
  const side1 = new THREE.Mesh(side1Geometry, frameMaterial);
  side1.position.set(-0.3, 2.5, 0);
  group.add(side1);
  
  const side2Geometry = new THREE.BoxGeometry(0.1, 5, 0.1);
  const side2 = new THREE.Mesh(side2Geometry, frameMaterial);
  side2.position.set(0.3, 2.5, 0);
  group.add(side2);
  
  // Ladder steps
  for (let i = 0; i < 10; i++) {
    const stepGeometry = new THREE.BoxGeometry(0.7, 0.05, 0.3);
    const step = new THREE.Mesh(stepGeometry, stepMaterial);
    step.position.set(0, 0.5 * i + 0.5, 0);
    group.add(step);
  }
  
  return group;
}

// End-of-life stage
function addEndOfLifeStage(scene: THREE.Scene) {
  const demolitionElements = new THREE.Group();
  demolitionElements.name = "demolitionElements";
  
  // Add partial building (being demolished)
  const partialBuilding = createPartialBuilding(0.3);
  partialBuilding.name = "building";
  scene.add(partialBuilding);
  
  // Add rubble pile
  const rubble = createRubblePile();
  demolitionElements.add(rubble);
  
  // Add demolition equipment
  const equipment = createDemolitionEquipment();
  equipment.position.set(-5, 0, 0);
  demolitionElements.add(equipment);
  
  // Add dust particles
  const dust = createDustCloud();
  demolitionElements.add(dust);
  
  scene.add(demolitionElements);
}

// Create rubble pile
function createRubblePile() {
  const group = new THREE.Group();
  
  // Base rubble pile
  const rubbleGeometry = new THREE.ConeGeometry(5, 2, 8);
  const rubbleMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xa0a0a0,
    roughness: 1.0,
    metalness: 0.1
  });
  const rubblePile = new THREE.Mesh(rubbleGeometry, rubbleMaterial);
  rubblePile.position.set(0, 1, 0);
  rubblePile.scale.set(1, 1, 0.7);
  group.add(rubblePile);
  
  // Individual rubble pieces
  const fragmentMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xd3d3d3,
    roughness: 0.9,
    metalness: 0.2
  });
  
  for (let i = 0; i < 30; i++) {
    const size = 0.1 + Math.random() * 0.4;
    const fragmentGeometry = new THREE.BoxGeometry(size, size, size);
    const fragment = new THREE.Mesh(fragmentGeometry, fragmentMaterial);
    
    const radius = Math.random() * 4;
    const angle = Math.random() * Math.PI * 2;
    const x = radius * Math.cos(angle);
    const z = radius * Math.sin(angle);
    const y = Math.random() * 1.5;
    
    fragment.position.set(x, y, z);
    fragment.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );
    
    group.add(fragment);
  }
  
  // Rebar sticking out
  const rebarMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x8b4513,
    roughness: 0.3,
    metalness: 0.7
  });
  
  for (let i = 0; i < 15; i++) {
    const rebarGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.5 + Math.random() * 1.5, 8);
    const rebar = new THREE.Mesh(rebarGeometry, rebarMaterial);
    
    const radius = Math.random() * 3;
    const angle = Math.random() * Math.PI * 2;
    const x = radius * Math.cos(angle);
    const z = radius * Math.sin(angle);
    const y = Math.random() * 1.2;
    
    rebar.position.set(x, y, z);
    
    const tiltX = (Math.random() - 0.5) * Math.PI / 2;
    const tiltZ = (Math.random() - 0.5) * Math.PI / 2;
    
    rebar.rotation.set(tiltX, 0, tiltZ);
    
    group.add(rebar);
  }
  
  return group;
}

// Create demolition equipment (excavator)
function createDemolitionEquipment() {
  const group = new THREE.Group();
  
  // Excavator base
  const baseGeometry = new THREE.BoxGeometry(3, 1, 2);
  const baseMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xffd700,
    roughness: 0.7,
    metalness: 0.3
  });
  const base = new THREE.Mesh(baseGeometry, baseMaterial);
  base.position.set(0, 0.7, 0);
  group.add(base);
  
  // Tracks
  const trackGeometry = new THREE.BoxGeometry(3.5, 0.4, 0.8);
  const trackMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
  
  const leftTrack = new THREE.Mesh(trackGeometry, trackMaterial);
  leftTrack.position.set(0, 0.2, 0.9);
  group.add(leftTrack);
  
  const rightTrack = new THREE.Mesh(trackGeometry, trackMaterial);
  rightTrack.position.set(0, 0.2, -0.9);
  group.add(rightTrack);
  
  // Cab
  const cabGeometry = new THREE.BoxGeometry(2, 1.5, 1.8);
  const cabMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xffd700,
    roughness: 0.7,
    metalness: 0.3
  });
  const cab = new THREE.Mesh(cabGeometry, cabMaterial);
  cab.position.set(-0.2, 2, 0);
  group.add(cab);
  
  // Windows
  const windowMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x87ceeb,
    roughness: 0.1,
    metalness: 0.9,
    transparent: true,
    opacity: 0.7
  });
  
  const frontWindowGeometry = new THREE.BoxGeometry(1.9, 1.4, 0.1);
  const frontWindow = new THREE.Mesh(frontWindowGeometry, windowMaterial);
  frontWindow.position.set(-0.2, 2, 0.95);
  group.add(frontWindow);
  
  // Boom arm
  const boomGeometry = new THREE.BoxGeometry(4, 0.5, 0.5);
  const boom = new THREE.Mesh(boomGeometry, baseMaterial);
  boom.position.set(2, 2.5, 0);
  boom.rotation.z = -Math.PI / 6;
  group.add(boom);
  
  // Stick arm
  const stickGeometry = new THREE.BoxGeometry(3, 0.4, 0.4);
  const stick = new THREE.Mesh(stickGeometry, baseMaterial);
  stick.position.set(4.5, 1.3, 0);
  stick.rotation.z = Math.PI / 3;
  group.add(stick);
  
  // Hydraulic hammer
  const hammerGeometry = new THREE.BoxGeometry(0.8, 2, 0.6);
  const hammerMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xa0a0a0,
    roughness: 0.5,
    metalness: 0.7
  });
  const hammer = new THREE.Mesh(hammerGeometry, hammerMaterial);
  hammer.position.set(4.8, -0.3, 0);
  group.add(hammer);
  
  return group;
}

// Create dust cloud
function createDustCloud() {
  const group = new THREE.Group();
  
  const dustMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xd3d3d3,
    roughness: 1.0,
    metalness: 0.0,
    transparent: true,
    opacity: 0.4
  });
  
  for (let i = 0; i < 50; i++) {
    const size = 0.2 + Math.random() * 0.8;
    const dustGeometry = new THREE.SphereGeometry(size, 8, 8);
    const dust = new THREE.Mesh(dustGeometry, dustMaterial);
    
    const radius = Math.random() * 5;
    const angle = Math.random() * Math.PI * 2;
    const x = radius * Math.cos(angle);
    const z = radius * Math.sin(angle);
    const y = Math.random() * 3;
    
    dust.position.set(x, y, z);
    group.add(dust);
  }
  
  return group;
}

// Animation functions for different stages
function animateStage(scene: THREE.Scene, stage: number): number[] {
  const animationIds: number[] = [];
  
  switch(stage) {
    case 0:
      animationIds.push(animatePlanningStage(scene));
      break;
    case 1:
      animationIds.push(animateConstructionStage(scene));
      break;
    case 2:
      animationIds.push(animateOperationStage(scene));
      break;
    case 3:
      animationIds.push(animateRenovationStage(scene));
      break;
    case 4:
      animationIds.push(animateEndOfLifeStage(scene));
      break;
  }
  
  return animationIds;
}

// Animation for Planning stage
function animatePlanningStage(scene: THREE.Scene): number {
  let blueprints = scene.getObjectByName("blueprints");
  if (!blueprints) return 0;
  
  let angle = 0;
  
  const animate = () => {
    if (!blueprints) return;
    
    // Slowly rotate the blueprint for a gentle animation
    angle += 0.005;
    blueprints.rotation.y = Math.sin(angle) * 0.1;
    
    return requestAnimationFrame(animate);
  };
  
  return animate();
}

// Animation for Construction stage
function animateConstructionStage(scene: THREE.Scene): number {
  let constructionEquipment = scene.getObjectByName("constructionEquipment");
  if (!constructionEquipment) return 0;
  
  let crane = null;
  constructionEquipment.children.forEach(child => {
    if (child.type === "Group" && child.children.length > 5) {
      crane = child;
    }
  });
  
  if (!crane) return 0;
  
  let angle = 0;
  
  const animate = () => {
    if (!crane) return;
    
    // Rotate the crane
    angle += 0.01;
    crane.rotation.y = Math.sin(angle) * 0.5;
    
    // Move the hook up and down
    if (crane.children.length > 8) {
      const hook = crane.children[8];
      if (hook) {
        hook.position.y = 7.6 + Math.sin(angle * 2) * 0.5;
      }
    }
    
    return requestAnimationFrame(animate);
  };
  
  return animate();
}

// Animation for Operation stage
function animateOperationStage(scene: THREE.Scene): number {
  let peopleAndCars = scene.getObjectByName("peopleAndCars");
  if (!peopleAndCars) return 0;
  
  let angle = 0;
  
  const animate = () => {
    if (!peopleAndCars) return;
    
    // Move people around
    angle += 0.02;
    
    peopleAndCars.children.forEach((child, index) => {
      if (child.type === "Group" && child.scale.x === 0.7) {
        // This is a person
        child.position.x += Math.sin(angle + index) * 0.01;
        child.position.z += Math.cos(angle + index * 0.7) * 0.01;
      }
    });
    
    return requestAnimationFrame(animate);
  };
  
  return animate();
}

// Animation for Renovation stage
function animateRenovationStage(scene: THREE.Scene): number {
  let scaffolding = scene.getObjectByName("scaffolding");
  let renovationElements = scene.getObjectByName("renovationElements");
  if (!scaffolding || !renovationElements) return 0;
  
  let angle = 0;
  
  const animate = () => {
    if (!renovationElements) return;
    
    angle += 0.02;
    
    // Find and animate the construction lift
    renovationElements.children.forEach(child => {
      if (child.type === "Group" && child.children.length > 5) {
        // This might be the lift
        child.children.forEach(part => {
          if (part.position.y === 3 && part.geometry.type === "BoxGeometry") {
            // This is the platform, move it up and down
            part.position.y = 3 + Math.sin(angle) * 2;
            
            // Move any railings and controls with it
            child.children.forEach(railing => {
              if (railing.position.y >= 3.2 && railing.position.y <= 3.5) {
                railing.position.y = railing.position.y - 3 + part.position.y;
              }
            });
          }
        });
      }
    });
    
    return requestAnimationFrame(animate);
  };
  
  return animate();
}

// Animation for End-of-Life stage
function animateEndOfLifeStage(scene: THREE.Scene): number {
  let demolitionElements = scene.getObjectByName("demolitionElements");
  if (!demolitionElements) return 0;
  
  let angle = 0;
  
  const animate = () => {
    if (!demolitionElements) return;
    
    angle += 0.02;
    
    // Animate dust particles
    demolitionElements.children.forEach(child => {
      if (child.type === "Group" && child.children.length > 20) {
        // This is likely the dust cloud
        child.children.forEach(particle => {
          if (particle.geometry.type === "SphereGeometry") {
            particle.position.y += Math.sin(angle + particle.position.x) * 0.01;
            particle.position.x += Math.sin(angle * 0.5) * 0.005;
            particle.position.z += Math.cos(angle * 0.5) * 0.005;
            
            // Reset if particle moves too far
            if (particle.position.y > 5) {
              particle.position.y = Math.random() * 2;
            }
          }
        });
      }
    });
    
    // Animate excavator arm
    demolitionElements.children.forEach(child => {
      if (child.type === "Group" && child.children.length > 8) {
        // This might be the excavator
        child.children.forEach(part => {
          if (part.geometry.type === "BoxGeometry" && part.position.z === 0) {
            // Boom and stick
            if (part.position.x === 2) {
              // Boom
              part.rotation.z = -Math.PI / 6 + Math.sin(angle) * 0.1;
            } else if (part.position.x === 4.5) {
              // Stick
              part.rotation.z = Math.PI / 3 + Math.sin(angle * 1.5) * 0.15;
            }
          }
        });
      }
    });
    
    return requestAnimationFrame(animate);
  };
  
  return animate();
}
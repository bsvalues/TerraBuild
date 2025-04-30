import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
// Import OrbitControls using the standard path in TypeScript
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  BarChart, 
  Building, 
  Cog, 
  HardHat, 
  PlayCircle, 
  PauseCircle, 
  RotateCcw
} from 'lucide-react';

// Define lifecycle stages with 3D model data
const LIFECYCLE_STAGES = [
  {
    id: 'planning',
    title: 'Planning & Design',
    description: 'Conceptualizing the infrastructure and creating detailed plans.',
    color: '#3b82f6', // blue-500
    modelData: {
      objects: [
        { type: 'blueprint', scale: 2, position: [0, 0, 0], rotation: [0, 0, 0] },
        { type: 'people', scale: 1, position: [-2, 0, 2], rotation: [0, Math.PI / 4, 0] },
        { type: 'desk', scale: 1.5, position: [2, 0, -2], rotation: [0, -Math.PI / 6, 0] }
      ],
      cameraPosition: [8, 5, 8],
      ambientLight: 0.7,
      directionalLight: 0.8
    }
  },
  {
    id: 'approval',
    title: 'Approval & Funding',
    description: 'Securing necessary permits and financial resources.',
    color: '#10b981', // emerald-500
    modelData: {
      objects: [
        { type: 'documents', scale: 1.5, position: [0, 0, 0], rotation: [0, 0, 0] },
        { type: 'money', scale: 1.2, position: [3, 0, 1], rotation: [0, Math.PI / 3, 0] },
        { type: 'people', scale: 1, position: [-2, 0, -2], rotation: [0, -Math.PI / 4, 0] }
      ],
      cameraPosition: [7, 6, 7],
      ambientLight: 0.8,
      directionalLight: 0.7
    }
  },
  {
    id: 'construction',
    title: 'Construction',
    description: 'Building the physical infrastructure according to specifications.',
    color: '#f59e0b', // amber-500
    modelData: {
      objects: [
        { type: 'foundation', scale: 2, position: [0, -0.5, 0], rotation: [0, 0, 0] },
        { type: 'structure', scale: 1.5, position: [0, 1, 0], rotation: [0, 0, 0] },
        { type: 'crane', scale: 2, position: [4, 0, 0], rotation: [0, -Math.PI / 4, 0] },
        { type: 'workers', scale: 1, position: [-3, 0, 3], rotation: [0, Math.PI / 6, 0] }
      ],
      cameraPosition: [10, 8, 10],
      ambientLight: 0.6,
      directionalLight: 0.9
    }
  },
  {
    id: 'commissioning',
    title: 'Commissioning',
    description: 'Testing systems and verifying construction meets requirements.',
    color: '#ec4899', // pink-500
    modelData: {
      objects: [
        { type: 'building', scale: 2, position: [0, 0, 0], rotation: [0, Math.PI / 12, 0] },
        { type: 'equipment', scale: 1, position: [3, 0, 2], rotation: [0, -Math.PI / 3, 0] },
        { type: 'people', scale: 1, position: [-2, 0, -2], rotation: [0, Math.PI / 4, 0] }
      ],
      cameraPosition: [9, 6, 9],
      ambientLight: 0.7,
      directionalLight: 0.8
    }
  },
  {
    id: 'operation',
    title: 'Operation & Maintenance',
    description: 'Daily running and upkeep of the infrastructure.',
    color: '#6366f1', // indigo-500
    modelData: {
      objects: [
        { type: 'building', scale: 2, position: [0, 0, 0], rotation: [0, 0, 0] },
        { type: 'vehicles', scale: 1, position: [4, 0, 3], rotation: [0, -Math.PI / 4, 0] },
        { type: 'people', scale: 1, position: [-3, 0, -1], rotation: [0, Math.PI / 6, 0] },
        { type: 'maintenance', scale: 1.2, position: [2, 0, -3], rotation: [0, Math.PI / 3, 0] }
      ],
      cameraPosition: [8, 5, 8],
      ambientLight: 0.8,
      directionalLight: 0.7
    }
  },
  {
    id: 'renovation',
    title: 'Renovation & Upgrade',
    description: 'Modernizing and enhancing the infrastructure to meet new needs.',
    color: '#f97316', // orange-500
    modelData: {
      objects: [
        { type: 'building', scale: 2, position: [0, 0, 0], rotation: [0, 0, 0] },
        { type: 'scaffolding', scale: 1.5, position: [2.5, 0, 0], rotation: [0, 0, 0] },
        { type: 'workers', scale: 1, position: [-2, 0, 2], rotation: [0, Math.PI / 4, 0] },
        { type: 'materials', scale: 1.2, position: [0, 0, 4], rotation: [0, -Math.PI / 6, 0] }
      ],
      cameraPosition: [9, 7, 9],
      ambientLight: 0.7,
      directionalLight: 0.8
    }
  },
  {
    id: 'end-of-life',
    title: 'End-of-Life',
    description: 'Decommissioning or repurposing when the infrastructure is no longer needed.',
    color: '#6b7280', // gray-500
    modelData: {
      objects: [
        { type: 'partial-building', scale: 2, position: [0, 0, 0], rotation: [0, 0, 0] },
        { type: 'heavy-equipment', scale: 1.5, position: [3, 0, 2], rotation: [0, -Math.PI / 3, 0] },
        { type: 'debris', scale: 1.2, position: [-2, 0, -2], rotation: [0, Math.PI / 4, 0] }
      ],
      cameraPosition: [10, 8, 10],
      ambientLight: 0.6,
      directionalLight: 0.7
    }
  }
];

// Component to render the 3D scene
const ThreeDScene: React.FC<{
  stageData: typeof LIFECYCLE_STAGES[0];
  isAnimating: boolean;
}> = ({ stageData, isAnimating }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const frameIdRef = useRef<number>(0);
  const objectsRef = useRef<THREE.Object3D[]>([]);
  
  // Set up the Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Clean up previous scene if it exists
    if (sceneRef.current) {
      cancelAnimationFrame(frameIdRef.current);
      if (rendererRef.current && rendererRef.current.domElement) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      
      // Dispose of all objects in the scene
      sceneRef.current.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        }
      });
    }
    
    // Create a new scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#f8fafc'); // Tailwind slate-50
    sceneRef.current = scene;
    
    // Set up camera
    const aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    camera.position.set(
      stageData.modelData.cameraPosition[0],
      stageData.modelData.cameraPosition[1],
      stageData.modelData.cameraPosition[2]
    );
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;
    
    // Set up renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, stageData.modelData.ambientLight);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(
      0xffffff, 
      stageData.modelData.directionalLight
    );
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    // Add a ground plane
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xe5e7eb, // gray-200
      roughness: 0.8,
      metalness: 0.2,
      side: THREE.DoubleSide
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);
    
    // Add grid helper
    const gridHelper = new THREE.GridHelper(20, 20, 0x888888, 0xcccccc);
    gridHelper.position.y = -0.49;
    scene.add(gridHelper);
    
    // Function to create objects based on type
    const createObject = (type: string, scale: number, position: number[], rotation: number[]) => {
      let object: THREE.Object3D | null = null;
      
      // Create different objects based on type
      switch (type) {
        case 'blueprint':
          // Create a blueprint-like flat object
          const blueprintGeo = new THREE.BoxGeometry(2, 0.1, 3);
          const blueprintMat = new THREE.MeshStandardMaterial({ 
            color: 0x2563eb, // blue-600
            roughness: 0.5,
            metalness: 0.2
          });
          object = new THREE.Mesh(blueprintGeo, blueprintMat);
          break;
          
        case 'building':
          // Create a simple building
          const buildingGroup = new THREE.Group();
          
          // Base/foundation
          const baseGeo = new THREE.BoxGeometry(4, 0.5, 4);
          const baseMat = new THREE.MeshStandardMaterial({ 
            color: 0x9ca3af, // gray-400
            roughness: 0.7,
            metalness: 0.2
          });
          const base = new THREE.Mesh(baseGeo, baseMat);
          base.position.y = -0.25;
          buildingGroup.add(base);
          
          // Main structure
          const mainGeo = new THREE.BoxGeometry(3.5, 3, 3.5);
          const mainMat = new THREE.MeshStandardMaterial({ 
            color: 0xd1d5db, // gray-300
            roughness: 0.6,
            metalness: 0.3
          });
          const main = new THREE.Mesh(mainGeo, mainMat);
          main.position.y = 1.5;
          buildingGroup.add(main);
          
          // Roof
          const roofGeo = new THREE.ConeGeometry(3, 1.5, 4);
          const roofMat = new THREE.MeshStandardMaterial({ 
            color: 0xef4444, // red-500
            roughness: 0.6,
            metalness: 0.2
          });
          const roof = new THREE.Mesh(roofGeo, roofMat);
          roof.position.y = 3.5;
          roof.rotation.y = Math.PI / 4;
          buildingGroup.add(roof);
          
          // Windows
          const windowMat = new THREE.MeshStandardMaterial({ 
            color: 0x3b82f6, // blue-500
            roughness: 0.3,
            metalness: 0.5,
            transparent: true,
            opacity: 0.8
          });
          
          // Front windows
          const frontWindow1 = new THREE.Mesh(
            new THREE.BoxGeometry(0.8, 0.8, 0.1),
            windowMat
          );
          frontWindow1.position.set(-0.8, 1.5, 1.8);
          buildingGroup.add(frontWindow1);
          
          const frontWindow2 = new THREE.Mesh(
            new THREE.BoxGeometry(0.8, 0.8, 0.1),
            windowMat
          );
          frontWindow2.position.set(0.8, 1.5, 1.8);
          buildingGroup.add(frontWindow2);
          
          // Door
          const doorGeo = new THREE.BoxGeometry(1, 1.6, 0.1);
          const doorMat = new THREE.MeshStandardMaterial({ 
            color: 0x78350f, // yellow-900 (brown)
            roughness: 0.5,
            metalness: 0.2
          });
          const door = new THREE.Mesh(doorGeo, doorMat);
          door.position.set(0, 0.8, 1.8);
          buildingGroup.add(door);
          
          object = buildingGroup;
          break;
          
        case 'people':
          // Create simple people representations
          const peopleGroup = new THREE.Group();
          
          // Create 3 people
          const colors = [0x3b82f6, 0x16a34a, 0xef4444]; // blue, green, red
          
          for (let i = 0; i < 3; i++) {
            const personGroup = new THREE.Group();
            
            // Body
            const bodyGeo = new THREE.CapsuleGeometry(0.25, 0.7, 4, 8);
            const bodyMat = new THREE.MeshStandardMaterial({ 
              color: colors[i],
              roughness: 0.7,
              metalness: 0.2
            });
            const body = new THREE.Mesh(bodyGeo, bodyMat);
            body.position.y = 0.6;
            personGroup.add(body);
            
            // Head
            const headGeo = new THREE.SphereGeometry(0.2, 16, 16);
            const headMat = new THREE.MeshStandardMaterial({ 
              color: 0xfcd34d, // yellow-300
              roughness: 0.7,
              metalness: 0.2
            });
            const head = new THREE.Mesh(headGeo, headMat);
            head.position.y = 1.3;
            personGroup.add(head);
            
            // Position each person
            personGroup.position.x = (i - 1) * 0.7;
            
            peopleGroup.add(personGroup);
          }
          
          object = peopleGroup;
          break;
          
        case 'crane':
          // Create a simple crane
          const craneGroup = new THREE.Group();
          
          // Base
          const craneBaseGeo = new THREE.BoxGeometry(2, 0.5, 2);
          const craneBaseMat = new THREE.MeshStandardMaterial({ 
            color: 0xfef3c7, // yellow-100
            roughness: 0.7,
            metalness: 0.3
          });
          const craneBase = new THREE.Mesh(craneBaseGeo, craneBaseMat);
          craneBase.position.y = 0.25;
          craneGroup.add(craneBase);
          
          // Tower
          const craneTowerGeo = new THREE.BoxGeometry(0.6, 6, 0.6);
          const craneTowerMat = new THREE.MeshStandardMaterial({ 
            color: 0xf59e0b, // amber-500
            roughness: 0.6,
            metalness: 0.4
          });
          const craneTower = new THREE.Mesh(craneTowerGeo, craneTowerMat);
          craneTower.position.y = 3.5;
          craneGroup.add(craneTower);
          
          // Arm
          const craneArmGeo = new THREE.BoxGeometry(5, 0.4, 0.4);
          const craneArmMat = new THREE.MeshStandardMaterial({ 
            color: 0xf59e0b, // amber-500
            roughness: 0.6,
            metalness: 0.4
          });
          const craneArm = new THREE.Mesh(craneArmGeo, craneArmMat);
          craneArm.position.set(2, 6.5, 0);
          craneGroup.add(craneArm);
          
          // Counterweight
          const craneCounterweightGeo = new THREE.BoxGeometry(1.5, 0.8, 0.8);
          const craneCounterweightMat = new THREE.MeshStandardMaterial({ 
            color: 0x6b7280, // gray-500
            roughness: 0.8,
            metalness: 0.5
          });
          const craneCounterweight = new THREE.Mesh(craneCounterweightGeo, craneCounterweightMat);
          craneCounterweight.position.set(-1.5, 6.5, 0);
          craneGroup.add(craneCounterweight);
          
          // Cable
          const craneCableGeo = new THREE.CylinderGeometry(0.05, 0.05, 2.5, 8);
          const craneCableMat = new THREE.MeshStandardMaterial({ 
            color: 0x111827, // gray-900
            roughness: 0.6,
            metalness: 0.7
          });
          const craneCable = new THREE.Mesh(craneCableGeo, craneCableMat);
          craneCable.position.set(3.5, 5, 0);
          craneGroup.add(craneCable);
          
          // Hook
          const craneHookGeo = new THREE.SphereGeometry(0.3, 16, 16);
          const craneHookMat = new THREE.MeshStandardMaterial({ 
            color: 0x4b5563, // gray-600
            roughness: 0.5,
            metalness: 0.8
          });
          const craneHook = new THREE.Mesh(craneHookGeo, craneHookMat);
          craneHook.position.set(3.5, 3.5, 0);
          craneGroup.add(craneHook);
          
          object = craneGroup;
          break;
          
        // Default simple cube for any other type
        default:
          const geometry = new THREE.BoxGeometry(1, 1, 1);
          const material = new THREE.MeshStandardMaterial({ 
            color: new THREE.Color(stageData.color),
            roughness: 0.7,
            metalness: 0.3
          });
          object = new THREE.Mesh(geometry, material);
          break;
      }
      
      if (object) {
        // Set position, rotation, and scale
        object.position.set(position[0], position[1], position[2]);
        object.rotation.set(rotation[0], rotation[1], rotation[2]);
        object.scale.set(scale, scale, scale);
        
        // Add shadow casting/receiving
        object.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        // Add to scene and references
        scene.add(object);
        objectsRef.current.push(object);
      }
      
      return object;
    };
    
    // Create all objects for this stage
    objectsRef.current = [];
    stageData.modelData.objects.forEach(obj => {
      createObject(obj.type, obj.scale, obj.position, obj.rotation);
    });
    
    // Set up orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 3;
    controls.maxDistance = 20;
    controls.maxPolarAngle = Math.PI / 2 - 0.1; // Prevent going below ground
    controlsRef.current = controls;
    
    // Animation loop
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);
      
      // Animate objects if needed
      if (isAnimating) {
        objectsRef.current.forEach((obj, index) => {
          obj.rotation.y += 0.002 * (index % 2 === 0 ? 1 : -1);
          
          // Add slight bobbing motion
          if (obj.userData.bobDirection === undefined) {
            obj.userData.bobDirection = index % 2 === 0 ? 1 : -1;
            obj.userData.bobAmount = 0;
          }
          
          obj.userData.bobAmount += 0.01 * obj.userData.bobDirection;
          if (Math.abs(obj.userData.bobAmount) > 0.2) {
            obj.userData.bobDirection *= -1;
          }
          
          obj.position.y += 0.002 * obj.userData.bobDirection;
        });
      }
      
      controls.update();
      renderer.render(scene, camera);
    };
    
    animate();
    
    // Handle window resize
    const handleResize = () => {
      if (containerRef.current && cameraRef.current && rendererRef.current) {
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
        
        rendererRef.current.setSize(width, height);
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameIdRef.current);
      
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, [stageData, isAnimating]);
  
  return (
    <div 
      ref={containerRef} 
      className="w-full h-96 md:h-[400px] rounded-lg overflow-hidden bg-slate-50"
    />
  );
};

// Component to display lifecycle stage info
const LifecycleStageInfo: React.FC<{
  stageData: typeof LIFECYCLE_STAGES[0];
}> = ({ stageData }) => {
  return (
    <Card className="p-4">
      <h3 
        className="text-xl font-bold mb-2 border-b pb-2"
        style={{ borderColor: stageData.color }}
      >
        {stageData.title}
      </h3>
      
      <p className="text-muted-foreground mb-4">
        {stageData.description}
      </p>
      
      <Tabs defaultValue="overview">
        <TabsList className="mb-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="cost">Cost Impact</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>
                {stageData.id === 'operation' 
                  ? 'Longest phase, typically 30+ years'
                  : stageData.id === 'end-of-life'
                    ? 'Final phase, 6-18 months'
                    : `${Math.floor(Math.random() * 20) + 10}% of project timeline`}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <BarChart className="h-4 w-4 text-muted-foreground" />
              <span>
                {stageData.id === 'operation'
                  ? '2-4% of asset value annually'
                  : stageData.id === 'construction'
                    ? 'Highest cost phase, 60-70% of total budget'
                    : stageData.id === 'renovation'
                      ? '30-50% of new construction cost'
                      : `Moderate cost impact`}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span>
                {stageData.id === 'planning'
                  ? 'Sets foundation for entire project'
                  : stageData.id === 'operation'
                    ? 'Maximizes infrastructure value'
                    : stageData.id === 'end-of-life'
                      ? 'Responsible asset retirement'
                      : 'Critical for project success'}
              </span>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="cost">
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Cost Profile</h4>
            <div 
              className="h-2 rounded-full" 
              style={{ 
                background: `linear-gradient(to right, ${stageData.color}22, ${stageData.color})`,
                width: `${stageData.id === 'operation' ? '100' : stageData.id === 'construction' ? '80' : stageData.id === 'planning' ? '30' : '50'}%`
              }}
            />
            
            <p className="text-sm text-muted-foreground">
              {stageData.id === 'planning'
                ? 'Low initial investment, high long-term impact on costs'
                : stageData.id === 'construction'
                  ? 'Highest cost phase, typically 60-70% of project budget'
                  : stageData.id === 'operation'
                    ? 'Ongoing costs over decades, typically 2-3% of asset value annually'
                    : stageData.id === 'renovation'
                      ? 'Periodic large investments, typically 30-50% of initial construction'
                      : 'Moderate costs relative to total project budget'}
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="timeline">
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Timeline Position</h4>
            <div className="w-full bg-muted h-2 rounded-full relative">
              <div 
                className="absolute rounded-full h-4 w-4 top-1/2 -translate-y-1/2"
                style={{ 
                  backgroundColor: stageData.color,
                  left: `${stageData.id === 'planning' ? '10' : 
                         stageData.id === 'approval' ? '25' : 
                         stageData.id === 'construction' ? '40' : 
                         stageData.id === 'commissioning' ? '55' : 
                         stageData.id === 'operation' ? '70' : 
                         stageData.id === 'renovation' ? '85' : '95'}%`
                }}
              />
            </div>
            
            <p className="text-sm text-muted-foreground">
              {stageData.id === 'planning'
                ? 'First phase, typically 10-15% of project timeline'
                : stageData.id === 'construction'
                  ? 'Mid-phase, typically 30-40% of project timeline'
                  : stageData.id === 'operation'
                    ? 'Longest phase, typically 30+ years'
                    : stageData.id === 'end-of-life'
                      ? 'Final phase, typically 5-10% of project timeline'
                      : 'Key phase in the infrastructure lifecycle'}
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

// Main component
const Infrastructure3DLifecycle: React.FC = () => {
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [isAnimating, setIsAnimating] = useState(true);
  const [progress, setProgress] = useState(0);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Current active stage
  const activeStage = LIFECYCLE_STAGES[activeStageIndex];
  
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
  
  // Toggle animation
  const toggleAnimation = () => {
    setIsAnimating(prev => !prev);
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
  
  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h2 className="text-3xl font-bold">Infrastructure 3D Lifecycle</h2>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleAnimation}
            className="flex items-center gap-2"
          >
            {isAnimating ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
            {isAnimating ? 'Pause Animation' : 'Start Animation'}
          </Button>
          
          <Button
            variant={isAutoPlaying ? "secondary" : "default"}
            size="sm"
            onClick={toggleAutoPlay}
            className="flex items-center gap-2"
          >
            {isAutoPlaying ? <PauseCircle className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
            {isAutoPlaying ? 'Stop Auto-Play' : 'Auto-Play Lifecycle'}
          </Button>
        </div>
      </div>
      
      {/* Progress bar and stage indicators */}
      <div className="w-full mb-6">
        <div className="flex justify-between text-xs mb-1">
          {LIFECYCLE_STAGES.map((stage, idx) => (
            <button
              key={stage.id}
              onClick={() => setActiveStageIndex(idx)}
              className={`text-center px-2 py-1 rounded-md transition-colors ${
                idx === activeStageIndex
                  ? 'font-medium'
                  : 'text-muted-foreground'
              }`}
              style={{ 
                color: idx === activeStageIndex ? stage.color : undefined,
                backgroundColor: idx === activeStageIndex ? `${stage.color}10` : undefined
              }}
            >
              {stage.title.split(' ')[0]}
            </button>
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - 3D visualization */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStage.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                <ThreeDScene 
                  stageData={activeStage} 
                  isAnimating={isAnimating} 
                />
              </motion.div>
            </AnimatePresence>
            
            <div className="p-4 flex justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={prevStage}
                disabled={isAutoPlaying}
              >
                Previous Stage
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={nextStage}
                disabled={isAutoPlaying}
              >
                Next Stage
              </Button>
            </div>
          </Card>
        </div>
        
        {/* Right column - Information */}
        <div className="lg:col-span-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStage.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <LifecycleStageInfo stageData={activeStage} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      
      {/* Timeline visualization */}
      <Card className="p-4 mt-6">
        <h3 className="text-xl font-bold mb-4">Infrastructure Lifecycle Timeline</h3>
        
        <div className="relative h-16 mb-4">
          <div className="absolute inset-0 flex">
            {LIFECYCLE_STAGES.map((stage, idx) => {
              // Calculate width based on relative time importance
              const widths = [15, 5, 25, 5, 30, 10, 10]; // Approximate percentages
              
              return (
                <motion.div
                  key={stage.id}
                  initial={{ opacity: 0.7 }}
                  animate={{ 
                    opacity: 1,
                    scale: idx === activeStageIndex ? 1.05 : 1
                  }}
                  className="h-full flex items-center justify-center text-center"
                  style={{
                    width: `${widths[idx]}%`,
                    backgroundColor: `${stage.color}22`,
                    borderLeft: idx > 0 ? `1px dashed ${stage.color}88` : 'none',
                    color: stage.color,
                    fontWeight: idx === activeStageIndex ? 'bold' : 'normal'
                  }}
                >
                  <span className="text-xs">
                    {stage.title.split(' ')[0]}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-2 text-xs text-center text-muted-foreground">
          <div>Planning<br/>(10-15%)</div>
          <div>Approval<br/>(5-10%)</div>
          <div>Construction<br/>(30-40%)</div>
          <div>Commissioning<br/>(5-10%)</div>
          <div>Operation<br/>(30+ years)</div>
          <div>Renovation<br/>(Periodic)</div>
          <div>End-of-Life<br/>(5-10%)</div>
        </div>
      </Card>
    </div>
  );
};

export default Infrastructure3DLifecycle;
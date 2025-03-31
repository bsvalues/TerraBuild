import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

interface BuildingCostCalculationResult {
  baseCost: number;
  adjustedCost?: number;
  totalCost: number;
  regionalFactor?: number;
  buildingTypeFactor?: number;
  complexityAdjustment?: number;
  conditionAdjustment?: number;
  depreciationAdjustment?: number;
  depreciationRate?: number;
  materialCosts?: { [key: string]: number };
  breakdown?: { [key: string]: number };
  error?: string;
}

interface ARViewerProps {
  buildingData: {
    region: string;
    buildingType: string;
    squareFootage: number;
    yearBuilt: number;
    condition: string;
    conditionFactor: number;
    complexityFactor: number;
  };
  calculationResult?: BuildingCostCalculationResult;
}

const ARViewer: React.FC<ARViewerProps> = ({ buildingData, calculationResult }) => {
  const [arSupported, setArSupported] = useState<boolean>(false);
  const [arActive, setArActive] = useState<boolean>(false);
  const sceneRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check if WebXR/AR is supported in the browser
    if (
      'xr' in navigator && 
      'isSessionSupported' in (navigator as any).xr && 
      typeof (navigator as any).xr.isSessionSupported === 'function'
    ) {
      (navigator as any).xr.isSessionSupported('immersive-ar')
        .then((supported: boolean) => {
          setArSupported(supported);
        })
        .catch((error: any) => {
          console.error('AR session support check failed:', error);
          setArSupported(false);
        });
    } else if ('getVRDisplays' in navigator) {
      // Fallback for older WebVR API
      setArSupported(true);
    } else {
      setArSupported(false);
    }
  }, []);

  const initializeAR = () => {
    if (!arSupported) {
      toast({
        title: "AR Not Supported",
        description: "Your device or browser doesn't support AR features.",
        variant: "destructive"
      });
      return;
    }

    if (!calculationResult) {
      toast({
        title: "No Building Data",
        description: "Please complete a building cost calculation first.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Initialize A-Frame scene
      if (sceneRef.current && typeof window !== 'undefined') {
        import('aframe').then(() => {
          // Dynamically import AR.js after A-Frame is loaded
          import('ar.js').then(() => {
            setupARScene();
          });
        });
      }
    } catch (error) {
      console.error("Error initializing AR:", error);
      toast({
        title: "AR Initialization Failed",
        description: "There was an error starting the AR experience.",
        variant: "destructive"
      });
    }
  };

  const setupARScene = () => {
    if (!sceneRef.current) return;
    
    // Clear existing content
    sceneRef.current.innerHTML = '';
    
    // Create A-Frame scene
    const scene = document.createElement('a-scene');
    scene.setAttribute('embedded', '');
    scene.setAttribute('arjs', 'sourceType: webcam; debugUIEnabled: false;');
    
    // Create camera
    const camera = document.createElement('a-entity');
    camera.setAttribute('camera', '');
    camera.setAttribute('look-controls', '');
    scene.appendChild(camera);
    
    // Create marker
    const marker = document.createElement('a-marker');
    marker.setAttribute('preset', 'hiro');
    
    // Create building visualization based on building type and cost
    createBuildingVisualization(marker);
    
    // Create cost text
    if (calculationResult) {
      const costText = document.createElement('a-text');
      costText.setAttribute('value', `$${calculationResult.totalCost.toLocaleString()}`);
      costText.setAttribute('position', '0 2 0');
      costText.setAttribute('align', 'center');
      costText.setAttribute('color', '#4CAF50');
      costText.setAttribute('scale', '2 2 2');
      marker.appendChild(costText);
    }
    
    scene.appendChild(marker);
    
    // Add scene to the DOM
    sceneRef.current.appendChild(scene);
    setArActive(true);
  };

  const createBuildingVisualization = (parent: HTMLElement) => {
    if (!calculationResult || !buildingData) return;
    
    // Calculate building dimensions based on square footage
    // Assuming a square building for simplicity
    const sideLength = Math.sqrt(buildingData.squareFootage) / 10; // Scale down for AR
    const height = sideLength * 0.7; // Approximate height
    
    // Base building
    const building = document.createElement('a-box');
    building.setAttribute('position', `0 ${height/2} 0`);
    building.setAttribute('width', `${sideLength}`);
    building.setAttribute('height', `${height}`);
    building.setAttribute('depth', `${sideLength}`);
    
    // Color based on building condition
    let color = '#4CAF50'; // Good condition (green)
    if (buildingData.conditionFactor < 0.7) {
      color = '#FFC107'; // Fair condition (yellow)
    }
    if (buildingData.conditionFactor < 0.4) {
      color = '#F44336'; // Poor condition (red)
    }
    
    building.setAttribute('color', color);
    building.setAttribute('opacity', '0.9');
    
    // Add roof based on complexity
    if (buildingData.complexityFactor > 0.7) {
      // Complex roof (pyramid)
      const roof = document.createElement('a-cone');
      roof.setAttribute('position', `0 ${height + 0.2} 0`);
      roof.setAttribute('radius-bottom', `${sideLength * 0.7}`);
      roof.setAttribute('radius-top', '0');
      roof.setAttribute('height', `${sideLength * 0.5}`);
      roof.setAttribute('color', '#795548');
      parent.appendChild(roof);
    } else {
      // Simple roof (flat)
      const roof = document.createElement('a-box');
      roof.setAttribute('position', `0 ${height + 0.1} 0`);
      roof.setAttribute('width', `${sideLength * 1.1}`);
      roof.setAttribute('height', '0.1');
      roof.setAttribute('depth', `${sideLength * 1.1}`);
      roof.setAttribute('color', '#795548');
      parent.appendChild(roof);
    }
    
    // Add building to parent
    parent.appendChild(building);
    
    // Add cost indicator (vertical bar)
    const costScale = Math.min(Math.max(calculationResult.totalCost / 10000, 0.5), 5);
    const costIndicator = document.createElement('a-cylinder');
    costIndicator.setAttribute('position', `${sideLength * 0.75} ${costScale/2} ${sideLength * 0.75}`);
    costIndicator.setAttribute('radius', '0.1');
    costIndicator.setAttribute('height', `${costScale}`);
    costIndicator.setAttribute('color', '#2196F3');
    
    parent.appendChild(costIndicator);
  };

  const exitAR = () => {
    if (sceneRef.current) {
      sceneRef.current.innerHTML = '';
    }
    setArActive(false);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Building AR Visualizer</CardTitle>
        <CardDescription>
          Visualize building cost estimates in augmented reality
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!arSupported && (
          <Alert className="mb-4">
            <AlertTitle>AR Not Supported</AlertTitle>
            <AlertDescription>
              Your device or browser doesn't support AR features. Try using a compatible mobile device with the latest Chrome, Safari, or Firefox.
            </AlertDescription>
          </Alert>
        )}
        
        <div 
          ref={sceneRef} 
          className="ar-scene relative w-full bg-gray-100 rounded-md"
          style={{ minHeight: '400px' }}
        >
          {!arActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-center mb-4 text-gray-600">
                {arSupported 
                  ? "Start AR to visualize your building cost estimate in your environment"
                  : "AR visualization is not supported on your device"}
              </p>
              <img 
                src="/ar-marker-instructions.svg" 
                alt="AR Marker Instructions" 
                className="w-64 h-64 mb-4 opacity-60" 
              />
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {!arActive ? (
          <Button 
            onClick={initializeAR} 
            disabled={!arSupported || !calculationResult}
          >
            Start AR Visualization
          </Button>
        ) : (
          <Button variant="destructive" onClick={exitAR}>
            Exit AR
          </Button>
        )}
        <Button 
          variant="outline" 
          onClick={() => window.open('https://jeromeetienne.github.io/AR.js/data/images/HIRO.jpg', '_blank')}
        >
          Get AR Marker
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ARViewer;
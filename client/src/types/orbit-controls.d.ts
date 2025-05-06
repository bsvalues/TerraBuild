// Type declaration for 'three/examples/jsm/controls/OrbitControls'
declare module 'three/examples/jsm/controls/OrbitControls.js' {
  import { Camera, EventDispatcher, Vector3 } from 'three';

  export class OrbitControls extends EventDispatcher {
    constructor(camera: Camera, domElement?: HTMLElement);
    
    enabled: boolean;
    target: Vector3;
    
    minDistance: number;
    maxDistance: number;
    
    minZoom: number;
    maxZoom: number;
    
    minPolarAngle: number;
    maxPolarAngle: number;
    
    minAzimuthAngle: number;
    maxAzimuthAngle: number;
    
    enableDamping: boolean;
    dampingFactor: number;
    
    enableZoom: boolean;
    zoomSpeed: number;
    
    enableRotate: boolean;
    rotateSpeed: number;
    
    enablePan: boolean;
    panSpeed: number;
    screenSpacePanning: boolean;
    keyPanSpeed: number;
    
    autoRotate: boolean;
    autoRotateSpeed: number;
    
    enableKeys: boolean;
    
    update(): boolean;
    
    dispose(): void;
    
    getPolarAngle(): number;
    
    getAzimuthalAngle(): number;
    
    saveState(): void;
    
    reset(): void;
  }
}
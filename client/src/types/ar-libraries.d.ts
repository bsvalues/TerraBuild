/**
 * Type declarations for AR.js and A-Frame libraries
 */

declare module 'ar.js' {
  const ARjs: any;
  export default ARjs;
}

declare module 'aframe' {
  const AFRAME: any;
  export default AFRAME;
}

declare module 'aframe-react' {
  import * as React from 'react';
  
  export interface SceneProps {
    embedded?: boolean;
    arjs?: string;
    [key: string]: any;
  }
  
  export interface EntityProps {
    position?: string;
    rotation?: string;
    scale?: string;
    color?: string;
    'look-controls'?: string | boolean;
    camera?: string | boolean;
    [key: string]: any;
  }
  
  export class Scene extends React.Component<SceneProps> {}
  export class Entity extends React.Component<EntityProps> {}
}
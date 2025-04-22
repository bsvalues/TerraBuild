import React from 'react';

interface TerraBuildLogoProps {
  variant?: "default" | "app" | "seal" | "square";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  sm: 48,
  md: 96,
  lg: 144,
  xl: 192,
};

export function TerraBuildLogo({ 
  variant = "default", 
  size = "md", 
  className = "" 
}: TerraBuildLogoProps) {
  const dimensions = sizeMap[size];
  
  return (
    <div className={`relative ${className}`} style={{ width: dimensions, height: dimensions }}>
      <img
        src="@assets/terrabuild-logo.png"
        alt="TerraBuild Logo"
        width={dimensions}
        height={dimensions}
        className="object-contain"
      />
    </div>
  );
}

export default TerraBuildLogo;
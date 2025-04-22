import React from 'react';

type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface TerraBuildLogoProps {
  size?: LogoSize;
  className?: string;
}

const sizeToClassName: Record<LogoSize, string> = {
  xs: 'w-4 h-4',
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24'
};

export function TerraBuildLogo({ size = 'md', className = '' }: TerraBuildLogoProps) {
  const sizeClass = sizeToClassName[size];
  
  return (
    <div className={`${sizeClass} ${className} relative`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Background Circle */}
        <circle cx="50" cy="50" r="48" fill="#001529" stroke="#00e5ff" strokeWidth="4" />
        
        {/* T Shape */}
        <path
          d="M32 30H68V38H56V70H44V38H32V30Z"
          fill="#00e5ff"
        />
        
        {/* Building Icons */}
        <path
          d="M30 60H40V72H30V60Z"
          fill="#ffffff"
          opacity="0.7"
        />
        <path
          d="M45 50H55V72H45V50Z"
          fill="#ffffff"
          opacity="0.7"
        />
        <path
          d="M60 55H70V72H60V55Z"
          fill="#ffffff"
          opacity="0.7"
        />
        
        {/* Grid Line */}
        <line x1="25" y1="72" x2="75" y2="72" stroke="#ffffff" strokeWidth="2" opacity="0.5" />
      </svg>
      
      {/* Pulse Effect */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 rounded-full animate-pulse bg-cyan-300 opacity-20"></div>
      </div>
    </div>
  );
}

export default TerraBuildLogo;
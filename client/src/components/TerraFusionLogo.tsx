import React from 'react';

interface TerraFusionLogoProps {
  variant?: 'default' | 'circular' | 'square' | 'text-only';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export default function TerraFusionLogo({
  variant = 'default',
  size = 'md',
  className = ''
}: TerraFusionLogoProps) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-4xl'
  };

  const sizeClass = sizes[size];
  const textSizeClass = textSizes[size];

  // Text-only version
  if (variant === 'text-only') {
    return (
      <div className={`font-bold ${textSizeClass} text-white ${className}`}>
        TerraFusion
      </div>
    );
  }

  // Circular logo version
  if (variant === 'circular') {
    return (
      <div className={`relative ${sizeClass} ${className}`}>
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-900 to-cyan-900 border border-blue-400/20 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400/20 to-purple-500/20 opacity-70"></div>
          <div className="text-cyan-400 font-bold transform -translate-y-0.5 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]">
            TF
          </div>
        </div>
      </div>
    );
  }

  // Square logo version
  if (variant === 'square') {
    return (
      <div className={`relative ${sizeClass} ${className}`}>
        <div className="absolute inset-0 rounded-xl bg-[#041E34] border border-blue-400/30 flex items-center justify-center overflow-hidden shadow-lg">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/10"></div>
          <div className="text-cyan-400 font-bold transform drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]">
            TF
          </div>
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-500/5 to-blue-600/5 border border-cyan-400/10"></div>
          <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-cyan-500/0 via-cyan-500/30 to-cyan-500/0 opacity-50 blur-sm"></div>
        </div>
      </div>
    );
  }

  // Default logo with 3D effect
  return (
    <div className={`flex items-center ${className}`}>
      <div className={`relative ${sizeClass}`}>
        <div className="absolute inset-0 rounded-xl bg-[#041E34] border border-blue-400/30 flex items-center justify-center overflow-hidden shadow-[0_0_15px_rgba(6,182,212,0.3)]">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/10"></div>
          <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-cyan-500/0 via-cyan-500/30 to-cyan-500/0 opacity-50 blur-sm"></div>
          
          {/* The TF letters with 3D effect */}
          <div className="relative transform text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-blue-500 font-bold text-xl">
            <span className="absolute -left-0.5 -top-0.5 text-cyan-600/50 blur-[0.5px]">TF</span>
            <span className="relative z-10">TF</span>
            <span className="absolute -right-0.5 -bottom-0.5 text-cyan-300/30 blur-[0.5px]">TF</span>
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400/10 to-cyan-400/50 blur-sm opacity-70"></div>
          </div>
        </div>
      </div>
      
      {/* Only show text for bigger sizes */}
      {(size === 'lg' || size === 'xl') && (
        <span className={`ml-3 font-bold ${textSizeClass} text-gradient-to-r from-white to-cyan-200`}>
          TerraFusion
        </span>
      )}
    </div>
  );
}
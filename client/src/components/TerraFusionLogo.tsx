import React from 'react';
import { cn } from '@/lib/utils';

type LogoVariant = 'default' | 'circular' | 'minimal' | 'text-only';
type LogoSize = 'sm' | 'md' | 'lg' | 'xl';

interface TerraFusionLogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  className?: string;
}

const sizeMap = {
  sm: {
    container: 'h-7',
    icon: 'h-5 w-5',
    text: 'text-sm'
  },
  md: {
    container: 'h-9',
    icon: 'h-7 w-7',
    text: 'text-base'
  },
  lg: {
    container: 'h-12',
    icon: 'h-9 w-9',
    text: 'text-lg'
  },
  xl: {
    container: 'h-16',
    icon: 'h-12 w-12',
    text: 'text-xl'
  }
};

const TerraFusionLogo: React.FC<TerraFusionLogoProps> = ({
  variant = 'default',
  size = 'md',
  className
}) => {
  const { container, icon, text } = sizeMap[size];

  if (variant === 'circular') {
    return (
      <div className={cn('flex items-center justify-center', className)}>
        <div className={cn(
          'rounded-full p-1 flex items-center justify-center bg-gradient-to-br from-cyan-400 to-blue-600 shadow-glow',
          icon
        )}>
          <svg 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="h-full w-full"
          >
            <path 
              d="M12 2L2 7L12 12L22 7L12 2Z" 
              fill="currentColor" 
              className="text-blue-950"
            />
            <path 
              d="M2 17L12 22L22 17" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="text-cyan-200" 
            />
            <path 
              d="M2 12L12 17L22 12" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="text-cyan-300" 
            />
          </svg>
        </div>
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center', className)}>
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className={cn(icon, 'text-cyan-400')}
        >
          <path 
            d="M12 2L2 7L12 12L22 7L12 2Z" 
            fill="currentColor" 
          />
          <path 
            d="M2 17L12 22L22 17" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          <path 
            d="M2 12L12 17L22 12" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
        </svg>
      </div>
    );
  }

  if (variant === 'text-only') {
    return (
      <div className={cn('flex items-center', container, className)}>
        <span className={cn('font-bold tracking-tight bg-gradient-to-br from-cyan-300 to-blue-500 bg-clip-text text-transparent', text)}>
          TerraFusion
        </span>
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn('flex items-center gap-2.5', container, className)}>
      <div className="relative">
        <div className="absolute inset-0 rounded-md blur-sm bg-cyan-400/60"></div>
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className={cn(icon, 'relative z-10')}
        >
          <path 
            d="M12 2L2 7L12 12L22 7L12 2Z" 
            fill="#0EA5E9" 
          />
          <path 
            d="M2 17L12 22L22 17" 
            stroke="#0EA5E9" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          <path 
            d="M2 12L12 17L22 12" 
            stroke="#22D3EE" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
        </svg>
      </div>
      <span className={cn('font-bold tracking-tight bg-gradient-to-br from-cyan-300 to-blue-500 bg-clip-text text-transparent', text)}>
        TerraFusion
      </span>
    </div>
  );
};

export default TerraFusionLogo;
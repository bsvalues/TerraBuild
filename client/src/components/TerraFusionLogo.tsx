import React from 'react';
import { cn } from '@/lib/utils';

type LogoVariant = 'default' | 'circular' | 'minimal' | 'text-only' | 'with-text';
type LogoSize = 'sm' | 'md' | 'lg' | 'xl';

interface TerraFusionLogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  className?: string;
  textContent?: string;
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
  className,
  textContent = 'TerraFusion'
}) => {
  const { container, icon, text } = sizeMap[size];

  if (variant === 'circular') {
    return (
      <div className={cn('flex items-center justify-center', className)}>
        <svg 
          viewBox="0 0 120 120" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className={cn(icon, 'relative z-10')}
        >
          <defs>
            <linearGradient id="tfCircularGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{stopColor:'#1DD1A1', stopOpacity:1}} />
              <stop offset="100%" style={{stopColor:'#0891B2', stopOpacity:1}} />
            </linearGradient>
          </defs>
          
          {/* Circular background with teal gradient */}
          <circle cx="60" cy="60" r="50" fill="url(#tfCircularGradient)"/>
          
          {/* TF Logo in clean white */}
          <g transform="translate(30, 30)">
            {/* T */}
            <path d="M10 15 L50 15 L50 25 L35 25 L35 55 L25 55 L25 25 L10 25 Z" fill="white"/>
            {/* F */}
            <path d="M60 15 L60 55 L50 55 L50 15 L80 15 L80 25 L60 25 L60 30 L75 30 L75 40 L60 40 Z" fill="white"/>
          </g>
        </svg>
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
        <span className={cn('font-bold tracking-tight text-slate-800 dark:text-slate-100', text)}>
          {textContent}
        </span>
      </div>
    );
  }
  
  if (variant === 'with-text') {
    return (
      <div className={cn('flex items-center gap-2.5', container, className)}>
        <div className="relative flex-shrink-0">
          <svg 
            viewBox="0 0 120 120" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className={cn(icon, 'relative z-10')}
          >
            <defs>
              <linearGradient id="tfWithTextGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{stopColor:'#1DD1A1', stopOpacity:1}} />
                <stop offset="100%" style={{stopColor:'#0891B2', stopOpacity:1}} />
              </linearGradient>
            </defs>
            
            {/* Rounded square background with teal gradient */}
            <rect x="10" y="10" width="100" height="100" rx="20" ry="20" fill="url(#tfWithTextGradient)"/>
            
            {/* TF Logo in clean white */}
            <g transform="translate(25, 25)">
              {/* T */}
              <path d="M10 15 L50 15 L50 25 L35 25 L35 55 L25 55 L25 25 L10 25 Z" fill="white"/>
              {/* F */}
              <path d="M60 15 L60 55 L50 55 L50 15 L80 15 L80 25 L60 25 L60 30 L75 30 L75 40 L60 40 Z" fill="white"/>
            </g>
          </svg>
        </div>
        <span className={cn('font-bold tracking-tight text-slate-800 dark:text-slate-100', text)}>
          {textContent}
        </span>
      </div>
    );
  }

  // Default variant - matches exact TerraFusion design
  return (
    <div className={cn('flex items-center gap-2.5', container, className)}>
      <div className="relative">
        <svg 
          viewBox="0 0 120 120" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className={cn(icon, 'relative z-10')}
        >
          <defs>
            <linearGradient id="tfGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{stopColor:'#1DD1A1', stopOpacity:1}} />
              <stop offset="100%" style={{stopColor:'#0891B2', stopOpacity:1}} />
            </linearGradient>
          </defs>
          
          {/* Rounded square background with teal gradient */}
          <rect x="10" y="10" width="100" height="100" rx="20" ry="20" fill="url(#tfGradient)"/>
          
          {/* TF Logo in clean white */}
          <g transform="translate(25, 25)">
            {/* T */}
            <path d="M10 15 L50 15 L50 25 L35 25 L35 55 L25 55 L25 25 L10 25 Z" fill="white"/>
            {/* F */}
            <path d="M60 15 L60 55 L50 55 L50 15 L80 15 L80 25 L60 25 L60 30 L75 30 L75 40 L60 40 Z" fill="white"/>
          </g>
        </svg>
      </div>
      <span className={cn('font-bold tracking-tight text-slate-800 dark:text-slate-100', text)}>
        {textContent}
      </span>
    </div>
  );
};

export default TerraFusionLogo;
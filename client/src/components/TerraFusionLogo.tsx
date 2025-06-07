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
            <linearGradient id="tfNewMainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{stopColor:'#00e5ff', stopOpacity:1}} />
              <stop offset="50%" style={{stopColor:'#00bcd4', stopOpacity:1}} />
              <stop offset="100%" style={{stopColor:'#0097a7', stopOpacity:1}} />
            </linearGradient>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Rounded square container with dark background */}
          <rect x="10" y="10" width="100" height="100" rx="20" ry="20" 
                fill="#0a1f2e" stroke="url(#tfNewMainGradient)" strokeWidth="2"/>
          
          {/* Topographic contour lines */}
          <path d="M20 30 Q40 25 60 30 Q80 35 100 30" 
                stroke="#00e5ff" strokeWidth="0.8" opacity="0.3" fill="none"/>
          <path d="M20 40 Q40 35 60 40 Q80 45 100 40" 
                stroke="#00e5ff" strokeWidth="0.8" opacity="0.4" fill="none"/>
          <path d="M20 50 Q40 45 60 50 Q80 55 100 50" 
                stroke="#00e5ff" strokeWidth="0.8" opacity="0.5" fill="none"/>
          <path d="M20 70 Q40 65 60 70 Q80 75 100 70" 
                stroke="#00e5ff" strokeWidth="0.8" opacity="0.3" fill="none"/>
          <path d="M20 80 Q40 75 60 80 Q80 85 100 80" 
                stroke="#00e5ff" strokeWidth="0.8" opacity="0.4" fill="none"/>
          
          {/* Modern TF monogram */}
          <g transform="translate(30, 35)" filter="url(#glow)">
            {/* T letter */}
            <path d="M5 10 L35 10 L35 18 L23 18 L23 50 L17 50 L17 18 L5 18 Z" 
                  fill="url(#tfNewMainGradient)"/>
            {/* F letter */}
            <path d="M40 10 L40 50 L34 50 L34 10 L60 10 L60 18 L40 18 L40 25 L55 25 L55 33 L40 33 Z" 
                  fill="url(#tfNewMainGradient)"/>
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
        <span className={cn('font-bold tracking-tight text-cyan-800 dark:text-cyan-100', text)}>
          {textContent}
        </span>
      </div>
    );
  }
  
  if (variant === 'with-text') {
    return (
      <div className={cn('flex items-center gap-3', container, className)}>
        <div className="relative flex-shrink-0">
          <svg 
            viewBox="0 0 160 160" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className={cn(icon, 'relative z-10')}
          >
            <defs>
              <linearGradient id="tfWithTextMainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{stopColor:'#2DD4BF', stopOpacity:1}} />
                <stop offset="50%" style={{stopColor:'#0891B2', stopOpacity:1}} />
                <stop offset="100%" style={{stopColor:'#164E63', stopOpacity:1}} />
              </linearGradient>
              <linearGradient id="tfWithTextLetterGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{stopColor:'#083344', stopOpacity:1}} />
                <stop offset="100%" style={{stopColor:'#164E63', stopOpacity:1}} />
              </linearGradient>
            </defs>
            
            {/* Rounded square with 3D effect */}
            <rect x="10" y="10" width="140" height="140" rx="28" ry="28" fill="url(#tfWithTextMainGradient)" stroke="#164E63" strokeWidth="2"/>
            <rect x="10" y="10" width="140" height="35" rx="28" ry="28" fill="#5EEAD4" opacity="0.4"/>
            <rect x="10" y="115" width="140" height="35" rx="28" ry="28" fill="#083344" opacity="0.3"/>
            
            {/* TF Letters with 3D beveled effect */}
            <g transform="translate(25, 25)">
              <g>
                <path d="M8 15 L58 15 L58 28 L40 28 L40 85 L26 85 L26 28 L8 28 Z" fill="url(#tfWithTextLetterGradient)"/>
                <path d="M8 15 L58 15 L58 21 L8 21 Z" fill="#5EEAD4" opacity="0.6"/>
                <path d="M26 28 L32 28 L32 85 L26 85 Z" fill="#5EEAD4" opacity="0.4"/>
              </g>
              <g>
                <path d="M68 15 L68 85 L56 85 L56 15 L102 15 L102 28 L68 28 L68 38 L92 38 L92 51 L68 51 Z" fill="url(#tfWithTextLetterGradient)"/>
                <path d="M68 15 L102 15 L102 21 L68 21 Z" fill="#5EEAD4" opacity="0.6"/>
                <path d="M68 38 L92 38 L92 44 L68 44 Z" fill="#5EEAD4" opacity="0.4"/>
                <path d="M56 15 L62 15 L62 85 L56 85 Z" fill="#5EEAD4" opacity="0.4"/>
              </g>
            </g>
          </svg>
        </div>
        <span className={cn('font-bold tracking-tight text-cyan-800 dark:text-cyan-100', text)}>
          {textContent}
        </span>
      </div>
    );
  }

  // Default variant - new TerraFusion design with contour lines and modern styling
  return (
    <div className={cn('flex items-center gap-3', container, className)}>
      <div className="relative">
        <svg 
          viewBox="0 0 120 120" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className={cn(icon, 'relative z-10')}
        >
          <defs>
            <linearGradient id="tfDefaultMainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{stopColor:'#00e5ff', stopOpacity:1}} />
              <stop offset="50%" style={{stopColor:'#00bcd4', stopOpacity:1}} />
              <stop offset="100%" style={{stopColor:'#0097a7', stopOpacity:1}} />
            </linearGradient>
            <filter id="defaultGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Dark rounded square container */}
          <rect x="10" y="10" width="100" height="100" rx="20" ry="20" 
                fill="#0a1f2e" stroke="url(#tfDefaultMainGradient)" strokeWidth="2"/>
          
          {/* Topographic contour lines background */}
          <g opacity="0.4">
            <path d="M20 25 Q40 20 60 25 Q80 30 100 25" 
                  stroke="#00e5ff" strokeWidth="1" fill="none"/>
            <path d="M20 35 Q40 30 60 35 Q80 40 100 35" 
                  stroke="#00e5ff" strokeWidth="1" fill="none"/>
            <path d="M20 45 Q40 40 60 45 Q80 50 100 45" 
                  stroke="#00e5ff" strokeWidth="1" fill="none"/>
            <path d="M20 55 Q40 50 60 55 Q80 60 100 55" 
                  stroke="#00e5ff" strokeWidth="1" fill="none"/>
            <path d="M20 65 Q40 60 60 65 Q80 70 100 65" 
                  stroke="#00e5ff" strokeWidth="1" fill="none"/>
            <path d="M20 75 Q40 70 60 75 Q80 80 100 75" 
                  stroke="#00e5ff" strokeWidth="1" fill="none"/>
            <path d="M20 85 Q40 80 60 85 Q80 90 100 85" 
                  stroke="#00e5ff" strokeWidth="1" fill="none"/>
            <path d="M20 95 Q40 90 60 95 Q80 100 100 95" 
                  stroke="#00e5ff" strokeWidth="1" fill="none"/>
          </g>
          
          {/* Modern TF monogram */}
          <g transform="translate(25, 30)" filter="url(#defaultGlow)">
            {/* T letter - cleaner, modern design */}
            <path d="M8 15 L42 15 L42 25 L30 25 L30 60 L20 60 L20 25 L8 25 Z" 
                  fill="url(#tfDefaultMainGradient)" strokeWidth="1" stroke="#00e5ff"/>
            {/* F letter - cleaner, modern design */}
            <path d="M50 15 L50 60 L40 60 L40 15 L70 15 L70 25 L50 25 L50 32 L65 32 L65 42 L50 42 Z" 
                  fill="url(#tfDefaultMainGradient)" strokeWidth="1" stroke="#00e5ff"/>
          </g>
        </svg>
      </div>
      <div className="flex flex-col">
        <span className={cn('font-bold tracking-tight text-slate-100', text)}>
          {textContent}
        </span>
        <span className={cn('text-cyan-400 font-medium', size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : size === 'lg' ? 'text-base' : 'text-lg')}>
          AI That Understands Land
        </span>
      </div>
    </div>
  );
};

export default TerraFusionLogo;
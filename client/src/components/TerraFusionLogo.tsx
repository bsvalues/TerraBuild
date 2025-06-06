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
          viewBox="0 0 200 200" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className={cn(icon, 'relative z-10')}
        >
          <defs>
            <linearGradient id="tfCircularMainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{stopColor:'#2DD4BF', stopOpacity:1}} />
              <stop offset="50%" style={{stopColor:'#0891B2', stopOpacity:1}} />
              <stop offset="100%" style={{stopColor:'#164E63', stopOpacity:1}} />
            </linearGradient>
            <linearGradient id="tfCircularLetterGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{stopColor:'#083344', stopOpacity:1}} />
              <stop offset="100%" style={{stopColor:'#164E63', stopOpacity:1}} />
            </linearGradient>
          </defs>
          
          {/* Circular background with 3D effect */}
          <circle cx="100" cy="100" r="80" fill="url(#tfCircularMainGradient)" stroke="#164E63" strokeWidth="2"/>
          <circle cx="100" cy="100" r="80" fill="url(#tfCircularMainGradient)" opacity="0.8"/>
          
          {/* Top circular highlight */}
          <path d="M 20 100 A 80 80 0 0 1 180 100 A 70 70 0 0 0 30 100 Z" fill="#5EEAD4" opacity="0.4"/>
          
          {/* TF Letters with 3D beveled effect */}
          <g transform="translate(50, 50)">
            <g>
              <path d="M10 20 L60 20 L60 32 L42 32 L42 80 L28 80 L28 32 L10 32 Z" fill="url(#tfCircularLetterGradient)"/>
              <path d="M10 20 L60 20 L60 26 L10 26 Z" fill="#5EEAD4" opacity="0.6"/>
              <path d="M28 32 L34 32 L34 80 L28 80 Z" fill="#5EEAD4" opacity="0.4"/>
            </g>
            <g>
              <path d="M70 20 L70 80 L58 80 L58 20 L100 20 L100 32 L70 32 L70 40 L90 40 L90 52 L70 52 Z" fill="url(#tfCircularLetterGradient)"/>
              <path d="M70 20 L100 20 L100 26 L70 26 Z" fill="#5EEAD4" opacity="0.6"/>
              <path d="M70 40 L90 40 L90 46 L70 46 Z" fill="#5EEAD4" opacity="0.4"/>
              <path d="M58 20 L64 20 L64 80 L58 80 Z" fill="#5EEAD4" opacity="0.4"/>
            </g>
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
        <span className="font-bold tracking-tight dark:text-slate-100 text-sm text-[#a0ffff]">
          {textContent}
        </span>
      </div>
    );
  }

  // Default variant - matches exact TerraFusion design with 3D beveled effect
  return (
    <div className={cn('flex items-center gap-2.5', container, className)}>
      <div className="relative">
        <svg 
          viewBox="0 0 200 200" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className={cn(icon, 'relative z-10')}
        >
          <defs>
            {/* Main gradient for face */}
            <linearGradient id="tfMainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{stopColor:'#2DD4BF', stopOpacity:1}} />
              <stop offset="50%" style={{stopColor:'#0891B2', stopOpacity:1}} />
              <stop offset="100%" style={{stopColor:'#164E63', stopOpacity:1}} />
            </linearGradient>
            
            {/* Top bevel highlight */}
            <linearGradient id="tfTopBevel" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{stopColor:'#5EEAD4', stopOpacity:0.8}} />
              <stop offset="100%" style={{stopColor:'#2DD4BF', stopOpacity:0.2}} />
            </linearGradient>
            
            {/* Bottom shadow */}
            <linearGradient id="tfBottomShadow" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{stopColor:'#083344', stopOpacity:0.3}} />
              <stop offset="100%" style={{stopColor:'#0C4A6E', stopOpacity:0.8}} />
            </linearGradient>
            
            {/* Letter gradient */}
            <linearGradient id="tfLetterGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{stopColor:'#083344', stopOpacity:1}} />
              <stop offset="100%" style={{stopColor:'#164E63', stopOpacity:1}} />
            </linearGradient>
          </defs>
          
          {/* Outer rounded square with 3D effect */}
          <rect x="20" y="20" width="160" height="160" rx="35" ry="35" fill="url(#tfMainGradient)" stroke="#164E63" strokeWidth="2"/>
          
          {/* Top bevel highlight */}
          <rect x="20" y="20" width="160" height="40" rx="35" ry="35" fill="url(#tfTopBevel)" opacity="0.6"/>
          
          {/* Bottom shadow */}
          <rect x="20" y="140" width="160" height="40" rx="35" ry="35" fill="url(#tfBottomShadow)" opacity="0.4"/>
          
          {/* TF Letters with 3D beveled effect */}
          <g transform="translate(40, 40)">
            {/* T Letter */}
            <g>
              {/* T Main body */}
              <path d="M10 20 L70 20 L70 35 L50 35 L50 100 L30 100 L30 35 L10 35 Z" fill="url(#tfLetterGradient)"/>
              {/* T Top highlight */}
              <path d="M10 20 L70 20 L70 28 L10 28 Z" fill="#5EEAD4" opacity="0.6"/>
              {/* T Vertical highlight */}
              <path d="M30 35 L38 35 L38 100 L30 100 Z" fill="#5EEAD4" opacity="0.4"/>
            </g>
            
            {/* F Letter */}
            <g>
              {/* F Main body */}
              <path d="M80 20 L80 100 L65 100 L65 20 L120 20 L120 35 L80 35 L80 45 L110 45 L110 60 L80 60 Z" fill="url(#tfLetterGradient)"/>
              {/* F Top highlight */}
              <path d="M80 20 L120 20 L120 28 L80 28 Z" fill="#5EEAD4" opacity="0.6"/>
              {/* F Middle highlight */}
              <path d="M80 45 L110 45 L110 53 L80 53 Z" fill="#5EEAD4" opacity="0.4"/>
              {/* F Vertical highlight */}
              <path d="M65 20 L73 20 L73 100 L65 100 Z" fill="#5EEAD4" opacity="0.4"/>
            </g>
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
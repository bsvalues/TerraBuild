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
        <img 
          src="/assets/terrafusion-logo.png" 
          alt="TerraFusion Logo" 
          className={cn(icon, 'object-contain')}
        />
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

  // Default variant - uses your actual TerraFusion logo image
  return (
    <div className={cn('flex items-center gap-3', container, className)}>
      <div className="relative">
        <img 
          src="/assets/terrafusion-logo.png" 
          alt="TerraFusion Logo" 
          className={cn(icon, 'object-contain')}
        />
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
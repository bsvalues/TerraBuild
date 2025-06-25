import React from 'react';
import { cn } from '@/lib/utils';

interface TerraLogoProps {
  variant?: 'primary' | 'circular' | 'outline' | 'minimal' | 'dark' | '3d';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  className?: string;
  animate?: boolean;
}

const sizeMap = {
  sm: 'w-8 h-8 text-lg',
  md: 'w-12 h-12 text-xl',
  lg: 'w-16 h-16 text-2xl',
  xl: 'w-20 h-20 text-3xl',
  hero: 'w-32 h-32 text-5xl'
};

const variantMap = {
  primary: 'bg-gradient-to-br from-[var(--tf-quantum-teal)] via-[var(--tf-accent-cyan)] to-[var(--tf-cosmic-blue)] text-[var(--tf-deep-space)] shadow-[var(--tf-glow-strong)]',
  circular: 'bg-gradient-to-br from-[var(--tf-quantum-teal)] via-[var(--tf-accent-cyan)] to-[var(--tf-cosmic-blue)] text-[var(--tf-deep-space)] rounded-full shadow-[var(--tf-glow-strong)]',
  outline: 'bg-transparent border-2 border-[var(--tf-quantum-teal)] text-[var(--tf-quantum-teal)] shadow-[var(--tf-glow)]',
  minimal: 'bg-gradient-to-br from-slate-800 to-slate-900 border border-[var(--tf-quantum-teal)] text-[var(--tf-quantum-teal)] shadow-[var(--tf-glow)]',
  dark: 'bg-black border border-[var(--tf-quantum-teal)] text-[var(--tf-quantum-teal)] shadow-[var(--tf-glow-strong)]',
  '3d': 'bg-gradient-to-br from-[var(--tf-quantum-teal)] to-[var(--tf-accent-cyan)] text-[var(--tf-deep-space)] shadow-[var(--tf-glow-strong)] transform perspective-1000 rotate-x-[15deg] rotate-y-[-15deg]'
};

export function TerraLogo({ 
  variant = 'primary', 
  size = 'md', 
  className, 
  animate = false 
}: TerraLogoProps) {
  return (
    <div 
      className={cn(
        'flex items-center justify-center rounded-2xl relative transition-all duration-300',
        'font-black font-mono tracking-tighter select-none',
        sizeMap[size],
        variantMap[variant],
        animate && 'animate-pulse hover:scale-105 cursor-pointer',
        className
      )}
      style={{
        textShadow: variant.includes('dark') || variant === 'outline' 
          ? '0 0 15px rgba(0, 229, 255, 0.6)' 
          : 'none'
      }}
    >
      <span className="font-black">TF</span>
      {variant === '3d' && (
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--tf-quantum-teal)] to-[var(--tf-accent-cyan)] opacity-20 rounded-2xl transform translate-x-1 translate-y-1 -z-10" />
      )}
    </div>
  );
}

interface TerraWordmarkProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showTagline?: boolean;
}

const wordmarkSizeMap = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-4xl',
  xl: 'text-6xl'
};

export function TerraWordmark({ 
  size = 'md', 
  className, 
  showTagline = false 
}: TerraWordmarkProps) {
  return (
    <div className={cn('flex flex-col', className)}>
      <h1 
        className={cn(
          'font-extrabold tracking-tight bg-gradient-to-r from-white via-[var(--tf-quantum-teal)] to-white bg-clip-text text-transparent',
          wordmarkSizeMap[size]
        )}
        style={{
          filter: 'drop-shadow(0 0 20px rgba(0, 229, 255, 0.3))'
        }}
      >
        TerraFusion
      </h1>
      {showTagline && (
        <p className="text-slate-300 font-light tracking-wide opacity-90 text-sm mt-1">
          AI That Understands Land
        </p>
      )}
    </div>
  );
}

interface TerraNavLogoProps {
  className?: string;
  showText?: boolean;
}

export function TerraNavLogo({ className, showText = true }: TerraNavLogoProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <TerraLogo variant="primary" size="md" animate />
      {showText && (
        <div className="flex flex-col">
          <span className="text-white font-bold text-lg tracking-tight">
            TerraFusion
          </span>
          <span className="text-slate-300 text-xs opacity-80">
            Enterprise Platform
          </span>
        </div>
      )}
    </div>
  );
}
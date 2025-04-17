import React from 'react';
import { Link } from 'wouter';
import bentonLogo from '@assets/BC.png';
import sunsetHeroBackground from '@assets/Header-Vineyard-BC.png';
import { cn } from '@/lib/utils';

interface BentonCountyHeaderProps {
  title: string;
  subtitle?: string;
  showHeroBackground?: boolean;
  className?: string;
  showLogo?: boolean;
  logoSize?: 'small' | 'medium' | 'large';
  hideNavigation?: boolean;
  navigationLinks?: { 
    label: string;
    href: string;
    active?: boolean;
  }[];
  actions?: React.ReactNode;
}

export default function BentonCountyHeader({
  title,
  subtitle,
  showHeroBackground = false,
  className,
  showLogo = true,
  logoSize = 'medium',
  hideNavigation = false,
  navigationLinks = [],
  actions
}: BentonCountyHeaderProps) {
  // Logo size mappings
  const logoSizeClasses = {
    small: 'h-8 w-8',
    medium: 'h-12 w-12',
    large: 'h-16 w-16'
  };

  // Default navigation links if none provided
  const defaultNavLinks = [
    { label: 'Home', href: '/' },
    { label: 'Projects', href: '/projects' },
    { label: 'Shared Projects', href: '/shared-projects' },
    { label: 'Data Connectors', href: '/data-connectors' },
    { label: 'Cost Matrix', href: '/cost-matrix' }
  ];

  const links = navigationLinks.length > 0 ? navigationLinks : defaultNavLinks;

  return (
    <header className={cn(
      'relative w-full overflow-hidden',
      showHeroBackground ? 'bg-accent text-white h-[200px] md:h-[300px]' : 'bg-white border-b py-4',
      className
    )}>
      {/* Hero background image */}
      {showHeroBackground && (
        <div 
          className="absolute inset-0 w-full h-full bg-cover bg-center opacity-80 z-0"
          style={{ backgroundImage: `url(${sunsetHeroBackground})` }}
        />
      )}

      {/* Overlay gradient for hero background */}
      {showHeroBackground && (
        <div 
          className="absolute inset-0 bg-gradient-to-r from-accent/80 to-transparent z-10"
        />
      )}

      <div className={cn(
        'container mx-auto px-4 relative flex flex-col md:flex-row items-center justify-between', // Added flex-col/flex-row for responsiveness
        showHeroBackground ? 'z-20 h-full' : 'py-4' // Adjusted padding for non-hero header
      )}>
        <div className="flex items-center gap-3">
          {showLogo && (
            <Link href="/">
              <img 
                src={bentonLogo} 
                alt="Benton County" 
                className={cn('object-contain', logoSizeClasses[logoSize], 'rounded-md')} // Added rounded corners
              />
            </Link>
          )}

          <div>
            <h1 className={cn(
              'font-bold tracking-tight text-3xl md:text-4xl', // Increased font size for better readability
              showHeroBackground 
                ? 'text-white' 
                : 'text-accent'
            )}>
              {title}
            </h1>

            {subtitle && (
              <p className={cn(
                'mt-1 text-lg md:text-xl', // Improved font size and spacing
                showHeroBackground 
                  ? 'text-white/90 max-w-md' 
                  : 'text-muted-foreground'
              )}>
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {!showHeroBackground && !hideNavigation && (
          <nav className="hidden md:flex items-center space-x-6">
            {links.map((link) => (
              <Link 
                key={link.href} 
                href={link.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:underline', // Added hover underline
                  link.active 
                    ? 'text-primary' 
                    : 'text-muted-foreground'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
        {!showHeroBackground && actions && (
          <div className="flex items-center gap-2"> {actions} </div>
        )}

        {showHeroBackground && !hideNavigation && (
          <nav className="mt-auto mb-4 hidden md:flex items-center gap-6 bg-white/10 backdrop-blur-sm py-2 px-4 rounded-md">
            {links.map((link) => (
              <Link 
                key={link.href} 
                href={link.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:underline', // Added hover underline
                  link.active 
                    ? 'text-white' 
                    : 'text-white/80'
                )}
              >
                {link.label}
              </Link>
            ))}
            {showHeroBackground && actions && (
              <div className="ml-4"> {actions} </div>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
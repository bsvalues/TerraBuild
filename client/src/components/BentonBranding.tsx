import React from 'react';

// Import Benton County logo assets
import bentonSeal from '@assets/BC.png';
import bentonLogo from '@assets/images.png';
import bentonHeader from '@assets/1.jpg';
import bentonScenicLogo from '@assets/ogimage.jpg';

// Benton County Brand Colors
export const BentonColors = {
  darkTeal: '#243E4D',  // Primary dark blue/teal
  green: '#47AD55',     // Green for "COUNTY"
  lightBlue: '#33A4CB', // Teal/blue for "WA"
  orange: '#F09E1D',    // Warm orange
  darkOrange: '#E55E23', // Darker orange
  brown: '#93714D',     // Brown
  tan: '#BEB69B',       // Tan/beige
  slateBlue: '#496980'  // Slate blue
};

interface BentonBrandingProps {
  variant?: 'horizontal' | 'vertical' | 'seal' | 'official' | 'scenic';
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  className?: string;
}

/**
 * Benton County Branding Component
 * 
 * This component renders the Benton County branding using official logos and colors
 * in various formats: horizontal logo, vertical text, official seal, or scenic logo
 */
export const BentonBranding: React.FC<BentonBrandingProps> = ({ 
  variant = 'horizontal', 
  size = 'md', 
  showTagline = false,
  className = ''
}) => {
  // Size classes for images
  const imageSizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };
  
  // Size classes for text
  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  // Official seal version (using the BC.png image)
  if (variant === 'seal') {
    return (
      <div className={`flex flex-col items-center ${className}`}>
        <img 
          src={bentonSeal} 
          alt="Benton County Seal" 
          className={imageSizeClasses[size]}
        />
        {showTagline && (
          <div className={`${textSizeClasses[size]} text-gray-600 mt-2`}>
            Building Cost Assessment System
          </div>
        )}
      </div>
    );
  }

  // Horizontal logo version (using the images.png image)
  if (variant === 'horizontal') {
    return (
      <div className={`flex flex-col items-center ${className}`}>
        <img 
          src={bentonLogo} 
          alt="Benton County" 
          className={size === 'sm' ? 'h-6' : size === 'md' ? 'h-8' : 'h-12'}
          style={{ width: 'auto' }}
        />
        {showTagline && (
          <div className={`${textSizeClasses[size]} text-gray-600 mt-1`}>
            Building Cost Assessment System
          </div>
        )}
      </div>
    );
  }

  // Official header version (has all the navigation elements)
  if (variant === 'official') {
    return (
      <div className={`flex flex-col items-center ${className}`}>
        <div className="relative overflow-hidden rounded">
          <img 
            src={bentonHeader} 
            alt="Benton County Official Header" 
            className="w-full"
            style={{ maxHeight: size === 'sm' ? '50px' : size === 'md' ? '80px' : '120px', objectFit: 'cover' }}
          />
        </div>
        {showTagline && (
          <div className={`${textSizeClasses[size]} text-gray-600 mt-2`}>
            Building Cost Assessment System
          </div>
        )}
      </div>
    );
  }

  // Scenic logo version (with the landscape and seal)
  if (variant === 'scenic') {
    return (
      <div className={`flex flex-col items-center ${className}`}>
        <div className="relative overflow-hidden rounded-full">
          <img 
            src={bentonScenicLogo} 
            alt="Benton County Scenic Logo" 
            className={size === 'sm' ? 'h-20 w-20' : size === 'md' ? 'h-32 w-32' : 'h-48 w-48'}
            style={{ objectFit: 'cover' }}
          />
        </div>
        {showTagline && (
          <div className={`${textSizeClasses[size]} text-gray-600 mt-2`}>
            Building Cost Assessment System
          </div>
        )}
      </div>
    );
  }

  // Vertical text version (fallback if images don't load)
  if (variant === 'vertical') {
    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        <div className="font-bold">
          <div style={{ color: BentonColors.darkTeal }}>BENTON</div>
          <div style={{ color: BentonColors.green }}>COUNTY</div>
          <div style={{ color: BentonColors.lightBlue }}>WASHINGTON</div>
        </div>
        {showTagline && (
          <div className={`${textSizeClasses[size]} text-gray-600 mt-2`}>
            Building Cost Assessment System
          </div>
        )}
      </div>
    );
  }

  // Fallback to seal if variant not recognized or images fail to load
  return (
    <div className={`flex items-center ${className}`}>
      <img 
        src={bentonSeal} 
        alt="Benton County" 
        className={imageSizeClasses[size]}
        onError={(e) => {
          // If image fails to load, show text fallback
          const target = e.currentTarget;
          const parent = target.parentElement;
          if (parent) {
            const fallbackElement = document.createElement('div');
            fallbackElement.className = 'font-bold text-[#243E4D]';
            fallbackElement.innerHTML = 'BENTON COUNTY';
            parent.replaceChild(fallbackElement, target);
          }
        }}
      />
      {showTagline && (
        <div className={`${textSizeClasses[size]} text-gray-600 ml-2`}>
          Building Cost Assessment System
        </div>
      )}
    </div>
  );
};

export default BentonBranding;
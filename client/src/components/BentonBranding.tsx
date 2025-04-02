import React from 'react';

// Benton County Brand Colors
export const BentonColors = {
  darkTeal: '#243E4D',  // Primary dark blue/teal
  green: '#3CAB36',     // Green for "COUNTY"
  lightBlue: '#29B7D3', // Teal/blue for "WA"
  orange: '#F09E1D',    // Warm orange
  darkOrange: '#E55E23', // Darker orange
  brown: '#93714D',     // Brown
  tan: '#BEB69B',       // Tan/beige
  slateBlue: '#496980'  // Slate blue
};

interface BentonBrandingProps {
  variant?: 'horizontal' | 'vertical' | 'seal' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

/**
 * Benton County Branding Component
 * 
 * This component renders the Benton County branding using official colors
 * in various formats (horizontal, vertical, seal, or outline)
 */
export const BentonBranding: React.FC<BentonBrandingProps> = ({ 
  variant = 'horizontal', 
  size = 'md', 
  showTagline = false
}) => {
  // Size classes
  const sizeClasses = {
    sm: 'text-lg md:text-xl',
    md: 'text-xl md:text-2xl',
    lg: 'text-2xl md:text-3xl'
  };

  // Horizontal version (default)
  if (variant === 'horizontal') {
    return (
      <div className="flex flex-col items-center">
        <div className={`font-bold leading-tight ${sizeClasses[size]}`}>
          <span style={{ color: BentonColors.darkTeal }}>BENTON</span>
          <span style={{ color: BentonColors.green }}> COUNTY</span>
          <span style={{ color: BentonColors.lightBlue }}>WA</span>
        </div>
        {showTagline && (
          <div className="text-xs text-gray-600 mt-1">Building Cost Assessment System</div>
        )}
      </div>
    );
  }

  // Vertical version
  if (variant === 'vertical') {
    return (
      <div className="flex flex-col items-center text-center">
        <div className={`font-bold ${sizeClasses[size]}`}>
          <div style={{ color: BentonColors.darkTeal }}>BENTON</div>
          <div style={{ color: BentonColors.green }}>COUNTY</div>
          <div style={{ color: BentonColors.lightBlue }}>WASHINGTON</div>
        </div>
        {showTagline && (
          <div className="text-xs text-gray-600 mt-2">Building Cost Assessment System</div>
        )}
      </div>
    );
  }

  // Seal version
  if (variant === 'seal') {
    return (
      <div className="flex flex-col items-center text-center">
        <div 
          style={{ border: `3px solid ${BentonColors.darkTeal}` }} 
          className="rounded-full p-4 flex flex-col items-center justify-center"
        >
          <div className={`font-bold ${sizeClasses[size]}`}>
            <div style={{ color: BentonColors.darkTeal }}>COUNTY OF</div>
            <div className="my-1" style={{ color: BentonColors.darkTeal }}>
              BEN<span style={{ color: BentonColors.lightBlue }}>T</span>ON
            </div>
            <div style={{ color: BentonColors.darkTeal }}>WASHINGTON</div>
          </div>
          <div className="text-xs text-gray-600 mt-1">EST. 1905</div>
        </div>
        {showTagline && (
          <div className="text-xs text-gray-600 mt-2">Building Cost Assessment System</div>
        )}
      </div>
    );
  }

  // Outline version (with state outline)
  if (variant === 'outline') {
    return (
      <div className="flex flex-col items-center">
        <div className="relative">
          {/* Simplified WA state outline */}
          <div 
            style={{ 
              border: `2px solid ${BentonColors.green}`,
              width: size === 'sm' ? '60px' : size === 'md' ? '80px' : '100px',
              height: size === 'sm' ? '50px' : size === 'md' ? '70px' : '90px'
            }} 
            className="rounded-sm relative"
          ></div>
          
          {/* Text overlay */}
          <div 
            className={`absolute inset-0 flex items-center justify-center ${sizeClasses[size]}`}
          >
            <div className="text-center">
              <div style={{ color: BentonColors.darkTeal }}>BENTON</div>
              <div style={{ color: BentonColors.green }}>WASHINGTON</div>
            </div>
          </div>
        </div>
        {showTagline && (
          <div className="text-xs text-gray-600 mt-2">Building Cost Assessment System</div>
        )}
      </div>
    );
  }

  // Fallback to horizontal if variant not recognized
  return (
    <div className={`font-bold ${sizeClasses[size]}`}>
      <span style={{ color: BentonColors.darkTeal }}>BENTON</span>
      <span style={{ color: BentonColors.green }}> COUNTY</span>
      <span style={{ color: BentonColors.lightBlue }}>WA</span>
    </div>
  );
};

export default BentonBranding;
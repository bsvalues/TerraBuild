import React from 'react';
import bentonSeal from '@assets/BC.png';

interface LogoProps {
  className?: string;
}

export function Logo({ className = '' }: LogoProps) {
  return (
    <img 
      src={bentonSeal} 
      alt="Benton County Seal" 
      className={className}
    />
  );
}
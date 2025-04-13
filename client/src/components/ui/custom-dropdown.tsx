import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface CustomDropdownProps {
  trigger: React.ReactNode;
  content: React.ReactNode;
  className?: string;
  contentClassName?: string;
  isActive?: boolean;
}

const CustomDropdown = ({
  trigger,
  content,
  className,
  contentClassName,
  isActive = false
}: CustomDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center px-3 py-2 text-sm font-medium transition-colors rounded-md cursor-pointer",
          isActive 
            ? "bg-[#e6eef2] text-[#243E4D]" 
            : "text-muted-foreground hover:text-primary hover:bg-accent/30",
        )}
      >
        {trigger}
      </div>
      
      {isOpen && (
        <div 
          className={cn(
            "absolute left-0 top-full z-[9999] mt-1 rounded-md shadow-md border border-gray-200 bg-white",
            contentClassName
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;
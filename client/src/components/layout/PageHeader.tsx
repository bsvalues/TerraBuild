import React, { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { ChevronRight, Home, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageAction {
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  tooltipText?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: PageAction[];
  children?: ReactNode;
  helpText?: string;
  infoLink?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  breadcrumbs = [],
  actions = [],
  children,
  helpText,
  infoLink,
}) => {
  return (
    <div className="mb-8 space-y-2">
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center text-sm text-gray-500 mb-2">
          <Link href="/" className="flex items-center hover:text-[#29B7D3] transition-colors">
            <Home className="h-3.5 w-3.5 mr-1" />
            <span>Home</span>
          </Link>
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center">
              <ChevronRight className="h-3.5 w-3.5 mx-1 text-gray-400" />
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-[#29B7D3] transition-colors">
                  {crumb.label}
                </Link>
              ) : (
                <span>{crumb.label}</span>
              )}
            </div>
          ))}
        </nav>
      )}

      {/* Title and Actions Row */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="space-y-1 flex-1">
          <div className="flex items-center">
            <h1 className="text-2xl md:text-3xl font-bold text-[#243E4D] tracking-tight">{title}</h1>
            {helpText && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-2 h-6 w-6 rounded-full"
                    >
                      <Info className="h-4 w-4 text-gray-500" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-md">
                    <p>{helpText}</p>
                    {infoLink && (
                      <Link href={infoLink} className="text-[#29B7D3] text-sm hover:underline block mt-1">
                        Learn more
                      </Link>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          {description && <p className="text-gray-600">{description}</p>}
        </div>

        {actions.length > 0 && (
          <div className={cn(
            "flex flex-wrap gap-2",
            "justify-start md:justify-end",
          )}>
            {actions.map((action, index) => {
              const ButtonContent = (
                <Button
                  key={action.label}
                  variant={action.variant || 'default'}
                  onClick={action.onClick}
                  className={cn(
                    action.variant === 'default' && "bg-[#29B7D3] hover:bg-[#29B7D3]/90 text-white",
                    action.variant === 'outline' && "border-[#29B7D3]/30 text-[#29B7D3] hover:bg-[#29B7D3]/10"
                  )}
                >
                  {action.icon && (
                    <span className="mr-2">{action.icon}</span>
                  )}
                  {action.label}
                </Button>
              );

              if (action.href) {
                return action.tooltipText ? (
                  <TooltipProvider key={index}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link key={index} href={action.href}>
                          {ButtonContent}
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{action.tooltipText}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <Link key={index} href={action.href}>
                    {ButtonContent}
                  </Link>
                );
              }

              return action.tooltipText ? (
                <TooltipProvider key={index}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      {ButtonContent}
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{action.tooltipText}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : ButtonContent;
            })}
          </div>
        )}
      </div>

      {/* Optional Children Content */}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
};

export default PageHeader;
import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface EnterpriseCardProps {
  className?: string;
  children?: React.ReactNode;
  variant?: 'default' | 'interactive' | 'feature' | 'metric';
  size?: 'sm' | 'md' | 'lg';
}

interface EnterpriseCardHeaderProps {
  className?: string;
  children?: React.ReactNode;
  icon?: LucideIcon;
  badge?: string;
  badgeVariant?: 'default' | 'success' | 'warning' | 'error';
}

interface EnterpriseCardContentProps {
  className?: string;
  children?: React.ReactNode;
}

interface EnterpriseCardFooterProps {
  className?: string;
  children?: React.ReactNode;
}

const EnterpriseCard = React.forwardRef<HTMLDivElement, EnterpriseCardProps>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
    const variants = {
      default: 'bg-slate-900/50 border-slate-700/50 backdrop-blur-sm',
      interactive: 'bg-slate-900/50 border-slate-700/50 backdrop-blur-sm hover:bg-slate-800/60 hover:border-slate-600/60 transition-all duration-200 cursor-pointer group',
      feature: 'bg-gradient-to-br from-slate-900/80 to-slate-800/80 border-sky-500/20 backdrop-blur-sm shadow-lg',
      metric: 'bg-slate-900/60 border-slate-700/40 backdrop-blur-sm'
    };

    const sizes = {
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8'
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg border shadow-sm',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

const EnterpriseCardHeader = React.forwardRef<HTMLDivElement, EnterpriseCardHeaderProps>(
  ({ className, icon: Icon, badge, badgeVariant = 'default', children, ...props }, ref) => {
    const badgeVariants = {
      default: 'bg-slate-700/50 text-slate-300',
      success: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      warning: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
      error: 'bg-red-500/20 text-red-400 border border-red-500/30'
    };

    return (
      <div
        ref={ref}
        className={cn('flex items-center justify-between mb-4', className)}
        {...props}
      >
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20">
              <Icon className="h-5 w-5 text-sky-400" />
            </div>
          )}
          <div className="space-y-1">
            {children}
          </div>
        </div>
        {badge && (
          <span className={cn(
            'px-2 py-1 rounded-md text-xs font-medium',
            badgeVariants[badgeVariant]
          )}>
            {badge}
          </span>
        )}
      </div>
    );
  }
);

const EnterpriseCardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-lg font-semibold text-slate-100 leading-none tracking-tight', className)}
      {...props}
    />
  )
);

const EnterpriseCardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-slate-400', className)}
      {...props}
    />
  )
);

const EnterpriseCardContent = React.forwardRef<HTMLDivElement, EnterpriseCardContentProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('text-slate-300', className)} {...props}>
      {children}
    </div>
  )
);

const EnterpriseCardFooter = React.forwardRef<HTMLDivElement, EnterpriseCardFooterProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center pt-4 mt-4 border-t border-slate-700/50', className)}
      {...props}
    >
      {children}
    </div>
  )
);

EnterpriseCard.displayName = 'EnterpriseCard';
EnterpriseCardHeader.displayName = 'EnterpriseCardHeader';
EnterpriseCardTitle.displayName = 'EnterpriseCardTitle';
EnterpriseCardDescription.displayName = 'EnterpriseCardDescription';
EnterpriseCardContent.displayName = 'EnterpriseCardContent';
EnterpriseCardFooter.displayName = 'EnterpriseCardFooter';

export {
  EnterpriseCard,
  EnterpriseCardHeader,
  EnterpriseCardTitle,
  EnterpriseCardDescription,
  EnterpriseCardContent,
  EnterpriseCardFooter,
};
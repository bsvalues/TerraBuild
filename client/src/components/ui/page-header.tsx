import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  actions?: React.ReactNode;
  showBack?: boolean;
  backHref?: string;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  icon: Icon,
  breadcrumbs,
  actions,
  showBack = false,
  backHref = '/',
  className
}) => {
  return (
    <div className={cn('mb-8', className)}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-4">
          <ol className="flex items-center space-x-2 text-sm">
            {breadcrumbs.map((crumb, index) => (
              <li key={index} className="flex items-center">
                {index > 0 && (
                  <span className="mx-2 text-slate-500">/</span>
                )}
                {crumb.href ? (
                  <Link href={crumb.href}>
                    <span className="text-sky-400 hover:text-sky-300 cursor-pointer">
                      {crumb.label}
                    </span>
                  </Link>
                ) : (
                  <span className="text-slate-400">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          {/* Back button */}
          {showBack && (
            <Link href={backHref}>
              <Button variant="ghost" size="sm" className="mt-1 text-slate-400 hover:text-slate-300">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
          )}

          {/* Icon */}
          {Icon && (
            <div className="p-3 rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-500/20 border border-sky-500/30 mt-1">
              <Icon className="h-6 w-6 text-sky-400" />
            </div>
          )}

          {/* Title and description */}
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-slate-100 mb-2 truncate">
              {title}
            </h1>
            {description && (
              <p className="text-slate-400 leading-relaxed max-w-3xl">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  previousValue?: string | number;
  unit?: string;
  icon?: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  description?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  previousValue,
  unit,
  icon: Icon,
  trend,
  trendValue,
  description,
  className,
  size = 'md',
  variant = 'default'
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return TrendingUp;
      case 'down':
        return TrendingDown;
      default:
        return Minus;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-emerald-400';
      case 'down':
        return 'text-red-400';
      default:
        return 'text-slate-400';
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return 'bg-gradient-to-br from-sky-500/10 to-blue-500/10 border-sky-500/30';
      case 'success':
        return 'bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-emerald-500/30';
      case 'warning':
        return 'bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30';
      case 'danger':
        return 'bg-gradient-to-br from-red-500/10 to-pink-500/10 border-red-500/30';
      default:
        return 'bg-slate-900/50 border-slate-700/50';
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'p-4';
      case 'lg':
        return 'p-8';
      default:
        return 'p-6';
    }
  };

  const TrendIcon = getTrendIcon();

  return (
    <div
      className={cn(
        'rounded-lg border backdrop-blur-sm',
        getVariantStyles(),
        getSizeStyles(),
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {Icon && (
              <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <Icon className="h-4 w-4 text-slate-400" />
              </div>
            )}
            <h3 className="text-sm font-medium text-slate-400 truncate">
              {title}
            </h3>
          </div>
          
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl font-bold text-slate-100">
              {value}
            </span>
            {unit && (
              <span className="text-sm text-slate-400">
                {unit}
              </span>
            )}
          </div>

          {(trend || trendValue) && (
            <div className="flex items-center gap-1">
              <TrendIcon className={cn('h-3 w-3', getTrendColor())} />
              {trendValue && (
                <span className={cn('text-xs font-medium', getTrendColor())}>
                  {trendValue}
                </span>
              )}
            </div>
          )}

          {description && (
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
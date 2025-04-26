import React, { ReactNode } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

interface DataCardProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  footer?: ReactNode;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  children?: ReactNode;
  className?: string;
  iconColor?: string;
  cardColor?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  loading?: boolean;
}

const DataCard: React.FC<DataCardProps> = ({
  title,
  description,
  icon,
  footer,
  action,
  children,
  className,
  iconColor = 'bg-[#29B7D3]/10 text-[#29B7D3]',
  cardColor = 'default',
  loading = false,
}) => {
  
  // Define color styles based on cardColor
  const cardColorStyles = {
    default: '',
    primary: 'border-[#29B7D3]/30 bg-[#29B7D3]/5',
    secondary: 'border-[#243E4D]/30 bg-[#243E4D]/5',
    success: 'border-green-500/30 bg-green-500/5',
    warning: 'border-amber-500/30 bg-amber-500/5',
    error: 'border-red-500/30 bg-red-500/5',
  };
  
  const renderContent = () => {
    if (loading) {
      return (
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      );
    }
    
    return children;
  };
  
  return (
    <Card className={cn(
      "transition-all hover:shadow-md",
      cardColorStyles[cardColor],
      className
    )}>
      <CardHeader className="flex flex-row items-start space-y-0 pb-2">
        {icon && (
          <div className={cn(
            "mr-4 rounded-full p-2",
            iconColor
          )}>
            {icon}
          </div>
        )}
        <div className="space-y-1 flex-1">
          <CardTitle className="text-lg font-semibold text-[#243E4D]">{title}</CardTitle>
          {description && (
            <CardDescription>{description}</CardDescription>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
      {(footer || action) && (
        <CardFooter className={cn(
          "pt-2 border-t",
          cardColor === 'default' ? 'border-gray-100' : 'border-current border-opacity-10',
          action ? 'justify-between' : 'justify-start'
        )}>
          {footer}
          {action && (
            action.href ? (
              <Link href={action.href}>
                <Button variant="ghost" className="text-[#29B7D3] px-2 py-1 h-auto">
                  {action.label}
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Button 
                variant="ghost" 
                className="text-[#29B7D3] px-2 py-1 h-auto" 
                onClick={action.onClick}
              >
                {action.label}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            )
          )}
        </CardFooter>
      )}
    </Card>
  );
};

export default DataCard;
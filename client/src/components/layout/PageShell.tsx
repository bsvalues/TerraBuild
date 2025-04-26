import React, { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { ArrowLeft, HelpCircle, Share2, Download, Bookmark, InfoIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface Breadcrumb {
  label: string;
  href?: string;
}

export interface PageAction {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  disabled?: boolean;
  tooltip?: string;
}

export interface PageTab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
}

interface PageShellProps {
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  children: ReactNode;
  actions?: PageAction[];
  tabs?: PageTab[];
  infoAlert?: {
    title?: string;
    description: string;
    variant?: 'default' | 'destructive';
  };
  backLink?: {
    href: string;
    label?: string;
  };
  loading?: boolean;
  className?: string;
  sidebar?: React.ReactNode;
  helpText?: string;
  navigationFlow?: React.ReactNode;
}

export default function PageShell({
  title,
  description,
  breadcrumbs,
  children,
  actions,
  tabs,
  infoAlert,
  backLink,
  loading = false,
  className,
  sidebar,
  helpText,
  navigationFlow,
}: PageShellProps) {
  const [activeTab, setActiveTab] = React.useState<string>(tabs?.[0]?.id || '');
  const [, navigate] = useLocation();
  
  // Function to handle tab changing
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  // Helper for action buttons
  const renderAction = (action: PageAction, index: number) => {
    const button = (
      <Button
        key={`action-${index}`}
        variant={action.variant || 'default'}
        size="sm"
        onClick={action.onClick || (action.href ? () => navigate(action.href as string) : undefined)}
        disabled={action.disabled}
        className={cn(
          action.variant === 'default' && 'bg-[#29B7D3] hover:bg-[#29B7D3]/90',
          'transition-all'
        )}
      >
        {action.icon && <span className="mr-2">{action.icon}</span>}
        {action.label}
      </Button>
    );
    
    if (action.tooltip) {
      return (
        <TooltipProvider key={`action-tooltip-${index}`}>
          <Tooltip>
            <TooltipTrigger asChild>
              {button}
            </TooltipTrigger>
            <TooltipContent>
              <p>{action.tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    return button;
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header section with breadcrumbs, title and actions */}
      <div className="space-y-4">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumb className="animate-fade-in mb-4">
            <BreadcrumbList>
              {breadcrumbs.map((item, index) => (
                <React.Fragment key={`breadcrumb-${index}`}>
                  <BreadcrumbItem>
                    {item.href ? (
                      <BreadcrumbLink asChild>
                        <Link href={item.href}>{item.label}</Link>
                      </BreadcrumbLink>
                    ) : (
                      <span className="text-muted-foreground">{item.label}</span>
                    )}
                  </BreadcrumbItem>
                  {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        )}
        
        {backLink && (
          <Button
            variant="ghost"
            size="sm"
            className="mb-4 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => navigate(backLink.href)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {backLink.label || 'Back'}
          </Button>
        )}
        
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#243E4D] tracking-tight">{title}</h1>
            {description && <p className="text-muted-foreground mt-1.5">{description}</p>}
          </div>
          
          {actions && actions.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0 sm:justify-end">
              {actions.map(renderAction)}
            </div>
          )}
        </div>
      </div>
      
      {/* Optional navigation flow (workflow steps) */}
      {navigationFlow && (
        <Card className="shadow-sm bg-white/70 backdrop-blur border-[#e6eef2]">
          <CardContent className="py-4">
            {navigationFlow}
          </CardContent>
        </Card>
      )}
      
      {/* Optional info alert */}
      {infoAlert && (
        <Alert 
          variant={infoAlert.variant || 'default'} 
          className={cn(
            infoAlert.variant === 'default' || !infoAlert.variant ? 'bg-[#e6f7fb] border-[#29B7D3]/30' : '',
            infoAlert.variant === 'destructive' ? 'bg-[#fdf0f0] border-[#f87171]/30' : '',
            'animate-fade-in'
          )}
        >
          <InfoIcon className="h-4 w-4" />
          {infoAlert.title && <AlertTitle>{infoAlert.title}</AlertTitle>}
          <AlertDescription>{infoAlert.description}</AlertDescription>
        </Alert>
      )}
      
      {/* Main content */}
      <div className={cn(
        'flex flex-col md:flex-row gap-6',
        sidebar ? 'items-start' : 'items-stretch'
      )}>
        {/* Main content area */}
        <div className={cn('flex-1', !sidebar && 'w-full')}>
          {tabs && tabs.length > 0 ? (
            <Tabs defaultValue={tabs[0].id} value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="w-full border-b pb-0 mb-6">
                {tabs.map((tab) => (
                  <TabsTrigger 
                    key={tab.id} 
                    value={tab.id}
                    disabled={tab.disabled}
                    className="data-[state=active]:border-b-2 data-[state=active]:border-[#29B7D3] rounded-none"
                  >
                    {tab.icon && <span className="mr-2">{tab.icon}</span>}
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {tabs.map((tab) => (
                <TabsContent key={`content-${tab.id}`} value={tab.id} className="mt-0">
                  {tab.content}
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            children
          )}
          
          {/* Help text at the bottom if provided */}
          {helpText && (
            <div className="mt-8 border-t pt-4 text-sm text-muted-foreground">
              <div className="flex items-start">
                <HelpCircle className="h-5 w-5 mr-2 text-[#29B7D3] flex-shrink-0 mt-0.5" />
                <p>{helpText}</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Optional sidebar */}
        {sidebar && (
          <div className="w-full md:w-80 flex-shrink-0 order-first md:order-last">
            {sidebar}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper components

interface InfoCardProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  actions?: PageAction[];
}

export function InfoCard({ title, description, children, icon, className, actions }: InfoCardProps) {
  const [, navigate] = useLocation();
  
  return (
    <Card className={cn('shadow-sm', className)}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            {icon && <div className="mr-3 text-[#29B7D3]">{icon}</div>}
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              {description && <CardDescription className="mt-1">{description}</CardDescription>}
            </div>
          </div>
          
          {actions && actions.length > 0 && (
            <div className="flex items-center gap-2">
              {actions.map((action, index) => (
                <Button
                  key={`card-action-${index}`}
                  variant={action.variant || 'ghost'}
                  size="sm"
                  onClick={action.onClick || (action.href ? () => navigate(action.href as string) : undefined)}
                  disabled={action.disabled}
                >
                  {action.icon && <span className="mr-1">{action.icon}</span>}
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </CardHeader>
      {children && <CardContent>{children}</CardContent>}
    </Card>
  );
}

interface ActionsPanelProps {
  title?: string;
  description?: string;
  actions: PageAction[];
  className?: string;
}

export function ActionsPanel({ title, description, actions, className }: ActionsPanelProps) {
  const [, navigate] = useLocation();
  
  return (
    <Card className={cn('shadow-sm', className)}>
      {(title || description) && (
        <CardHeader className="pb-3">
          {title && <CardTitle className="text-base">{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className="flex flex-col gap-2">
        {actions.map((action, index) => (
          <Button
            key={`panel-action-${index}`}
            variant={action.variant || 'outline'}
            onClick={action.onClick || (action.href ? () => navigate(action.href as string) : undefined)}
            disabled={action.disabled}
            className="justify-start h-auto py-3"
          >
            {action.icon && <span className="mr-3">{action.icon}</span>}
            <div className="text-left">
              <div className="font-semibold">{action.label}</div>
              {action.tooltip && <div className="text-xs text-muted-foreground mt-1">{action.tooltip}</div>}
            </div>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}

// Commonly used action presets
export const commonActions = {
  save: (onClick: () => void): PageAction => ({
    label: 'Save',
    icon: <Bookmark className="h-4 w-4" />,
    onClick,
    tooltip: 'Save the current data',
  }),
  export: (onClick: () => void): PageAction => ({
    label: 'Export',
    icon: <Download className="h-4 w-4" />,
    onClick,
    tooltip: 'Export the current data',
  }),
  share: (onClick: () => void): PageAction => ({
    label: 'Share',
    icon: <Share2 className="h-4 w-4" />,
    onClick,
    tooltip: 'Share with others',
  }),
  help: (href: string): PageAction => ({
    label: 'Help',
    icon: <HelpCircle className="h-4 w-4" />,
    href,
    variant: 'ghost',
    tooltip: 'Get help with this feature',
  }),
};
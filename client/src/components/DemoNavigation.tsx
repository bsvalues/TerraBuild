import React from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  ArrowRight,
  Home,
  Map,
  BarChart3,
  Activity,
  TrendingUp,
  Brain
} from 'lucide-react';

interface DemoStep {
  id: string;
  title: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
}

const demoSteps: DemoStep[] = [
  {
    id: 'overview',
    title: 'Demo Overview',
    href: '/benton-county-demo',
    icon: <Home className="h-4 w-4" />,
    badge: 'Start',
    badgeColor: 'bg-blue-100 text-blue-800'
  },
  {
    id: 'data-exploration',
    title: 'Data Exploration',
    href: '/data-exploration-demo',
    icon: <Map className="h-4 w-4" />,
    badge: '1',
    badgeColor: 'bg-green-100 text-green-800'
  },
  {
    id: 'comparative-analysis',
    title: 'Comparative Analysis',
    href: '/comparative-analysis-demo',
    icon: <BarChart3 className="h-4 w-4" />,
    badge: '2',
    badgeColor: 'bg-blue-100 text-blue-800'
  },
  {
    id: 'statistical-analysis',
    title: 'Statistical Analysis',
    href: '/statistical-analysis-demo',
    icon: <Activity className="h-4 w-4" />,
    badge: '3',
    badgeColor: 'bg-purple-100 text-purple-800'
  },
  {
    id: 'cost-trend-analysis',
    title: 'Cost Trend Analysis',
    href: '/cost-trend-analysis-demo',
    icon: <TrendingUp className="h-4 w-4" />,
    badge: '4',
    badgeColor: 'bg-orange-100 text-orange-800'
  },
  {
    id: 'predictive-cost-analysis',
    title: 'Predictive Analysis',
    href: '/predictive-cost-analysis-demo',
    icon: <Brain className="h-4 w-4" />,
    badge: '5',
    badgeColor: 'bg-red-100 text-red-800'
  }
];

interface DemoNavigationProps {
  className?: string;
}

export default function DemoNavigation({ className }: DemoNavigationProps) {
  const [location] = useLocation();
  
  const currentStepIndex = demoSteps.findIndex(step => step.href === location);
  const currentStep = demoSteps[currentStepIndex];
  const previousStep = currentStepIndex > 0 ? demoSteps[currentStepIndex - 1] : null;
  const nextStep = currentStepIndex < demoSteps.length - 1 ? demoSteps[currentStepIndex + 1] : null;

  if (currentStepIndex === -1) {
    return null;
  }

  return (
    <Card className={`mb-6 ${className}`}>
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {previousStep && (
              <Link href={previousStep.href}>
                <Button variant="outline" size="sm" className="flex items-center">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {previousStep.title}
                </Button>
              </Link>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {currentStep.icon}
            <span className="font-medium text-gray-900">{currentStep.title}</span>
            {currentStep.badge && (
              <Badge className={currentStep.badgeColor}>
                {currentStep.badge}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {nextStep && (
              <Link href={nextStep.href}>
                <Button size="sm" className="flex items-center bg-[#29B7D3] hover:bg-[#29B7D3]/90">
                  {nextStep.title}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            )}
          </div>
        </div>
        
        <div className="mt-4">
          <div className="flex items-center space-x-2">
            {demoSteps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <Link href={step.href}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                    index === currentStepIndex 
                      ? 'bg-[#29B7D3] text-white' 
                      : index < currentStepIndex 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}>
                    {step.badge === 'Start' ? <Home className="h-3 w-3" /> : step.badge}
                  </div>
                </Link>
                {index < demoSteps.length - 1 && (
                  <div className={`w-8 h-0.5 mx-1 ${
                    index < currentStepIndex ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import React from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Calculator, 
  Building2, 
  Map, 
  BarChart3, 
  Database, 
  FileText,
  TrendingUp,
  Import,
  ArrowRight,
  Zap,
  Shield,
  Clock,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EnterpriseCard, EnterpriseCardHeader, EnterpriseCardTitle, EnterpriseCardDescription, EnterpriseCardContent } from '@/components/ui/enterprise-card';
import { MetricCard } from '@/components/ui/metric-card';
import { PageHeader } from '@/components/ui/page-header';

const HomePage = () => {
  const { user } = useAuth();

  const quickActions = [
    {
      icon: Calculator,
      title: "Property Valuation",
      description: "Start a new property analysis with AI-powered cost estimation",
      href: "/cost-wizard",
      variant: "primary" as const
    },
    {
      icon: Map,
      title: "Geographic Analysis",
      description: "Explore property values and market trends on interactive maps",
      href: "/maps",
      variant: "feature" as const
    },
    {
      icon: Building2,
      title: "Property Browser",
      description: "Search and analyze properties in the Benton County database",
      href: "/properties",
      variant: "default" as const
    },
    {
      icon: Database,
      title: "Cost Matrix",
      description: "Manage building cost factors and valuation matrices",
      href: "/matrix",
      variant: "default" as const
    }
  ];

  const recentActivity = [
    {
      icon: Calculator,
      title: "Residential Valuation Completed",
      description: "1250 Oakwood Lane - $485,000 assessed value",
      time: "2 hours ago",
      status: "success" as const
    },
    {
      icon: Map,
      title: "Market Analysis Updated",
      description: "Benton County District 5 - Q4 2024 trends",
      time: "4 hours ago",
      status: "info" as const
    },
    {
      icon: FileText,
      title: "Cost Report Generated",
      description: "Commercial properties - Building standards review",
      time: "1 day ago",
      status: "neutral" as const
    }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-500/10 to-blue-500/10 rounded-2xl" />
        <div className="relative p-8 rounded-2xl border border-sky-500/20">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-100 mb-2">
                Welcome back, {user?.name || user?.username || 'User'}
              </h1>
              <p className="text-lg text-slate-400 mb-4">
                TerraFusion AI-powered property valuation platform
              </p>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                  <span className="text-slate-400">System Operational</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-sky-500 rounded-full" />
                  <span className="text-slate-400">Data Current</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-amber-500 rounded-full" />
                  <span className="text-slate-400">Benton County Connected</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/cost-wizard">
                <Button size="lg" className="bg-sky-600 hover:bg-sky-700">
                  <Calculator className="mr-2 h-5 w-5" />
                  Start Analysis
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics - Real Benton County Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Properties Analyzed"
          value="52,141"
          trend="up"
          trendValue="Complete Benton County"
          icon={Building2}
          variant="primary"
        />
        <MetricCard
          title="Active Cost Matrices"
          value="8"
          description="Building cost standards loaded"
          icon={Database}
          variant="success"
        />
        <MetricCard
          title="Accuracy Rate"
          value="94.2%"
          trend="up"
          trendValue="AI Valuation Accuracy"
          icon={Target}
          variant="default"
        />
        <MetricCard
          title="Reports Generated"
          value="89"
          trend="up"
          trendValue="+5 this week"
          icon={FileText}
          variant="default"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-100">Quick Actions</h2>
            <p className="text-slate-400">Get started with essential valuation tools</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quickActions.map((action, index) => (
            <Link key={index} href={action.href}>
              <EnterpriseCard variant="interactive" className="h-full">
                <EnterpriseCardHeader icon={action.icon}>
                  <EnterpriseCardTitle>{action.title}</EnterpriseCardTitle>
                  <EnterpriseCardDescription>{action.description}</EnterpriseCardDescription>
                </EnterpriseCardHeader>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Click to continue</span>
                  <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-sky-400 transition-colors" />
                </div>
              </EnterpriseCard>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity & System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-slate-100">Recent Activity</h3>
              <p className="text-slate-400">Latest property analyses and updates</p>
            </div>
            <Link href="/reports">
              <Button variant="ghost" className="text-sky-400 hover:text-sky-300">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          
          <EnterpriseCard>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-4 p-4 rounded-lg bg-slate-800/30">
                  <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20">
                    <activity.icon className="h-5 w-5 text-sky-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-slate-200">{activity.title}</h4>
                        <p className="text-sm text-slate-400 mt-1">{activity.description}</p>
                      </div>
                      <span className="text-xs text-slate-500">{activity.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </EnterpriseCard>
        </div>

        {/* System Status */}
        <div>
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-100">System Status</h3>
            <p className="text-slate-400">Platform health and performance</p>
          </div>
          
          <div className="space-y-4">
            <EnterpriseCard variant="feature">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <Shield className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-medium text-slate-200">Security Status</h4>
                  <p className="text-sm text-emerald-400">All systems secure</p>
                </div>
              </div>
            </EnterpriseCard>

            <EnterpriseCard>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20">
                  <Zap className="h-5 w-5 text-sky-400" />
                </div>
                <div>
                  <h4 className="font-medium text-slate-200">Performance</h4>
                  <p className="text-sm text-slate-400">Response time: 245ms</p>
                </div>
              </div>
            </EnterpriseCard>

            <EnterpriseCard>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <Clock className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <h4 className="font-medium text-slate-200">Last Sync</h4>
                  <p className="text-sm text-slate-400">5 minutes ago</p>
                </div>
              </div>
            </EnterpriseCard>
          </div>
        </div>
      </div>

      {/* Feature Highlights */}
      <EnterpriseCard variant="feature">
        <div className="text-center py-8">
          <h3 className="text-2xl font-bold text-slate-100 mb-4">
            Powered by Advanced AI Technology
          </h3>
          <p className="text-slate-400 mb-6 max-w-2xl mx-auto">
            TerraFusion combines machine learning, geospatial analysis, and municipal data 
            to deliver the most accurate property valuations in the industry.
          </p>
          <div className="flex items-center justify-center gap-8">
            <Link href="/agents">
              <Button variant="outline" className="border-sky-500/30 text-sky-400 hover:bg-sky-500/10">
                Explore AI Tools
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/documentation">
              <Button variant="ghost" className="text-slate-400 hover:text-slate-300">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </EnterpriseCard>
    </div>
  );
};

export default HomePage;
import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import BentonBranding from '@/components/BentonBranding';
import {
  BarChart3,
  TrendingUp,
  Map,
  Calculator,
  Brain,
  ArrowRight,
  CheckCircle,
  Building2,
  DollarSign,
  Activity
} from 'lucide-react';

const demoSections = [
  {
    title: 'Data Exploration',
    description: 'Explore comprehensive Benton County building cost data with interactive filters and visualizations.',
    href: '/data-exploration-demo',
    icon: <Map className="h-6 w-6" />,
    features: ['Regional cost analysis', 'Building type breakdown', 'Interactive filtering'],
    badge: 'Start Here',
    badgeColor: 'bg-green-100 text-green-800'
  },
  {
    title: 'Comparative Analysis',
    description: 'Compare building costs across different regions and building types within Benton County.',
    href: '/comparative-analysis-demo',
    icon: <BarChart3 className="h-6 w-6" />,
    features: ['Regional comparisons', 'Building type analysis', 'Cost factor breakdown'],
    badge: 'Core Feature',
    badgeColor: 'bg-blue-100 text-blue-800'
  },
  {
    title: 'Statistical Analysis',
    description: 'Advanced statistical insights into Benton County construction cost patterns and trends.',
    href: '/statistical-analysis-demo',
    icon: <Activity className="h-6 w-6" />,
    features: ['Distribution analysis', 'Outlier detection', 'Correlation insights'],
    badge: 'Advanced',
    badgeColor: 'bg-purple-100 text-purple-800'
  },
  {
    title: 'Cost Trend Analysis',
    description: 'Analyze historical cost trends and identify patterns in Benton County construction data.',
    href: '/cost-trend-analysis-demo',
    icon: <TrendingUp className="h-6 w-6" />,
    features: ['Historical trends', 'Seasonal patterns', 'Growth projections'],
    badge: 'Trending',
    badgeColor: 'bg-orange-100 text-orange-800'
  },
  {
    title: 'Predictive Cost Analysis',
    description: 'AI-powered predictions for future construction costs based on Benton County data.',
    href: '/predictive-cost-analysis-demo',
    icon: <Brain className="h-6 w-6" />,
    features: ['AI predictions', 'Risk assessment', 'Scenario modeling'],
    badge: 'AI-Powered',
    badgeColor: 'bg-red-100 text-red-800'
  }
];

const keyMetrics = [
  {
    label: 'Building Types',
    value: '12+',
    description: 'Residential, Commercial, Industrial',
    icon: <Building2 className="h-5 w-5" />
  },
  {
    label: 'Regions Covered',
    value: '4',
    description: 'North, South, East, West Benton',
    icon: <Map className="h-5 w-5" />
  },
  {
    label: 'Cost Data Points',
    value: '1000+',
    description: 'Comprehensive cost matrices',
    icon: <DollarSign className="h-5 w-5" />
  },
  {
    label: 'Analysis Tools',
    value: '5',
    description: 'Interactive demo modules',
    icon: <Calculator className="h-5 w-5" />
  }
];

export default function BentonCountyDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <BentonBranding size="lg" />
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            TerraFusion Platform Demo
          </h1>
          <h2 className="text-2xl text-[#243E4D] mb-6">
            Benton County, Washington
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8">
            Experience the power of AI-driven infrastructure optimization with real Benton County data. 
            This comprehensive demo showcases advanced analytics, predictive modeling, and cost analysis 
            capabilities tailored for municipal infrastructure planning.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Badge variant="outline" className="px-4 py-2 text-sm">
              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
              Real Benton County Data
            </Badge>
            <Badge variant="outline" className="px-4 py-2 text-sm">
              <CheckCircle className="h-4 w-4 mr-2 text-blue-600" />
              AI-Powered Analytics
            </Badge>
            <Badge variant="outline" className="px-4 py-2 text-sm">
              <CheckCircle className="h-4 w-4 mr-2 text-purple-600" />
              Interactive Visualizations
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {keyMetrics.map((metric, index) => (
            <Card key={index} className="text-center">
              <CardContent className="pt-6">
                <div className="flex justify-center mb-2">
                  <div className="p-2 bg-[#29B7D3]/10 rounded-full">
                    {React.cloneElement(metric.icon, { className: "h-5 w-5 text-[#29B7D3]" })}
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</div>
                <div className="text-sm font-medium text-gray-700 mb-1">{metric.label}</div>
                <div className="text-xs text-gray-500">{metric.description}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mb-12">
          <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Demo Modules
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {demoSections.map((section, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-[#29B7D3]/10 rounded-lg">
                      {React.cloneElement(section.icon, { className: "h-6 w-6 text-[#29B7D3]" })}
                    </div>
                    <Badge className={section.badgeColor}>
                      {section.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {section.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-4">
                    {section.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link href={section.href}>
                    <Button className="w-full bg-[#29B7D3] hover:bg-[#29B7D3]/90 group-hover:bg-[#243E4D] transition-colors">
                      Explore Demo
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="text-center">
          <Card className="max-w-2xl mx-auto bg-gradient-to-r from-[#29B7D3]/5 to-[#243E4D]/5 border-[#29B7D3]/20">
            <CardContent className="pt-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Ready to Get Started?
              </h3>
              <p className="text-gray-600 mb-6">
                Begin your exploration with the Data Exploration module to get familiar with 
                Benton County's infrastructure data, then progress through the advanced analytics modules.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/data-exploration-demo">
                  <Button size="lg" className="bg-[#29B7D3] hover:bg-[#29B7D3]/90">
                    Start Demo Tour
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/calculator">
                  <Button size="lg" variant="outline" className="border-[#29B7D3] text-[#29B7D3] hover:bg-[#29B7D3]/10">
                    Try Cost Calculator
                    <Calculator className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

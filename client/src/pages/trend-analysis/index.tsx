import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  Calendar, 
  BarChart3, 
  LineChart,
  PieChart,
  Building,
  Map,
  Download,
  Filter,
  ChevronDown,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Sample trend metrics
const trendMetrics = [
  { id: 1, name: 'Average Property Value', change: '+5.4%', value: '$485,200', period: 'YoY' },
  { id: 2, name: 'Commercial Growth Rate', change: '+2.8%', value: '$1,250,000', period: 'YoY' },
  { id: 3, name: 'Residential Growth Rate', change: '+6.1%', value: '$420,750', period: 'YoY' },
  { id: 4, name: 'Industrial Valuation', change: '-1.2%', value: '$2,145,000', period: 'YoY' },
];

// Sample regions for trend analysis
const regions = [
  { id: 'richland', name: 'Richland', hoodCode: '52100 100' },
  { id: 'kennewick', name: 'Kennewick', hoodCode: '52100 140' },
  { id: 'prosser', name: 'Prosser', hoodCode: '52100 320' },
  { id: 'west-richland', name: 'West Richland', hoodCode: '52100 240' },
  { id: 'benton-city', name: 'Benton City', hoodCode: '52100 180' },
];

// Sample property types
const propertyTypes = [
  { id: 'residential', name: 'Residential' },
  { id: 'commercial', name: 'Commercial' },
  { id: 'industrial', name: 'Industrial' },
  { id: 'agricultural', name: 'Agricultural' },
];

// Sample time periods
const timePeriods = [
  { id: '1y', name: '1 Year' },
  { id: '2y', name: '2 Years' },
  { id: '5y', name: '5 Years' },
  { id: 'qtd', name: 'Quarter to Date' },
  { id: 'ytd', name: 'Year to Date' },
];

// Sample data for charts
const monthlyTrendData = [
  { month: 'Jan', value: 450000 },
  { month: 'Feb', value: 460000 },
  { month: 'Mar', value: 470000 },
  { month: 'Apr', value: 465000 },
  { month: 'May', value: 480000 },
  { month: 'Jun', value: 490000 },
  { month: 'Jul', value: 495000 },
  { month: 'Aug', value: 500000 },
  { month: 'Sep', value: 510000 },
  { month: 'Oct', value: 520000 },
  { month: 'Nov', value: 525000 },
  { month: 'Dec', value: 530000 },
];

const yearlyTrendData = [
  { year: '2020', value: 420000 },
  { year: '2021', value: 440000 },
  { year: '2022', value: 455000 },
  { year: '2023', value: 470000 },
  { year: '2024', value: 485000 },
  { year: '2025', value: 495000 },
];

const TrendAnalysisPage = () => {
  const [selectedRegion, setSelectedRegion] = useState('richland');
  const [selectedPropertyType, setSelectedPropertyType] = useState('residential');
  const [selectedTimePeriod, setSelectedTimePeriod] = useState('1y');
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-blue-100">Trend Analysis</h1>
        <Button variant="outline" className="text-blue-200 border-blue-700">
          <Download className="mr-2 h-4 w-4" />
          Export Data
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {trendMetrics.map((metric) => (
          <Card key={metric.id} className="bg-blue-900/30 border-blue-800/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-blue-100 text-sm">{metric.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div className="text-2xl font-bold text-blue-100">{metric.value}</div>
                <div className={`text-sm flex items-center ${
                  metric.change.startsWith('+') ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  <TrendingUp className={`h-3 w-3 mr-1 ${
                    metric.change.startsWith('-') ? 'transform rotate-180' : ''
                  }`} />
                  {metric.change} <span className="text-blue-400 ml-1">{metric.period}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-blue-900/30 border-blue-800/40">
        <CardHeader>
          <CardTitle className="text-blue-100">Trend Analysis Dashboard</CardTitle>
          <CardDescription className="text-blue-300">
            Analyze historical valuation trends across regions and property types.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-blue-200">Region</Label>
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger className="bg-blue-900/50 border-blue-700/50 text-blue-100">
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent className="bg-blue-900 border-blue-700 text-blue-200">
                  {regions.map((region) => (
                    <SelectItem key={region.id} value={region.id}>
                      {region.name} ({region.hoodCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-blue-200">Property Type</Label>
              <Select value={selectedPropertyType} onValueChange={setSelectedPropertyType}>
                <SelectTrigger className="bg-blue-900/50 border-blue-700/50 text-blue-100">
                  <SelectValue placeholder="Select property type" />
                </SelectTrigger>
                <SelectContent className="bg-blue-900 border-blue-700 text-blue-200">
                  {propertyTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-blue-200">Time Period</Label>
              <Select value={selectedTimePeriod} onValueChange={setSelectedTimePeriod}>
                <SelectTrigger className="bg-blue-900/50 border-blue-700/50 text-blue-100">
                  <SelectValue placeholder="Select time period" />
                </SelectTrigger>
                <SelectContent className="bg-blue-900 border-blue-700 text-blue-200">
                  {timePeriods.map((period) => (
                    <SelectItem key={period.id} value={period.id}>
                      {period.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs defaultValue="monthly" className="space-y-4">
            <TabsList className="bg-blue-900/50 border border-blue-800/40">
              <TabsTrigger value="monthly" className="data-[state=active]:bg-blue-800/50">
                <Calendar className="h-4 w-4 mr-2" />
                Monthly
              </TabsTrigger>
              <TabsTrigger value="yearly" className="data-[state=active]:bg-blue-800/50">
                <BarChart3 className="h-4 w-4 mr-2" />
                Yearly
              </TabsTrigger>
              <TabsTrigger value="comparison" className="data-[state=active]:bg-blue-800/50">
                <LineChart className="h-4 w-4 mr-2" />
                Regional Comparison
              </TabsTrigger>
              <TabsTrigger value="insights" className="data-[state=active]:bg-blue-800/50">
                <Zap className="h-4 w-4 mr-2" />
                AI Insights
              </TabsTrigger>
            </TabsList>

            <TabsContent value="monthly" className="space-y-4">
              <div className="bg-blue-900/20 border border-blue-800/40 rounded-lg p-4">
                <h3 className="text-blue-100 text-lg font-medium mb-4">Monthly Trend - {propertyTypes.find(t => t.id === selectedPropertyType)?.name} in {regions.find(r => r.id === selectedRegion)?.name}</h3>
                <div className="h-[400px]">
                  <MonthlyTrendChart data={monthlyTrendData} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-900/20 border border-blue-800/40 rounded-lg p-4">
                  <h4 className="text-blue-100 font-medium mb-2">Average Value</h4>
                  <div className="text-2xl font-bold text-blue-100 mb-1">$485,000</div>
                  <div className="text-sm text-blue-400">For selected period</div>
                </div>
                <div className="bg-blue-900/20 border border-blue-800/40 rounded-lg p-4">
                  <h4 className="text-blue-100 font-medium mb-2">Growth Rate</h4>
                  <div className="text-2xl font-bold text-emerald-400 mb-1">+5.8%</div>
                  <div className="text-sm text-blue-400">Month over month</div>
                </div>
                <div className="bg-blue-900/20 border border-blue-800/40 rounded-lg p-4">
                  <h4 className="text-blue-100 font-medium mb-2">Transactions</h4>
                  <div className="text-2xl font-bold text-blue-100 mb-1">245</div>
                  <div className="text-sm text-blue-400">In selected period</div>
                </div>
                <div className="bg-blue-900/20 border border-blue-800/40 rounded-lg p-4">
                  <h4 className="text-blue-100 font-medium mb-2">Volatility</h4>
                  <div className="text-2xl font-bold text-blue-100 mb-1">Low</div>
                  <div className="text-sm text-blue-400">Stable trend detected</div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="yearly" className="space-y-4">
              <div className="bg-blue-900/20 border border-blue-800/40 rounded-lg p-4">
                <h3 className="text-blue-100 text-lg font-medium mb-4">Yearly Trend - {propertyTypes.find(t => t.id === selectedPropertyType)?.name} in {regions.find(r => r.id === selectedRegion)?.name}</h3>
                <div className="h-[400px]">
                  <YearlyTrendChart data={yearlyTrendData} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-900/20 border border-blue-800/40 rounded-lg p-4">
                  <h4 className="text-blue-100 font-medium mb-2">5-Year Growth</h4>
                  <div className="text-2xl font-bold text-emerald-400 mb-1">+17.8%</div>
                  <div className="text-sm text-blue-400">From 2020 to 2025</div>
                </div>
                <div className="bg-blue-900/20 border border-blue-800/40 rounded-lg p-4">
                  <h4 className="text-blue-100 font-medium mb-2">Annual Growth Rate</h4>
                  <div className="text-2xl font-bold text-blue-100 mb-1">+3.3%</div>
                  <div className="text-sm text-blue-400">Average per year</div>
                </div>
                <div className="bg-blue-900/20 border border-blue-800/40 rounded-lg p-4">
                  <h4 className="text-blue-100 font-medium mb-2">Forecast 2026</h4>
                  <div className="text-2xl font-bold text-blue-100 mb-1">$510,000</div>
                  <div className="text-sm text-blue-400">Based on current trends</div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="comparison" className="space-y-4">
              <div className="bg-blue-900/20 border border-blue-800/40 rounded-lg p-4">
                <h3 className="text-blue-100 text-lg font-medium mb-4">Regional Comparison - {propertyTypes.find(t => t.id === selectedPropertyType)?.name} Properties</h3>
                <div className="h-[400px]">
                  <RegionalComparisonChart />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-900/20 border border-blue-800/40 rounded-lg p-4">
                  <h4 className="text-blue-100 font-medium mb-2">Growth Rate by Region</h4>
                  <div className="space-y-2 mt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-blue-200">Richland</span>
                      <div className="flex items-center">
                        <span className="text-emerald-400 mr-2">+6.8%</span>
                        <div className="w-32 h-2 bg-blue-900/70 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: '68%' }}></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-blue-200">Kennewick</span>
                      <div className="flex items-center">
                        <span className="text-emerald-400 mr-2">+5.2%</span>
                        <div className="w-32 h-2 bg-blue-900/70 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: '52%' }}></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-blue-200">Prosser</span>
                      <div className="flex items-center">
                        <span className="text-emerald-400 mr-2">+3.5%</span>
                        <div className="w-32 h-2 bg-blue-900/70 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: '35%' }}></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-blue-200">West Richland</span>
                      <div className="flex items-center">
                        <span className="text-emerald-400 mr-2">+7.1%</span>
                        <div className="w-32 h-2 bg-blue-900/70 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: '71%' }}></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-blue-200">Benton City</span>
                      <div className="flex items-center">
                        <span className="text-emerald-400 mr-2">+4.2%</span>
                        <div className="w-32 h-2 bg-blue-900/70 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: '42%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-900/20 border border-blue-800/40 rounded-lg p-4">
                  <h4 className="text-blue-100 font-medium mb-2">Average Value by Region</h4>
                  <div className="h-56">
                    <RegionalValuesChart />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="insights" className="space-y-4">
              <Card className="bg-blue-900/20 border-blue-800/40">
                <CardHeader>
                  <CardTitle className="text-blue-100">AI-Generated Insights</CardTitle>
                  <CardDescription className="text-blue-300">
                    Automatically generated analysis based on selected parameters.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-blue-800/30 p-4 rounded-lg border border-blue-700/40">
                      <div className="flex items-center mb-2">
                        <Zap className="h-5 w-5 text-amber-400 mr-2" />
                        <h3 className="text-blue-100 font-medium">Key Findings</h3>
                      </div>
                      <p className="text-blue-200 mb-2">
                        {propertyTypes.find(t => t.id === selectedPropertyType)?.name} properties in {regions.find(r => r.id === selectedRegion)?.name} have shown a steady growth trend over the selected time period. The annual growth rate of 5.8% exceeds the county average of 4.3%.
                      </p>
                      <p className="text-blue-200">
                        Market indicators suggest continued growth in this region, with West Richland showing the strongest momentum at +7.1% year over year.
                      </p>
                    </div>

                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="growth-drivers" className="border-blue-800/40">
                        <AccordionTrigger className="text-blue-100 hover:text-blue-50 hover:no-underline">
                          Growth Drivers
                        </AccordionTrigger>
                        <AccordionContent className="text-blue-200">
                          <ul className="list-disc list-inside space-y-1">
                            <li>New commercial development in the northwest sector (+8.2%)</li>
                            <li>Infrastructure improvements along major corridors</li>
                            <li>Increased demand for mid-range residential properties</li>
                            <li>Limited inventory in key neighborhoods driving valuation increases</li>
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="regional-patterns" className="border-blue-800/40">
                        <AccordionTrigger className="text-blue-100 hover:text-blue-50 hover:no-underline">
                          Regional Patterns
                        </AccordionTrigger>
                        <AccordionContent className="text-blue-200">
                          <p className="mb-2">Strong correlation between proximity to major employers and valuation increases. The following patterns were detected:</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Properties within 5 miles of major tech employers show +8.5% growth</li>
                            <li>Waterfront adjacency carries a 22% premium across all regions</li>
                            <li>Commercial properties near highway interchanges showing accelerated growth</li>
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="projections" className="border-blue-800/40">
                        <AccordionTrigger className="text-blue-100 hover:text-blue-50 hover:no-underline">
                          Forward Projections
                        </AccordionTrigger>
                        <AccordionContent className="text-blue-200">
                          <p className="mb-2">Based on historical data and current market conditions, the AI forecasts:</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Continued growth of 4-6% annually for the next 2 years</li>
                            <li>Potential moderation to 3-4% in years 3-5</li>
                            <li>Emerging opportunity in mixed-use developments in downtown areas</li>
                            <li>Recommended reassessment priority for commercial properties in rapidly appreciating corridors</li>
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

// Chart components for visualization
const MonthlyTrendChart = ({ data }) => {
  const max = Math.max(...data.map(item => item.value)) * 1.1;
  
  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-x-0 bottom-0 h-1 border-t border-blue-800/40"></div>
      <div className="absolute inset-y-0 left-0 w-1 border-r border-blue-800/40"></div>
      
      <div className="absolute inset-0 flex flex-col">
        <div className="flex-1 flex items-end">
          <div className="w-full h-full pr-6 pb-8 relative">
            <svg viewBox="0 0 900 300" className="w-full h-full">
              <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(59, 130, 246, 0.5)" />
                  <stop offset="100%" stopColor="rgba(59, 130, 246, 0)" />
                </linearGradient>
              </defs>
              
              {/* Create path from data points */}
              <path 
                d={`
                  M${data.map((item, index) => `${(index / (data.length - 1)) * 900},${300 - (item.value / max) * 300}`).join(' L')}
                `}
                stroke="#3b82f6"
                strokeWidth="3"
                fill="none"
                className="drop-shadow-md"
              />
              
              {/* Fill area under the line */}
              <path 
                d={`
                  M0,300 
                  ${data.map((item, index) => `L${(index / (data.length - 1)) * 900},${300 - (item.value / max) * 300}`).join(' ')}
                  L900,300 Z
                `}
                fill="url(#lineGradient)"
                opacity="0.5"
              />
              
              {/* Data points */}
              {data.map((item, index) => (
                <circle
                  key={index}
                  cx={(index / (data.length - 1)) * 900}
                  cy={300 - (item.value / max) * 300}
                  r="4"
                  fill="#3b82f6"
                  stroke="#0f172a"
                  strokeWidth="2"
                />
              ))}
            </svg>
            
            {/* X-axis labels */}
            <div className="absolute bottom-0 inset-x-0 flex justify-between px-2 text-xs text-blue-400">
              {data.map((item, index) => (
                <span key={index} style={{ position: 'absolute', left: `${(index / (data.length - 1)) * 100}%`, transform: 'translateX(-50%)' }}>
                  {item.month}
                </span>
              ))}
            </div>
            
            {/* Y-axis labels */}
            <div className="absolute left-0 inset-y-0 flex flex-col justify-between py-2 text-xs text-blue-400">
              <span>$600k</span>
              <span>$500k</span>
              <span>$400k</span>
              <span>$300k</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const YearlyTrendChart = ({ data }) => {
  return (
    <div className="h-full w-full flex items-end">
      {data.map((item, index) => (
        <div 
          key={index}
          className="flex-1 mx-2 h-full flex flex-col justify-end items-center"
        >
          <div 
            className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-md relative group"
            style={{ 
              height: `${(item.value / 500000) * 100}%`,
              minHeight: '30px'
            }}
          >
            <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 transform -translate-x-1/2 bg-blue-900 text-blue-100 px-2 py-1 rounded text-xs whitespace-nowrap transition-opacity">
              ${item.value.toLocaleString()}
            </div>
          </div>
          <span className="text-xs text-blue-300 mt-2">{item.year}</span>
        </div>
      ))}
    </div>
  );
};

const RegionalComparisonChart = () => {
  return (
    <div className="h-full w-full flex items-center justify-center">
      <div className="text-center text-blue-300">
        <svg viewBox="0 0 900 300" className="w-full h-full">
          <defs>
            <linearGradient id="richlandGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#60a5fa" />
            </linearGradient>
            <linearGradient id="kennewickGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#a78bfa" />
            </linearGradient>
            <linearGradient id="prosserGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
            <linearGradient id="westRichlandGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>
            <linearGradient id="bentonCityGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#f87171" />
            </linearGradient>
          </defs>
          
          {/* Richland */}
          <path 
            d="M0,250 C50,230 100,220 150,200 C200,180 250,170 300,160 C350,150 400,145 450,130 C500,115 550,105 600,90 C650,75 700,70 750,60 C800,50 850,45 900,40"
            fill="none"
            stroke="url(#richlandGradient)"
            strokeWidth="3"
            className="drop-shadow-md"
          />
          
          {/* Kennewick */}
          <path 
            d="M0,260 C50,245 100,235 150,225 C200,215 250,205 300,195 C350,185 400,180 450,170 C500,160 550,150 600,145 C650,140 700,135 750,130 C800,125 850,120 900,115"
            fill="none"
            stroke="url(#kennewickGradient)"
            strokeWidth="3"
            className="drop-shadow-md"
          />
          
          {/* Prosser */}
          <path 
            d="M0,270 C50,265 100,260 150,255 C200,250 250,245 300,240 C350,235 400,230 450,225 C500,220 550,215 600,210 C650,205 700,200 750,195 C800,190 850,185 900,180"
            fill="none"
            stroke="url(#prosserGradient)"
            strokeWidth="3"
            className="drop-shadow-md"
          />
          
          {/* West Richland */}
          <path 
            d="M0,240 C50,225 100,210 150,195 C200,180 250,170 300,155 C350,140 400,130 450,115 C500,100 550,90 600,80 C650,70 700,65 750,55 C800,45 850,40 900,30"
            fill="none"
            stroke="url(#westRichlandGradient)"
            strokeWidth="3"
            className="drop-shadow-md"
          />
          
          {/* Benton City */}
          <path 
            d="M0,265 C50,255 100,250 150,240 C200,230 250,225 300,220 C350,215 400,210 450,205 C500,200 550,195 600,190 C650,185 700,180 750,175 C800,170 850,165 900,160"
            fill="none"
            stroke="url(#bentonCityGradient)"
            strokeWidth="3"
            className="drop-shadow-md"
          />
          
          {/* X-axis */}
          <line x1="0" y1="300" x2="900" y2="300" stroke="#334155" strokeWidth="1" />
          
          {/* Legend */}
          <g transform="translate(700, 30)">
            <rect x="0" y="0" width="10" height="10" fill="#3b82f6" />
            <text x="15" y="9" fill="#94a3b8" fontSize="10">Richland</text>
            
            <rect x="0" y="20" width="10" height="10" fill="#8b5cf6" />
            <text x="15" y="29" fill="#94a3b8" fontSize="10">Kennewick</text>
            
            <rect x="0" y="40" width="10" height="10" fill="#10b981" />
            <text x="15" y="49" fill="#94a3b8" fontSize="10">Prosser</text>
            
            <rect x="0" y="60" width="10" height="10" fill="#f59e0b" />
            <text x="15" y="69" fill="#94a3b8" fontSize="10">West Richland</text>
            
            <rect x="0" y="80" width="10" height="10" fill="#ef4444" />
            <text x="15" y="89" fill="#94a3b8" fontSize="10">Benton City</text>
          </g>
        </svg>
      </div>
    </div>
  );
};

const RegionalValuesChart = () => {
  return (
    <div className="h-full w-full flex items-end justify-between px-4">
      <div className="flex flex-col items-center">
        <div className="h-40 w-16 bg-gradient-to-t from-blue-700 to-blue-500 rounded-t-md"></div>
        <div className="mt-2 text-center">
          <div className="text-xs text-blue-300">Richland</div>
          <div className="text-sm font-semibold text-blue-200">$520K</div>
        </div>
      </div>
      <div className="flex flex-col items-center">
        <div className="h-32 w-16 bg-gradient-to-t from-indigo-700 to-indigo-500 rounded-t-md"></div>
        <div className="mt-2 text-center">
          <div className="text-xs text-blue-300">Kennewick</div>
          <div className="text-sm font-semibold text-blue-200">$480K</div>
        </div>
      </div>
      <div className="flex flex-col items-center">
        <div className="h-24 w-16 bg-gradient-to-t from-emerald-700 to-emerald-500 rounded-t-md"></div>
        <div className="mt-2 text-center">
          <div className="text-xs text-blue-300">Prosser</div>
          <div className="text-sm font-semibold text-blue-200">$420K</div>
        </div>
      </div>
      <div className="flex flex-col items-center">
        <div className="h-44 w-16 bg-gradient-to-t from-amber-700 to-amber-500 rounded-t-md"></div>
        <div className="mt-2 text-center">
          <div className="text-xs text-blue-300">W. Richland</div>
          <div className="text-sm font-semibold text-blue-200">$540K</div>
        </div>
      </div>
      <div className="flex flex-col items-center">
        <div className="h-28 w-16 bg-gradient-to-t from-red-700 to-red-500 rounded-t-md"></div>
        <div className="mt-2 text-center">
          <div className="text-xs text-blue-300">Benton City</div>
          <div className="text-sm font-semibold text-blue-200">$450K</div>
        </div>
      </div>
    </div>
  );
};

export default TrendAnalysisPage;
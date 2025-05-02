import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from 'date-fns';
import { Clock, Database, Info, Lightbulb, Layers, BarChart3 } from 'lucide-react';
import { StoryInsight, StoryType } from '@/hooks/useStorytellingAPI';

interface StoryDisplayProps {
  story: StoryInsight;
}

export function StoryDisplay({ story }: StoryDisplayProps) {
  // Format metadata
  const formattedDate = story.metadata.generatedAt instanceof Date 
    ? format(story.metadata.generatedAt, 'MMM d, yyyy h:mm a')
    : format(new Date(story.metadata.generatedAt), 'MMM d, yyyy h:mm a');
  
  // Get confidence level description
  const getConfidenceLevel = (score: number) => {
    if (score >= 0.8) return { label: 'High', color: 'bg-green-100 text-green-800' };
    if (score >= 0.5) return { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Low', color: 'bg-red-100 text-red-800' };
  };
  
  const confidenceLevel = getConfidenceLevel(story.metadata.confidenceScore);
  
  // Get story type friendly name
  const getStoryTypeName = (type: StoryType) => {
    switch (type) {
      case StoryType.COST_TRENDS: return 'Cost Trends';
      case StoryType.REGIONAL_COMPARISON: return 'Regional Comparison';
      case StoryType.BUILDING_TYPE_ANALYSIS: return 'Building Type Analysis';
      case StoryType.PROPERTY_INSIGHTS: return 'Property Insights';
      case StoryType.IMPROVEMENT_ANALYSIS: return 'Improvement Analysis';
      case StoryType.INFRASTRUCTURE_HEALTH: return 'Infrastructure Health';
      case StoryType.CUSTOM: return 'Custom Analysis';
      default: return 'Analysis';
    }
  };

  // Split narrative into paragraphs
  const paragraphs = story.narrative.split('\n\n').filter(p => p.trim().length > 0);
  
  return (
    <Card className="shadow-lg border-0">
      <CardHeader className="border-b bg-[#f8fafc]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-2xl text-[#243E4D]">{story.title}</CardTitle>
            <CardDescription className="mt-1 flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>Generated on {formattedDate}</span>
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-[#29B7D3] hover:bg-[#29B7D3]/90">
              {getStoryTypeName(story.metadata.storyType)}
            </Badge>
            <Badge variant="outline" className={confidenceLevel.color}>
              {confidenceLevel.label} Confidence
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="py-6">
        <div className="prose max-w-none">
          {paragraphs.map((paragraph, index) => (
            <p key={index} className="text-gray-700 mb-4">
              {paragraph}
            </p>
          ))}

          {story.charts && story.charts.length > 0 && (
            <div className="my-8">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <BarChart3 className="h-5 w-5 text-[#29B7D3]" />
                Key Visualizations
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {story.charts.map((chart, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 border">
                    <div className="aspect-video h-64 flex items-center justify-center">
                      <div className="text-center">
                        <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                          <BarChart3 className="h-8 w-8 text-blue-600" />
                        </div>
                        <p className="text-gray-500">Chart visualization would appear here</p>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-600 text-center">
                      Chart {index + 1}: {chart.title || `Visualization ${index + 1}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {story.tables && story.tables.length > 0 && (
            <div className="my-8">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <Layers className="h-5 w-5 text-[#29B7D3]" />
                Data Tables
              </h3>
              <div className="overflow-x-auto">
                {story.tables.map((table, index) => (
                  <div key={index} className="mb-6">
                    <div className="font-medium mb-2">{table.title || `Table ${index + 1}`}</div>
                    <div className="bg-gray-50 rounded-lg p-2 border">
                      <div className="text-center p-8">
                        <p className="text-gray-500">Table data would appear here</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="bg-[#f8fafc] border-t flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-sm">
        <div className="flex items-center">
          <Info className="h-4 w-4 mr-2 text-gray-500" />
          <span className="text-gray-500">Analyzed {story.metadata.dataPoints} data points</span>
        </div>
        
        <div className="flex flex-col">
          <div className="flex items-center mb-1">
            <Database className="h-4 w-4 mr-2 text-gray-500" />
            <span className="text-gray-500">Data Sources:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {story.metadata.sources.map((source, index) => (
              <Badge key={index} variant="outline" className="bg-[#e6eef2] text-[#243E4D] border-none">
                {source}
              </Badge>
            ))}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

export default StoryDisplay;
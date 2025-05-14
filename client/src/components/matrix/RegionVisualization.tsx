import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { loadCostFactorsData } from '@/lib/utils/loadCostFactors';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Map, 
  FileBarChart, 
  Home, 
  GanttChart, 
  Pin, 
  RefreshCw, 
  AlertCircle 
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Interface for region information
interface RegionInfo {
  id: string;
  category: string;
  factor: number;
  description: string;
}

interface RegionVisualizationProps {
  regionId?: string; // Optional - will highlight this region if provided
  compact?: boolean; // If true, show a more compact version of the visualization
  showTitle?: boolean; // If true, show the title card
  highlightCategories?: string[]; // Categories to highlight
}

const RegionVisualization: React.FC<RegionVisualizationProps> = ({
  regionId,
  compact = false,
  showTitle = true,
  highlightCategories = []
}) => {
  // Load cost factors data
  const { data: costFactors, isLoading, error } = useQuery({
    queryKey: ['costFactorsData'],
    queryFn: loadCostFactorsData,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Process region data for display
  const getRegionCategory = (regionId: string): string => {
    if (regionId.match(/^\d+N-\d+E$/)) {
      return 'Township-Range';
    } else if (regionId.match(/^\d{4}/)) {
      return 'TCA';
    } else if (regionId.includes(' ')) {
      return 'Hood Code';
    } else if (['Richland', 'Kennewick', 'Prosser', 'West Richland', 'Benton City', 'Finley', 'Paterson', 'Plymouth'].includes(regionId)) {
      return 'City';
    } else {
      return 'Other';
    }
  };

  const getRegionDescription = (regionId: string): string => {
    const cityDescriptions: Record<string, string> = {
      'Richland': 'City of Richland, WA',
      'Kennewick': 'City of Kennewick, WA',
      'Prosser': 'City of Prosser, WA',
      'West Richland': 'City of West Richland, WA',
      'Benton City': 'City of Benton City, WA',
      'Finley': 'Finley area (unincorporated)',
      'Paterson': 'Paterson area (unincorporated)',
      'Plymouth': 'Plymouth area (unincorporated)'
    };

    if (cityDescriptions[regionId]) {
      return cityDescriptions[regionId];
    }

    if (regionId.match(/^\d+N-\d+E$/)) {
      return `Township ${regionId} area in Benton County`;
    } 
    
    if (regionId.match(/^\d{4}/)) {
      return `Tax Code Area ${regionId}`;
    }
    
    if (regionId.includes(' ')) {
      const hoodCodeMatches: Record<string, string> = {
        '52100 001': 'West Benton Area (Hood Code)',
        '52100 010': 'Plymouth Area (Hood Code)',
        '52100 100': 'Richland Area (Hood Code)',
        '52100 140': 'Kennewick Area (Hood Code)',
        '52100 240': 'Prosser Area (Hood Code)',
        '52100 200': 'Rural Area (Hood Code)',
        '530300 002': 'Benton City Area (Hood Code)',
        '530300 001': 'Benton City Area (Hood Code)',
        '530300 500': 'Prosser Area (Hood Code)',
        '530200 100': 'West Richland Area (Hood Code)',
        '530200 120': 'Richland Area (Hood Code)',
        '530200 140': 'Kennewick Area (Hood Code)',
        '530200 401': 'West Richland Area (Hood Code)',
        '540100 001': 'Finley Area (Hood Code)',
        '540200 001': 'Finley Area (Hood Code)',
        '540200 100': 'Paterson Area (Hood Code)',
      };

      return hoodCodeMatches[regionId] || `Hood Code ${regionId}`;
    }

    return `Region code ${regionId}`;
  };

  const processedRegions: RegionInfo[] = useMemo(() => {
    if (!costFactors?.regionFactors) return [];
    
    return Object.entries(costFactors.regionFactors).map(([id, factor]) => ({
      id,
      category: getRegionCategory(id),
      factor: factor as number,
      description: getRegionDescription(id)
    }));
  }, [costFactors]);

  // Group regions by category
  const regionsByCategory = useMemo(() => {
    const grouped: Record<string, RegionInfo[]> = {};
    
    processedRegions.forEach(region => {
      if (!grouped[region.category]) {
        grouped[region.category] = [];
      }
      grouped[region.category].push(region);
    });
    
    return grouped;
  }, [processedRegions]);

  // Get categories in order of importance
  const orderedCategories = ['City', 'TCA', 'Hood Code', 'Township-Range', 'Other'];

  // Get the color for each category
  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'City':
        return 'bg-blue-500 text-white hover:bg-blue-600 border-blue-700 shadow-sm';
      case 'TCA':
        return 'bg-amber-500 text-white hover:bg-amber-600 border-amber-700 shadow-sm';
      case 'Hood Code':
        return 'bg-emerald-500 text-white hover:bg-emerald-600 border-emerald-700 shadow-sm';
      case 'Township-Range':
        return 'bg-purple-500 text-white hover:bg-purple-600 border-purple-700 shadow-sm';
      default:
        return 'bg-gray-500 text-white hover:bg-gray-600 border-gray-700 shadow-sm';
    }
  };

  // Get category icon
  const getCategoryIcon = (category: string): React.ReactNode => {
    switch (category) {
      case 'City':
        return <Home className="h-4 w-4" />;
      case 'TCA':
        return <GanttChart className="h-4 w-4" />;
      case 'Hood Code':
        return <Pin className="h-4 w-4" />;
      case 'Township-Range':
        return <Map className="h-4 w-4" />;
      default:
        return <FileBarChart className="h-4 w-4" />;
    }
  };

  // If we're loading, show a loading state
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <Alert>
          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
          <AlertTitle>Loading Region Data</AlertTitle>
          <AlertDescription>
            Retrieving the latest Benton County region data...
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // If there's an error, show an error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4 mr-2" />
        <AlertTitle>Error Loading Region Data</AlertTitle>
        <AlertDescription>
          There was a problem loading the region data.
        </AlertDescription>
      </Alert>
    );
  }

  // If there's no data, show a message
  if (!costFactors || !processedRegions.length) {
    return (
      <Alert>
        <AlertTitle>No Region Data Available</AlertTitle>
        <AlertDescription>
          No region information could be found.
        </AlertDescription>
      </Alert>
    );
  }

  // Render the visualization
  return (
    <div className="space-y-4">
      {showTitle && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Map className="h-5 w-5 text-primary" />
              Benton County Region Identifiers
            </CardTitle>
            <CardDescription>
              The four types of region identifiers used in Benton County assessments
            </CardDescription>
          </CardHeader>
        </Card>
      )}
      
      <div className={`grid ${compact ? 'grid-cols-2 gap-2' : 'grid-cols-1 gap-4'}`}>
        {orderedCategories.map(category => {
          if (!regionsByCategory[category]) return null;
          
          const isHighlighted = highlightCategories.includes(category);
          
          return (
            <Card 
              key={category}
              className={isHighlighted ? 'border-primary' : ''}
            >
              <CardHeader className={compact ? 'p-3' : 'p-4'}>
                <CardTitle className={`${compact ? 'text-sm' : 'text-md'} flex items-center gap-2 font-medium`}>
                  <span className="text-primary">{getCategoryIcon(category)}</span>
                  {category} Identifiers
                </CardTitle>
              </CardHeader>
              <CardContent className={compact ? 'p-3 pt-0' : 'p-4 pt-0'}>
                <div className="flex flex-wrap gap-1.5">
                  {regionsByCategory[category].slice(0, compact ? 5 : 10).map(region => (
                    <Badge 
                      key={region.id} 
                      variant="outline"
                      className={`
                        ${getCategoryColor(category)} 
                        ${region.id === regionId ? 'ring-2 ring-primary' : ''}
                        text-xs font-mono
                      `}
                    >
                      {region.id}
                    </Badge>
                  ))}
                  {regionsByCategory[category].length > (compact ? 5 : 10) && (
                    <Badge 
                      variant="outline" 
                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 border-slate-400 shadow-sm dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-600"
                    >
                      +{regionsByCategory[category].length - (compact ? 5 : 10)} more
                    </Badge>
                  )}
                </div>
                <p className={`text-xs text-muted-foreground mt-2 ${compact ? 'line-clamp-2' : ''} italic`}>
                  {category === 'City' && 'Incorporated municipalities like Richland, Kennewick, etc.'}
                  {category === 'TCA' && 'Tax Code Areas are numeric codes like 1111H, 1210 designating tax jurisdictions.'}
                  {category === 'Hood Code' && 'Neighborhood identifiers in format "52100 100" representing assessment areas.'}
                  {category === 'Township-Range' && 'Public Land Survey System coordinates (e.g., "10N-24E") marking geographic areas.'}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default RegionVisualization;
/**
 * Natural Language Query Interface (NLQI)
 * 
 * This component provides a natural language interface for querying building cost data.
 * It integrates with OpenAI API to convert natural language queries into structured database queries,
 * and displays the results in an appropriate visualization.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useVisualizationContext } from '@/contexts/visualization-context';

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Alert,
  AlertDescription,
  AlertTitle
} from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';

// Icons
import {
  Search,
  BarChart4,
  PieChart,
  History,
  Clock,
  MessageSquare,
  Zap,
  Lightbulb,
  Info,
  X,
  Maximize2,
  Download
} from 'lucide-react';

// Visualization Components (will be used based on query result type)
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Result types
interface QueryResult {
  results: any[];
  interpretation: {
    entities: string[];
    timeRange: string | null;
    metric: string;
    operation: string;
  };
  summary: string;
  chartType?: 'bar' | 'line' | 'pie' | 'table';
}

interface QueryHistoryItem {
  id: string;
  query: string;
  timestamp: Date;
  successful: boolean;
}

export function NaturalLanguageQueryInterface() {
  // State
  const [query, setQuery] = useState('');
  const [selectedQuery, setSelectedQuery] = useState<QueryResult | null>(null);
  const [queryHistory, setQueryHistory] = useState<QueryHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedView, setExpandedView] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Context for filters
  const { filters, setFilters } = useVisualizationContext();
  
  // Example queries
  const exampleQueries = [
    "What is the average cost per square foot for residential buildings?",
    "Compare costs between Eastern and Western regions",
    "Show me the trend of commercial building costs over the last 5 years",
    "What building types are most expensive in the Northern region?",
    "Which regions have the highest variance in construction costs?"
  ];
  
  // Query mutation
  const {
    mutate: submitQuery,
    isPending,
    isError,
    error,
    data: queryResult
  } = useMutation<QueryResult, Error, void, unknown>({
    mutationFn: async () => {
      // Add any active filters from context to the query payload
      const payload = {
        query,
        filters
      };
      
      const response = await apiRequest('/api/nlp/query', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      return response.json();
    },
    onSuccess: (data) => {
      // Add to history
      addToHistory(query, true);
      
      // Set result
      setSelectedQuery(data);
      
      // Apply filters based on entities if available
      if (data.interpretation && data.interpretation.entities.length > 0) {
        const newFilters = filters ? { ...filters } : {};
        
        // Extract building types and regions from entities
        const buildingTypeEntities = data.interpretation.entities.filter(entity => 
          ['residential', 'commercial', 'industrial', 'retail'].includes(entity.toLowerCase())
        );
        
        const regionEntities = data.interpretation.entities.filter(entity => 
          ['eastern', 'western', 'northern', 'southern'].includes(entity.toLowerCase())
        );
        
        if (buildingTypeEntities.length > 0) {
          newFilters.buildingTypes = buildingTypeEntities;
        }
        
        if (regionEntities.length > 0) {
          newFilters.regions = regionEntities;
        }
        
        // Apply filters if we identified any
        if (buildingTypeEntities.length > 0 || regionEntities.length > 0) {
          setFilters(newFilters);
        }
      }
    },
    onError: (error) => {
      console.error('Query error:', error);
      addToHistory(query, false);
    }
  });
  
  // Add to query history
  const addToHistory = (queryText: string, successful: boolean) => {
    const newHistoryItem: QueryHistoryItem = {
      id: Date.now().toString(),
      query: queryText,
      timestamp: new Date(),
      successful
    };
    
    setQueryHistory(prev => [newHistoryItem, ...prev.slice(0, 19)]);
  };
  
  // Handle query submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    submitQuery();
  };
  
  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('nlq_history');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setQueryHistory(parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        })));
      } catch (error) {
        console.error('Error loading query history:', error);
      }
    }
  }, []);
  
  // Save history to localStorage when it changes
  useEffect(() => {
    if (queryHistory.length > 0) {
      localStorage.setItem('nlq_history', JSON.stringify(queryHistory));
    }
  }, [queryHistory]);
  
  // Handle example query click
  const handleExampleClick = (exampleQuery: string) => {
    setQuery(exampleQuery);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  // Handle history item click
  const handleHistoryItemClick = (historyItem: QueryHistoryItem) => {
    setQuery(historyItem.query);
    setShowHistory(false);
  };
  
  // Clear query history
  const clearHistory = () => {
    setQueryHistory([]);
    localStorage.removeItem('nlq_history');
  };
  
  // Render chart based on query result
  const renderChart = () => {
    if (!selectedQuery || !selectedQuery.results || selectedQuery.results.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-md">
          <p className="text-gray-500">No data available for visualization</p>
        </div>
      );
    }
    
    // Determine chart type from result or default to bar
    const chartType = selectedQuery.chartType || 'bar';
    
    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={selectedQuery.results}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#4f46e5" />
            </BarChart>
          </ResponsiveContainer>
        );
        
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={selectedQuery.results}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#4f46e5" activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        );
        
      case 'table':
      default:
        return (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  {Object.keys(selectedQuery.results[0]).map(key => (
                    <th key={key} className="p-2 border text-left font-medium text-gray-700">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {selectedQuery.results.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {Object.values(item).map((value, i) => (
                      <td key={i} className="p-2 border">
                        {typeof value === 'number' 
                          ? new Intl.NumberFormat('en-US', {
                              style: value > 100 ? 'currency' : 'decimal',
                              currency: 'USD',
                              maximumFractionDigits: 2
                            }).format(value)
                          : String(value)
                        }
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
    }
  };
  
  // Render interpretation badges
  const renderInterpretationBadges = () => {
    if (!selectedQuery || !selectedQuery.interpretation) return null;
    
    const { entities, metric, operation } = selectedQuery.interpretation;
    
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {entities.map((entity, i) => (
          <Badge key={i} variant="outline" className="bg-blue-50">
            {entity}
          </Badge>
        ))}
        
        <Badge variant="outline" className="bg-purple-50">
          metric: {metric}
        </Badge>
        
        <Badge variant="outline" className="bg-amber-50">
          operation: {operation}
        </Badge>
      </div>
    );
  };
  
  // Format relative time
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };
  
  return (
    <Card className={`shadow-md ${expandedView ? 'fixed inset-4 z-50 overflow-auto' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Natural Language Query
            </CardTitle>
            <CardDescription>
              Ask questions about building costs in natural language
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="gap-1"
            >
              <History className="h-4 w-4" />
              History
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpandedView(!expandedView)}
            >
              {expandedView ? <X className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="Ask a question about building costs..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10"
                ref={inputRef}
                disabled={isPending}
              />
              <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
            </div>
            <Button type="submit" disabled={isPending || !query.trim()}>
              {isPending ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Analyzing
                </>
              ) : 'Search'}
            </Button>
          </div>
        </form>
        
        {/* Example queries */}
        {!selectedQuery && !isPending && (
          <div className="space-y-3 mb-6">
            <h3 className="text-sm font-medium text-muted-foreground">Example queries:</h3>
            <div className="flex flex-wrap gap-2">
              {exampleQueries.map((eq, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleExampleClick(eq)}
                >
                  <Lightbulb className="h-3 w-3 mr-1 text-amber-500" />
                  Example: {eq.length > 40 ? eq.substring(0, 40) + '...' : eq}
                </Button>
              ))}
            </div>
          </div>
        )}
        
        {/* Loading state */}
        {isPending && (
          <Alert className="mb-6 bg-blue-50 border-blue-200">
            <Zap className="h-4 w-4 text-blue-600 animate-pulse" />
            <AlertTitle className="text-blue-800">Analyzing your query</AlertTitle>
            <AlertDescription className="text-blue-700">
              Processing your question using AI to extract meaning and retrieve relevant data...
            </AlertDescription>
            <div className="mt-4 space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </Alert>
        )}
        
        {/* Error state */}
        {isError && (
          <Alert className="mb-6 bg-red-50 border-red-200">
            <X className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-800">Unable to process your query</AlertTitle>
            <AlertDescription className="text-red-700">
              {error instanceof Error ? error.message : 'Please try rephrasing your question or use one of the examples.'}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Results section */}
        {selectedQuery && (
          <div className="space-y-6">
            {/* Summary */}
            <Alert className="bg-green-50 border-green-200">
              <Info className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 font-medium">
                {selectedQuery.summary}
              </AlertDescription>
            </Alert>
            
            {/* Interpretation */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Interpretation:</h3>
              {renderInterpretationBadges()}
            </div>
            
            {/* Results visualization */}
            <div className="bg-white rounded-md p-4 border">
              <h3 className="text-sm font-medium mb-4">Results:</h3>
              {renderChart()}
            </div>
            
            {/* Export options */}
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => {
                  // Export as CSV
                  if (!selectedQuery.results.length) return;
                  
                  const headers = Object.keys(selectedQuery.results[0]).join(',');
                  const rows = selectedQuery.results.map(row => 
                    Object.values(row).join(',')
                  ).join('\n');
                  
                  const csv = `${headers}\n${rows}`;
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `query_results_${new Date().toISOString().slice(0, 10)}.csv`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                }}
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        )}
        
        {/* Query history */}
        <Dialog open={showHistory} onOpenChange={setShowHistory}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Query History</DialogTitle>
              <DialogDescription>
                Your recent queries. Click on any to run it again.
              </DialogDescription>
            </DialogHeader>
            
            {queryHistory.length === 0 ? (
              <div className="py-6 text-center text-muted-foreground">
                <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No query history yet</p>
              </div>
            ) : (
              <>
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-2">
                    {queryHistory.map(item => (
                      <div
                        key={item.id}
                        className={`p-3 rounded-md cursor-pointer transition-colors hover:bg-slate-100 ${
                          item.successful ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'
                        }`}
                        onClick={() => handleHistoryItemClick(item)}
                      >
                        <div className="flex justify-between items-start">
                          <p className="font-medium line-clamp-2">{item.query}</p>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatRelativeTime(item.timestamp)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                
                <div className="mt-4 flex justify-end">
                  <Button variant="outline" size="sm" onClick={clearHistory}>
                    Clear History
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
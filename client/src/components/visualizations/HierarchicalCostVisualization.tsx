import React, { useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { HierarchicalVisualizationProps, HierarchicalCostNode } from '@/lib/visualizationTypes';
import { formatCurrency } from '@/lib/visualizationUtils';
import { AlertCircle, ChevronRight, ChevronDown } from 'lucide-react';

/**
 * Hierarchical Cost Visualization Component
 * 
 * Displays a drill-down visualization of costs by region, county, and quality grade
 */
export function HierarchicalCostVisualization({
  data,
  isLoading = false,
  onNodeSelect
}: HierarchicalVisualizationProps) {
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  
  // Toggle node expansion
  const toggleNode = useCallback((nodePath: string) => {
    setExpandedNodes(prev => ({
      ...prev,
      [nodePath]: !prev[nodePath]
    }));
    
    if (onNodeSelect) {
      onNodeSelect(nodePath.split('/'));
    }
  }, [onNodeSelect]);
  
  // Recursive function to render a node and its children
  const renderNode = useCallback((node: HierarchicalCostNode, path: string = '', depth: number = 0) => {
    const isExpanded = expandedNodes[path] || false;
    const hasChildren = node.children && node.children.length > 0;
    const nodePath = path ? `${path}/${node.name}` : node.name;
    
    return (
      <div key={nodePath} className="mb-1" data-testid={`node-${node.name}`}>
        <div 
          className={`
            flex items-center p-2 rounded-md cursor-pointer hover:bg-accent
            ${depth === 0 ? 'bg-primary/10' : ''}
            ${depth === 1 ? 'ml-4 bg-primary/5' : ''}
            ${depth === 2 ? 'ml-8 bg-background' : ''}
          `}
          onClick={() => toggleNode(nodePath)}
        >
          {hasChildren && (
            <div className="mr-2">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
          )}
          <div className="flex-1">
            <span className="font-medium">{node.name}</span>
          </div>
          <div className="text-right">
            <div>{formatCurrency(node.value)}</div>
            {node.count !== undefined && (
              <div className="text-xs text-muted-foreground">
                {node.count} data points
              </div>
            )}
          </div>
        </div>
        
        {isExpanded && hasChildren && (
          <div className="mt-1">
            {node.children!.map(child => 
              renderNode(child, nodePath, depth + 1)
            )}
          </div>
        )}
      </div>
    );
  }, [expandedNodes, toggleNode]);
  
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-3/4" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-1/2" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          {Array(5).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full mb-2" />
          ))}
        </CardContent>
      </Card>
    );
  }
  
  if (!data) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Hierarchical Cost Analysis</CardTitle>
          <CardDescription>
            Drill down into building costs by county and quality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No hierarchical data available for this selection.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  // Create a valid HierarchicalCostNode from the data
  const rootNode: HierarchicalCostNode = {
    name: data.name,
    value: 0, // Add a default value to satisfy the interface
    children: data.children
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Hierarchical Cost Analysis</CardTitle>
        <CardDescription>
          Drill down into building costs by county and quality
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md p-2">
          {renderNode(rootNode, '')}
          
          {data.children && data.children.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              No subcategories found. Click on a region to explore its data.
            </div>
          )}
        </div>
        
        <div className="mt-4 text-xs text-muted-foreground">
          <p>Click on any item to expand or collapse its subcategories.</p>
        </div>
      </CardContent>
    </Card>
  );
}
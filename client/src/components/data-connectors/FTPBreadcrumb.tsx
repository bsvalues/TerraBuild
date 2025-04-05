import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FTPBreadcrumbProps {
  path: string;
  onNavigate: (path: string) => void;
}

const FTPBreadcrumb: React.FC<FTPBreadcrumbProps> = ({ path, onNavigate }) => {
  // Split path into segments
  const segments = path.split('/').filter(segment => segment.length > 0);
  
  // Generate breadcrumb items
  const breadcrumbItems = [];
  
  // Always add root
  breadcrumbItems.push({
    name: 'Home',
    path: '/',
    isLast: segments.length === 0
  });
  
  // Add each segment with its complete path
  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    breadcrumbItems.push({
      name: segment,
      path: `${currentPath}/`,
      isLast: index === segments.length - 1
    });
  });
  
  return (
    <div className="flex items-center flex-wrap bg-muted/30 px-3 py-2 rounded-md text-sm overflow-x-auto">
      {breadcrumbItems.map((item, index) => (
        <React.Fragment key={item.path}>
          {index > 0 && <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground" />}
          
          {item.isLast ? (
            <span className="font-medium text-primary">
              {index === 0 ? <Home className="h-4 w-4 inline mr-1" /> : null}
              {item.name}
            </span>
          ) : (
            <Button 
              variant="link" 
              className="h-auto p-0 font-normal"
              onClick={() => onNavigate(item.path)}
            >
              {index === 0 ? <Home className="h-4 w-4 inline mr-1" /> : null}
              {item.name}
            </Button>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default FTPBreadcrumb;
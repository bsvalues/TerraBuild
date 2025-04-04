import React, { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, Clock, FileText, Users } from 'lucide-react';
import { useCollaboration } from '../../contexts/CollaborationContext';

interface ProjectProgressTrackerProps {
  projectId: number;
}

interface ProgressCategory {
  name: string;
  key: string;
  icon: React.ReactNode;
  completed: number;
  total: number;
}

const ProjectProgressTracker: React.FC<ProjectProgressTrackerProps> = ({ projectId }) => {
  const { projectMembers, projectItems, comments } = useCollaboration();
  const [categories, setCategories] = useState<ProgressCategory[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  
  useEffect(() => {
    // Define the progress categories and calculate completion
    const newCategories: ProgressCategory[] = [
      {
        name: 'Team Members',
        key: 'members',
        icon: <Users className="h-4 w-4 mr-1" />,
        completed: projectMembers.length,
        total: 5, // Target number of team members
      },
      {
        name: 'Resources',
        key: 'resources',
        icon: <FileText className="h-4 w-4 mr-1" />,
        completed: projectItems.length,
        total: 10, // Target number of resources
      },
      {
        name: 'Discussions',
        key: 'discussions',
        icon: <Clock className="h-4 w-4 mr-1" />,
        completed: comments.length,
        total: 20, // Target number of discussions
      },
      // Additional categories can be added as needed
    ];
    
    setCategories(newCategories);
    
    // Calculate overall progress
    const completedTotal = newCategories.reduce((acc, cat) => acc + cat.completed, 0);
    const overallTotal = newCategories.reduce((acc, cat) => acc + cat.total, 0);
    const overall = overallTotal > 0 ? Math.round((completedTotal / overallTotal) * 100) : 0;
    
    setOverallProgress(overall);
  }, [projectMembers, projectItems, comments]);
  
  // Get status label based on progress
  const getStatusLabel = (progress: number) => {
    if (progress >= 100) return 'Completed';
    if (progress >= 75) return 'Nearly Complete';
    if (progress >= 50) return 'Halfway';
    if (progress >= 25) return 'In Progress';
    return 'Just Started';
  };
  
  // Get variant for the badge
  const getStatusVariant = (progress: number) => {
    if (progress >= 100) return 'success';
    if (progress >= 75) return 'default';
    if (progress >= 50) return 'outline';
    if (progress >= 25) return 'secondary';
    return 'destructive';
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant={getStatusVariant(overallProgress) as any}>
          {getStatusLabel(overallProgress)}
        </Badge>
        <span className="text-sm text-muted-foreground">Overall: {overallProgress}%</span>
      </div>
      <Progress value={overallProgress} className="h-2" />
      
      <div className="space-y-4 mt-6">
        {categories.map((category) => {
          const categoryProgress = category.total > 0 
            ? Math.round((category.completed / category.total) * 100)
            : 0;
            
          return (
            <div key={category.key} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center text-sm font-medium">
                  {category.icon}
                  {category.name}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  {categoryProgress >= 100 ? (
                    <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                  ) : (
                    <Circle className="h-4 w-4 mr-1" />
                  )}
                  {category.completed} / {category.total}
                </div>
              </div>
              <Progress value={categoryProgress} className="h-1.5" />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProjectProgressTracker;
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  AlertCircle, 
  Circle, 
  Clock, 
  FileText, 
  Users, 
  MessageSquare, 
  Link, 
  Share2, 
  Target, 
  PlusCircle, 
  CheckSquare,
  Loader2
} from 'lucide-react';
import { useCollaboration } from '../../contexts/CollaborationContext';
import { useProjectContext } from '../../contexts/ProjectContext';
import { apiRequest } from '@/lib/queryClient';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ProjectProgressTrackerProps {
  projectId: number;
}

interface MilestoneStep {
  title: string;
  description: string;
  completed: boolean;
  inProgress: boolean;
}

interface ProgressCategory {
  name: string;
  key: string;
  icon: React.ReactNode;
  completed: number;
  total: number;
  description: string;
  steps?: MilestoneStep[];
}

interface ProjectActivity {
  id: number;
  projectId: number;
  userId: number;
  activityType: string;
  activityData: any;
  createdAt: string;
  user: {
    username: string;
    name: string | null;
  };
}

const ProjectProgressTracker: React.FC<ProjectProgressTrackerProps> = ({ projectId }) => {
  const { projectMembers, projectItems, comments, sharedLinks } = useCollaboration();
  const { project, currentUserRole, isOwner } = useProjectContext();
  const [categories, setCategories] = useState<ProgressCategory[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [milestones, setMilestones] = useState<MilestoneStep[]>([]);
  
  // Fetch project activities to help determine project progress
  const { data: activities, isLoading: isActivitiesLoading } = useQuery({
    queryKey: [`/api/projects/${projectId}/activities`],
    queryFn: () => apiRequest(`/api/projects/${projectId}/activities`),
    enabled: !!projectId
  });
  
  const projectActivities = Array.isArray(activities) ? activities as ProjectActivity[] : [];
  
  // Create activity lookup for milestone tracking
  const hasActivity = (type: string) => {
    return projectActivities.some(activity => activity.activityType === type);
  };
  
  useEffect(() => {
    // Define project milestones and track completion
    const projectMilestones: MilestoneStep[] = [
      {
        title: 'Project Setup',
        description: 'Project created with initial settings',
        completed: true, // Always true since we're viewing the project
        inProgress: false
      },
      {
        title: 'Team Formation',
        description: 'Add team members to collaborate',
        completed: projectMembers.length >= 2,
        inProgress: projectMembers.length === 1
      },
      {
        title: 'Resource Collection',
        description: 'Add project resources like cost matrices and calculations',
        completed: projectItems.length >= 3,
        inProgress: projectItems.length > 0 && projectItems.length < 3
      },
      {
        title: 'Team Collaboration',
        description: 'Active discussion and sharing of project items',
        completed: comments.length >= 5,
        inProgress: comments.length > 0 && comments.length < 5
      },
      {
        title: 'Project Finalization',
        description: 'Final review and project completion',
        completed: hasActivity('project_shared') && 
                  projectMembers.length >= 2 && 
                  projectItems.length >= 3 && 
                  comments.length >= 5,
        inProgress: hasActivity('project_shared') || 
                   (projectMembers.length >= 2 && 
                    projectItems.length >= 3)
      }
    ];
    
    setMilestones(projectMilestones);
    
    // Calculate milestone progress
    const completedMilestones = projectMilestones.filter(m => m.completed).length;
    const milestoneProgress = Math.round((completedMilestones / projectMilestones.length) * 100);
    
    // Define the progress categories and calculate completion
    const newCategories: ProgressCategory[] = [
      {
        name: 'Team Members',
        key: 'members',
        icon: <Users className="h-4 w-4 mr-1" />,
        completed: projectMembers.length,
        total: 5, // Target number of team members
        description: 'Track team formation and collaboration',
        steps: [
          {
            title: 'Project Owner',
            description: 'Project needs at least an owner',
            completed: true, // Always true since we're viewing the project
            inProgress: false
          },
          {
            title: 'Team Member',
            description: 'Add at least one team member',
            completed: projectMembers.length > 1,
            inProgress: projectMembers.length === 1
          },
          {
            title: 'Admin Access',
            description: 'Project has an admin besides owner',
            completed: projectMembers.filter(m => m.role === 'admin').length > 0,
            inProgress: false
          },
          {
            title: 'Full Team',
            description: 'Team has all necessary roles',
            completed: projectMembers.length >= 3,
            inProgress: projectMembers.length >= 1 && projectMembers.length < 3
          }
        ]
      },
      {
        name: 'Project Resources',
        key: 'resources',
        icon: <FileText className="h-4 w-4 mr-1" />,
        completed: projectItems.length,
        total: 10, // Target number of resources
        description: 'Building cost items and calculations',
        steps: [
          {
            title: 'Initial Resources',
            description: 'Add your first project resource',
            completed: projectItems.length > 0,
            inProgress: false
          },
          {
            title: 'Cost Matrix',
            description: 'At least one cost matrix added',
            completed: projectItems.filter(item => item.itemType === 'cost_matrix').length > 0,
            inProgress: false
          },
          {
            title: 'Calculations',
            description: 'Building cost calculations added',
            completed: projectItems.filter(item => item.itemType === 'calculation').length > 0,
            inProgress: false
          },
          {
            title: 'Complete Resource Set',
            description: 'Project has diverse resources',
            completed: projectItems.length >= 5,
            inProgress: projectItems.length > 0 && projectItems.length < 5
          }
        ]
      },
      {
        name: 'Collaboration',
        key: 'collaboration',
        icon: <MessageSquare className="h-4 w-4 mr-1" />,
        completed: comments.length + projectActivities.length,
        total: 30, // Target number for comments + activities
        description: 'Team discussion and feedback',
        steps: [
          {
            title: 'Initial Discussion',
            description: 'First comment on the project',
            completed: comments.length > 0,
            inProgress: false
          },
          {
            title: 'Active Discussion',
            description: 'Multiple comments from team',
            completed: comments.length >= 5,
            inProgress: comments.length > 0 && comments.length < 5
          },
          {
            title: 'Team Sharing',
            description: 'Project shared with others',
            completed: hasActivity('project_shared'),
            inProgress: false
          },
          {
            title: 'Complete Feedback',
            description: 'Comprehensive team feedback',
            completed: comments.length >= 10,
            inProgress: comments.length >= 5 && comments.length < 10
          }
        ]
      },
      {
        name: 'Project Sharing',
        key: 'sharing',
        icon: <Share2 className="h-4 w-4 mr-1" />,
        completed: sharedLinks.length,
        total: 5, // Target number of shares
        description: 'External sharing and distribution',
        steps: [
          {
            title: 'Public/Private Setting',
            description: 'Project visibility configured',
            completed: project?.isPublic !== undefined,
            inProgress: false
          },
          {
            title: 'Sharing Link',
            description: 'Create first sharing link',
            completed: sharedLinks.length > 0,
            inProgress: false
          },
          {
            title: 'Multiple Access Levels',
            description: 'Different permission links',
            completed: sharedLinks.filter(link => link.accessLevel === 'view').length > 0 &&
                      sharedLinks.filter(link => link.accessLevel === 'edit').length > 0,
            inProgress: sharedLinks.length > 0
          },
          {
            title: 'Complete Distribution',
            description: 'Project widely distributed',
            completed: sharedLinks.length >= 3,
            inProgress: sharedLinks.length > 0 && sharedLinks.length < 3
          }
        ]
      }
    ];
    
    setCategories(newCategories);
    
    // Calculate overall progress from both category progress and milestone progress
    const categoryTotal = newCategories.reduce((acc, cat) => {
      // Cap each category's completion percentage at 100%
      const catCompleted = Math.min(cat.completed, cat.total);
      return acc + (catCompleted / cat.total);
    }, 0);
    
    // Weight the overall progress as 60% milestone progress, 40% category details
    const categoryProgress = (categoryTotal / newCategories.length) * 100;
    const overall = Math.round((milestoneProgress * 0.6) + (categoryProgress * 0.4));
    
    setOverallProgress(overall);
  }, [projectMembers, projectItems, comments, sharedLinks, projectActivities, project]);
  
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
    <div className="space-y-6">
      {/* Overall Progress */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={getStatusVariant(overallProgress) as any}>
              {getStatusLabel(overallProgress)}
            </Badge>
            {overallProgress >= 100 && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle className="h-3 w-3 mr-1" /> Ready to finalize
              </Badge>
            )}
          </div>
          <span className="text-sm font-medium">{overallProgress}% Complete</span>
        </div>
        <Progress value={overallProgress} className="h-2.5" />
      </div>
      
      {/* Milestones */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold mb-2 flex items-center">
          <Target className="h-4 w-4 mr-1 text-primary" />
          Project Milestones
        </h4>
        <div className="space-y-3 pl-1">
          {milestones.map((milestone, index) => (
            <div key={index} className="flex items-start gap-2">
              {milestone.completed ? (
                <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                  <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                </div>
              ) : milestone.inProgress ? (
                <div className="h-5 w-5 rounded-full bg-amber-100 flex items-center justify-center mt-0.5">
                  <Loader2 className="h-3.5 w-3.5 text-amber-600 animate-spin" />
                </div>
              ) : (
                <div className="h-5 w-5 rounded-full bg-gray-100 flex items-center justify-center mt-0.5">
                  <Circle className="h-3.5 w-3.5 text-gray-400" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium">
                  {milestone.title}
                  {milestone.completed && (
                    <span className="ml-1.5 text-xs text-green-600">✓</span>
                  )}
                  {milestone.inProgress && (
                    <span className="ml-1.5 text-xs text-amber-600">In Progress</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">{milestone.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Category Progress */}
      <div className="space-y-6 mt-2">
        <h4 className="text-sm font-semibold mb-1">Detailed Progress</h4>
        
        {categories.map((category) => {
          const categoryProgress = category.total > 0 
            ? Math.round((category.completed / category.total) * 100)
            : 0;
          
          return (
            <div key={category.key} className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center text-sm font-medium">
                    {category.icon}
                    <span className="ml-1">{category.name}</span>
                  </div>
                  
                  <div className="flex items-center text-sm">
                    <span className="text-muted-foreground">{category.completed} / {category.total}</span>
                    <span className="ml-2 font-medium">
                      {categoryProgress}%
                    </span>
                  </div>
                </div>
                <Progress value={categoryProgress} className="h-1.5" />
                
                {/* Show steps for this category */}
                {category.steps && category.steps.length > 0 && (
                  <div className="mt-3 space-y-2 pl-2">
                    {category.steps.map((step, idx) => (
                      <TooltipProvider key={idx}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2 py-1 text-xs group cursor-pointer">
                              {step.completed ? (
                                <CheckSquare className="h-3.5 w-3.5 text-green-600" />
                              ) : step.inProgress ? (
                                <PlusCircle className="h-3.5 w-3.5 text-amber-500" />
                              ) : (
                                <Circle className="h-3.5 w-3.5 text-gray-400 group-hover:text-gray-500" />
                              )}
                              <span className={step.completed ? 'text-green-600' : 
                                     step.inProgress ? 'text-amber-500' : 'text-muted-foreground'}>
                                {step.title}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{step.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProjectProgressTracker;
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  FolderOpen,
  Users,
  Settings,
  Share2,
  Mail,
  Link2,
  Info,
  FileText,
  BarChart,
  FileBarChart2,
  FileSpreadsheet,
  Calculator
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import ProjectMembersTable from './ProjectMembersTable';
import ProjectItemsTable from './ProjectItemsTable';
import ProjectSharingControls from './ProjectSharingControls';
import ProjectInvitations from './ProjectInvitations';
import InviteUserDialog from './InviteUserDialog';
import CommentsSection from '../comments/CommentsSection';

export default function ProjectSharingDemo() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  
  // Mock project data
  const projectData = {
    id: 1,
    name: 'Benton County Main Library Construction Project',
    description: 'Cost estimation and analysis for the new Benton County Main Library construction project',
    createdBy: 'John Architect',
    createdAt: '2025-03-15T10:00:00Z',
    updatedAt: '2025-04-01T14:30:00Z',
    isPublic: true,
    status: 'active'
  };
  
  // Mock current user
  const currentUser = {
    id: 1,
    name: 'John Architect',
    role: 'owner'
  };
  
  // Mock project members
  const members = [
    {
      id: 1,
      userId: 1,
      projectId: 1,
      role: 'owner',
      joinedAt: '2025-03-15T10:00:00Z',
      user: {
        id: 1,
        name: 'John Architect',
        username: 'johnarch',
        avatarUrl: null
      }
    },
    {
      id: 2,
      userId: 2,
      projectId: 1,
      role: 'admin',
      joinedAt: '2025-03-16T08:45:00Z',
      user: {
        id: 2,
        name: 'Sarah Engineer',
        username: 'saraheng',
        avatarUrl: null
      }
    },
    {
      id: 3,
      userId: 3,
      projectId: 1,
      role: 'editor',
      joinedAt: '2025-03-17T11:20:00Z',
      user: {
        id: 3,
        name: 'Mike Project Manager',
        username: 'mikepm',
        avatarUrl: null
      }
    },
    {
      id: 4,
      userId: 4,
      projectId: 1,
      role: 'viewer',
      joinedAt: '2025-03-20T09:15:00Z',
      user: {
        id: 4,
        name: 'Lisa Client',
        username: 'lisaclient',
        avatarUrl: null
      }
    }
  ];
  
  // Mock project items
  const projectItems = [
    {
      id: 1,
      projectId: 1,
      itemType: 'calculation',
      itemId: 101,
      addedBy: 1,
      addedAt: '2025-03-18T14:25:00Z',
      details: {
        name: 'Foundation Cost Analysis',
        description: 'Detailed cost analysis for foundation work',
        createdAt: '2025-03-17T10:30:00Z'
      },
      addedByUser: {
        id: 1,
        name: 'John Architect',
        username: 'johnarch'
      }
    },
    {
      id: 2,
      projectId: 1,
      itemType: 'cost_matrix',
      itemId: 203,
      addedBy: 2,
      addedAt: '2025-03-19T09:15:00Z',
      details: {
        name: 'Benton County 2025 Cost Matrix',
        description: 'Official cost matrix for Benton County, 2025',
        createdAt: '2025-01-05T08:00:00Z'
      },
      addedByUser: {
        id: 2,
        name: 'Sarah Engineer',
        username: 'saraheng'
      }
    },
    {
      id: 3,
      projectId: 1,
      itemType: 'report',
      itemId: 305,
      addedBy: 3,
      addedAt: '2025-03-30T16:45:00Z',
      details: {
        name: 'Preliminary Construction Cost Report',
        description: 'Summary report of all construction costs',
        createdAt: '2025-03-29T15:20:00Z'
      },
      addedByUser: {
        id: 3,
        name: 'Mike Project Manager',
        username: 'mikepm'
      }
    },
    {
      id: 4,
      projectId: 1,
      itemType: 'visualization',
      itemId: 407,
      addedBy: 1,
      addedAt: '2025-04-01T11:10:00Z',
      details: {
        name: 'Cost Breakdown by Category',
        description: 'Visual breakdown of costs by category',
        createdAt: '2025-04-01T10:45:00Z'
      },
      addedByUser: {
        id: 1,
        name: 'John Architect',
        username: 'johnarch'
      }
    }
  ];
  
  // Mock comments
  const comments = [
    {
      id: 1,
      content: "I've reviewed the foundation cost analysis, and I think we need to revisit the unit costs for concrete. The current estimate seems a bit low compared to recent market trends.",
      user: {
        id: 2,
        name: 'Sarah Engineer',
        username: 'saraheng'
      },
      createdAt: '2025-03-20T09:30:00Z',
      updatedAt: '2025-03-20T09:30:00Z',
      isResolved: false,
      isEdited: false,
      replies: [
        {
          id: 3,
          content: "Good catch, Sarah. I'll update the concrete unit costs based on the latest supplier quotes we received last week.",
          user: {
            id: 1,
            name: 'John Architect',
            username: 'johnarch'
          },
          createdAt: '2025-03-20T10:15:00Z',
          updatedAt: '2025-03-20T10:15:00Z',
          isResolved: false,
          isEdited: false,
          parentCommentId: 1
        }
      ]
    },
    {
      id: 2,
      content: "The visualization helps a lot with understanding where our budget is going. Can we add a time-phased cost chart as well to see how the costs are distributed over the construction timeline?",
      user: {
        id: 4,
        name: 'Lisa Client',
        username: 'lisaclient'
      },
      createdAt: '2025-04-01T13:45:00Z',
      updatedAt: '2025-04-01T13:45:00Z',
      isResolved: false,
      isEdited: false,
      replies: []
    }
  ];
  
  // Function to get user initials for Avatar
  const getUserInitials = (name: string) => {
    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6 max-w-6xl">
      {/* Project Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">{projectData.name}</h1>
          <p className="text-muted-foreground mt-1">{projectData.description}</p>
        </div>
        <Button onClick={() => setShowInviteDialog(true)}>
          <Users className="mr-2 h-4 w-4" />
          Invite Members
        </Button>
      </div>
      
      <Separator />
      
      {/* Project Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 md:w-[600px]">
          <TabsTrigger value="overview">
            <Info className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="members">
            <Users className="h-4 w-4 mr-2" />
            Members
          </TabsTrigger>
          <TabsTrigger value="items">
            <FolderOpen className="h-4 w-4 mr-2" />
            Items
          </TabsTrigger>
          <TabsTrigger value="sharing">
            <Share2 className="h-4 w-4 mr-2" />
            Sharing
          </TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
                <CardDescription>Basic information about this project</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div className="text-sm font-medium">Created By</div>
                  <div className="text-sm">{projectData.createdBy}</div>
                  
                  <div className="text-sm font-medium">Created Date</div>
                  <div className="text-sm">{new Date(projectData.createdAt).toLocaleDateString()}</div>
                  
                  <div className="text-sm font-medium">Last Updated</div>
                  <div className="text-sm">{new Date(projectData.updatedAt).toLocaleDateString()}</div>
                  
                  <div className="text-sm font-medium">Status</div>
                  <div>
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                      Active
                    </Badge>
                  </div>
                  
                  <div className="text-sm font-medium">Visibility</div>
                  <div className="flex items-center space-x-2">
                    <div className="text-sm">{projectData.isPublic ? 'Public' : 'Private'}</div>
                    <Switch
                      checked={projectData.isPublic}
                      onCheckedChange={() => {}}
                      disabled={currentUser.role !== 'owner'}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Project Activity</CardTitle>
                <CardDescription>Recent activity in this project</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{getUserInitials('John Architect')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium">John Architect added a visualization</div>
                      <div className="text-xs text-muted-foreground">Apr 1, 2025 at 11:10 AM</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{getUserInitials('Mike Project Manager')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium">Mike Project Manager added a report</div>
                      <div className="text-xs text-muted-foreground">Mar 30, 2025 at 4:45 PM</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{getUserInitials('Sarah Engineer')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium">Sarah Engineer added a cost matrix</div>
                      <div className="text-xs text-muted-foreground">Mar 19, 2025 at 9:15 AM</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Recent Comments */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Comments</CardTitle>
              <CardDescription>Latest discussions about this project</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {comments.map((comment) => (
                  <div key={comment.id} className="border rounded-lg p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{getUserInitials(comment.user.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <div className="font-medium">{comment.user.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(comment.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <div className="mt-1">{comment.content}</div>
                      </div>
                    </div>
                    
                    {/* Comment Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="ml-10 mt-3 space-y-3 border-l-2 pl-4">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="flex items-start gap-3">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback>{getUserInitials(reply.user.name)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <div className="font-medium text-sm">{reply.user.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(reply.createdAt).toLocaleString()}
                                </div>
                              </div>
                              <div className="mt-1 text-sm">{reply.content}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                View All Comments
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Members Tab */}
        <TabsContent value="members" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Project Members</h2>
              <p className="text-muted-foreground">Manage the team collaborating on this project</p>
            </div>
            <Button onClick={() => setShowInviteDialog(true)}>
              <Users className="mr-2 h-4 w-4" />
              Invite Members
            </Button>
          </div>
          
          <ProjectMembersTable 
            projectId={projectData.id}
            currentUserId={currentUser.id}
            isOwner={currentUser.role === 'owner'}
            isAdmin={currentUser.role === 'admin' || currentUser.role === 'owner'}
            isLoading={false}
            currentUserRole={currentUser.role}
          />
          
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>User Roles & Permissions</AlertTitle>
            <AlertDescription className="mt-2">
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li><strong>Owner:</strong> Has full control over the project, including deleting it</li>
                <li><strong>Admin:</strong> Can manage members and content, but cannot delete the project</li>
                <li><strong>Editor:</strong> Can add, edit, and delete content, but cannot manage members</li>
                <li><strong>Viewer:</strong> Can view all content but cannot make changes</li>
              </ul>
            </AlertDescription>
          </Alert>
        </TabsContent>
        
        {/* Items Tab */}
        <TabsContent value="items" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Shared Items</h2>
              <p className="text-muted-foreground">View all items shared with this project</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Calculator className="mr-2 h-4 w-4" />
                Add Calculation
              </Button>
              <Button variant="outline">
                <FileBarChart2 className="mr-2 h-4 w-4" />
                Add Visualization
              </Button>
              <Button variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Add Report
              </Button>
            </div>
          </div>
          
          <ProjectItemsTable
            projectId={projectData.id}
            isLoading={false}
            currentUserRole={currentUser.role}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-blue-700 flex items-center">
                  <Calculator className="h-5 w-5 mr-2 text-blue-600" />
                  Calculations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-700 text-sm">Share cost calculations to make them available to all project members.</p>
              </CardContent>
            </Card>
            
            <Card className="bg-green-50 border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-green-700 flex items-center">
                  <FileSpreadsheet className="h-5 w-5 mr-2 text-green-600" />
                  Cost Matrices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-green-700 text-sm">Share cost matrices to standardize calculations across the project.</p>
              </CardContent>
            </Card>
            
            <Card className="bg-amber-50 border-amber-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-amber-700 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-amber-600" />
                  Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-amber-700 text-sm">Share reports to document findings and recommendations for the project.</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Sharing Tab */}
        <TabsContent value="sharing" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <ProjectSharingControls
                projectId={projectData.id}
                projectName={projectData.name}
                isPublic={projectData.isPublic}
                isOwner={currentUser.role === 'owner'}
                currentUserId={currentUser.id}
                currentUserRole={currentUser.role}
              />
              
              <ProjectInvitations projectId={projectData.id} />
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Info className="h-5 w-5 mr-2" />
                  About Project Sharing
                </CardTitle>
                <CardDescription>
                  Learn how to share your project with others
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium">Public vs. Private Projects</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Public projects can be viewed by anyone with the link, while private projects can only be accessed by invited members.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium">Shared Links</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create shared links to give temporary access to specific people without adding them as members. You can set expiration dates and access levels for each link.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium">Project Members</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add members to your project with different roles (Viewer, Editor, Admin) to control what they can do.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium">Shared Items</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Share calculations, cost matrices, reports, and visualizations with your project to make them available to all members.
                  </p>
                </div>
                
                <Alert className="bg-blue-50 border-blue-200 text-blue-800">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertTitle>Pro Tip</AlertTitle>
                  <AlertDescription>
                    Use shared links with expiration dates for external stakeholders who need temporary access to your project.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Invite User Dialog */}
      <InviteUserDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        projectId={projectData.id}
        isOwner={currentUser.role === 'owner'}
      />
    </div>
  );
}
import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

// Context related types
interface ProjectMember {
  id: number;
  userId: number;
  projectId: number;
  role: string;
  joinedAt: string | Date;
  invitedBy: number;
  user?: {
    id: number;
    name: string | null;
    username: string;
  };
}

interface ProjectInvitation {
  id: number;
  projectId: number;
  userId: number;
  invitedBy: number;
  role: string;
  status: 'pending' | 'accepted' | 'declined';
  invitedAt: string | Date;
  user?: {
    id: number;
    name: string | null;
    username: string;
  };
  inviter?: {
    id: number;
    name: string | null;
    username: string;
  };
  project?: {
    id: number;
    name: string;
  };
}

interface ProjectItem {
  id: number;
  projectId: number;
  itemType: 'calculation' | 'cost_matrix' | 'report' | 'what_if_scenario';
  itemId: number;
  addedBy: number;
  addedAt: string | Date;
  user?: {
    id: number;
    name: string | null;
    username: string;
  };
  item?: {
    id: number;
    name: string;
    [key: string]: any;
  };
}

interface Project {
  id: number;
  name: string;
  description: string | null;
  isPublic: boolean;
  createdById: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  status: string;
  createdBy?: {
    id: number;
    name: string | null;
    username: string;
  };
  members?: ProjectMember[];
  items?: ProjectItem[];
}

interface SharedLink {
  id: number;
  projectId: number;
  token: string;
  accessLevel: string;
  expiresAt: string | null;
  createdAt: string | Date;
  createdBy: number;
  description: string | null;
}

interface Comment {
  id: number;
  content: string;
  userId: number;
  targetType: string;
  targetId: number;
  parentCommentId: number | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  isResolved: boolean;
  isEdited: boolean;
  user?: {
    id: number;
    name: string | null;
    username: string;
  };
  replies?: Comment[];
}

interface AddProjectItemParams {
  projectId: number;
  itemType: string;
  itemId: number;
}

interface AddInvitationParams {
  projectId: number;
  email: string;
  role: string;
}

interface CreateSharedLinkParams {
  projectId: number;
  accessLevel: string;
  expiresAt: string | null;
  description: string | null;
}

interface CreateCommentParams {
  content: string;
  targetType: string;
  targetId: number;
  parentCommentId?: number | null;
}

interface EditCommentParams {
  id: number;
  content: string;
}

interface ProjectActivityParams {
  projectId: number;
  activityType: string;
  activityData?: Record<string, any>;
}

interface CollaborationContextType {
  // Project members
  projectMembers: ProjectMember[];
  isMembersLoading: boolean;
  removeMember: (projectId: number, userId: number) => Promise<void>;
  changeMemberRole: (projectId: number, userId: number, role: string) => Promise<void>;
  
  // Project invitations
  myInvitations: ProjectInvitation[];
  projectInvitations: ProjectInvitation[];
  isInvitationsLoading: boolean;
  addInvitation: (params: AddInvitationParams) => Promise<void>;
  deleteInvitation: (projectId: number, invitationId: number) => Promise<void>;
  respondToInvitation: (invitationId: number, response: 'accepted' | 'declined') => Promise<void>;
  refreshInvitations: () => void;
  
  // Project items
  projectItems: ProjectItem[];
  isItemsLoading: boolean;
  addItemToProject: (params: AddProjectItemParams) => Promise<void>;
  removeItemFromProject: (projectId: number, itemType: string, itemId: number) => Promise<void>;
  
  // Project settings
  setProjectPublic: (projectId: number, isPublic: boolean) => Promise<void>;
  
  // Shared links
  sharedLinks: SharedLink[];
  isLinksLoading: boolean;
  createSharedLink: (params: CreateSharedLinkParams) => Promise<void>;
  deleteSharedLink: (projectId: number, linkId: number) => Promise<void>;
  refreshLinks: () => void;
  
  // Comments
  comments: Comment[];
  isCommentsLoading: boolean;
  createComment: (params: CreateCommentParams) => Promise<void>;
  updateComment: (params: EditCommentParams) => Promise<void>;
  deleteComment: (commentId: number) => Promise<void>;
  resolveComment: (commentId: number, isResolved: boolean) => Promise<void>;
  refreshComments: (targetType: string, targetId: number) => void;
  
  // Project Activities
  recordProjectActivity: (params: ProjectActivityParams) => Promise<void>;

  // Projects
  myProjects: Project[];
  publicProjects: Project[];
  currentProject: Project | null;
  isLoadingProjects: boolean;
  isCreatingProject: boolean;
  isLoadingItems: boolean;
  setCurrentProject: (project: Project | null) => void;
  createProject: (project: Partial<Project>) => Promise<void>;
  deleteProject: (projectId: number) => Promise<void>;
  addProjectItem: (params: AddProjectItemParams) => Promise<void>;
  removeProjectItem: (projectId: number, itemType: string, itemId: number) => Promise<void>;
  
  // Permissions
  isOwner: boolean;
  isAdmin: boolean;
  canEdit: boolean;
}

const CollaborationContext = createContext<CollaborationContextType | undefined>(undefined);

interface CollaborationProviderProps {
  children: React.ReactNode;
  projectId: number;
}

export const CollaborationProvider: React.FC<CollaborationProviderProps> = ({ 
  children,
  projectId,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for the current project
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  
  // User permissions
  const isOwner = useMemo(() => {
    if (!user || !currentProject) return false;
    return currentProject.createdById === user.id;
  }, [user, currentProject]);
  
  const isAdmin = useMemo(() => {
    if (!user || !currentProject) return false;
    if (isOwner) return true;
    
    const memberInfo = currentProject.members?.find(m => m.userId === user.id);
    return memberInfo?.role === 'admin';
  }, [user, currentProject, isOwner]);
  
  const canEdit = useMemo(() => {
    if (!user || !currentProject) return false;
    if (isOwner || isAdmin) return true;
    
    const memberInfo = currentProject.members?.find(m => m.userId === user.id);
    return memberInfo?.role === 'admin' || memberInfo?.role === 'editor';
  }, [user, currentProject, isOwner, isAdmin]);
  
  // Fetch project members
  const {
    data: projectMembers = [],
    isLoading: isMembersLoading,
    refetch: refetchMembers,
  } = useQuery({
    queryKey: ['project-members', projectId],
    queryFn: async () => {
      const response = await apiRequest(`/api/projects/${projectId}/members`);
      return response.json();
    },
    enabled: !!projectId && !!user,
  });
  
  // Fetch project invitations
  const {
    data: projectInvitations = [],
    isLoading: isProjectInvitationsLoading,
    refetch: refetchProjectInvitations,
  } = useQuery({
    queryKey: ['project-invitations', projectId],
    queryFn: async () => {
      const response = await apiRequest(`/api/projects/${projectId}/invitations`);
      return response.json();
    },
    enabled: !!projectId && !!user && (isOwner || isAdmin),
  });
  
  // Fetch user's invitations
  const {
    data: myInvitations = [],
    isLoading: isMyInvitationsLoading,
    refetch: refetchMyInvitations,
  } = useQuery({
    queryKey: ['my-invitations'],
    queryFn: async () => {
      const response = await apiRequest('/api/invitations');
      return response.json();
    },
    enabled: !!user,
  });
  
  // Fetch project items (shared resources)
  const {
    data: projectItems = [],
    isLoading: isItemsLoading,
    refetch: refetchItems,
  } = useQuery({
    queryKey: ['project-items', projectId],
    queryFn: async () => {
      const response = await apiRequest(`/api/projects/${projectId}/items`);
      return response.json();
    },
    enabled: !!projectId && !!user,
  });
  
  // Fetch shared links
  const {
    data: sharedLinks = [],
    isLoading: isLinksLoading,
    refetch: refetchLinks,
  } = useQuery({
    queryKey: ['shared-links', projectId],
    queryFn: async () => {
      const response = await apiRequest(`/api/projects/${projectId}/links`);
      return response.json();
    },
    enabled: !!projectId && !!user && (isOwner || isAdmin),
  });
  
  // Fetch user's projects
  const {
    data: myProjects = [],
    isLoading: isMyProjectsLoading,
    refetch: refetchMyProjects,
  } = useQuery({
    queryKey: ['my-projects'],
    queryFn: async () => {
      const response = await apiRequest('/api/projects/my');
      return response.json();
    },
    enabled: !!user,
  });
  
  // Fetch public projects
  const {
    data: publicProjects = [],
    isLoading: isPublicProjectsLoading,
    refetch: refetchPublicProjects,
  } = useQuery({
    queryKey: ['public-projects'],
    queryFn: async () => {
      const response = await apiRequest('/api/projects/public');
      return response.json();
    },
    enabled: !!user,
  });
  
  // State for comments
  const [commentTarget, setCommentTarget] = useState({ 
    type: '', 
    id: 0 
  });
  
  // Fetch comments for a specific target
  const {
    data: comments = [],
    isLoading: isCommentsLoading,
    refetch: refetchComments,
  } = useQuery({
    queryKey: ['comments', commentTarget.type, commentTarget.id],
    queryFn: async () => {
      const response = await apiRequest(`/api/comments/${commentTarget.type}/${commentTarget.id}`);
      return response.json();
    },
    enabled: !!user && !!commentTarget.type && !!commentTarget.id,
  });
  
  // Set comment target and fetch comments
  const refreshComments = (targetType: string, targetId: number) => {
    setCommentTarget({ type: targetType, id: targetId });
  };
  
  // Refresh invitations
  const refreshInvitations = () => {
    refetchMyInvitations();
    refetchProjectInvitations();
  };
  
  // Refresh links
  const refreshLinks = () => {
    refetchLinks();
  };
  
  // Mutations
  
  // Remove a member from project
  const removeMemberMutation = useMutation({
    mutationFn: async ({ projectId, userId }: { projectId: number; userId: number }) => {
      await apiRequest(`/api/projects/${projectId}/members/${userId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
    },
  });
  
  // Change a member's role
  const changeRoleMutation = useMutation({
    mutationFn: async ({ 
      projectId, 
      userId, 
      role 
    }: { 
      projectId: number; 
      userId: number; 
      role: string;
    }) => {
      await apiRequest(`/api/projects/${projectId}/members/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
    },
  });
  
  // Add invitation
  const addInvitationMutation = useMutation({
    mutationFn: async (params: AddInvitationParams) => {
      await apiRequest(`/api/projects/${params.projectId}/invitations`, {
        method: 'POST',
        body: JSON.stringify({
          email: params.email,
          role: params.role,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-invitations', projectId] });
      toast({
        title: 'Invitation sent',
        description: 'User has been invited to the project.'
      });
    },
  });
  
  // Delete invitation
  const deleteInvitationMutation = useMutation({
    mutationFn: async ({ 
      projectId, 
      invitationId 
    }: { 
      projectId: number; 
      invitationId: number;
    }) => {
      await apiRequest(`/api/projects/${projectId}/invitations/${invitationId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-invitations', projectId] });
    },
  });
  
  // Respond to invitation
  const respondToInvitationMutation = useMutation({
    mutationFn: async ({ 
      invitationId, 
      response 
    }: { 
      invitationId: number; 
      response: 'accepted' | 'declined';
    }) => {
      await apiRequest(`/api/invitations/${invitationId}/${response}`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-invitations'] });
      queryClient.invalidateQueries({ queryKey: ['my-projects'] });
    },
  });
  
  // Add item to project
  const addItemMutation = useMutation({
    mutationFn: async (params: AddProjectItemParams) => {
      await apiRequest(`/api/projects/${params.projectId}/items`, {
        method: 'POST',
        body: JSON.stringify({
          itemType: params.itemType,
          itemId: params.itemId,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-items', projectId] });
      toast({
        title: 'Resource added',
        description: 'Resource has been added to the project.'
      });
    },
  });
  
  // Remove item from project
  const removeItemMutation = useMutation({
    mutationFn: async ({ 
      projectId, 
      itemType, 
      itemId 
    }: { 
      projectId: number; 
      itemType: string; 
      itemId: number;
    }) => {
      await apiRequest(`/api/projects/${projectId}/items/${itemType}/${itemId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-items', projectId] });
    },
  });
  
  // Set project visibility
  const setPublicMutation = useMutation({
    mutationFn: async ({ 
      projectId, 
      isPublic 
    }: { 
      projectId: number; 
      isPublic: boolean;
    }) => {
      await apiRequest(`/api/projects/${projectId}/visibility`, {
        method: 'PATCH',
        body: JSON.stringify({ isPublic }),
      });
    },
    onSuccess: (_, variables) => {
      toast({
        title: variables.isPublic ? 'Project is now public' : 'Project is now private',
        description: variables.isPublic 
          ? 'Anyone with the link can now view this project'
          : 'Only invited members can access this project'
      });
      queryClient.invalidateQueries({ queryKey: ['public-projects'] });
      if (currentProject) {
        setCurrentProject({
          ...currentProject,
          isPublic: variables.isPublic,
        });
      }
    },
  });
  
  // Create shared link
  const createLinkMutation = useMutation({
    mutationFn: async (params: CreateSharedLinkParams) => {
      await apiRequest(`/api/projects/${params.projectId}/links`, {
        method: 'POST',
        body: JSON.stringify({
          accessLevel: params.accessLevel,
          expiresAt: params.expiresAt,
          description: params.description,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-links', projectId] });
    },
  });
  
  // Delete shared link
  const deleteLinkMutation = useMutation({
    mutationFn: async ({ 
      projectId, 
      linkId 
    }: { 
      projectId: number; 
      linkId: number;
    }) => {
      await apiRequest(`/api/projects/${projectId}/links/${linkId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-links', projectId] });
    },
  });
  
  // Create comment
  const createCommentMutation = useMutation({
    mutationFn: async (params: CreateCommentParams) => {
      await apiRequest(`/api/comments/${params.targetType}/${params.targetId}`, {
        method: 'POST',
        body: JSON.stringify({
          content: params.content,
          parentCommentId: params.parentCommentId,
        }),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['comments', variables.targetType, variables.targetId] 
      });
    },
  });
  
  // Update comment
  const updateCommentMutation = useMutation({
    mutationFn: async (params: EditCommentParams) => {
      await apiRequest(`/api/comments/${params.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          content: params.content,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['comments', commentTarget.type, commentTarget.id] 
      });
    },
  });
  
  // Delete comment
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      await apiRequest(`/api/comments/${commentId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['comments', commentTarget.type, commentTarget.id] 
      });
    },
  });
  
  // Resolve/unresolve comment
  const resolveCommentMutation = useMutation({
    mutationFn: async ({ 
      commentId, 
      isResolved 
    }: { 
      commentId: number; 
      isResolved: boolean;
    }) => {
      await apiRequest(`/api/comments/${commentId}/resolve`, {
        method: 'PATCH',
        body: JSON.stringify({ isResolved }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['comments', commentTarget.type, commentTarget.id]
      });
    },
  });
  
  // Create project
  const createProjectMutation = useMutation({
    mutationFn: async (project: Partial<Project>) => {
      await apiRequest('/api/projects', {
        method: 'POST',
        body: JSON.stringify(project),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-projects'] });
      toast({
        title: 'Project created',
        description: 'Your new project has been created.'
      });
    },
  });
  
  // Delete project
  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: number) => {
      await apiRequest(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-projects'] });
      queryClient.invalidateQueries({ queryKey: ['public-projects'] });
      toast({
        title: 'Project deleted',
        description: 'The project has been deleted.'
      });
      if (currentProject?.id === projectId) {
        setCurrentProject(null);
      }
    },
  });
  
  // Record project activity
  const recordProjectActivityMutation = useMutation({
    mutationFn: async (params: ProjectActivityParams) => {
      await apiRequest(`/api/projects/${params.projectId}/activities`, {
        method: 'POST',
        body: JSON.stringify({
          activityType: params.activityType,
          activityData: params.activityData || {},
        }),
      });
    },
    onSuccess: () => {
      // No need to invalidate any query cache since we don't have activities query yet
    },
  });
  
  // Define isLoadingItems before using it in the context value
  const isLoadingItems = isItemsLoading;
  
  // Exposed context values
  const contextValue = {
    // Project members
    projectMembers,
    isMembersLoading,
    removeMember: (projectId: number, userId: number) => 
      removeMemberMutation.mutateAsync({ projectId, userId }),
    changeMemberRole: (projectId: number, userId: number, role: string) => 
      changeRoleMutation.mutateAsync({ projectId, userId, role }),
    
    // Project invitations
    myInvitations,
    projectInvitations,
    isInvitationsLoading: isProjectInvitationsLoading || isMyInvitationsLoading,
    addInvitation: (params: AddInvitationParams) => 
      addInvitationMutation.mutateAsync(params),
    deleteInvitation: (projectId: number, invitationId: number) => 
      deleteInvitationMutation.mutateAsync({ projectId, invitationId }),
    respondToInvitation: (invitationId: number, response: 'accepted' | 'declined') => 
      respondToInvitationMutation.mutateAsync({ invitationId, response }),
    refreshInvitations,
    
    // Project items
    projectItems,
    isItemsLoading,
    addItemToProject: (params: AddProjectItemParams) => 
      addItemMutation.mutateAsync(params),
    removeItemFromProject: (projectId: number, itemType: string, itemId: number) => 
      removeItemMutation.mutateAsync({ projectId, itemType, itemId }),
    
    // Project settings
    setProjectPublic: (projectId: number, isPublic: boolean) => 
      setPublicMutation.mutateAsync({ projectId, isPublic }),
    
    // Shared links
    sharedLinks,
    isLinksLoading,
    createSharedLink: (params: CreateSharedLinkParams) => 
      createLinkMutation.mutateAsync(params),
    deleteSharedLink: (projectId: number, linkId: number) => 
      deleteLinkMutation.mutateAsync({ projectId, linkId }),
    refreshLinks,
    
    // Comments
    comments,
    isCommentsLoading,
    createComment: (params: CreateCommentParams) => 
      createCommentMutation.mutateAsync(params),
    updateComment: (params: EditCommentParams) => 
      updateCommentMutation.mutateAsync(params),
    deleteComment: (commentId: number) => 
      deleteCommentMutation.mutateAsync(commentId),
    resolveComment: (commentId: number, isResolved: boolean) => 
      resolveCommentMutation.mutateAsync({ commentId, isResolved }),
    refreshComments,
    
    // Project Activities
    recordProjectActivity: (params: ProjectActivityParams) =>
      recordProjectActivityMutation.mutateAsync(params),
    
    // Projects
    myProjects,
    publicProjects,
    currentProject,
    isLoadingProjects: isMyProjectsLoading || isPublicProjectsLoading,
    isCreatingProject: createProjectMutation.isPending,
    isLoadingItems,
    setCurrentProject,
    createProject: (project: Partial<Project>) => 
      createProjectMutation.mutateAsync(project),
    deleteProject: (projectId: number) => 
      deleteProjectMutation.mutateAsync(projectId),
    addProjectItem: (params: AddProjectItemParams) => 
      addItemMutation.mutateAsync(params),
    removeProjectItem: (projectId: number, itemType: string, itemId: number) => 
      removeItemMutation.mutateAsync({ projectId, itemType, itemId }),
      
    // Permissions
    isOwner,
    isAdmin,
    canEdit,
  };
  
  return (
    <CollaborationContext.Provider value={contextValue}>
      {children}
    </CollaborationContext.Provider>
  );
};

export const useCollaboration = () => {
  const context = useContext(CollaborationContext);
  if (context === undefined) {
    throw new Error('useCollaboration must be used within a CollaborationProvider');
  }
  return context;
};
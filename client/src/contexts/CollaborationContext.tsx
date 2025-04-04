import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface Project {
  id: number;
  name: string;
  description: string | null;
  createdById: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  status: string;
  isPublic: boolean;
}

interface ProjectMember {
  id: number;
  projectId: number;
  userId: number;
  role: 'viewer' | 'editor' | 'admin';
  joinedAt: string | Date;
  invitedBy: number;
  user?: {
    id: number;
    username: string;
    name: string | null;
  };
}

interface ProjectItem {
  id: number;
  projectId: number;
  itemType: 'calculation' | 'cost_matrix' | 'what_if_scenario' | 'report';
  itemId: number;
  addedBy: number;
  addedAt: string | Date;
  itemData?: any; // The actual item data (calculation, etc.)
}

interface ProjectInvitation {
  id: number;
  projectId: number;
  userId: number;
  invitedBy: number;
  role: 'viewer' | 'editor' | 'admin';
  status: 'pending' | 'accepted' | 'declined';
  invitedAt: string | Date;
  projectName: string;
  inviterName: string;
}

interface CollaborationContextType {
  // Projects
  myProjects: Project[];
  publicProjects: Project[];
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;
  
  // Project CRUD
  createProject: (projectData: Partial<Project>) => Promise<Project>;
  updateProject: (projectId: number, projectData: Partial<Project>) => Promise<Project>;
  deleteProject: (projectId: number) => Promise<void>;
  
  // Members
  projectMembers: ProjectMember[];
  addMember: (projectId: number, userId: number, role: string) => Promise<void>;
  updateMemberRole: (projectId: number, userId: number, role: string) => Promise<void>;
  removeMember: (projectId: number, userId: number) => Promise<void>;
  
  // Items
  projectItems: ProjectItem[];
  addProjectItem: (projectId: number, itemType: string, itemId: number) => Promise<void>;
  removeProjectItem: (projectId: number, itemType: string, itemId: number) => Promise<void>;
  
  // Invitations
  myInvitations: ProjectInvitation[];
  acceptInvitation: (invitationId: number) => Promise<void>;
  declineInvitation: (invitationId: number) => Promise<void>;
  
  // Loading states
  isLoadingProjects: boolean;
  isLoadingMembers: boolean;
  isLoadingItems: boolean;
  isLoadingInvitations: boolean;
}

const CollaborationContext = createContext<CollaborationContextType | undefined>(undefined);

export const CollaborationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // States
  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  // Fetch user's projects (both owned and member of)
  const {
    data: myProjects = [],
    isLoading: isLoadingMyProjects,
    refetch: refetchMyProjects
  } = useQuery({
    queryKey: ['/api/shared-projects/my'],
    queryFn: async () => {
      const response = await apiRequest('/api/shared-projects/my');
      return response.json();
    },
    enabled: !!user,
    meta: {
      errorMessage: 'Failed to load your projects'
    }
  });

  // Fetch public projects
  const {
    data: publicProjects = [],
    isLoading: isLoadingPublicProjects,
    refetch: refetchPublicProjects
  } = useQuery({
    queryKey: ['/api/shared-projects/public'],
    queryFn: async () => {
      const response = await apiRequest('/api/shared-projects/public');
      return response.json();
    },
    meta: {
      errorMessage: 'Failed to load public projects'
    }
  });

  // Fetch project members if a project is selected
  const {
    data: projectMembers = [],
    isLoading: isLoadingMembers,
    refetch: refetchMembers
  } = useQuery({
    queryKey: ['/api/shared-projects', currentProject?.id, 'members'],
    queryFn: async () => {
      if (!currentProject?.id) return [];
      const response = await apiRequest(`/api/shared-projects/${currentProject.id}/members`);
      return response.json();
    },
    enabled: !!currentProject?.id,
    meta: {
      errorMessage: 'Failed to load project members'
    }
  });

  // Fetch project items if a project is selected
  const {
    data: projectItems = [],
    isLoading: isLoadingItems,
    refetch: refetchItems
  } = useQuery({
    queryKey: ['/api/shared-projects', currentProject?.id, 'items'],
    queryFn: async () => {
      if (!currentProject?.id) return [];
      const response = await apiRequest(`/api/shared-projects/${currentProject.id}/items`);
      return response.json();
    },
    enabled: !!currentProject?.id,
    meta: {
      errorMessage: 'Failed to load project items'
    }
  });

  // Fetch user's pending invitations
  const {
    data: myInvitations = [],
    isLoading: isLoadingInvitations,
    refetch: refetchInvitations
  } = useQuery({
    queryKey: ['/api/invitations/pending'],
    queryFn: async () => {
      const response = await apiRequest('/api/invitations/pending');
      return response.json();
    },
    enabled: !!user,
    meta: {
      errorMessage: 'Failed to load your invitations'
    }
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (projectData: Partial<Project>) => {
      const response = await apiRequest('/api/shared-projects', {
        method: 'POST',
        body: JSON.stringify(projectData),
        headers: { 'Content-Type': 'application/json' }
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shared-projects/my'] });
      toast({
        title: 'Project created',
        description: 'Your new project has been created successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error creating project',
        description: 'There was a problem creating your project. Please try again.',
        variant: 'destructive',
      });
    }
  });

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: async ({ projectId, projectData }: { projectId: number; projectData: Partial<Project> }) => {
      const response = await apiRequest(`/api/shared-projects/${projectId}`, {
        method: 'PATCH',
        body: JSON.stringify(projectData),
        headers: { 'Content-Type': 'application/json' }
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/shared-projects/my'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shared-projects/public'] });
      if (currentProject?.id === data.id) {
        setCurrentProject(data);
      }
      toast({
        title: 'Project updated',
        description: 'The project has been updated successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error updating project',
        description: 'There was a problem updating the project. Please try again.',
        variant: 'destructive',
      });
    }
  });

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: number) => {
      await apiRequest(`/api/shared-projects/${projectId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shared-projects/my'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shared-projects/public'] });
      if (currentProject) {
        setCurrentProject(null);
      }
      toast({
        title: 'Project deleted',
        description: 'The project has been deleted successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error deleting project',
        description: 'There was a problem deleting the project. Please try again.',
        variant: 'destructive',
      });
    }
  });

  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: async ({ projectId, userId, role }: { projectId: number; userId: number; role: string }) => {
      await apiRequest(`/api/shared-projects/${projectId}/members`, {
        method: 'POST',
        body: JSON.stringify({ userId, role }),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/shared-projects', variables.projectId, 'members'] });
      toast({
        title: 'Member added',
        description: 'The user has been added to the project successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error adding member',
        description: 'There was a problem adding the member. Please try again.',
        variant: 'destructive',
      });
    }
  });

  // Update member role mutation
  const updateMemberRoleMutation = useMutation({
    mutationFn: async ({ projectId, userId, role }: { projectId: number; userId: number; role: string }) => {
      await apiRequest(`/api/shared-projects/${projectId}/members/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/shared-projects', variables.projectId, 'members'] });
      toast({
        title: 'Role updated',
        description: 'The member\'s role has been updated successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error updating role',
        description: 'There was a problem updating the member\'s role. Please try again.',
        variant: 'destructive',
      });
    }
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async ({ projectId, userId }: { projectId: number; userId: number }) => {
      await apiRequest(`/api/shared-projects/${projectId}/members/${userId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/shared-projects', variables.projectId, 'members'] });
      toast({
        title: 'Member removed',
        description: 'The member has been removed from the project successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error removing member',
        description: 'There was a problem removing the member. Please try again.',
        variant: 'destructive',
      });
    }
  });

  // Add project item mutation
  const addProjectItemMutation = useMutation({
    mutationFn: async ({ projectId, itemType, itemId }: { projectId: number; itemType: string; itemId: number }) => {
      await apiRequest(`/api/shared-projects/${projectId}/items`, {
        method: 'POST',
        body: JSON.stringify({ itemType, itemId }),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/shared-projects', variables.projectId, 'items'] });
      toast({
        title: 'Item added',
        description: 'The item has been added to the project successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error adding item',
        description: 'There was a problem adding the item. Please try again.',
        variant: 'destructive',
      });
    }
  });

  // Remove project item mutation
  const removeProjectItemMutation = useMutation({
    mutationFn: async ({ projectId, itemType, itemId }: { projectId: number; itemType: string; itemId: number }) => {
      await apiRequest(`/api/shared-projects/${projectId}/items/${itemType}/${itemId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/shared-projects', variables.projectId, 'items'] });
      toast({
        title: 'Item removed',
        description: 'The item has been removed from the project successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error removing item',
        description: 'There was a problem removing the item. Please try again.',
        variant: 'destructive',
      });
    }
  });

  // Accept invitation mutation
  const acceptInvitationMutation = useMutation({
    mutationFn: async (invitationId: number) => {
      await apiRequest(`/api/invitations/${invitationId}/accept`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invitations/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shared-projects/my'] });
      toast({
        title: 'Invitation accepted',
        description: 'You have successfully joined the project.',
      });
    },
    onError: () => {
      toast({
        title: 'Error accepting invitation',
        description: 'There was a problem accepting the invitation. Please try again.',
        variant: 'destructive',
      });
    }
  });

  // Decline invitation mutation
  const declineInvitationMutation = useMutation({
    mutationFn: async (invitationId: number) => {
      await apiRequest(`/api/invitations/${invitationId}/decline`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invitations/pending'] });
      toast({
        title: 'Invitation declined',
        description: 'You have declined the project invitation.',
      });
    },
    onError: () => {
      toast({
        title: 'Error declining invitation',
        description: 'There was a problem declining the invitation. Please try again.',
        variant: 'destructive',
      });
    }
  });

  // Wrapper functions to handle mutations
  const createProject = async (projectData: Partial<Project>): Promise<Project> => {
    return createProjectMutation.mutateAsync(projectData);
  };

  const updateProject = async (projectId: number, projectData: Partial<Project>): Promise<Project> => {
    return updateProjectMutation.mutateAsync({ projectId, projectData });
  };

  const deleteProject = async (projectId: number): Promise<void> => {
    return deleteProjectMutation.mutateAsync(projectId);
  };

  const addMember = async (projectId: number, userId: number, role: string): Promise<void> => {
    return addMemberMutation.mutateAsync({ projectId, userId, role });
  };

  const updateMemberRole = async (projectId: number, userId: number, role: string): Promise<void> => {
    return updateMemberRoleMutation.mutateAsync({ projectId, userId, role });
  };

  const removeMember = async (projectId: number, userId: number): Promise<void> => {
    return removeMemberMutation.mutateAsync({ projectId, userId });
  };

  const addProjectItem = async (projectId: number, itemType: string, itemId: number): Promise<void> => {
    return addProjectItemMutation.mutateAsync({ projectId, itemType, itemId });
  };

  const removeProjectItem = async (projectId: number, itemType: string, itemId: number): Promise<void> => {
    return removeProjectItemMutation.mutateAsync({ projectId, itemType, itemId });
  };

  const acceptInvitation = async (invitationId: number): Promise<void> => {
    return acceptInvitationMutation.mutateAsync(invitationId);
  };

  const declineInvitation = async (invitationId: number): Promise<void> => {
    return declineInvitationMutation.mutateAsync(invitationId);
  };

  // Combined loading state
  const isLoadingProjects = isLoadingMyProjects || isLoadingPublicProjects;

  // Context value
  const value = {
    // Projects
    myProjects,
    publicProjects,
    currentProject,
    setCurrentProject,
    
    // Project CRUD
    createProject,
    updateProject,
    deleteProject,
    
    // Members
    projectMembers,
    addMember,
    updateMemberRole,
    removeMember,
    
    // Items
    projectItems,
    addProjectItem,
    removeProjectItem,
    
    // Invitations
    myInvitations,
    acceptInvitation,
    declineInvitation,
    
    // Loading states
    isLoadingProjects,
    isLoadingMembers,
    isLoadingItems,
    isLoadingInvitations,
  };

  return (
    <CollaborationContext.Provider value={value}>
      {children}
    </CollaborationContext.Provider>
  );
};

export const useCollaboration = (): CollaborationContextType => {
  const context = useContext(CollaborationContext);
  if (context === undefined) {
    throw new Error('useCollaboration must be used within a CollaborationProvider');
  }
  return context;
};
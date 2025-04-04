/**
 * Collaboration Context Provider
 * 
 * This context provides state and functions for working with shared projects,
 * including project members and project items.
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Define types
interface SharedProject {
  id: number;
  name: string;
  description: string | null;
  createdById: number;
  createdAt: Date;
  updatedAt: Date;
  status: string;
  isPublic: boolean;
}

interface ProjectMember {
  id: number;
  projectId: number;
  userId: number;
  role: string;
  joinedAt: Date;
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
  itemType: string;
  itemId: number;
  addedBy: number;
  addedAt: Date;
  itemData?: any;
}

// Context interface
interface CollaborationContextType {
  // Projects
  myProjects: SharedProject[];
  publicProjects: SharedProject[];
  currentProject: SharedProject | null;
  setCurrentProject: (project: SharedProject | null) => void;
  isLoadingProjects: boolean;
  
  // Project operations
  createProject: (data: { name: string; description?: string; isPublic?: boolean }) => Promise<SharedProject>;
  updateProject: (id: number, data: { name?: string; description?: string; status?: string; isPublic?: boolean }) => Promise<SharedProject>;
  deleteProject: (id: number) => Promise<void>;
  
  // Members
  projectMembers: ProjectMember[];
  isLoadingMembers: boolean;
  
  // Member operations
  addMember: (projectId: number, userId: number, role: string) => Promise<ProjectMember>;
  updateMemberRole: (projectId: number, userId: number, role: string) => Promise<ProjectMember>;
  removeMember: (projectId: number, userId: number) => Promise<void>;
  
  // Items
  projectItems: ProjectItem[];
  isLoadingItems: boolean;
  
  // Item operations
  addProjectItem: (projectId: number, itemType: string, itemId: number) => Promise<ProjectItem>;
  removeProjectItem: (projectId: number, itemType: string, itemId: number) => Promise<void>;
  
  // Utilities
  refreshProjectData: () => void;
}

// Create context
const CollaborationContext = createContext<CollaborationContextType | undefined>(undefined);

// Provider component
export function CollaborationProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State
  const [currentProject, setCurrentProject] = useState<SharedProject | null>(null);
  
  // Queries
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
    meta: {
      errorMessage: 'Failed to load your projects'
    }
  });
  
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
  
  const { 
    data: projectMembers = [],
    isLoading: isLoadingMembers,
    refetch: refetchMembers
  } = useQuery({
    queryKey: ['/api/shared-projects', currentProject?.id, 'members'],
    queryFn: async () => {
      if (!currentProject) return [];
      const response = await apiRequest(`/api/shared-projects/${currentProject.id}/members`);
      return response.json();
    },
    enabled: !!currentProject,
    meta: {
      errorMessage: 'Failed to load project members'
    }
  });
  
  const { 
    data: projectItems = [],
    isLoading: isLoadingItems,
    refetch: refetchItems
  } = useQuery({
    queryKey: ['/api/shared-projects', currentProject?.id, 'items'],
    queryFn: async () => {
      if (!currentProject) return [];
      const response = await apiRequest(`/api/shared-projects/${currentProject.id}/items`);
      return response.json();
    },
    enabled: !!currentProject,
    meta: {
      errorMessage: 'Failed to load project items'
    }
  });
  
  // Mutations
  const createProjectMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; isPublic?: boolean }) => {
      const response = await apiRequest('/api/shared-projects', {
        method: 'POST',
        body: JSON.stringify(data),
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
        title: 'Failed to create project',
        description: 'There was an error creating your project. Please try again.',
        variant: 'destructive',
      });
    }
  });
  
  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest(`/api/shared-projects/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/shared-projects/my'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shared-projects/public'] });
      
      if (currentProject && currentProject.id === data.id) {
        setCurrentProject(data);
      }
      
      toast({
        title: 'Project updated',
        description: 'The project has been updated successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Failed to update project',
        description: 'There was an error updating the project. Please try again.',
        variant: 'destructive',
      });
    }
  });
  
  const deleteProjectMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/shared-projects/${id}`, {
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
        description: 'The project has been deleted.',
      });
    },
    onError: () => {
      toast({
        title: 'Failed to delete project',
        description: 'There was an error deleting the project. Please try again.',
        variant: 'destructive',
      });
    }
  });
  
  const addMemberMutation = useMutation({
    mutationFn: async ({ projectId, userId, role }: { projectId: number; userId: number; role: string }) => {
      const response = await apiRequest(`/api/shared-projects/${projectId}/members`, {
        method: 'POST',
        body: JSON.stringify({ userId, role }),
        headers: { 'Content-Type': 'application/json' }
      });
      return response.json();
    },
    onSuccess: () => {
      refetchMembers();
      toast({
        title: 'Member added',
        description: 'The member has been added to the project.',
      });
    },
    onError: () => {
      toast({
        title: 'Failed to add member',
        description: 'There was an error adding the member. Please try again.',
        variant: 'destructive',
      });
    }
  });
  
  const updateMemberRoleMutation = useMutation({
    mutationFn: async ({ projectId, userId, role }: { projectId: number; userId: number; role: string }) => {
      const response = await apiRequest(`/api/shared-projects/${projectId}/members/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
        headers: { 'Content-Type': 'application/json' }
      });
      return response.json();
    },
    onSuccess: () => {
      refetchMembers();
      toast({
        title: 'Member role updated',
        description: 'The member\'s role has been updated.',
      });
    },
    onError: () => {
      toast({
        title: 'Failed to update role',
        description: 'There was an error updating the member\'s role. Please try again.',
        variant: 'destructive',
      });
    }
  });
  
  const removeMemberMutation = useMutation({
    mutationFn: async ({ projectId, userId }: { projectId: number; userId: number }) => {
      await apiRequest(`/api/shared-projects/${projectId}/members/${userId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      refetchMembers();
      toast({
        title: 'Member removed',
        description: 'The member has been removed from the project.',
      });
    },
    onError: () => {
      toast({
        title: 'Failed to remove member',
        description: 'There was an error removing the member. Please try again.',
        variant: 'destructive',
      });
    }
  });
  
  const addItemMutation = useMutation({
    mutationFn: async ({ projectId, itemType, itemId }: { projectId: number; itemType: string; itemId: number }) => {
      const response = await apiRequest(`/api/shared-projects/${projectId}/items`, {
        method: 'POST',
        body: JSON.stringify({ itemType, itemId }),
        headers: { 'Content-Type': 'application/json' }
      });
      return response.json();
    },
    onSuccess: () => {
      refetchItems();
      toast({
        title: 'Item added',
        description: 'The item has been added to the project.',
      });
    },
    onError: () => {
      toast({
        title: 'Failed to add item',
        description: 'There was an error adding the item to the project. Please try again.',
        variant: 'destructive',
      });
    }
  });
  
  const removeItemMutation = useMutation({
    mutationFn: async ({ projectId, itemType, itemId }: { projectId: number; itemType: string; itemId: number }) => {
      await apiRequest(`/api/shared-projects/${projectId}/items/${itemType}/${itemId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      refetchItems();
      toast({
        title: 'Item removed',
        description: 'The item has been removed from the project.',
      });
    },
    onError: () => {
      toast({
        title: 'Failed to remove item',
        description: 'There was an error removing the item from the project. Please try again.',
        variant: 'destructive',
      });
    }
  });
  
  // Helper functions
  const createProject = useCallback(async (data: { name: string; description?: string; isPublic?: boolean }) => {
    return createProjectMutation.mutateAsync(data);
  }, [createProjectMutation]);
  
  const updateProject = useCallback(async (id: number, data: { name?: string; description?: string; status?: string; isPublic?: boolean }) => {
    return updateProjectMutation.mutateAsync({ id, data });
  }, [updateProjectMutation]);
  
  const deleteProject = useCallback(async (id: number) => {
    return deleteProjectMutation.mutateAsync(id);
  }, [deleteProjectMutation]);
  
  const addMember = useCallback(async (projectId: number, userId: number, role: string) => {
    return addMemberMutation.mutateAsync({ projectId, userId, role });
  }, [addMemberMutation]);
  
  const updateMemberRole = useCallback(async (projectId: number, userId: number, role: string) => {
    return updateMemberRoleMutation.mutateAsync({ projectId, userId, role });
  }, [updateMemberRoleMutation]);
  
  const removeMember = useCallback(async (projectId: number, userId: number) => {
    return removeMemberMutation.mutateAsync({ projectId, userId });
  }, [removeMemberMutation]);
  
  const addProjectItem = useCallback(async (projectId: number, itemType: string, itemId: number) => {
    return addItemMutation.mutateAsync({ projectId, itemType, itemId });
  }, [addItemMutation]);
  
  const removeProjectItem = useCallback(async (projectId: number, itemType: string, itemId: number) => {
    return removeItemMutation.mutateAsync({ projectId, itemType, itemId });
  }, [removeItemMutation]);
  
  const refreshProjectData = useCallback(() => {
    refetchMyProjects();
    refetchPublicProjects();
    
    if (currentProject) {
      refetchMembers();
      refetchItems();
    }
  }, [currentProject, refetchMyProjects, refetchPublicProjects, refetchMembers, refetchItems]);
  
  const contextValue = {
    // Projects
    myProjects,
    publicProjects,
    currentProject,
    setCurrentProject,
    isLoadingProjects: isLoadingMyProjects || isLoadingPublicProjects,
    
    // Project operations
    createProject,
    updateProject,
    deleteProject,
    
    // Members
    projectMembers,
    isLoadingMembers,
    
    // Member operations
    addMember,
    updateMemberRole,
    removeMember,
    
    // Items
    projectItems,
    isLoadingItems,
    
    // Item operations
    addProjectItem,
    removeProjectItem,
    
    // Utilities
    refreshProjectData,
  };
  
  return (
    <CollaborationContext.Provider value={contextValue}>
      {children}
    </CollaborationContext.Provider>
  );
}

// Custom hook to use the collaboration context
export function useCollaboration() {
  const context = useContext(CollaborationContext);
  if (context === undefined) {
    throw new Error('useCollaboration must be used within a CollaborationProvider');
  }
  return context;
}
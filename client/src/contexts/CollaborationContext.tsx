import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useQueryClient } from '@tanstack/react-query';

// Project types
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

// Project member types
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

// Project item types (for associating calculations, cost matrices, etc. with projects)
interface ProjectItem {
  id: number;
  projectId: number;
  itemType: 'calculation' | 'cost_matrix' | 'what_if_scenario' | 'report';
  itemId: number;
  addedBy: number;
  addedAt: string | Date;
  itemData?: any; // The actual item data (calculation, etc.)
}

// Project invitation types
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

// Context type definition
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
  isCreatingProject: boolean;
}

// Create the context
const CollaborationContext = createContext(undefined);

// Provider component
export const CollaborationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for projects
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [publicProjects, setPublicProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  
  // State for members, items, invitations
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [projectItems, setProjectItems] = useState<ProjectItem[]>([]);
  const [myInvitations, setMyInvitations] = useState<ProjectInvitation[]>([]);
  
  // Loading states
  const [isLoadingProjects, setIsLoadingProjects] = useState<boolean>(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState<boolean>(false);
  const [isLoadingItems, setIsLoadingItems] = useState<boolean>(false);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState<boolean>(false);
  const [isCreatingProject, setIsCreatingProject] = useState<boolean>(false);

  // Fetch my projects
  const fetchMyProjects = async () => {
    if (!user) return;
    
    setIsLoadingProjects(true);
    
    try {
      const response = await apiRequest('/api/shared-projects/my');
      const data = await response.json();
      setMyProjects(data);
    } catch (error) {
      console.error('Error fetching my projects:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your projects',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingProjects(false);
    }
  };

  // Fetch public projects
  const fetchPublicProjects = async () => {
    setIsLoadingProjects(true);
    
    try {
      const response = await apiRequest('/api/shared-projects/public');
      const data = await response.json();
      setPublicProjects(data);
    } catch (error) {
      console.error('Error fetching public projects:', error);
      toast({
        title: 'Error',
        description: 'Failed to load public projects',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingProjects(false);
    }
  };

  // Fetch project members
  const fetchProjectMembers = async (projectId: number) => {
    if (!projectId) return;
    
    setIsLoadingMembers(true);
    
    try {
      const response = await apiRequest(`/api/projects/${projectId}/members`);
      const data = await response.json();
      setProjectMembers(data);
    } catch (error) {
      console.error('Error fetching project members:', error);
      toast({
        title: 'Error',
        description: 'Failed to load project members',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingMembers(false);
    }
  };

  // Fetch project items
  const fetchProjectItems = async (projectId: number) => {
    if (!projectId) return;
    
    setIsLoadingItems(true);
    
    try {
      const response = await apiRequest(`/api/projects/${projectId}/items`);
      const data = await response.json();
      setProjectItems(data);
    } catch (error) {
      console.error('Error fetching project items:', error);
      toast({
        title: 'Error',
        description: 'Failed to load project items',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingItems(false);
    }
  };

  // Fetch my invitations
  const fetchMyInvitations = async () => {
    if (!user) return;
    
    setIsLoadingInvitations(true);
    
    try {
      const response = await apiRequest('/api/invitations/pending');
      const data = await response.json();
      setMyInvitations(data);
    } catch (error) {
      console.error('Error fetching invitations:', error);
      // Don't show a toast for invitation errors, as they're not critical
    } finally {
      setIsLoadingInvitations(false);
    }
  };

  // Create a new project
  const createProject = async (projectData: Partial<Project>): Promise<Project> => {
    if (!user) {
      throw new Error('You must be logged in to create a project');
    }
    
    setIsCreatingProject(true);
    
    try {
      const response = await apiRequest('/api/shared-projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create project');
      }
      
      const project = await response.json();
      
      // Update local state
      setMyProjects(prev => [...prev, project]);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['shared-projects'] });
      
      return project;
    } finally {
      setIsCreatingProject(false);
    }
  };

  // Update an existing project
  const updateProject = async (projectId: number, projectData: Partial<Project>): Promise<Project> => {
    const response = await apiRequest(`/api/shared-projects/${projectId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(projectData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update project');
    }
    
    const updatedProject = await response.json();
    
    // Update local state
    setMyProjects(prev => prev.map(p => p.id === projectId ? updatedProject : p));
    setPublicProjects(prev => prev.map(p => p.id === projectId ? updatedProject : p));
    
    if (currentProject && currentProject.id === projectId) {
      setCurrentProject(updatedProject);
    }
    
    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: ['shared-projects'] });
    
    return updatedProject;
  };

  // Delete a project
  const deleteProject = async (projectId: number): Promise<void> => {
    const response = await apiRequest(`/api/shared-projects/${projectId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete project');
    }
    
    // Update local state
    setMyProjects(prev => prev.filter(p => p.id !== projectId));
    setPublicProjects(prev => prev.filter(p => p.id !== projectId));
    
    if (currentProject && currentProject.id === projectId) {
      setCurrentProject(null);
    }
    
    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: ['shared-projects'] });
  };

  // Add a member to a project
  const addMember = async (projectId: number, userId: number, role: string): Promise<void> => {
    const response = await apiRequest(`/api/projects/${projectId}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, role }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add member');
    }
    
    // Refresh project members
    await fetchProjectMembers(projectId);
    
    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
  };

  // Update a member's role in a project
  const updateMemberRole = async (projectId: number, userId: number, role: string): Promise<void> => {
    const response = await apiRequest(`/api/projects/${projectId}/members/${userId}/role`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update member role');
    }
    
    // Update local state
    setProjectMembers(prev => 
      prev.map(member => 
        member.projectId === projectId && member.userId === userId
          ? { ...member, role: role as 'viewer' | 'editor' | 'admin' }
          : member
      )
    );
    
    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
  };

  // Remove a member from a project
  const removeMember = async (projectId: number, userId: number): Promise<void> => {
    const response = await apiRequest(`/api/projects/${projectId}/members/${userId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to remove member');
    }
    
    // Update local state
    setProjectMembers(prev => 
      prev.filter(member => !(member.projectId === projectId && member.userId === userId))
    );
    
    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
  };

  // Add an item to a project
  const addProjectItem = async (projectId: number, itemType: string, itemId: number): Promise<void> => {
    const response = await apiRequest(`/api/projects/${projectId}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ itemType, itemId }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add item to project');
    }
    
    // Refresh project items
    await fetchProjectItems(projectId);
    
    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: ['project-items', projectId] });
  };

  // Remove an item from a project
  const removeProjectItem = async (projectId: number, itemType: string, itemId: number): Promise<void> => {
    const response = await apiRequest(`/api/projects/${projectId}/items/${itemType}/${itemId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to remove item from project');
    }
    
    // Update local state
    setProjectItems(prev => 
      prev.filter(item => 
        !(item.projectId === projectId && item.itemType === itemType && item.itemId === itemId)
      )
    );
    
    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: ['project-items', projectId] });
  };

  // Accept an invitation
  const acceptInvitation = async (invitationId: number): Promise<void> => {
    const response = await apiRequest(`/api/invitations/${invitationId}/accept`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to accept invitation');
    }
    
    // Update local state
    const invitation = myInvitations.find(inv => inv.id === invitationId);
    if (invitation) {
      setMyInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      
      // Refresh my projects as we now have a new one
      fetchMyProjects();
    }
    
    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: ['invitations'] });
    queryClient.invalidateQueries({ queryKey: ['shared-projects'] });
  };

  // Decline an invitation
  const declineInvitation = async (invitationId: number): Promise<void> => {
    const response = await apiRequest(`/api/invitations/${invitationId}/decline`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to decline invitation');
    }
    
    // Update local state
    setMyInvitations(prev => prev.filter(inv => inv.id !== invitationId));
    
    // Invalidate queries
    queryClient.invalidateQueries({ queryKey: ['invitations'] });
  };

  // Set up data fetching when user changes
  useEffect(() => {
    if (user) {
      fetchMyProjects();
      fetchMyInvitations();
    } else {
      setMyProjects([]);
      setMyInvitations([]);
    }
    
    fetchPublicProjects();
  }, [user]);

  // Fetch project details when current project changes
  useEffect(() => {
    if (currentProject) {
      fetchProjectMembers(currentProject.id);
      fetchProjectItems(currentProject.id);
    } else {
      setProjectMembers([]);
      setProjectItems([]);
    }
  }, [currentProject]);

  // Set up periodic refresh for invitations
  useEffect(() => {
    if (!user) return;
    
    const refreshInvitations = () => {
      fetchMyInvitations();
    };
    
    // Check for new invitations every minute
    const interval = setInterval(refreshInvitations, 60000);
    
    return () => clearInterval(interval);
  }, [user]);

  // Context value
  const value = {
    myProjects,
    publicProjects,
    currentProject,
    setCurrentProject,
    createProject,
    updateProject,
    deleteProject,
    projectMembers,
    addMember,
    updateMemberRole,
    removeMember,
    projectItems,
    addProjectItem,
    removeProjectItem,
    myInvitations,
    acceptInvitation,
    declineInvitation,
    isLoadingProjects,
    isLoadingMembers,
    isLoadingItems,
    isLoadingInvitations,
    isCreatingProject,
  };

  return (
    <CollaborationContext.Provider value={value}>
      {children}
    </CollaborationContext.Provider>
  );
};

// Hook for using the collaboration context
export const useCollaboration = () => {
  const context = useContext(CollaborationContext);
  
  if (context === undefined) {
    throw new Error('useCollaboration must be used within a CollaborationProvider');
  }
  
  return context;
}
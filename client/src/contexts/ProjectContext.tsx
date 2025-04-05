import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Define ProjectMember type here to avoid circular imports
export type ProjectMember = {
  id: number;
  userId: number;
  projectId: number;
  role: string;
  joinedAt: string | Date;
  invitedBy: number;
  user: {
    username: string;
    name: string | null;
  };
};

export type Project = {
  id: number;
  name: string;
  description: string | null;
  createdById: number;
  createdAt: Date;
  updatedAt: Date;
  status: string;
  isPublic: boolean;
};

interface ProjectContextType {
  project: Project | null;
  isLoading: boolean;
  error: Error | null;
  members: ProjectMember[];
  isMembersLoading: boolean;
  activities: any[]; // Add this property
  items: any[]; // Add this property
  isActivitiesLoading: boolean; // Add this property
  isItemsLoading: boolean; // Add this property
  currentUserRole: string;
  currentUserId: number;
  isOwner: boolean;
  canEdit: boolean;
  canManage: boolean;
  refreshProject: () => void;
  refreshMembers: () => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

interface ProjectProviderProps {
  children: ReactNode;
  currentUserId: number;
  projectId?: number;
}

export const ProjectProvider: React.FC<ProjectProviderProps> = ({ children, currentUserId, projectId: propsProjectId }) => {
  const { toast } = useToast();
  const params = useParams();
  const paramProjectId = params.id ? parseInt(params.id, 10) : undefined;
  const projectId = propsProjectId || paramProjectId;
  
  const {
    data: project,
    isLoading: isProjectLoading,
    error,
    refetch: refetchProject
  } = useQuery({
    queryKey: [`/api/shared-projects/${projectId}`],
    queryFn: async () => {
      if (!projectId) return null;
      const response = await fetch(`/api/shared-projects/${projectId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch project details');
      }
      return response.json();
    },
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const {
    data: members = [],
    isLoading: isMembersLoading,
    refetch: refetchMembers
  } = useQuery({
    queryKey: [`/api/shared-projects/${projectId}/members`],
    queryFn: async () => {
      if (!projectId) return [];
      const response = await fetch(`/api/shared-projects/${projectId}/members`);
      if (!response.ok) {
        throw new Error('Failed to fetch project members');
      }
      return response.json();
    },
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Fetch project activities
  const {
    data: activities = [],
    isLoading: isActivitiesLoading,
    refetch: refetchActivities
  } = useQuery({
    queryKey: [`/api/shared-projects/${projectId}/activities`],
    queryFn: async () => {
      if (!projectId) return [];
      const response = await fetch(`/api/shared-projects/${projectId}/activities`);
      if (!response.ok) {
        throw new Error('Failed to fetch project activities');
      }
      return response.json();
    },
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Fetch project items
  const {
    data: items = [],
    isLoading: isItemsLoading,
    refetch: refetchItems
  } = useQuery({
    queryKey: [`/api/shared-projects/${projectId}/items`],
    queryFn: async () => {
      if (!projectId) return [];
      const response = await fetch(`/api/shared-projects/${projectId}/items`);
      if (!response.ok) {
        throw new Error('Failed to fetch project items');
      }
      return response.json();
    },
    enabled: !!projectId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Find current user's role in the project
  const currentUserMember = members.find((member: ProjectMember) => member.userId === currentUserId);
  const isOwner = project ? project.createdById === currentUserId : false;
  const currentUserRole = currentUserMember?.role || (isOwner ? 'admin' : '');
  
  // Determine permissions
  const canEdit = isOwner || ['admin', 'editor'].includes(currentUserRole);
  const canManage = isOwner || currentUserRole === 'admin';

  const refreshProject = () => {
    refetchProject();
  };

  const refreshMembers = () => {
    refetchMembers();
  };

  return (
    <ProjectContext.Provider
      value={{
        project,
        isLoading: isProjectLoading,
        error,
        members,
        isMembersLoading,
        activities,
        items,
        isActivitiesLoading,
        isItemsLoading,
        currentUserRole,
        currentUserId,
        isOwner,
        canEdit,
        canManage,
        refreshProject,
        refreshMembers
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjectContext = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjectContext must be used within a ProjectProvider');
  }
  return context;
};
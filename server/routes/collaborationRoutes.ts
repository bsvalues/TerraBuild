/**
 * Collaboration API routes for the Building Cost System
 * 
 * These routes handle shared projects, project members, and project items
 * enabling collaboration features for the application.
 */

import { Express, Response } from 'express';
import { z } from 'zod';
import { storage } from '../storage-implementation';
import { 
  insertSharedProjectSchema, 
  insertProjectMemberSchema, 
  insertProjectItemSchema,
  SharedProject,
  ProjectMember,
  ProjectItem
} from '@shared/schema';

// Extended Request interface with project properties
interface Request {
  user?: {
    id: number;
    username: string;
    role: string;
  };
  project?: SharedProject;
  projectMember?: ProjectMember;
  params: any;
  body: any;
}

export function registerCollaborationRoutes(app: Express): void {
  /**
   * Middleware to check if a user has access to a project
   * A user has access if they:
   * 1. Created the project
   * 2. Are a member of the project
   * 3. The project is public
   * 4. The user is an admin
   */
  const checkProjectAccess = async (req: Request, res: Response, next: Function) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const projectId = parseInt(req.params.projectId);
    if (isNaN(projectId)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }

    const project = await storage.getSharedProject(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Admin users have access to all projects
    if (req.user.role === 'admin') {
      req.project = project;
      return next();
    }

    // Project creator has access
    if (project.createdById === req.user.id) {
      req.project = project;
      return next();
    }

    // Project is public
    if (project.isPublic) {
      req.project = project;
      return next();
    }

    // Check if user is a member
    const projectMember = await storage.getProjectMember(projectId, req.user.id);
    if (projectMember) {
      req.project = project;
      req.projectMember = projectMember;
      return next();
    }

    return res.status(403).json({ message: "Access denied to this project" });
  };

  /**
   * Middleware to check if a user has edit permissions for a project
   * A user can edit if they:
   * 1. Created the project
   * 2. Are a member with 'editor' or 'admin' role
   * 3. The user is an admin
   */
  const checkProjectEditAccess = async (req: Request, res: Response, next: Function) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // For checkProjectAccess middleware already added the project to the request
    // We need to make sure it's there
    if (!req.project) {
      return res.status(500).json({ message: "Project access not verified" });
    }

    // Admin users have edit access to all projects
    if (req.user.role === 'admin') {
      return next();
    }

    // Project creator has edit access
    if (req.project.createdById === req.user.id) {
      return next();
    }

    // Check if user is a member with edit permissions
    if (req.projectMember && (req.projectMember.role === 'editor' || req.projectMember.role === 'admin')) {
      return next();
    }

    return res.status(403).json({ message: "You don't have edit permissions for this project" });
  };

  /**
   * Middleware to check if a user has admin permissions for a project
   * A user is an admin if they:
   * 1. Created the project
   * 2. Are a member with 'admin' role
   * 3. The user is an application admin
   */
  const checkProjectAdminAccess = async (req: Request, res: Response, next: Function) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!req.project) {
      return res.status(500).json({ message: "Project access not verified" });
    }

    // Admin users have admin access to all projects
    if (req.user.role === 'admin') {
      return next();
    }

    // Project creator has admin access
    if (req.project.createdById === req.user.id) {
      return next();
    }

    // Check if user is a member with admin permissions
    if (req.projectMember && req.projectMember.role === 'admin') {
      return next();
    }

    return res.status(403).json({ message: "You don't have admin permissions for this project" });
  };

  // Shared Projects API

  // Get all shared projects (for admin)
  app.get('/api/shared-projects', async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // Only admin can see all projects
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const projects = await storage.getAllSharedProjects();
      res.json(projects);
    } catch (error) {
      console.error("Error fetching shared projects:", error);
      res.status(500).json({ message: "Error fetching shared projects" });
    }
  });

  // Get public projects
  app.get('/api/shared-projects/public', async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const allProjects = await storage.getAllSharedProjects();
      const publicProjects = allProjects.filter(project => project.isPublic);
      res.json(publicProjects);
    } catch (error) {
      console.error("Error fetching public projects:", error);
      res.status(500).json({ message: "Error fetching public projects" });
    }
  });

  // Get my projects (created by me or shared with me)
  app.get('/api/shared-projects/my', async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const userProjects = await storage.getSharedProjectsByUser(req.user.id);
      res.json(userProjects);
    } catch (error) {
      console.error("Error fetching user projects:", error);
      res.status(500).json({ message: "Error fetching user projects" });
    }
  });

  // Get a specific shared project
  app.get('/api/shared-projects/:projectId', checkProjectAccess, async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      res.json(req.project);
    } catch (error) {
      console.error("Error fetching shared project:", error);
      res.status(500).json({ message: "Error fetching shared project" });
    }
  });

  // Create a new shared project
  app.post('/api/shared-projects', async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const projectData = insertSharedProjectSchema.parse(req.body);
      
      // Set the creator ID from the authenticated user
      projectData.createdById = req.user.id;
      
      const project = await storage.createSharedProject(projectData);
      
      // Log the activity
      await storage.createActivity({
        action: `Created new shared project: ${project.name}`,
        icon: "ri-team-line",
        iconColor: "primary"
      });
      
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      console.error("Error creating shared project:", error);
      res.status(500).json({ message: "Error creating shared project" });
    }
  });

  // Update a shared project
  app.patch('/api/shared-projects/:projectId', checkProjectEditAccess, async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const projectData = req.body;
      
      const updatedProject = await storage.updateSharedProject(projectId, projectData);
      if (!updatedProject) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Log the activity
      await storage.createActivity({
        action: `Updated shared project: ${updatedProject.name}`,
        icon: "ri-edit-line",
        iconColor: "primary"
      });
      
      res.json(updatedProject);
    } catch (error) {
      console.error("Error updating shared project:", error);
      res.status(500).json({ message: "Error updating shared project" });
    }
  });

  // Delete a shared project
  app.delete('/api/shared-projects/:projectId', checkProjectAdminAccess, async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const projectName = req.project?.name || "Unknown project";
      
      await storage.deleteSharedProject(projectId);
      
      // Log the activity
      await storage.createActivity({
        action: `Deleted shared project: ${projectName}`,
        icon: "ri-delete-bin-line",
        iconColor: "danger"
      });
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting shared project:", error);
      res.status(500).json({ message: "Error deleting shared project" });
    }
  });

  // Project Members API

  // Get all members of a project
  app.get('/api/shared-projects/:projectId/members', checkProjectAccess, async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const members = await storage.getProjectMembers(projectId);
      
      // Enhance with user data
      const membersWithUserData = await Promise.all(
        members.map(async (member) => {
          const user = await storage.getUser(member.userId);
          return {
            ...member,
            user: user ? {
              username: user.username,
              name: user.name,
              id: user.id
            } : null
          };
        })
      );
      
      res.json(membersWithUserData);
    } catch (error) {
      console.error("Error fetching project members:", error);
      res.status(500).json({ message: "Error fetching project members" });
    }
  });

  // Add a member to a project
  app.post('/api/shared-projects/:projectId/members', checkProjectAdminAccess, async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      
      // Validate the member data
      const memberData = insertProjectMemberSchema.parse({
        ...req.body,
        projectId,
        invitedBy: req.user?.id || 0
      });
      
      // Check if the user exists
      const user = await storage.getUser(memberData.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if the user is already a member
      const existingMember = await storage.getProjectMember(projectId, memberData.userId);
      if (existingMember) {
        return res.status(409).json({ message: "User is already a member of this project" });
      }
      
      const member = await storage.addProjectMember(memberData);
      
      // Log the activity
      await storage.createActivity({
        action: `Added ${user.username} to project: ${req.project?.name || 'Unknown'} as ${member.role}`,
        icon: "ri-user-add-line",
        iconColor: "success"
      });
      
      res.status(201).json(member);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      console.error("Error adding project member:", error);
      res.status(500).json({ message: "Error adding project member" });
    }
  });

  // Update a member's role
  app.patch('/api/shared-projects/:projectId/members/:userId', checkProjectAdminAccess, async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const userId = parseInt(req.params.userId);
      const { role } = req.body;
      
      if (!role || !['viewer', 'editor', 'admin'].includes(role)) {
        return res.status(400).json({ message: "Invalid role. Must be 'viewer', 'editor', or 'admin'" });
      }
      
      // Check if the user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const updatedMember = await storage.updateProjectMemberRole(projectId, userId, role);
      if (!updatedMember) {
        return res.status(404).json({ message: "User is not a member of this project" });
      }
      
      // Log the activity
      await storage.createActivity({
        action: `Changed ${user.username}'s role to ${role} in project: ${req.project?.name || 'Unknown'}`,
        icon: "ri-user-settings-line",
        iconColor: "primary"
      });
      
      res.json(updatedMember);
    } catch (error) {
      console.error("Error updating project member:", error);
      res.status(500).json({ message: "Error updating project member" });
    }
  });

  // Remove a member from a project
  app.delete('/api/shared-projects/:projectId/members/:userId', checkProjectAdminAccess, async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const userId = parseInt(req.params.userId);
      
      // Check if the user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Can't remove the project creator
      if (req.project?.createdById === userId) {
        return res.status(403).json({ message: "Cannot remove the project creator" });
      }
      
      // Check if the user is a member
      const member = await storage.getProjectMember(projectId, userId);
      if (!member) {
        return res.status(404).json({ message: "User is not a member of this project" });
      }
      
      await storage.removeProjectMember(projectId, userId);
      
      // Log the activity
      await storage.createActivity({
        action: `Removed ${user.username} from project: ${req.project.name}`,
        icon: "ri-user-unfollow-line",
        iconColor: "danger"
      });
      
      res.status(204).send();
    } catch (error) {
      console.error("Error removing project member:", error);
      res.status(500).json({ message: "Error removing project member" });
    }
  });

  // Project Items API

  // Get all items in a project
  app.get('/api/shared-projects/:projectId/items', checkProjectAccess, async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const items = await storage.getProjectItems(projectId);
      
      // Enhance items with additional data based on their type
      const enhancedItems = await Promise.all(
        items.map(async (item) => {
          let itemData = null;
          
          switch (item.itemType) {
            case 'calculation':
              itemData = await storage.getBuildingCost(item.itemId);
              break;
            case 'cost_matrix':
              itemData = await storage.getCostMatrix(item.itemId);
              break;
            case 'what_if_scenario':
              itemData = await storage.getWhatIfScenario(item.itemId);
              break;
            // Add more item types as needed
          }
          
          return {
            ...item,
            itemData
          };
        })
      );
      
      res.json(enhancedItems);
    } catch (error) {
      console.error("Error fetching project items:", error);
      res.status(500).json({ message: "Error fetching project items" });
    }
  });

  // Add an item to a project
  app.post('/api/shared-projects/:projectId/items', checkProjectEditAccess, async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      
      // Validate the item data
      const itemData = insertProjectItemSchema.parse({
        ...req.body,
        projectId,
        addedBy: req.user?.id || 0
      });
      
      // Check if the item already exists in the project
      const existingItem = await storage.getProjectItem(
        projectId, 
        itemData.itemType, 
        itemData.itemId
      );
      
      if (existingItem) {
        return res.status(409).json({ 
          message: "This item is already in the project" 
        });
      }
      
      // Verify that the referenced item exists
      let itemExists = false;
      let itemName = "";
      
      switch (itemData.itemType) {
        case 'calculation':
          const calculation = await storage.getBuildingCost(itemData.itemId);
          itemExists = !!calculation;
          itemName = calculation?.name || "Calculation";
          break;
        case 'cost_matrix':
          const matrix = await storage.getCostMatrix(itemData.itemId);
          itemExists = !!matrix;
          itemName = `Cost Matrix (${matrix?.region || "Unknown"}/${matrix?.buildingType || "Unknown"})`;
          break;
        case 'what_if_scenario':
          const scenario = await storage.getWhatIfScenario(itemData.itemId);
          itemExists = !!scenario;
          itemName = scenario?.name || "What-If Scenario";
          break;
        // Add more item types as needed
      }
      
      if (!itemExists) {
        return res.status(404).json({ 
          message: `${itemData.itemType} with ID ${itemData.itemId} not found` 
        });
      }
      
      const item = await storage.addProjectItem(itemData);
      
      // Log the activity
      await storage.createActivity({
        action: `Added ${itemName} to project: ${req.project.name}`,
        icon: "ri-add-line",
        iconColor: "success"
      });
      
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      console.error("Error adding project item:", error);
      res.status(500).json({ message: "Error adding project item" });
    }
  });

  // Remove an item from a project
  app.delete(
    '/api/shared-projects/:projectId/items/:itemType/:itemId', 
    checkProjectEditAccess, 
    async (req: Request, res: Response) => {
      try {
        const projectId = parseInt(req.params.projectId);
        const itemType = req.params.itemType;
        const itemId = parseInt(req.params.itemId);
        
        // Check if the item exists in the project
        const item = await storage.getProjectItem(projectId, itemType, itemId);
        if (!item) {
          return res.status(404).json({ 
            message: "Item not found in this project" 
          });
        }
        
        await storage.removeProjectItem(projectId, itemType, itemId);
        
        // Log the activity
        await storage.createActivity({
          action: `Removed ${itemType} from project: ${req.project.name}`,
          icon: "ri-subtract-line",
          iconColor: "warning"
        });
        
        res.status(204).send();
      } catch (error) {
        console.error("Error removing project item:", error);
        res.status(500).json({ message: "Error removing project item" });
      }
    }
  );

  // Log that collaboration routes were registered
  console.log('Collaboration routes registered successfully');
}

// Define types to extend the Express Request object
declare global {
  namespace Express {
    interface Request {
      project?: any;
      projectMember?: any;
    }
  }
}
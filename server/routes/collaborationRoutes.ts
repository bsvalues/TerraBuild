/**
 * Collaboration Routes for Building Cost Building System
 * 
 * This module contains routes for collaboration features such as comments,
 * shared projects, and project sharing functionality.
 */
import { Request, Response } from "express";
import { storage } from "../storage";
import { 
  insertCommentSchema,
  insertSharedProjectSchema,
  insertProjectMemberSchema,
  insertProjectItemSchema
} from "@shared/schema";
import { z } from "zod";

/**
 * Register collaboration routes
 */
export function registerCollaborationRoutes(app: any) {
  // Middleware to ensure user is authenticated
  const requireAuth = (req: Request, res: Response, next: Function) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized: You must be logged in" });
    }
    next();
  };

  // === Comments API ===
  
  // Get comments for a specific target
  app.get("/api/comments/:targetType/:targetId", async (req: Request, res: Response) => {
    try {
      const { targetType, targetId } = req.params;
      const comments = await storage.getCommentsByTarget(targetType, parseInt(targetId));
      res.json(comments);
    } catch (error: any) {
      res.status(500).json({ message: `Error fetching comments: ${error.message}` });
    }
  });
  
  // Create a new comment
  app.post("/api/comments", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const commentData = { ...req.body, userId };
      
      const validatedData = insertCommentSchema.parse(commentData);
      const createdComment = await storage.createComment(validatedData);
      
      // Log activity
      await storage.createActivity({
        action: `Added comment on ${validatedData.targetType} #${validatedData.targetId}`,
        icon: "ri-chat-1-line",
        iconColor: "primary"
      });
      
      res.status(201).json(createdComment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: "Error creating comment" });
      }
    }
  });
  
  // Update a comment
  app.patch("/api/comments/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user!.id;
      
      // Get the comment to check ownership
      const comment = await storage.getComment(id);
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      // Check if the user is the owner of the comment or an admin
      if (comment.userId !== userId && req.user!.role !== "admin") {
        return res.status(403).json({ message: "Forbidden: You can only edit your own comments" });
      }
      
      // Update the comment
      const updatedComment = await storage.updateComment(id, {
        ...req.body,
        isEdited: true
      });
      
      res.json(updatedComment);
    } catch (error: any) {
      res.status(500).json({ message: `Error updating comment: ${error.message}` });
    }
  });
  
  // Delete a comment
  app.delete("/api/comments/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user!.id;
      
      // Get the comment to check ownership
      const comment = await storage.getComment(id);
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      // Check if the user is the owner of the comment or an admin
      if (comment.userId !== userId && req.user!.role !== "admin") {
        return res.status(403).json({ message: "Forbidden: You can only delete your own comments" });
      }
      
      // Delete the comment
      await storage.deleteComment(id);
      
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: `Error deleting comment: ${error.message}` });
    }
  });
  
  // === Shared Projects API ===
  
  // Get all projects a user is a member of
  app.get("/api/projects", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const projects = await storage.getProjectsByUser(userId);
      res.json(projects);
    } catch (error: any) {
      res.status(500).json({ message: `Error fetching projects: ${error.message}` });
    }
  });
  
  // Get a specific project by ID
  app.get("/api/projects/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user!.id;
      
      // Get the project
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Check if the user is a member of the project or it's public
      const isMember = await storage.isProjectMember(id, userId);
      if (!isMember && !project.isPublic && req.user!.role !== "admin") {
        return res.status(403).json({ message: "Forbidden: You don't have access to this project" });
      }
      
      // Get project members
      const members = await storage.getProjectMembers(id);
      
      // Get project items
      const items = await storage.getProjectItems(id);
      
      res.json({
        ...project,
        members,
        items
      });
    } catch (error: any) {
      res.status(500).json({ message: `Error fetching project: ${error.message}` });
    }
  });
  
  // Create a new project
  app.post("/api/projects", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const projectData = { ...req.body, createdById: userId };
      
      const validatedData = insertSharedProjectSchema.parse(projectData);
      const createdProject = await storage.createProject(validatedData);
      
      // Add creator as an admin member
      await storage.addProjectMember({
        projectId: createdProject.id,
        userId,
        role: "admin",
        invitedBy: userId
      });
      
      // Log activity
      await storage.createActivity({
        action: `Created new shared project: ${validatedData.name}`,
        icon: "ri-team-line",
        iconColor: "success"
      });
      
      res.status(201).json(createdProject);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: "Error creating project" });
      }
    }
  });
  
  // Update a project
  app.patch("/api/projects/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user!.id;
      
      // Check if the user has admin access to the project
      const memberRole = await storage.getProjectMemberRole(id, userId);
      if (memberRole !== "admin" && req.user!.role !== "admin") {
        return res.status(403).json({ message: "Forbidden: You need admin access to update this project" });
      }
      
      // Update the project
      const updatedProject = await storage.updateProject(id, req.body);
      
      res.json(updatedProject);
    } catch (error: any) {
      res.status(500).json({ message: `Error updating project: ${error.message}` });
    }
  });
  
  // Delete a project
  app.delete("/api/projects/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user!.id;
      
      // Check if the user has admin access to the project
      const memberRole = await storage.getProjectMemberRole(id, userId);
      if (memberRole !== "admin" && req.user!.role !== "admin") {
        return res.status(403).json({ message: "Forbidden: You need admin access to delete this project" });
      }
      
      // Delete the project
      await storage.deleteProject(id);
      
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: `Error deleting project: ${error.message}` });
    }
  });
  
  // === Project Members API ===
  
  // Add a member to a project
  app.post("/api/projects/:id/members", requireAuth, async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.id);
      const invitedBy = req.user!.id;
      
      // Check if the user has admin access to the project
      const memberRole = await storage.getProjectMemberRole(projectId, invitedBy);
      if (memberRole !== "admin" && req.user!.role !== "admin") {
        return res.status(403).json({ message: "Forbidden: You need admin access to add members" });
      }
      
      const memberData = { 
        ...req.body, 
        projectId, 
        invitedBy 
      };
      
      const validatedData = insertProjectMemberSchema.parse(memberData);
      
      // Check if user already exists in the project
      const existingMember = await storage.getProjectMember(projectId, validatedData.userId);
      if (existingMember) {
        return res.status(400).json({ message: "User is already a member of this project" });
      }
      
      const createdMember = await storage.addProjectMember(validatedData);
      
      // Get user details
      const user = await storage.getUser(validatedData.userId);
      
      // Log activity
      await storage.createActivity({
        action: `Added ${user?.username || 'user'} to project as ${validatedData.role}`,
        icon: "ri-user-add-line",
        iconColor: "success"
      });
      
      res.status(201).json(createdMember);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: "Error adding project member" });
      }
    }
  });
  
  // Update a member's role
  app.patch("/api/projects/:projectId/members/:userId", requireAuth, async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const memberUserId = parseInt(req.params.userId);
      const currentUserId = req.user!.id;
      
      // Check if the user has admin access to the project
      const memberRole = await storage.getProjectMemberRole(projectId, currentUserId);
      if (memberRole !== "admin" && req.user!.role !== "admin") {
        return res.status(403).json({ message: "Forbidden: You need admin access to update member roles" });
      }
      
      // Update the member's role
      const updatedMember = await storage.updateProjectMember(projectId, memberUserId, req.body);
      
      res.json(updatedMember);
    } catch (error: any) {
      res.status(500).json({ message: `Error updating project member: ${error.message}` });
    }
  });
  
  // Remove a member from a project
  app.delete("/api/projects/:projectId/members/:userId", requireAuth, async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const memberUserId = parseInt(req.params.userId);
      const currentUserId = req.user!.id;
      
      // Check if the user has admin access to the project or is removing themselves
      const memberRole = await storage.getProjectMemberRole(projectId, currentUserId);
      if (memberRole !== "admin" && currentUserId !== memberUserId && req.user!.role !== "admin") {
        return res.status(403).json({ message: "Forbidden: You need admin access to remove members" });
      }
      
      // Remove the member
      await storage.removeProjectMember(projectId, memberUserId);
      
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: `Error removing project member: ${error.message}` });
    }
  });
  
  // === Project Items API ===
  
  // Add an item to a project
  app.post("/api/projects/:id/items", requireAuth, async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.id);
      const addedBy = req.user!.id;
      
      // Check if the user has edit or admin access to the project
      const memberRole = await storage.getProjectMemberRole(projectId, addedBy);
      if (memberRole !== "editor" && memberRole !== "admin" && req.user!.role !== "admin") {
        return res.status(403).json({ message: "Forbidden: You need edit access to add items" });
      }
      
      const itemData = { 
        ...req.body, 
        projectId, 
        addedBy 
      };
      
      const validatedData = insertProjectItemSchema.parse(itemData);
      
      // Check if item already exists in the project
      const existingItem = await storage.getProjectItem(
        projectId, 
        validatedData.itemType, 
        validatedData.itemId
      );
      
      if (existingItem) {
        return res.status(400).json({ message: "Item is already in this project" });
      }
      
      const createdItem = await storage.addProjectItem(validatedData);
      
      // Log activity
      await storage.createActivity({
        action: `Added ${validatedData.itemType} #${validatedData.itemId} to project`,
        icon: "ri-file-add-line",
        iconColor: "success"
      });
      
      res.status(201).json(createdItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: "Error adding project item" });
      }
    }
  });
  
  // Remove an item from a project
  app.delete("/api/projects/:projectId/items/:itemType/:itemId", requireAuth, async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const { itemType, itemId } = req.params;
      const userId = req.user!.id;
      
      // Check if the user has edit or admin access to the project
      const memberRole = await storage.getProjectMemberRole(projectId, userId);
      if (memberRole !== "editor" && memberRole !== "admin" && req.user!.role !== "admin") {
        return res.status(403).json({ message: "Forbidden: You need edit access to remove items" });
      }
      
      // Remove the item
      await storage.removeProjectItem(projectId, itemType, parseInt(itemId));
      
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: `Error removing project item: ${error.message}` });
    }
  });
}
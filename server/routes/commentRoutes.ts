import type { Express, Request as ExpressRequest, Response } from 'express';
import { IStorage } from '../storage';
import { storage } from '../storage-implementation';
import { Comment, InsertComment } from '../../shared/schema';
import { z } from 'zod';

// Extend Express Request to include custom properties
interface Request extends ExpressRequest {
  user?: any;
  comment?: Comment;
}

export function registerCommentRoutes(app: Express): void {
  
  /**
   * Middleware to check if a user has access to a comment
   * A user has access if they:
   * 1. Created the comment
   * 2. Have access to the target resource
   * 3. The user is an admin
   */
  const checkCommentAccess = async (req: Request, res: Response, next: Function) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const commentId = parseInt(req.params.commentId);
    if (isNaN(commentId)) {
      return res.status(400).json({ message: "Invalid comment ID" });
    }
    
    const comment = await storage.getComment(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    
    // Admin users have access to all comments
    if (req.user.role === 'admin') {
      req.comment = comment;
      return next();
    }
    
    // Comment creator has access
    if (comment.userId === req.user.id) {
      req.comment = comment;
      return next();
    }
    
    // Check target resource access
    // For project comments, check project access
    if (comment.targetType === 'project') {
      const project = await storage.getSharedProject(comment.targetId);
      if (!project) {
        return res.status(404).json({ message: "Target project not found" });
      }
      
      // Project creator has access
      if (project.createdById === req.user.id) {
        req.comment = comment;
        return next();
      }
      
      // Public projects are accessible to all
      if (project.isPublic) {
        req.comment = comment;
        return next();
      }
      
      // Check if user is a project member
      const projectMember = await storage.getProjectMember(project.id, req.user.id);
      if (projectMember) {
        req.comment = comment;
        return next();
      }
    }
    
    // For other target types, add access checks as needed
    
    return res.status(403).json({ message: "You don't have access to this comment" });
  };
  
  // Get comments for a target (project, calculation, etc.)
  app.get('/api/comments/:targetType/:targetId', async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const { targetType, targetId } = req.params;
      
      if (!targetType || !targetId) {
        return res.status(400).json({ message: "targetType and targetId parameters are required" });
      }
      
      // Convert targetId to a number
      const targetIdNum = parseInt(targetId);
      
      if (isNaN(targetIdNum)) {
        return res.status(400).json({ message: "Invalid targetId" });
      }
      
      // Check access to the target resource
      // For project comments, check project access
      if (targetType === 'project') {
        const project = await storage.getSharedProject(targetIdNum);
        if (!project) {
          return res.status(404).json({ message: "Target project not found" });
        }
        
        // Admin users can access all projects
        if (req.user.role !== 'admin') {
          // Check if user has access to the project
          if (project.createdById !== req.user.id && !project.isPublic) {
            const projectMember = await storage.getProjectMember(targetIdNum, req.user.id);
            if (!projectMember) {
              return res.status(403).json({ message: "You don't have access to this project" });
            }
          }
        }
      }
      
      // Fetch the comments
      const comments = await storage.getCommentsByTargetWithUserInfo(targetType, targetIdNum);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Error fetching comments" });
    }
  });
  
  // Create a new comment
  app.post('/api/comments/:targetType/:targetId', async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const { targetType, targetId } = req.params;
      
      // Super Verbose Debugging - show all request details
      console.log("\n\n===== SUPER DETAILED COMMENT API DEBUG =====");
      console.log("Request Body (raw):", req.body);
      console.log("Request Headers:", JSON.stringify(req.headers, null, 2));
      console.log("Request Query:", JSON.stringify(req.query, null, 2));
      console.log("Request URL:", req.url);
      console.log("Request Method:", req.method);
      console.log("Content-Type:", req.headers['content-type']);
      console.log("Request is JSON?", req.is('json'), "Request is application/json?", req.is('application/json'));
      
      if (Buffer.isBuffer(req.body)) {
        console.log("Request body is a Buffer! Content:", req.body.toString());
      } else if (typeof req.body === 'string') {
        console.log("Request body is a string! Content:", req.body);
        try {
          const parsed = JSON.parse(req.body);
          console.log("Parsed JSON:", parsed);
        } catch (e) {
          console.log("Failed to parse body as JSON");
        }
      } else if (typeof req.body === 'object') {
        console.log("Request body is an object. Keys:", Object.keys(req.body));
      }
      
      // Extract content and explicitly check the parentId in several ways
      const content = req.body.content;
      // Try multiple ways to get parentId
      const parentIdRaw = req.body.parentId;
      const parentIdKeysCheck = Object.prototype.hasOwnProperty.call(req.body, 'parentId');
      
      console.log("Content:", content);
      console.log("parentId (raw):", parentIdRaw);
      console.log("parentId exists via hasOwnProperty?", parentIdKeysCheck);
      console.log("parentId type:", typeof parentIdRaw);
      
      // Try to access using different casing
      console.log("Alternative case checks:");
      console.log("- req.body.parentid:", req.body.parentid);
      console.log("- req.body.ParentId:", req.body.ParentId);
      console.log("- req.body.parentID:", req.body.parentID);
      console.log("- req.body.PARENTID:", req.body.PARENTID);
      console.log("===== END VERBOSE DEBUG =====\n\n");
      
      // Content is required
      if (!content) {
        return res.status(400).json({ message: "content is required" });
      }
      
      // Check access to the target resource
      // For project comments, check project access
      if (targetType === 'project') {
        const project = await storage.getSharedProject(parseInt(targetId));
        if (!project) {
          return res.status(404).json({ message: "Target project not found" });
        }
        
        // Admin users can access all projects
        if (req.user.role !== 'admin') {
          // Check if user has access to the project
          if (project.createdById !== req.user.id && !project.isPublic) {
            const projectMember = await storage.getProjectMember(parseInt(targetId), req.user.id);
            if (!projectMember) {
              return res.status(403).json({ message: "You don't have access to this project" });
            }
          }
        }
      }
      
      // Create the comment data object with explicit InsertComment type
      // Important: Initialize with all required fields
      const commentData: InsertComment = {
        content: content,
        userId: req.user.id,
        targetType: targetType,
        targetId: parseInt(targetId),
        isResolved: false,
        // Set null as default for parentCommentId
        parentCommentId: null
      };
      
      // Process parent comment ID, if provided
      if (parentIdRaw) {
        try {
          const parentIdNum = parseInt(parentIdRaw);
          console.log("Comment API: Processing parent comment ID:", parentIdNum);
          
          // Verify parent comment exists
          const parentComment = await storage.getComment(parentIdNum);
          if (!parentComment) {
            console.log("Comment API: Parent comment not found for ID:", parentIdNum);
            return res.status(404).json({ message: "Parent comment not found" });
          }
          
          // Verify parent comment belongs to same target
          if (parentComment.targetType !== targetType || parentComment.targetId !== parseInt(targetId)) {
            console.log("Comment API: Parent comment target mismatch");
            return res.status(400).json({ 
              message: "Parent comment does not belong to the specified target",
              expected: { type: targetType, id: parseInt(targetId) },
              actual: { type: parentComment.targetType, id: parentComment.targetId }
            });
          }
          
          // Update the comment data with parent ID
          commentData.parentCommentId = parentIdNum;
          
          console.log("Comment API: Creating reply with data:", JSON.stringify(commentData, null, 2));
        } catch (error) {
          console.error("Comment API: Error parsing parentIdRaw:", error);
          return res.status(400).json({ message: "Invalid parent comment ID format" });
        }
      } else {
        console.log("Comment API: Creating top-level comment with data:", JSON.stringify(commentData, null, 2));
      }
      
      // Create the comment in the database
      const comment = await storage.createComment(commentData);
      
      // Verify the comment was created correctly
      console.log("Comment API: Comment created result:", JSON.stringify(comment, null, 2));
      
      // Get the comment with user info for the response
      const commentWithUserInfo = await storage.getCommentWithUserInfo(comment.id);
      
      res.status(201).json(commentWithUserInfo);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Error creating comment" });
    }
  });
  
  // Update a comment
  app.patch('/api/comments/:commentId', checkCommentAccess, async (req: Request, res: Response) => {
    try {
      const commentId = parseInt(req.params.commentId);
      const { content } = req.body;
      
      // Only the comment owner can update the content
      if (req.comment && req.comment.userId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "You can only edit your own comments" });
      }
      
      // Update the comment with available fields, mark as edited
      const updateData: Partial<InsertComment> & { content?: string, isEdited?: boolean } = {
        content,
        isEdited: true
      };
      const updatedComment = await storage.updateComment(commentId, updateData);
      
      // Get the comment with user info
      const commentWithUserInfo = await storage.getCommentWithUserInfo(commentId);
      
      res.json(commentWithUserInfo);
    } catch (error) {
      console.error("Error updating comment:", error);
      res.status(500).json({ message: "Error updating comment" });
    }
  });
  
  // Toggle the resolved status of a comment
  app.patch('/api/comments/:commentId/resolve', checkCommentAccess, async (req: Request, res: Response) => {
    try {
      const commentId = parseInt(req.params.commentId);
      const { isResolved } = req.body;
      
      // Update the comment with resolved status
      const updateData: Partial<InsertComment> = {
        isResolved
      };
      const updatedComment = await storage.updateComment(commentId, updateData);
      
      // Get the comment with user info
      const commentWithUserInfo = await storage.getCommentWithUserInfo(commentId);
      
      res.json(commentWithUserInfo);
    } catch (error) {
      console.error("Error updating comment resolved status:", error);
      res.status(500).json({ message: "Error updating comment resolved status" });
    }
  });
  
  // Delete a comment
  app.delete('/api/comments/:commentId', checkCommentAccess, async (req: Request, res: Response) => {
    try {
      const commentId = parseInt(req.params.commentId);
      
      // Only the comment owner or an admin can delete the comment
      if (req.comment && req.comment.userId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "You can only delete your own comments" });
      }
      
      // Delete the comment
      await storage.deleteComment(commentId);
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ message: "Error deleting comment" });
    }
  });
}
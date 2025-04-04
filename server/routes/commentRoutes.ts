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
      
      // Log raw request body
      console.log("\n\n===== COMMENT API REQUEST =====");
      console.log("Raw request body:", req.body);
      console.log("JSON.stringify(req.body):", JSON.stringify(req.body));
      
      // Extract content
      const content = req.body.content;
      
      // Extract parentCommentId directly - try multiple variants
      let parentCommentId = null;
      
      if (req.body.parentId !== undefined) {
        parentCommentId = parseInt(req.body.parentId);
        console.log("Found parentId:", req.body.parentId, "parsed to:", parentCommentId);
      } else if (req.body.parentCommentId !== undefined) {
        parentCommentId = parseInt(req.body.parentCommentId);
        console.log("Found parentCommentId:", req.body.parentCommentId, "parsed to:", parentCommentId);
      } else if (req.body.parent_id !== undefined) {
        parentCommentId = parseInt(req.body.parent_id);
        console.log("Found parent_id:", req.body.parent_id, "parsed to:", parentCommentId);
      } else if (req.body.parent_comment_id !== undefined) {
        parentCommentId = parseInt(req.body.parent_comment_id);
        console.log("Found parent_comment_id:", req.body.parent_comment_id, "parsed to:", parentCommentId);
      }
      
      // Print all request body keys
      console.log("All body keys:", Object.keys(req.body));
      console.log("Content:", content);
      console.log("Final parentCommentId value:", parentCommentId);
      console.log("===== END COMMENT API REQUEST =====\n\n");
      
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
      if (parentCommentId) {
        try {
          // parentCommentId is already parsed as a number
          console.log("Comment API: Processing parent comment ID:", parentCommentId);
          
          // Verify parent comment exists
          const parentComment = await storage.getComment(parentCommentId);
          if (!parentComment) {
            console.log("Comment API: Parent comment not found for ID:", parentCommentId);
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
          commentData.parentCommentId = parentCommentId;
          
          console.log("Comment API: Creating reply with data:", JSON.stringify(commentData, null, 2));
        } catch (error) {
          console.error("Comment API: Error processing parentCommentId:", error);
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
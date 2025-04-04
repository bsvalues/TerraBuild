import type { Express, Request, Response } from 'express';
import { IStorage } from '../storage';
import { storage } from '../storage-implementation';

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
    
    // Public projects are accessible to all
    if (project.isPublic) {
      req.project = project;
      return next();
    }
    
    // Check if the user is a member of the project
    const projectMember = await storage.getProjectMember(projectId, req.user.id);
    if (projectMember) {
      req.project = project;
      req.projectMember = projectMember;
      return next();
    }
    
    return res.status(403).json({ message: "You don't have access to this project" });
  };
  
  /**
   * Middleware to check if a user has edit access to a project
   * A user has edit access if they:
   * 1. Created the project
   * 2. Are a member of the project with role 'editor' or 'admin'
   * 3. The user is an application admin
   */
  const checkProjectEditAccess = async (req: Request, res: Response, next: Function) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    // If the middleware has already run, we can use the stored project and member
    if (req.project) {
      const project = req.project;
      
      // Admin users have edit access to all projects
      if (req.user.role === 'admin') {
        return next();
      }
      
      // Project creator has edit access
      if (project.createdById === req.user.id) {
        return next();
      }
      
      // Project members with editor or admin role have edit access
      if (req.projectMember && (req.projectMember.role === 'editor' || req.projectMember.role === 'admin')) {
        return next();
      }
      
      return res.status(403).json({ message: "You don't have edit permission for this project" });
    }
    
    // Otherwise, we need to run the full access check
    const projectId = parseInt(req.params.projectId);
    if (isNaN(projectId)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }
    
    const project = await storage.getSharedProject(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    
    // Admin users have edit access to all projects
    if (req.user.role === 'admin') {
      req.project = project;
      return next();
    }
    
    // Project creator has edit access
    if (project.createdById === req.user.id) {
      req.project = project;
      return next();
    }
    
    // Check if the user is a member of the project with edit access
    const projectMember = await storage.getProjectMember(projectId, req.user.id);
    if (projectMember && (projectMember.role === 'editor' || projectMember.role === 'admin')) {
      req.project = project;
      req.projectMember = projectMember;
      return next();
    }
    
    return res.status(403).json({ message: "You don't have edit permission for this project" });
  };
  
  /**
   * Middleware to check if a user is a project admin
   * A user is a project admin if they:
   * 1. Created the project
   * 2. Are a member of the project with role 'admin'
   * 3. The user is an application admin
   */
  const checkProjectAdminAccess = async (req: Request, res: Response, next: Function) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    // If the middleware has already run, we can use the stored project and member
    if (req.project) {
      const project = req.project;
      
      // Admin users have admin access to all projects
      if (req.user.role === 'admin') {
        return next();
      }
      
      // Project creator has admin access
      if (project.createdById === req.user.id) {
        return next();
      }
      
      // Project members with admin role have admin access
      if (req.projectMember && req.projectMember.role === 'admin') {
        return next();
      }
      
      return res.status(403).json({ message: "You don't have admin permission for this project" });
    }
    
    // Otherwise, we need to run the full access check
    const projectId = parseInt(req.params.projectId);
    if (isNaN(projectId)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }
    
    const project = await storage.getSharedProject(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    
    // Admin users have admin access to all projects
    if (req.user.role === 'admin') {
      req.project = project;
      return next();
    }
    
    // Project creator has admin access
    if (project.createdById === req.user.id) {
      req.project = project;
      return next();
    }
    
    // Check if the user is a member of the project with admin access
    const projectMember = await storage.getProjectMember(projectId, req.user.id);
    if (projectMember && projectMember.role === 'admin') {
      req.project = project;
      req.projectMember = projectMember;
      return next();
    }
    
    return res.status(403).json({ message: "You don't have admin permission for this project" });
  };
  
  // Shared Projects API
  
  // Get all shared projects
  app.get('/api/shared-projects', async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // For admin users, show all projects
      if (req.user.role === 'admin') {
        const projects = await storage.getAllSharedProjects();
        return res.json(projects);
      }
      
      // For regular users, show their projects and public projects
      const projects = await storage.getAccessibleSharedProjects(req.user.id);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching shared projects:", error);
      res.status(500).json({ message: "Error fetching shared projects" });
    }
  });
  
  // Get projects created by or shared with the current user
  app.get('/api/shared-projects/my', async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      console.log("Getting projects for user:", req.user.id);
      try {
        const projects = await storage.getUserProjects(req.user.id);
        console.log("Retrieved projects:", projects);
        res.json(projects);
      } catch (dbError: any) {
        console.error("Database error in getUserProjects:", dbError);
        console.error("Error stack:", dbError.stack);
        return res.status(500).json({ message: "Database error fetching user projects", error: dbError.message });
      }
    } catch (error: any) {
      console.error("Error fetching user projects:", error);
      console.error("Error stack:", error.stack);
      res.status(500).json({ message: "Error fetching user projects", error: error.message });
    }
  });
  
  // Get all public projects
  app.get('/api/shared-projects/public', async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      try {
        const projects = await storage.getPublicProjects();
        console.log("Retrieved public projects:", projects);
        res.json(projects);
      } catch (dbError: any) {
        console.error("Database error in getPublicProjects:", dbError);
        console.error("Error stack:", dbError.stack);
        return res.status(500).json({ message: "Database error fetching public projects", error: dbError.message });
      }
    } catch (error: any) {
      console.error("Error fetching public projects:", error);
      console.error("Error stack:", error.stack);
      res.status(500).json({ message: "Error fetching public projects", error: error.message });
    }
  });
  
  // Get a specific shared project
  app.get('/api/shared-projects/:projectId', checkProjectAccess, async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const project = req.project;
      
      // Fetch project members
      const members = await storage.getProjectMembers(projectId);
      
      res.json({
        ...project,
        members
      });
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
      
      const { name, description, isPublic } = req.body;
      
      const project = await storage.createSharedProject({
        name,
        description: description || null,
        createdById: req.user.id,
        status: 'active',
        isPublic: isPublic || false
      });
      
      res.status(201).json(project);
    } catch (error) {
      console.error("Error creating shared project:", error);
      res.status(500).json({ message: "Error creating shared project" });
    }
  });
  
  // Update a shared project
  app.patch('/api/shared-projects/:projectId', checkProjectEditAccess, async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const { name, description, isPublic, status } = req.body;
      
      // Build the update object with only the fields that are provided
      const updateData: any = { updatedAt: new Date() };
      
      if (name !== undefined) {
        updateData.name = name;
      }
      
      if (description !== undefined) {
        updateData.description = description;
      }
      
      if (isPublic !== undefined) {
        updateData.isPublic = isPublic;
      }
      
      if (status !== undefined) {
        updateData.status = status;
      }
      
      const updatedProject = await storage.updateSharedProject(projectId, updateData);
      
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
      
      // Delete all members
      await storage.deleteAllProjectMembers(projectId);
      
      // Delete all items
      await storage.deleteAllProjectItems(projectId);
      
      // Delete all shared links
      await storage.deleteAllSharedLinks(projectId);
      
      // Delete the project
      await storage.deleteSharedProject(projectId);
      
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
      
      const members = await storage.getProjectMembersWithUserInfo(projectId);
      
      res.json(members);
    } catch (error) {
      console.error("Error fetching project members:", error);
      res.status(500).json({ message: "Error fetching project members" });
    }
  });
  
  // Add a member to a project
  app.post('/api/shared-projects/:projectId/members', checkProjectAdminAccess, async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const { userId, role } = req.body;
      
      // Check if the user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if the user is already a member
      const existingMember = await storage.getProjectMember(projectId, userId);
      if (existingMember) {
        return res.status(400).json({ message: "User is already a member of this project" });
      }
      
      // Add the member
      const member = await storage.addProjectMember({
        projectId,
        userId,
        role: role || 'viewer',
        invitedBy: req.user!.id
      });
      
      // Get the member with user info
      const memberWithUserInfo = await storage.getProjectMemberWithUserInfo(member.id);
      
      res.status(201).json(memberWithUserInfo);
    } catch (error) {
      console.error("Error adding project member:", error);
      res.status(500).json({ message: "Error adding project member" });
    }
  });
  
  // Update a project member's role
  app.patch('/api/shared-projects/:projectId/members/:memberId', checkProjectAdminAccess, async (req: Request, res: Response) => {
    try {
      const memberId = parseInt(req.params.memberId);
      const { role } = req.body;
      
      // Get the member to verify it exists
      const member = await storage.getProjectMemberById(memberId);
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }
      
      // Update the member's role
      const updatedMember = await storage.updateProjectMember(memberId, { role });
      
      // Get the member with user info
      const memberWithUserInfo = await storage.getProjectMemberWithUserInfo(memberId);
      
      res.json(memberWithUserInfo);
    } catch (error) {
      console.error("Error updating project member:", error);
      res.status(500).json({ message: "Error updating project member" });
    }
  });
  
  // Remove a member from a project
  app.delete('/api/shared-projects/:projectId/members/:memberId', checkProjectAdminAccess, async (req: Request, res: Response) => {
    try {
      const memberId = parseInt(req.params.memberId);
      
      // Get the member to verify it exists
      const member = await storage.getProjectMemberById(memberId);
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }
      
      // Remove the member
      await storage.removeProjectMember(memberId);
      
      res.status(204).send();
    } catch (error) {
      console.error("Error removing project member:", error);
      res.status(500).json({ message: "Error removing project member" });
    }
  });
  
  // Project Invitations API
  
  // Get pending invitations for the current user
  app.get('/api/invitations/pending', async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const userId = req.user.id;
      console.log(`Getting pending invitations for user: ${userId}`);
      
      // Get pending invitations for the user
      let invitations;
      try {
        invitations = await storage.getPendingInvitationsForUser(userId);
        console.log(`Found ${invitations.length} pending invitations`);
      } catch (error) {
        console.error("Error getting pending invitations:", error);
        return res.status(500).json({ message: "Error fetching pending invitations" });
      }
      
      // Get the project details for each invitation
      const invitationsWithProjectInfo = await Promise.all(
        invitations.map(async (invitation) => {
          const project = await storage.getSharedProject(invitation.projectId);
          const inviter = await storage.getUser(invitation.invitedBy);
          
          return {
            ...invitation,
            project: project ? {
              id: project.id,
              name: project.name,
              description: project.description
            } : null,
            inviter: inviter ? {
              id: inviter.id,
              username: inviter.username,
              name: inviter.name
            } : null
          };
        })
      );
      
      res.json(invitationsWithProjectInfo);
    } catch (error) {
      console.error("Error fetching pending invitations:", error);
      res.status(500).json({ message: "Error fetching pending invitations" });
    }
  });
  
  // Get all invitations for a project (with user info)
  app.get('/api/shared-projects/:projectId/invitations', checkProjectAdminAccess, async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      
      const invitations = await storage.getProjectInvitationsWithUserInfo(projectId);
      
      res.json(invitations);
    } catch (error) {
      console.error("Error fetching project invitations:", error);
      res.status(500).json({ message: "Error fetching project invitations" });
    }
  });
  
  // Send an invitation to a user
  app.post('/api/shared-projects/:projectId/invitations', checkProjectAdminAccess, async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const { userId, role } = req.body;
      
      // Check if the user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if the user is already a member
      const existingMember = await storage.getProjectMember(projectId, userId);
      if (existingMember) {
        return res.status(400).json({ message: "User is already a member of this project" });
      }
      
      // Check if there's already a pending invitation
      const existingInvitation = await storage.getProjectInvitationByUserAndProject(projectId, userId);
      if (existingInvitation && existingInvitation.status === 'pending') {
        return res.status(400).json({ message: "User already has a pending invitation to this project" });
      }
      
      // Create the invitation
      const invitation = await storage.createProjectInvitation({
        projectId,
        userId,
        invitedBy: req.user!.id,
        role: role || 'viewer',
        status: 'pending'
      });
      
      // Get user info for the response
      const user_info = await storage.getUser(userId);
      
      res.status(201).json({
        ...invitation,
        user: {
          username: user_info?.username || '',
          name: user_info?.name
        }
      });
    } catch (error) {
      console.error("Error creating invitation:", error);
      res.status(500).json({ message: "Error creating invitation" });
    }
  });
  
  // Accept an invitation
  app.post('/api/invitations/:invitationId/accept', async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const invitationId = parseInt(req.params.invitationId);
      
      // Get the invitation
      const invitation = await storage.getProjectInvitation(invitationId);
      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }
      
      // Check if it belongs to the current user
      if (invitation.userId !== req.user.id) {
        return res.status(403).json({ message: "This invitation is not for you" });
      }
      
      // Check if it's still pending
      if (invitation.status !== 'pending') {
        return res.status(400).json({ message: "This invitation has already been " + invitation.status });
      }
      
      // Update it to 'accepted'
      await storage.updateProjectInvitationStatus(invitationId, 'accepted');
      
      // Add the user as a project member
      await storage.addProjectMember({
        projectId: invitation.projectId,
        userId: invitation.userId,
        role: invitation.role,
        invitedBy: invitation.invitedBy
      });
      
      // Get the project details
      const project = await storage.getSharedProject(invitation.projectId);
      
      res.status(200).json({ 
        message: "Invitation accepted",
        project: project ? {
          id: project.id,
          name: project.name,
          description: project.description
        } : null
      });
    } catch (error) {
      console.error("Error accepting invitation:", error);
      res.status(500).json({ message: "Error accepting invitation" });
    }
  });
  
  // Decline an invitation
  app.post('/api/invitations/:invitationId/decline', async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const invitationId = parseInt(req.params.invitationId);
      
      // Get the invitation
      const invitation = await storage.getProjectInvitation(invitationId);
      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }
      
      // Check if it belongs to the current user
      if (invitation.userId !== req.user.id) {
        return res.status(403).json({ message: "This invitation is not for you" });
      }
      
      // Check if it's still pending
      if (invitation.status !== 'pending') {
        return res.status(400).json({ message: "This invitation has already been " + invitation.status });
      }
      
      // Update it to 'declined'
      await storage.updateProjectInvitationStatus(invitationId, 'declined');
      
      res.status(200).json({ message: "Invitation declined" });
    } catch (error) {
      console.error("Error declining invitation:", error);
      res.status(500).json({ message: "Error declining invitation" });
    }
  });
  
  // Delete/Cancel an invitation (admin use)
  app.delete('/api/shared-projects/:projectId/invitations/:invitationId', checkProjectAdminAccess, async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const invitationId = parseInt(req.params.invitationId);
      
      // Get the invitation to verify it exists and belongs to this project
      const invitation = await storage.getProjectInvitation(invitationId);
      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }
      
      // Verify the invitation belongs to this project
      if (invitation.projectId !== projectId) {
        return res.status(400).json({ message: "Invitation does not belong to this project" });
      }
      
      // Delete the invitation
      await storage.deleteProjectInvitation(invitationId);
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting invitation:", error);
      res.status(500).json({ message: "Error deleting invitation" });
    }
  });
  
  // Project Items API
  
  // Get all items in a project
  app.get('/api/shared-projects/:projectId/items', checkProjectAccess, async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      
      const items = await storage.getProjectItems(projectId);
      
      res.json(items);
    } catch (error) {
      console.error("Error fetching project items:", error);
      res.status(500).json({ message: "Error fetching project items" });
    }
  });
  
  // Add an item to a project
  app.post('/api/shared-projects/:projectId/items', checkProjectEditAccess, async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const { itemType, itemId, notes } = req.body;
      
      // Check if the item type is valid
      if (!['calculation', 'cost_matrix', 'report'].includes(itemType)) {
        return res.status(400).json({ message: "Invalid item type. Must be one of: calculation, cost_matrix, report" });
      }
      
      // For now, we'll assume the item exists
      // In a more robust implementation, we would verify the item exists in the specific tables
      
      // Check if the item is already in the project
      const existingItem = await storage.getProjectItemByTypeAndId(projectId, itemType, itemId);
      if (existingItem) {
        return res.status(400).json({ message: "Item is already in this project" });
      }
      
      // Add the item
      const item = await storage.addProjectItem({
        projectId,
        itemType,
        itemId,
        addedBy: req.user!.id
      });
      
      res.status(201).json(item);
    } catch (error) {
      console.error("Error adding project item:", error);
      res.status(500).json({ message: "Error adding project item" });
    }
  });
  
  // Update a project item
  app.patch('/api/shared-projects/:projectId/items/:itemId', checkProjectEditAccess, async (req: Request, res: Response) => {
    try {
      const itemId = parseInt(req.params.itemId);
      
      // Get the item to verify it exists
      const item = await storage.getProjectItem(itemId);
      if (!item) {
        return res.status(404).json({ message: "Project item not found" });
      }
      
      // Since we don't have updatable fields in the project_items table yet,
      // we're just returning the current item
      res.json(item);
    } catch (error) {
      console.error("Error updating project item:", error);
      res.status(500).json({ message: "Error updating project item" });
    }
  });
  
  // Remove an item from a project
  app.delete('/api/shared-projects/:projectId/items/:itemId', checkProjectEditAccess, async (req: Request, res: Response) => {
    try {
      const itemId = parseInt(req.params.itemId);
      
      // Get the item to verify it exists
      const item = await storage.getProjectItem(itemId);
      if (!item) {
        return res.status(404).json({ message: "Project item not found" });
      }
      
      // Remove the item
      await storage.removeProjectItem(itemId);
      
      res.status(204).send();
    } catch (error) {
      console.error("Error removing project item:", error);
      res.status(500).json({ message: "Error removing project item" });
    }
  });
  
  // Comments API
  
  /**
   * Middleware to verify comment access - used for update/delete operations
   * A user can modify a comment if they:
   * 1. Authored the comment
   * 2. Are an admin
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
      return next();
    }
    
    // Comment author has access
    if (comment.userId === req.user.id) {
      return next();
    }
    
    return res.status(403).json({ message: "You don't have permission to modify this comment" });
  };
  
  // Get comments for a target (project, calculation, etc.)
  app.get('/api/comments/:targetType/:targetId', async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const targetType = req.params.targetType;
      const targetId = parseInt(req.params.targetId);
      
      if (isNaN(targetId)) {
        return res.status(400).json({ message: "Invalid target ID" });
      }
      
      // For protected targets like projects, we should check access
      if (targetType === 'project') {
        const project = await storage.getSharedProject(targetId);
        
        if (!project) {
          return res.status(404).json({ message: "Project not found" });
        }
        
        // Check if the user has access to the project
        if (!project.isPublic && project.createdById !== req.user.id) {
          const isMember = await storage.getProjectMember(targetId, req.user.id);
          if (!isMember && req.user.role !== 'admin') {
            return res.status(403).json({ message: "You don't have access to this project" });
          }
        }
      }
      
      const comments = await storage.getCommentsByTargetWithUserInfo(targetType, targetId);
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
      
      const targetType = req.params.targetType;
      const targetId = parseInt(req.params.targetId);
      
      if (isNaN(targetId)) {
        return res.status(400).json({ message: "Invalid target ID" });
      }
      
      // For protected targets like projects, we should check access
      if (targetType === 'project') {
        const project = await storage.getSharedProject(targetId);
        if (!project) {
          return res.status(404).json({ message: "Project not found" });
        }
        
        // Check if the user has access to the project
        if (!project.isPublic && project.createdById !== req.user.id) {
          const isMember = await storage.getProjectMember(targetId, req.user.id);
          if (!isMember && req.user.role !== 'admin') {
            return res.status(403).json({ message: "You don't have access to this project" });
          }
        }
      }
      
      const { content, parentCommentId } = req.body;
      
      const comment = await storage.createComment({
        userId: req.user.id,
        targetType,
        targetId,
        content,
        parentCommentId: parentCommentId || null,
        isResolved: false
      });
      
      const commentWithUser = await storage.getCommentWithUserInfo(comment.id);
      
      res.status(201).json(commentWithUser);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Error creating comment" });
    }
  });
  
  // Update a comment
  app.patch('/api/comments/:commentId', checkCommentAccess, async (req: Request, res: Response) => {
    try {
      const commentId = parseInt(req.params.commentId);
      const { content, isResolved } = req.body;
      
      // Verify the comment exists
      const existingComment = await storage.getComment(commentId);
      if (!existingComment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      // Update the comment
      const updateData: any = {};
      
      if (content !== undefined) {
        updateData.content = content;
        updateData.isEdited = true;
        updateData.updatedAt = new Date();
      }
      
      if (isResolved !== undefined) {
        updateData.isResolved = isResolved;
      }
      
      const updatedComment = await storage.updateComment(commentId, updateData);
      const commentWithUser = await storage.getCommentWithUserInfo(commentId);
      
      res.json(commentWithUser);
    } catch (error) {
      console.error("Error updating comment:", error);
      res.status(500).json({ message: "Error updating comment" });
    }
  });
  
  // Delete a comment
  app.delete('/api/comments/:commentId', checkCommentAccess, async (req: Request, res: Response) => {
    try {
      const commentId = parseInt(req.params.commentId);
      
      // Verify the comment exists
      const comment = await storage.getComment(commentId);
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      await storage.deleteComment(commentId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ message: "Error deleting comment" });
    }
  });

  // Shared Links API
  
  // Get all shared links for a project
  app.get('/api/shared-projects/:projectId/links', checkProjectAccess, async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      
      const links = await storage.getSharedLinks(projectId);
      
      res.json(links);
    } catch (error) {
      console.error("Error fetching shared links:", error);
      res.status(500).json({ message: "Error fetching shared links" });
    }
  });
  
  // Create a new shared link
  app.post('/api/shared-projects/:projectId/links', checkProjectEditAccess, async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const { accessLevel, expiresAt, description } = req.body;
      
      // Generate a unique token
      const token = `sl_${Math.random().toString(36).substring(2, 15)}_${Math.random().toString(36).substring(2, 15)}`;
      
      // Create the shared link
      const link = await storage.createSharedLink({
        projectId,
        token,
        accessLevel: accessLevel || 'view',
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdBy: req.user!.id,
        description: description || null
      });
      
      res.status(201).json(link);
    } catch (error) {
      console.error("Error creating shared link:", error);
      res.status(500).json({ message: "Error creating shared link" });
    }
  });
  
  // Update a shared link
  app.patch('/api/shared-projects/:projectId/links/:linkId', checkProjectEditAccess, async (req: Request, res: Response) => {
    try {
      const linkId = parseInt(req.params.linkId);
      const { accessLevel, expiresAt, description } = req.body;
      
      // Get the link to verify it exists
      const link = await storage.getSharedLink(linkId);
      if (!link) {
        return res.status(404).json({ message: "Shared link not found" });
      }
      
      // Build the update object with only the fields that are provided
      const updateData: any = {};
      
      if (accessLevel !== undefined) {
        updateData.accessLevel = accessLevel;
      }
      
      if (expiresAt !== undefined) {
        updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
      }
      
      if (description !== undefined) {
        updateData.description = description;
      }
      
      // Update the link
      const updatedLink = await storage.updateSharedLink(linkId, updateData);
      
      res.json(updatedLink);
    } catch (error) {
      console.error("Error updating shared link:", error);
      res.status(500).json({ message: "Error updating shared link" });
    }
  });
  
  // Delete a shared link
  app.delete('/api/shared-projects/:projectId/links/:linkId', checkProjectEditAccess, async (req: Request, res: Response) => {
    try {
      const linkId = parseInt(req.params.linkId);
      
      // Get the link to verify it exists
      const link = await storage.getSharedLink(linkId);
      if (!link) {
        return res.status(404).json({ message: "Shared link not found" });
      }
      
      // Delete the link
      await storage.deleteSharedLink(linkId);
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting shared link:", error);
      res.status(500).json({ message: "Error deleting shared link" });
    }
  });
  
  // Access a project via a shared link token
  app.get('/api/shared-link/:token', async (req: Request, res: Response) => {
    try {
      const token = req.params.token;
      
      // Get the link by token
      const link = await storage.getSharedLinkByToken(token);
      if (!link) {
        return res.status(404).json({ message: "Shared link not found or has expired" });
      }
      
      // Check if the link has expired
      if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
        return res.status(403).json({ message: "This shared link has expired" });
      }
      
      // Get the project
      const project = await storage.getSharedProject(link.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Return the project and access level
      res.json({
        project,
        accessLevel: link.accessLevel
      });
    } catch (error) {
      console.error("Error accessing shared link:", error);
      res.status(500).json({ message: "Error accessing shared link" });
    }
  });

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
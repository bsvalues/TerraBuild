import express from 'express';
import { IStorage } from '../storage';

export function registerSharedLinksRoutes(app: express.Express, storage: IStorage) {
  // Get a shared link by token - public endpoint, no auth required
  app.get('/api/shared-links/:token', async (req, res) => {
    try {
      const { token } = req.params;
      
      if (!token) {
        return res.status(400).json({ error: 'Token is required' });
      }
      
      const linkInfo = await storage.getSharedLinkByToken(token);
      
      if (!linkInfo) {
        return res.status(404).json({ error: 'Shared link not found or expired' });
      }
      
      // Check if link is expired
      if (linkInfo.expiresAt && new Date(linkInfo.expiresAt) < new Date()) {
        return res.status(410).json({ error: 'Shared link has expired' });
      }
      
      // Get basic project info to include in the response
      const project = await storage.getProject(linkInfo.projectId);
      
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      
      // Return link info with project name
      return res.status(200).json({
        ...linkInfo,
        projectName: project.name
      });
    } catch (error) {
      console.error('Error fetching shared link:', error);
      return res.status(500).json({ error: 'Server error fetching shared link information' });
    }
  });
  
  // Access a project via shared link
  app.get('/api/shared-projects/:projectId/via-link/:token', async (req, res) => {
    try {
      const { projectId, token } = req.params;
      
      if (!token || !projectId) {
        return res.status(400).json({ error: 'Token and project ID are required' });
      }
      
      const linkInfo = await storage.getSharedLinkByToken(token);
      
      if (!linkInfo) {
        return res.status(404).json({ error: 'Shared link not found or expired' });
      }
      
      // Check if link is expired
      if (linkInfo.expiresAt && new Date(linkInfo.expiresAt) < new Date()) {
        return res.status(410).json({ error: 'Shared link has expired' });
      }
      
      // Verify the link is for the requested project
      if (linkInfo.projectId !== Number(projectId)) {
        return res.status(403).json({ error: 'This link does not grant access to the requested project' });
      }
      
      // Get project details
      const project = await storage.getProject(Number(projectId));
      
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      
      // Return project with access level information
      return res.status(200).json({
        project,
        accessLevel: linkInfo.accessLevel,
        viaSharedLink: true
      });
    } catch (error) {
      console.error('Error accessing project via shared link:', error);
      return res.status(500).json({ error: 'Server error accessing project via shared link' });
    }
  });

  // Get all shared links for a project - requires project access
  app.get('/api/shared-projects/:projectId/links', async (req, res) => {
    try {
      const { projectId } = req.params;
      const userId = (req as any).user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      // Verify user has access to the project (owner, member, or admin)
      const project = await storage.getProject(Number(projectId));
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      
      const isOwner = project.createdById === userId;
      const isMember = await storage.isProjectMember(Number(projectId), userId);
      const isAdmin = (req as any).user?.role === 'admin';
      
      if (!isOwner && !isMember && !isAdmin && !project.isPublic) {
        return res.status(403).json({ error: 'You do not have access to this project' });
      }
      
      // Fetch all shared links for the project
      const links = await storage.getSharedLinksByProject(Number(projectId));
      
      return res.status(200).json(links);
    } catch (error) {
      console.error('Error fetching shared links:', error);
      return res.status(500).json({ error: 'Server error fetching shared links' });
    }
  });

  // Create a new shared link for a project - requires project ownership or admin
  app.post('/api/shared-projects/:projectId/links', async (req, res) => {
    try {
      const { projectId } = req.params;
      const { accessLevel, description, expiresAt } = req.body;
      const userId = (req as any).user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      // Verify user has admin access to the project (owner or admin)
      const project = await storage.getProject(Number(projectId));
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      
      const isOwner = project.createdById === userId;
      const isAdmin = (req as any).user?.role === 'admin';
      
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ error: 'Only project owners can create shared links' });
      }
      
      // Validate access level
      if (!['view', 'edit', 'admin'].includes(accessLevel)) {
        return res.status(400).json({ error: 'Invalid access level. Must be one of: view, edit, admin' });
      }
      
      // Generate a secure random token for the shared link
      const token = require('crypto').randomBytes(32).toString('hex');
      
      // Create a new shared link
      const sharedLink = await storage.createSharedLink({
        projectId: Number(projectId),
        token,
        accessLevel,
        description: description || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdBy: userId
      });
      
      return res.status(201).json(sharedLink);
    } catch (error) {
      console.error('Error creating shared link:', error);
      return res.status(500).json({ error: 'Server error creating shared link' });
    }
  });

  // Delete a shared link - requires project ownership or admin
  app.delete('/api/shared-projects/:projectId/links/:linkId', async (req, res) => {
    try {
      const { projectId, linkId } = req.params;
      const userId = (req as any).user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      // Verify user has admin access to the project (owner or admin)
      const project = await storage.getProject(Number(projectId));
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      
      const isOwner = project.createdById === userId;
      const isAdmin = (req as any).user?.role === 'admin';
      
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ error: 'Only project owners can delete shared links' });
      }
      
      // Get the shared link to verify it belongs to this project
      const link = await storage.getSharedLink(Number(linkId));
      
      if (!link) {
        return res.status(404).json({ error: 'Shared link not found' });
      }
      
      if (link.projectId !== Number(projectId)) {
        return res.status(403).json({ error: 'This link does not belong to the specified project' });
      }
      
      // Delete the shared link
      await storage.deleteSharedLink(Number(linkId));
      
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting shared link:', error);
      return res.status(500).json({ error: 'Server error deleting shared link' });
    }
  });
}
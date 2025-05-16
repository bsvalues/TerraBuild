/**
 * Simple Login Interface for Benton County Building Cost Assessment System
 * 
 * This file provides a basic login interface to work in the Replit environment.
 */

import express, { Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { pool } from './db';
import { storage } from './storage-factory';

// Set up the login interface with PostgreSQL database connection
export function setupLoginInterface(app: express.Express) {
  // Use cookie parser to access cookies
  app.use(cookieParser());
  
  // Initialize PostgreSQL session store
  const pgSession = connectPgSimple(session);
  const sessionStore = new pgSession({
    pool, // use the database pool connection
    tableName: 'sessions', // use the sessions table we defined in schema
    createTableIfMissing: true, // create the table if it doesn't exist
  });

  // Use express-session with PostgreSQL session store
  app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'benton-county-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));
  
  // Add authentication middleware
  app.use(async (req: any, res, next) => {
    try {
      // Check if user is authenticated via session
      if (req.session.userId) {
        const user = await storage.getUserById(req.session.userId);
        if (user) {
          // Add user to request object (without password)
          const { password, ...userInfo } = user;
          req.user = userInfo;
          req.isAuthenticated = () => true;
        } else {
          // User ID in session but user not found (maybe deleted)
          req.user = null;
          req.isAuthenticated = () => false;
        }
      } else {
        // No authenticated user
        req.user = null;
        req.isAuthenticated = () => false;
      }
      next();
    } catch (error) {
      console.error('Authentication middleware error:', error);
      req.user = null;
      req.isAuthenticated = () => false;
      next();
    }
  });
  
  // Login route
  app.post('/api/login', async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }
      
      // Find user by username
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }
      
      // For development purposes, we're checking simple passwords
      // In production, this should use proper password hashing
      if (user.password === password) {
        // Set user ID in session
        (req as any).session.userId = user.id;
        
        // Return user info (without password)
        const { password: _, ...userInfo } = user;
        return res.status(200).json(userInfo);
      } else {
        return res.status(401).json({ message: 'Invalid username or password' });
      }
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ message: 'Server error during login' });
    }
  });
  
  // Logout route
  app.post('/api/logout', (req: Request, res: Response) => {
    // Clear session
    (req as any).session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ message: 'Failed to logout' });
      }
      res.clearCookie('connect.sid');
      return res.status(200).json({ message: 'Logged out successfully' });
    });
  });
  
  // Current user route
  app.get('/api/user', async (req: Request, res: Response) => {
    try {
      if ((req as any).user) {
        return res.status(200).json((req as any).user);
      }
      return res.status(401).json({ message: 'Not authenticated' });
    } catch (error) {
      console.error('User fetch error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });
  
  console.log('Login interface initialized successfully with users:');
  console.log('- admin/admin123');
  console.log('- user/user123');
}
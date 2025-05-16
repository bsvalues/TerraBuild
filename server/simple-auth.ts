/**
 * Simple Authentication System for BCBS App
 * 
 * This is a simple cookie-based authentication system without database dependencies.
 * It's designed to run in Replit for demonstration purposes.
 */

import { Express, Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { storage } from "./storage-replit";

// Define types
export type User = {
  id: number;
  username: string;
  name: string;
  role: string;
  is_active: boolean;
};

// Extend Request type to include our custom properties
declare global {
  namespace Express {
    interface Request {
      currentUser?: User;
      auth?: {
        authenticated: boolean;
        isAuthenticated: () => boolean;
      };
    }
  }
}

/**
 * Simple authentication setup
 */
export function setupSimpleAuth(app: Express) {
  // Add cookie parsing middleware
  app.use(cookieParser());

  // Add auth middleware to every request
  app.use(async (req: Request, res: Response, next: NextFunction) => {
    // Initialize auth object
    req.auth = {
      authenticated: false,
      isAuthenticated: () => req.auth?.authenticated || false
    };

    // Check for token in cookies
    const token = req.cookies?.authToken;
    
    if (token) {
      try {
        // Get session
        const session = await storage.getSessionByToken(token);
        
        if (session) {
          // Get user from session
          const user = await storage.getUserById(session.userId);
          
          if (user) {
            // Add user info to request (excluding password)
            const { password, ...userInfo } = user;
            req.currentUser = userInfo as User;
            req.auth.authenticated = true;
          }
        }
      } catch (error) {
        console.error('Auth error:', error);
      }
    }
    
    // Enable authentication status for legacy code 
    // that might expect req.user and req.isAuthenticated
    Object.defineProperty(req, 'user', {
      get: function() { return this.currentUser; }
    });
    Object.defineProperty(req, 'isAuthenticated', {
      get: function() { return () => this.auth?.authenticated || false; }
    });
    
    next();
  });

  // API routes for authentication
  app.post("/api/login", async (req: Request, res: Response) => {
    const { username, password } = req.body;
    
    console.log(`Login attempt: ${username}`);
    
    try {
      // Find matching user
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        console.log(`Login failed for ${username}: Invalid credentials`);
        return res.status(401).json({ 
          message: "Invalid username or password" 
        });
      }
      
      if (!user.is_active) {
        console.log(`Login failed for ${username}: Account inactive`);
        return res.status(401).json({ 
          message: "Account is inactive" 
        });
      }
      
      console.log(`Login successful: ${username} (${user.role})`);
      
      // Create session token
      const session = await storage.createSession(user.id);
      
      // Set auth cookie
      res.cookie('authToken', session.id, { 
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000
      });
      
      // Return user info without password
      const { password: _, ...userInfo } = user;
      res.status(200).json(userInfo);
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/logout", async (req: Request, res: Response) => {
    try {
      // Get token from cookie
      const token = req.cookies?.authToken;
      
      // Clean up if token exists
      if (token) {
        await storage.deleteSession(token);
        res.clearCookie('authToken');
      }
      
      res.status(200).json({ 
        message: "Logged out successfully" 
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/user", (req: Request, res: Response) => {
    // Check if user is authenticated
    if (!req.auth?.authenticated) {
      return res.status(401).json({ 
        message: "Not authenticated" 
      });
    }
    
    // Return user info
    res.status(200).json(req.currentUser);
  });
  
  // Register two default users if they don't exist
  (async () => {
    try {
      // Check if admin exists
      const admin = await storage.getUserByUsername('admin');
      if (!admin) {
        await storage.createUser({
          username: 'admin',
          password: 'admin123',
          name: 'Administrator',
          role: 'admin',
          is_active: true
        });
      }
      
      // Check if user exists
      const user = await storage.getUserByUsername('user');
      if (!user) {
        await storage.createUser({
          username: 'user',
          password: 'user123',
          name: 'Regular User',
          role: 'user',
          is_active: true
        });
      }
      
      console.log('Simple authentication system initialized with users:');
      console.log('- admin/admin123');
      console.log('- user/user123');
    } catch (error) {
      console.error('Error initializing auth users:', error);
    }
  })();
}
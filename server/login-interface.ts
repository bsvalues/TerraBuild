/**
 * Simple Login Interface for Benton County Building Cost Assessment System
 * 
 * This file provides a basic login interface to work in the Replit environment.
 */

import express, { Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import session from 'express-session';

// Define a user type with minimal properties
interface User {
  id: number;
  username: string;
  name: string;
  role: string;
}

// Create a simple in-memory user store
const users = [
  {
    id: 1,
    username: 'admin',
    password: 'admin123',
    name: 'Administrator',
    role: 'admin'
  },
  {
    id: 2,
    username: 'user',
    password: 'user123',
    name: 'Regular User',
    role: 'user'
  }
];

// Create a simple session store
const sessions = new Map<string, { userId: number, expires: Date }>();

// Set up the login interface
export function setupLoginInterface(app: express.Express) {
  // Use cookie parser to access cookies
  app.use(cookieParser());
  
  // Use express-session for session management
  app.use(session({
    secret: 'benton-county-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
  }));
  
  // Add authentication middleware
  app.use((req: any, res, next) => {
    // Check if user is authenticated via session
    if (req.session.userId) {
      const user = users.find(u => u.id === req.session.userId);
      if (user) {
        // Add user to request object (without password)
        const { password, ...userInfo } = user;
        req.user = userInfo;
        req.isAuthenticated = () => true;
      }
    } else {
      // No authenticated user
      req.user = null;
      req.isAuthenticated = () => false;
    }
    next();
  });
  
  // Login route
  app.post('/api/login', (req: Request, res: Response) => {
    const { username, password } = req.body;
    
    // Find user with matching credentials
    const user = users.find(u => u.username === username && u.password === password);
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    // Set user ID in session
    (req as any).session.userId = user.id;
    
    // Return user info (without password)
    const { password: _, ...userInfo } = user;
    return res.status(200).json(userInfo);
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
  app.get('/api/user', (req: Request, res: Response) => {
    if ((req as any).user) {
      return res.status(200).json((req as any).user);
    }
    return res.status(401).json({ message: 'Not authenticated' });
  });
  
  console.log('Login interface initialized successfully with users:');
  console.log('- admin/admin123');
  console.log('- user/user123');
}
import { Express } from "express";
import { storage } from "./storage-factory";
import { User as SelectUser } from "@shared/schema";

// Simplified auth tokens that don't require session
const authTokens: Map<string, { userId: number, expires: number }> = new Map();

// Default users for testing
const DEFAULT_USERS = [
  {
    username: 'admin',
    password: 'admin123',
    name: 'Admin User',
    role: 'admin',
    is_active: true
  },
  {
    username: 'default',
    password: 'default123',
    name: 'Default User',
    role: 'user',
    is_active: true
  }
];

// Ensure default users exist
async function ensureDefaultUsers() {
  for (const defaultUser of DEFAULT_USERS) {
    try {
      const existingUser = await storage.getUserByUsername(defaultUser.username);
      if (!existingUser) {
        await storage.createUser(defaultUser);
        console.log(`Created default user: ${defaultUser.username}`);
      }
    } catch (error) {
      console.error(`Error creating default user ${defaultUser.username}:`, error);
    }
  }
}

export function setupAuth(app: Express) {
  // Seed default users
  ensureDefaultUsers();

  // Simple auth middleware
  const authenticateToken = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.authToken;
    
    if (!token) {
      return next();
    }
    
    const session = authTokens.get(token);
    if (!session || session.expires < Date.now()) {
      if (session) {
        authTokens.delete(token);
      }
      return next();
    }
    
    try {
      const user = await storage.getUser(session.userId);
      if (user) {
        req.user = user;
        req.isAuthenticated = () => true;
      }
    } catch (error) {
      console.error('Auth error:', error);
    }
    
    next();
  };

  app.use(authenticateToken);

  app.post("/api/register", async (req, res) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await storage.createUser({
        ...req.body,
      });

      // Create auth token
      const token = Math.random().toString(36).substring(2);
      authTokens.set(token, {
        userId: user.id,
        expires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
      });
      
      // Set cookie
      res.cookie('authToken', token, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
      });

      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Simple direct password matching for testing purposes
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Create auth token
      const token = Math.random().toString(36).substring(2);
      authTokens.set(token, {
        userId: user.id,
        expires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
      });
      
      // Set cookie
      res.cookie('authToken', token, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
      });

      const { password: _, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/logout", (req, res) => {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.authToken;
    
    if (token) {
      authTokens.delete(token);
      res.clearCookie('authToken');
    }
    
    res.status(200).json({ message: "Logged out successfully" });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const { password, ...userWithoutPassword } = req.user;
    res.status(200).json(userWithoutPassword);
  });
}
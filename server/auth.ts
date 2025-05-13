import { Express, Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";

// Define types
type User = {
  id: number;
  username: string;
  name: string;
  role: string;
  is_active: boolean;
};

type UserWithPassword = User & { 
  password: string 
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

// Hardcoded users (no database dependency)
const USERS: UserWithPassword[] = [
  {
    id: 1,
    username: 'admin',
    password: 'admin123',
    name: 'Admin User',
    role: 'admin',
    is_active: true
  },
  {
    id: 2,
    username: 'default',
    password: 'default123',
    name: 'Default User',
    role: 'user',
    is_active: true
  }
];

// Session tokens - simple in-memory store
const tokens = new Map<string, number>();

/**
 * Simple authentication setup
 */
export function setupAuth(app: Express) {
  // Add cookie parsing middleware
  app.use(cookieParser());

  // Add auth middleware to every request
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Initialize auth object
    req.auth = {
      authenticated: false,
      isAuthenticated: () => req.auth?.authenticated || false
    };

    // Check for token in cookies
    const token = req.cookies?.authToken;
    
    // If token exists and is valid
    if (token && tokens.has(token)) {
      const userId = tokens.get(token);
      const user = USERS.find(u => u.id === userId);
      
      if (user) {
        // Add user info to request (excluding password)
        const { password, ...userInfo } = user;
        req.currentUser = userInfo;
        req.auth.authenticated = true;
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
  app.post("/api/register", (req: Request, res: Response) => {
    const { username, password, name, role = 'user' } = req.body;
    
    // Validate input
    if (!username || !password) {
      return res.status(400).json({ 
        message: "Username and password are required" 
      });
    }
    
    // Check if username is taken
    if (USERS.some(u => u.username === username)) {
      return res.status(400).json({ 
        message: "Username already exists" 
      });
    }
    
    // Create new user
    const newUser: UserWithPassword = {
      id: USERS.length + 1,
      username,
      password,
      name: name || username,
      role,
      is_active: true
    };
    
    // Add to users list
    USERS.push(newUser);
    
    // Create token
    const token = Math.random().toString(36).substring(2);
    tokens.set(token, newUser.id);
    
    // Set auth cookie
    res.cookie('authToken', token, { 
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    });
    
    // Return user info without password
    const { password: _, ...userInfo } = newUser;
    res.status(201).json(userInfo);
  });

  app.post("/api/login", (req: Request, res: Response) => {
    const { username, password } = req.body;
    
    console.log(`Login attempt: ${username}`);
    
    // Find matching user
    const user = USERS.find(u => 
      u.username === username && u.password === password
    );
    
    if (!user) {
      console.log(`Login failed: ${username}`);
      return res.status(401).json({ 
        message: "Invalid username or password" 
      });
    }
    
    console.log(`Login successful: ${username} (${user.role})`);
    
    // Create session token
    const token = Math.random().toString(36).substring(2);
    tokens.set(token, user.id);
    
    // Set auth cookie
    res.cookie('authToken', token, { 
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    });
    
    // Return user info without password
    const { password: _, ...userInfo } = user;
    res.status(200).json(userInfo);
  });

  app.post("/api/logout", (req: Request, res: Response) => {
    // Get token from cookie
    const token = req.cookies?.authToken;
    
    // Clean up if token exists
    if (token) {
      tokens.delete(token);
      res.clearCookie('authToken');
    }
    
    res.status(200).json({ 
      message: "Logged out successfully" 
    });
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
  
  console.log('Authentication system initialized with users:');
  console.log('- admin/admin123');
  console.log('- default/default123');
}
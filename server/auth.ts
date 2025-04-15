import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage-implementation";
import { User as SelectUser } from "@shared/schema";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { log } from "./vite";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  // If the stored password doesn't contain a salt (legacy plain text password)
  if (!stored.includes('.')) {
    return supplied === stored;
  }
  
  // For properly hashed passwords with salt
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Authentication middleware for development that sets a mock admin user
export const devAuthMiddleware = (req: any, res: any, next: any) => {
  if (!req.user) {
    req.user = {
      id: 1,
      username: "admin",
      password: "password", // Not actual password, just for display
      role: "admin",
      name: "Admin User",
      isActive: true
    };
  }
  next();
};

export function setupAuth(app: Express) {
  // Setup session middleware
  const PgSession = connectPg(session);
  
  app.use(
    session({
      store: new PgSession({
        pool,
        tableName: 'sessions',
        createTableIfMissing: true
      }),
      secret: process.env.SESSION_SECRET || 'bcbs_session_secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 1 day
      }
    })
  );
  
  // Initialize Passport.js
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Set up development mode auto-login if in development environment
  if (process.env.NODE_ENV !== 'production') {
    log("Development mode: Auth auto-login enabled");
    app.use('/api', async (req, res, next) => {
      // Check if auto-login is enabled in settings
      try {
        const autoLoginSetting = await storage.getSetting("DEV_AUTO_LOGIN_ENABLED");
        if (autoLoginSetting?.value === "true" && !req.user) {
          // Use the mock admin user
          req.user = {
            id: 1,
            uuid: "00000000-0000-0000-0000-000000000000",
            username: "admin",
            password: "disabled", // Not the actual password
            email: "admin@example.com",
            role: "admin",
            name: "Admin User",
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
          };
        }
      } catch (error) {
        // If we can't check the setting, continue without auto-login
      }
      next();
    });
  }

  // Configure local strategy for Passport.js
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // User registration endpoint
  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).send("Username already exists");
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      req.login(user, (err) => {
        if (err) return next(err);
        
        // Log the registration
        storage.createActivity({
          action: "User registration",
          icon: "ri-user-add-line",
          iconColor: "success",
          details: { userId: user.id, username: user.username }
        }).catch(console.error);
        
        // We need to handle potential undefined values due to strict type checking
        if (!user) {
          return next(new Error("User not found after creation"));
        }
        
        res.status(201).json({
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          is_active: user.is_active
        });
      });
    } catch (error) {
      next(error);
    }
  });

  // User login endpoint
  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    // Log the login
    storage.createActivity({
      action: "User login",
      icon: "ri-login-circle-line",
      iconColor: "info",
      details: { userId: req.user?.id, username: req.user?.username }
    }).catch(console.error);
    
    // Return user data without password
    const user = req.user;
    
    // We need to handle potential undefined values due to strict type checking
    if (!user) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    
    res.status(200).json({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      is_active: user.is_active
    });
  });

  // User logout endpoint
  app.post("/api/logout", (req, res, next) => {
    // Save user info before logout for activity log
    const user = req.user;
    
    req.logout((err) => {
      if (err) return next(err);
      
      // Log the logout if we had a user
      if (user) {
        storage.createActivity({
          action: "User logout",
          icon: "ri-logout-circle-line",
          iconColor: "info",
          details: { userId: user.id, username: user.username }
        }).catch(console.error);
      }
      
      res.sendStatus(200);
    });
  });

  // Current user endpoint
  app.get("/api/user", (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Return user data without password
    const user = req.user;
    
    // This check is redundant as we've already checked above, but TypeScript doesn't know that
    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    res.json({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      is_active: user.is_active
    });
  });

  // Development auto-login settings endpoint
  app.get("/api/auth/settings", async (req, res) => {
    if (process.env.NODE_ENV !== 'production') {
      try {
        const autoLoginSetting = await storage.getSetting("DEV_AUTO_LOGIN_ENABLED");
        const authToken = await storage.getSetting("DEV_AUTH_TOKEN");
        
        res.json({
          enabled: autoLoginSetting?.value === "true",
          token: authToken?.value || null
        });
      } catch (error) {
        res.status(500).json({ message: "Error fetching auth settings" });
      }
    } else {
      res.status(404).json({ message: "Not available in production mode" });
    }
  });
}
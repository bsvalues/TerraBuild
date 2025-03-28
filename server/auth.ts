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

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  // Create a PostgreSQL session store
  const PostgresSessionStore = connectPg(session);
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "bcbs-building-cost-secret",
    resave: false,
    saveUninitialized: false,
    store: new PostgresSessionStore({ 
      pool, 
      tableName: 'user_sessions',
      createTableIfMissing: true 
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 // 24 hours
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

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
        res.status(201).json(user);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });

  // Development auto-login feature
  app.get("/api/auth/autologin", async (req, res) => {
    try {
      // Check if dev autologin is enabled
      const devAutologinSetting = await storage.getSetting("DEV_AUTOLOGIN");
      
      if (devAutologinSetting && devAutologinSetting.value === "true") {
        // Check if already authenticated
        if (req.isAuthenticated()) {
          return res.json({ success: true, user: req.user });
        }
        
        // Auto login as admin in dev mode
        const adminUser = await storage.getUserByUsername("admin");
        
        if (adminUser) {
          req.login(adminUser, (err) => {
            if (err) {
              return res.status(500).json({ success: false, message: "Error during auto-login" });
            }
            
            // Log activity
            storage.createActivity({
              action: "Development auto-login",
              icon: "ri-login-circle-line",
              iconColor: "info"
            }).catch(console.error);
            
            return res.json({ success: true, user: adminUser });
          });
        } else {
          return res.status(404).json({ success: false, message: "Admin user not found" });
        }
      } else {
        return res.status(403).json({ success: false, message: "Development auto-login disabled" });
      }
    } catch (error) {
      console.error("Auto-login error:", error);
      res.status(500).json({ success: false, message: "Server error during auto-login" });
    }
  });
}
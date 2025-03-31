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

export function setupAuth(app: Express) {
  // DEVELOPMENT MODE: Authentication completely disabled
  log("Authentication is completely disabled for development");
  
  // Skip all authentication-related middleware setup
  // We'll handle user identity via the requireAuth middleware in routes.ts

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
    // DEVELOPMENT MODE: Always return admin user
    const adminUser = {
      id: 1,
      username: "admin",
      password: "password", // Not actual password, just for display
      role: "admin",
      name: "Admin User",
      isActive: true
    };
    res.json(adminUser);
  });

  // Development auto-login feature
  app.get("/api/auth/autologin", async (req, res) => {
    // DEVELOPMENT MODE: Always succeed with admin user
    const adminUser = {
      id: 1,
      username: "admin",
      password: "password", // Not actual password, just for display
      role: "admin",
      name: "Admin User",
      isActive: true
    };
    
    // Log activity
    storage.createActivity({
      action: "Development auto-login",
      icon: "ri-login-circle-line",
      iconColor: "info"
    }).catch(console.error);
    
    return res.json({ success: true, user: adminUser });
  });
}
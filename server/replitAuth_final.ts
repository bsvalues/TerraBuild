import type { Express, RequestHandler } from "express";

const isDevelopment = process.env.NODE_ENV === 'development';
const hasReplitDomains = !!process.env.REPLIT_DOMAINS;

export const setupAuth = async (app: Express) => {
  if (isDevelopment && !hasReplitDomains) {
    console.log('Development mode: Replit Auth setup skipped');
    return;
  }
  
  throw new Error("Production Replit Auth not implemented in this simplified version");
};

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (isDevelopment && !hasReplitDomains) {
    return next();
  }
  
  return res.status(401).json({ message: "Unauthorized" });
};

export function getSession() {
  if (isDevelopment && !hasReplitDomains) {
    return null;
  }
  
  return null;
}

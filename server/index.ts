import express, { type Request, Response, NextFunction } from "express";
import { createServer } from 'http';
import routes from "./routes";
import monitoringRoutes from "./monitoringRoutes";
import { setupVite, serveStatic, log } from "./vite";
import { initMCP } from "./mcp";
// Using simple login interface for Replit environment
import { setupLoginInterface } from "./login-interface";
import { bentonCountyFormatMiddleware, bentonCountyHeadersMiddleware } from "./middleware/bentonCountyFormatMiddleware";
// Import cost factor plugin
import { register as registerCostFactorPlugin } from "./plugins/CostFactorTables";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize MCP framework for AI-powered features
  try {
    initMCP(app);
  } catch (error) {
    log(`MCP initialization error: ${error}`, 'error');
  }
  
  // Initialize CostFactorTables plugin for building cost calculations
  try {
    registerCostFactorPlugin(app);
    log('CostFactorTables plugin registered successfully');
  } catch (error) {
    log(`CostFactorTables plugin registration error: ${error}`, 'error');
  }
  
  // Create default users for database authentication
  try {
    // Import using dynamic import() for ES modules compatibility
    const defaultUsersModule = await import('./create-default-users');
    await defaultUsersModule.createDefaultUsers();
  } catch (error) {
    log(`Default user creation error: ${error}`, 'error');
  }
  
  // Setup authentication system with PostgreSQL database
  try {
    setupLoginInterface(app);
  } catch (error) {
    log(`Authentication initialization error: ${error}`, 'error');
  }
  
  // Apply Benton County format middleware to API responses
  app.use(bentonCountyFormatMiddleware());
  app.use(bentonCountyHeadersMiddleware());
  
  // Create HTTP server
  const server = createServer(app);

  // Create specific monitoring routes that must be accessible even in development
  // These routes should be prioritized over Vite's middleware
  app.use('/api', monitoringRoutes);
  
  // Register API routes first, so they take precedence over Vite
  app.use('/api', routes);
  
  // importantly only setup vite in development after
  // setting up all the API routes so the catch-all route
  // doesn't interfere with the API routes
  if (app.get("env") === "development") {
    // In development, setup Vite after API routes are registered
    await setupVite(app, server);
  } else {
    // In production, serve static files
    serveStatic(app);
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();

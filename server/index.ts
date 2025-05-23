import express, { type Request, Response, NextFunction } from "express";
import { createServer } from 'http';
import routes from "./routes";
import monitoringRoutes from "./monitoringRoutes";
import { setupVite, serveStatic, log } from "./vite";
import { initDatabase } from "./db";
import { initMCP } from "./mcp";
import { setupAuth } from "./replitAuth";
import { setupCountyNetworkAuth } from "./county-auth";
import { bentonCountyFormatMiddleware, bentonCountyHeadersMiddleware } from "./middleware/bentonCountyFormatMiddleware";

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
  // Initialize the database
  try {
    await initDatabase();
    log('Database initialized successfully');
  } catch (error) {
    log(`Database initialization error: ${error}`, 'error');
  }
  
  // Initialize MCP framework for AI-powered features
  try {
    initMCP(app);
  } catch (error) {
    log(`MCP initialization error: ${error}`, 'error');
  }
  
  // Setup authentication with Replit Auth
  try {
    await setupAuth(app);
    // Setup County Network Authentication
    setupCountyNetworkAuth(app);
    log('Authentication system initialized successfully');
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
  
  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    // In development, we need to register API routes AFTER Vite setup
    // This is because of how Vite handles requests in middleware mode
    await setupVite(app, server);
    
    // Register remaining API routes after Vite middleware
    app.use('/api', routes);
  } else {
    // In production, register routes first, then serve static files
    app.use('/api', routes);
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

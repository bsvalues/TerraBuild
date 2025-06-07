/**
 * Super simplified auth module that doesn't rely on complex session handling
 */
 
const cookieParser = require('cookie-parser');

// Hardcoded user data - no database dependency
const USERS = [
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

// Simple token store
const tokens = new Map();

/**
 * Setup auth for the Express app
 */
function setupAuth(app) {
  // Make sure cookie parser is available
  app.use(cookieParser());

  // Authentication middleware
  app.use((req, res, next) => {
    const token = req.cookies?.authToken;
    
    if (token && tokens.has(token)) {
      const userId = tokens.get(token);
      const user = USERS.find(u => u.id === userId);
      
      if (user) {
        // Add user to request (exclude password)
        const { password, ...userWithoutPassword } = user;
        req.user = userWithoutPassword;
        
        // Add isAuthenticated method
        req.isAuthenticated = function() { return true; };
      }
    } else {
      // Not authenticated
      req.isAuthenticated = function() { return false; };
    }
    
    next();
  });

  // API endpoints
  app.post("/api/register", (req, res) => {
    const { username, password, name, role = 'user' } = req.body;
    
    // Check if username already exists
    if (USERS.some(u => u.username === username)) {
      return res.status(400).json({ message: "Username already exists" });
    }
    
    // Create new user
    const newUser = {
      id: USERS.length + 1,
      username,
      password,
      name: name || username,
      role,
      is_active: true
    };
    
    USERS.push(newUser);
    
    // Create token
    const token = Math.random().toString(36).substring(2);
    tokens.set(token, newUser.id);
    
    // Set cookie
    res.cookie('authToken', token, { 
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000
    });
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
  });

  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    
    console.log(`Login attempt for ${username} with password ${password}`);
    
    // Find user with matching credentials
    const user = USERS.find(u => 
      u.username === username && u.password === password
    );
    
    if (!user) {
      console.log(`Login failed for ${username}`);
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    console.log(`Login successful for ${username}`);
    
    // Create token
    const token = Math.random().toString(36).substring(2);
    tokens.set(token, user.id);
    
    // Set cookie
    res.cookie('authToken', token, { 
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000
    });
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    res.status(200).json(userWithoutPassword);
  });

  app.post("/api/logout", (req, res) => {
    const token = req.cookies?.authToken;
    
    if (token) {
      tokens.delete(token);
      res.clearCookie('authToken');
    }
    
    res.status(200).json({ message: "Logged out successfully" });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    res.status(200).json(req.user);
  });
  
  console.log('Hardcoded authentication system ready with users:');
  console.log('- admin/admin123');
  console.log('- default/default123');
}

module.exports = { setupAuth };
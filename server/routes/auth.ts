import { Router } from 'express';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { storage } from '../storage-factory';
import { User } from '@shared/schema';

const router = Router();
const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split('.');
  if (!hashed || !salt) return false;
  
  const hashedBuf = Buffer.from(hashed, 'hex');
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Configure passport
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return done(null, false, { message: 'User not found' });
      }
      
      // Check if the user already has a hashed password (contains a dot)
      if (!user.password.includes('.')) {
        // Hash the plain password and update the user
        const hashedPassword = await hashPassword(user.password);
        await storage.updateUser(user.id, { password: hashedPassword });
        user.password = hashedPassword;
      }
      
      const isValid = await comparePasswords(password, user.password);
      if (!isValid) {
        return done(null, false, { message: 'Invalid password' });
      }
      
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await storage.getUserById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Auth routes
router.post('/register', async (req, res, next) => {
  try {
    const { username, password, name, role } = req.body;
    
    // Check if user already exists
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Create user
    const user = await storage.createUser({
      username,
      password: hashedPassword,
      name: name || username,
      role: role || 'user',
      is_active: true
    });
    
    // Login automatically
    req.login(user, (err) => {
      if (err) return next(err);
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    });
  } catch (err) {
    next(err);
  }
});

router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ message: info?.message || 'Invalid credentials' });
    
    req.login(user, (err) => {
      if (err) return next(err);
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      return res.status(200).json(userWithoutPassword);
    });
  })(req, res, next);
});

router.post('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.status(200).json({ message: 'Logged out successfully' });
  });
});

router.get('/user', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  // Return user without password
  const { password, ...userWithoutPassword } = req.user as User;
  res.status(200).json(userWithoutPassword);
});

export default router;
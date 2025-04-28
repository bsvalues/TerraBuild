/**
 * County Network Authentication for TerraFusion Platform
 * 
 * This module implements authentication for county network users
 * by integrating with the county's authentication system.
 */

import { Strategy } from 'passport-local';
import passport from 'passport';
import { Express } from 'express';
import { storage } from './storage-implementation';
import { log } from './vite';
import { User, InsertUser } from '../shared/schema';

/**
 * County Network Authentication Strategy
 * 
 * This strategy checks if the user is on the county network and
 * authenticates them based on their network credentials.
 */
export class CountyNetworkStrategy extends Strategy {
  constructor() {
    super(async (username, password, done) => {
      try {
        // First check if the user exists in our system
        const user = await storage.getUserByEmail(username); // Using email as username
        
        if (user) {
          // User exists, perform county network authentication
          const isAuthenticated = await this.authenticateWithCountyNetwork(username, password);
          
          if (isAuthenticated) {
            return done(null, user);
          } else {
            return done(null, false, { message: 'Invalid county network credentials' });
          }
        } else {
          // If the user doesn't exist but has valid county network credentials,
          // we could optionally auto-create the user here
          const isAuthenticated = await this.authenticateWithCountyNetwork(username, password);
          
          if (isAuthenticated) {
            // Auto-create user from county network directory
            const userInfo = await this.getCountyUserInfo(username);
            
            if (userInfo) {
              // Split name into first and last name
              const nameParts = userInfo.name.split(' ');
              const firstName = nameParts[0];
              const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
              
              const newUser = await storage.createUser({
                username: username,
                email: userInfo.email,
                firstName: firstName,
                lastName: lastName,
                role: userInfo.role || 'user',
                isActive: true
              } as InsertUser);
              
              return done(null, newUser);
            }
          }
          
          return done(null, false, { message: 'User not found in system' });
        }
      } catch (error) {
        return done(error);
      }
    });
  }
  
  /**
   * Authenticate with the county network
   * This is a placeholder that would be replaced with actual county authentication logic
   */
  private async authenticateWithCountyNetwork(username: string, password: string): Promise<boolean> {
    try {
      // In a real implementation, this would call the county's authentication service
      // For now, we'll simulate authentication in development mode
      if (process.env.NODE_ENV !== 'production') {
        log('Development mode: Simulating county network authentication');
        return true; // Auto-authenticate in development
      }
      
      // This would be replaced with actual county authentication API call
      // For example: 
      // const response = await fetch('https://county-auth-api.example.com/validate', {
      //   method: 'POST',
      //   body: JSON.stringify({ username, password }),
      //   headers: { 'Content-Type': 'application/json' }
      // });
      // return response.status === 200;
      
      return false; // Default to false in production until implemented
    } catch (error) {
      console.error('County network authentication error:', error);
      return false;
    }
  }
  
  /**
   * Get user information from county directory
   * This is a placeholder that would be replaced with actual county directory logic
   */
  private async getCountyUserInfo(username: string): Promise<{name: string, email: string, role?: string} | null> {
    try {
      // In a real implementation, this would query the county's user directory
      // For now, we'll simulate user info in development mode
      if (process.env.NODE_ENV !== 'production') {
        return {
          name: `${username} (County)`,
          email: `${username}@county.gov`,
          role: 'user'
        };
      }
      
      // This would be replaced with actual county directory API call
      // For example:
      // const response = await fetch(`https://county-directory.example.com/users/${username}`);
      // if (response.status === 200) {
      //   return await response.json();
      // }
      
      return null;
    } catch (error) {
      console.error('Error getting county user info:', error);
      return null;
    }
  }
}

/**
 * Setup County Network Authentication
 */
export function setupCountyNetworkAuth(app: Express) {
  // Register the county network strategy
  passport.use('county-network', new CountyNetworkStrategy());
  
  // Add the county network login endpoint
  app.post('/api/county-login', passport.authenticate('county-network'), (req, res) => {
    // Log the login
    storage.createActivity({
      action: 'County network login',
      icon: 'ri-building-line',
      iconColor: 'success',
      details: { userId: req.user?.id, username: req.user?.username }
    }).catch(console.error);
    
    // Return user data
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    res.status(200).json({
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      authMethod: 'county-network'
    });
  });
  
  // Add a county network status check endpoint
  app.get('/api/county-network-status', (req, res) => {
    // In a real implementation, this would check if the user is on the county network
    const isOnCountyNetwork = process.env.NODE_ENV !== 'production' ||
                             req.headers['x-county-network'] === 'true';
    
    res.json({
      onCountyNetwork: isOnCountyNetwork
    });
  });
}
/**
 * Local Storage Authentication
 * 
 * This module provides authentication services when Supabase auth is unavailable.
 * It stores and manages user sessions in local storage for offline access.
 */

import { v4 as uuidv4 } from 'uuid';

// Storage key for local auth
const LOCAL_AUTH_KEY = 'bcbs_local_auth';

// Event names for auth changes
export type AuthChangeEvent = 'SIGNED_IN' | 'SIGNED_OUT' | 'USER_UPDATED' | 'TOKEN_REFRESHED';

// Local session data for offline authentication
export interface LocalSession {
  access_token: string;
  refresh_token: string;
  created_at: number;
  expires_at: number;
  user: LocalUser;
}

// Local user data structure
export interface LocalUser {
  id: string;
  email: string;
  role: string;
  app_metadata: {
    role?: string;
    permissions?: string[];
  };
  user_metadata: Record<string, any>;
  aud: string;
  created_at: string;
}

// Subscription object for auth state changes
export interface Subscription {
  unsubscribe: () => void;
}

// Event listener
interface EventListener {
  event: AuthChangeEvent;
  callback: (event: AuthChangeEvent, session: LocalSession | null) => void;
}

/**
 * Local Storage Auth Service
 */
class LocalStorageAuth {
  private listeners: EventListener[] = [];
  
  /**
   * Get current session from local storage
   */
  async getSession(): Promise<{ 
    data: { session: LocalSession | null }, 
    error: Error | null 
  }> {
    try {
      const sessionData = localStorage.getItem(LOCAL_AUTH_KEY);
      
      if (!sessionData) {
        return { data: { session: null }, error: null };
      }
      
      const session = JSON.parse(sessionData) as LocalSession;
      
      // Check if session has expired
      if (session.expires_at < Date.now()) {
        // Session expired, clear it
        await this.signOut();
        return { 
          data: { session: null }, 
          error: new Error('Session expired')
        };
      }
      
      return { data: { session }, error: null };
    } catch (error) {
      console.error('Error getting local session:', error);
      return { 
        data: { session: null }, 
        error: error instanceof Error ? error : new Error('Unknown error getting session')
      };
    }
  }
  
  /**
   * Get current user from local storage
   */
  async getUser(): Promise<{
    data: { user: LocalUser | null },
    error: Error | null
  }> {
    try {
      const { data, error } = await this.getSession();
      
      if (error) {
        throw error;
      }
      
      return {
        data: { user: data.session?.user || null },
        error: null
      };
    } catch (error) {
      console.error('Error getting local user:', error);
      return {
        data: { user: null },
        error: error instanceof Error ? error : new Error('Unknown error getting user')
      };
    }
  }
  
  /**
   * Sign in with email and password (mock)
   * 
   * This is a mock implementation that simulates authentication
   * for use when Supabase is unavailable.
   */
  async signInWithPassword(credentials: { 
    email: string; 
    password: string;
  }): Promise<{
    data: { session: LocalSession | null; user: LocalUser | null },
    error: Error | null
  }> {
    try {
      // In a real implementation, we would validate credentials against
      // some locally cached data. For now, we'll accept any credentials
      // and assign a default role.
      
      // Create a session expiry (24 hours from now)
      const expiresAt = Date.now() + (24 * 60 * 60 * 1000);
      
      // Create a user
      const user: LocalUser = {
        id: uuidv4(),
        email: credentials.email,
        role: 'authenticated',
        app_metadata: {
          role: 'authenticated',
          permissions: ['read:data']
        },
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString()
      };
      
      // Create a session
      const session: LocalSession = {
        access_token: uuidv4(),
        refresh_token: uuidv4(),
        created_at: Date.now(),
        expires_at: expiresAt,
        user
      };
      
      // Store in local storage
      localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(session));
      
      // Emit auth change event
      this.notifyAllListeners('SIGNED_IN', session);
      
      return {
        data: { session, user },
        error: null
      };
    } catch (error) {
      console.error('Error signing in locally:', error);
      return {
        data: { session: null, user: null },
        error: error instanceof Error ? error : new Error('Unknown error signing in')
      };
    }
  }
  
  /**
   * Sign out
   */
  async signOut(): Promise<{ error: Error | null }> {
    try {
      // Remove from local storage
      localStorage.removeItem(LOCAL_AUTH_KEY);
      
      // Emit auth change event
      this.notifyAllListeners('SIGNED_OUT', null);
      
      return { error: null };
    } catch (error) {
      console.error('Error signing out locally:', error);
      return {
        error: error instanceof Error ? error : new Error('Unknown error signing out')
      };
    }
  }
  
  /**
   * Update user data
   */
  async updateUser(attributes: { 
    email?: string;
    password?: string;
    data?: Record<string, any>;
  }): Promise<{
    data: { user: LocalUser | null },
    error: Error | null
  }> {
    try {
      // Get current session
      const { data: sessionData, error: sessionError } = await this.getSession();
      
      if (sessionError) {
        throw sessionError;
      }
      
      if (!sessionData.session) {
        return {
          data: { user: null },
          error: new Error('No active session')
        };
      }
      
      // Update user data
      const updatedUser: LocalUser = {
        ...sessionData.session.user,
        email: attributes.email || sessionData.session.user.email,
        user_metadata: {
          ...sessionData.session.user.user_metadata,
          ...(attributes.data || {})
        }
      };
      
      // Update session
      const updatedSession: LocalSession = {
        ...sessionData.session,
        user: updatedUser
      };
      
      // Store in local storage
      localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(updatedSession));
      
      // Emit auth change event
      this.notifyAllListeners('USER_UPDATED', updatedSession);
      
      return {
        data: { user: updatedUser },
        error: null
      };
    } catch (error) {
      console.error('Error updating user locally:', error);
      return {
        data: { user: null },
        error: error instanceof Error ? error : new Error('Unknown error updating user')
      };
    }
  }
  
  /**
   * Import Supabase session for offline use
   */
  importSupabaseSession(session: any): void {
    try {
      if (!session || !session.user) {
        return;
      }
      
      // Convert Supabase session to local format
      const localSession: LocalSession = {
        access_token: session.access_token,
        refresh_token: session.refresh_token || uuidv4(),
        created_at: new Date(session.created_at || Date.now()).getTime(),
        expires_at: new Date(session.expires_at || Date.now() + (24 * 60 * 60 * 1000)).getTime(),
        user: {
          id: session.user.id,
          email: session.user.email,
          role: session.user.role || 'authenticated',
          app_metadata: session.user.app_metadata || { role: 'authenticated' },
          user_metadata: session.user.user_metadata || {},
          aud: session.user.aud || 'authenticated',
          created_at: session.user.created_at || new Date().toISOString()
        }
      };
      
      // Store in local storage
      localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(localSession));
      
      // No need to emit event as this is just a backup
    } catch (error) {
      console.error('Error importing Supabase session:', error);
    }
  }
  
  /**
   * Listen for auth state changes
   */
  onAuthStateChange(
    callback: (event: AuthChangeEvent, session: LocalSession | null) => void
  ): { data: { subscription: Subscription } } {
    // Create a unique event listener for any event
    const listener: EventListener = {
      event: 'SIGNED_IN', // this is a placeholder, we'll listen to all events
      callback
    };
    
    // Add to listeners
    this.listeners.push(listener);
    
    // Return subscription object
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            this.listeners = this.listeners.filter(l => l !== listener);
          }
        }
      }
    };
  }
  
  /**
   * Notify listeners of auth state changes
   */
  private notifyAllListeners(event: AuthChangeEvent, session: LocalSession | null): void {
    // Notify all listeners
    this.listeners.forEach(listener => {
      try {
        listener.callback(event, session);
      } catch (error) {
        console.error('Error in auth state change listener:', error);
      }
    });
  }
}

// Create and export singleton instance
export const localAuth = new LocalStorageAuth();

export default localAuth;
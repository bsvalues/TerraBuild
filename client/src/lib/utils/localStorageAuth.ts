/**
 * Local Storage Authentication
 * 
 * This module provides authentication functionality using local storage
 * for offline mode operations when Supabase is not available.
 */

import { Session, User } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Local session type (subset of Supabase Session)
export interface LocalSession {
  id: string;
  user: LocalUser;
  created_at: string;
  expires_at: string;
}

// Local user type (subset of Supabase User)
export interface LocalUser {
  id: string;
  email?: string;
  role?: string;
  created_at: string;
}

// Auth state change callback
type AuthStateCallback = (event: string, session: LocalSession | null) => void;

// Local auth subscription
interface LocalAuthSubscription {
  id: string;
  callback: AuthStateCallback;
  unsubscribe: () => void;
}

// Auth event names
const AUTH_EVENTS = {
  SIGNED_IN: 'SIGNED_IN',
  SIGNED_OUT: 'SIGNED_OUT',
  TOKEN_REFRESHED: 'TOKEN_REFRESHED',
  USER_UPDATED: 'USER_UPDATED',
};

/**
 * Local storage authentication service
 */
class LocalStorageAuth {
  private storage: Storage;
  private sessionKey: string = 'local-auth-session';
  private subscriptions: Map<string, AuthStateCallback>;
  
  /**
   * Initialize with browser storage
   */
  constructor() {
    this.storage = window.localStorage;
    this.subscriptions = new Map();
  }
  
  /**
   * Sign in with local credentials
   * @param session Local session data
   */
  async signIn(session: LocalSession): Promise<{ data: { session: LocalSession }, error: null } | { data: { session: null }, error: Error }> {
    try {
      // Validate session
      if (!session.id || !session.user || !session.user.id) {
        throw new Error('Invalid session data');
      }
      
      // Store session
      this.storage.setItem(this.sessionKey, JSON.stringify(session));
      
      // Notify subscribers
      this.notifySubscribers(AUTH_EVENTS.SIGNED_IN, session);
      
      return {
        data: { session },
        error: null
      };
    } catch (error) {
      console.error('Error in local signIn:', error);
      return {
        data: { session: null },
        error: error instanceof Error ? error : new Error('Unknown error during sign in')
      };
    }
  }
  
  /**
   * Sign out from local session
   */
  async signOut(): Promise<{ error: Error | null }> {
    try {
      // Get current session for notification
      const session = this.getSessionFromStorage();
      
      // Remove session
      this.storage.removeItem(this.sessionKey);
      
      // Notify subscribers
      if (session) {
        this.notifySubscribers(AUTH_EVENTS.SIGNED_OUT, null);
      }
      
      return { error: null };
    } catch (error) {
      console.error('Error in local signOut:', error);
      return {
        error: error instanceof Error ? error : new Error('Unknown error during sign out')
      };
    }
  }
  
  /**
   * Refresh local session
   */
  async refreshSession(): Promise<{ data: { session: LocalSession | null }, error: Error | null }> {
    try {
      const session = this.getSessionFromStorage();
      
      if (!session) {
        return { data: { session: null }, error: null };
      }
      
      // Extend session expiry time
      const expiryTime = new Date();
      expiryTime.setDate(expiryTime.getDate() + 1); // Extend by 1 day
      
      const refreshedSession: LocalSession = {
        ...session,
        expires_at: expiryTime.toISOString()
      };
      
      // Store updated session
      this.storage.setItem(this.sessionKey, JSON.stringify(refreshedSession));
      
      // Notify subscribers
      this.notifySubscribers(AUTH_EVENTS.TOKEN_REFRESHED, refreshedSession);
      
      return {
        data: { session: refreshedSession },
        error: null
      };
    } catch (error) {
      console.error('Error refreshing local session:', error);
      return {
        data: { session: null },
        error: error instanceof Error ? error : new Error('Unknown error refreshing session')
      };
    }
  }
  
  /**
   * Get current session
   */
  async getSession(): Promise<{ data: { session: LocalSession | null }, error: Error | null }> {
    try {
      const session = this.getSessionFromStorage();
      
      // Check if session has expired
      if (session) {
        const expiryTime = new Date(session.expires_at).getTime();
        if (expiryTime < Date.now()) {
          // Session expired
          this.storage.removeItem(this.sessionKey);
          this.notifySubscribers(AUTH_EVENTS.SIGNED_OUT, null);
          return { data: { session: null }, error: null };
        }
      }
      
      return {
        data: { session },
        error: null
      };
    } catch (error) {
      console.error('Error getting local session:', error);
      return {
        data: { session: null },
        error: error instanceof Error ? error : new Error('Unknown error getting session')
      };
    }
  }
  
  /**
   * Update user data
   * @param attributes User attributes to update
   */
  async updateUser(attributes: Partial<LocalUser>): Promise<{ data: { user: LocalUser | null }, error: Error | null }> {
    try {
      const session = this.getSessionFromStorage();
      
      if (!session) {
        return {
          data: { user: null },
          error: new Error('No active session')
        };
      }
      
      // Update user data
      const updatedUser: LocalUser = {
        ...session.user,
        ...attributes
      };
      
      // Update session
      const updatedSession: LocalSession = {
        ...session,
        user: updatedUser
      };
      
      // Store updated session
      this.storage.setItem(this.sessionKey, JSON.stringify(updatedSession));
      
      // Notify subscribers
      this.notifySubscribers(AUTH_EVENTS.USER_UPDATED, updatedSession);
      
      return {
        data: { user: updatedUser },
        error: null
      };
    } catch (error) {
      console.error('Error updating local user:', error);
      return {
        data: { user: null },
        error: error instanceof Error ? error : new Error('Unknown error updating user')
      };
    }
  }
  
  /**
   * Listen for auth state changes
   * @param callback Function to call when auth state changes
   */
  onAuthStateChange(callback: AuthStateCallback): { data: { subscription: LocalAuthSubscription } } {
    const id = uuidv4();
    
    // Add subscription
    this.subscriptions.set(id, callback);
    
    // Create subscription object
    const subscription: LocalAuthSubscription = {
      id,
      callback,
      unsubscribe: () => {
        this.subscriptions.delete(id);
      }
    };
    
    return {
      data: { subscription }
    };
  }
  
  /**
   * Import a Supabase session to local storage
   * @param session Supabase session
   */
  importSupabaseSession(session: Session): void {
    if (!session || !session.user) return;
    
    const localSession: LocalSession = {
      id: session.access_token,
      user: {
        id: session.user.id,
        email: session.user.email || undefined,
        created_at: session.user.created_at,
      },
      created_at: new Date().toISOString(),
      expires_at: new Date(session.expires_at * 1000).toISOString(),
    };
    
    // Store local session
    this.storage.setItem(this.sessionKey, JSON.stringify(localSession));
  }
  
  /**
   * Get session from storage
   */
  private getSessionFromStorage(): LocalSession | null {
    try {
      const sessionStr = this.storage.getItem(this.sessionKey);
      if (!sessionStr) return null;
      
      return JSON.parse(sessionStr) as LocalSession;
    } catch (error) {
      console.error('Error parsing local session:', error);
      return null;
    }
  }
  
  /**
   * Notify all subscribers
   * @param event Auth event
   * @param session Current session
   */
  private notifySubscribers(event: string, session: LocalSession | null): void {
    this.subscriptions.forEach(callback => {
      try {
        callback(event, session);
      } catch (error) {
        console.error('Error in auth state change callback:', error);
      }
    });
  }
}

// Create and export a singleton instance
export const localAuth = new LocalStorageAuth();

export default localAuth;
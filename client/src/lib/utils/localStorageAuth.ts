/**
 * Local Storage Authentication Manager
 * 
 * This module provides a fallback authentication system using localStorage
 * when Supabase connection is not available. It implements similar methods
 * to the Supabase auth API to make switching between them seamless.
 */

import { User, Session } from '@supabase/supabase-js';

// Keys for localStorage
const AUTH_USER_KEY = 'bcbs-local-auth-user';
const AUTH_SESSION_KEY = 'bcbs-local-auth-session';
const AUTH_EXPIRES_KEY = 'bcbs-local-auth-expires';

// Event for auth state changes
export const LOCAL_AUTH_CHANGE_EVENT = 'bcbs-local-auth-change';

// Interface matching Supabase auth response
export interface LocalAuthResponse<T> {
  data: T;
  error: Error | null;
}

// Create a user session similar to Supabase
export interface LocalSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: LocalUser;
}

// User structure similar to Supabase
export interface LocalUser {
  id: string;
  email?: string;
  user_metadata: {
    full_name?: string;
    avatar_url?: string;
    name?: string;
    role?: string;
  };
  app_metadata: {
    role?: string;
    permissions?: string[];
  };
  created_at: string;
}

/**
 * Convert a Supabase User to a LocalUser
 */
const convertToLocalUser = (user: User): LocalUser => {
  return {
    id: user.id,
    email: user.email,
    user_metadata: user.user_metadata || {},
    app_metadata: user.app_metadata || {},
    created_at: user.created_at || new Date().toISOString()
  };
};

/**
 * Convert a Supabase Session to a LocalSession
 */
const convertToLocalSession = (session: Session): LocalSession => {
  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token || '',
    expires_at: new Date(session.expires_at || '').getTime(),
    user: convertToLocalUser(session.user)
  };
};

/**
 * Dispatch an auth change event
 */
const dispatchAuthChangeEvent = (eventType: 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED', session: LocalSession | null) => {
  const event = new CustomEvent(LOCAL_AUTH_CHANGE_EVENT, {
    detail: { event: eventType, session }
  });
  window.dispatchEvent(event);
};

/**
 * Get the current local session
 */
export const getLocalSession = (): LocalAuthResponse<{ session: LocalSession | null }> => {
  try {
    const sessionJson = localStorage.getItem(AUTH_SESSION_KEY);
    const expiresAt = localStorage.getItem(AUTH_EXPIRES_KEY);
    
    if (!sessionJson || !expiresAt) {
      return { data: { session: null }, error: null };
    }
    
    const session = JSON.parse(sessionJson) as LocalSession;
    const expiresAtTime = parseInt(expiresAt, 10);
    
    // Check if session is expired
    if (expiresAtTime < Date.now()) {
      // Clear expired session
      localStorage.removeItem(AUTH_SESSION_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
      localStorage.removeItem(AUTH_EXPIRES_KEY);
      return { data: { session: null }, error: null };
    }
    
    return { data: { session }, error: null };
  } catch (error) {
    return { 
      data: { session: null }, 
      error: error instanceof Error 
        ? error 
        : new Error('Failed to get local session')
    };
  }
};

/**
 * Sign in with email and password (local storage version)
 */
export const signInWithPassword = (
  email: string, 
  password: string
): LocalAuthResponse<{ user: LocalUser; session: LocalSession }> => {
  try {
    // Generate a mock user and session
    const user: LocalUser = {
      id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      email,
      user_metadata: {
        full_name: email.split('@')[0], // Extract name from email
      },
      app_metadata: {
        role: 'user',
      },
      created_at: new Date().toISOString()
    };
    
    // Create a session that expires in 24 hours
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000);
    const session: LocalSession = {
      access_token: `local-token-${Math.random().toString(36).substring(2, 15)}`,
      refresh_token: `local-refresh-${Math.random().toString(36).substring(2, 15)}`,
      expires_at: expiresAt,
      user
    };
    
    // Store in localStorage
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
    localStorage.setItem(AUTH_EXPIRES_KEY, expiresAt.toString());
    
    // Emit auth change event
    dispatchAuthChangeEvent('SIGNED_IN', session);
    
    return { data: { user, session }, error: null };
  } catch (error) {
    return { 
      data: { user: null as any, session: null as any }, 
      error: error instanceof Error 
        ? error 
        : new Error('Failed to sign in locally') 
    };
  }
};

/**
 * Sign out from the local session
 */
export const signOut = (): LocalAuthResponse<{}> => {
  try {
    // Clear localStorage
    localStorage.removeItem(AUTH_SESSION_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_EXPIRES_KEY);
    
    // Emit auth change event
    dispatchAuthChangeEvent('SIGNED_OUT', null);
    
    return { data: {}, error: null };
  } catch (error) {
    return { 
      data: {}, 
      error: error instanceof Error 
        ? error 
        : new Error('Failed to sign out locally') 
    };
  }
};

/**
 * Get the current user
 */
export const getUser = (): LocalAuthResponse<{ user: LocalUser | null }> => {
  try {
    const userJson = localStorage.getItem(AUTH_USER_KEY);
    
    if (!userJson) {
      return { data: { user: null }, error: null };
    }
    
    const user = JSON.parse(userJson) as LocalUser;
    return { data: { user }, error: null };
  } catch (error) {
    return { 
      data: { user: null }, 
      error: error instanceof Error 
        ? error 
        : new Error('Failed to get local user') 
    };
  }
};

/**
 * Set up a listener for auth state changes
 */
export const onAuthStateChange = (
  callback: (event: 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED', session: LocalSession | null) => void
) => {
  const listener = (event: Event) => {
    const customEvent = event as CustomEvent;
    callback(customEvent.detail.event, customEvent.detail.session);
  };
  
  window.addEventListener(LOCAL_AUTH_CHANGE_EVENT, listener);
  
  // Return a function to unsubscribe
  return {
    data: {
      subscription: {
        unsubscribe: () => {
          window.removeEventListener(LOCAL_AUTH_CHANGE_EVENT, listener);
        }
      }
    }
  };
};

/**
 * Import a Supabase session into local storage
 */
export const importSupabaseSession = (supabaseSession: Session): LocalAuthResponse<{}> => {
  try {
    if (!supabaseSession || !supabaseSession.user) {
      return { data: {}, error: new Error('Invalid Supabase session') };
    }
    
    const localUser = convertToLocalUser(supabaseSession.user);
    const localSession = convertToLocalSession(supabaseSession);
    
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(localUser));
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(localSession));
    localStorage.setItem(AUTH_EXPIRES_KEY, localSession.expires_at.toString());
    
    return { data: {}, error: null };
  } catch (error) {
    return { 
      data: {}, 
      error: error instanceof Error 
        ? error 
        : new Error('Failed to import Supabase session') 
    };
  }
};

// LocalAuth API wrapper for easier integration
export const localAuth = {
  getSession: getLocalSession,
  getUser,
  signInWithPassword,
  signOut,
  onAuthStateChange,
  importSupabaseSession
};

export default localAuth;
/**
 * Replit-Compatible In-Memory Storage
 * 
 * This storage provider works without requiring a database connection.
 * It's designed to work in Replit environments for demonstration and testing.
 */

import { User, InsertUser } from "@shared/schema";

// Type for storage interfaces
export interface IStorage {
  // User methods
  getUsers(): Promise<User[]>;
  getUserById(id: string | number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string | number, userData: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string | number): Promise<boolean>;
}

// In-memory user storage
const users: User[] = [
  {
    id: 1,
    username: 'admin',
    password: 'admin123',
    name: 'Administrator',
    role: 'admin',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 2,
    username: 'user',
    password: 'user123',
    name: 'Regular User',
    role: 'user',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date()
  }
];

// Simple session store
interface Session {
  id: string;
  userId: number;
  expires: Date;
}

const sessions: Session[] = [];

/**
 * Memory-based Storage Implementation
 */
export class MemStorage implements IStorage {
  /**
   * User methods
   */
  async getUsers(): Promise<User[]> {
    return [...users];
  }

  async getUserById(id: string | number): Promise<User | undefined> {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    return users.find(u => u.id === numericId);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return users.find(u => u.username === username);
  }

  async createUser(userData: InsertUser): Promise<User> {
    const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
    
    const newUser: User = {
      id: newId,
      ...userData,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    users.push(newUser);
    return newUser;
  }

  async updateUser(id: string | number, userData: Partial<User>): Promise<User | undefined> {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    const index = users.findIndex(u => u.id === numericId);
    
    if (index === -1) {
      return undefined;
    }
    
    const updatedUser = {
      ...users[index],
      ...userData,
      updated_at: new Date()
    };
    
    users[index] = updatedUser;
    return updatedUser;
  }

  async deleteUser(id: string | number): Promise<boolean> {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    const index = users.findIndex(u => u.id === numericId);
    
    if (index === -1) {
      return false;
    }
    
    users.splice(index, 1);
    return true;
  }

  /**
   * Session methods
   */
  async createSession(userId: number, expiresIn: number = 24 * 60 * 60 * 1000): Promise<Session> {
    const id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expires = new Date(Date.now() + expiresIn);
    
    const session: Session = { id, userId, expires };
    sessions.push(session);
    
    return session;
  }

  async getSessionByToken(token: string): Promise<Session | undefined> {
    const session = sessions.find(s => s.id === token);
    
    if (!session) {
      return undefined;
    }
    
    // Check if session has expired
    if (new Date() > session.expires) {
      // Remove expired session
      const index = sessions.findIndex(s => s.id === token);
      if (index !== -1) {
        sessions.splice(index, 1);
      }
      return undefined;
    }
    
    return session;
  }

  async deleteSession(token: string): Promise<boolean> {
    const index = sessions.findIndex(s => s.id === token);
    
    if (index === -1) {
      return false;
    }
    
    sessions.splice(index, 1);
    return true;
  }
}

// Export singleton instance
export const storage = new MemStorage();
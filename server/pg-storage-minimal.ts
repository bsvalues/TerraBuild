import { IStorage } from './storage';
import { db } from './db';
import { eq, and, sql } from 'drizzle-orm';
import { 
  User, InsertUser,
  FileUpload, InsertFileUpload,
  users, settings, costMatrix, matrixDetail, 
  buildingTypes, regions, qualityFactors, conditionFactors, ageFactors, 
  calculations, projects, projectMembers, projectProperties,
  matrixImports, dataImports
} from '@shared/schema';

export class PostgresStorage implements IStorage {
  // Reference to database
  private db = db;
  
  constructor(postgresUrl?: string) {
    // URL is used by the parent class for connection management
    // In this implementation, we're using the configured db
  }
  
  /**
   * Check if the PostgreSQL connection is working
   */
  async checkConnection(): Promise<boolean> {
    try {
      // Perform a simple query to check database connectivity
      const result = await this.db.execute(sql`SELECT 1 as connected`);
      const rows = result as any;
      return rows && rows.length > 0 && !!rows[0]?.connected;
    } catch (error) {
      console.error('[postgres] Connection check error:', error);
      return false;
    }
  }
  
  /**
   * Helper method to check if a table exists in the database
   * @param tableName The name of the table to check
   * @returns Promise resolving to true if the table exists, false otherwise
   */
  async tableExists(tableName: string): Promise<boolean> {
    try {
      const result = await this.db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_name = ${tableName}
        );
      `);
      
      const rows = result as any;
      return rows && rows[0] && rows[0].exists === true;
    } catch (error) {
      console.error(`Error checking if table ${tableName} exists:`, error);
      return false;
    }
  }
  
  // User Management Methods
  async getAllUsers(): Promise<User[]> {
    try {
      if (!(await this.tableExists('users'))) {
        console.warn('Users table does not exist yet.');
        return [];
      }
      
      return await this.db.select().from(users);
    } catch (error) {
      console.error('Error fetching all users:', error);
      return [];
    }
  }

  async getUserById(id: string): Promise<User | undefined> {
    try {
      if (!(await this.tableExists('users'))) {
        console.warn('Users table does not exist yet.');
        return undefined;
      }
      
      const result = await this.db.select().from(users).where(eq(users.id, id));
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      if (!(await this.tableExists('users'))) {
        console.warn('Users table does not exist yet.');
        return undefined;
      }
      
      const result = await this.db.select().from(users).where(eq(users.username, username));
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error(`Error fetching user by username ${username}:`, error);
      return undefined;
    }
  }

  async createUser(userData: InsertUser): Promise<User> {
    try {
      if (!(await this.tableExists('users'))) {
        console.warn('Users table does not exist yet.');
        return {
          id: '',
          username: '',
          password: '',
          email: null,
          firstName: null,
          lastName: null,
          bio: null,
          profileImageUrl: null,
          role: 'user',
          isActive: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLogin: null,
          preferences: null
        };
      }
      
      const [user] = await this.db.insert(users).values({
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: string, userData: Partial<InsertUser>): Promise<User | null> {
    try {
      if (!(await this.tableExists('users'))) {
        console.warn('Users table does not exist yet.');
        return null;
      }
      
      const [user] = await this.db.update(users)
        .set({
          ...userData,
          updatedAt: new Date()
        })
        .where(eq(users.id, id))
        .returning();
      
      return user || null;
    } catch (error) {
      console.error(`Error updating user ${id}:`, error);
      return null;
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      if (!(await this.tableExists('users'))) {
        console.warn('Users table does not exist yet.');
        return false;
      }
      
      const result = await this.db.delete(users)
        .where(eq(users.id, id))
        .returning({ deletedId: users.id });
      
      return result.length > 0;
    } catch (error) {
      console.error(`Error deleting user ${id}:`, error);
      return false;
    }
  }
}
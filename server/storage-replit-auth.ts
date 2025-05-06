import {
  users,
  type User,
  type InsertUser,
  insertUserSchema
} from "../shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { z } from "zod";

// Interface for storage operations
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: InsertUser): Promise<User>;
  // Other operations
}

export class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: any): Promise<User> {
    // We need to make sure id is included, even though insertUserSchema omits it
    const userWithId = {
      ...userData,
      id: userData.id,  // Ensure ID is included
    };
    
    const [user] = await db
      .insert(users)
      .values([userWithId])
      .onConflictDoUpdate({
        target: users.id,
        set: {
          username: userData.username,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          bio: userData.bio,
          profileImageUrl: userData.profileImageUrl,
          role: userData.role,
          isActive: userData.isActive,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Other operations
}
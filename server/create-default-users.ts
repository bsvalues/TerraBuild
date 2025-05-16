import { db } from './db';
import { users } from '../shared/schema';

/**
 * This script creates default users in the database for development purposes
 */
import { eq } from 'drizzle-orm';

export async function createDefaultUsers() {
  try {
    // Check if admin user already exists using the eq operator
    const adminResults = await db.select().from(users).where(eq(users.username, 'admin'));
    const existingAdmin = adminResults.length > 0 ? adminResults[0] : null;
    
    if (!existingAdmin) {
      console.log('Creating default admin user...');
      await db.insert(users).values({
        username: 'admin',
        password: 'admin123',
        name: 'Administrator',
        role: 'admin',
        is_active: true
      });
    }
    
    // Check if regular user already exists using the eq operator
    const userResults = await db.select().from(users).where(eq(users.username, 'user'));
    const existingUser = userResults.length > 0 ? userResults[0] : null;
    
    if (!existingUser) {
      console.log('Creating default regular user...');
      await db.insert(users).values({
        username: 'user',
        password: 'user123',
        name: 'Regular User',
        role: 'user',
        is_active: true
      });
    }
    
    console.log('Default users setup complete');
  } catch (error) {
    console.error('Error creating default users:', error);
    throw error; // Rethrow so we can see the full error
  }
}

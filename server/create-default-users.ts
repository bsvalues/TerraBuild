import { db } from './db';
import { users } from '../shared/schema';

/**
 * This script creates default users in the database for development purposes
 */
export async function createDefaultUsers() {
  try {
    // Check if admin user already exists
    const [existingAdmin] = await db.select().from(users).where({ username: 'admin' });
    
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
    
    // Check if regular user already exists
    const [existingUser] = await db.select().from(users).where({ username: 'user' });
    
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
  }
}

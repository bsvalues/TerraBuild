/**
 * Setup Supabase Schema Script
 * 
 * This script creates the necessary tables in the Supabase database.
 * Run this script once to initialize the database schema.
 */

import { getSupabaseClient } from '../utils/supabaseClient';
import fs from 'fs';
import path from 'path';

async function setupSupabaseSchema(): Promise<void> {
  try {
    console.log('🔄 Setting up Supabase schema...');
    
    const supabase = getSupabaseClient(true); // Use service key for admin privileges
    
    // Read the SQL schema file
    const schemaFilePath = path.resolve(__dirname, '../utils/supabaseSchema.sql');
    const sqlSchema = fs.readFileSync(schemaFilePath, 'utf8');
    
    // Split the SQL schema into individual statements
    const statements = sqlSchema
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    console.log(`📊 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        console.log(`⚙️ Executing statement ${i + 1}/${statements.length}...`);
        
        // Skip certain statements that require superuser privileges
        if (statement.includes('ALTER DATABASE')) {
          console.log('⚠️ Skipping statement requiring superuser privileges');
          continue;
        }
        
        const { error } = await supabase.rpc('pgexec', { query: statement });
        
        if (error) {
          console.error(`❌ Error executing statement ${i + 1}: ${error.message}`);
        } else {
          console.log(`✅ Successfully executed statement ${i + 1}`);
        }
      } catch (error) {
        console.error(`❌ Error executing statement ${i + 1}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    console.log('🎉 Supabase schema setup completed!');
  } catch (error) {
    console.error('❌ Failed to set up Supabase schema:', error);
    process.exit(1);
  }
}

// Run the setup function
setupSupabaseSchema()
  .then(() => {
    console.log('✨ Supabase setup completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Supabase setup failed:', error);
    process.exit(1);
  });
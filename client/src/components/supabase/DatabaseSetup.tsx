import React, { useState } from 'react';
import { useSupabase } from './SupabaseProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, CheckCircle2, Database, Shield } from "lucide-react";

// SQL statements to create the necessary tables
const CREATE_TABLES_SQL = [
  // Scenarios table
  `CREATE TABLE IF NOT EXISTS scenarios (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    parameters JSONB NOT NULL DEFAULT '{}',
    user_id INT NOT NULL,
    base_calculation_id INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,
    is_saved BOOLEAN DEFAULT FALSE,
    results JSONB
  );`,
  
  // Variations table
  `CREATE TABLE IF NOT EXISTS variations (
    id SERIAL PRIMARY KEY,
    scenario_id INT NOT NULL,
    name TEXT NOT NULL,
    parameter_changes JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
  );`,
  
  // Impacts table
  `CREATE TABLE IF NOT EXISTS impacts (
    id SERIAL PRIMARY KEY,
    scenario_id INT NOT NULL,
    parameter_key TEXT NOT NULL,
    original_value JSONB NOT NULL,
    new_value JSONB NOT NULL,
    impact_value TEXT,
    impact_percentage TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );`,
  
  // Properties table
  `CREATE TABLE IF NOT EXISTS properties (
    id SERIAL PRIMARY KEY,
    prop_id TEXT NOT NULL UNIQUE,
    block TEXT,
    tract_or_lot TEXT,
    parcel TEXT,
    address TEXT NOT NULL,
    county TEXT NOT NULL,
    state TEXT NOT NULL,
    zip_code TEXT NOT NULL,
    property_type TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,
    geo_location JSONB
  );`,
  
  // Improvements table
  `CREATE TABLE IF NOT EXISTS improvements (
    id SERIAL PRIMARY KEY,
    property_id INT NOT NULL,
    improvement_type TEXT NOT NULL,
    improvement_id TEXT NOT NULL,
    building_type TEXT NOT NULL,
    year_built INT NOT NULL,
    grade TEXT NOT NULL,
    condition TEXT NOT NULL,
    sq_footage INT NOT NULL,
    stories INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
  );`,
  
  // Create indexes for performance
  `CREATE INDEX IF NOT EXISTS idx_scenarios_user_id ON scenarios(user_id);`,
  `CREATE INDEX IF NOT EXISTS idx_variations_scenario_id ON variations(scenario_id);`,
  `CREATE INDEX IF NOT EXISTS idx_impacts_scenario_id ON impacts(scenario_id);`,
  `CREATE INDEX IF NOT EXISTS idx_properties_prop_id ON properties(prop_id);`,
  `CREATE INDEX IF NOT EXISTS idx_improvements_property_id ON improvements(property_id);`,
  
  // Add foreign key constraints
  `ALTER TABLE variations 
   ADD CONSTRAINT fk_variations_scenario 
   FOREIGN KEY (scenario_id) 
   REFERENCES scenarios(id) 
   ON DELETE CASCADE;`,
   
  `ALTER TABLE impacts 
   ADD CONSTRAINT fk_impacts_scenario 
   FOREIGN KEY (scenario_id) 
   REFERENCES scenarios(id) 
   ON DELETE CASCADE;`,
   
  `ALTER TABLE improvements 
   ADD CONSTRAINT fk_improvements_property 
   FOREIGN KEY (property_id) 
   REFERENCES properties(id) 
   ON DELETE CASCADE;`
];

interface SetupLogEntry {
  message: string;
  isError: boolean;
  timestamp: Date;
}

const DatabaseSetup: React.FC = () => {
  const { supabase, isConfigured, error } = useSupabase();
  const [isInitializing, setIsInitializing] = useState(false);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [setupLogs, setSetupLogs] = useState<SetupLogEntry[]>([]);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  
  const addLog = (message: string, isError = false) => {
    setSetupLogs(prev => [...prev, { message, isError, timestamp: new Date() }]);
  };
  
  const initializeDatabase = async () => {
    if (!supabase) {
      addLog('Supabase client is not available. Cannot initialize database.', true);
      return;
    }
    
    setIsInitializing(true);
    setIsSetupComplete(false);
    setSetupLogs([]);
    
    try {
      // First, check if the required schema function exists
      const { data: funcExists, error: funcCheckError } = await supabase.rpc('pgexec', { 
        query: "SELECT EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'pgexec');" 
      }).maybeSingle();
      
      if (funcCheckError) {
        addLog(`Error checking for pgexec function: ${funcCheckError.message}`, true);
        
        // Try to create the function if it doesn't exist
        const { error: createFuncError } = await supabase.rpc('pg_create_pgexec_function', {});
        
        if (createFuncError) {
          addLog(`Failed to create pgexec function: ${createFuncError.message}`, true);
          addLog('You may need to contact your database administrator to set up the pgexec function.', true);
          setIsInitializing(false);
          return;
        } else {
          addLog('Successfully created pgexec function.');
        }
      } else {
        addLog('Found existing pgexec function.');
      }
      
      // Execute each SQL statement to create the tables
      for (let i = 0; i < CREATE_TABLES_SQL.length; i++) {
        const sql = CREATE_TABLES_SQL[i];
        addLog(`Executing SQL statement ${i+1}/${CREATE_TABLES_SQL.length}...`);
        
        try {
          const { error: sqlError } = await supabase.rpc('pgexec', { query: sql });
          
          if (sqlError) {
            // If this is a foreign key constraint and previous statements failed,
            // it might be expected, so we'll just log it
            if (sql.includes('ADD CONSTRAINT') && sql.includes('FOREIGN KEY')) {
              addLog(`Note: Foreign key constraint might require manual setup: ${sqlError.message}`, true);
            } else {
              addLog(`Error executing SQL: ${sqlError.message}`, true);
            }
          } else {
            addLog(`Successfully executed SQL statement ${i+1}.`);
          }
        } catch (err) {
          addLog(`Exception executing SQL: ${err instanceof Error ? err.message : String(err)}`, true);
        }
      }
      
      // Verify tables were created
      const tables = ['scenarios', 'variations', 'impacts', 'properties', 'improvements'];
      let allTablesCreated = true;
      
      for (const table of tables) {
        const { error: tableCheckError } = await supabase
          .from(table)
          .select('count')
          .limit(1);
        
        if (tableCheckError) {
          if (tableCheckError.code === '42P01') { // Table doesn't exist
            addLog(`Table '${table}' was not created successfully.`, true);
            allTablesCreated = false;
          } else {
            addLog(`Error checking table '${table}': ${tableCheckError.message}`, true);
          }
        } else {
          addLog(`Table '${table}' was successfully created and is accessible.`);
        }
      }
      
      if (allTablesCreated) {
        addLog('Database initialization completed successfully!');
        setIsSetupComplete(true);
      } else {
        addLog('Database initialization completed with some issues. Please check the logs.', true);
      }
    } catch (err) {
      addLog(`Unexpected error initializing database: ${err instanceof Error ? err.message : String(err)}`, true);
    } finally {
      setIsInitializing(false);
      setIsLogModalOpen(true);
    }
  };
  
  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Database Setup Error</AlertTitle>
        <AlertDescription>
          Cannot initialize database because Supabase connection failed: {error}
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Supabase Database Setup
          </CardTitle>
          <CardDescription>
            Initialize the Supabase database schema for the BCBS application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSetupComplete ? (
            <Alert className="mb-4 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-600">Setup Complete</AlertTitle>
              <AlertDescription className="text-green-700">
                The database has been successfully initialized with all required tables.
              </AlertDescription>
            </Alert>
          ) : (
            <p className="mb-4 text-sm text-muted-foreground">
              This will create all necessary tables and indexes in your Supabase database.
              Make sure you have the correct permissions before proceeding.
            </p>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => setIsLogModalOpen(true)}
            disabled={setupLogs.length === 0}
          >
            View Logs
          </Button>
          <Button
            onClick={initializeDatabase}
            disabled={isInitializing || !isConfigured}
          >
            {isInitializing ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin border-2 border-primary rounded-full border-t-transparent"></span>
                Initializing...
              </>
            ) : isSetupComplete ? (
              'Reinitialize'
            ) : (
              'Initialize Database'
            )}
          </Button>
        </CardFooter>
      </Card>
      
      <Dialog open={isLogModalOpen} onOpenChange={setIsLogModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Database Setup Logs
            </DialogTitle>
            <DialogDescription>
              Detailed logs of the database initialization process.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[300px] rounded border p-4">
            {setupLogs.length === 0 ? (
              <p className="text-center text-muted-foreground">No logs available.</p>
            ) : (
              <div className="space-y-2">
                {setupLogs.map((log, index) => (
                  <div key={index} className={`text-sm ${log.isError ? 'text-red-500' : 'text-green-600'}`}>
                    <span className="font-mono text-xs">
                      [{log.timestamp.toLocaleTimeString()}]
                    </span>{' '}
                    {log.message}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          <DialogFooter>
            <Button onClick={() => setIsLogModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DatabaseSetup;
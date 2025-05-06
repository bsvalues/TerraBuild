import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Interface for data snapshots
interface DataSnapshot {
  id: string;
  timestamp: number;
  data: Record<string, any>;
  source: string;
  operation: 'create' | 'read' | 'update' | 'delete' | 'calculate' | 'import' | 'export';
}

// Interface for the state managed by the context
interface DataFlowState {
  // Properties being tracked for cost calculations
  propertyId?: string | null;
  propertyDetails?: Record<string, any> | null;
  
  // Building parameters
  buildingType?: string | null;
  buildingTypeDetails?: Record<string, any> | null;
  region?: string | null;
  regionDetails?: Record<string, any> | null;
  quality?: string | null;
  qualityDetails?: Record<string, any> | null;
  condition?: string | null;
  conditionDetails?: Record<string, any> | null;
  
  // Calculation parameters
  calculationId?: string | null;
  calculationResults?: Record<string, any> | null;
  
  // Import/Export state
  importSource?: string | null;
  importData?: any | null;
  exportFormat?: string | null;
  exportDestination?: string | null;
  
  // Session tracking
  sessionId: string;
  userActivity: string[];
  dataHistory: DataSnapshot[];
}

// Interface for the context value
interface DataFlowContextType {
  state: DataFlowState;
  updateState: (updates: Partial<DataFlowState>) => void;
  clearState: () => void;
  addDataSnapshot: (snapshot: Omit<DataSnapshot, 'timestamp'>) => void;
  getLastOperation: (operation: DataSnapshot['operation']) => DataSnapshot | undefined;
  resetHistory: () => void;
  trackUserActivity: (activity: string) => void;
}

// Initial state
const initialState: DataFlowState = {
  sessionId: uuidv4(),
  userActivity: [],
  dataHistory: [],
};

// Create context
const DataFlowContext = createContext<DataFlowContextType | undefined>(undefined);

// Provider component
const DataFlowProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<DataFlowState>(initialState);

  // Update state with new values
  const updateState = useCallback((updates: Partial<DataFlowState>) => {
    setState(prevState => ({
      ...prevState,
      ...updates,
    }));
  }, []);

  // Clear state
  const clearState = useCallback(() => {
    setState({
      ...initialState,
      sessionId: state.sessionId, // Keep the same session ID
    });
  }, [state.sessionId]);

  // Add a data snapshot to history
  const addDataSnapshot = useCallback((snapshot: Omit<DataSnapshot, 'timestamp'>) => {
    const newSnapshot: DataSnapshot = {
      ...snapshot,
      timestamp: Date.now(),
    };

    setState(prevState => ({
      ...prevState,
      dataHistory: [...prevState.dataHistory, newSnapshot],
    }));
  }, []);

  // Get the last operation of a specific type
  const getLastOperation = useCallback((operation: DataSnapshot['operation']) => {
    const filtered = state.dataHistory.filter(snap => snap.operation === operation);
    return filtered.length > 0 ? filtered[filtered.length - 1] : undefined;
  }, [state.dataHistory]);

  // Reset history
  const resetHistory = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      dataHistory: [],
    }));
  }, []);

  // Track user activity
  const trackUserActivity = useCallback((activity: string) => {
    setState(prevState => ({
      ...prevState,
      userActivity: [...prevState.userActivity, `${new Date().toISOString()} - ${activity}`],
    }));
  }, []);

  // Value provided by the context
  const value: DataFlowContextType = {
    state,
    updateState,
    clearState,
    addDataSnapshot,
    getLastOperation,
    resetHistory,
    trackUserActivity,
  };

  return (
    <DataFlowContext.Provider value={value}>
      {children}
    </DataFlowContext.Provider>
  );
};

// Hook to use the context
export const useDataFlow = (): DataFlowContextType => {
  const context = useContext(DataFlowContext);
  if (!context) {
    throw new Error('useDataFlow must be used within a DataFlowProvider');
  }
  return context;
};

// Optional component to visualize the data flow (for debugging)
export const DataFlowVisualizer: React.FC<{
  show?: boolean;
  showHistory?: boolean;
  showActivity?: boolean;
}> = ({ show = true, showHistory = true, showActivity = true }) => {
  const { state } = useDataFlow();

  if (!show) return null;

  return (
    <div className="fixed bottom-0 right-0 bg-white border border-gray-300 rounded-tl-lg shadow-lg p-3 z-50 max-w-md max-h-80 overflow-auto text-xs">
      <h3 className="text-sm font-semibold mb-2">Data Flow State</h3>
      
      {showActivity && state.userActivity.length > 0 && (
        <div className="mb-2">
          <h4 className="font-medium text-xs mb-1">User Activity:</h4>
          <div className="border-l-2 border-blue-300 pl-2 max-h-20 overflow-y-auto">
            {state.userActivity.slice(-5).map((activity, i) => (
              <div key={i} className="text-xs text-gray-600">{activity}</div>
            ))}
          </div>
        </div>
      )}
      
      {showHistory && state.dataHistory.length > 0 && (
        <div className="mb-2">
          <h4 className="font-medium text-xs mb-1">Data History:</h4>
          <div className="border-l-2 border-green-300 pl-2 max-h-20 overflow-y-auto">
            {state.dataHistory.slice(-3).map((snapshot) => (
              <div key={snapshot.id} className="text-xs mb-1">
                <span className="text-green-600">{snapshot.operation}</span> from{' '}
                <span className="text-blue-600">{snapshot.source}</span> @{' '}
                <span className="text-gray-500">
                  {new Date(snapshot.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div>
        <h4 className="font-medium text-xs mb-1">Current State:</h4>
        <div className="border-l-2 border-purple-300 pl-2 max-h-60 overflow-y-auto">
          <pre className="text-xs whitespace-pre-wrap">
            {JSON.stringify({
              propertyId: state.propertyId,
              buildingType: state.buildingType,
              region: state.region,
              quality: state.quality,
              condition: state.condition,
              calculationId: state.calculationId,
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default DataFlowProvider;
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

interface DataSnapshot {
  id: string;
  timestamp: number;
  data: Record<string, any>;
  source: string;
  operation: 'create' | 'read' | 'update' | 'delete' | 'calculate' | 'import' | 'export';
}

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

interface DataFlowContextType {
  state: DataFlowState;
  updateState: (updates: Partial<DataFlowState>) => void;
  clearState: () => void;
  addDataSnapshot: (snapshot: Omit<DataSnapshot, 'timestamp'>) => void;
  getLastOperation: (operation: DataSnapshot['operation']) => DataSnapshot | undefined;
  resetHistory: () => void;
  trackUserActivity: (activity: string) => void;
}

const generateSessionId = () => {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

const initialState: DataFlowState = {
  sessionId: generateSessionId(),
  userActivity: [],
  dataHistory: []
};

const DataFlowContext = createContext<DataFlowContextType | undefined>(undefined);

export const DataFlowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<DataFlowState>(initialState);
  
  // Persist state to sessionStorage
  useEffect(() => {
    try {
      const savedState = sessionStorage.getItem('terraflow-state');
      if (savedState) {
        setState(JSON.parse(savedState));
      }
    } catch (error) {
      console.error('Failed to load DataFlow state from sessionStorage', error);
    }
    
    return () => {
      try {
        sessionStorage.setItem('terraflow-state', JSON.stringify(state));
      } catch (error) {
        console.error('Failed to save DataFlow state to sessionStorage', error);
      }
    };
  }, []);
  
  // Save state changes to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('terraflow-state', JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save DataFlow state to sessionStorage', error);
    }
  }, [state]);
  
  const updateState = (updates: Partial<DataFlowState>) => {
    setState(prevState => ({ ...prevState, ...updates }));
  };
  
  const clearState = () => {
    setState({
      ...initialState,
      sessionId: state.sessionId,
      userActivity: [...state.userActivity, 'Cleared application state'],
      dataHistory: [...state.dataHistory]
    });
  };
  
  const addDataSnapshot = (snapshot: Omit<DataSnapshot, 'timestamp'>) => {
    const newSnapshot: DataSnapshot = {
      ...snapshot,
      timestamp: Date.now()
    };
    
    setState(prevState => ({
      ...prevState,
      dataHistory: [...prevState.dataHistory, newSnapshot]
    }));
  };
  
  const getLastOperation = (operation: DataSnapshot['operation']) => {
    return state.dataHistory
      .filter(snapshot => snapshot.operation === operation)
      .sort((a, b) => b.timestamp - a.timestamp)[0];
  };
  
  const resetHistory = () => {
    setState(prevState => ({
      ...prevState,
      dataHistory: []
    }));
  };
  
  const trackUserActivity = (activity: string) => {
    setState(prevState => ({
      ...prevState,
      userActivity: [...prevState.userActivity, `${new Date().toISOString()}: ${activity}`]
    }));
  };
  
  const value = useMemo(() => ({
    state,
    updateState,
    clearState,
    addDataSnapshot,
    getLastOperation,
    resetHistory,
    trackUserActivity
  }), [state]);
  
  return (
    <DataFlowContext.Provider value={value}>
      {children}
    </DataFlowContext.Provider>
  );
};

export const useDataFlow = (): DataFlowContextType => {
  const context = useContext(DataFlowContext);
  
  if (context === undefined) {
    throw new Error('useDataFlow must be used within a DataFlowProvider');
  }
  
  return context;
};

// Data visualization component
export const DataFlowVisualizer: React.FC<{
  showHistory?: boolean;
  showCurrentState?: boolean;
  className?: string;
}> = ({ showHistory = true, showCurrentState = true, className }) => {
  const { state } = useDataFlow();
  
  if (!showHistory && !showCurrentState) return null;
  
  return (
    <div className={`text-xs border rounded-md overflow-hidden ${className}`}>
      <div className="bg-gray-100 px-3 py-2 font-medium border-b">
        TerraBuild Data Flow Tracker
      </div>
      
      {showCurrentState && (
        <div className="px-3 py-2 border-b">
          <h4 className="font-medium mb-1">Current State</h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {state.propertyId && (
              <>
                <div className="text-gray-500">Property ID:</div>
                <div>{state.propertyId}</div>
              </>
            )}
            {state.buildingType && (
              <>
                <div className="text-gray-500">Building Type:</div>
                <div>{state.buildingType}</div>
              </>
            )}
            {state.region && (
              <>
                <div className="text-gray-500">Region:</div>
                <div>{state.region}</div>
              </>
            )}
            {state.quality && (
              <>
                <div className="text-gray-500">Quality:</div>
                <div>{state.quality}</div>
              </>
            )}
            {state.condition && (
              <>
                <div className="text-gray-500">Condition:</div>
                <div>{state.condition}</div>
              </>
            )}
            {state.calculationId && (
              <>
                <div className="text-gray-500">Calculation ID:</div>
                <div>{state.calculationId}</div>
              </>
            )}
          </div>
        </div>
      )}
      
      {showHistory && state.dataHistory.length > 0 && (
        <div className="px-3 py-2">
          <h4 className="font-medium mb-1">Recent Operations</h4>
          <div className="space-y-1">
            {state.dataHistory.slice(-5).reverse().map((snapshot, index) => (
              <div key={`history-${index}`} className="flex gap-2">
                <span className="text-gray-500">
                  {new Date(snapshot.timestamp).toLocaleTimeString()}:
                </span>
                <span className="font-medium capitalize">{snapshot.operation}</span>
                <span>from {snapshot.source}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataFlowProvider;
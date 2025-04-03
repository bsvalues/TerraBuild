/**
 * UI Test Setup
 * 
 * This file configures the testing environment for UI component tests
 * using Jest, JSDOM, and testing-library.
 */

// Import testing libraries
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

// Configure testing-library
configure({
  testIdAttribute: 'data-testid', // Use data-testid for test selectors
  asyncUtilTimeout: 5000 // Allow 5 seconds for async operations to complete
});

// Setup global Jest
import { jest } from '@jest/globals';
global.jest = jest;

// Mock fetch and other browser APIs
global.fetch = jest.fn();

// Setup local storage mock
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
global.localStorage = localStorageMock;

// Mock CSS modules
jest.mock('*.module.css', () => ({}));

// Set up Tailwind CSS mock
jest.mock('tailwindcss/tailwind.css', () => ({}));

// Set up React Query Provider mock
jest.mock('@tanstack/react-query', () => ({
  QueryClient: jest.fn(() => ({
    prefetchQuery: jest.fn(),
    getQueryData: jest.fn(),
    setQueryData: jest.fn(),
    invalidateQueries: jest.fn(),
    resetQueries: jest.fn()
  })),
  QueryClientProvider: ({ children }) => children,
  useQuery: jest.fn(() => ({ data: [], isLoading: false, error: null })),
  useMutation: jest.fn(() => ({ 
    mutate: jest.fn(), 
    mutateAsync: jest.fn(),
    isLoading: false, 
    error: null,
    isSuccess: true
  }))
}));

// Path alias mocks for component imports
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className, disabled, type }) => 
    <button 
      onClick={onClick} 
      className={className} 
      disabled={disabled} 
      type={type || 'button'}
      data-testid="button"
    >
      {children}
    </button>
}));

jest.mock('@/components/ui/form', () => ({
  Form: ({ children, onSubmit }) => <form onSubmit={onSubmit} data-testid="form">{children}</form>,
  FormControl: ({ children }) => <div data-testid="form-control">{children}</div>,
  FormDescription: ({ children }) => <div data-testid="form-description">{children}</div>,
  FormField: ({ children }) => <div data-testid="form-field">{children}</div>,
  FormItem: ({ children }) => <div data-testid="form-item">{children}</div>,
  FormLabel: ({ children }) => <label data-testid="form-label">{children}</label>,
  FormMessage: ({ children }) => <div data-testid="form-message">{children}</div>,
  useFormField: jest.fn(() => ({ id: 'test-field' }))
}));

jest.mock('@/components/ui/input', () => ({
  Input: (props) => <input {...props} data-testid="input" />
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children }) => <div data-testid="select">{children}</div>,
  SelectContent: ({ children }) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ children, value }) => <div data-testid="select-item" data-value={value}>{children}</div>,
  SelectTrigger: ({ children }) => <div data-testid="select-trigger">{children}</div>,
  SelectValue: ({ children }) => <div data-testid="select-value">{children}</div>
}));

jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, defaultValue }) => <div data-testid="tabs" data-defaultvalue={defaultValue}>{children}</div>,
  TabsContent: ({ children, value }) => <div data-testid="tabs-content" data-value={value}>{children}</div>,
  TabsList: ({ children }) => <div data-testid="tabs-list">{children}</div>,
  TabsTrigger: ({ children, value }) => <div data-testid="tabs-trigger" data-value={value}>{children}</div>
}));

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open, onOpenChange }) => 
    <div data-testid="dialog" data-open={open} onClick={() => onOpenChange && onOpenChange(!open)}>{children}</div>,
  DialogContent: ({ children }) => <div data-testid="dialog-content">{children}</div>,
  DialogDescription: ({ children }) => <div data-testid="dialog-description">{children}</div>,
  DialogFooter: ({ children }) => <div data-testid="dialog-footer">{children}</div>,
  DialogHeader: ({ children }) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }) => <div data-testid="dialog-title">{children}</div>
}));

jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }) => <div data-testid="tooltip">{children}</div>,
  TooltipContent: ({ children }) => <div data-testid="tooltip-content">{children}</div>,
  TooltipProvider: ({ children }) => <div data-testid="tooltip-provider">{children}</div>,
  TooltipTrigger: ({ children }) => <div data-testid="tooltip-trigger">{children}</div>
}));

jest.mock('@/components/ui/separator', () => ({
  Separator: () => <hr data-testid="separator" />
}));

jest.mock('@/components/ui/slider', () => ({
  Slider: (props) => <div data-testid="slider" data-props={JSON.stringify(props)} />
}));

jest.mock('@/components/ui/table', () => ({
  Table: ({ children }) => <table data-testid="table">{children}</table>,
  TableBody: ({ children }) => <tbody data-testid="table-body">{children}</tbody>,
  TableCaption: ({ children }) => <caption data-testid="table-caption">{children}</caption>,
  TableCell: ({ children }) => <td data-testid="table-cell">{children}</td>,
  TableHead: ({ children }) => <thead data-testid="table-head">{children}</thead>,
  TableHeader: ({ children }) => <th data-testid="table-header">{children}</th>,
  TableRow: ({ children }) => <tr data-testid="table-row">{children}</tr>
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(() => ({
    toast: jest.fn()
  }))
}));

jest.mock('@/hooks/use-building-costs', () => ({
  useBuildingCosts: jest.fn(() => ({
    buildingCosts: [],
    isLoadingCosts: false,
    costsError: null,
    getBuildingCost: jest.fn(),
    createBuildingCost: { mutateAsync: jest.fn() },
    updateBuildingCost: { mutateAsync: jest.fn() },
    deleteBuildingCost: { mutateAsync: jest.fn() },
    calculateCost: { mutateAsync: jest.fn() },
    calculateBuildingCost: jest.fn(),
    calculateMaterialsBreakdown: { mutateAsync: jest.fn() },
    getBuildingCostMaterials: jest.fn(() => ({ data: [] }))
  }))
}));

// Setup console mocks to suppress unwanted logs
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = jest.fn((...args) => {
    // Filter out known React errors for tests
    if (
      args[0] && typeof args[0] === 'string' && (
        args[0].includes('Warning: ReactDOM.render is no longer supported') ||
        args[0].includes('Warning: Using UNSAFE_') ||
        args[0].includes('Warning: validateDOMNesting')
      )
    ) {
      return;
    }
    originalConsoleError(...args);
  });
  
  console.warn = jest.fn((...args) => {
    // Filter out known warnings for tests
    if (
      args[0] && typeof args[0] === 'string' && (
        args[0].includes('Warning: React does not recognize the') ||
        args[0].includes('Warning: Unknown prop')
      )
    ) {
      return;
    }
    originalConsoleWarn(...args);
  });
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});
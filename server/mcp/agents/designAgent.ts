/**
 * Design Agent for Model Content Protocol
 * 
 * This agent is responsible for UI/UX design suggestions, component styling,
 * theme recommendations, and accessibility improvements.
 */

import { CustomAgentBase, AgentEvent } from './customAgentBase';
import { agentEventBus } from './eventBus';
import { v4 as uuidv4 } from 'uuid';

interface DesignRequest {
  type: 'component' | 'page' | 'theme' | 'icon' | 'layout';
  name: string;
  description: string;
  requirements: string[];
  existingStyles?: boolean;
}

interface AccessibilityRequest {
  componentPath: string;
  currentAccessibilityScore?: number;
}

/**
 * Design Agent
 * Assists in UI/UX design, component styling, and accessibility
 */
export class DesignAgent extends CustomAgentBase {
  private designSuggestions: Map<string, any> = new Map();
  private accessibilityReports: Map<string, any> = new Map();
  private pendingRequests: Map<string, any> = new Map();
  private designLibrary: any = {};
  
  constructor() {
    super('Design Agent', 'design-agent');
    this.capabilities = [
      'component-styling',
      'theme-recommendations',
      'accessibility-improvements',
      'responsive-design',
      'icon-suggestions'
    ];
  }
  
  /**
   * Initialize the agent
   */
  public async initialize(): Promise<boolean> {
    await super.initialize();
    
    // Subscribe to design-related events
    this.registerEventHandler('design:request', this.handleDesignRequest.bind(this));
    this.registerEventHandler('accessibility:request', this.handleAccessibilityRequest.bind(this));
    
    // Initialize design library
    this.initializeDesignLibrary();
    
    console.log(`Agent ${this.name} (${this.agentId}) initialized`);
    return true;
  }
  
  /**
   * Shutdown the agent
   */
  public async shutdown(): Promise<boolean> {
    await super.shutdown();
    
    // Clean up resources
    this.designSuggestions.clear();
    this.accessibilityReports.clear();
    this.pendingRequests.clear();
    
    return true;
  }
  
  /**
   * Initialize design library with common components and styles
   */
  private initializeDesignLibrary(): void {
    this.designLibrary = {
      components: {
        buttons: [
          {
            name: 'Primary Button',
            className: 'bg-primary hover:bg-primary/90 text-white font-medium py-2 px-4 rounded',
            usage: 'Main call-to-action'
          },
          {
            name: 'Secondary Button',
            className: 'bg-secondary hover:bg-secondary/90 text-white font-medium py-2 px-4 rounded',
            usage: 'Secondary actions'
          },
          {
            name: 'Outline Button',
            className: 'border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded',
            usage: 'Less important actions'
          }
        ],
        cards: [
          {
            name: 'Basic Card',
            className: 'bg-white rounded-lg shadow p-4',
            usage: 'Standard content container'
          },
          {
            name: 'Feature Card',
            className: 'bg-white rounded-lg shadow-md p-6 border border-gray-100',
            usage: 'Highlighting features or benefits'
          }
        ],
        forms: [
          {
            name: 'Form Input',
            className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50',
            usage: 'Text input fields'
          },
          {
            name: 'Form Label',
            className: 'block text-sm font-medium text-gray-700 mb-1',
            usage: 'Labels for form inputs'
          }
        ]
      },
      colorPalettes: [
        {
          name: 'Primary Blues',
          colors: [
            { name: 'primary', value: '#0066cc', usage: 'Primary actions and focus' },
            { name: 'primary-light', value: '#3399ff', usage: 'Hover states, highlights' },
            { name: 'primary-dark', value: '#004080', usage: 'Active states, text on light backgrounds' }
          ]
        },
        {
          name: 'Accent Greens',
          colors: [
            { name: 'accent', value: '#2C9F5E', usage: 'Success states, positive indicators' },
            { name: 'accent-light', value: '#4BC986', usage: 'Backgrounds, subtle highlights' },
            { name: 'accent-dark', value: '#1A6D3C', usage: 'Active states, text on light backgrounds' }
          ]
        }
      ],
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '3rem',
        '3xl': '4rem'
      },
      typography: {
        fontFamilies: [
          { name: 'sans', value: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' },
          { name: 'serif', value: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' },
          { name: 'mono', value: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }
        ],
        fontSizes: [
          { name: 'xs', value: '0.75rem', lineHeight: '1rem' },
          { name: 'sm', value: '0.875rem', lineHeight: '1.25rem' },
          { name: 'base', value: '1rem', lineHeight: '1.5rem' },
          { name: 'lg', value: '1.125rem', lineHeight: '1.75rem' },
          { name: 'xl', value: '1.25rem', lineHeight: '1.75rem' },
          { name: '2xl', value: '1.5rem', lineHeight: '2rem' },
          { name: '3xl', value: '1.875rem', lineHeight: '2.25rem' },
          { name: '4xl', value: '2.25rem', lineHeight: '2.5rem' },
          { name: '5xl', value: '3rem', lineHeight: '1' }
        ]
      }
    };
  }
  
  /**
   * Handle design requests
   */
  private async handleDesignRequest(event: AgentEvent): Promise<void> {
    const request = event.data as DesignRequest;
    const requestId = uuidv4();
    
    console.log(`Handling design request: ${request.type} - ${request.name}`);
    
    // Store the request
    this.pendingRequests.set(requestId, {
      request,
      status: 'processing',
      startedAt: new Date().toISOString()
    });
    
    try {
      // Generate design suggestions based on the request type
      let designSuggestion: any;
      
      switch (request.type) {
        case 'component':
          designSuggestion = this.generateComponentDesign(request);
          break;
          
        case 'page':
          designSuggestion = this.generatePageDesign(request);
          break;
          
        case 'theme':
          designSuggestion = this.generateThemeDesign(request);
          break;
          
        case 'icon':
          designSuggestion = this.generateIconSuggestions(request);
          break;
          
        case 'layout':
          designSuggestion = this.generateLayoutDesign(request);
          break;
      }
      
      // Store the design suggestion
      this.designSuggestions.set(requestId, designSuggestion);
      
      // Update the request status
      this.pendingRequests.set(requestId, {
        ...this.pendingRequests.get(requestId),
        status: 'completed',
        completedAt: new Date().toISOString()
      });
      
      // Emit an event with the design suggestion
      await this.emitEvent('design:suggestion', {
        requestId,
        type: request.type,
        name: request.name,
        suggestion: designSuggestion,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error(`Error generating design suggestion: ${error}`);
      
      // Update the request status
      this.pendingRequests.set(requestId, {
        ...this.pendingRequests.get(requestId),
        status: 'failed',
        error: error.message,
        completedAt: new Date().toISOString()
      });
      
      // Emit an error event
      await this.emitEvent('design:error', {
        requestId,
        type: request.type,
        name: request.name,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  /**
   * Handle accessibility requests
   */
  private async handleAccessibilityRequest(event: AgentEvent): Promise<void> {
    const request = event.data as AccessibilityRequest;
    const requestId = uuidv4();
    
    console.log(`Handling accessibility request for ${request.componentPath}`);
    
    // Store the request
    this.pendingRequests.set(requestId, {
      request,
      status: 'processing',
      startedAt: new Date().toISOString()
    });
    
    try {
      // Generate accessibility report (simulated)
      const accessibilityReport = {
        componentPath: request.componentPath,
        overallScore: request.currentAccessibilityScore ? request.currentAccessibilityScore + 0.1 : 0.8,
        issues: [
          {
            type: 'contrast',
            severity: 'medium',
            description: 'Button text has insufficient contrast with background',
            suggestion: 'Increase contrast ratio to at least 4.5:1',
            code: 'color: #777777; background-color: #eeeeee;',
            fixSuggestion: 'color: #555555; background-color: #ffffff;'
          },
          {
            type: 'aria',
            severity: 'high',
            description: 'Input field missing aria-label',
            suggestion: 'Add aria-label attribute to improve screen reader experience',
            code: '<input type="text" />',
            fixSuggestion: '<input type="text" aria-label="Search" />'
          }
        ],
        recommendations: [
          'Add focus styles to interactive elements',
          'Ensure all images have alt text',
          'Use semantic HTML elements (e.g., <button> instead of <div> for clickable elements)'
        ]
      };
      
      // Store the accessibility report
      this.accessibilityReports.set(requestId, accessibilityReport);
      
      // Update the request status
      this.pendingRequests.set(requestId, {
        ...this.pendingRequests.get(requestId),
        status: 'completed',
        completedAt: new Date().toISOString()
      });
      
      // Emit an event with the accessibility report
      await this.emitEvent('accessibility:report', {
        requestId,
        componentPath: request.componentPath,
        report: accessibilityReport,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error(`Error generating accessibility report: ${error}`);
      
      // Update the request status
      this.pendingRequests.set(requestId, {
        ...this.pendingRequests.get(requestId),
        status: 'failed',
        error: error.message,
        completedAt: new Date().toISOString()
      });
      
      // Emit an error event
      await this.emitEvent('accessibility:error', {
        requestId,
        componentPath: request.componentPath,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  /**
   * Generate component design suggestions
   */
  private generateComponentDesign(request: DesignRequest): any {
    const { name, description, requirements } = request;
    
    // In a real implementation, this would analyze requirements and generate tailored suggestions
    // For now, we'll generate a placeholder suggestion
    return {
      componentName: name,
      description,
      styling: {
        container: 'bg-white rounded-lg shadow-md p-6 border border-gray-100',
        header: 'text-xl font-semibold text-gray-800 mb-4',
        content: 'text-gray-600',
        footer: 'mt-4 pt-4 border-t border-gray-100 flex justify-between items-center'
      },
      responsiveDesign: {
        mobile: {
          container: 'p-4',
          header: 'text-lg',
          stackedLayout: true
        },
        tablet: {
          container: 'p-5',
          stackedLayout: false
        },
        desktop: {
          container: 'p-6',
          maxWidth: '1200px',
          marginX: 'auto'
        }
      },
      accessibilityConsiderations: [
        'Ensure contrast ratio of at least 4.5:1 for text',
        'Add appropriate ARIA roles and labels',
        'Implement keyboard navigation support'
      ],
      tailwindClasses: 'bg-white rounded-lg shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow duration-300',
      preview: `<div class="bg-white rounded-lg shadow-md p-6 border border-gray-100">
  <h3 class="text-xl font-semibold text-gray-800 mb-4">${name}</h3>
  <div class="text-gray-600">
    <p>${description}</p>
  </div>
  <div class="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
    <button class="text-sm text-primary hover:text-primary-dark">Learn More</button>
    <button class="bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded">Action</button>
  </div>
</div>`
    };
  }
  
  /**
   * Generate page design suggestions
   */
  private generatePageDesign(request: DesignRequest): any {
    const { name, description } = request;
    
    return {
      pageName: name,
      description,
      layout: {
        type: 'two-column',
        sidebar: {
          width: '280px',
          position: 'left',
          collapsible: true,
          hideOnMobile: true
        },
        header: {
          height: '64px',
          sticky: true,
          includeSearch: true
        },
        content: {
          maxWidth: '1200px',
          padding: '1.5rem'
        },
        footer: {
          height: 'auto',
          includeLinks: true,
          includeCopyright: true
        }
      },
      components: [
        {
          type: 'header',
          styling: 'bg-white border-b border-gray-200 px-4 py-2 flex justify-between items-center'
        },
        {
          type: 'sidebar',
          styling: 'bg-gray-50 border-r border-gray-200 h-full'
        },
        {
          type: 'content',
          styling: 'bg-white p-6'
        },
        {
          type: 'footer',
          styling: 'bg-gray-50 border-t border-gray-200 px-4 py-4 text-sm text-gray-600'
        }
      ],
      responsiveDesign: {
        mobile: {
          layout: 'stacked',
          sidebar: 'hidden',
          header: 'simplified'
        },
        tablet: {
          layout: 'overlay',
          sidebar: 'collapsible'
        },
        desktop: {
          layout: 'two-column'
        }
      },
      colorScheme: {
        background: '#F9FAFB',
        text: '#111827',
        primary: '#0066cc',
        secondary: '#E5E7EB',
        accent: '#2C9F5E',
        neutral: '#9CA3AF'
      },
      typography: {
        headings: 'font-sans font-semibold',
        body: 'font-sans text-gray-700',
        code: 'font-mono text-sm bg-gray-100 p-1 rounded'
      }
    };
  }
  
  /**
   * Generate theme design suggestions
   */
  private generateThemeDesign(request: DesignRequest): any {
    return {
      themeName: request.name,
      description: request.description,
      colorPalette: {
        primary: {
          base: '#0066cc',
          50: '#F0F7FF',
          100: '#E0EFFF',
          200: '#B8DAFF',
          300: '#8FC3FF',
          400: '#57A5FF',
          500: '#0066cc',
          600: '#0057B3',
          700: '#004999',
          800: '#003C80',
          900: '#002A66'
        },
        secondary: {
          base: '#2C9F5E',
          50: '#F0FBF5',
          100: '#D9F2E2',
          200: '#B3E6C5',
          300: '#8DD9A8',
          400: '#54C97F',
          500: '#2C9F5E',
          600: '#238A4E',
          700: '#1B743E',
          800: '#135F2F',
          900: '#0B4A1F'
        },
        neutral: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827'
        },
        success: '#2C9F5E',
        error: '#DC2626',
        warning: '#FBBF24',
        info: '#0EA5E9'
      },
      typography: {
        fontFamily: {
          sans: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          serif: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
          mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
        },
        fontSizes: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
          '2xl': '1.5rem',
          '3xl': '1.875rem',
          '4xl': '2.25rem',
          '5xl': '3rem'
        },
        fontWeights: {
          light: 300,
          normal: 400,
          medium: 500,
          semibold: 600,
          bold: 700
        }
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '3rem',
        '3xl': '4rem'
      },
      borderRadius: {
        none: '0px',
        sm: '0.125rem',
        md: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        full: '9999px'
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      },
      tailwindConfig: {
        theme: {
          extend: {
            colors: {
              primary: {
                DEFAULT: '#0066cc',
                50: '#F0F7FF',
                100: '#E0EFFF',
                // ... other shades
              },
              secondary: {
                DEFAULT: '#2C9F5E',
                // ... other shades
              }
            },
            borderRadius: {
              '4xl': '2rem',
              '5xl': '2.5rem'
            }
          }
        }
      },
      themeJson: {
        primary: '#0066cc',
        variant: 'professional',
        appearance: 'system',
        radius: 0.5
      }
    };
  }
  
  /**
   * Generate icon suggestions
   */
  private generateIconSuggestions(request: DesignRequest): any {
    return {
      iconName: request.name,
      description: request.description,
      suggestions: [
        {
          name: 'Lucide Icons',
          url: 'https://lucide.dev/',
          recommended: true,
          icons: [
            {
              name: `${request.name.toLowerCase()}`,
              usage: 'Primary usage',
              importCode: `import { ${request.name.charAt(0).toUpperCase() + request.name.slice(1)} } from 'lucide-react';`
            },
            {
              name: `${request.name.toLowerCase()}Circle`,
              usage: 'Alternative with rounded background',
              importCode: `import { ${request.name.charAt(0).toUpperCase() + request.name.slice(1)}Circle } from 'lucide-react';`
            }
          ]
        },
        {
          name: 'React Icons',
          url: 'https://react-icons.github.io/react-icons/',
          icons: [
            {
              name: `FaRegular${request.name.charAt(0).toUpperCase() + request.name.slice(1)}`,
              usage: 'Regular style',
              importCode: `import { FaRegular${request.name.charAt(0).toUpperCase() + request.name.slice(1)} } from 'react-icons/fa';`
            },
            {
              name: `FaSolid${request.name.charAt(0).toUpperCase() + request.name.slice(1)}`,
              usage: 'Solid style',
              importCode: `import { FaSolid${request.name.charAt(0).toUpperCase() + request.name.slice(1)} } from 'react-icons/fa';`
            }
          ]
        }
      ],
      customIcon: {
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${request.name.toLowerCase()}-icon"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>`,
        usage: 'Create a custom SVG icon and use it directly in your component',
        implementation: `
// React component
function ${request.name}Icon({ size = 24, color = 'currentColor', className = '' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={\`${request.name.toLowerCase()}-icon \${className}\`}
    >
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="16"></line>
      <line x1="8" y1="12" x2="16" y2="12"></line>
    </svg>
  );
}`
      },
      bestPractices: [
        'Keep icons consistent in style throughout the application',
        'Use semantic icon names that describe their purpose',
        'Ensure icons have appropriate ARIA labels for accessibility',
        'Consider using an icon library to reduce bundle size',
        'Apply consistent sizing and colors'
      ]
    };
  }
  
  /**
   * Generate layout design suggestions
   */
  private generateLayoutDesign(request: DesignRequest): any {
    return {
      layoutName: request.name,
      description: request.description,
      layoutType: 'responsive-grid',
      gridConfiguration: {
        columns: {
          mobile: 1,
          tablet: 2,
          desktop: 4,
          widescreen: 6
        },
        gap: {
          mobile: '1rem',
          tablet: '1.5rem',
          desktop: '2rem'
        },
        maxWidth: '1200px',
        marginX: 'auto'
      },
      areas: [
        {
          name: 'header',
          gridArea: '1 / 1 / 2 / -1',
          height: '64px',
          styling: 'bg-white border-b border-gray-200 px-4 flex items-center justify-between sticky top-0 z-10'
        },
        {
          name: 'sidebar',
          gridArea: '2 / 1 / -1 / 2',
          width: '280px',
          styling: 'bg-gray-50 border-r border-gray-200 h-full overflow-y-auto',
          responsiveAdjustments: {
            mobile: 'hidden',
            tablet: 'block fixed inset-y-0 left-0 z-20 transform transition-transform duration-300 ease-in-out'
          }
        },
        {
          name: 'mainContent',
          gridArea: '2 / 2 / -1 / -1',
          styling: 'p-6 bg-white min-h-[calc(100vh-64px)]',
          responsiveAdjustments: {
            mobile: 'col-span-full',
            tablet: 'col-span-full',
            desktop: 'col-span-3',
            widescreen: 'col-span-5'
          }
        },
        {
          name: 'footer',
          gridArea: '-2 / 1 / -1 / -1',
          height: 'auto',
          styling: 'bg-gray-50 border-t border-gray-200 px-4 py-6 text-sm text-gray-600'
        }
      ],
      tailwindImplementation: `
<div className="min-h-screen grid grid-cols-1 md:grid-cols-[280px_1fr] grid-rows-[64px_1fr_auto]">
  {/* Header */}
  <header className="col-span-full bg-white border-b border-gray-200 px-4 flex items-center justify-between sticky top-0 z-10">
    <div>Logo</div>
    <nav>Navigation</nav>
  </header>

  {/* Sidebar - hidden on mobile */}
  <aside className="hidden md:block bg-gray-50 border-r border-gray-200 overflow-y-auto">
    <nav className="p-4">
      <ul className="space-y-2">
        <li><a href="#" className="block p-2 hover:bg-gray-100 rounded">Dashboard</a></li>
        <li><a href="#" className="block p-2 hover:bg-gray-100 rounded">Properties</a></li>
        <li><a href="#" className="block p-2 hover:bg-gray-100 rounded">Analytics</a></li>
      </ul>
    </nav>
  </aside>

  {/* Main Content */}
  <main className="col-span-full md:col-span-1 p-6 bg-white min-h-[calc(100vh-64px)]">
    <h1 className="text-2xl font-bold mb-6">Content Title</h1>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {/* Content cards go here */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          Card {i + 1}
        </div>
      ))}
    </div>
  </main>

  {/* Footer */}
  <footer className="col-span-full bg-gray-50 border-t border-gray-200 px-4 py-6 text-sm text-gray-600">
    <div className="max-w-7xl mx-auto">
      &copy; 2025 Benton County Assessment System
    </div>
  </footer>
</div>
`,
      accessibilityConsiderations: [
        'Ensure logical tab order for keyboard navigation',
        'Use semantic HTML elements for proper structure',
        'Add skip links for keyboard users to bypass repeated content',
        'Ensure sufficient color contrast for all text',
        'Test with screen readers to verify accessibility'
      ],
      mobileConsiderations: [
        'Implement a hamburger menu for navigation on small screens',
        'Use a responsive grid that adapts to screen size',
        'Ensure touch targets are at least 44px × 44px for better usability',
        'Test on various screen sizes and orientations'
      ]
    };
  }
  
  /**
   * Get pending design requests
   */
  public getPendingRequests(): any[] {
    return Array.from(this.pendingRequests.values());
  }
  
  /**
   * Get design suggestions
   */
  public getDesignSuggestions(): any[] {
    return Array.from(this.designSuggestions.values());
  }
  
  /**
   * Get accessibility reports
   */
  public getAccessibilityReports(): any[] {
    return Array.from(this.accessibilityReports.values());
  }
  
  /**
   * Get design library
   */
  public getDesignLibrary(): any {
    return this.designLibrary;
  }
}

// Export singleton instance
export const designAgent = new DesignAgent();
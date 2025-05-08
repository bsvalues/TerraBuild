import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Download, Info, Clipboard } from 'lucide-react';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { calculateCOD, calculateMedian, formatStatistic } from '../../utils/statistics';

interface StatisticDefinition {
  name: string;
  description: string;
  formula?: string;
  value?: number | string;
  format?: 'currency' | 'percentage' | 'ratio' | 'count' | 'factor';
  standard?: string;
}

interface MethodologyPanelProps {
  /**
   * Title of the methodology panel
   */
  title: string;
  
  /**
   * Description of the methodology
   */
  description: string;
  
  /**
   * Data source information
   */
  dataSource: string;
  
  /**
   * Reference date for the data
   */
  referenceDate?: string;
  
  /**
   * Method description for the calculation
   */
  methodDescription: string;
  
  /**
   * Statistics to display
   */
  statistics: StatisticDefinition[];
  
  /**
   * References to standards or methodologies
   */
  references?: { title: string; url?: string }[];
  
  /**
   * USPAP compliance statement
   */
  uspap?: boolean;
  
  /**
   * IAAO compliance statement
   */
  iaao?: boolean;
  
  /**
   * Optional CSS class name
   */
  className?: string;
}

/**
 * Methodology Panel Component
 * 
 * Displays transparent documentation of valuation methodologies
 * following USPAP standards for transparency and reproducibility.
 */
const MethodologyPanel: React.FC<MethodologyPanelProps> = ({
  title,
  description,
  dataSource,
  referenceDate,
  methodDescription,
  statistics,
  references = [],
  uspap = true,
  iaao = true,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const copyToClipboard = () => {
    const content = `
Methodology: ${title}
Description: ${description}
Data Source: ${dataSource}
${referenceDate ? `Reference Date: ${referenceDate}` : ''}
Method: ${methodDescription}

Statistics:
${statistics.map(stat => `- ${stat.name}: ${stat.value ? (stat.format ? formatStatistic(stat.value as number, stat.format) : stat.value) : 'N/A'} 
  ${stat.description}`).join('\n')}

References:
${references.map(ref => `- ${ref.title} ${ref.url ? ref.url : ''}`).join('\n')}

${uspap ? 'Complies with USPAP standards for transparency and reproducibility.' : ''}
${iaao ? 'Follows IAAO guidelines for mass appraisal statistical reporting.' : ''}
    `.trim();
    
    navigator.clipboard.writeText(content)
      .then(() => {
        // Success handler would go here
        console.log('Methodology copied to clipboard');
      })
      .catch(err => {
        console.error('Failed to copy methodology:', err);
      });
  };

  const downloadAsText = () => {
    const content = `
Methodology: ${title}
Description: ${description}
Data Source: ${dataSource}
${referenceDate ? `Reference Date: ${referenceDate}` : ''}
Method: ${methodDescription}

Statistics:
${statistics.map(stat => `- ${stat.name}: ${stat.value ? (stat.format ? formatStatistic(stat.value as number, stat.format) : stat.value) : 'N/A'} 
  ${stat.description}
  ${stat.formula ? `Formula: ${stat.formula}` : ''}
  ${stat.standard ? `Standard: ${stat.standard}` : ''}`).join('\n\n')}

References:
${references.map(ref => `- ${ref.title} ${ref.url ? ref.url : ''}`).join('\n')}

${uspap ? 'Complies with USPAP standards for transparency and reproducibility.' : ''}
${iaao ? 'Follows IAAO guidelines for mass appraisal statistical reporting.' : ''}
    `.trim();
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_').toLowerCase()}_methodology.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`rounded-md border p-1 ${className}`}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex w-full justify-between p-2 text-sm font-medium"
          >
            <div className="flex items-center">
              <Info className="h-4 w-4 mr-2 text-blue-500" />
              Methodology & Statistics
            </div>
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="px-4 pt-2 pb-4">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium">{title}</h3>
              <p className="text-xs text-gray-500 mt-1">{description}</p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-start">
                <span className="text-xs font-medium min-w-24">Data Source:</span>
                <span className="text-xs text-gray-600">{dataSource}</span>
              </div>
              
              {referenceDate && (
                <div className="flex items-start">
                  <span className="text-xs font-medium min-w-24">Reference Date:</span>
                  <span className="text-xs text-gray-600">{referenceDate}</span>
                </div>
              )}
              
              <div className="flex items-start">
                <span className="text-xs font-medium min-w-24">Method:</span>
                <span className="text-xs text-gray-600">{methodDescription}</span>
              </div>
            </div>
            
            <div>
              <h4 className="text-xs font-medium mb-2">Statistics</h4>
              <div className="space-y-2">
                {statistics.map((stat, index) => (
                  <div key={index} className="border-b border-gray-100 pb-2">
                    <div className="flex justify-between">
                      <span className="text-xs font-medium">{stat.name}</span>
                      <span className="text-xs">
                        {stat.value !== undefined
                          ? (stat.format 
                              ? formatStatistic(stat.value as number, stat.format) 
                              : stat.value)
                          : 'N/A'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{stat.description}</p>
                    {stat.formula && (
                      <p className="text-xs text-gray-500 mt-0.5 font-mono bg-gray-50 p-1 rounded">
                        {stat.formula}
                      </p>
                    )}
                    {stat.standard && (
                      <p className="text-xs text-gray-500 mt-0.5 italic">
                        Standard: {stat.standard}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {references.length > 0 && (
              <div>
                <h4 className="text-xs font-medium mb-1">References</h4>
                <ul className="text-xs text-gray-600 list-disc pl-5 space-y-1">
                  {references.map((ref, index) => (
                    <li key={index}>
                      {ref.url ? (
                        <a 
                          href={ref.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-600 hover:underline"
                        >
                          {ref.title}
                        </a>
                      ) : (
                        ref.title
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="pt-2 border-t border-gray-100">
              {uspap && (
                <p className="text-xs text-gray-500">
                  Complies with USPAP standards for transparency and reproducibility.
                </p>
              )}
              {iaao && (
                <p className="text-xs text-gray-500">
                  Follows IAAO guidelines for mass appraisal statistical reporting.
                </p>
              )}
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 text-xs"
                onClick={copyToClipboard}
              >
                <Clipboard className="h-3 w-3 mr-1" />
                Copy
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 text-xs"
                onClick={downloadAsText}
              >
                <Download className="h-3 w-3 mr-1" />
                Download
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default MethodologyPanel;
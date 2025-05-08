import React from 'react';
import { InfoIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { checkSampleSizeValidity } from '../../utils/statistics';

interface SampleSizeIndicatorProps {
  sampleSize: number;
  populationSize?: number;
  confidenceLevel?: number;
  className?: string;
}

/**
 * Sample Size Indicator Component
 * 
 * Displays a visual indicator of statistical validity based on sample size
 * following IAAO standards for appraisal data analysis.
 */
const SampleSizeIndicator: React.FC<SampleSizeIndicatorProps> = ({
  sampleSize,
  populationSize,
  confidenceLevel = 0.95,
  className = ''
}) => {
  const { isValid, recommendedSize, status } = checkSampleSizeValidity(
    sampleSize,
    populationSize,
    confidenceLevel
  );

  // Determine color based on validity status
  const statusColors = {
    high: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-amber-100 text-amber-800 border-amber-200',
    low: 'bg-red-100 text-red-800 border-red-200'
  };

  const statusIcons = {
    high: '✓',
    medium: '⚠',
    low: '!'
  };

  const statusMessages = {
    high: 'High statistical confidence',
    medium: 'Moderate statistical confidence',
    low: 'Low statistical confidence'
  };

  const badgeClasses = `inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full border ${statusColors[status]} ${className}`;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={badgeClasses}>
            <span className="mr-1">{statusIcons[status]}</span>
            n={sampleSize}
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2 p-1">
            <p className="font-medium">{statusMessages[status]}</p>
            <p className="text-xs text-gray-500">
              Sample size: {sampleSize} {populationSize ? `of ${populationSize.toLocaleString()}` : ''}
              <br />
              {!isValid && recommendedSize && `Recommended sample: ${recommendedSize}`}
              <br />
              Confidence level: {confidenceLevel * 100}%
            </p>
            {status === 'low' && (
              <p className="text-xs text-red-500 flex items-center mt-1">
                <InfoIcon className="h-3 w-3 mr-1" />
                Interpret results with caution
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default SampleSizeIndicator;
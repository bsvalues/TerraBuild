import React, { useState } from "react";
import { anonymizeBuildingData, anonymizeCalculationData, AnonymizationOptions } from "@/utils/anonymizeData";
import { Button } from "@/components/ui/button";
import { Check, Eye, EyeOff, ShieldAlert, X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface DataAnonymizerProps {
  /**
   * The data to anonymize (can be a single record or an array of records)
   */
  data?: Record<string, any> | Record<string, any>[];
  
  /**
   * Type of data being anonymized
   */
  dataType?: 'building' | 'calculation';
  
  /**
   * Default anonymization options
   */
  defaultOptions?: AnonymizationOptions;
  
  /**
   * Called when data is anonymized with the anonymized data
   */
  onAnonymize?: (anonymizedData: any) => void;
  
  /**
   * Called when anonymization is canceled
   */
  onCancel?: () => void;
  
  /**
   * Show extra effects on button (ripple, etc.)
   */
  showEffects?: boolean;
  
  /**
   * Button variant
   */
  variant?: 'default' | 'secondary' | 'outline' | 'ghost';
  
  /**
   * Whether data is currently anonymized
   */
  isAnonymized?: boolean;
}

export default function DataAnonymizer({
  data,
  dataType = 'building',
  defaultOptions,
  onAnonymize,
  onCancel,
  showEffects = true,
  variant = 'outline',
  isAnonymized = false
}: DataAnonymizerProps) {
  const [options, setOptions] = useState<AnonymizationOptions>(defaultOptions || {
    anonymizeIdentifiers: true,
    anonymizeLocations: true,
    anonymizeFinancials: false,
    financialVariance: 0.1,
    preserveStatistics: true
  });
  
  const [popoverOpen, setPopoverOpen] = useState(false);
  const { toast } = useToast();
  
  // Handle anonymization
  const handleAnonymize = () => {
    if (!data) {
      toast({
        title: "No data to anonymize",
        description: "Please provide data to anonymize.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      let anonymizedData;
      
      if (Array.isArray(data)) {
        // Handle array of records
        anonymizedData = data.map(record => 
          dataType === 'calculation' 
            ? anonymizeCalculationData(record, options)
            : anonymizeBuildingData(record, options)
        );
      } else {
        // Handle single record
        anonymizedData = dataType === 'calculation'
          ? anonymizeCalculationData(data, options)
          : anonymizeBuildingData(data, options);
      }
      
      // Close popover
      setPopoverOpen(false);
      
      // Notify success
      toast({
        title: "Data Anonymized",
        description: "Your data has been successfully anonymized.",
        variant: "default"
      });
      
      // Call the callback with anonymized data
      if (onAnonymize) {
        onAnonymize(anonymizedData);
      }
    } catch (error) {
      console.error("Error anonymizing data:", error);
      toast({
        title: "Anonymization Error",
        description: "An error occurred while anonymizing data.",
        variant: "destructive"
      });
    }
  };
  
  // Handle cancel
  const handleCancel = () => {
    setPopoverOpen(false);
    if (onCancel) {
      onCancel();
    }
  };
  
  // Toggle an option
  const toggleOption = (key: keyof AnonymizationOptions) => {
    setOptions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  // Update financial variance
  const updateFinancialVariance = (value: number[]) => {
    setOptions(prev => ({
      ...prev,
      financialVariance: value[0] / 100
    }));
  };
  
  const buttonIconClass = "h-4 w-4 mr-1";
  
  return (
    <div className="relative inline-block" style={{ 
      transformStyle: 'preserve-3d',
      perspective: '1000px' 
    }}>
      {isAnonymized && (
        <Badge 
          variant="outline" 
          className="absolute -top-2 -right-2 px-1.5 py-0.5 text-[0.6rem] z-10 bg-blue-50 text-blue-700 border-blue-200"
          style={{ 
            transformStyle: 'preserve-3d',
            transform: 'translateZ(5px)' 
          }}
        >
          <ShieldAlert className="h-2.5 w-2.5 mr-0.5" />
          <span>Anonymized</span>
        </Badge>
      )}
      
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button 
                  variant={variant} 
                  size="sm" 
                  className={`relative overflow-hidden ${isAnonymized ? 'bg-blue-50 border-blue-200 text-blue-700' : ''}`}
                  style={{ 
                    transformStyle: 'preserve-3d',
                    transform: 'translateZ(2px)',
                    boxShadow: '0 2px 6px -2px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  {isAnonymized ? (
                    <EyeOff className={buttonIconClass} />
                  ) : (
                    <Eye className={buttonIconClass} />
                  )}
                  <span>
                    {isAnonymized ? "Anonymized" : "Anonymize Data"}
                  </span>
                  
                  {/* Shimmer effect on hover */}
                  {showEffects && (
                    <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 opacity-0 group-hover:opacity-100 duration-1000 transform -translate-x-full hover:translate-x-full"></span>
                  )}
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>{isAnonymized ? "Data is anonymized" : "Anonymize data for privacy"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <PopoverContent 
          className="w-80 p-4"
          style={{ 
            transformStyle: 'preserve-3d',
            perspective: '1000px',
            transform: 'translateZ(1px)',
            boxShadow: '0 10px 30px -15px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)'
          }}
        >
          <div className="flex flex-col space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-[#243E4D]">Anonymization Options</h3>
              <Button variant="ghost" size="icon" onClick={handleCancel}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <Label htmlFor="anonymize-identifiers">Anonymize Identifiers</Label>
                  <p className="text-xs text-muted-foreground">IDs, names, and unique numbers</p>
                </div>
                <Switch 
                  id="anonymize-identifiers"
                  checked={options.anonymizeIdentifiers}
                  onCheckedChange={() => toggleOption('anonymizeIdentifiers')}
                />
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <Label htmlFor="anonymize-locations">Anonymize Locations</Label>
                  <p className="text-xs text-muted-foreground">Addresses and specific locations</p>
                </div>
                <Switch 
                  id="anonymize-locations"
                  checked={options.anonymizeLocations}
                  onCheckedChange={() => toggleOption('anonymizeLocations')}
                />
              </div>
              
              <div className="flex justify-between items-center">
                <div>
                  <Label htmlFor="anonymize-financials">Anonymize Financial Values</Label>
                  <p className="text-xs text-muted-foreground">Costs and monetary values</p>
                </div>
                <Switch 
                  id="anonymize-financials"
                  checked={options.anonymizeFinancials}
                  onCheckedChange={() => toggleOption('anonymizeFinancials')}
                />
              </div>
              
              {options.anonymizeFinancials && (
                <div className="pt-2 pb-6 space-y-2">
                  <Label className="text-xs">Financial Data Variance ({Math.round((options.financialVariance || 0.1) * 100)}%)</Label>
                  <Slider 
                    min={0} 
                    max={50} 
                    step={1} 
                    value={[(options.financialVariance || 0.1) * 100]} 
                    onValueChange={updateFinancialVariance}
                  />
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Minimal</span>
                    <span className="text-xs text-muted-foreground">Significant</span>
                  </div>
                  
                  <div className="flex items-center pt-2">
                    <Switch 
                      id="preserve-statistics"
                      checked={options.preserveStatistics}
                      onCheckedChange={() => toggleOption('preserveStatistics')}
                      className="mr-2"
                    />
                    <div>
                      <Label htmlFor="preserve-statistics" className="text-xs">Preserve Statistical Validity</Label>
                      <p className="text-xs text-muted-foreground">Maintain data relationships</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-between pt-2">
              <Button variant="outline" size="sm" onClick={handleCancel}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleAnonymize}>
                <ShieldAlert className="h-4 w-4 mr-1" />
                Anonymize
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

/**
 * Smaller variant of Data Anonymizer that only shows a button
 * with minimal controls when clicked
 */
export function SimpleDataAnonymizer({
  data,
  dataType = 'building',
  onAnonymize,
  isAnonymized = false
}: Omit<DataAnonymizerProps, 'defaultOptions' | 'onCancel' | 'showEffects' | 'variant'>) {
  const [anonymizing, setAnonymizing] = useState(false);
  const { toast } = useToast();
  
  const handleAnonymizeClick = () => {
    if (!data) {
      toast({
        title: "No data to anonymize",
        description: "Please provide data to anonymize.",
        variant: "destructive"
      });
      return;
    }
    
    setAnonymizing(true);
    
    try {
      const options: AnonymizationOptions = {
        anonymizeIdentifiers: true,
        anonymizeLocations: true,
        anonymizeFinancials: true,
        financialVariance: 0.1
      };
      
      let anonymizedData;
      
      if (Array.isArray(data)) {
        anonymizedData = data.map(record => 
          dataType === 'calculation' 
            ? anonymizeCalculationData(record, options)
            : anonymizeBuildingData(record, options)
        );
      } else {
        anonymizedData = dataType === 'calculation'
          ? anonymizeCalculationData(data, options)
          : anonymizeBuildingData(data, options);
      }
      
      // Notify success
      toast({
        title: "Data Anonymized",
        description: "Your data has been anonymized with default settings.",
        variant: "default"
      });
      
      // Call the callback with anonymized data
      if (onAnonymize) {
        onAnonymize(anonymizedData);
      }
    } catch (error) {
      console.error("Error anonymizing data:", error);
      toast({
        title: "Anonymization Error",
        description: "An error occurred while anonymizing data.",
        variant: "destructive"
      });
    } finally {
      setAnonymizing(false);
    }
  };
  
  return (
    <Button 
      variant="outline" 
      size="sm" 
      className={`relative ${isAnonymized ? 'bg-blue-50 border-blue-200 text-blue-700' : ''}`}
      onClick={handleAnonymizeClick}
      disabled={anonymizing}
      style={{ 
        transformStyle: 'preserve-3d',
        transform: 'translateZ(2px)',
        boxShadow: '0 2px 6px -2px rgba(0, 0, 0, 0.1)'
      }}
    >
      {anonymizing ? (
        <div className="h-4 w-4 mr-1 rounded-full border-2 border-current border-t-transparent animate-spin"></div>
      ) : isAnonymized ? (
        <Check className="h-4 w-4 mr-1" />
      ) : (
        <ShieldAlert className="h-4 w-4 mr-1" />
      )}
      
      <span>
        {anonymizing 
          ? "Anonymizing..." 
          : isAnonymized 
            ? "Anonymized" 
            : "Quick Anonymize"
        }
      </span>
    </Button>
  );
}
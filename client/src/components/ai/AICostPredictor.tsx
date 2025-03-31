import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { 
  useMCP, 
  VALID_BUILDING_TYPES, 
  VALID_REGIONS, 
  VALID_CONDITIONS,
  CostPredictionResponse
} from '@/hooks/use-mcp';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Building2, Database, Calculator, AlertTriangle, CheckCircle, FileDown, Share2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from "@/components/ui/badge";
import { exportCostPredictionAsPdf } from '@/lib/pdf-export';

// Validation schema for the cost prediction form
const costPredictionSchema = z.object({
  buildingType: z.string().min(1, { message: "Building type is required" }),
  region: z.string().min(1, { message: "Region is required" }),
  squareFootage: z.coerce.number().min(1, { message: "Square footage must be greater than 0" }),
  yearBuilt: z.coerce.number().optional(),
  condition: z.string().optional(),
  complexity: z.coerce.number().optional(),
});

type CostPredictionFormValues = z.infer<typeof costPredictionSchema>;

// Building type options (could be fetched from API in a real app)
const buildingTypeOptions = [
  { value: "residential", label: "Residential" },
  { value: "commercial", label: "Commercial" },
  { value: "industrial", label: "Industrial" },
  { value: "agricultural", label: "Agricultural" },
  { value: "institutional", label: "Institutional" },
];

// Region options (could be fetched from API in a real app)
const regionOptions = [
  { value: "north", label: "North Region" },
  { value: "south", label: "South Region" },
  { value: "east", label: "East Region" },
  { value: "west", label: "West Region" },
  { value: "central", label: "Central Region" },
];

// Building condition options
const conditionOptions = [
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "average", label: "Average" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" },
];

export default function AICostPredictor() {
  const { toast } = useToast();
  const { predictCost, isPredicting, isError, error, mcpStatus } = useMCP();
  const [predictionResult, setPredictionResult] = useState<CostPredictionResponse | null>(null);
  const [dataQualityWarnings, setDataQualityWarnings] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  
  // Initialize the form
  const form = useForm<CostPredictionFormValues>({
    resolver: zodResolver(costPredictionSchema),
    defaultValues: {
      buildingType: "",
      region: "",
      squareFootage: 0,
      yearBuilt: new Date().getFullYear() - 10, // Default to 10 years old
      condition: "average",
      complexity: 1, // Default complexity
    },
  });
  
  // Handle form submission
  const onSubmit = (data: CostPredictionFormValues) => {
    // Reset previous results
    setPredictionResult(null);
    setDataQualityWarnings([]);
    
    // Call the MCP service to predict the cost
    predictCost(data, {
      onSuccess: (result) => {
        setPredictionResult(result);
        
        // Extract any data quality warnings or anomalies
        const warnings: string[] = [];
        
        if (result.anomalies && result.anomalies.length > 0) {
          warnings.push(...result.anomalies);
        }
        
        if (result.dataQualityScore !== undefined && result.dataQualityScore < 0.7) {
          warnings.push(`Low data quality score (${(result.dataQualityScore * 100).toFixed(0)}%). Prediction may be less reliable.`);
        }
        
        setDataQualityWarnings(warnings);
        
        toast({
          title: "Cost Prediction Complete",
          description: warnings.length > 0 
            ? "Analysis complete with data quality warnings" 
            : "AI has successfully analyzed your building parameters",
          variant: warnings.length > 0 ? "default" : "default",
        });
      },
      onError: (error) => {
        toast({
          title: "Prediction Failed",
          description: error instanceof Error ? error.message : "An unknown error occurred",
          variant: "destructive",
        });
      },
    });
  };
  
  // Handle exporting the prediction as PDF
  const handleExportPdf = async () => {
    if (!predictionResult) return;
    
    try {
      setIsExporting(true);
      
      // Use the form values for building details
      const formValues = form.getValues();
      
      // Generate a filename with date
      const date = new Date().toISOString().split('T')[0];
      const filename = `cost-prediction-${formValues.buildingType}-${date}.pdf`;
      
      // Export the prediction
      await exportCostPredictionAsPdf(
        predictionResult,
        {
          buildingType: formValues.buildingType,
          squareFootage: formValues.squareFootage,
          region: formValues.region,
          yearBuilt: formValues.yearBuilt,
          condition: formValues.condition,
          complexity: formValues.complexity
        },
        filename
      );
      
      toast({
        title: "PDF Exported Successfully",
        description: `Your cost prediction report has been exported as ${filename}`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export the PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  // Display API key missing warning if needed
  if (mcpStatus && mcpStatus.status === "api_key_missing") {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            AI Cost Predictor
          </CardTitle>
          <CardDescription>
            Predict building costs using AI analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTitle>API Key Missing</AlertTitle>
            <AlertDescription>
              OpenAI API key is not configured. Please contact your administrator to set up the API key.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          AI Cost Predictor
        </CardTitle>
        <CardDescription>
          Leverage AI to predict building costs based on advanced analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Building Type */}
              <FormField
                control={form.control}
                name="buildingType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Building Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select building type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {buildingTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The primary classification of the building
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Region */}
              <FormField
                control={form.control}
                name="region"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Region</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select region" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {regionOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The geographic region of the building
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Square Footage */}
              <FormField
                control={form.control}
                name="squareFootage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Square Footage</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormDescription>
                      Total area in square feet
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Year Built */}
              <FormField
                control={form.control}
                name="yearBuilt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year Built</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormDescription>
                      Year the building was constructed
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Building Condition */}
              <FormField
                control={form.control}
                name="condition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Building Condition</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {conditionOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Current condition of the building
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Complexity Factor */}
              <FormField
                control={form.control}
                name="complexity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Complexity Factor: {field.value || 1}</FormLabel>
                    <FormControl>
                      <Slider
                        min={0.5}
                        max={2}
                        step={0.1}
                        value={[field.value || 1]}
                        onValueChange={(value) => field.onChange(value[0])}
                      />
                    </FormControl>
                    <FormDescription>
                      Building complexity from simple (0.5) to complex (2.0)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Prediction Result Display */}
            {predictionResult && (
              <Card className="bg-muted/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">AI Cost Prediction</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="font-semibold">Estimated Base Cost:</div>
                    <div>${predictionResult.baseCost?.toFixed(2)}</div>
                    
                    <div className="font-semibold">Region Factor:</div>
                    <div>{predictionResult.regionFactor}</div>
                    
                    <div className="font-semibold">Complexity Factor:</div>
                    <div>{predictionResult.complexityFactor}</div>
                    
                    <div className="font-semibold">Cost per Square Foot:</div>
                    <div>${predictionResult.costPerSqft?.toFixed(2)}</div>
                    
                    <div className="col-span-2 mt-2 pt-2 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-xl font-bold">Total Estimated Cost:</span>
                        <span className="text-xl font-bold text-primary">
                          ${predictionResult.totalCost?.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    
                    {predictionResult.explanation && (
                      <div className="col-span-2 mt-2 pt-2 border-t">
                        <h4 className="font-semibold mb-1">AI Analysis:</h4>
                        <p className="text-sm">{predictionResult.explanation}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Data Quality Warnings */}
            {dataQualityWarnings.length > 0 && (
              <Alert className="bg-amber-50 border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <AlertTitle className="text-amber-700">Data Quality Warnings</AlertTitle>
                <AlertDescription className="text-amber-700">
                  <ul className="list-disc pl-5 space-y-1 mt-2">
                    {dataQualityWarnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            
            {/* Confidence Score Indicator */}
            {predictionResult && (
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">Prediction Confidence:</span>
                <div className="flex items-center gap-1">
                  {predictionResult.confidenceScore >= 0.8 ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : predictionResult.confidenceScore >= 0.6 ? (
                    <CheckCircle className="h-4 w-4 text-amber-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                  <Badge 
                         className={`${predictionResult.confidenceScore >= 0.8 ? 'bg-green-100 text-green-700 hover:bg-green-100' : 
                                        predictionResult.confidenceScore >= 0.6 ? 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100' : 
                                        'bg-red-100 text-red-700 border-red-200 hover:bg-red-100'}`}>
                    {(predictionResult.confidenceScore * 100).toFixed(0)}% Confidence
                  </Badge>
                </div>
              </div>
            )}
            
            {isError && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {error || "An error occurred during the cost prediction. Please try again."}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex justify-end gap-2">
              {predictionResult && (
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={handleExportPdf}
                  disabled={isExporting || !predictionResult}
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <FileDown className="mr-2 h-4 w-4" />
                      Export as PDF
                    </>
                  )}
                </Button>
              )}
              <Button type="submit" disabled={isPredicting}>
                {isPredicting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>Predict Cost</>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-between bg-muted/20 text-xs text-muted-foreground">
        <div className="flex items-center">
          <Building2 className="h-3 w-3 mr-1" />
          <span>Benton County Building Cost System</span>
        </div>
        <div className="flex items-center">
          <Database className="h-3 w-3 mr-1" />
          <span>Powered by AI</span>
        </div>
      </CardFooter>
    </Card>
  );
}
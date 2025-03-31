import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useMCP } from '@/hooks/use-mcp';
import { Loader2, Database, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AICalculationExplainer() {
  const { toast } = useToast();
  const { explainCalculation, isExplaining, isError, error, mcpStatus } = useMCP();
  const [calculationData, setCalculationData] = useState<string>('');
  const [explanationResult, setExplanationResult] = useState<any>(null);
  
  // Handle form submission for explanation
  const handleExplain = () => {
    if (!calculationData.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter calculation data to explain",
        variant: "destructive",
      });
      return;
    }
    
    // Try to parse the JSON data
    try {
      const parsedData = JSON.parse(calculationData);
      
      // Call the MCP service to explain the calculation
      explainCalculation({ calculationData: parsedData }, {
        onSuccess: (result) => {
          setExplanationResult(result);
          toast({
            title: "Explanation Complete",
            description: "AI has explained the building cost calculation",
          });
        },
        onError: (error) => {
          toast({
            title: "Explanation Failed",
            description: error instanceof Error ? error.message : "An unknown error occurred",
            variant: "destructive",
          });
        },
      });
    } catch (parseError) {
      toast({
        title: "Invalid JSON",
        description: "The provided data is not valid JSON",
        variant: "destructive",
      });
    }
  };
  
  // Display API key missing warning if needed
  if (mcpStatus && mcpStatus.status === "api_key_missing") {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            AI Calculation Explainer
          </CardTitle>
          <CardDescription>
            Get detailed explanations of building cost calculations
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
          <Info className="h-5 w-5" />
          AI Calculation Explainer
        </CardTitle>
        <CardDescription>
          Get detailed explanations of your building cost calculations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="calculationData">Enter Calculation Data (JSON format)</Label>
          <Textarea
            id="calculationData"
            className="min-h-[200px] font-mono text-sm mt-2"
            placeholder={`{\n  "buildingType": "commercial",\n  "region": "north",\n  "squareFootage": 5000,\n  "baseCost": 150.00,\n  "regionFactor": 1.2,\n  "complexityFactor": 1.1,\n  "costPerSqft": 198.00,\n  "totalCost": 990000.00\n}`}
            value={calculationData}
            onChange={(e) => setCalculationData(e.target.value)}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Paste calculation data in JSON format for AI explanation
          </p>
        </div>
        
        <div className="flex justify-end">
          <Button 
            onClick={handleExplain} 
            disabled={isExplaining || !calculationData.trim()}
          >
            {isExplaining ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Explanation...
              </>
            ) : (
              <>Explain Calculation</>
            )}
          </Button>
        </div>
        
        {/* Explanation Results Display */}
        {explanationResult && (
          <Card className="bg-muted/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">AI Explanation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Basic Explanation */}
                {explanationResult.explanation && (
                  <div>
                    <h3 className="font-semibold mb-2">Calculation Explanation</h3>
                    <p className="text-sm whitespace-pre-line">{explanationResult.explanation}</p>
                  </div>
                )}
                
                {/* Formula Breakdown */}
                {explanationResult.formulaBreakdown && (
                  <div>
                    <h3 className="font-semibold mb-2">Formula Breakdown</h3>
                    <div className="text-sm bg-background p-3 rounded-md font-mono">
                      {explanationResult.formulaBreakdown}
                    </div>
                  </div>
                )}
                
                {/* Factor Explanations */}
                {explanationResult.factorExplanations && (
                  <div>
                    <h3 className="font-semibold mb-2">Factor Explanations</h3>
                    <ul className="text-sm list-disc pl-5 space-y-1">
                      {Object.entries(explanationResult.factorExplanations).map(([factor, explanation], index) => (
                        <li key={index}>
                          <span className="font-medium">{factor}:</span> {explanation as string}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Additional Insights */}
                {explanationResult.additionalInsights && (
                  <div>
                    <h3 className="font-semibold mb-2">Additional Insights</h3>
                    <p className="text-sm">{explanationResult.additionalInsights}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        
        {isError && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error || "An error occurred generating the explanation. Please try again."}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-between bg-muted/20 text-xs text-muted-foreground">
        <div className="flex items-center">
          <Info className="h-3 w-3 mr-1" />
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
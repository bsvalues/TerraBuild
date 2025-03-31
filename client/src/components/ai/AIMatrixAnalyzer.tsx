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
import { Loader2, Database, BarChart3 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AIMatrixAnalyzer() {
  const { toast } = useToast();
  const { analyzeMatrix, isAnalyzing, isError, error, mcpStatus } = useMCP();
  const [matrixData, setMatrixData] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  
  // Handle form submission for analysis
  const handleAnalyze = () => {
    if (!matrixData.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter matrix data to analyze",
        variant: "destructive",
      });
      return;
    }
    
    // Try to parse the JSON data
    try {
      const parsedData = JSON.parse(matrixData);
      
      // Call the MCP service to analyze the matrix
      analyzeMatrix({ matrixData: parsedData }, {
        onSuccess: (result) => {
          setAnalysisResult(result);
          toast({
            title: "Analysis Complete",
            description: "AI has analyzed the cost matrix data",
          });
        },
        onError: (error) => {
          toast({
            title: "Analysis Failed",
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
            <BarChart3 className="h-5 w-5" />
            AI Matrix Analyzer
          </CardTitle>
          <CardDescription>
            Advanced analysis of cost matrix data
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
          <BarChart3 className="h-5 w-5" />
          AI Matrix Analyzer
        </CardTitle>
        <CardDescription>
          Upload cost matrix data for in-depth AI analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="matrixData">Enter Cost Matrix Data (JSON format)</Label>
          <Textarea
            id="matrixData"
            className="min-h-[200px] font-mono text-sm mt-2"
            placeholder={`{\n  "matrix": [...],\n  "regions": [...],\n  "buildingTypes": [...]\n}`}
            value={matrixData}
            onChange={(e) => setMatrixData(e.target.value)}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Paste cost matrix data in JSON format for AI analysis
          </p>
        </div>
        
        <div className="flex justify-end">
          <Button 
            onClick={handleAnalyze} 
            disabled={isAnalyzing || !matrixData.trim()}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>Analyze Matrix</>
            )}
          </Button>
        </div>
        
        {/* Analysis Results Display */}
        {analysisResult && (
          <Card className="bg-muted/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">AI Matrix Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Overview Section */}
                {analysisResult.overview && (
                  <div>
                    <h3 className="font-semibold mb-2">Overview</h3>
                    <p className="text-sm">{analysisResult.overview}</p>
                  </div>
                )}
                
                {/* Regional Analysis */}
                {analysisResult.regionalAnalysis && (
                  <div>
                    <h3 className="font-semibold mb-2">Regional Analysis</h3>
                    <p className="text-sm">{analysisResult.regionalAnalysis}</p>
                  </div>
                )}
                
                {/* Building Type Analysis */}
                {analysisResult.buildingTypeAnalysis && (
                  <div>
                    <h3 className="font-semibold mb-2">Building Type Analysis</h3>
                    <p className="text-sm">{analysisResult.buildingTypeAnalysis}</p>
                  </div>
                )}
                
                {/* Trends and Insights */}
                {analysisResult.trendsAndInsights && (
                  <div>
                    <h3 className="font-semibold mb-2">Trends & Insights</h3>
                    <p className="text-sm">{analysisResult.trendsAndInsights}</p>
                  </div>
                )}
                
                {/* Recommendations */}
                {analysisResult.recommendations && (
                  <div>
                    <h3 className="font-semibold mb-2">Recommendations</h3>
                    <p className="text-sm">{analysisResult.recommendations}</p>
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
              {error || "An error occurred during the analysis. Please try again."}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-between bg-muted/20 text-xs text-muted-foreground">
        <div className="flex items-center">
          <BarChart3 className="h-3 w-3 mr-1" />
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
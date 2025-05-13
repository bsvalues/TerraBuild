import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { loadCostFactorsData } from '@/lib/utils/loadCostFactors';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ArrowLeft 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

const TestCostFactorsPage: React.FC = () => {
  const [_, navigate] = useLocation();
  const { data, isLoading, error } = useQuery({
    queryKey: ['costFactorsData'],
    queryFn: loadCostFactorsData,
    retry: 1,
  });

  // Log detailed region data from the API response
  React.useEffect(() => {
    if (data) {
      console.log("TEST PAGE - LOADED COST FACTORS:", {
        regionFactorsNames: data.regionFactors ? Object.keys(data.regionFactors) : [],
        regionFactorsValues: data.regionFactors ? Object.entries(data.regionFactors) : [],
        fullCostFactors: data
      });
    }
  }, [data]);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Cost Factors Test Page</h1>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/matrix')} variant="outline">
            Matrix Explorer
          </Button>
          <Button onClick={() => navigate('/cost/estimate')} variant="default">
            Open Cost Wizard
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>API Endpoint Test</CardTitle>
            <CardDescription>Testing the connection to the cost factors API endpoint</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Alert>
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                <AlertTitle>Loading Cost Factors</AlertTitle>
                <AlertDescription>
                  Testing connection to the API endpoint /api/cost-factors-file...
                </AlertDescription>
              </Alert>
            ) : error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4 mr-2" />
                <AlertTitle>Error Loading Cost Factors</AlertTitle>
                <AlertDescription>
                  There was an error loading data from the API endpoint.
                  {error instanceof Error && (
                    <div className="mt-2 text-xs font-mono whitespace-pre-wrap">{error.message}</div>
                  )}
                </AlertDescription>
              </Alert>
            ) : data ? (
              <Alert className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
                <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                <AlertTitle>Success!</AlertTitle>
                <AlertDescription>
                  Successfully loaded cost factors data from the API endpoint.
                  <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-md">
                    <h3 className="text-sm font-medium mb-2">Data Summary:</h3>
                    <ul className="text-xs space-y-1">
                      <li><strong>Source:</strong> {data.source}</li>
                      <li><strong>Version:</strong> {data.version}</li>
                      <li><strong>Year:</strong> {data.year}</li>
                      <li><strong>Last Updated:</strong> {new Date(data.lastUpdated).toLocaleDateString()}</li>
                      <li><strong>Regions:</strong> {Object.keys(data.regionFactors).length} regions defined</li>
                      <li><strong>Building Types:</strong> {Object.keys(data.baseRates).length} types defined</li>
                      <li><strong>Quality Levels:</strong> {Object.keys(data.qualityFactors).length} levels defined</li>
                    </ul>
                    
                    <h3 className="text-sm font-medium mt-4 mb-2">Regions Diagnostic:</h3>
                    <div className="overflow-x-auto">
                      <table className="text-xs w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-200 dark:bg-gray-700">
                            <th className="border p-1 text-left">Region Key</th>
                            <th className="border p-1 text-left">Factor Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(data.regionFactors).map(([key, value]) => (
                            <tr key={key} className="border-b">
                              <td className="border p-1 font-mono">{key}</td>
                              <td className="border p-1">{value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4 mr-2" />
                <AlertTitle>No Data</AlertTitle>
                <AlertDescription>
                  No cost factors data was returned from the API endpoint.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {data && (
          <Card>
            <CardHeader>
              <CardTitle>Cost Factors Raw Data</CardTitle>
              <CardDescription>Raw JSON data from the API endpoint</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
                <pre className="text-xs overflow-auto max-h-96">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TestCostFactorsPage;
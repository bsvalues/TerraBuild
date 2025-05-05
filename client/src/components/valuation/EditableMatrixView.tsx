
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { RefreshCw, Save, Play } from 'lucide-react';
import { useMCP } from '@/hooks/use-mcp';

interface MatrixData {
  id: string;
  rows: MatrixRow[];
  metadata: {
    region: string;
    year: number;
    buildingType: string;
    lastUpdated: string;
  };
}

interface MatrixRow {
  id: string;
  quality: string;
  values: { [key: string]: number };
}

export default function EditableMatrixView({ matrixId }: { matrixId?: string }) {
  const [matrixData, setMatrixData] = useState<MatrixData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [columns, setColumns] = useState<string[]>([]);
  const [edited, setEdited] = useState(false);
  const { rerunAnalysis, isAnalyzing } = useMCP();

  // Simulate loading matrix data
  useEffect(() => {
    if (matrixId) {
      setIsLoading(true);
      // In production, this would be an API call to fetch the matrix data
      setTimeout(() => {
        const sampleData: MatrixData = {
          id: matrixId || 'default-matrix',
          metadata: {
            region: 'Benton County',
            year: 2025,
            buildingType: 'Residential',
            lastUpdated: new Date().toISOString(),
          },
          rows: [
            {
              id: 'r1',
              quality: 'Low',
              values: {
                '1-5': 89.5,
                '6-10': 82.3,
                '11-20': 78.4,
                '21+': 75.1
              }
            },
            {
              id: 'r2',
              quality: 'Medium',
              values: {
                '1-5': 105.2,
                '6-10': 98.7,
                '11-20': 93.5,
                '21+': 91.2
              }
            },
            {
              id: 'r3',
              quality: 'High',
              values: {
                '1-5': 124.8,
                '6-10': 119.5,
                '11-20': 115.2,
                '21+': 112.3
              }
            }
          ]
        };
        
        setMatrixData(sampleData);
        setColumns(Object.keys(sampleData.rows[0].values));
        setIsLoading(false);
      }, 1000);
    } else {
      // Use initial example data when no matrixId is provided
      const initialData: MatrixData = {
        id: 'example-matrix',
        metadata: {
          region: 'Benton County',
          year: 2025,
          buildingType: 'Residential',
          lastUpdated: new Date().toISOString(),
        },
        rows: [
          {
            id: 'r1',
            quality: 'Low',
            values: {
              '1-5': 89.5,
              '6-10': 82.3,
              '11-20': 78.4,
              '21+': 75.1
            }
          },
          {
            id: 'r2',
            quality: 'Medium',
            values: {
              '1-5': 105.2,
              '6-10': 98.7,
              '11-20': 93.5,
              '21+': 91.2
            }
          },
          {
            id: 'r3',
            quality: 'High',
            values: {
              '1-5': 124.8,
              '6-10': 119.5,
              '11-20': 115.2,
              '21+': 112.3
            }
          }
        ]
      };
      
      setMatrixData(initialData);
      setColumns(Object.keys(initialData.rows[0].values));
    }
  }, [matrixId]);

  const handleValueChange = (rowIndex: number, column: string, value: string) => {
    if (!matrixData) return;
    
    const newValue = parseFloat(value);
    if (isNaN(newValue)) return;
    
    const updatedRows = [...matrixData.rows];
    updatedRows[rowIndex] = {
      ...updatedRows[rowIndex],
      values: {
        ...updatedRows[rowIndex].values,
        [column]: newValue
      }
    };
    
    setMatrixData({
      ...matrixData,
      rows: updatedRows,
      metadata: {
        ...matrixData.metadata,
        lastUpdated: new Date().toISOString()
      }
    });
    
    setEdited(true);
  };

  const saveChanges = () => {
    // In production, this would send the updated matrix data to the API
    console.log('Saving matrix changes:', matrixData);
    setIsEditing(false);
    
    // Show save confirmation, etc.
  };

  const rerunMatrixAnalysis = async () => {
    if (!matrixData) return;
    
    try {
      await rerunAnalysis({ 
        matrixId: matrixData.id, 
        matrixData: matrixData 
      });
      setEdited(false);
      // Handle success
    } catch (error) {
      console.error('Error rerunning analysis:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 bg-white shadow rounded">
        <h3 className="text-lg font-semibold mb-2">✏️ Matrix Editor</h3>
        <div className="flex justify-center items-center h-40">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
          <span className="ml-2">Loading matrix data...</span>
        </div>
      </div>
    );
  }

  if (!matrixData) {
    return (
      <div className="p-4 bg-white shadow rounded">
        <h3 className="text-lg font-semibold mb-2">✏️ Matrix Editor</h3>
        <div className="p-4 text-center">
          <p>No matrix data available. Please select or upload a matrix.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white shadow rounded">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">✏️ Matrix Editor</h3>
        <div className="space-x-2">
          <Button
            variant={isEditing ? "default" : "outline"}
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? "Editing..." : "Edit Values"}
          </Button>
          {isEditing && (
            <Button onClick={saveChanges}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          )}
          {edited && (
            <Button 
              variant="secondary" 
              onClick={rerunMatrixAnalysis}
              disabled={isAnalyzing}
            >
              <Play className="h-4 w-4 mr-2" />
              {isAnalyzing ? "Running..." : "Re-Run Analysis"}
            </Button>
          )}
        </div>
      </div>
      
      <div className="mb-3 text-sm text-gray-600">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div>
            <span className="font-medium">Region:</span> {matrixData.metadata.region}
          </div>
          <div>
            <span className="font-medium">Year:</span> {matrixData.metadata.year}
          </div>
          <div>
            <span className="font-medium">Building Type:</span> {matrixData.metadata.buildingType}
          </div>
          <div>
            <span className="font-medium">Last Updated:</span> {new Date(matrixData.metadata.lastUpdated).toLocaleDateString()}
          </div>
        </div>
      </div>

      <div className="border rounded overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Quality Level</TableHead>
              {columns.map(column => (
                <TableHead key={column}>Age: {column} years</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {matrixData.rows.map((row, rowIndex) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.quality}</TableCell>
                {columns.map(column => (
                  <TableCell key={`${row.id}-${column}`}>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={row.values[column]}
                        onChange={(e) => handleValueChange(rowIndex, column, e.target.value)}
                        className="w-24"
                        step="0.1"
                      />
                    ) : (
                      `$${row.values[column].toFixed(2)}`
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <div className="mt-3 text-xs text-gray-500">
        Values represent cost per square foot. Changes will affect valuation analysis.
      </div>
    </div>
  );
}

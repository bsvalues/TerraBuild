import React, { useState, useEffect } from 'react';
import { useMCPAgent } from '@/hooks/use-mcp';
import UploadZone from '@/components/ui/UploadZone';
import ImportStatusPanel from '@/components/ui/ImportStatusPanel';
import MatrixPreviewTable from '@/components/ui/MatrixPreviewTable';
import CostInsightPanel from '@/components/ui/CostInsightPanel';

export default function MatrixUploadInterface() {
  const [file, setFile] = useState<File | null>(null);
  const [fileContents, setFileContents] = useState<string | null>(null);
  
  const inquisitorAgent = useMCPAgent('inquisitorAgent');
  const interpreterAgent = useMCPAgent('interpreterAgent');
  const visualizerAgent = useMCPAgent('visualizerAgent');
  
  // Handle file upload
  const handleUpload = async (uploadedFile: File) => {
    setFile(uploadedFile);
    
    // Convert the file to base64 for easier handling in JSON
    const reader = new FileReader();
    reader.onload = async (event) => {
      if (event.target?.result) {
        const base64Content = event.target.result.toString().split(',')[1];
        setFileContents(base64Content);
        
        // Trigger the validation agent
        await inquisitorAgent.runAgentWithPayload({
          fileName: uploadedFile.name,
          fileType: uploadedFile.type,
          content: base64Content
        });
      }
    };
    
    reader.readAsDataURL(uploadedFile);
  };
  
  // When validation is successful, trigger the interpreter agent
  useEffect(() => {
    const processFile = async () => {
      if (inquisitorAgent.status === 'success' && 
          inquisitorAgent.result?.success && 
          fileContents) {
        // Run the interpreter agent to parse the Excel file
        await interpreterAgent.runAgentWithPayload({
          fileName: file?.name,
          content: fileContents,
          validationResult: inquisitorAgent.result
        });
      }
    };
    
    processFile();
  }, [inquisitorAgent.status, inquisitorAgent.result, fileContents, file, interpreterAgent]);
  
  // When interpretation is successful, trigger the visualizer agent
  useEffect(() => {
    const generateInsights = async () => {
      if (interpreterAgent.status === 'success' && 
          interpreterAgent.result?.data) {
        // Run the visualizer agent to generate insights
        await visualizerAgent.runAgentWithPayload({
          parsedData: interpreterAgent.result.data,
          fileName: file?.name
        });
      }
    };
    
    generateInsights();
  }, [interpreterAgent.status, interpreterAgent.result, file, visualizerAgent]);
  
  // Create a default validation status when no results are available yet
  const defaultStatus = {
    success: false,
    message: 'Waiting for file upload',
    details: []
  };
  
  // Determine the actual validation status to display
  const validationStatus = inquisitorAgent.result || defaultStatus;
  
  // Get the parsed data and raw data for the preview table
  const parsedData = interpreterAgent.result?.data || [];
  const rawData = interpreterAgent.result?.rawData || [];
  
  // Get the insights for the cost insight panel
  const insights = visualizerAgent.result?.insights || [];
  
  return (
    <div className="container max-w-7xl mx-auto p-4 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <UploadZone onUpload={handleUpload} />
        </div>
        <div className="md:col-span-2">
          <ImportStatusPanel status={validationStatus} />
        </div>
      </div>
      
      <MatrixPreviewTable 
        data={parsedData} 
        rawData={rawData} 
        errors={interpreterAgent.result?.errors}
      />
      
      <CostInsightPanel insights={insights} />
    </div>
  );
}
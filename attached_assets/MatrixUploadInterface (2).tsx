
// MatrixUploadInterface.tsx
import React, { useState } from 'react';
import { useMCPAgent } from './useMCPAgents';

export default function MatrixUploadInterface() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [parsedData, setParsedData] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);
  const [errors, setErrors] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setErrors(null);
    setValidationResult(null);
    setParsedData(null);
    setInsights(null);

    try {
      const fileText = await file.text(); // Simulate sending file content

      // Trigger Inquisitor Agent
      const validation = await fetch('/api/mcp/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent: 'inquisitorAgent',
          input: { fileName: file.name, content: fileText }
        })
      }).then(res => res.json());

      setValidationResult(validation);

      if (!validation.success) {
        setErrors('Validation failed.');
        return;
      }

      // Trigger Interpreter Agent
      const parsed = await fetch('/api/mcp/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent: 'interpreterAgent',
          input: { fileName: file.name, content: fileText }
        })
      }).then(res => res.json());

      setParsedData(parsed);

      // Trigger Visualizer Agent
      const insight = await fetch('/api/mcp/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent: 'visualizerAgent',
          input: parsed
        })
      }).then(res => res.json());

      setInsights(insight);

    } catch (err) {
      console.error(err);
      setErrors('Upload or processing failed.');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Matrix Upload & Validation</h1>
      <input type="file" accept=".xlsx" onChange={handleFileUpload} />
      
      {errors && <div className="text-red-600">❌ {errors}</div>}

      {validationResult && (
        <div className="bg-blue-100 p-4 rounded">
          <h2 className="font-semibold">Validation Results</h2>
          <pre>{JSON.stringify(validationResult, null, 2)}</pre>
        </div>
      )}

      {parsedData && (
        <div className="bg-green-100 p-4 rounded">
          <h2 className="font-semibold">Parsed Matrix Data (preview)</h2>
          <pre>{JSON.stringify(parsedData?.preview ?? parsedData, null, 2)}</pre>
        </div>
      )}

      {insights && (
        <div className="bg-yellow-100 p-4 rounded">
          <h2 className="font-semibold">Insights</h2>
          <pre>{JSON.stringify(insights, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

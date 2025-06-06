
// MatrixUploadInterface.tsx
import React, { useState } from 'react';
import { InquisitorAgent, InterpreterAgent, VisualizerAgent } from '@/agents';
import UploadZone from '@/components/ui/UploadZone';
import ImportStatusPanel from '@/components/ui/ImportStatusPanel';
import MatrixPreviewTable from '@/components/ui/MatrixPreviewTable';
import CostInsightPanel from '@/components/ui/CostInsightPanel';

export default function MatrixUploadInterface() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState([]);
  const [parsedData, setParsedData] = useState([]);
  const [insights, setInsights] = useState([]);

  const handleUpload = async (f: File) => {
    setFile(f);
    const validation = await InquisitorAgent.validate(f);
    setStatus(validation);

    if (validation.success) {
      const data = await InterpreterAgent.parse(f);
      setParsedData(data);

      const insightResults = await VisualizerAgent.analyze(data);
      setInsights(insightResults);
    }
  };

  return (
    <div className="container space-y-6">
      <UploadZone onUpload={handleUpload} />
      <ImportStatusPanel status={status} />
      <MatrixPreviewTable data={parsedData} />
      <CostInsightPanel insights={insights} />
    </div>
  );
}

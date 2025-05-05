
import React from 'react';

export default function ExportJustification() {
  return (
    <div className="p-4 bg-white shadow rounded space-y-2">
      <h3 className="text-lg font-semibold">🧾 Export Justification</h3>
      <p>This will download:</p>
      <ul className="list-disc ml-6">
        <li>Original + adjusted values</li>
        <li>Agent logs</li>
        <li>User overrides</li>
        <li>Regression model details</li>
      </ul>
      <button className="mt-3 px-4 py-2 bg-green-600 text-white rounded">⬇️ Download PDF</button>
      <button className="mt-2 px-4 py-2 bg-gray-700 text-white rounded">⬇️ Download JSON</button>
    </div>
  );
}

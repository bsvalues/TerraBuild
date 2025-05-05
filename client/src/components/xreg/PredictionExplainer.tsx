
// PredictionExplainer.tsx
import React from 'react';

const explanation = {
  prediction: 241320,
  base_value: 180000,
  features: {
    living_area: {
      value: 1950,
      impact: "+31000"
    },
    roof_type: {
      value: "Metal",
      impact: "+7800"
    },
    year_built: {
      value: 1974,
      impact: "-12480"
    },
    condition: {
      value: "Fair",
      impact: "-5000"
    }
  },
  explanation: "The model increased the predicted value primarily due to high living area and durable roof type. Age and condition reduced the value."
};

export default function PredictionExplainer() {
  return (
    <div className="p-6 bg-white shadow rounded max-w-3xl mx-auto space-y-4">
      <h1 className="text-xl font-bold">Prediction Explanation</h1>
      <p><strong>Base Value:</strong> ${explanation.base_value.toLocaleString()}</p>
      <p><strong>Final Prediction:</strong> ${explanation.prediction.toLocaleString()}</p>
      <div className="mt-4 space-y-2">
        {Object.entries(explanation.features).map(([key, detail]) => (
          <div key={key} className="border p-2 rounded bg-gray-50">
            <strong>{key}</strong>: {detail.value} <span className="ml-4 text-sm text-blue-600">Impact: {detail.impact}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-3 text-yellow-800 rounded">
        <strong>Explanation:</strong> {explanation.explanation}
      </div>
    </div>
  );
}

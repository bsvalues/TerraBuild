
import React from 'react';
import { Line } from 'react-chartjs-2';

export default function ValuationTimelineChart() {
  const data = {
    labels: ['2020', '2021', '2022', '2023'],
    datasets: [{
      label: 'Valuation Over Time',
      data: [185000, 196000, 210500, 223700],
      fill: false,
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    }]
  };

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="text-lg font-semibold mb-3">📈 Valuation Timeline</h3>
      <Line data={data} />
    </div>
  );
}

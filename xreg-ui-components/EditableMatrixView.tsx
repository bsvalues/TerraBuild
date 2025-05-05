
import React, { useState } from 'react';

const initialData = [
  { id: 1, building_type: "R3", base_cost: 122.5 },
  { id: 2, building_type: "R2", base_cost: 134.2 },
];

export default function EditableMatrixView() {
  const [data, setData] = useState(initialData);
  const [edited, setEdited] = useState(false);

  const updateCell = (id, field, value) => {
    setData(prev => prev.map(row => row.id === id ? { ...row, [field]: value } : row));
    setEdited(true);
  };

  return (
    <div className="p-4 bg-white shadow rounded">
      <h2 className="text-lg font-semibold mb-2">Editable Matrix View</h2>
      <table className="w-full border">
        <thead><tr><th>ID</th><th>Building Type</th><th>Base Cost</th></tr></thead>
        <tbody>
          {data.map(row => (
            <tr key={row.id}>
              <td className="p-1">{row.id}</td>
              <td className="p-1">{row.building_type}</td>
              <td className="p-1">
                <input
                  className="border px-2 py-1"
                  value={row.base_cost}
                  onChange={e => updateCell(row.id, "base_cost", parseFloat(e.target.value))}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {edited && <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded">🔁 Re-Run Agents</button>}
    </div>
  );
}

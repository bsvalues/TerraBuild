// EditableMatrixView.tsx
import React, { useState } from 'react';

interface MatrixCell {
  id: string;
  value: number;
  isEdited: boolean;
}

interface MatrixRow {
  id: string;
  label: string;
  cells: MatrixCell[];
}

export default function EditableMatrixView() {
  // Sample data - in a real implementation, this would come from an API
  const [matrixData, setMatrixData] = useState<MatrixRow[]>([
    {
      id: 'row1',
      label: 'Single Family Residential',
      cells: [
        { id: 'cell1', value: 123.45, isEdited: false },
        { id: 'cell2', value: 145.50, isEdited: false },
        { id: 'cell3', value: 165.75, isEdited: false }
      ]
    },
    {
      id: 'row2',
      label: 'Multi-Family Residential',
      cells: [
        { id: 'cell4', value: 110.25, isEdited: false },
        { id: 'cell5', value: 128.65, isEdited: false },
        { id: 'cell6', value: 145.80, isEdited: false }
      ]
    },
    {
      id: 'row3',
      label: 'Commercial Office',
      cells: [
        { id: 'cell7', value: 155.30, isEdited: false },
        { id: 'cell8', value: 172.45, isEdited: false },
        { id: 'cell9', value: 185.90, isEdited: false }
      ]
    }
  ]);

  const columnHeaders = ['Quality Class A', 'Quality Class B', 'Quality Class C'];

  const handleCellChange = (rowIndex: number, cellIndex: number, newValue: number) => {
    const newMatrix = [...matrixData];
    newMatrix[rowIndex].cells[cellIndex] = {
      ...newMatrix[rowIndex].cells[cellIndex],
      value: newValue,
      isEdited: true
    };
    setMatrixData(newMatrix);
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <tr>
            <th className="border p-2 bg-gray-100">Building Type</th>
            {columnHeaders.map((header, index) => (
              <th key={index} className="border p-2 bg-gray-100">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrixData.map((row, rowIndex) => (
            <tr key={row.id}>
              <td className="border p-2 font-medium">{row.label}</td>
              {row.cells.map((cell, cellIndex) => (
                <td key={cell.id} className="border p-2">
                  <input
                    type="number"
                    className={`w-full p-1 ${cell.isEdited ? 'bg-yellow-50 border border-yellow-500' : ''}`}
                    value={cell.value}
                    onChange={(e) => handleCellChange(rowIndex, cellIndex, parseFloat(e.target.value))}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 flex justify-end space-x-2">
        <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Save Changes
        </button>
        <button className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
          Reset
        </button>
      </div>
    </div>
  );
}
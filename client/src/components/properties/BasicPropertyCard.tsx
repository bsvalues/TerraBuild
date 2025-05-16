import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Printer } from 'lucide-react';

interface PropertyCardProps {
  property: any;
  onClose: () => void;
}

const BasicPropertyCard: React.FC<PropertyCardProps> = ({ property, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white text-black p-6 rounded shadow-lg">
      <div className="mb-6 flex justify-between">
        <Button onClick={onClose} variant="outline" className="print:hidden">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={handlePrint} variant="outline" className="print:hidden">
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
      </div>
      
      <div className="border-b-2 border-blue-900 pb-4 mb-6">
        <h1 className="text-2xl font-bold text-center text-blue-900">BENTON COUNTY PROPERTY RECORD</h1>
        <p className="text-center">Official Document - {new Date().toLocaleDateString()}</p>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Property ID: {property.parcelId}</h2>
        <p className="text-gray-700">{property.address}, {property.city}, {property.state} {property.zip}</p>
      </div>
      
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="font-bold border-b mb-2">Property Details</h3>
          <p><span className="font-semibold">Type:</span> {property.type}</p>
          <p><span className="font-semibold">Owner:</span> {property.owner}</p>
          <p><span className="font-semibold">Year Built:</span> {property.yearBuilt}</p>
          <p><span className="font-semibold">Square Feet:</span> {property.squareFeet}</p>
        </div>
        <div>
          <h3 className="font-bold border-b mb-2">Valuation</h3>
          <p><span className="font-semibold">Total Value:</span> {property.value}</p>
          <p><span className="font-semibold">Land Value:</span> {property.landValue}</p>
          <p><span className="font-semibold">Improvement Value:</span> {property.improvementValue}</p>
          <p><span className="font-semibold">Last Assessed:</span> {property.lastAssessed}</p>
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="font-bold border-b mb-2">Improvements</h3>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Type</th>
              <th className="border p-2 text-left">Size</th>
              <th className="border p-2 text-left">Year Built</th>
              <th className="border p-2 text-right">Value</th>
            </tr>
          </thead>
          <tbody>
            {property.improvements && property.improvements.map((imp: any, i: number) => (
              <tr key={i}>
                <td className="border p-2">{imp.type}</td>
                <td className="border p-2">{imp.size}</td>
                <td className="border p-2">{imp.yearBuilt}</td>
                <td className="border p-2 text-right">{imp.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="border-t pt-4 text-sm text-gray-600">
        <p>This is an official record from the Benton County Assessor's Office.</p>
        <p>Document generated on {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  );
};

export default BasicPropertyCard;
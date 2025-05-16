import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Printer } from 'lucide-react';

interface PropertyCardProps {
  property: any;
  onClose: () => void;
}

const SimplePropertyCard: React.FC<PropertyCardProps> = ({ property, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white text-black">
      <div className="mb-4 print:hidden flex justify-between">
        <Button onClick={onClose} variant="outline">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={handlePrint} variant="outline">
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
      </div>
      
      <Card className="bg-white border border-gray-300">
        <CardHeader className="bg-blue-900 text-white">
          <CardTitle className="text-center">BENTON COUNTY PROPERTY RECORD</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="mb-6 border-b border-gray-300 pb-4">
            <h2 className="text-xl font-bold">Parcel ID: {property.parcelId}</h2>
            <p>{property.address}, {property.city}, {property.state} {property.zip}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <h3 className="font-semibold">Property Details</h3>
              <div className="space-y-1 mt-2">
                <p><span className="font-medium">Type:</span> {property.type}</p>
                <p><span className="font-medium">Owner:</span> {property.owner}</p>
                <p><span className="font-medium">Year Built:</span> {property.yearBuilt}</p>
                <p><span className="font-medium">Size:</span> {property.squareFeet} sq ft</p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold">Valuation</h3>
              <div className="space-y-1 mt-2">
                <p><span className="font-medium">Total Value:</span> {property.value}</p>
                <p><span className="font-medium">Land Value:</span> {property.landValue}</p>
                <p><span className="font-medium">Improvement Value:</span> {property.improvementValue}</p>
                <p><span className="font-medium">Last Assessed:</span> {property.lastAssessed}</p>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="font-semibold">Geographic Information</h3>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <p><span className="font-medium">Region:</span> {property.region}</p>
              <p><span className="font-medium">Hood Code:</span> {property.hoodCode}</p>
              <p><span className="font-medium">Township:</span> {property.township}</p>
              <p><span className="font-medium">Section:</span> {property.section}</p>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="font-semibold">Improvements</h3>
            <div className="mt-2 border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 text-left">Type</th>
                    <th className="p-2 text-left">Size</th>
                    <th className="p-2 text-left">Year</th>
                    <th className="p-2 text-right">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {property.improvements && property.improvements.map((imp: any, i: number) => (
                    <tr key={i} className="border-t border-gray-200">
                      <td className="p-2">{imp.type}</td>
                      <td className="p-2">{imp.size}</td>
                      <td className="p-2">{imp.yearBuilt}</td>
                      <td className="p-2 text-right">{imp.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="text-xs text-gray-500 border-t border-gray-300 pt-4">
            <p>This is an official document provided by Benton County Assessor's Office.</p>
            <p>Document generated on {new Date().toLocaleDateString()}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SimplePropertyCard;
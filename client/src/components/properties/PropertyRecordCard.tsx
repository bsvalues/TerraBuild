import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, Download, ChevronLeft } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface PropertyRecordCardProps {
  property: any; // Replace with your property type
  onClose: () => void;
}

const PropertyRecordCard: React.FC<PropertyRecordCardProps> = ({ property, onClose }) => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // In a real implementation, this would generate a PDF or other file format
    alert('Download functionality would be implemented here');
  };

  return (
    <div className="print:m-0 print:p-0 print:shadow-none">
      {/* Print controls - hidden when printing */}
      <div className="flex justify-between items-center mb-4 print:hidden">
        <Button variant="outline" onClick={onClose}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Property Details
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {/* Record Card */}
      <Card className="bg-white print:bg-white print:shadow-none border-gray-300 print:border-0">
        <CardContent className="p-8 print:p-0">
          {/* Header with county logo and title */}
          <div className="border-b border-gray-300 pb-4 print:pb-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="h-20 w-20 bg-blue-800 rounded-full flex items-center justify-center text-white font-bold text-xl mr-4">
                  BENTON
                </div>
                <div>
                  <h1 className="text-gray-900 text-2xl font-bold">BENTON COUNTY, WASHINGTON</h1>
                  <p className="text-gray-600">Assessor's Office</p>
                  <p className="text-gray-600">620 Market Street, Prosser, WA 99350</p>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-xl font-bold text-gray-800">PROPERTY RECORD CARD</h2>
                <p className="text-gray-600">Generated: {currentDate}</p>
                <p className="text-gray-600">Parcel ID: {property.parcelId}</p>
              </div>
            </div>
          </div>

          {/* Property Identification */}
          <div className="mt-6">
            <h3 className="text-lg font-bold text-gray-800 bg-gray-100 p-2">PROPERTY IDENTIFICATION</h3>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <div className="mb-3">
                  <span className="text-gray-600 font-medium">Owner: </span>
                  <span className="text-gray-900">{property.owner}</span>
                </div>
                <div className="mb-3">
                  <span className="text-gray-600 font-medium">Property Address: </span>
                  <span className="text-gray-900">{property.address}, {property.city}, {property.state} {property.zip}</span>
                </div>
                <div className="mb-3">
                  <span className="text-gray-600 font-medium">Legal Description: </span>
                  <span className="text-gray-900">Lot {property.id}, Township {property.township}, Section {property.section}</span>
                </div>
              </div>
              <div>
                <div className="mb-3">
                  <span className="text-gray-600 font-medium">Parcel ID: </span>
                  <span className="text-gray-900">{property.parcelId}</span>
                </div>
                <div className="mb-3">
                  <span className="text-gray-600 font-medium">Hood Code: </span>
                  <span className="text-gray-900">{property.hoodCode}</span>
                </div>
                <div className="mb-3">
                  <span className="text-gray-600 font-medium">Region: </span>
                  <span className="text-gray-900">{property.region}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Property Characteristics */}
          <div className="mt-6">
            <h3 className="text-lg font-bold text-gray-800 bg-gray-100 p-2">PROPERTY CHARACTERISTICS</h3>
            <div className="grid grid-cols-3 gap-4 mt-3">
              <div>
                <div className="mb-3">
                  <span className="text-gray-600 font-medium">Property Type: </span>
                  <span className="text-gray-900">{property.type}</span>
                </div>
                <div className="mb-3">
                  <span className="text-gray-600 font-medium">Year Built: </span>
                  <span className="text-gray-900">{property.yearBuilt}</span>
                </div>
                <div className="mb-3">
                  <span className="text-gray-600 font-medium">Lot Size: </span>
                  <span className="text-gray-900">{property.lotSize}</span>
                </div>
              </div>
              <div>
                <div className="mb-3">
                  <span className="text-gray-600 font-medium">Building Size: </span>
                  <span className="text-gray-900">{property.squareFeet} sq ft</span>
                </div>
                {property.type === 'Residential' && (
                  <>
                    <div className="mb-3">
                      <span className="text-gray-600 font-medium">Bedrooms: </span>
                      <span className="text-gray-900">{property.bedrooms}</span>
                    </div>
                    <div className="mb-3">
                      <span className="text-gray-600 font-medium">Bathrooms: </span>
                      <span className="text-gray-900">{property.bathrooms}</span>
                    </div>
                  </>
                )}
              </div>
              <div>
                <div className="mb-3">
                  <span className="text-gray-600 font-medium">Quality: </span>
                  <span className="text-gray-900">{property.quality}</span>
                </div>
                <div className="mb-3">
                  <span className="text-gray-600 font-medium">Condition: </span>
                  <span className="text-gray-900">{property.condition}</span>
                </div>
                <div className="mb-3">
                  <span className="text-gray-600 font-medium">Status: </span>
                  <span className="text-gray-900">{property.status}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Valuation Information */}
          <div className="mt-6">
            <h3 className="text-lg font-bold text-gray-800 bg-gray-100 p-2">VALUATION INFORMATION</h3>
            <table className="w-full mt-3 border-collapse">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left py-2 font-medium text-gray-600">Assessment Year</th>
                  <th className="text-right py-2 font-medium text-gray-600">Land Value</th>
                  <th className="text-right py-2 font-medium text-gray-600">Improvement Value</th>
                  <th className="text-right py-2 font-medium text-gray-600">Total Value</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="py-2 text-gray-900">{property.lastAssessed.split('-')[0]}</td>
                  <td className="py-2 text-gray-900 text-right">{property.landValue}</td>
                  <td className="py-2 text-gray-900 text-right">{property.improvementValue}</td>
                  <td className="py-2 text-gray-900 text-right font-medium">{property.value}</td>
                </tr>
                {property.history && property.history.slice(1, 4).map((item: any, index: number) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="py-2 text-gray-900">{item.date.split('-')[0]}</td>
                    <td className="py-2 text-gray-900 text-right">
                      {/* For demo purposes, calculating approximate values */}
                      {`$${Math.round(parseInt(item.value.replace(/[$,]/g, '')) * 0.22).toLocaleString()}`}
                    </td>
                    <td className="py-2 text-gray-900 text-right">
                      {`$${Math.round(parseInt(item.value.replace(/[$,]/g, '')) * 0.78).toLocaleString()}`}
                    </td>
                    <td className="py-2 text-gray-900 text-right font-medium">{item.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Improvements */}
          <div className="mt-6">
            <h3 className="text-lg font-bold text-gray-800 bg-gray-100 p-2">IMPROVEMENTS</h3>
            <table className="w-full mt-3 border-collapse">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left py-2 font-medium text-gray-600">Type</th>
                  <th className="text-left py-2 font-medium text-gray-600">Size</th>
                  <th className="text-left py-2 font-medium text-gray-600">Year Built</th>
                  <th className="text-right py-2 font-medium text-gray-600">Value</th>
                </tr>
              </thead>
              <tbody>
                {property.improvements && property.improvements.map((improvement: any, index: number) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="py-2 text-gray-900">{improvement.type}</td>
                    <td className="py-2 text-gray-900">{improvement.size}</td>
                    <td className="py-2 text-gray-900">{improvement.yearBuilt}</td>
                    <td className="py-2 text-gray-900 text-right">{improvement.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Additional Information */}
          <div className="mt-6">
            <h3 className="text-lg font-bold text-gray-800 bg-gray-100 p-2">ADDITIONAL INFORMATION</h3>
            <div className="mt-3 border border-gray-200 p-4 bg-gray-50">
              <p className="text-gray-700 whitespace-pre-line">{property.notes}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-10 pt-4 border-t border-gray-300">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">
                  This information is provided by the Benton County Assessor's Office. For questions or clarifications,
                  please contact our office at (509) 786-5600.
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Document ID: BC-{property.parcelId}-{Date.now().toString().substring(6)}</p>
                <p className="text-sm text-gray-600">Page 1 of 1</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PropertyRecordCard;
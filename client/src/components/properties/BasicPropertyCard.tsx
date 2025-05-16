import React from 'react';
import { 
  Building, 
  Users, 
  Calendar, 
  DollarSign, 
  MapPin, 
  Home,
  Printer,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface Property {
  id: number;
  address: string;
  city: string;
  state: string;
  zip: string;
  parcelNumber: string;
  ownerName: string;
  propertyType: string;
  yearBuilt: number;
  assessedValue: number;
  squareFeet: number;
  bedrooms: number;
  bathrooms: number;
  latitude?: number;
  longitude?: number;
  [key: string]: any;
}

interface BasicPropertyCardProps {
  property: Property;
  onClose: () => void;
}

const BasicPropertyCard: React.FC<BasicPropertyCardProps> = ({ property, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Card className="max-w-4xl mx-auto bg-white print:shadow-none print:border-none">
      <CardHeader className="border-b border-gray-200 print:border-gray-300 flex flex-row justify-between items-center">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <img 
              src="/benton-county-logo.png" 
              alt="Benton County Logo" 
              className="w-16 h-16 object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://via.placeholder.com/64?text=BC';
              }}
            />
            <div>
              <h1 className="text-xl font-semibold text-blue-800">Benton County</h1>
              <p className="text-sm text-gray-500">Property Record Card</p>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">{property.parcelNumber}</CardTitle>
        </div>
        <div className="print:hidden flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-1" />
            Print
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-6 pb-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold text-blue-700 border-b border-blue-100 pb-1 mb-3">
                Property Information
              </h3>
              <div className="space-y-2">
                <div className="flex">
                  <div className="w-10 flex-shrink-0 flex items-start justify-center pt-0.5">
                    <MapPin className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-medium">Location</p>
                    <p className="text-gray-700">{property.address}</p>
                    <p className="text-gray-700">{property.city}, {property.state} {property.zip}</p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="w-10 flex-shrink-0 flex items-start justify-center pt-0.5">
                    <Home className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-medium">Property Type</p>
                    <p className="text-gray-700">{property.propertyType || 'Residential'}</p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="w-10 flex-shrink-0 flex items-start justify-center pt-0.5">
                    <Calendar className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-medium">Year Built</p>
                    <p className="text-gray-700">{property.yearBuilt}</p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold text-blue-700 border-b border-blue-100 pb-1 mb-3">
                Owner & Value
              </h3>
              <div className="space-y-2">
                <div className="flex">
                  <div className="w-10 flex-shrink-0 flex items-start justify-center pt-0.5">
                    <Users className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-medium">Owner</p>
                    <p className="text-gray-700">{property.ownerName}</p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="w-10 flex-shrink-0 flex items-start justify-center pt-0.5">
                    <DollarSign className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-medium">Assessed Value</p>
                    <p className="text-gray-700">${property.assessedValue?.toLocaleString() || 'Not Available'}</p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="w-10 flex-shrink-0 flex items-start justify-center pt-0.5">
                    <Building className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-medium">Building Details</p>
                    <p className="text-gray-700">{property.squareFeet?.toLocaleString() || 'N/A'} sq ft • {property.bedrooms || 'N/A'} bed • {property.bathrooms || 'N/A'} bath</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        <section className="mt-8">
          <h3 className="text-lg font-semibold text-blue-700 border-b border-blue-100 pb-1 mb-3">
            Assessment History
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-blue-50">
                  <th className="py-2 px-3 text-left text-blue-800 font-medium border border-blue-100">Year</th>
                  <th className="py-2 px-3 text-left text-blue-800 font-medium border border-blue-100">Land</th>
                  <th className="py-2 px-3 text-left text-blue-800 font-medium border border-blue-100">Improvements</th>
                  <th className="py-2 px-3 text-left text-blue-800 font-medium border border-blue-100">Total</th>
                </tr>
              </thead>
              <tbody>
                {/* Mock history data for demonstration */}
                <tr>
                  <td className="py-2 px-3 border border-blue-100">2025</td>
                  <td className="py-2 px-3 border border-blue-100">${(property.assessedValue * 0.3)?.toLocaleString() || 'N/A'}</td>
                  <td className="py-2 px-3 border border-blue-100">${(property.assessedValue * 0.7)?.toLocaleString() || 'N/A'}</td>
                  <td className="py-2 px-3 border border-blue-100">${property.assessedValue?.toLocaleString() || 'N/A'}</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 border border-blue-100">2024</td>
                  <td className="py-2 px-3 border border-blue-100">${Math.round(property.assessedValue * 0.28)?.toLocaleString() || 'N/A'}</td>
                  <td className="py-2 px-3 border border-blue-100">${Math.round(property.assessedValue * 0.67)?.toLocaleString() || 'N/A'}</td>
                  <td className="py-2 px-3 border border-blue-100">${Math.round(property.assessedValue * 0.95)?.toLocaleString() || 'N/A'}</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 border border-blue-100">2023</td>
                  <td className="py-2 px-3 border border-blue-100">${Math.round(property.assessedValue * 0.26)?.toLocaleString() || 'N/A'}</td>
                  <td className="py-2 px-3 border border-blue-100">${Math.round(property.assessedValue * 0.64)?.toLocaleString() || 'N/A'}</td>
                  <td className="py-2 px-3 border border-blue-100">${Math.round(property.assessedValue * 0.9)?.toLocaleString() || 'N/A'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </CardContent>

      <CardFooter className="pt-2 pb-6 text-xs text-gray-500 border-t border-gray-200 mt-4">
        <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
          <div>
            <p>Benton County Assessor's Office</p>
            <p>Document generated on {new Date().toLocaleDateString()}</p>
          </div>
          <div className="text-right">
            <p>Parcel ID: {property.parcelNumber}</p>
            <p>Property ID: {property.id}</p>
          </div>
        </div>
      </CardFooter>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .card,
          .card * {
            visibility: visible;
          }
          .card {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </Card>
  );
};

export default BasicPropertyCard;
import React from 'react';
import { BentonColors } from '@/components/BentonBranding';
import { ExternalLink, Info, Phone, Mail, Shield } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="mt-auto">
      {/* Main footer content */}
      <div className="bg-[#243E4D] text-white py-6">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Column 1: About */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Benton County</h3>
              <p className="text-sm text-gray-300 mb-4">
                Building Cost Assessment System provides accurate cost estimations for construction projects
                within Benton County, Washington.
              </p>
              <div className="flex items-center space-x-2">
                <button className="bg-[#3CAB36] hover:bg-[#3CAB36]/90 text-white text-xs px-3 py-1.5 rounded flex items-center">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Visit Official Website
                </button>
              </div>
            </div>

            {/* Column 2: Contact */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Contact</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-[#29B7D3]" />
                  <span>(509) 736-3080</span>
                </div>
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-[#29B7D3]" />
                  <span>example@co.benton.wa.us</span>
                </div>
                <div className="flex items-center">
                  <Info className="h-4 w-4 mr-2 text-[#29B7D3]" />
                  <span>7122 W. Okanogan Place Kennewick, WA 99336</span>
                </div>
              </div>
            </div>

            {/* Column 3: Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li className="hover:text-[#29B7D3] cursor-pointer">Dashboard</li>
                <li className="hover:text-[#29B7D3] cursor-pointer">Cost Calculator</li>
                <li className="hover:text-[#29B7D3] cursor-pointer">Benchmarking</li>
                <li className="hover:text-[#29B7D3] cursor-pointer">Reports</li>
                <li className="hover:text-[#29B7D3] cursor-pointer">Help & Documentation</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright footer */}
      <div className="bg-[#1A2C38] text-white py-3">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center text-sm text-gray-400">
              <Shield className="h-4 w-4 mr-2" />
              <span>© {new Date().getFullYear()} Benton County Washington. All rights reserved.</span>
            </div>
            <div className="mt-2 md:mt-0">
              <ul className="flex space-x-4 text-xs text-gray-400">
                <li className="hover:text-[#29B7D3] cursor-pointer">Privacy Policy</li>
                <li className="hover:text-[#29B7D3] cursor-pointer">Terms of Service</li>
                <li className="hover:text-[#29B7D3] cursor-pointer">Accessibility</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
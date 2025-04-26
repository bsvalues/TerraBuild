import React from 'react';
import { Link } from 'wouter';
import { HelpCircle, FileText, Mail, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="border-t border-gray-200 bg-white/50 backdrop-blur-sm py-6 px-4 md:px-6">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-md bg-gradient-to-r from-[#29B7D3] to-[#243E4D] flex items-center justify-center mr-2">
                <span className="text-white font-bold text-lg">TB</span>
              </div>
              <span className="text-xl font-bold text-[#243E4D]">TerraBuild</span>
            </div>
            <p className="text-sm text-gray-600">
              Benton County's advanced building cost assessment platform, designed for accuracy and efficiency.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium text-[#243E4D] mb-3">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/documentation" className="text-sm text-gray-600 hover:text-[#29B7D3] transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/tutorials" className="text-sm text-gray-600 hover:text-[#29B7D3] transition-colors">
                  Tutorials
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-sm text-gray-600 hover:text-[#29B7D3] transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/resources" className="text-sm text-gray-600 hover:text-[#29B7D3] transition-colors">
                  Resource Library
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-[#243E4D] mb-3">Features</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/calculator" className="text-sm text-gray-600 hover:text-[#29B7D3] transition-colors">
                  Cost Calculator
                </Link>
              </li>
              <li>
                <Link href="/properties" className="text-sm text-gray-600 hover:text-[#29B7D3] transition-colors">
                  Property Database
                </Link>
              </li>
              <li>
                <Link href="/analytics" className="text-sm text-gray-600 hover:text-[#29B7D3] transition-colors">
                  Analytics Dashboard
                </Link>
              </li>
              <li>
                <Link href="/ai-tools" className="text-sm text-gray-600 hover:text-[#29B7D3] transition-colors">
                  AI Tools
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-[#243E4D] mb-3">Help & Support</h3>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start text-sm h-9 border-gray-200">
                <HelpCircle className="h-4 w-4 mr-2" />
                <span>Help Center</span>
              </Button>
              <Button variant="outline" className="w-full justify-start text-sm h-9 border-gray-200">
                <FileText className="h-4 w-4 mr-2" />
                <span>Submit a Ticket</span>
              </Button>
              <Button variant="outline" className="w-full justify-start text-sm h-9 border-gray-200">
                <Mail className="h-4 w-4 mr-2" />
                <span>Contact Support</span>
              </Button>
            </div>
          </div>
        </div>
        
        <Separator />
        
        <div className="flex flex-col md:flex-row justify-between items-center mt-6 text-sm text-gray-500">
          <div className="mb-4 md:mb-0">
            © {currentYear} TerraBuild - Benton County Property Assessment Platform
          </div>
          <div className="flex space-x-6">
            <Link href="/privacy-policy" className="hover:text-[#29B7D3] transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms-of-service" className="hover:text-[#29B7D3] transition-colors">
              Terms of Service
            </Link>
            <a 
              href="https://github.com/benton-county/terrabuild" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center hover:text-[#29B7D3] transition-colors"
            >
              <Github className="h-4 w-4 mr-1" />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
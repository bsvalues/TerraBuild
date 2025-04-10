import React from "react";
import { Link } from "wouter";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-border py-6 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-muted-foreground">
              &copy; {currentYear} Benton County Building Cost System. All rights reserved.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <Link href="/documentation" className="hover:text-[#47AD55] transition-colors">
              Documentation
            </Link>
            <Link href="/tutorials" className="hover:text-[#47AD55] transition-colors">
              Tutorials
            </Link>
            <Link href="/faq" className="hover:text-[#47AD55] transition-colors">
              FAQ
            </Link>
            <Link href="/contact" className="hover:text-[#47AD55] transition-colors">
              Contact
            </Link>
            <a 
              href="https://www.co.benton.wa.us/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-[#47AD55] transition-colors"
            >
              Benton County Website
            </a>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-border text-xs text-center text-muted-foreground">
          <p>The Building Cost Building System is designed for Benton County Washington assessors and property managers.</p>
          <p className="mt-1">For technical support, please contact the IT department.</p>
        </div>
      </div>
    </footer>
  );
}
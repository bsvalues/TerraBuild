import React from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { SimpleTopMenu } from '@/components/layout/SimpleTopMenu';
import { ArrowRight, BarChart2, Building, Calculator, Database, MapPin } from 'lucide-react';

export default function LandingPageSimple() {
  const [_, navigate] = useLocation();
  
  return (
    <div className="flex min-h-screen flex-col">
      <SimpleTopMenu />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-background to-muted">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                    Benton County Building Cost Assessment System
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Advanced property assessment with AI-powered cost calculations, 
                    regional analysis, and comprehensive building assessment tools.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button onClick={() => navigate('/calculator')} className="inline-flex h-10 items-center">
                    Start Calculating
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/documentation')}>
                    Learn More
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="bg-foreground/5 border rounded-lg p-8 shadow-lg">
                  <div className="aspect-video w-full max-w-[500px] overflow-hidden rounded-lg">
                    <img
                      src="https://images.unsplash.com/photo-1613977257365-aaae5a9817ff?q=80&w=1074&auto=format&fit=crop"
                      alt="Benton County Vineyard"
                      className="object-cover w-full h-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-primary px-3 py-1 text-sm text-primary-foreground">
                  Features
                </div>
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                  Comprehensive Assessment Tools
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl">
                  Our platform offers a suite of powerful tools for property assessment professionals.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                <Calculator className="h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold">Cost Calculator</h3>
                <p className="text-center text-muted-foreground">
                  Precise building cost calculations with regional adjustments and material breakdowns.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                <MapPin className="h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold">Geo Assessment</h3>
                <p className="text-center text-muted-foreground">
                  Location-based property analysis with geographical context and regional comparisons.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                <Building className="h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold">Property Analysis</h3>
                <p className="text-center text-muted-foreground">
                  Detailed property records with improvement tracking and historical data.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                <Database className="h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold">Data Import</h3>
                <p className="text-center text-muted-foreground">
                  Seamless import of property data and cost matrices from Excel and other formats.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                <BarChart2 className="h-12 w-12 text-primary" />
                <h3 className="text-xl font-bold">Analytics</h3>
                <p className="text-center text-muted-foreground">
                  Advanced visualizations and data analysis for cost trends and regional comparisons.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-12 w-12 text-primary"
                >
                  <path d="M12 2v8"></path>
                  <path d="m4.93 10.93 1.41 1.41"></path>
                  <path d="M2 18h2"></path>
                  <path d="M20 18h2"></path>
                  <path d="m19.07 10.93-1.41 1.41"></path>
                  <path d="M22 22H2"></path>
                  <path d="m16 6-4 4-4-4"></path>
                  <path d="M16 18a4 4 0 0 0-8 0"></path>
                </svg>
                <h3 className="text-xl font-bold">AI Tools</h3>
                <p className="text-center text-muted-foreground">
                  AI-powered cost wizards, what-if scenarios, and predictive analysis tools.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Ready to get started?
                </h2>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  Access the most advanced building cost assessment tools available for Benton County.
                </p>
              </div>
              <div className="w-full max-w-sm space-y-2">
                <div className="flex flex-col gap-2 min-[400px]:flex-row justify-center">
                  <Button onClick={() => navigate('/dashboard')} size="lg">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full border-t justify-center items-center">
        <p className="text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Benton County Building Cost System. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
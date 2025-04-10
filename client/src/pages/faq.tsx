import React from "react";
import MainContent from "@/components/layout/MainContent";
import LayoutWrapper from "@/components/layout/LayoutWrapper";
import { motion } from "framer-motion";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import bentonSeal from '@assets/BC.png';

export default function FAQPage() {
  const faqCategories = [
    {
      category: "General Questions",
      items: [
        {
          question: "What is the Benton County Building Cost System?",
          answer: "The Benton County Building Cost System (BCBS) is the official tool used by county assessors, property managers, and construction professionals to accurately estimate building costs across Benton County, Washington. It uses real construction data to provide accurate cost estimations based on building type, size, and location."
        },
        {
          question: "Who can access and use the BCBS?",
          answer: "The BCBS is an open-access system available to all county officials, property developers, construction managers, and general public in Benton County. No authentication is required to use the basic features of the system."
        },
        {
          question: "How accurate are the cost estimates?",
          answer: "The cost estimates provided by BCBS have a documented accuracy rate of 97% when compared to actual construction costs. The system is regularly updated with the latest cost data to ensure estimates remain accurate and relevant."
        },
        {
          question: "How often is the cost data updated?",
          answer: "The cost matrix data is updated annually with the latest construction costs. Special updates may be made mid-year if there are significant changes in material or labor costs that would affect accuracy."
        }
      ]
    },
    {
      category: "Using the Calculator",
      items: [
        {
          question: "How do I use the cost calculator?",
          answer: "To use the cost calculator, select the building type, enter the square footage, choose the region within Benton County, and optionally specify additional parameters like quality grade. The system will instantly provide a cost estimate based on these inputs."
        },
        {
          question: "What building types are supported?",
          answer: "The BCBS supports over 25 different building types including residential (single-family, multi-family), commercial (office, retail, warehouse), industrial, agricultural, and special purpose buildings."
        },
        {
          question: "Can I save my calculation results?",
          answer: "Yes, calculation results can be saved as projects for later reference. You can also export results in multiple formats including PDF, Excel, and CSV."
        },
        {
          question: "How do I interpret the cost breakdown?",
          answer: "The cost breakdown shows the estimated costs for different components of the building including foundation, structure, electrical, plumbing, HVAC, and finishes. This helps understand where costs are concentrated in a particular building type."
        }
      ]
    },
    {
      category: "Data Import/Export",
      items: [
        {
          question: "How can I import cost matrix data?",
          answer: "Cost matrix data can be imported using the Data Import tool. The system accepts Excel files formatted according to the Benton County cost matrix template. The data import tool includes validation to ensure data integrity."
        },
        {
          question: "What export formats are supported?",
          answer: "The system supports exporting data in multiple formats including PDF (for reports), Excel (for data analysis), CSV (for data integration), and direct printing."
        },
        {
          question: "Can I automate data synchronization?",
          answer: "Yes, the system supports automated FTP file synchronization for organizations that need to regularly update cost data from other systems. This can be configured in the Data Connections section."
        },
        {
          question: "Does the system support data anonymization for exports?",
          answer: "Yes, the export functionality includes options for data anonymization, which removes or masks sensitive information while preserving the valuable cost data for analysis or sharing."
        }
      ]
    },
    {
      category: "Technical Support",
      items: [
        {
          question: "Who do I contact for technical support?",
          answer: "Technical support is available through the Benton County Assessment Department. You can contact support via email at support@bentoncounty.wa.gov or by phone at (509) 736-3086."
        },
        {
          question: "Is there an API available for system integration?",
          answer: "Yes, the BCBS provides a comprehensive API that allows integration with other systems. API documentation is available in the Documentation section of the website."
        },
        {
          question: "How do I report a bug or suggest a feature?",
          answer: "Bugs and feature suggestions can be submitted through the Feedback form available in the system or by directly contacting the support team."
        },
        {
          question: "Is training available for new users?",
          answer: "Yes, Benton County offers regular training sessions for new users. Additionally, the Tutorials section provides step-by-step guides for using all features of the system."
        }
      ]
    }
  ];

  return (
    <LayoutWrapper>
      <MainContent title="FAQ">
        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 text-center"
          >
            <img 
              src={bentonSeal} 
              alt="Benton County Seal" 
              className="h-16 w-16 mx-auto mb-4"
            />
            <h1 className="text-3xl font-bold text-[#243E4D] mb-2">
              Frequently Asked Questions
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Find answers to common questions about the Benton County Building Cost System
            </p>
          </motion.div>
          
          <motion.div 
            className="mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="relative">
              <Input 
                type="text"
                placeholder="Search for answers..." 
                className="pl-10 pr-4 py-2 border-2 focus:border-[#47AD55]"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Button 
                className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-[#47AD55] hover:bg-[#3a8c45] h-8"
              >
                Search
              </Button>
            </div>
          </motion.div>
          
          <div className="max-w-3xl mx-auto">
            {faqCategories.map((category, categoryIndex) => (
              <motion.div 
                key={categoryIndex}
                className="mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 + categoryIndex * 0.1 }}
              >
                <h2 className="text-2xl font-bold text-[#243E4D] mb-4">
                  {category.category}
                </h2>
                <Accordion type="single" collapsible className="bg-white rounded-lg shadow-sm">
                  {category.items.map((item, itemIndex) => (
                    <AccordionItem key={itemIndex} value={`${categoryIndex}-${itemIndex}`}>
                      <AccordionTrigger className="hover:text-[#47AD55] px-4 text-left">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4 text-muted-foreground">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </motion.div>
            ))}
          </div>
          
          <motion.div 
            className="max-w-3xl mx-auto mt-12 p-6 bg-[#47AD55]/10 rounded-lg border border-[#47AD55]/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <h2 className="text-xl font-semibold text-[#243E4D] mb-3">
              Still have questions?
            </h2>
            <p className="text-muted-foreground mb-4">
              If you can't find the answer you're looking for, please contact our support team.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button 
                className="bg-[#243E4D] hover:bg-[#1c313d]"
                onClick={() => window.location.href = "mailto:support@bentoncounty.wa.gov"}
              >
                Contact Support
              </Button>
              <Button 
                variant="outline" 
                className="border-[#243E4D] text-[#243E4D] hover:bg-[#243E4D] hover:text-white"
              >
                Submit Feedback
              </Button>
            </div>
          </motion.div>
        </div>
      </MainContent>
    </LayoutWrapper>
  );
}
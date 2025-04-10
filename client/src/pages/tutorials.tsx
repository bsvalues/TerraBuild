import React, { useState } from "react";
import MainContent from "@/components/layout/MainContent";
import LayoutWrapper from "@/components/layout/LayoutWrapper";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, ChartBar, FileSpreadsheet, Map, Building2, Database } from "lucide-react";
import bentonSeal from '@assets/BC.png';
import { Badge } from "@/components/ui/badge";

function TutorialCard({
  title,
  description,
  category,
  duration,
  icon,
  tags
}: {
  title: string;
  description: string;
  category: string;
  duration: string;
  icon: React.ReactNode;
  tags: string[];
}) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="h-full shadow-md hover:shadow-xl transition-shadow duration-300 border-2 border-transparent hover:border-[#47AD55]/20">
        <CardContent className="pt-6">
          <div className="mb-4 flex justify-between items-start">
            <div className="p-3 bg-[#47AD55]/10 rounded-lg">
              {icon}
            </div>
            <Badge className={`${
              category === 'beginner' 
                ? 'bg-blue-500' 
                : category === 'intermediate' 
                  ? 'bg-yellow-500' 
                  : 'bg-red-500'
            }`}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Badge>
          </div>
          <h3 className="text-xl font-semibold text-[#243E4D] mb-2">{title}</h3>
          <p className="text-muted-foreground mb-4">{description}</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.map((tag, index) => (
              <span 
                key={index}
                className="px-2 py-1 bg-[#243E4D]/10 text-[#243E4D] text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#243E4D]/70 text-sm">Duration: {duration}</span>
            <span className="text-[#47AD55] font-medium cursor-pointer hover:underline text-sm">
              Start Tutorial
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function TutorialsPage() {
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  
  const tutorials = [
    {
      title: "Getting Started with BCBS",
      description: "Learn the basics of using the Benton County Building Cost System.",
      category: "beginner",
      duration: "10 min",
      icon: <Calculator className="h-10 w-10 text-[#47AD55]" />,
      tags: ["basics", "calculator"]
    },
    {
      title: "Using the Cost Calculator",
      description: "A detailed walkthrough of the building cost calculator's features.",
      category: "beginner",
      duration: "15 min",
      icon: <Calculator className="h-10 w-10 text-[#47AD55]" />,
      tags: ["calculator", "estimations"]
    },
    {
      title: "Regional Cost Analysis",
      description: "Compare building costs across different regions in Benton County.",
      category: "intermediate",
      duration: "20 min",
      icon: <Map className="h-10 w-10 text-[#47AD55]" />,
      tags: ["regional", "analysis"]
    },
    {
      title: "Understanding Cost Matrix Data",
      description: "Learn how the cost matrix works and what the data means.",
      category: "intermediate",
      duration: "25 min",
      icon: <Database className="h-10 w-10 text-[#47AD55]" />,
      tags: ["data", "matrix"]
    },
    {
      title: "Advanced Visualization Techniques",
      description: "Create powerful visualizations to analyze cost trends and patterns.",
      category: "advanced",
      duration: "30 min",
      icon: <ChartBar className="h-10 w-10 text-[#47AD55]" />,
      tags: ["visualization", "charts"]
    },
    {
      title: "Creating What-If Scenarios",
      description: "Learn to model different building scenarios to analyze cost implications.",
      category: "advanced",
      duration: "25 min",
      icon: <Building2 className="h-10 w-10 text-[#47AD55]" />,
      tags: ["scenarios", "modeling"]
    },
    {
      title: "Data Import and Export",
      description: "How to import cost matrices and export calculation results.",
      category: "intermediate",
      duration: "20 min",
      icon: <FileSpreadsheet className="h-10 w-10 text-[#47AD55]" />,
      tags: ["data", "import", "export"]
    },
    {
      title: "Generating Custom Reports",
      description: "Create customized reports for different stakeholders.",
      category: "advanced",
      duration: "35 min",
      icon: <FileSpreadsheet className="h-10 w-10 text-[#47AD55]" />,
      tags: ["reports", "export"]
    }
  ];
  
  const filteredTutorials = selectedLevel === "all" 
    ? tutorials 
    : tutorials.filter(tutorial => tutorial.category === selectedLevel);

  return (
    <LayoutWrapper>
      <MainContent title="Tutorials">
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
              BCBS Tutorials
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Step-by-step guides to help you get the most out of the Benton County Building Cost System
            </p>
          </motion.div>

          <div className="mb-8">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold mb-4">Filter by Level:</h2>
              <div className="flex flex-wrap gap-3">
                <Badge 
                  variant={selectedLevel === "all" ? "default" : "outline"}
                  className={`cursor-pointer px-4 py-2 text-sm font-medium ${selectedLevel === "all" ? "bg-[#47AD55]" : "hover:bg-[#47AD55]/10"}`}
                  onClick={() => setSelectedLevel("all")}
                >
                  All Tutorials
                </Badge>
                <Badge 
                  variant={selectedLevel === "beginner" ? "default" : "outline"}
                  className={`cursor-pointer px-4 py-2 text-sm font-medium ${selectedLevel === "beginner" ? "bg-[#47AD55]" : "hover:bg-[#47AD55]/10"}`}
                  onClick={() => setSelectedLevel("beginner")}
                >
                  Beginner
                </Badge>
                <Badge 
                  variant={selectedLevel === "intermediate" ? "default" : "outline"}
                  className={`cursor-pointer px-4 py-2 text-sm font-medium ${selectedLevel === "intermediate" ? "bg-[#47AD55]" : "hover:bg-[#47AD55]/10"}`}
                  onClick={() => setSelectedLevel("intermediate")}
                >
                  Intermediate
                </Badge>
                <Badge 
                  variant={selectedLevel === "advanced" ? "default" : "outline"}
                  className={`cursor-pointer px-4 py-2 text-sm font-medium ${selectedLevel === "advanced" ? "bg-[#47AD55]" : "hover:bg-[#47AD55]/10"}`}
                  onClick={() => setSelectedLevel("advanced")}
                >
                  Advanced
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTutorials.map((tutorial, index) => (
              <TutorialCard
                key={index}
                title={tutorial.title}
                description={tutorial.description}
                category={tutorial.category}
                duration={tutorial.duration}
                icon={tutorial.icon}
                tags={tutorial.tags}
              />
            ))}
          </div>
        </div>
      </MainContent>
    </LayoutWrapper>
  );
}
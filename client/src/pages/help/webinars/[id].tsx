import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Clock,
  Calendar,
  User,
  ChevronLeft,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Download,
  MessageSquare,
  ThumbsUp,
  BarChart,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Link, useParams } from 'wouter';

// Webinar data (would normally be fetched from API)
const webinarData = [
  {
    id: "1",
    title: "Advanced Regional Cost Analysis",
    duration: "45:22",
    date: "May 2, 2025",
    instructor: "Sarah Johnson",
    category: "Regional Analysis",
    level: "Advanced",
    description: "This comprehensive webinar explores advanced techniques for analyzing regional cost variations across Benton County. Learn how to leverage township/range coordinates, hood codes, and TCAs to perform detailed cost comparisons and identify valuation patterns.",
    viewCount: 342,
    resources: [
      { name: "Presentation Slides", size: "4.2 MB", type: "pdf" },
      { name: "Regional Codes Reference", size: "1.8 MB", type: "xlsx" },
      { name: "Analysis Worksheet", size: "520 KB", type: "xlsx" }
    ],
    tags: ["regional", "cost-analysis", "hood-codes", "township-range"],
    transcript: true,
    hasQuiz: true
  },
  {
    id: "2",
    title: "Property Data Quality Management",
    duration: "38:15",
    date: "May 10, 2025",
    instructor: "Michael Chen",
    category: "Data Quality",
    level: "Intermediate",
    description: "Learn essential techniques for ensuring data quality in property records. This webinar covers validation methods, data cleaning processes, and how to use the Data Quality Agent to identify and resolve issues with property data integrity.",
    viewCount: 287,
    resources: [
      { name: "Quality Checklist", size: "1.2 MB", type: "pdf" },
      { name: "Validation Examples", size: "3.5 MB", type: "pdf" },
      { name: "Sample Scripts", size: "45 KB", type: "zip" }
    ],
    tags: ["data-quality", "validation", "data-integrity", "quality-agent"],
    transcript: true,
    hasQuiz: false
  },
  {
    id: "3",
    title: "Working with AI Agents",
    duration: "52:40",
    date: "May 15, 2025",
    instructor: "Dr. Alicia Martinez",
    category: "AI Agents",
    level: "Advanced",
    description: "This in-depth webinar demonstrates how to effectively use the AI agent system for automated analysis and decision support. Learn how to communicate with agents, interpret their outputs, and integrate their recommendations into your valuation workflow.",
    viewCount: 198,
    resources: [
      { name: "Agent Reference Guide", size: "5.8 MB", type: "pdf" },
      { name: "Protocol Documentation", size: "2.1 MB", type: "pdf" },
      { name: "Command Examples", size: "65 KB", type: "txt" }
    ],
    tags: ["ai", "agents", "automation", "analysis"],
    transcript: true,
    hasQuiz: true
  }
];

// Helper function to format time from seconds
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const WebinarViewPage = () => {
  const [params] = useParams();
  const webinarId = params?.id;
  
  // Find the requested webinar (would normally fetch from API)
  const webinar = webinarData.find(w => w.id === webinarId) || webinarData[0];
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration] = useState(45 * 60 + 22); // 45:22 in seconds
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedTab, setSelectedTab] = useState("overview");
  
  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };
  
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  // For demo purposes, simulate video progress when playing
  React.useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (isPlaying && currentTime < duration) {
      interval = setInterval(() => {
        setCurrentTime(prev => Math.min(prev + 1, duration));
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isPlaying, currentTime, duration]);
  
  // Recommended webinars (exclude current one)
  const recommendations = webinarData.filter(w => w.id !== webinarId).slice(0, 2);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/help/webinars">
          <Button variant="outline" className="text-blue-200 border-blue-700">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Webinars
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-blue-100">{webinar.title}</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Video Player */}
          <div className="bg-blue-950 rounded-md overflow-hidden relative">
            <div className="aspect-video flex items-center justify-center bg-blue-950/80">
              <div className="text-blue-200 text-center">
                <Play className="h-20 w-20 text-blue-500/70 mx-auto mb-4" />
                <p className="text-lg font-medium">Interactive video player would appear here</p>
                <p className="text-sm text-blue-400 mt-1">Click the play button below to simulate playback</p>
              </div>
            </div>
            
            {/* Video Controls */}
            <div className="p-3 bg-blue-900/90 border-t border-blue-800/60">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-blue-200 hover:text-blue-100 hover:bg-blue-800/50"
                    onClick={togglePlay}
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  
                  <div className="text-xs text-blue-300 min-w-[80px]">
                    {formatTime(currentTime)} / {webinar.duration}
                  </div>
                  
                  <div className="flex-grow">
                    <Progress value={(currentTime / duration) * 100} className="h-2" />
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-blue-200 hover:text-blue-100 hover:bg-blue-800/50"
                    onClick={toggleMute}
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                  
                  <div className="w-24 hidden md:block">
                    <Slider
                      value={[isMuted ? 0 : volume]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={(value) => setVolume(value[0])}
                      className="h-2"
                    />
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-blue-200 hover:text-blue-100 hover:bg-blue-800/50"
                  >
                    <Maximize className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Video Info Tabs */}
          <Card className="bg-blue-900/30 border-blue-800/40">
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
              <div className="px-4 pt-4">
                <TabsList className="bg-blue-900/50 border border-blue-800/40 w-full grid-cols-4">
                  <TabsTrigger value="overview" className="data-[state=active]:bg-blue-800/50">
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="resources" className="data-[state=active]:bg-blue-800/50">
                    Resources
                  </TabsTrigger>
                  <TabsTrigger value="transcript" className="data-[state=active]:bg-blue-800/50">
                    Transcript
                  </TabsTrigger>
                  {webinar.hasQuiz && (
                    <TabsTrigger value="quiz" className="data-[state=active]:bg-blue-800/50">
                      Quiz
                    </TabsTrigger>
                  )}
                </TabsList>
              </div>
              
              <TabsContent value="overview" className="p-4 pt-2">
                <h2 className="text-lg font-medium text-blue-100 mb-2">About This Webinar</h2>
                <p className="text-blue-200 mb-4">{webinar.description}</p>
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <User className="h-4 w-4 text-blue-400 mt-0.5" />
                      <div>
                        <div className="text-sm text-blue-300">Instructor</div>
                        <div className="text-blue-100">{webinar.instructor}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 text-blue-400 mt-0.5" />
                      <div>
                        <div className="text-sm text-blue-300">Date</div>
                        <div className="text-blue-100">{webinar.date}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 text-blue-400 mt-0.5" />
                      <div>
                        <div className="text-sm text-blue-300">Duration</div>
                        <div className="text-blue-100">{webinar.duration}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <BarChart className="h-4 w-4 text-blue-400 mt-0.5" />
                      <div>
                        <div className="text-sm text-blue-300">Level</div>
                        <div className="text-blue-100">{webinar.level}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="text-sm text-blue-300 mb-1">Categories & Tags</div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-blue-700/50 hover:bg-blue-700/70">{webinar.category}</Badge>
                    {webinar.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="border-blue-700/50 text-blue-200">
                        {tag.replace(/-/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="resources" className="p-4 pt-2">
                <h2 className="text-lg font-medium text-blue-100 mb-2">Downloadable Resources</h2>
                <p className="text-blue-200 mb-4">
                  The following materials are available to download for this webinar:
                </p>
                
                <div className="space-y-3 mt-4">
                  {webinar.resources.map((resource, index) => (
                    <div key={index} className="bg-blue-900/50 border border-blue-800/40 rounded-md p-3 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded flex items-center justify-center ${
                          resource.type === 'pdf' ? 'bg-red-900/30 text-red-300' :
                          resource.type === 'xlsx' ? 'bg-green-900/30 text-green-300' :
                          'bg-blue-900/30 text-blue-300'
                        }`}>
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-blue-100">{resource.name}</div>
                          <div className="text-sm text-blue-400">{resource.size} • {resource.type.toUpperCase()}</div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="border-blue-700 text-blue-200">
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="transcript" className="p-4 pt-2">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-blue-100">Webinar Transcript</h2>
                  <Button variant="outline" size="sm" className="border-blue-700 text-blue-200">
                    <Download className="h-3 w-3 mr-1" />
                    Download Full Transcript
                  </Button>
                </div>
                
                <div className="bg-blue-900/20 border border-blue-800/40 rounded-md p-3 h-[300px] overflow-y-auto">
                  <div className="space-y-4 text-blue-200">
                    <div>
                      <div className="text-xs text-blue-400 mb-1">00:00:15</div>
                      <p>Welcome to today's webinar on {webinar.title}. I'm {webinar.instructor}, and I'll be your guide through this comprehensive session.</p>
                    </div>
                    
                    <div>
                      <div className="text-xs text-blue-400 mb-1">00:01:42</div>
                      <p>Before we dive into the specifics, let's take a moment to understand why this topic is so important for accurate property valuations in Benton County.</p>
                    </div>
                    
                    <div>
                      <div className="text-xs text-blue-400 mb-1">00:03:28</div>
                      <p>Today, we'll cover several key areas including fundamental concepts, advanced techniques, practical applications, and best practices in {webinar.category}.</p>
                    </div>
                    
                    <div>
                      <div className="text-xs text-blue-400 mb-1">00:05:15</div>
                      <p>Let's start with the basics. Understanding the core principles will give us a solid foundation to build upon as we progress to more complex topics.</p>
                    </div>
                    
                    <div>
                      <div className="text-xs text-blue-400 mb-1">00:08:42</div>
                      <p>One of the most important aspects to remember is that all of these techniques are designed to improve accuracy and efficiency in your property assessment workflow.</p>
                    </div>
                    
                    <div className="text-blue-400 text-center italic mt-4">
                      Transcript continues for the full webinar...
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {webinar.hasQuiz && (
                <TabsContent value="quiz" className="p-4 pt-2">
                  <h2 className="text-lg font-medium text-blue-100 mb-2">Knowledge Check</h2>
                  <p className="text-blue-200 mb-4">
                    Test your understanding of the webinar content with this short quiz:
                  </p>
                  
                  <div className="space-y-6 mt-4">
                    <div className="space-y-2">
                      <p className="text-blue-100 font-medium">1. What is the primary advantage of using the {webinar.category} approach?</p>
                      <div className="space-y-2 mt-2">
                        <div className="flex items-center space-x-2">
                          <input type="radio" id="q1a" name="q1" className="accent-blue-400" />
                          <label htmlFor="q1a" className="text-blue-200">Increased processing speed</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="radio" id="q1b" name="q1" className="accent-blue-400" />
                          <label htmlFor="q1b" className="text-blue-200">Higher accuracy in valuations</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="radio" id="q1c" name="q1" className="accent-blue-400" />
                          <label htmlFor="q1c" className="text-blue-200">Simplified user interface</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="radio" id="q1d" name="q1" className="accent-blue-400" />
                          <label htmlFor="q1d" className="text-blue-200">Reduced data requirements</label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-blue-100 font-medium">2. Which feature is NOT directly related to {webinar.title}?</p>
                      <div className="space-y-2 mt-2">
                        <div className="flex items-center space-x-2">
                          <input type="radio" id="q2a" name="q2" className="accent-blue-400" />
                          <label htmlFor="q2a" className="text-blue-200">Data validation checks</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="radio" id="q2b" name="q2" className="accent-blue-400" />
                          <label htmlFor="q2b" className="text-blue-200">Comparative analysis tools</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="radio" id="q2c" name="q2" className="accent-blue-400" />
                          <label htmlFor="q2c" className="text-blue-200">User permission management</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="radio" id="q2d" name="q2" className="accent-blue-400" />
                          <label htmlFor="q2d" className="text-blue-200">Automated reporting</label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-blue-100 font-medium">3. What is the recommended frequency for running a full {webinar.category.toLowerCase()} process?</p>
                      <div className="space-y-2 mt-2">
                        <div className="flex items-center space-x-2">
                          <input type="radio" id="q3a" name="q3" className="accent-blue-400" />
                          <label htmlFor="q3a" className="text-blue-200">Daily</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="radio" id="q3b" name="q3" className="accent-blue-400" />
                          <label htmlFor="q3b" className="text-blue-200">Weekly</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="radio" id="q3c" name="q3" className="accent-blue-400" />
                          <label htmlFor="q3c" className="text-blue-200">Monthly</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="radio" id="q3d" name="q3" className="accent-blue-400" />
                          <label htmlFor="q3d" className="text-blue-200">Quarterly</label>
                        </div>
                      </div>
                    </div>
                    
                    <Button className="w-full bg-blue-700 hover:bg-blue-600">
                      Submit Answers
                    </Button>
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </Card>
        </div>
        
        <div className="space-y-4">
          {/* Recommended Webinars */}
          <Card className="bg-blue-900/30 border-blue-800/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-blue-100">Recommended Webinars</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recommendations.map((recommendedWebinar) => (
                  <div 
                    key={recommendedWebinar.id}
                    className="bg-blue-900/20 rounded-md overflow-hidden border border-blue-800/40 flex flex-col"
                  >
                    <div className="bg-blue-950 relative aspect-video flex items-center justify-center">
                      <Play className="h-8 w-8 text-blue-500/70 absolute" />
                      <Badge className="absolute top-2 left-2" variant="outline">
                        {recommendedWebinar.duration}
                      </Badge>
                    </div>
                    <div className="p-3">
                      <h3 className="text-blue-100 font-medium text-sm leading-tight">
                        {recommendedWebinar.title}
                      </h3>
                      <div className="flex items-center justify-between mt-2 text-xs text-blue-400">
                        <span>{recommendedWebinar.instructor}</span>
                        <span>{recommendedWebinar.viewCount} views</span>
                      </div>
                      
                      <Link href={`/help/webinars/${recommendedWebinar.id}`}>
                        <Button variant="outline" className="w-full mt-2 border-blue-700 text-blue-200">
                          Watch Webinar
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
                
                <Link href="/help/webinars">
                  <Button variant="outline" className="w-full mt-2 border-blue-700 text-blue-200">
                    View All Webinars
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          
          {/* Related Resources */}
          <Card className="bg-blue-900/30 border-blue-800/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-blue-100">Related Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="bg-blue-900/20 p-3 rounded-md border border-blue-800/40">
                  <div className="flex flex-col">
                    <h3 className="text-blue-100 font-medium">Complete Documentation</h3>
                    <p className="text-blue-300 text-sm mt-1">
                      Read the comprehensive guide on {webinar.category}
                    </p>
                    <Link href="/documentation">
                      <Button variant="ghost" size="sm" className="justify-start mt-2 text-blue-400 hover:text-blue-300 hover:bg-blue-900/50 px-2">
                        View Documentation
                      </Button>
                    </Link>
                  </div>
                </div>
                
                <div className="bg-blue-900/20 p-3 rounded-md border border-blue-800/40">
                  <div className="flex flex-col">
                    <h3 className="text-blue-100 font-medium">Hands-on Workshop</h3>
                    <p className="text-blue-300 text-sm mt-1">
                      Join our interactive workshop on {webinar.title.toLowerCase()}
                    </p>
                    <Button variant="ghost" size="sm" className="justify-start mt-2 text-blue-400 hover:text-blue-300 hover:bg-blue-900/50 px-2">
                      Register Now
                    </Button>
                  </div>
                </div>
                
                <div className="bg-blue-900/20 p-3 rounded-md border border-blue-800/40">
                  <div className="flex flex-col">
                    <h3 className="text-blue-100 font-medium">Community Forum</h3>
                    <p className="text-blue-300 text-sm mt-1">
                      Discuss {webinar.category.toLowerCase()} topics with other users
                    </p>
                    <Button variant="ghost" size="sm" className="justify-start mt-2 text-blue-400 hover:text-blue-300 hover:bg-blue-900/50 px-2">
                      Visit Forum
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Progress Tracking */}
          <Card className="bg-blue-900/30 border-blue-800/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-blue-100">Your Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-blue-200">Watching progress</span>
                    <span className="text-blue-300">{Math.round((currentTime / duration) * 100)}%</span>
                  </div>
                  <Progress value={(currentTime / duration) * 100} className="h-2" />
                </div>
                
                <div className="mt-4">
                  <h3 className="text-blue-100 font-medium mb-2">Learning Path</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded-full bg-green-600/70 flex items-center justify-center text-xs text-green-100">✓</div>
                      <span className="text-blue-300 text-sm">Introduction to {webinar.category}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded-full bg-blue-600/70 flex items-center justify-center text-xs text-blue-100">2</div>
                      <span className="text-blue-100 font-medium text-sm">{webinar.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded-full bg-blue-900/50 flex items-center justify-center text-xs text-blue-300">3</div>
                      <span className="text-blue-300 text-sm">Advanced Applications</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded-full bg-blue-900/50 flex items-center justify-center text-xs text-blue-300">4</div>
                      <span className="text-blue-300 text-sm">Expert Certification</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WebinarViewPage;
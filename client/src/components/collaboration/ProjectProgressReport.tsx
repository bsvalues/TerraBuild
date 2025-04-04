import React, { useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { 
  Loader2, 
  Download, 
  FileDown, 
  Share2, 
  Copy, 
  FileText, 
  Check, 
  FileOutput, 
  Building, 
  Calculator, 
  BarChart3, 
  Table, 
  Clock,
  Users,
  ActivityIcon 
} from 'lucide-react';
import { useProjectContext } from '@/contexts/ProjectContext';
import { useCollaboration } from '@/contexts/CollaborationContext';
import ProjectProgressTracker from './ProjectProgressTracker';
import ProjectActivitiesLog from './ProjectActivitiesLog';
import { format, formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { apiRequest } from '@/lib/queryClient';

interface ProjectProgressReportProps {
  projectId: number;
}

// Statistics for the CAMA report
interface ProjectStats {
  totalItems: number;
  costMatrices: number;
  calculations: number;
  scenarios: number;
  reports: number;
  totalActivities: number;
  lastUpdated: string;
  progressPercentage: number;
}

const ProjectProgressReport: React.FC<ProjectProgressReportProps> = ({ projectId }) => {
  const { toast } = useToast();
  const { project } = useProjectContext();
  const { projectMembers, projectItems, comments, sharedLinks } = useCollaboration();
  const [isExporting, setIsExporting] = useState(false);
  const [open, setOpen] = useState(false);
  const [stats, setStats] = useState<ProjectStats>({
    totalItems: 0,
    costMatrices: 0,
    calculations: 0,
    scenarios: 0,
    reports: 0,
    totalActivities: 0,
    lastUpdated: '',
    progressPercentage: 0
  });
  const reportRef = React.useRef<HTMLDivElement>(null);

  // Fetch project activities for report
  const { data: activities } = useQuery({
    queryKey: [`/api/projects/${projectId}/activities`],
    queryFn: () => apiRequest(`/api/projects/${projectId}/activities`),
    enabled: !!projectId && open,
  });
  
  // Calculate statistics for the report when data changes
  useEffect(() => {
    if (project && projectItems && activities) {
      const costMatrices = projectItems.filter(item => item.itemType === 'cost_matrix').length;
      const calculations = projectItems.filter(item => item.itemType === 'calculation').length;
      const scenarios = projectItems.filter(item => item.itemType === 'what_if_scenario').length;
      const reports = projectItems.filter(item => item.itemType === 'report').length;
      
      // Calculate completion based on items, team members, and activities
      const itemWeight = 0.4;
      const memberWeight = 0.3;
      const activityWeight = 0.3;
      
      const itemProgress = projectItems.length > 0 ? Math.min(projectItems.length / 10, 1) : 0;
      const memberProgress = projectMembers.length > 0 ? Math.min(projectMembers.length / 5, 1) : 0;
      const activityProgress = Array.isArray(activities) && activities.length > 0 
        ? Math.min(activities.length / 20, 1) 
        : 0;
      
      const progressPercentage = Math.round(
        (itemProgress * itemWeight + memberProgress * memberWeight + activityProgress * activityWeight) * 100
      );
      
      setStats({
        totalItems: projectItems.length,
        costMatrices,
        calculations,
        scenarios,
        reports,
        totalActivities: Array.isArray(activities) ? activities.length : 0,
        lastUpdated: project.updatedAt.toString(),
        progressPercentage
      });
    }
  }, [project, projectItems, projectMembers, activities]);
  
  const exportAsPDF = async () => {
    if (!reportRef.current) return;
    
    setIsExporting(true);
    toast({
      title: "Generating PDF Report",
      description: "Please wait while we create your report...",
    });
    
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      });
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      const projectName = project?.name || 'Project';
      const filename = `${projectName.replace(/\s+/g, '_')}_Progress_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      
      pdf.save(filename);
      
      toast({
        title: "PDF Report Generated",
        description: "Your progress report has been downloaded.",
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: "Error Generating Report",
        description: "There was a problem creating your PDF report.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  const exportAsImage = async () => {
    if (!reportRef.current) return;
    
    setIsExporting(true);
    toast({
      title: "Generating Image",
      description: "Please wait while we create your report image...",
    });
    
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      });
      
      canvas.toBlob((blob) => {
        if (blob) {
          const projectName = project?.name || 'Project';
          const filename = `${projectName.replace(/\s+/g, '_')}_Progress_Report_${format(new Date(), 'yyyy-MM-dd')}.png`;
          saveAs(blob, filename);
          
          toast({
            title: "Image Generated",
            description: "Your progress report image has been downloaded.",
          });
        }
      });
    } catch (error) {
      console.error('Error exporting image:', error);
      toast({
        title: "Error Generating Image",
        description: "There was a problem creating your report image.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMMM d, yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };
  
  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      return 'Unknown time';
    }
  };
  
  // Get status text based on progress percentage
  const getStatusText = (percentage: number) => {
    if (percentage >= 100) return 'Completed';
    if (percentage >= 75) return 'Nearly Complete';
    if (percentage >= 50) return 'Halfway';
    if (percentage >= 25) return 'In Progress';
    return 'Just Started';
  };
  
  // Get status badge variant
  const getStatusVariant = (percentage: number): "default" | "success" | "outline" | "danger" | "warning" => {
    if (percentage >= 100) return 'success';
    if (percentage >= 75) return 'default';
    if (percentage >= 50) return 'outline';
    if (percentage >= 25) return 'danger';
    return 'warning';
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Share2 className="h-4 w-4" />
          <span>Export Progress Report</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Project Progress Report</DialogTitle>
          <DialogDescription>
            View and export a detailed report of the project's progress for sharing with stakeholders.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <Tabs defaultValue="preview">
            <TabsList className="mb-4">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="export">Export Options</TabsTrigger>
            </TabsList>
            
            <TabsContent value="preview">
              <ScrollArea className="h-[400px] rounded-md border p-4">
                <div ref={reportRef} className="p-6 bg-white">
                  <div className="space-y-6">
                    {/* Report Header */}
                    <div className="text-center border-b pb-4">
                      <h1 className="text-2xl font-bold">{project?.name || 'Project'} Progress Report</h1>
                      <p className="text-muted-foreground">
                        Generated on {format(new Date(), 'MMMM d, yyyy')}
                      </p>
                      
                      <div className="mt-4 flex justify-center">
                        <Badge variant={getStatusVariant(stats.progressPercentage)} className="px-3 py-1 text-sm">
                          {getStatusText(stats.progressPercentage)} - {stats.progressPercentage}% Complete
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Project Summary */}
                    <div className="space-y-1">
                      <h2 className="text-lg font-semibold">Project Summary</h2>
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Team Members: {projectMembers.length}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Last Updated: {formatTimeAgo(stats.lastUpdated)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ActivityIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Total Activities: {stats.totalActivities}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Calculator className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Calculations: {stats.calculations}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Table className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Cost Matrices: {stats.costMatrices}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">What-If Scenarios: {stats.scenarios}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {/* Project Progress Tracker */}
                    <div>
                      <h2 className="text-lg font-semibold mb-3">Progress Overview</h2>
                      <ProjectProgressTracker projectId={projectId} />
                    </div>
                    
                    <Separator />
                    
                    {/* CAMA Integration Section */}
                    <div>
                      <h2 className="text-lg font-semibold mb-2">CAMA System Integration</h2>
                      <div className="text-sm space-y-2">
                        <p className="text-muted-foreground">
                          This project includes building cost assessments compatible with Computer Assisted Mass Appraisal (CAMA) systems.
                        </p>
                        <div className="grid grid-cols-2 gap-4 mt-3">
                          <div className="flex flex-col gap-1.5">
                            <div className="font-medium text-sm">Data Components</div>
                            <ul className="list-disc list-inside text-xs space-y-1 text-muted-foreground">
                              <li>Building cost matrices</li>
                              <li>Regional cost factors</li>
                              <li>Depreciation tables</li>
                              <li>Building class definitions</li>
                            </ul>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <div className="font-medium text-sm">Compliance Status</div>
                            <ul className="list-disc list-inside text-xs space-y-1 text-muted-foreground">
                              <li>IAAO guidelines compliant</li>
                              <li>County standard formatting</li>
                              <li>Historical data tracking</li>
                              <li>Statistical validation ready</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {/* Recent Activities */}
                    <div>
                      <h2 className="text-lg font-semibold mb-2">Recent Activities</h2>
                      <ProjectActivitiesLog 
                        projectId={projectId} 
                        limit={5}
                        showTitle={false}
                      />
                    </div>
                    
                    {/* Report Footer */}
                    <div className="text-center text-sm text-muted-foreground border-t pt-4 mt-6">
                      <p>Generated by Benton County Building Cost System</p>
                      <p className="text-xs mt-1">For CAMA system integration and county assessor use</p>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="export">
              <div className="grid gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>PDF Document</CardTitle>
                    <CardDescription>
                      Export as a PDF file that can be easily shared, printed, and attached to county assessor records
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={exportAsPDF}
                      className="w-full gap-2"
                      disabled={isExporting}
                    >
                      {isExporting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <FileOutput className="h-4 w-4" />
                      )}
                      Export PDF
                    </Button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Image</CardTitle>
                    <CardDescription>
                      Export as a PNG image that can be shared in messages, presentations, or county assessment reports
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={exportAsImage}
                      variant="outline"
                      className="w-full gap-2"
                      disabled={isExporting}
                    >
                      {isExporting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                      Export Image
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectProgressReport;
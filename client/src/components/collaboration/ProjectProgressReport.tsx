import React, { useState } from 'react';
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
import { Loader2, Download, FileDown, Share2, Copy, FileText, Check, FileOutput } from 'lucide-react';
import { useProjectContext } from '@/contexts/ProjectContext';
import { useCollaboration } from '@/contexts/CollaborationContext';
import ProjectProgressTracker from './ProjectProgressTracker';
import ProjectActivitiesLog from './ProjectActivitiesLog';
import { format } from 'date-fns';

interface ProjectProgressReportProps {
  projectId: number;
}

const ProjectProgressReport: React.FC<ProjectProgressReportProps> = ({ projectId }) => {
  const { toast } = useToast();
  const { project } = useProjectContext();
  const { projectMembers } = useCollaboration();
  const [isExporting, setIsExporting] = useState(false);
  const [open, setOpen] = useState(false);
  const reportRef = React.useRef<HTMLDivElement>(null);
  
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
                    <div className="text-center border-b pb-4">
                      <h1 className="text-2xl font-bold">{project?.name || 'Project'} Progress Report</h1>
                      <p className="text-muted-foreground">
                        Generated on {format(new Date(), 'MMMM d, yyyy')}
                      </p>
                      <p className="mt-2">
                        Team Members: {projectMembers.length}
                      </p>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-xl font-semibold mb-3">Progress Overview</h2>
                        <ProjectProgressTracker projectId={projectId} />
                      </div>
                      
                      <div>
                        <h2 className="text-xl font-semibold mb-3">Recent Activities</h2>
                        <ProjectActivitiesLog 
                          projectId={projectId} 
                          limit={5}
                          showTitle={false}
                        />
                      </div>
                    </div>
                    
                    <div className="text-center text-sm text-muted-foreground border-t pt-4 mt-6">
                      <p>Generated by Benton County Building Cost System</p>
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
                      Export as a PDF file that can be easily shared and printed
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
                      Export as a PNG image that can be shared in messages or presentations
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
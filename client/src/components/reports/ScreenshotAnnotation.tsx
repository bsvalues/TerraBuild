import React, { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Button } from '@/components/ui/button';
import { 
  Camera, 
  Pencil, 
  Image as ImageIcon, 
  Download, 
  FileText, 
  Trash2, 
  Undo2, 
  Check, 
  X,
  Save
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from '@/hooks/use-toast';

interface ScreenshotAnnotationProps {
  targetRef: React.RefObject<HTMLElement>;
  title?: string;
  filename?: string;
  captureOnly?: boolean;
}

export function ScreenshotAnnotation({
  targetRef,
  title = "Cost Report",
  filename = "cost-report",
  captureOnly = false
}: ScreenshotAnnotationProps) {
  const [screenshotImage, setScreenshotImage] = useState<string | null>(null);
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [annotations, setAnnotations] = useState<{ x: number; y: number; text: string; color: string }[]>([]);
  const [currentAnnotation, setCurrentAnnotation] = useState<string>('');
  const [selectedAnnotationIndex, setSelectedAnnotationIndex] = useState<number | null>(null);
  const [annotationPosition, setAnnotationPosition] = useState<{ x: number; y: number } | null>(null);
  const [annotationColor, setAnnotationColor] = useState<string>('#ff3333');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const colors = [
    '#ff3333', // red
    '#33aa33', // green
    '#3366ff', // blue
    '#ffaa00', // orange
    '#aa33aa', // purple
  ];

  // Function to take screenshot
  const captureScreenshot = async () => {
    if (!targetRef.current) {
      toast({
        title: "Error",
        description: "Could not find the target element to capture",
        variant: "destructive",
      });
      return;
    }

    try {
      const canvas = await html2canvas(targetRef.current, {
        scale: 2, // Better quality
        useCORS: true, // Support images from different origins
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      const imageData = canvas.toDataURL('image/png');
      setScreenshotImage(imageData);
      
      toast({
        title: "Screenshot Captured",
        description: "You can now annotate or save the screenshot",
      });
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      toast({
        title: "Error",
        description: "Failed to capture screenshot. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Function to start annotation
  const startAnnotating = () => {
    setIsAnnotating(true);
  };

  // Function to handle canvas click to add annotation
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isAnnotating) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setAnnotationPosition({ x, y });
    setSelectedAnnotationIndex(null);
    
    // Focus the input
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };
  
  // Function to add annotation
  const addAnnotation = () => {
    if (!annotationPosition || !currentAnnotation.trim()) return;
    
    const newAnnotation = {
      x: annotationPosition.x,
      y: annotationPosition.y,
      text: currentAnnotation,
      color: annotationColor
    };
    
    setAnnotations([...annotations, newAnnotation]);
    setCurrentAnnotation('');
    setAnnotationPosition(null);
  };
  
  // Function to cancel current annotation
  const cancelAnnotation = () => {
    setCurrentAnnotation('');
    setAnnotationPosition(null);
  };
  
  // Function to delete an annotation
  const deleteAnnotation = (index: number) => {
    const newAnnotations = [...annotations];
    newAnnotations.splice(index, 1);
    setAnnotations(newAnnotations);
    setSelectedAnnotationIndex(null);
  };
  
  // Function to select annotation
  const selectAnnotation = (index: number) => {
    setSelectedAnnotationIndex(index === selectedAnnotationIndex ? null : index);
  };
  
  // Function to clear all annotations
  const clearAnnotations = () => {
    setAnnotations([]);
    setSelectedAnnotationIndex(null);
  };
  
  // Function to save as PDF
  const saveAsPDF = () => {
    if (!canvasRef.current || !screenshotImage) return;
    
    const canvas = canvasRef.current;
    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${filename}-${new Date().toISOString().slice(0, 10)}.pdf`);
    
    toast({
      title: "PDF Saved",
      description: "Your annotated screenshot has been saved as a PDF",
    });
  };
  
  // Function to download as PNG
  const downloadPNG = () => {
    if (!canvasRef.current || !screenshotImage) return;
    
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = `${filename}-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    
    toast({
      title: "Image Saved",
      description: "Your annotated screenshot has been saved as a PNG",
    });
  };

  // Draw annotations on canvas when they change
  useEffect(() => {
    if (!canvasRef.current || !screenshotImage) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Load and draw the screenshot
    const img = new Image();
    img.onload = () => {
      // Set canvas dimensions to match image
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw the image
      ctx.drawImage(img, 0, 0);
      
      // Draw all annotations
      annotations.forEach((annotation, index) => {
        const isSelected = index === selectedAnnotationIndex;
        
        // Draw annotation dot
        ctx.beginPath();
        ctx.arc(annotation.x, annotation.y, isSelected ? 8 : 6, 0, Math.PI * 2);
        ctx.fillStyle = annotation.color;
        ctx.fill();
        
        // Draw annotation text background
        const padding = 6;
        const metrics = ctx.measureText(annotation.text);
        const textWidth = metrics.width;
        const textHeight = 20; // Approximate text height
        
        ctx.fillStyle = isSelected ? 'rgba(255, 255, 220, 0.9)' : 'rgba(255, 255, 255, 0.8)';
        ctx.fillRect(
          annotation.x + 15 - padding, 
          annotation.y - 10 - padding, 
          textWidth + padding * 2, 
          textHeight + padding * 2
        );
        
        // Draw text border if selected
        if (isSelected) {
          ctx.strokeStyle = annotation.color;
          ctx.lineWidth = 2;
          ctx.strokeRect(
            annotation.x + 15 - padding, 
            annotation.y - 10 - padding, 
            textWidth + padding * 2, 
            textHeight + padding * 2
          );
        }
        
        // Draw text
        ctx.fillStyle = annotation.color;
        ctx.font = 'bold 14px Arial';
        ctx.fillText(annotation.text, annotation.x + 15, annotation.y + 5);
      });
    };
    
    img.src = screenshotImage;
  }, [screenshotImage, annotations, selectedAnnotationIndex]);

  // Handle reset
  const handleReset = () => {
    setScreenshotImage(null);
    setAnnotations([]);
    setIsAnnotating(false);
    setSelectedAnnotationIndex(null);
    setAnnotationPosition(null);
    setCurrentAnnotation('');
  };

  return (
    <div className="w-full">
      {!screenshotImage ? (
        <Button 
          onClick={captureScreenshot} 
          className="flex items-center gap-2"
          variant="default"
        >
          <Camera className="h-4 w-4" />
          {captureOnly ? "Capture Screenshot" : "Capture for Annotation"}
        </Button>
      ) : (
        <div 
          className="mt-4 border rounded-lg bg-gray-50 p-4"
          ref={containerRef}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">{title} Screenshot</h3>
            <div className="flex items-center gap-2">
              {!captureOnly && (
                <>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          onClick={startAnnotating} 
                          variant={isAnnotating ? "secondary" : "outline"}
                          size="sm"
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          {isAnnotating ? "Annotating..." : "Annotate"}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Click on the image to add annotations</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {isAnnotating && (
                    <div className="flex items-center gap-1 ml-2">
                      {colors.map(color => (
                        <div 
                          key={color}
                          className={`w-5 h-5 rounded-full cursor-pointer border ${annotationColor === color ? 'border-gray-700 scale-125' : 'border-gray-300'}`}
                          style={{ backgroundColor: color }}
                          onClick={() => setAnnotationColor(color)}
                        />
                      ))}
                    </div>
                  )}

                  {annotations.length > 0 && (
                    <Button 
                      onClick={clearAnnotations}
                      variant="outline"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Clear All
                    </Button>
                  )}
                </>
              )}
              
              <Button 
                onClick={downloadPNG} 
                variant="outline"
                size="sm"
              >
                <ImageIcon className="h-4 w-4 mr-1" />
                Save PNG
              </Button>
              
              <Button 
                onClick={saveAsPDF} 
                variant="default"
                size="sm"
              >
                <FileText className="h-4 w-4 mr-1" />
                Save PDF
              </Button>
              
              <Button 
                onClick={handleReset}
                variant="ghost"
                size="sm"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div 
            className="relative overflow-auto border rounded-md"
            style={{ maxHeight: '500px' }}
          >
            <canvas 
              ref={canvasRef} 
              onClick={handleCanvasClick}
              className={`w-full ${isAnnotating ? 'cursor-crosshair' : 'cursor-default'}`}
            />
            
            {/* Annotation input */}
            {annotationPosition && (
              <div 
                className="absolute bg-white shadow-lg border rounded-lg p-3 z-50"
                style={{ 
                  left: `${annotationPosition.x + 20}px`, 
                  top: `${annotationPosition.y + 20}px`,
                  maxWidth: '300px'
                }}
              >
                <div className="flex flex-col gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={currentAnnotation}
                    onChange={(e) => setCurrentAnnotation(e.target.value)}
                    placeholder="Enter annotation text..."
                    className="border rounded px-2 py-1 text-sm"
                    autoFocus
                  />
                  <div className="flex justify-between gap-2">
                    <Button 
                      onClick={addAnnotation} 
                      disabled={!currentAnnotation.trim()}
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Check className="h-3 w-3" />
                      Add
                    </Button>
                    <Button 
                      onClick={cancelAnnotation} 
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <X className="h-3 w-3" />
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Annotation list */}
          {!captureOnly && annotations.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Annotations</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {annotations.map((annotation, index) => (
                  <div 
                    key={index}
                    className={`
                      flex items-center justify-between p-2 rounded-md
                      ${selectedAnnotationIndex === index ? 'bg-gray-100' : 'hover:bg-gray-50'}
                    `}
                    onClick={() => selectAnnotation(index)}
                  >
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: annotation.color }}
                      />
                      <span className="text-sm truncate max-w-[200px]">
                        {annotation.text}
                      </span>
                    </div>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteAnnotation(index);
                      }}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
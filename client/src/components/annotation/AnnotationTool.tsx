import React, { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { jsPDF } from 'jspdf';

interface Point {
  x: number;
  y: number;
}

interface DrawingPath {
  points: Point[];
  color: string;
  width: number;
}

interface TextAnnotation {
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
}

interface AnnotationToolProps {
  targetSelector: string;
  triggerButton?: React.ReactNode;
  onSave?: (dataUrl: string) => void;
}

export default function AnnotationTool({ 
  targetSelector,
  triggerButton,
  onSave 
}: AnnotationToolProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('draw');
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [currentPath, setCurrentPath] = useState<DrawingPath | null>(null);
  const [paths, setPaths] = useState<DrawingPath[]>([]);
  const [textAnnotations, setTextAnnotations] = useState<TextAnnotation[]>([]);
  const [selectedColor, setSelectedColor] = useState<string>('#FF5555');
  const [lineWidth, setLineWidth] = useState<number>(3);
  const [textInput, setTextInput] = useState<string>('');
  const [textColor, setTextColor] = useState<string>('#FF5555');
  const [fontSize, setFontSize] = useState<number>(16);
  const [filename, setFilename] = useState<string>('annotated-cost-report');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const textPositionRef = useRef<Point | null>(null);

  const colorOptions = [
    { name: 'Red', value: '#FF5555' },
    { name: 'Blue', value: '#5555FF' },
    { name: 'Green', value: '#55AA55' },
    { name: 'Yellow', value: '#FFAA33' },
    { name: 'Purple', value: '#AA55DD' },
    { name: 'Black', value: '#000000' },
  ];

  const captureTargetElement = async () => {
    setIsCapturing(true);
    try {
      const targetElement = document.querySelector(targetSelector);
      if (!targetElement) {
        throw new Error(`Element with selector "${targetSelector}" not found`);
      }

      const canvas = await html2canvas(targetElement as HTMLElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const dataUrl = canvas.toDataURL('image/png');
      setCapturedImage(dataUrl);
      setIsCapturing(false);
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      setIsCapturing(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      captureTargetElement();
      // Reset state when opening
      setPaths([]);
      setTextAnnotations([]);
      setActiveTab('draw');
    }
  };

  // Drawing functionality
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTab !== 'draw') return;
    
    const canvas = canvasRef.current;
    const rect = canvas?.getBoundingClientRect();
    if (!canvas || !rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setCurrentPath({
      points: [{ x, y }],
      color: selectedColor,
      width: lineWidth
    });
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentPath || activeTab !== 'draw') return;
    
    const canvas = canvasRef.current;
    const rect = canvas?.getBoundingClientRect();
    if (!canvas || !rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCurrentPath({
      ...currentPath,
      points: [...currentPath.points, { x, y }]
    });
  };

  const stopDrawing = () => {
    if (activeTab !== 'draw' || !isDrawing || !currentPath) return;
    
    setIsDrawing(false);
    setPaths([...paths, currentPath]);
    setCurrentPath(null);
  };

  // Text annotation functionality
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTab !== 'text' || !textInput.trim()) return;
    
    const canvas = canvasRef.current;
    const rect = canvas?.getBoundingClientRect();
    if (!canvas || !rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setTextAnnotations([
      ...textAnnotations,
      {
        x,
        y,
        text: textInput,
        color: textColor,
        fontSize
      }
    ]);

    setTextInput('');
  };

  // Draw everything to canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !capturedImage) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas and draw background image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const img = new Image();
    img.onload = () => {
      // Set canvas dimensions to match image
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw background image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Draw all completed paths
      paths.forEach(path => {
        if (path.points.length < 2) return;
        
        ctx.beginPath();
        ctx.moveTo(path.points[0].x, path.points[0].y);
        
        for (let i = 1; i < path.points.length; i++) {
          ctx.lineTo(path.points[i].x, path.points[i].y);
        }
        
        ctx.strokeStyle = path.color;
        ctx.lineWidth = path.width;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.stroke();
      });
      
      // Draw current path (if drawing)
      if (currentPath && currentPath.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(currentPath.points[0].x, currentPath.points[0].y);
        
        for (let i = 1; i < currentPath.points.length; i++) {
          ctx.lineTo(currentPath.points[i].x, currentPath.points[i].y);
        }
        
        ctx.strokeStyle = currentPath.color;
        ctx.lineWidth = currentPath.width;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.stroke();
      }
      
      // Draw text annotations
      textAnnotations.forEach(annotation => {
        ctx.font = `${annotation.fontSize}px Arial`;
        ctx.fillStyle = annotation.color;
        ctx.fillText(annotation.text, annotation.x, annotation.y);
      });
    };
    
    img.src = capturedImage;
  }, [capturedImage, paths, currentPath, textAnnotations]);

  // Resize canvas to fit container
  useEffect(() => {
    const updateCanvasSize = () => {
      const container = canvasContainerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas || !capturedImage) return;
      
      // Resize is handled in the image.onload handler
    };
    
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [capturedImage]);

  const exportAsPng = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    
    // Create a download link
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${filename}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    if (onSave) {
      onSave(dataUrl);
    }
  };

  const exportAsPdf = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    
    // Create PDF with proper dimensions
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = imgWidth / imgHeight;
    
    // Create PDF with correct orientation
    let orientation: 'portrait' | 'landscape' = 'portrait';
    if (ratio > 1) {
      orientation = 'landscape';
    }
    
    const pdf = new jsPDF({
      orientation,
      unit: 'px',
      // Use a custom format that matches the image aspect ratio
      format: [imgWidth, imgHeight]
    });
    
    // Calculate dimensions to fit in PDF
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // Add the image to fill the PDF
    pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
    
    // Save the PDF
    pdf.save(`${filename}.pdf`);
  };

  const handleClearAll = () => {
    setPaths([]);
    setTextAnnotations([]);
  };

  // Custom trigger or default button
  const trigger = triggerButton || (
    <Button 
      variant="outline" 
      className="flex items-center gap-2"
      onClick={() => handleOpenChange(true)}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      Take Screenshot &amp; Annotate
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-[90vw]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Screenshot and Annotation Tool</DialogTitle>
        </DialogHeader>
        
        {isCapturing ? (
          <div className="flex flex-col items-center justify-center h-[60vh]">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
            <p className="text-sm text-muted-foreground">Capturing screenshot...</p>
          </div>
        ) : !capturedImage ? (
          <div className="flex flex-col items-center justify-center h-[60vh]">
            <p className="text-sm text-muted-foreground">Failed to capture screenshot.</p>
            <Button onClick={captureTargetElement} className="mt-4">Try Again</Button>
          </div>
        ) : (
          <>
            <div className="flex flex-col space-y-4">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex justify-between items-center mb-2">
                  <TabsList>
                    <TabsTrigger value="draw" className="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      Draw
                    </TabsTrigger>
                    <TabsTrigger value="text" className="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                      </svg>
                      Text
                    </TabsTrigger>
                  </TabsList>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={handleClearAll}
                      className="h-8 text-xs"
                    >
                      Clear All
                    </Button>
                  </div>
                </div>
                
                <TabsContent value="draw" className="flex items-center gap-3 py-1">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Color:</Label>
                    <div className="flex gap-1">
                      {colorOptions.map(color => (
                        <button
                          key={color.value}
                          type="button"
                          title={color.name}
                          className={`w-6 h-6 rounded-full cursor-pointer transition-all ${
                            selectedColor === color.value ? 'ring-2 ring-offset-1 ring-primary' : ''
                          }`}
                          style={{ backgroundColor: color.value }}
                          onClick={() => setSelectedColor(color.value)}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Width:</Label>
                    <Input
                      type="range"
                      min="1"
                      max="10"
                      value={lineWidth}
                      onChange={(e) => setLineWidth(Number(e.target.value))}
                      className="w-24 h-8"
                    />
                    <span className="text-xs w-4">{lineWidth}</span>
                  </div>
                </TabsContent>
                
                <TabsContent value="text" className="flex gap-3 py-1">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Text:</Label>
                    <Input
                      type="text"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Click on the image to place text"
                      className="h-8 w-52"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Color:</Label>
                    <div className="flex gap-1">
                      {colorOptions.map(color => (
                        <button
                          key={color.value}
                          type="button"
                          title={color.name}
                          className={`w-6 h-6 rounded-full cursor-pointer transition-all ${
                            textColor === color.value ? 'ring-2 ring-offset-1 ring-primary' : ''
                          }`}
                          style={{ backgroundColor: color.value }}
                          onClick={() => setTextColor(color.value)}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Size:</Label>
                    <Input
                      type="range"
                      min="10"
                      max="32"
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      className="w-24 h-8"
                    />
                    <span className="text-xs w-4">{fontSize}</span>
                  </div>
                </TabsContent>
              </Tabs>
              
              <div 
                ref={canvasContainerRef} 
                className="overflow-auto bg-gray-100 border border-gray-200 rounded-md h-[60vh] flex items-center justify-center"
              >
                <canvas
                  ref={canvasRef}
                  onMouseDown={activeTab === 'draw' ? startDrawing : handleCanvasClick}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  className="max-w-full cursor-crosshair"
                />
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Filename:</Label>
                  <Input
                    type="text"
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                    className="h-8 w-64"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={exportAsPng}
                    className="h-8 text-xs flex items-center gap-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Save as PNG
                  </Button>
                  <Button
                    onClick={exportAsPdf}
                    className="h-8 text-xs flex items-center gap-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Save as PDF
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
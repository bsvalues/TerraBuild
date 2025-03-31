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

// Custom icons for the annotation tool
const PencilIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
    <path d="m15 5 4 4"/>
  </svg>
);

const TextIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 7 4 4 20 4 20 7"/>
    <line x1="9" x2="15" y1="20" y2="20"/>
    <line x1="12" x2="12" y1="4" y2="20"/>
  </svg>
);

const ImageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
    <circle cx="9" cy="9" r="2"/>
    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
  </svg>
);

const PdfIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18"/>
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
  </svg>
);

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
  const [selectedColor, setSelectedColor] = useState<string>('#3B82F6');
  const [lineWidth, setLineWidth] = useState<number>(3);
  const [textInput, setTextInput] = useState<string>('');
  const [textColor, setTextColor] = useState<string>('#3B82F6');
  const [fontSize, setFontSize] = useState<number>(16);
  const [filename, setFilename] = useState<string>('annotated-cost-report');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const textPositionRef = useRef<Point | null>(null);

  // Color options using blue as primary color theme
  const colorOptions = [
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Green', value: '#10B981' },
    { name: 'Yellow', value: '#F59E0B' },
    { name: 'Purple', value: '#8B5CF6' },
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
      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
      onClick={() => handleOpenChange(true)}
    >
      <ImageIcon />
      Screenshot &amp; Annotate
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-[90vw] p-0 overflow-hidden" onInteractOutside={(e) => e.preventDefault()}>
        <div className="bg-gradient-to-r from-blue-700 to-blue-900 p-4 text-white">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ImageIcon />
            Screenshot and Annotation Tool
          </h2>
        </div>
        
        {isCapturing ? (
          <div className="flex flex-col items-center justify-center h-[60vh] p-6">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
            <p className="text-sm text-gray-600">Capturing screenshot...</p>
          </div>
        ) : !capturedImage ? (
          <div className="flex flex-col items-center justify-center h-[60vh] p-6">
            <p className="text-sm text-gray-600">Failed to capture screenshot.</p>
            <Button 
              onClick={captureTargetElement} 
              className="mt-4 bg-blue-600 hover:bg-blue-700"
            >
              Try Again
            </Button>
          </div>
        ) : (
          <>
            <div className="p-6 space-y-4">
              <div className="flex bg-blue-700 rounded-md overflow-hidden">
                <button
                  type="button"
                  className={`flex items-center justify-center gap-1 px-4 py-2 text-sm flex-1 ${
                    activeTab === 'draw' 
                      ? 'bg-blue-800 text-white' 
                      : 'text-white hover:bg-blue-600'
                  }`}
                  onClick={() => setActiveTab('draw')}
                >
                  <PencilIcon />
                  <span>Draw</span>
                </button>
                <button
                  type="button"
                  className={`flex items-center justify-center gap-1 px-4 py-2 text-sm flex-1 ${
                    activeTab === 'text' 
                      ? 'bg-blue-800 text-white' 
                      : 'text-white hover:bg-blue-600'
                  }`}
                  onClick={() => setActiveTab('text')}
                >
                  <TextIcon />
                  <span>Text</span>
                </button>
              </div>
              
              {activeTab === 'draw' && (
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium text-blue-900">Color:</Label>
                      <div className="flex gap-1">
                        {colorOptions.map(color => (
                          <button
                            key={color.value}
                            type="button"
                            title={color.name}
                            className={`w-6 h-6 rounded-full cursor-pointer transition-all ${
                              selectedColor === color.value ? 'ring-2 ring-offset-1 ring-blue-500' : ''
                            }`}
                            style={{ backgroundColor: color.value }}
                            onClick={() => setSelectedColor(color.value)}
                          />
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium text-blue-900">Width:</Label>
                      <Input
                        type="range"
                        min="1"
                        max="10"
                        value={lineWidth}
                        onChange={(e) => setLineWidth(Number(e.target.value))}
                        className="w-32 h-8"
                      />
                      <span className="text-sm text-blue-900 w-6 text-center">{lineWidth}</span>
                    </div>
                    
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={handleClearAll}
                      className="h-8 text-xs bg-red-500 hover:bg-red-600 flex items-center gap-1"
                    >
                      <TrashIcon />
                      <span>Clear</span>
                    </Button>
                  </div>
                </div>
              )}
              
              {activeTab === 'text' && (
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium text-blue-900">Text:</Label>
                      <Input
                        type="text"
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder="Click to place text"
                        className="h-8 flex-grow bg-white"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium text-blue-900">Color:</Label>
                      <div className="flex gap-1">
                        {colorOptions.map(color => (
                          <button
                            key={color.value}
                            type="button"
                            title={color.name}
                            className={`w-6 h-6 rounded-full cursor-pointer transition-all ${
                              textColor === color.value ? 'ring-2 ring-offset-1 ring-blue-500' : ''
                            }`}
                            style={{ backgroundColor: color.value }}
                            onClick={() => setTextColor(color.value)}
                          />
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm font-medium text-blue-900">Size:</Label>
                        <Input
                          type="range"
                          min="10"
                          max="32"
                          value={fontSize}
                          onChange={(e) => setFontSize(Number(e.target.value))}
                          className="w-24 h-8"
                        />
                        <span className="text-sm text-blue-900 w-6 text-center">{fontSize}</span>
                      </div>
                      
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={handleClearAll}
                        className="h-8 text-xs bg-red-500 hover:bg-red-600 flex items-center gap-1"
                      >
                        <TrashIcon />
                        <span>Clear</span>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              <div 
                ref={canvasContainerRef} 
                className="overflow-auto bg-gray-100 border border-gray-200 rounded-lg h-[50vh] flex items-center justify-center"
              >
                <canvas
                  ref={canvasRef}
                  onMouseDown={activeTab === 'draw' ? startDrawing : handleCanvasClick}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  className="max-w-full cursor-crosshair shadow-lg"
                />
              </div>
              
              <div className="flex justify-between items-center bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium text-blue-900">Filename:</Label>
                  <Input
                    type="text"
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                    className="h-9 w-64 bg-white"
                  />
                </div>
                
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={exportAsPng}
                    className="h-9 bg-white text-sm flex items-center gap-1.5 border-blue-200 text-blue-700 hover:bg-blue-50"
                  >
                    <ImageIcon />
                    Save as PNG
                  </Button>
                  <Button
                    onClick={exportAsPdf}
                    className="h-9 bg-blue-600 text-white hover:bg-blue-700 text-sm flex items-center gap-1.5"
                  >
                    <PdfIcon />
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
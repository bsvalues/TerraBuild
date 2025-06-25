import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ZoomIn, ZoomOut, RotateCcw, MapPin, Layers, 
  Navigation, Target, Activity, Search
} from 'lucide-react';

interface InteractiveMapCanvasProps {
  center: { lat: number; lng: number };
  zoom: number;
  properties: any[];
  heatmapData: any[];
  selectedProperty?: any;
  onPropertySelect: (property: any) => void;
  onMapMove: (center: { lat: number; lng: number }, zoom: number) => void;
}

export const InteractiveMapCanvas: React.FC<InteractiveMapCanvasProps> = ({
  center,
  zoom,
  properties,
  heatmapData,
  selectedProperty,
  onPropertySelect,
  onMapMove
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 });
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showProperties, setShowProperties] = useState(true);

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const MAP_BOUNDS = {
    north: 46.3,
    south: 46.1,
    east: -119.1,
    west: -119.4
  };

  // Convert lat/lng to canvas coordinates
  const latLngToCanvas = (lat: number, lng: number) => {
    const x = ((lng - MAP_BOUNDS.west) / (MAP_BOUNDS.east - MAP_BOUNDS.west)) * CANVAS_WIDTH;
    const y = ((MAP_BOUNDS.north - lat) / (MAP_BOUNDS.north - MAP_BOUNDS.south)) * CANVAS_HEIGHT;
    return { 
      x: x + mapOffset.x, 
      y: y + mapOffset.y 
    };
  };

  // Convert canvas coordinates to lat/lng
  const canvasToLatLng = (x: number, y: number) => {
    const adjustedX = x - mapOffset.x;
    const adjustedY = y - mapOffset.y;
    const lng = MAP_BOUNDS.west + (adjustedX / CANVAS_WIDTH) * (MAP_BOUNDS.east - MAP_BOUNDS.west);
    const lat = MAP_BOUNDS.north - (adjustedY / CANVAS_HEIGHT) * (MAP_BOUNDS.north - MAP_BOUNDS.south);
    return { lat, lng };
  };

  const drawMap = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw background
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw grid
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 20; i++) {
      const x = (i / 20) * CANVAS_WIDTH + mapOffset.x % (CANVAS_WIDTH / 20);
      const y = (i / 20) * CANVAS_HEIGHT + mapOffset.y % (CANVAS_HEIGHT / 20);
      
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }

    // Draw heatmap
    if (showHeatmap && heatmapData.length > 0) {
      heatmapData.forEach(point => {
        const { x, y } = latLngToCanvas(parseFloat(point.lat), parseFloat(point.lng));
        if (x >= 0 && x <= CANVAS_WIDTH && y >= 0 && y <= CANVAS_HEIGHT) {
          const intensity = parseFloat(point.intensity) || 0.5;
          const radius = 20 * intensity;
          
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
          gradient.addColorStop(0, `rgba(59, 130, 246, ${intensity * 0.6})`);
          gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, 2 * Math.PI);
          ctx.fill();
        }
      });
    }

    // Draw properties
    if (showProperties && properties.length > 0) {
      properties.forEach(property => {
        if (property.latitude && property.longitude) {
          const { x, y } = latLngToCanvas(property.latitude, property.longitude);
          
          if (x >= 0 && x <= CANVAS_WIDTH && y >= 0 && y <= CANVAS_HEIGHT) {
            const isSelected = selectedProperty?.id === property.id;
            const value = property.total_value || 0;
            
            // Property marker size based on value
            const size = Math.max(4, Math.min(12, Math.log(value) * 0.8));
            
            ctx.fillStyle = isSelected ? '#f59e0b' : 
                           value > 800000 ? '#ef4444' :
                           value > 500000 ? '#f97316' :
                           value > 300000 ? '#eab308' : '#22c55e';
            
            ctx.beginPath();
            ctx.arc(x, y, size, 0, 2 * Math.PI);
            ctx.fill();
            
            // Selection highlight
            if (isSelected) {
              ctx.strokeStyle = '#fbbf24';
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.arc(x, y, size + 4, 0, 2 * Math.PI);
              ctx.stroke();
            }
          }
        }
      });
    }

    // Draw center crosshairs
    const centerCanvas = latLngToCanvas(center.lat, center.lng);
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerCanvas.x - 10, centerCanvas.y);
    ctx.lineTo(centerCanvas.x + 10, centerCanvas.y);
    ctx.moveTo(centerCanvas.x, centerCanvas.y - 10);
    ctx.lineTo(centerCanvas.x, centerCanvas.y + 10);
    ctx.stroke();

    // Draw scale indicator
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '12px monospace';
    ctx.fillText(`Zoom: ${zoom}x`, 10, 20);
    ctx.fillText(`Center: ${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}`, 10, 35);
    ctx.fillText(`Properties: ${properties.length}`, 10, 50);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      setMapOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isDragging) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if clicked on a property
    const clickedProperty = properties.find(property => {
      if (!property.latitude || !property.longitude) return false;
      
      const { x: propX, y: propY } = latLngToCanvas(property.latitude, property.longitude);
      const distance = Math.sqrt((x - propX) ** 2 + (y - propY) ** 2);
      return distance <= 12;
    });

    if (clickedProperty) {
      onPropertySelect(clickedProperty);
    } else {
      // Update map center
      const newCenter = canvasToLatLng(x, y);
      onMapMove(newCenter, zoom);
    }
  };

  const handleZoomIn = () => {
    onMapMove(center, Math.min(zoom + 1, 20));
  };

  const handleZoomOut = () => {
    onMapMove(center, Math.max(zoom - 1, 1));
  };

  const handleReset = () => {
    setMapOffset({ x: 0, y: 0 });
    onMapMove({ lat: 46.2382, lng: -119.2312 }, 11);
  };

  useEffect(() => {
    drawMap();
  }, [center, zoom, properties, heatmapData, selectedProperty, mapOffset, showHeatmap, showProperties]);

  return (
    <Card className="bg-slate-900/95 border-slate-600 backdrop-blur">
      <CardContent className="p-4">
        {/* Map Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleZoomIn}>
              <ZoomIn className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleZoomOut}>
              <ZoomOut className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleReset}>
              <RotateCcw className="h-3 w-3" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={showProperties ? "default" : "outline"}
              onClick={() => setShowProperties(!showProperties)}
            >
              <MapPin className="h-3 w-3 mr-1" />
              Properties
            </Button>
            <Button
              size="sm"
              variant={showHeatmap ? "default" : "outline"}
              onClick={() => setShowHeatmap(!showHeatmap)}
            >
              <Activity className="h-3 w-3 mr-1" />
              Heatmap
            </Button>
          </div>
        </div>

        {/* Interactive Canvas */}
        <div className="relative border border-slate-600 rounded-lg overflow-hidden">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="cursor-crosshair bg-slate-950"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={handleClick}
          />
          
          {/* Legend */}
          <div className="absolute top-4 right-4 bg-slate-900/90 p-3 rounded border border-slate-600">
            <div className="text-xs font-medium text-white mb-2">Property Values</div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-slate-300">$800K+</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-slate-300">$500K-$800K</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-slate-300">$300K-$500K</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-slate-300">Under $300K</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between mt-3 text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span>Drag to pan • Click to select • Use zoom controls</span>
          </div>
          <div className="flex items-center gap-2">
            {selectedProperty && (
              <Badge variant="outline" className="text-xs">
                Selected: {selectedProperty.address || selectedProperty.parcel_id}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
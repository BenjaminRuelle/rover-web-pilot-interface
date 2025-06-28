import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PatrolTool } from './PatrolToolbar';

interface Point {
  x: number;
  y: number;
  id: string;
}

interface KeepoutZone {
  id: string;
  points: Point[];
  completed: boolean;
}

interface PatrolMapProps {
  activeTool: PatrolTool;
  onSave: () => void;
  onClear: () => void;
}

const PatrolMap: React.FC<PatrolMapProps> = ({ activeTool, onSave, onClear }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [waypoints, setWaypoints] = useState<Point[]>([]);
  const [keepoutZones, setKeepoutZones] = useState<KeepoutZone[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [activeZone, setActiveZone] = useState<string | null>(null);

  // Load the uploaded map image
  const [mapImage, setMapImage] = useState<HTMLImageElement | null>(null);
  const [mapScale, setMapScale] = useState(1);
  const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setMapImage(img);
      // Calculate scale to fit the map in canvas while maintaining aspect ratio
      const canvas = canvasRef.current;
      if (canvas) {
        const canvasAspect = canvas.offsetWidth / canvas.offsetHeight;
        const imageAspect = img.width / img.height;
        
        let scale: number;
        let offsetX = 0;
        let offsetY = 0;
        
        if (imageAspect > canvasAspect) {
          // Image is wider, fit to width
          scale = canvas.offsetWidth / img.width;
          offsetY = (canvas.offsetHeight - img.height * scale) / 2;
        } else {
          // Image is taller, fit to height
          scale = canvas.offsetHeight / img.height;
          offsetX = (canvas.offsetWidth - img.width * scale) / 2;
        }
        
        setMapScale(scale);
        setMapOffset({ x: offsetX, y: offsetY });
      }
    };
    img.src = '/lovable-uploads/e0784714-beed-409d-8760-417979b44c80.png';
  }, []);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const drawMap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !mapImage) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Clear canvas with dark background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw the map image with proper scaling and centering
    ctx.drawImage(
      mapImage, 
      mapOffset.x, 
      mapOffset.y, 
      mapImage.width * mapScale, 
      mapImage.height * mapScale
    );

    // Draw keepout zones
    keepoutZones.forEach(zone => {
      if (zone.points.length > 0) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.moveTo(zone.points[0].x, zone.points[0].y);
        
        for (let i = 1; i < zone.points.length; i++) {
          ctx.lineTo(zone.points[i].x, zone.points[i].y);
        }
        
        if (zone.completed) {
          ctx.closePath();
          ctx.fill();
        }
        ctx.stroke();

        // Draw zone points
        zone.points.forEach(point => {
          ctx.fillStyle = '#ff0000';
          ctx.beginPath();
          ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
          ctx.fill();
        });
      }
    });

    // Draw waypoints
    waypoints.forEach((point, index) => {
      const isSelected = selectedPoint === point.id;
      
      // Draw waypoint circle
      ctx.fillStyle = isSelected ? '#60a5fa' : '#3b82f6';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 12, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      // Draw waypoint number
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((index + 1).toString(), point.x, point.y);
    });

    // Draw path between waypoints
    if (waypoints.length > 1) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(waypoints[0].x, waypoints[0].y);
      
      for (let i = 1; i < waypoints.length; i++) {
        ctx.lineTo(waypoints[i].x, waypoints[i].y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [mapImage, mapScale, mapOffset, waypoints, keepoutZones, selectedPoint]);

  useEffect(() => {
    drawMap();
  }, [drawMap]);

  const getClickedPoint = (x: number, y: number): string | null => {
    // Check waypoints
    for (const point of waypoints) {
      const distance = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2);
      if (distance <= 12) return point.id;
    }

    // Check keepout zone points
    for (const zone of keepoutZones) {
      for (const point of zone.points) {
        const distance = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2);
        if (distance <= 8) return point.id;
      }
    }

    return null;
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === 'waypoint') {
      const newWaypoint: Point = {
        x,
        y,
        id: generateId()
      };
      setWaypoints(prev => [...prev, newWaypoint]);
    } else if (activeTool === 'keepout') {
      if (activeZone) {
        // Add point to active zone
        setKeepoutZones(prev => prev.map(zone => 
          zone.id === activeZone 
            ? { ...zone, points: [...zone.points, { x, y, id: generateId() }] }
            : zone
        ));
      } else {
        // Start new zone
        const newZone: KeepoutZone = {
          id: generateId(),
          points: [{ x, y, id: generateId() }],
          completed: false
        };
        setKeepoutZones(prev => [...prev, newZone]);
        setActiveZone(newZone.id);
      }
    } else if (activeTool === 'select') {
      const clickedPoint = getClickedPoint(x, y);
      setSelectedPoint(clickedPoint);
    }
  };

  const handleCanvasDoubleClick = () => {
    if (activeTool === 'keepout' && activeZone) {
      // Complete the current zone
      setKeepoutZones(prev => prev.map(zone => 
        zone.id === activeZone 
          ? { ...zone, completed: true }
          : zone
      ));
      setActiveZone(null);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool !== 'select') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedPoint = getClickedPoint(x, y);
    if (clickedPoint) {
      setSelectedPoint(clickedPoint);
      setIsDragging(true);
      
      const point = waypoints.find(p => p.id === clickedPoint);
      if (point) {
        setDragOffset({ x: x - point.x, y: y - point.y });
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !selectedPoint || activeTool !== 'select') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;

    setWaypoints(prev => prev.map(point => 
      point.id === selectedPoint 
        ? { ...point, x, y }
        : point
    ));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
  };

  const handleSaveInternal = () => {
    console.log('Saving patrol route:', {
      waypoints: waypoints.map((point, index) => ({
        order: index + 1,
        x: point.x,
        y: point.y
      })),
      keepoutZones: keepoutZones.filter(zone => zone.completed).map(zone => ({
        id: zone.id,
        points: zone.points.map(p => ({ x: p.x, y: p.y }))
      }))
    });
    onSave();
  };

  const handleClearInternal = () => {
    setWaypoints([]);
    setKeepoutZones([]);
    setActiveZone(null);
    setSelectedPoint(null);
    onClear();
  };

  const handleDelete = () => {
    if (selectedPoint) {
      setWaypoints(prev => prev.filter(point => point.id !== selectedPoint));
      setSelectedPoint(null);
    }
  };

  // Handle delete key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        handleDelete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPoint]);

  return (
    <div className="relative h-full bg-slate-900">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair"
        onClick={handleCanvasClick}
        onDoubleClick={handleCanvasDoubleClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      
      {/* Instructions overlay */}
      <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md rounded-lg border border-white/20 p-3 text-white text-sm max-w-sm">
        {activeTool === 'select' && (
          <div>
            <div className="font-medium mb-1">Select Tool</div>
            <div className="text-xs text-white/70">Click and drag waypoints to move them. Press Delete to remove selected point.</div>
          </div>
        )}
        {activeTool === 'waypoint' && (
          <div>
            <div className="font-medium mb-1">Patrol Points Tool</div>
            <div className="text-xs text-white/70">Click on the map to place waypoints. Points will be connected in order.</div>
          </div>
        )}
        {activeTool === 'keepout' && (
          <div>
            <div className="font-medium mb-1">Keepout Zone Tool</div>
            <div className="text-xs text-white/70">Click to add points to a polygon. Double-click to complete the zone.</div>
          </div>
        )}
      </div>

      {/* Status overlay */}
      <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-md rounded-lg border border-white/20 p-3 text-white text-sm">
        <div className="space-y-1">
          <div>Waypoints: {waypoints.length}</div>
          <div>Keepout Zones: {keepoutZones.filter(z => z.completed).length}</div>
          {selectedPoint && <div className="text-blue-400">Point selected</div>}
        </div>
      </div>
    </div>
  );
};

export default PatrolMap;

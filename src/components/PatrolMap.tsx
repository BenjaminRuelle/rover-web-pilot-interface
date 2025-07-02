import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PatrolTool } from './PatrolToolbar';
import { useMapService, Point, KeepoutZone } from '@/hooks/useMapService';

interface PatrolMapProps {
  activeTool: PatrolTool;
  onSave: () => void;
  onClear: () => void;
}

const PatrolMap: React.FC<PatrolMapProps> = ({ activeTool, onSave, onClear }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedPoint, setSelectedPoint] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [activeZone, setActiveZone] = useState<string | null>(null);
  
  const { mapData, waypoints, keepoutZones, setWaypoints, setKeepoutZones, worldToMap, mapToWorld } = useMapService();

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const drawMap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Clear canvas with dark background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw the map if available
    if (mapData) {
      const imageData = ctx.createImageData(canvas.width, canvas.height);
      const scaleX = mapData.width / canvas.width;
      const scaleY = mapData.height / canvas.height;

      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const mapX = Math.floor(x * scaleX);
          const mapY = Math.floor(y * scaleY);
          const mapIndex = mapY * mapData.width + mapX;
          const value = mapData.data[mapIndex];

          let r, g, b;
          if (value === -1) {
            // Unknown space - gray
            r = g = b = 64;
          } else if (value === 0) {
            // Free space - light gray
            r = g = b = 200;
          } else {
            // Occupied space - dark
            r = g = b = 30;
          }

          const pixelIndex = (y * canvas.width + x) * 4;
          imageData.data[pixelIndex] = r;
          imageData.data[pixelIndex + 1] = g;
          imageData.data[pixelIndex + 2] = b;
          imageData.data[pixelIndex + 3] = 255;
        }
      }
      ctx.putImageData(imageData, 0, 0);
    }

    // Draw keepout zones
    keepoutZones.forEach(zone => {
      if (zone.points.length > 0) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        const firstMapPoint = worldToMap(zone.points[0].x, zone.points[0].y);
        const firstX = (firstMapPoint.x / (mapData?.width || 1)) * canvas.width;
        const firstY = (firstMapPoint.y / (mapData?.height || 1)) * canvas.height;
        ctx.moveTo(firstX, firstY);
        
        for (let i = 1; i < zone.points.length; i++) {
          const mapPoint = worldToMap(zone.points[i].x, zone.points[i].y);
          const x = (mapPoint.x / (mapData?.width || 1)) * canvas.width;
          const y = (mapPoint.y / (mapData?.height || 1)) * canvas.height;
          ctx.lineTo(x, y);
        }
        
        if (zone.completed) {
          ctx.closePath();
          ctx.fill();
        }
        ctx.stroke();

        // Draw zone points
        zone.points.forEach(point => {
          const mapPoint = worldToMap(point.x, point.y);
          const x = (mapPoint.x / (mapData?.width || 1)) * canvas.width;
          const y = (mapPoint.y / (mapData?.height || 1)) * canvas.height;
          
          ctx.fillStyle = '#ff0000';
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, 2 * Math.PI);
          ctx.fill();
        });
      }
    });

    // Draw waypoints
    waypoints.forEach((point, index) => {
      const isSelected = selectedPoint === point.id;
      const mapPoint = worldToMap(point.x, point.y);
      const x = (mapPoint.x / (mapData?.width || 1)) * canvas.width;
      const y = (mapPoint.y / (mapData?.height || 1)) * canvas.height;
      
      // Draw waypoint circle
      ctx.fillStyle = isSelected ? '#60a5fa' : '#3b82f6';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      // Draw waypoint number
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((index + 1).toString(), x, y);
    });

    // Draw path between waypoints
    if (waypoints.length > 1) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      
      const firstMapPoint = worldToMap(waypoints[0].x, waypoints[0].y);
      const firstX = (firstMapPoint.x / (mapData?.width || 1)) * canvas.width;
      const firstY = (firstMapPoint.y / (mapData?.height || 1)) * canvas.height;
      ctx.moveTo(firstX, firstY);
      
      for (let i = 1; i < waypoints.length; i++) {
        const mapPoint = worldToMap(waypoints[i].x, waypoints[i].y);
        const x = (mapPoint.x / (mapData?.width || 1)) * canvas.width;
        const y = (mapPoint.y / (mapData?.height || 1)) * canvas.height;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [mapData, waypoints, keepoutZones, selectedPoint, worldToMap]);

  useEffect(() => {
    drawMap();
  }, [drawMap]);

  const canvasToWorld = useCallback((canvasX: number, canvasY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !mapData) return { x: 0, y: 0 };
    
    const mapX = (canvasX / canvas.width) * mapData.width;
    const mapY = (canvasY / canvas.height) * mapData.height;
    
    return mapToWorld(mapX, mapY);
  }, [mapData, mapToWorld]);

  const getClickedPoint = (x: number, y: number): string | null => {
    // Check waypoints
    for (const point of waypoints) {
      const mapPoint = worldToMap(point.x, point.y);
      const canvas = canvasRef.current;
      if (!canvas) continue;
      
      const canvasX = (mapPoint.x / (mapData?.width || 1)) * canvas.width;
      const canvasY = (mapPoint.y / (mapData?.height || 1)) * canvas.height;
      const distance = Math.sqrt((x - canvasX) ** 2 + (y - canvasY) ** 2);
      if (distance <= 12) return point.id;
    }

    // Check keepout zone points
    for (const zone of keepoutZones) {
      for (const point of zone.points) {
        const mapPoint = worldToMap(point.x, point.y);
        const canvas = canvasRef.current;
        if (!canvas) continue;
        
        const canvasX = (mapPoint.x / (mapData?.width || 1)) * canvas.width;
        const canvasY = (mapPoint.y / (mapData?.height || 1)) * canvas.height;
        const distance = Math.sqrt((x - canvasX) ** 2 + (y - canvasY) ** 2);
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
      const worldPos = canvasToWorld(x, y);
      const newWaypoint: Point = {
        x: worldPos.x,
        y: worldPos.y,
        id: generateId()
      };
      setWaypoints([...waypoints, newWaypoint]);
    } else if (activeTool === 'keepout') {
      const worldPos = canvasToWorld(x, y);
      if (activeZone) {
        // Add point to active zone
        setKeepoutZones(keepoutZones.map(zone => 
          zone.id === activeZone 
            ? { ...zone, points: [...zone.points, { x: worldPos.x, y: worldPos.y, id: generateId() }] }
            : zone
        ));
      } else {
        // Start new zone
        const newZone: KeepoutZone = {
          id: generateId(),
          points: [{ x: worldPos.x, y: worldPos.y, id: generateId() }],
          completed: false
        };
        setKeepoutZones([...keepoutZones, newZone]);
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
      setKeepoutZones(keepoutZones.map(zone => 
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
        const mapPoint = worldToMap(point.x, point.y);
        const canvasX = (mapPoint.x / (mapData?.width || 1)) * canvas.width;
        const canvasY = (mapPoint.y / (mapData?.height || 1)) * canvas.height;
        setDragOffset({ x: x - canvasX, y: y - canvasY });
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !selectedPoint || activeTool !== 'select') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const worldPos = canvasToWorld(x - dragOffset.x, y - dragOffset.y);

    const updatedWaypoints = waypoints.map(point => 
      point.id === selectedPoint 
        ? { ...point, x: worldPos.x, y: worldPos.y }
        : point
    );
    setWaypoints(updatedWaypoints);
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
      const filteredWaypoints = waypoints.filter(point => point.id !== selectedPoint);
      setWaypoints(filteredWaypoints);
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
            <div className="text-xs text-white/70">Click waypoints to select them. Press Delete to remove selected point.</div>
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
          {mapData && <div className="text-green-400">Map loaded</div>}
        </div>
      </div>
    </div>
  );
};

export default PatrolMap;

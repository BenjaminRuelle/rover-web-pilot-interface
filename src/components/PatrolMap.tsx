import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PatrolTool } from './PatrolToolbar';
import { useMapContext, Point, KeepoutZone } from '@/contexts/MapContext';

interface PatrolMapProps {
  activeTool: PatrolTool;
  onSave: () => void;
  onClear: () => void;
}

const PatrolMap: React.FC<PatrolMapProps> = ({ activeTool, onSave, onClear }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedPoint, setSelectedPoint] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const [mapDimensions, setMapDimensions] = useState({ width: 800, height: 600 });
  const [localMapInstance, setLocalMapInstance] = useState<any>(null);
  
  const { 
    waypoints, 
    keepoutZones, 
    setWaypoints, 
    setKeepoutZones, 
    initializeMap, 
    renderOverlay,
    clearAll,
    worldToCanvasPoint,
    canvasToWorldPoint 
  } = useMapContext();

  // Update dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (mapContainerRef.current) {
        const rect = mapContainerRef.current.getBoundingClientRect();
        setMapDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Initialize map
  useEffect(() => {
    if (!localMapInstance && mapDimensions.width > 0 && mapDimensions.height > 0) {
      initializeMap('patrol-map-container', mapDimensions.width, mapDimensions.height)
        .then(instance => setLocalMapInstance(instance));
    }
  }, [initializeMap, localMapInstance, mapDimensions]);

  // Render overlay
  useEffect(() => {
    const canvas = overlayCanvasRef.current;
    const container = mapContainerRef.current;
    if (!canvas || !container || !localMapInstance) return;

    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
    
    renderOverlay(canvas, localMapInstance, true);
  }, [renderOverlay, waypoints, keepoutZones, selectedPoint, localMapInstance]);

  // Use the shared coordinate conversion from context

  const getClickedPoint = (x: number, y: number): string | null => {
    if (!localMapInstance) return null;
    
    // Check waypoints
    for (const point of waypoints) {
      const canvasPoint = worldToCanvasPoint(point.x, point.y, localMapInstance);
      const distance = Math.sqrt((x - canvasPoint.x) ** 2 + (y - canvasPoint.y) ** 2);
      if (distance <= 12) return point.id;
    }

    // Check keepout zone points
    for (const zone of keepoutZones) {
      for (const point of zone.points) {
        const canvasPoint = worldToCanvasPoint(point.x, point.y, localMapInstance);
        const distance = Math.sqrt((x - canvasPoint.x) ** 2 + (y - canvasPoint.y) ** 2);
        if (distance <= 8) return point.id;
      }
    }

    return null;
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === 'waypoint') {
      const worldPos = canvasToWorldPoint(x, y, localMapInstance!);
      const newWaypoint: Point = {
        x: worldPos.x,
        y: worldPos.y,
        id: generateId()
      };
      setWaypoints([...waypoints, newWaypoint]);
    } else if (activeTool === 'keepout') {
      const worldPos = canvasToWorldPoint(x, y, localMapInstance!);
      if (activeZone) {
        setKeepoutZones(keepoutZones.map(zone => 
          zone.id === activeZone 
            ? { ...zone, points: [...zone.points, { x: worldPos.x, y: worldPos.y, id: generateId() }] }
            : zone
        ));
      } else {
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

    const canvas = overlayCanvasRef.current;
    if (!canvas || !localMapInstance?.viewer?.scene) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedPoint = getClickedPoint(x, y);
    if (clickedPoint) {
      setSelectedPoint(clickedPoint);
      setIsDragging(true);
      
      const point = waypoints.find(p => p.id === clickedPoint);
      if (point) {
        const canvasPoint = worldToCanvasPoint(point.x, point.y, localMapInstance);
        setDragOffset({ x: x - canvasPoint.x, y: y - canvasPoint.y });
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !selectedPoint || activeTool !== 'select') return;

    const canvas = overlayCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const worldPos = canvasToWorldPoint(x - dragOffset.x, y - dragOffset.y, localMapInstance!);

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

  // Handle clear from parent
  useEffect(() => {
    const handleClearExternal = () => {
      clearAll();
      setActiveZone(null);
      setSelectedPoint(null);
    };
    
    if (onClear) {
      // Will be called from toolbar
    }
  }, [onClear, clearAll]);

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
      {/* ROS2D Map Container */}
      <div
        id="patrol-map-container"
        ref={mapContainerRef}
        className="w-full h-full"
      />
      
      {/* Overlay Canvas for waypoints and zones */}
      <canvas
        ref={overlayCanvasRef}
        className="absolute top-0 left-0 w-full h-full cursor-crosshair pointer-events-auto"
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
          {localMapInstance && <div className="text-green-400">Map loaded</div>}
        </div>
      </div>
    </div>
  );
};

export default PatrolMap;

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PatrolTool } from './PatrolToolbar';
import { useMapService, Point, KeepoutZone } from '@/hooks/useMapService';

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
  
  const { mapData, waypoints, keepoutZones, setWaypoints, setKeepoutZones, worldToMap, mapToWorld, initializeROS2DMap, ros2dMapService } = useMapService();

  // Calculate container dimensions based on available space and map data
  useEffect(() => {
    const updateDimensions = () => {
      if (mapContainerRef.current && mapData) {
        const rect = mapContainerRef.current.getBoundingClientRect();
        const availableWidth = rect.width;
        const availableHeight = rect.height;
        const minHeight = 400; // Minimum height for patrol map
        
        const mapAspectRatio = mapData.width / mapData.height;
        
        let containerWidth, containerHeight;
        
        // Calculate dimensions to fit the available space while maintaining map aspect ratio
        const widthBasedHeight = availableWidth / mapAspectRatio;
        const heightBasedWidth = availableHeight * mapAspectRatio;
        
        if (widthBasedHeight <= availableHeight && widthBasedHeight >= minHeight) {
          // Fit by width
          containerWidth = availableWidth;
          containerHeight = widthBasedHeight;
        } else if (heightBasedWidth <= availableWidth) {
          // Fit by height
          containerWidth = heightBasedWidth;
          containerHeight = Math.max(availableHeight, minHeight);
        } else {
          // Use minimum height and calculate width
          containerHeight = Math.max(minHeight, availableHeight);
          containerWidth = containerHeight * mapAspectRatio;
        }
        
        setMapDimensions({ 
          width: Math.round(containerWidth), 
          height: Math.round(containerHeight) 
        });
      } else if (mapContainerRef.current && !mapData) {
        // Fallback to container size if no map data yet
        const rect = mapContainerRef.current.getBoundingClientRect();
        setMapDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [mapData]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Initialize ROS2D map after dimensions are calculated
  useEffect(() => {
    if (!ros2dMapService && mapDimensions.width > 0 && mapDimensions.height > 0) {
      initializeROS2DMap('patrol-map-container', mapDimensions.width, mapDimensions.height);
    }
  }, [initializeROS2DMap, ros2dMapService, mapDimensions]);

  const drawOverlay = useCallback(() => {
    const canvas = overlayCanvasRef.current;
    const container = mapContainerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match container
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Get ROS2D viewer bounds for coordinate conversion
    if (!ros2dMapService?.viewer?.scene) return;

    const viewer = ros2dMapService.viewer;
    const scene = viewer.scene;

    // Draw keepout zones
    keepoutZones.forEach(zone => {
      if (zone.points.length > 0) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        const firstMapPoint = worldToMap(zone.points[0].x, zone.points[0].y);
        const firstX = scene.x + (firstMapPoint.x * scene.scaleX);
        const firstY = scene.y + (firstMapPoint.y * scene.scaleY);
        ctx.moveTo(firstX, firstY);
        
        for (let i = 1; i < zone.points.length; i++) {
          const mapPoint = worldToMap(zone.points[i].x, zone.points[i].y);
          const x = scene.x + (mapPoint.x * scene.scaleX);
          const y = scene.y + (mapPoint.y * scene.scaleY);
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
          const x = scene.x + (mapPoint.x * scene.scaleX);
          const y = scene.y + (mapPoint.y * scene.scaleY);
          
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
      const x = scene.x + (mapPoint.x * scene.scaleX);
      const y = scene.y + (mapPoint.y * scene.scaleY);
      
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
      const firstX = scene.x + (firstMapPoint.x * scene.scaleX);
      const firstY = scene.y + (firstMapPoint.y * scene.scaleY);
      ctx.moveTo(firstX, firstY);
      
      for (let i = 1; i < waypoints.length; i++) {
        const mapPoint = worldToMap(waypoints[i].x, waypoints[i].y);
        const x = scene.x + (mapPoint.x * scene.scaleX);
        const y = scene.y + (mapPoint.y * scene.scaleY);
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [waypoints, keepoutZones, selectedPoint, worldToMap, ros2dMapService]);

  useEffect(() => {
    drawOverlay();
  }, [drawOverlay]);

  const canvasToWorld = useCallback((canvasX: number, canvasY: number) => {
    if (!ros2dMapService?.viewer?.scene || !mapData) return { x: 0, y: 0 };
    
    const scene = ros2dMapService.viewer.scene;
    const mapX = (canvasX - scene.x) / scene.scaleX;
    const mapY = (canvasY - scene.y) / scene.scaleY;
    
    return mapToWorld(mapX, mapY);
  }, [mapData, mapToWorld, ros2dMapService]);

  const getClickedPoint = (x: number, y: number): string | null => {
    if (!ros2dMapService?.viewer?.scene) return null;
    
    const scene = ros2dMapService.viewer.scene;
    
    // Check waypoints
    for (const point of waypoints) {
      const mapPoint = worldToMap(point.x, point.y);
      const canvasX = scene.x + (mapPoint.x * scene.scaleX);
      const canvasY = scene.y + (mapPoint.y * scene.scaleY);
      const distance = Math.sqrt((x - canvasX) ** 2 + (y - canvasY) ** 2);
      if (distance <= 12) return point.id;
    }

    // Check keepout zone points
    for (const zone of keepoutZones) {
      for (const point of zone.points) {
        const mapPoint = worldToMap(point.x, point.y);
        const canvasX = scene.x + (mapPoint.x * scene.scaleX);
        const canvasY = scene.y + (mapPoint.y * scene.scaleY);
        const distance = Math.sqrt((x - canvasX) ** 2 + (y - canvasY) ** 2);
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

    const canvas = overlayCanvasRef.current;
    if (!canvas || !ros2dMapService?.viewer?.scene) return;

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
        const scene = ros2dMapService.viewer.scene;
        const canvasX = scene.x + (mapPoint.x * scene.scaleX);
        const canvasY = scene.y + (mapPoint.y * scene.scaleY);
        setDragOffset({ x: x - canvasX, y: y - canvasY });
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
          {ros2dMapService && <div className="text-green-400">Map loaded</div>}
        </div>
      </div>
    </div>
  );
};

export default PatrolMap;

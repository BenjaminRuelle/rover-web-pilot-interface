import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useMapContext } from '@/contexts/MapContext';

interface RobotPose {
  position: { x: number; y: number; z: number };
  orientation: { x: number; y: number; z: number; w: number };
}

const MiniMap: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [robotPose, setRobotPose] = useState<RobotPose | null>(null);
  const mapDimensions = { width: 200, height: 200 };
  const [zoomLevel, setZoomLevel] = useState(6);
  const [panOffset, setPanOffset] = useState({ x: 150, y: 165 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 150, y: 165 });
  const { isConnected, subscribe } = useWebSocket();
  const { mapInstance, waypoints, keepoutZones, initializeMap, worldToMap, renderOverlay } = useMapContext();

  // Initialize map for minimap
  useEffect(() => {
    if (!mapInstance) {
      initializeMap('minimap-container', mapDimensions.width, mapDimensions.height);
    }
  }, [initializeMap, mapInstance]);

  // Subscribe to robot pose
  useEffect(() => {
    const unsubscribePose = subscribe('/amcl_pose', 'geometry_msgs/msg/PoseWithCovarianceStamped', (data: any) => {
      if (data.pose && data.pose.pose) {
        setRobotPose(data.pose.pose);
      }
    });

    return () => {
      unsubscribePose();
    };
  }, [subscribe]);

  // Apply zoom and pan transformations
  useEffect(() => {
    if (mapInstance?.viewer) {
      const viewer = mapInstance.viewer;
      viewer.scene.scaleX = zoomLevel;
      viewer.scene.scaleY = zoomLevel;
      viewer.scene.x = panOffset.x;
      viewer.scene.y = panOffset.y;
    }
  }, [mapInstance?.viewer, zoomLevel, panOffset]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const zoomSpeed = 0.5;
    const newZoom = Math.max(5, Math.min(30, zoomLevel - e.deltaY * zoomSpeed * 0.01));
    setZoomLevel(newZoom);
  }, [zoomLevel]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - lastMousePos.x;
    const deltaY = e.clientY - lastMousePos.y;
    
    setPanOffset(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }));
    
    setLastMousePos({ x: e.clientX, y: e.clientY });
  }, [isDragging, lastMousePos]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const quaternionToYaw = useCallback((q: { x: number; y: number; z: number; w: number }) => {
    return Math.atan2(2 * (q.w * q.z + q.x * q.y), 1 - 2 * (q.y * q.y + q.z * q.z));
  }, []);

  // Draw overlay including robot pose
  const drawOverlay = useCallback(() => {
    const canvas = overlayCanvasRef.current;
    if (!canvas || !mapInstance?.viewer?.scene) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = mapDimensions.width;
    canvas.height = mapDimensions.height;

    // Clear and render shared overlay
    renderOverlay(canvas, false);

    // Add robot pose on top
    if (robotPose && mapInstance?.viewer?.scene) {
      const scene = mapInstance.viewer.scene;
      const mapPoint = worldToMap(robotPose.position.x, robotPose.position.y);
      const x = scene.x + (mapPoint.x * scene.scaleX);
      const y = scene.y + (mapPoint.y * scene.scaleY);
      const yaw = quaternionToYaw(robotPose.orientation);

      // Draw robot as a triangle
      ctx.fillStyle = '#00ff00';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      
      const size = 4;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(yaw);
      ctx.beginPath();
      ctx.moveTo(size, 0);
      ctx.lineTo(-size, -size/2);
      ctx.lineTo(-size, size/2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }, [robotPose, worldToMap, mapInstance, quaternionToYaw, renderOverlay]);

  useEffect(() => {
    drawOverlay();
  }, [drawOverlay]);

  return (
    <div className="absolute top-20 right-6 bg-black/50 backdrop-blur-md rounded-lg border border-white/20 p-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-white text-xs font-medium">MAP</span>
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
      </div>
      <div className="relative">
        <div
          id="minimap-container"
          ref={mapContainerRef}
          className="rounded border border-white/10 cursor-grab active:cursor-grabbing overflow-hidden"
          style={{ 
            width: `${mapDimensions.width}px`, 
            height: `${mapDimensions.height}px` 
          }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
        
        {/* Overlay Canvas for waypoints and zones */}
        <canvas
          ref={overlayCanvasRef}
          className="absolute top-0 left-0 rounded pointer-events-none"
          style={{
            width: `${mapDimensions.width}px`,
            height: `${mapDimensions.height}px`
          }}
        />
      </div>
      {robotPose && (
        <div className="mt-2 text-xs text-white/70">
          <div>X: {robotPose.position.x.toFixed(1)}m</div>
          <div>Y: {robotPose.position.y.toFixed(1)}m</div>
        </div>
      )}
      <div className="mt-1 text-xs text-white/50">
        <div>Waypoints: {waypoints.length}</div>
        <div>Zones: {keepoutZones.filter(z => z.completed).length}</div>
      </div>
    </div>
  );
};

export default MiniMap;
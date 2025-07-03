import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useMapService } from '@/hooks/useMapService';

interface RobotPose {
  position: { x: number; y: number; z: number };
  orientation: { x: number; y: number; z: number; w: number };
}

const MiniMap: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [robotPose, setRobotPose] = useState<RobotPose | null>(null);
  const [mapDimensions, setMapDimensions] = useState({ width: 200, height: 200 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const { isConnected, subscribe } = useWebSocket();
  const { waypoints, keepoutZones, initializeROS2DMap, ros2dMapService } = useMapService();

  // Initialize ROS2D map
  useEffect(() => {
    if (!ros2dMapService) {
      initializeROS2DMap('minimap-container', mapDimensions.width, mapDimensions.height);
    }
  }, [initializeROS2DMap, ros2dMapService, mapDimensions]);

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

  // Update map dimensions based on loaded map
  useEffect(() => {
    if (ros2dMapService?.gridClient?.currentGrid) {
      const grid = ros2dMapService.gridClient.currentGrid;
      const mapWidth = grid.width;
      const mapHeight = grid.height;
      
      // Calculate aspect ratio
      const aspectRatio = mapWidth / mapHeight;
      
      // Set base size and scale to maintain aspect ratio
      const baseSize = 200;
      let canvasWidth, canvasHeight;
      
      if (aspectRatio > 1) {
        // Wider than tall
        canvasWidth = baseSize;
        canvasHeight = baseSize / aspectRatio;
      } else {
        // Taller than wide
        canvasHeight = baseSize;
        canvasWidth = baseSize * aspectRatio;
      }
      
      // Ensure minimum size
      const minSize = 150;
      if (canvasWidth < minSize || canvasHeight < minSize) {
        const scale = minSize / Math.min(canvasWidth, canvasHeight);
        canvasWidth *= scale;
        canvasHeight *= scale;
      }
      
      setMapDimensions({ 
        width: Math.round(canvasWidth), 
        height: Math.round(canvasHeight) 
      });
    }
  }, [ros2dMapService?.gridClient?.currentGrid]);

  // Apply zoom and pan transformations
  useEffect(() => {
    if (ros2dMapService?.viewer) {
      const viewer = ros2dMapService.viewer;
      viewer.scene.scaleX = zoomLevel;
      viewer.scene.scaleY = zoomLevel;
      viewer.scene.x = panOffset.x;
      viewer.scene.y = panOffset.y;
    }
  }, [ros2dMapService?.viewer, zoomLevel, panOffset]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const zoomSpeed = 0.1;
    const newZoom = Math.max(0.5, Math.min(3, zoomLevel - e.deltaY * zoomSpeed * 0.01));
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

  return (
    <div className="absolute top-20 right-6 bg-black/50 backdrop-blur-md rounded-lg border border-white/20 p-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-white text-xs font-medium">MAP</span>
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
      </div>
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
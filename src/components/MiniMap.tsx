import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useMapService } from '@/hooks/useMapService';

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
  const [panOffset, setPanOffset] = useState({ x: 150 , y: 165 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 150, y: 165 });
  const { isConnected, subscribe } = useWebSocket();
  const { waypoints, keepoutZones, initializeROS2DMap, ros2dMapService, worldToMap } = useMapService();

  // Initialize ROS2D map
  useEffect(() => {
    if (!ros2dMapService) {
      initializeROS2DMap('minimap-container', mapDimensions.width, mapDimensions.height);
    }
  }, [initializeROS2DMap, ros2dMapService]);

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
    if (ros2dMapService?.viewer) {
      const viewer = ros2dMapService.viewer;
      viewer.scene.scaleX = zoomLevel;
      viewer.scene.scaleY = zoomLevel;
      viewer.scene.x = panOffset.x;
      viewer.scene.y = panOffset.y;
      console.log('Pan offset:', panOffset);
    }
  }, [ros2dMapService?.viewer, zoomLevel, panOffset]);

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

  // Draw waypoints and keepout zones overlay
  const drawOverlay = useCallback(() => {
    const canvas = overlayCanvasRef.current;
    if (!canvas || !ros2dMapService?.viewer?.scene) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match container
    canvas.width = mapDimensions.width;
    canvas.height = mapDimensions.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scene = ros2dMapService.viewer.scene;

    // Draw keepout zones
    keepoutZones.forEach(zone => {
      if (zone.points.length > 0) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.lineWidth = 1;
        
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
      }
    });

    // Draw waypoints
    waypoints.forEach((point, index) => {
      const mapPoint = worldToMap(point.x, point.y);
      const x = scene.x + (mapPoint.x * scene.scaleX);
      const y = scene.y + (mapPoint.y * scene.scaleY);
      
      // Draw waypoint circle
      ctx.fillStyle = '#3b82f6';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      // Draw waypoint number
      ctx.fillStyle = '#ffffff';
      ctx.font = '8px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((index + 1).toString(), x, y);
    });

    // Draw path between waypoints
    if (waypoints.length > 1) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
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

    // Draw robot pose if available
    if (robotPose) {
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
  }, [waypoints, keepoutZones, robotPose, worldToMap, ros2dMapService, quaternionToYaw]);

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
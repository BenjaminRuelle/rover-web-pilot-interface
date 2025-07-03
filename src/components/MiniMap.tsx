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
  const { isConnected, subscribe } = useWebSocket();
  const { waypoints, keepoutZones, initializeROS2DMap, ros2dMapService, mapData } = useMapService();

  // Calculate canvas dimensions based on map ratio and size factor
  useEffect(() => {
    if (mapData) {
      const mapAspectRatio = mapData.width / mapData.height;
      const sizeFactor = 200; // Base size for minimap
      const minHeight = 150; // Minimum height
      
      let canvasWidth, canvasHeight;
      
      if (mapAspectRatio > 1) {
        // Map is wider than tall
        canvasWidth = sizeFactor;
        canvasHeight = Math.max(sizeFactor / mapAspectRatio, minHeight);
      } else {
        // Map is taller than wide
        canvasHeight = Math.max(sizeFactor, minHeight);
        canvasWidth = canvasHeight * mapAspectRatio;
      }
      
      setMapDimensions({ 
        width: Math.round(canvasWidth), 
        height: Math.round(canvasHeight) 
      });
    }
  }, [mapData]);

  // Initialize ROS2D map after dimensions are calculated
  useEffect(() => {
    if (!ros2dMapService && mapData && mapDimensions.width > 0 && mapDimensions.height > 0) {
      initializeROS2DMap('minimap-container', mapDimensions.width, mapDimensions.height);
    }
  }, [initializeROS2DMap, ros2dMapService, mapData, mapDimensions]);

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
        className="rounded border border-white/10"
        style={{ 
          width: `${mapDimensions.width}px`, 
          height: `${mapDimensions.height}px` 
        }}
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

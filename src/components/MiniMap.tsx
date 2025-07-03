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

  // Calculate container dimensions based on available space and map data
  useEffect(() => {
    const updateDimensions = () => {
      if (mapContainerRef.current && mapData) {
        const rect = mapContainerRef.current.getBoundingClientRect();
        const availableWidth = rect.width || 200; // Fallback width
        const availableHeight = rect.height || 200; // Fallback height
        const minHeight = 150; // Minimum height for minimap
        
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
        setMapDimensions({ width: rect.width || 200, height: rect.height || 200 });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
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

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useMapService } from '@/hooks/useMapService';

// Declare global ROS2D types
declare global {
  interface Window {
    ROSLIB: any;
    ROS2D: any;
    EaselJS: any;
    EventEmitter2: any;
    createjs: any;
  }
}

interface RobotPose {
  position: { x: number; y: number; z: number };
  orientation: { x: number; y: number; z: number; w: number };
}

const MiniMap: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const gridClientRef = useRef<any>(null);
  const rosRef = useRef<any>(null);
  const [robotPose, setRobotPose] = useState<RobotPose | null>(null);
  const [mapDimensions, setMapDimensions] = useState({ width: 200, height: 200 });
  const { isConnected, subscribe } = useWebSocket();
  const { waypoints, keepoutZones, worldToMap } = useMapService();

  // Load ROS2D.js libraries and initialize map
  useEffect(() => {
    const loadLibraries = async () => {
      // Load EaselJS first (required for createjs)
      if (!window.createjs) {
        const easelScript = document.createElement('script');
        easelScript.src = 'https://cdn.jsdelivr.net/npm/easeljs@1/lib/easeljs.js';
        document.head.appendChild(easelScript);
        await new Promise(resolve => easelScript.onload = resolve);
      }

      // Load EventEmitter2
      if (!window.EventEmitter2) {
        const eventScript = document.createElement('script');
        eventScript.src = 'https://cdn.jsdelivr.net/npm/eventemitter2@6/lib/eventemitter2.js';
        document.head.appendChild(eventScript);
        await new Promise(resolve => eventScript.onload = resolve);
      }

      // Load roslibjs
      if (!window.ROSLIB) {
        const roslibScript = document.createElement('script');
        roslibScript.src = 'https://cdn.jsdelivr.net/npm/roslib@1/build/roslib.js';
        document.head.appendChild(roslibScript);
        await new Promise(resolve => roslibScript.onload = resolve);
      }

      // Now load ROS2D after all dependencies are loaded
      if (!window.ROS2D) {
        const ros2dScript = document.createElement('script');
        ros2dScript.src = '/src/lib/ros2d.min.js';
        document.head.appendChild(ros2dScript);
        await new Promise(resolve => ros2dScript.onload = resolve);
      }
    };

    const initMap = async () => {
      try {
        await loadLibraries();

        if (!mapContainerRef.current || !window.ROSLIB || !window.ROS2D) {
          console.error('Required libraries or container not available');
          return;
        }

        console.log('Initializing ROS2D MiniMap...');

        // Connect to ROS
        rosRef.current = new window.ROSLIB.Ros({
          url: 'ws://localhost:9090'
        });

        rosRef.current.on('connection', () => {
          console.log('MiniMap: Connected to ROS2 via WebSocket');
        });

        rosRef.current.on('error', (error: any) => {
          console.error('MiniMap: ROS connection error:', error);
        });

        rosRef.current.on('close', () => {
          console.log('MiniMap: ROS connection closed');
        });

        // Create the main viewer with smaller dimensions for mini map
        viewerRef.current = new window.ROS2D.Viewer({
          divID: 'minimap-container',
          width: mapDimensions.width,
          height: mapDimensions.height
        });

        // Setup the map client
        gridClientRef.current = new window.ROS2D.OccupancyGridClient({
          ros: rosRef.current,
          rootObject: viewerRef.current.scene
        });

        // Scale the canvas to fit to the map
        gridClientRef.current.on('change', () => {
          console.log('MiniMap: Map data received:', gridClientRef.current.currentGrid);
          viewerRef.current.scaleToDimensions(
            gridClientRef.current.currentGrid.width,
            gridClientRef.current.currentGrid.height
          );
        });

        console.log('ROS2D MiniMap initialized successfully');

      } catch (error) {
        console.error('Error initializing ROS2D MiniMap:', error);
      }
    };

    initMap();

    // Cleanup function
    return () => {
      if (gridClientRef.current) {
        gridClientRef.current.disconnect();
      }
      if (viewerRef.current) {
        viewerRef.current.disconnect();
      }
      if (rosRef.current) {
        rosRef.current.close();
      }
    };
  }, [mapDimensions]);

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

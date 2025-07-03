import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from './useWebSocket';

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

export interface Point {
  x: number;
  y: number;
  id: string;
}

export interface KeepoutZone {
  id: string;
  points: Point[];
  completed: boolean;
}

export interface MapData {
  width: number;
  height: number;
  resolution: number;
  origin: { x: number; y: number; z: number };
  data: number[];
}

export interface ROS2DMapService {
  viewer: any;
  gridClient: any;
  ros: any;
  isInitialized: boolean;
}

export interface MapService {
  mapData: MapData | null;
  waypoints: Point[];
  keepoutZones: KeepoutZone[];
  setWaypoints: (waypoints: Point[]) => void;
  setKeepoutZones: (zones: KeepoutZone[]) => void;
  worldToMap: (worldX: number, worldY: number) => { x: number; y: number };
  mapToWorld: (mapX: number, mapY: number) => { x: number; y: number };
  initializeROS2DMap: (containerId: string, width: number, height: number) => Promise<ROS2DMapService | null>;
  ros2dMapService: ROS2DMapService | null;
}

let globalMapService: MapService | null = null;

export const useMapService = (): MapService => {
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [waypoints, setWaypoints] = useState<Point[]>([]);
  const [keepoutZones, setKeepoutZones] = useState<KeepoutZone[]>([]);
  const [ros2dMapService, setRos2dMapService] = useState<ROS2DMapService | null>(null);
  const { subscribe } = useWebSocket();

  // Subscribe to map data only once
  useEffect(() => {
    if (mapData) return; // Map already loaded

    const unsubscribeMap = subscribe('/map', 'nav_msgs/msg/OccupancyGrid', (data: any) => {
      console.log('Received map data:', data);
      const newMapData: MapData = {
        width: data.info.width,
        height: data.info.height,
        resolution: data.info.resolution,
        origin: data.info.origin.position,
        data: data.data
      };
      setMapData(newMapData);
    });

    return () => {
      unsubscribeMap();
    };
  }, [subscribe, mapData]);

  const worldToMap = useCallback((worldX: number, worldY: number) => {
    if (!mapData) return { x: 0, y: 0 };
    
    const mapX = Math.floor((worldX - mapData.origin.x) / mapData.resolution);
    const mapY = Math.floor((worldY - mapData.origin.y) / mapData.resolution);
    
    return { x: mapX, y: mapData.height - mapY - 1 }; // Flip Y axis
  }, [mapData]);

  const mapToWorld = useCallback((mapX: number, mapY: number) => {
    if (!mapData) return { x: 0, y: 0 };
    
    const flippedY = mapData.height - mapY - 1; // Flip Y axis back
    const worldX = mapX * mapData.resolution + mapData.origin.x;
    const worldY = flippedY * mapData.resolution + mapData.origin.y;
    
    return { x: worldX, y: worldY };
  }, [mapData]);

  const loadROS2DLibraries = useCallback(async () => {
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
  }, []);

  const initializeROS2DMap = useCallback(async (containerId: string, width: number, height: number): Promise<ROS2DMapService | null> => {
    try {
      await loadROS2DLibraries();

      if (!window.ROSLIB || !window.ROS2D) {
        console.error('Required ROS2D libraries not available');
        return null;
      }

      console.log('Initializing ROS2D Map...');

      // Connect to ROS
      const ros = new window.ROSLIB.Ros({
        url: 'ws://localhost:9090'
      });

      ros.on('connection', () => {
        console.log('ROS2D Map: Connected to ROS2 via WebSocket');
      });

      ros.on('error', (error: any) => {
        console.error('ROS2D Map: ROS connection error:', error);
      });

      ros.on('close', () => {
        console.log('ROS2D Map: ROS connection closed');
      });

      // Create the main viewer
      const viewer = new window.ROS2D.Viewer({
        divID: containerId,
        width: width,
        height: height
      });

      // Setup the map client
      const gridClient = new window.ROS2D.OccupancyGridClient({
        ros: ros,
        rootObject: viewer.scene
      });

      // Scale and center the canvas to fit the map while maintaining aspect ratio
      gridClient.on('change', () => {        
        viewer.scaleToDimensions(gridClient.currentGrid.width, gridClient.currentGrid.height);
        viewer.shift(gridClient.currentGrid.pose.position.x, gridClient.currentGrid.pose.position.y);
       
      });

      const mapService = {
        viewer,
        gridClient,
        ros,
        isInitialized: true
      };

      setRos2dMapService(mapService);
      console.log('ROS2D Map initialized successfully');
      return mapService;

    } catch (error) {
      console.error('Error initializing ROS2D Map:', error);
      return null;
    }
  }, [loadROS2DLibraries]);

  const service: MapService = {
    mapData,
    waypoints,
    keepoutZones,
    setWaypoints,
    setKeepoutZones,
    worldToMap,
    mapToWorld,
    initializeROS2DMap,
    ros2dMapService
  };

  // Store globally for sharing between components
  globalMapService = service;

  return service;
};

export const getGlobalMapService = (): MapService | null => {
  return globalMapService;
};

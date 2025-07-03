import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';

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

export interface SharedMapInstance {
  viewer: any;
  gridClient: any;
  ros: any;
  isInitialized: boolean;
  containerId: string;
  dimensions: { width: number; height: number };
}

interface MapContextType {
  // Map instance
  mapInstance: SharedMapInstance | null;
  mapData: MapData | null;
  
  // Points and zones
  waypoints: Point[];
  keepoutZones: KeepoutZone[];
  
  // Actions
  setWaypoints: (waypoints: Point[]) => void;
  setKeepoutZones: (zones: KeepoutZone[]) => void;
  clearAll: () => void;
  
  // Coordinate conversion
  worldToMap: (worldX: number, worldY: number) => { x: number; y: number };
  mapToWorld: (mapX: number, mapY: number) => { x: number; y: number };
  
  // Map initialization
  initializeMap: (containerId: string, width: number, height: number) => Promise<SharedMapInstance | null>;
  
  // Overlay rendering
  renderOverlay: (canvas: HTMLCanvasElement, isEditable?: boolean) => void;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

export const useMapContext = () => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMapContext must be used within a MapProvider');
  }
  return context;
};

interface MapProviderProps {
  children: ReactNode;
}

export const MapProvider: React.FC<MapProviderProps> = ({ children }) => {
  const [mapInstance, setMapInstance] = useState<SharedMapInstance | null>(null);
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [waypoints, setWaypoints] = useState<Point[]>([]);
  const [keepoutZones, setKeepoutZones] = useState<KeepoutZone[]>([]);
  const { subscribe } = useWebSocket();

  // Subscribe to map data
  React.useEffect(() => {
    if (mapData) return;

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
    
    return { x: mapX, y: mapData.height - mapY - 1 };
  }, [mapData]);

  const mapToWorld = useCallback((mapX: number, mapY: number) => {
    if (!mapData) return { x: 0, y: 0 };
    
    const flippedY = mapData.height - mapY - 1;
    const worldX = mapX * mapData.resolution + mapData.origin.x;
    const worldY = flippedY * mapData.resolution + mapData.origin.y;
    
    return { x: worldX, y: worldY };
  }, [mapData]);

  const loadROS2DLibraries = useCallback(async () => {
    if (!window.createjs) {
      const easelScript = document.createElement('script');
      easelScript.src = 'https://cdn.jsdelivr.net/npm/easeljs@1/lib/easeljs.js';
      document.head.appendChild(easelScript);
      await new Promise(resolve => easelScript.onload = resolve);
    }

    if (!window.EventEmitter2) {
      const eventScript = document.createElement('script');
      eventScript.src = 'https://cdn.jsdelivr.net/npm/eventemitter2@6/lib/eventemitter2.js';
      document.head.appendChild(eventScript);
      await new Promise(resolve => eventScript.onload = resolve);
    }

    if (!window.ROSLIB) {
      const roslibScript = document.createElement('script');
      roslibScript.src = 'https://cdn.jsdelivr.net/npm/roslib@1/build/roslib.js';
      document.head.appendChild(roslibScript);
      await new Promise(resolve => roslibScript.onload = resolve);
    }

    if (!window.ROS2D) {
      const ros2dScript = document.createElement('script');
      ros2dScript.src = '/src/lib/ros2d.min.js';
      document.head.appendChild(ros2dScript);
      await new Promise(resolve => ros2dScript.onload = resolve);
    }
  }, []);

  const initializeMap = useCallback(async (containerId: string, width: number, height: number): Promise<SharedMapInstance | null> => {
    // If we already have a map instance for this container, return it
    if (mapInstance && mapInstance.containerId === containerId) {
      return mapInstance;
    }

    try {
      await loadROS2DLibraries();

      if (!window.ROSLIB || !window.ROS2D) {
        console.error('Required ROS2D libraries not available');
        return null;
      }

      console.log('Initializing shared ROS2D Map...');

      const ros = new window.ROSLIB.Ros({
        url: 'ws://localhost:9090'
      });

      ros.on('connection', () => {
        console.log('Shared ROS2D Map: Connected to ROS2 via WebSocket');
      });

      ros.on('error', (error: any) => {
        console.error('Shared ROS2D Map: ROS connection error:', error);
      });

      ros.on('close', () => {
        console.log('Shared ROS2D Map: ROS connection closed');
      });

      const viewer = new window.ROS2D.Viewer({
        divID: containerId,
        width: width,
        height: height
      });

      const gridClient = new window.ROS2D.OccupancyGridClient({
        ros: ros,
        rootObject: viewer.scene
      });

      gridClient.on('change', () => {        
        viewer.scaleToDimensions(gridClient.currentGrid.width, gridClient.currentGrid.height);
        viewer.shift(gridClient.currentGrid.pose.position.x, gridClient.currentGrid.pose.position.y);
      });

      const newMapInstance = {
        viewer,
        gridClient,
        ros,
        isInitialized: true,
        containerId,
        dimensions: { width, height }
      };

      setMapInstance(newMapInstance);
      console.log('Shared ROS2D Map initialized successfully');
      return newMapInstance;

    } catch (error) {
      console.error('Error initializing shared ROS2D Map:', error);
      return null;
    }
  }, [loadROS2DLibraries, mapInstance]);

  const renderOverlay = useCallback((canvas: HTMLCanvasElement, isEditable: boolean = false) => {
    if (!mapInstance?.viewer?.scene) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scene = mapInstance.viewer.scene;

    // Draw keepout zones
    keepoutZones.forEach(zone => {
      if (zone.points.length > 0) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.lineWidth = isEditable ? 2 : 1;
        
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

        // Draw zone points (only in editable mode)
        if (isEditable) {
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
      }
    });

    // Draw waypoints
    waypoints.forEach((point, index) => {
      const mapPoint = worldToMap(point.x, point.y);
      const x = scene.x + (mapPoint.x * scene.scaleX);
      const y = scene.y + (mapPoint.y * scene.scaleY);
      
      ctx.fillStyle = '#3b82f6';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = isEditable ? 2 : 1;
      ctx.beginPath();
      ctx.arc(x, y, isEditable ? 12 : 3, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = isEditable ? '12px Arial' : '8px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((index + 1).toString(), x, y);
    });

    // Draw path between waypoints
    if (waypoints.length > 1) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = isEditable ? 2 : 1;
      ctx.setLineDash(isEditable ? [5, 5] : [2, 2]);
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
  }, [mapInstance, keepoutZones, waypoints, worldToMap]);

  const clearAll = useCallback(() => {
    setWaypoints([]);
    setKeepoutZones([]);
  }, []);

  const value: MapContextType = {
    mapInstance,
    mapData,
    waypoints,
    keepoutZones,
    setWaypoints,
    setKeepoutZones,
    clearAll,
    worldToMap,
    mapToWorld,
    initializeMap,
    renderOverlay
  };

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
};

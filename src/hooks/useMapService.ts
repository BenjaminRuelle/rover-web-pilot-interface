
import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';

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

export interface MapService {
  mapData: MapData | null;
  waypoints: Point[];
  keepoutZones: KeepoutZone[];
  setWaypoints: (waypoints: Point[]) => void;
  setKeepoutZones: (zones: KeepoutZone[]) => void;
  worldToMap: (worldX: number, worldY: number) => { x: number; y: number };
  mapToWorld: (mapX: number, mapY: number) => { x: number; y: number };
}

let globalMapService: MapService | null = null;

export const useMapService = (): MapService => {
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [waypoints, setWaypoints] = useState<Point[]>([]);
  const [keepoutZones, setKeepoutZones] = useState<KeepoutZone[]>([]);
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

  const service: MapService = {
    mapData,
    waypoints,
    keepoutZones,
    setWaypoints,
    setKeepoutZones,
    worldToMap,
    mapToWorld
  };

  // Store globally for sharing between components
  globalMapService = service;

  return service;
};

export const getGlobalMapService = (): MapService | null => {
  return globalMapService;
};

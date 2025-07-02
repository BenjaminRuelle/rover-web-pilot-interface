import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useMapService } from '@/hooks/useMapService';

interface RobotPose {
  position: { x: number; y: number; z: number };
  orientation: { x: number; y: number; z: number; w: number };
}

const MiniMap: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [robotPose, setRobotPose] = useState<RobotPose | null>(null);
  const [mapDimensions, setMapDimensions] = useState({ width: 200, height: 200 });
  const { isConnected, subscribe } = useWebSocket();
  const { mapData, waypoints, keepoutZones, worldToMap } = useMapService();

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

  const drawMiniMap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = mapDimensions.width;
    canvas.height = mapDimensions.height;

    // Clear canvas with dark background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw map if available
    if (mapData) {
      const imageData = ctx.createImageData(canvas.width, canvas.height);
      const scaleX = mapData.width / canvas.width;
      const scaleY = mapData.height / canvas.height;

      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const mapX = Math.floor(x * scaleX);
          const mapY = Math.floor(y * scaleY);
          const mapIndex = mapY * mapData.width + mapX;
          const value = mapData.data[mapIndex];

          let r, g, b;
          if (value === -1) {
            // Unknown space - gray
            r = g = b = 128;
          } else if (value === 0) {
            // Free space - white
            r = g = b = 255;
          } else {
            // Occupied space - black
            r = g = b = 0;
          }

          const pixelIndex = (y * canvas.width + x) * 4;
          imageData.data[pixelIndex] = r;
          imageData.data[pixelIndex + 1] = g;
          imageData.data[pixelIndex + 2] = b;
          imageData.data[pixelIndex + 3] = 255;
        }
      }
      ctx.putImageData(imageData, 0, 0);
    }

    // Draw keepout zones
    keepoutZones.forEach(zone => {
      if (zone.points.length > 0 && zone.completed) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.lineWidth = 1;
        
        ctx.beginPath();
        const firstPoint = worldToMap(zone.points[0].x, zone.points[0].y);
        const scaledFirstX = (firstPoint.x / (mapData?.width || 1)) * canvas.width;
        const scaledFirstY = (firstPoint.y / (mapData?.height || 1)) * canvas.height;
        ctx.moveTo(scaledFirstX, scaledFirstY);
        
        for (let i = 1; i < zone.points.length; i++) {
          const point = worldToMap(zone.points[i].x, zone.points[i].y);
          const scaledX = (point.x / (mapData?.width || 1)) * canvas.width;
          const scaledY = (point.y / (mapData?.height || 1)) * canvas.height;
          ctx.lineTo(scaledX, scaledY);
        }
        
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    });

    // Draw waypoints
    waypoints.forEach((waypoint, index) => {
      const mapPoint = worldToMap(waypoint.x, waypoint.y);
      const scaledX = (mapPoint.x / (mapData?.width || 1)) * canvas.width;
      const scaledY = (mapPoint.y / (mapData?.height || 1)) * canvas.height;
      
      // Draw waypoint circle
      ctx.fillStyle = '#3b82f6';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(scaledX, scaledY, 3, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      // Draw waypoint number
      ctx.fillStyle = '#ffffff';
      ctx.font = '8px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((index + 1).toString(), scaledX, scaledY);
    });

    // Draw waypoint path
    if (waypoints.length > 1) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      
      const firstWaypoint = worldToMap(waypoints[0].x, waypoints[0].y);
      const scaledFirstX = (firstWaypoint.x / (mapData?.width || 1)) * canvas.width;
      const scaledFirstY = (firstWaypoint.y / (mapData?.height || 1)) * canvas.height;
      ctx.moveTo(scaledFirstX, scaledFirstY);
      
      for (let i = 1; i < waypoints.length; i++) {
        const waypoint = worldToMap(waypoints[i].x, waypoints[i].y);
        const scaledX = (waypoint.x / (mapData?.width || 1)) * canvas.width;
        const scaledY = (waypoint.y / (mapData?.height || 1)) * canvas.height;
        ctx.lineTo(scaledX, scaledY);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw robot if position is available
    if (robotPose) {
      const robotMapPos = worldToMap(robotPose.position.x, robotPose.position.y);
      const robotX = (robotMapPos.x / (mapData?.width || 1)) * canvas.width;
      const robotY = (robotMapPos.y / (mapData?.height || 1)) * canvas.height;
      const robotYaw = quaternionToYaw(robotPose.orientation);

      // Robot body (green circle)
      ctx.fillStyle = '#00ff00';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(robotX, robotY, 4, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      // Robot direction indicator (green line)
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(robotX, robotY);
      ctx.lineTo(robotX + Math.cos(robotYaw) * 8, robotY - Math.sin(robotYaw) * 8);
      ctx.stroke();
    } else {
      // Show a demo robot position in the center when no real data is available
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Demo robot body
      ctx.fillStyle = '#00ff00';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 4, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      // Demo robot direction (pointing up)
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX, centerY - 8);
      ctx.stroke();
    }

    // Draw border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
  }, [mapData, mapDimensions, robotPose, quaternionToYaw, waypoints, keepoutZones, worldToMap]);

  useEffect(() => {
    drawMiniMap();
  }, [drawMiniMap]);

  return (
    <div className="absolute top-20 right-6 bg-black/50 backdrop-blur-md rounded-lg border border-white/20 p-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-white text-xs font-medium">MAP</span>
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
      </div>
      <canvas
        ref={canvasRef}
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

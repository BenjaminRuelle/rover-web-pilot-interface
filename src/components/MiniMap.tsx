
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';

interface RobotPose {
  position: { x: number; y: number; z: number };
  orientation: { x: number; y: number; z: number; w: number };
}

interface OccupancyGrid {
  info: {
    resolution: number;
    width: number;
    height: number;
    origin: {
      position: { x: number; y: number; z: number };
      orientation: { x: number; y: number; z: number; w: number };
    };
  };
  data: number[];
}

const MiniMap: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [robotPose, setRobotPose] = useState<RobotPose | null>(null);
  const [map, setMap] = useState<OccupancyGrid | null>(null);
  const { isConnected, subscribe } = useWebSocket();

  // Subscribe to ROS2 topics
  useEffect(() => {
    const unsubscribeMap = subscribe('/map', 'nav_msgs/msg/OccupancyGrid', (data: OccupancyGrid) => {
      setMap(data);
    });

    const unsubscribePose = subscribe('/amcl_pose', 'geometry_msgs/msg/PoseWithCovarianceStamped', (data: any) => {
      if (data.pose && data.pose.pose) {
        setRobotPose(data.pose.pose);
      }
    });

    return () => {
      unsubscribeMap();
      unsubscribePose();
    };
  }, [subscribe]);

  const quaternionToYaw = useCallback((q: { x: number; y: number; z: number; w: number }) => {
    return Math.atan2(2 * (q.w * q.z + q.x * q.y), 1 - 2 * (q.y * q.y + q.z * q.z));
  }, []);

  const worldToPixel = useCallback((worldX: number, worldY: number, mapInfo: any, scale: number) => {
    const pixelX = Math.floor((worldX - mapInfo.origin.position.x) / mapInfo.resolution) * scale;
    const pixelY = Math.floor((worldY - mapInfo.origin.position.y) / mapInfo.resolution) * scale;
    return { x: pixelX, y: mapInfo.height * scale - pixelY };
  }, []);

  const drawMiniMap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !map) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scale = 0.3; // Mini scale for the minimap
    canvas.width = 200;
    canvas.height = 200;

    // Clear canvas
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate center for robot following
    let centerX = canvas.width / 2;
    let centerY = canvas.height / 2;

    if (robotPose) {
      const robotPixel = worldToPixel(robotPose.position.x, robotPose.position.y, map.info, scale);
      centerX = canvas.width / 2 - robotPixel.x;
      centerY = canvas.height / 2 - robotPixel.y;
    }

    // Draw occupancy grid
    const imageData = ctx.createImageData(Math.floor(map.info.width * scale), Math.floor(map.info.height * scale));
    
    for (let y = 0; y < Math.floor(map.info.height * scale); y++) {
      for (let x = 0; x < Math.floor(map.info.width * scale); x++) {
        const origX = Math.floor(x / scale);
        const origY = Math.floor(y / scale);
        const origIndex = origY * map.info.width + origX;
        
        if (origIndex < map.data.length) {
          const value = map.data[origIndex];
          let color = 128;
          
          if (value === 0) color = 255;
          else if (value === 100) color = 0;
          
          const pixelIndex = (y * Math.floor(map.info.width * scale) + x) * 4;
          imageData.data[pixelIndex] = color;
          imageData.data[pixelIndex + 1] = color;
          imageData.data[pixelIndex + 2] = color;
          imageData.data[pixelIndex + 3] = 255;
        }
      }
    }

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = Math.floor(map.info.width * scale);
    tempCanvas.height = Math.floor(map.info.height * scale);
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCtx.putImageData(imageData, 0, 0);
      ctx.drawImage(tempCanvas, centerX, centerY);
    }

    // Draw robot
    if (robotPose) {
      const robotPixel = worldToPixel(robotPose.position.x, robotPose.position.y, map.info, scale);
      const robotX = centerX + robotPixel.x;
      const robotY = centerY + robotPixel.y;
      const robotYaw = quaternionToYaw(robotPose.orientation);

      // Robot body
      ctx.fillStyle = '#00ff00';
      ctx.beginPath();
      ctx.arc(robotX, robotY, 4, 0, 2 * Math.PI);
      ctx.fill();

      // Robot direction
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(robotX, robotY);
      ctx.lineTo(robotX + Math.cos(robotYaw) * 8, robotY + Math.sin(robotYaw) * 8);
      ctx.stroke();
    }

    // Draw border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
  }, [map, robotPose, worldToPixel, quaternionToYaw]);

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
      />
      {robotPose && (
        <div className="mt-2 text-xs text-white/70">
          <div>X: {robotPose.position.x.toFixed(1)}m</div>
          <div>Y: {robotPose.position.y.toFixed(1)}m</div>
        </div>
      )}
    </div>
  );
};

export default MiniMap;

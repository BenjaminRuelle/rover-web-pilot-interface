
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';

interface RobotPose {
  position: { x: number; y: number; z: number };
  orientation: { x: number; y: number; z: number; w: number };
}

const MiniMap: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [robotPose, setRobotPose] = useState<RobotPose | null>(null);
  const [mapImage, setMapImage] = useState<HTMLImageElement | null>(null);
  const [mapDimensions, setMapDimensions] = useState({ width: 0, height: 0 });
  const { isConnected, subscribe } = useWebSocket();

  // Load map image and calculate dimensions
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setMapImage(img);
      // Calculate dimensions while maintaining aspect ratio
      const maxWidth = 200;
      const maxHeight = 200;
      const aspectRatio = img.width / img.height;
      
      let width, height;
      if (aspectRatio > 1) {
        // Image is wider than tall
        width = maxWidth;
        height = maxWidth / aspectRatio;
      } else {
        // Image is taller than wide
        height = maxHeight;
        width = maxHeight * aspectRatio;
      }
      
      setMapDimensions({ width: Math.round(width), height: Math.round(height) });
    };
    img.src = '/lovable-uploads/e0784714-beed-409d-8760-417979b44c80.png';
  }, []);

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
    if (!canvas || !mapImage || mapDimensions.width === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match calculated dimensions
    canvas.width = mapDimensions.width;
    canvas.height = mapDimensions.height;

    // Clear canvas with dark background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw the map image maintaining aspect ratio
    ctx.drawImage(mapImage, 0, 0, canvas.width, canvas.height);

    // Draw robot if position is available
    if (robotPose) {
      // Convert world coordinates to canvas coordinates
      // Assuming the map represents a coordinate system where (0,0) is at the center
      const robotX = canvas.width / 2 + robotPose.position.x * 10; // Scale factor of 10
      const robotY = canvas.height / 2 - robotPose.position.y * 10; // Invert Y axis for screen coordinates
      const robotYaw = quaternionToYaw(robotPose.orientation);

      // Always draw robot, even if outside bounds (for debugging)
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
      ctx.lineTo(robotX + Math.cos(robotYaw) * 8, robotY - Math.sin(robotYaw) * 8); // Invert Y for direction
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
  }, [mapImage, mapDimensions, robotPose, quaternionToYaw]);

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
    </div>
  );
};

export default MiniMap;

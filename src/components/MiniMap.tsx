
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';

interface RobotPose {
  position: { x: number; y: number; z: number };
  orientation: { x: number; y: number; z: number; w: number };
}

const MiniMap: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [robotPose, setRobotPose] = useState<RobotPose | null>(null);
  const { isConnected, subscribe } = useWebSocket();

  // Subscribe to robot pose only
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

    canvas.width = 200;
    canvas.height = 200;

    // Clear canvas
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Load and draw the static map image
    const mapImage = new Image();
    mapImage.onload = () => {
      // Draw the map image scaled to fit the canvas
      ctx.drawImage(mapImage, 0, 0, canvas.width, canvas.height);

      // Draw robot if position is available
      if (robotPose) {
        // Convert world coordinates to canvas coordinates (simplified mapping)
        // This is a basic conversion - you may need to adjust based on your coordinate system
        const robotX = canvas.width / 2 + robotPose.position.x * 10; // Scale factor of 10
        const robotY = canvas.height / 2 - robotPose.position.y * 10; // Invert Y axis
        const robotYaw = quaternionToYaw(robotPose.orientation);

        // Ensure robot is within canvas bounds
        if (robotX >= 0 && robotX <= canvas.width && robotY >= 0 && robotY <= canvas.height) {
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
      }

      // Draw border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, canvas.width, canvas.height);
    };
    
    mapImage.src = '/lovable-uploads/e0784714-beed-409d-8760-417979b44c80.png';
  }, [robotPose, quaternionToYaw]);

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

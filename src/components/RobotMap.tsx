
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Button } from '@/components/ui/button';
import { RotateCcw, Navigation } from 'lucide-react';

interface RobotPose {
  position: { x: number; y: number; z: number };
  orientation: { x: number; y: number; z: number; w: number };
}

// Static map data for offline use
const STATIC_MAP = {
  info: {
    resolution: 0.05,
    width: 400,
    height: 400,
    origin: {
      position: { x: -10, y: -10, z: 0 },
      orientation: { x: 0, y: 0, z: 0, w: 1 }
    }
  },
  // Generate a simple grid pattern for demo
  data: new Array(400 * 400).fill(0).map((_, i) => {
    const x = i % 400;
    const y = Math.floor(i / 400);
    // Create walls around edges and some obstacles
    if (x < 5 || x > 395 || y < 5 || y > 395) return 100; // walls
    if ((x > 100 && x < 120 && y > 100 && y < 200) || 
        (x > 250 && x < 300 && y > 150 && y < 250)) return 100; // obstacles
    return Math.random() > 0.95 ? -1 : 0; // mostly free with some unknown areas
  })
};

const RobotMap: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [robotPose, setRobotPose] = useState<RobotPose | null>(null);
  const [followRobot, setFollowRobot] = useState(true);
  const [scale, setScale] = useState(2);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const { isConnected, subscribe } = useWebSocket();

  // Only subscribe to robot pose, not map
  useEffect(() => {
    const unsubscribePose = subscribe('/amcl_pose', 'geometry_msgs/msg/PoseWithCovarianceStamped', (data: any) => {
      console.log('Position reçue:', data);
      if (data.pose && data.pose.pose) {
        setRobotPose(data.pose.pose);
      }
    });

    return () => {
      unsubscribePose();
    };
  }, [subscribe]);

  // Convert quaternion to angle
  const quaternionToYaw = useCallback((q: { x: number; y: number; z: number; w: number }) => {
    return Math.atan2(2 * (q.w * q.z + q.x * q.y), 1 - 2 * (q.y * q.y + q.z * q.z));
  }, []);

  // Convert world coordinates to pixel coordinates
  const worldToPixel = useCallback((worldX: number, worldY: number, mapInfo: any) => {
    const pixelX = Math.floor((worldX - mapInfo.origin.position.x) / mapInfo.resolution);
    const pixelY = Math.floor((worldY - mapInfo.origin.position.y) / mapInfo.resolution);
    return { x: pixelX, y: mapInfo.height - pixelY }; // Invert Y
  }, []);

  // Draw the map and robot
  const drawMap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Adjust canvas size
    canvas.width = 400;
    canvas.height = 400;

    // Clear canvas
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate transformation
    let centerX = canvas.width / 2;
    let centerY = canvas.height / 2;

    if (followRobot && robotPose) {
      const robotPixel = worldToPixel(robotPose.position.x, robotPose.position.y, STATIC_MAP.info);
      centerX = canvas.width / 2 - (robotPixel.x * scale) - offset.x;
      centerY = canvas.height / 2 - (robotPixel.y * scale) - offset.y;
    }

    // Draw occupancy grid
    const imageData = ctx.createImageData(STATIC_MAP.info.width, STATIC_MAP.info.height);
    
    for (let i = 0; i < STATIC_MAP.data.length; i++) {
      const value = STATIC_MAP.data[i];
      let color = 128; // Gray for unknown (-1)
      
      if (value === 0) color = 255; // White for free
      else if (value === 100) color = 0; // Black for occupied
      
      const pixelIndex = i * 4;
      imageData.data[pixelIndex] = color;     // R
      imageData.data[pixelIndex + 1] = color; // G
      imageData.data[pixelIndex + 2] = color; // B
      imageData.data[pixelIndex + 3] = 255;   // A
    }

    // Create temporary canvas for the image
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = STATIC_MAP.info.width;
    tempCanvas.height = STATIC_MAP.info.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCtx.putImageData(imageData, 0, 0);
      
      // Draw scaled image
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        tempCanvas,
        centerX,
        centerY,
        STATIC_MAP.info.width * scale,
        STATIC_MAP.info.height * scale
      );
    }

    // Draw robot if pose is available
    if (robotPose) {
      const robotPixel = worldToPixel(robotPose.position.x, robotPose.position.y, STATIC_MAP.info);
      const robotX = centerX + robotPixel.x * scale;
      const robotY = centerY + robotPixel.y * scale;
      const robotYaw = quaternionToYaw(robotPose.orientation);

      // Robot body (blue circle)
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(robotX, robotY, 8, 0, 2 * Math.PI);
      ctx.fill();

      // Robot direction (triangle)
      ctx.fillStyle = '#1e40af';
      ctx.save();
      ctx.translate(robotX, robotY);
      ctx.rotate(robotYaw);
      ctx.beginPath();
      ctx.moveTo(12, 0);
      ctx.lineTo(-6, -6);
      ctx.lineTo(-6, 6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // White outline for visibility
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(robotX, robotY, 8, 0, 2 * Math.PI);
      ctx.stroke();
    }

    // Draw grid if zoomed in
    if (scale > 4) {
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 0.5;
      const gridSize = scale;
      
      for (let x = centerX % gridSize; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      
      for (let y = centerY % gridSize; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    }
  }, [robotPose, scale, offset, followRobot, worldToPixel, quaternionToYaw]);

  // Redraw when data changes
  useEffect(() => {
    drawMap();
  }, [drawMap]);

  // Handle zoom with mouse wheel
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.max(0.5, Math.min(10, prev * delta)));
  }, []);

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center justify-between">
          🗺️ Carte Robot
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFollowRobot(!followRobot)}
              className={`text-xs ${followRobot ? 'bg-blue-600' : 'bg-slate-600'}`}
            >
              <Navigation className="w-3 h-3 mr-1" />
              Suivi
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="w-full border border-slate-600 rounded-lg bg-slate-900 cursor-move"
            onWheel={handleWheel}
          />
          
          <div className="absolute top-2 left-2 bg-slate-900/75 rounded px-2 py-1 text-xs text-white/70">
            Map: Static (Offline)
          </div>
        </div>

        {/* Information */}
        <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-700 rounded-lg p-2">
            <div className="text-slate-400 mb-1">Position Robot</div>
            {robotPose ? (
              <div className="text-white font-mono">
                X: {robotPose.position.x.toFixed(2)}m<br />
                Y: {robotPose.position.y.toFixed(2)}m<br />
                θ: {(quaternionToYaw(robotPose.orientation) * 180 / Math.PI).toFixed(1)}°
              </div>
            ) : (
              <div className="text-slate-400">Aucune position</div>
            )}
          </div>
          
          <div className="bg-slate-700 rounded-lg p-2">
            <div className="text-slate-400 mb-1">Carte</div>
            <div className="text-white font-mono">
              {STATIC_MAP.info.width}×{STATIC_MAP.info.height}<br />
              Résolution: {STATIC_MAP.info.resolution}m<br />
              Zoom: {scale.toFixed(1)}x
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RobotMap;

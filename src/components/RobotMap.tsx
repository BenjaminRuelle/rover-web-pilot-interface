
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Button } from '@/components/ui/button';
import { RotateCcw, Navigation } from 'lucide-react';

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

const RobotMap: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [robotPose, setRobotPose] = useState<RobotPose | null>(null);
  const [map, setMap] = useState<OccupancyGrid | null>(null);
  const [followRobot, setFollowRobot] = useState(true);
  const [scale, setScale] = useState(2);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const { isConnected, subscribe } = useWebSocket();

  // Souscrire aux topics ROS2
  useEffect(() => {
    const unsubscribeMap = subscribe('/map', 'nav_msgs/msg/OccupancyGrid', (data: OccupancyGrid) => {
      console.log('Carte reçue:', data);
      setMap(data);
    });

    const unsubscribePose = subscribe('/amcl_pose', 'geometry_msgs/msg/PoseWithCovarianceStamped', (data: any) => {
      console.log('Position reçue:', data);
      if (data.pose && data.pose.pose) {
        setRobotPose(data.pose.pose);
      }
    });

    return () => {
      unsubscribeMap();
      unsubscribePose();
    };
  }, [subscribe]);

  // Convertir quaternion en angle
  const quaternionToYaw = useCallback((q: { x: number; y: number; z: number; w: number }) => {
    return Math.atan2(2 * (q.w * q.z + q.x * q.y), 1 - 2 * (q.y * q.y + q.z * q.z));
  }, []);

  // Convertir coordonnées monde vers pixel
  const worldToPixel = useCallback((worldX: number, worldY: number, mapInfo: any) => {
    const pixelX = Math.floor((worldX - mapInfo.origin.position.x) / mapInfo.resolution);
    const pixelY = Math.floor((worldY - mapInfo.origin.position.y) / mapInfo.resolution);
    return { x: pixelX, y: mapInfo.height - pixelY }; // Inverser Y
  }, []);

  // Dessiner la carte et le robot
  const drawMap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !map) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Ajuster la taille du canvas
    canvas.width = 400;
    canvas.height = 400;

    // Effacer le canvas
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculer la transformation
    let centerX = canvas.width / 2;
    let centerY = canvas.height / 2;

    if (followRobot && robotPose) {
      const robotPixel = worldToPixel(robotPose.position.x, robotPose.position.y, map.info);
      centerX = canvas.width / 2 - (robotPixel.x * scale) - offset.x;
      centerY = canvas.height / 2 - (robotPixel.y * scale) - offset.y;
    }

    // Dessiner la carte d'occupation
    const imageData = ctx.createImageData(map.info.width, map.info.height);
    
    for (let i = 0; i < map.data.length; i++) {
      const value = map.data[i];
      let color = 128; // Gris pour inconnu (-1)
      
      if (value === 0) color = 255; // Blanc pour libre
      else if (value === 100) color = 0; // Noir pour occupé
      
      const pixelIndex = i * 4;
      imageData.data[pixelIndex] = color;     // R
      imageData.data[pixelIndex + 1] = color; // G
      imageData.data[pixelIndex + 2] = color; // B
      imageData.data[pixelIndex + 3] = 255;   // A
    }

    // Créer un canvas temporaire pour l'image
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = map.info.width;
    tempCanvas.height = map.info.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCtx.putImageData(imageData, 0, 0);
      
      // Dessiner l'image mise à l'échelle
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        tempCanvas,
        centerX,
        centerY,
        map.info.width * scale,
        map.info.height * scale
      );
    }

    // Dessiner le robot
    if (robotPose) {
      const robotPixel = worldToPixel(robotPose.position.x, robotPose.position.y, map.info);
      const robotX = centerX + robotPixel.x * scale;
      const robotY = centerY + robotPixel.y * scale;
      const robotYaw = quaternionToYaw(robotPose.orientation);

      // Corps du robot (cercle bleu)
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(robotX, robotY, 8, 0, 2 * Math.PI);
      ctx.fill();

      // Direction du robot (triangle)
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

      // Contour blanc pour la visibilité
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(robotX, robotY, 8, 0, 2 * Math.PI);
      ctx.stroke();
    }

    // Dessiner la grille si zoomé
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
  }, [map, robotPose, scale, offset, followRobot, worldToPixel, quaternionToYaw]);

  // Redessiner quand les données changent
  useEffect(() => {
    drawMap();
  }, [drawMap]);

  // Gestion du zoom avec la molette
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
          
          {!map && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 rounded-lg">
              <div className="text-slate-400 text-center">
                <div className="text-sm">En attente de la carte...</div>
                <div className="text-xs mt-1 opacity-75">Topic: /map</div>
              </div>
            </div>
          )}
        </div>

        {/* Informations */}
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
            {map ? (
              <div className="text-white font-mono">
                {map.info.width}×{map.info.height}<br />
                Résolution: {map.info.resolution}m<br />
                Zoom: {scale.toFixed(1)}x
              </div>
            ) : (
              <div className="text-slate-400">Aucune carte</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RobotMap;

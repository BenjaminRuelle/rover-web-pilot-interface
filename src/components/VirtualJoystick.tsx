
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWebSocket } from '@/hooks/useWebSocket';

interface JoystickPosition {
  x: number;
  y: number;
}

const VirtualJoystick: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState<JoystickPosition>({ x: 0, y: 0 });
  const [velocity, setVelocity] = useState({ linear: 0, angular: 0 });
  const joystickRef = useRef<HTMLDivElement>(null);
  const { isConnected, publish } = useWebSocket();

  const maxRadius = 80; // Rayon maximum du joystick
  const maxLinearVel = 1.0; // m/s
  const maxAngularVel = 2.0; // rad/s

  // Publier les commandes de vitesse
  const publishVelocity = useCallback((linear: number, angular: number) => {
    const twistMsg = {
      linear: { x: linear, y: 0, z: 0 },
      angular: { x: 0, y: 0, z: angular }
    };
    
    if (isConnected) {
      publish('/cmd_vel', 'geometry_msgs/msg/Twist', twistMsg);
    }
    
    setVelocity({ linear, angular });
  }, [isConnected, publish]);

  // Calculer la position et la vitesse
  const updatePosition = useCallback((clientX: number, clientY: number) => {
    if (!joystickRef.current) return;

    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let deltaX = clientX - centerX;
    let deltaY = clientY - centerY;

    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance > maxRadius) {
      deltaX = (deltaX / distance) * maxRadius;
      deltaY = (deltaY / distance) * maxRadius;
    }

    setPosition({ x: deltaX, y: deltaY });

    // Calculer les vitesses normalisées
    const normalizedX = deltaX / maxRadius;
    const normalizedY = -deltaY / maxRadius; // Inverser Y pour le contrôle

    const linearVel = normalizedY * maxLinearVel;
    const angularVel = -normalizedX * maxAngularVel;

    publishVelocity(linearVel, angularVel);
  }, [publishVelocity]);

  // Réinitialiser la position
  const resetPosition = useCallback(() => {
    setPosition({ x: 0, y: 0 });
    publishVelocity(0, 0);
  }, [publishVelocity]);

  // Gestion des événements de souris
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    updatePosition(e.clientX, e.clientY);
  }, [updatePosition]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      updatePosition(e.clientX, e.clientY);
    }
  }, [isDragging, updatePosition]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    resetPosition();
  }, [resetPosition]);

  // Gestion des événements tactiles
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    const touch = e.touches[0];
    updatePosition(touch.clientX, touch.clientY);
  }, [updatePosition]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (isDragging && e.touches.length > 0) {
      const touch = e.touches[0];
      updatePosition(touch.clientX, touch.clientY);
    }
  }, [isDragging, updatePosition]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center justify-between">
          🕹️ Contrôle Joystick
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center">
          <div
            ref={joystickRef}
            className="relative w-40 h-40 bg-slate-700 rounded-full border-2 border-slate-600 cursor-pointer select-none"
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          >
            {/* Zone externe */}
            <div className="absolute inset-2 border border-slate-500 rounded-full opacity-50" />
            
            {/* Joystick */}
            <div
              className="absolute w-8 h-8 bg-blue-500 rounded-full border-2 border-blue-400 shadow-lg transition-all duration-75"
              style={{
                left: `calc(50% + ${position.x}px - 16px)`,
                top: `calc(50% + ${position.y}px - 16px)`,
                transform: isDragging ? 'scale(1.1)' : 'scale(1)',
                boxShadow: isDragging ? '0 0 20px rgba(59, 130, 246, 0.5)' : ''
              }}
            />
            
            {/* Indicateurs directionnels */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-slate-500 text-xs">
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">↑</div>
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">↓</div>
                <div className="absolute -left-6 top-1/2 transform -translate-y-1/2">←</div>
                <div className="absolute -right-6 top-1/2 transform -translate-y-1/2">→</div>
              </div>
            </div>
          </div>
        </div>

        {/* Affichage des valeurs */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-slate-700 rounded-lg p-3">
            <div className="text-slate-400 text-xs mb-1">Vitesse Linéaire</div>
            <div className="text-white font-mono">
              {velocity.linear.toFixed(2)} m/s
            </div>
          </div>
          <div className="bg-slate-700 rounded-lg p-3">
            <div className="text-slate-400 text-xs mb-1">Vitesse Angulaire</div>
            <div className="text-white font-mono">
              {velocity.angular.toFixed(2)} rad/s
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="text-xs text-slate-400 text-center">
          Cliquez et glissez pour contrôler le robot
        </div>
      </CardContent>
    </Card>
  );
};

export default VirtualJoystick;

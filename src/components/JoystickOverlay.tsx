
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Button } from '@/components/ui/button';
import { Anchor, Navigation, Square, RotateCcw, RotateCw } from 'lucide-react';

interface JoystickPosition {
  x: number;
  y: number;
}

const JoystickOverlay: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState<JoystickPosition>({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const joystickRef = useRef<HTMLDivElement>(null);
  const { publish } = useWebSocket();

  const maxRadius = 50;
  const maxLinearVel = 1.0;
  const maxAngularVel = 2.0;

  const publishVelocity = useCallback((linear: number, angular: number) => {
    const twistMsg = {
      linear: { x: linear, y: 0, z: 0 },
      angular: { x: 0, y: 0, z: angular }
    };
    publish('/cmd_vel', 'geometry_msgs/msg/Twist', twistMsg);
  }, [publish]);

  const handleDocking = () => {
    publish('/docking_command', 'std_msgs/msg/String', { data: 'start_docking' });
  };

  const handlePatrol = () => {
    publish('/patrol_command', 'std_msgs/msg/String', { data: 'start_patrol' });
  };

  const handleStopPatrol = () => {
    publish('/patrol_command', 'std_msgs/msg/String', { data: 'stop_patrol' });
    const stopMsg = {
      linear: { x: 0, y: 0, z: 0 },
      angular: { x: 0, y: 0, z: 0 }
    };
    publish('/cmd_vel', 'geometry_msgs/msg/Twist', stopMsg);
  };

  const handleLeftTurn = () => {
    const turnMsg = {
      linear: { x: 0, y: 0, z: 0 },
      angular: { x: 0, y: 0, z: 1.57 } // 90° in radians
    };
    publish('/cmd_vel', 'geometry_msgs/msg/Twist', turnMsg);
    // Stop after a brief moment
    setTimeout(() => {
      publishVelocity(0, 0);
    }, 1000);
  };

  const handleRightTurn = () => {
    const turnMsg = {
      linear: { x: 0, y: 0, z: 0 },
      angular: { x: 0, y: 0, z: -1.57 } // -90° in radians
    };
    publish('/cmd_vel', 'geometry_msgs/msg/Twist', turnMsg);
    // Stop after a brief moment
    setTimeout(() => {
      publishVelocity(0, 0);
    }, 1000);
  };

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

    const normalizedX = deltaX / maxRadius;
    const normalizedY = -deltaY / maxRadius;

    const linearVel = normalizedY * maxLinearVel;
    const angularVel = -normalizedX * maxAngularVel;

    publishVelocity(linearVel, angularVel);
  }, [publishVelocity]);

  const resetPosition = useCallback(() => {
    setPosition({ x: 0, y: 0 });
    publishVelocity(0, 0);
  }, [publishVelocity]);

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
    <div 
      className="absolute bottom-6 left-1/2 transform -translate-x-1/2 transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Control buttons module - appears on hover */}
      <div className={`absolute bottom-full mb-4 left-1/2 transform -translate-x-1/2 transition-all duration-300 ${
        isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}>
        <div className="bg-black/70 backdrop-blur-md rounded-lg border border-white/20 p-3">
          <div className="grid grid-cols-3 gap-2">
            {/* Top row */}
            <Button
              onClick={handleLeftTurn}
              size="sm"
              className="bg-orange-600/80 hover:bg-orange-600 text-white border border-orange-500/30 px-3 py-2"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            
            <Button
              onClick={handleDocking}
              size="sm"
              className="bg-blue-600/80 hover:bg-blue-600 text-white border border-blue-500/30 px-3 py-2"
            >
              <Anchor className="w-4 h-4" />
            </Button>
            
            <Button
              onClick={handleRightTurn}
              size="sm"
              className="bg-orange-600/80 hover:bg-orange-600 text-white border border-orange-500/30 px-3 py-2"
            >
              <RotateCw className="w-4 h-4" />
            </Button>

            {/* Bottom row */}
            <Button
              onClick={handlePatrol}
              size="sm"
              className="bg-green-600/80 hover:bg-green-600 text-white border border-green-500/30 px-3 py-2"
            >
              <Navigation className="w-4 h-4" />
            </Button>
            
            <div /> {/* Empty space in the middle */}
            
            <Button
              onClick={handleStopPatrol}
              size="sm"
              className="bg-red-600/80 hover:bg-red-600 text-white border border-red-500/30 px-3 py-2"
            >
              <Square className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Joystick */}
      <div className="bg-black/50 backdrop-blur-md rounded-full border border-white/20 p-4">
        <div
          ref={joystickRef}
          className="relative w-24 h-24 bg-white/10 rounded-full border border-white/20 cursor-pointer select-none"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          {/* Outer ring */}
          <div className="absolute inset-2 border border-white/20 rounded-full" />
          
          {/* Joystick knob */}
          <div
            className="absolute w-6 h-6 bg-white rounded-full border-2 border-white/70 shadow-lg transition-all duration-75"
            style={{
              left: `calc(50% + ${position.x}px - 12px)`,
              top: `calc(50% + ${position.y}px - 12px)`,
              transform: isDragging ? 'scale(1.1)' : 'scale(1)',
              boxShadow: isDragging ? '0 0 20px rgba(255, 255, 255, 0.5)' : ''
            }}
          />
          
          {/* Direction indicators */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-white/40 text-xs">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">↑</div>
              <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">↓</div>
              <div className="absolute -left-4 top-1/2 transform -translate-y-1/2">←</div>
              <div className="absolute -right-4 top-1/2 transform -translate-y-1/2">→</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoystickOverlay;

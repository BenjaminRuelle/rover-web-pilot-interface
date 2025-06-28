
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';

interface JoystickPosition {
  x: number;
  y: number;
}

const JoystickOverlay: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState<JoystickPosition>({ x: 0, y: 0 });
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
    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur-md rounded-full border border-white/20 p-4">
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
  );
};

export default JoystickOverlay;

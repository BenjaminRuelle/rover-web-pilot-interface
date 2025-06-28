
import { useRef, useState, useCallback, useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';

interface JoystickPosition {
  x: number;
  y: number;
}

export const useJoystick = () => {
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

  return {
    isDragging,
    position,
    joystickRef,
    handleMouseDown,
    handleTouchStart,
  };
};

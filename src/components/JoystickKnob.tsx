
import React from 'react';

interface JoystickKnobProps {
  position: { x: number; y: number };
  isDragging: boolean;
  joystickRef: React.RefObject<HTMLDivElement>;
  onMouseDown: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
}

const JoystickKnob: React.FC<JoystickKnobProps> = ({
  position,
  isDragging,
  joystickRef,
  onMouseDown,
  onTouchStart,
}) => {
  return (
    <div className="relative z-10 bg-black/50 backdrop-blur-md rounded-full border border-white/20 p-4">
      <div
        ref={joystickRef}
        className="relative w-24 h-24 bg-white/10 rounded-full border border-white/20 cursor-pointer select-none"
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
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

export default JoystickKnob;

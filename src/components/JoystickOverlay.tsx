
import React, { useState } from 'react';
import { useJoystick } from '@/hooks/useJoystick';
import ControlButtons from '@/components/ControlButtons';
import JoystickKnob from '@/components/JoystickKnob';

const JoystickOverlay: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);
  const { isDragging, position, joystickRef, handleMouseDown, handleTouchStart } = useJoystick();

  return (
    <div 
      className="absolute bottom-6 left-1/2 transform -translate-x-1/2 transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Extended Hover Area - Covers all button positions */}
      <div className={`absolute -inset-20 transition-all duration-300 ${
        isHovered ? 'scale-100' : 'scale-75 opacity-0 pointer-events-none'
      }`} />

      {/* Cockpit Control Module - Dynamic Layout */}
      <div className={`relative transition-all duration-300 ${
        isHovered ? 'scale-110' : 'scale-100'
      }`}>
        
        {/* Extended Control Panel */}
        <div className={`absolute -inset-20 bg-black/50 backdrop-blur-md rounded-2xl border border-white/20 transition-all duration-300 ${
          isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}>
          
          {/* Control Buttons Layout - Cockpit Style */}
          <ControlButtons isHovered={isHovered} />
        </div>

        {/* Central Joystick */}
        <JoystickKnob 
          position={position}
          isDragging={isDragging}
          joystickRef={joystickRef}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        />
      </div>
    </div>
  );
};

export default JoystickOverlay;

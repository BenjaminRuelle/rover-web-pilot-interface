import React from 'react';
import { Button } from '@/components/ui/button';
import { Anchor, RotateCcw, RotateCw, Navigation, Square } from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';

interface ControlButtonsProps {
  isHovered: boolean;
}

const ControlButtons: React.FC<ControlButtonsProps> = ({ isHovered }) => {
  const { publish } = useWebSocket();

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
      angular: { x: 0, y: 0, z: 1.57 }
    };
    publish('/cmd_vel', 'geometry_msgs/msg/Twist', turnMsg);
    setTimeout(() => {
      const stopMsg = {
        linear: { x: 0, y: 0, z: 0 },
        angular: { x: 0, y: 0, z: 0 }
      };
      publish('/cmd_vel', 'geometry_msgs/msg/Twist', stopMsg);
    }, 1000);
  };

  const handleRightTurn = () => {
    const turnMsg = {
      linear: { x: 0, y: 0, z: 0 },
      angular: { x: 0, y: 0, z: -1.57 }
    };
    publish('/cmd_vel', 'geometry_msgs/msg/Twist', turnMsg);
    setTimeout(() => {
      const stopMsg = {
        linear: { x: 0, y: 0, z: 0 },
        angular: { x: 0, y: 0, z: 0 }
      };
      publish('/cmd_vel', 'geometry_msgs/msg/Twist', stopMsg);
    }, 1000);
  };

  return (
    <div className={`absolute inset-0 transition-all duration-300 ${
      isHovered ? 'opacity-100' : 'opacity-0'
    }`}>
      
      {/* Top Control Row */}
      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 flex gap-4">
        <div className="flex flex-col items-center gap-1">
          <Button
            onClick={handlePatrol}
            size="sm"
            className="bg-green-600/90 hover:bg-green-500 text-white border border-green-400/40 shadow-lg"
          >
            <Navigation className="w-4 h-4" />
          </Button>
          <span className="text-xs text-white/70">Patrol</span>
        </div>
        
        <div className="flex flex-col items-center gap-1">
          <Button
            onClick={handleDocking}
            size="sm"
            className="bg-blue-600/90 hover:bg-blue-500 text-white border border-blue-400/40 shadow-lg"
          >
            <Anchor className="w-4 h-4" />
          </Button>
          <span className="text-xs text-white/70">Dock</span>
        </div>
        
        <div className="flex flex-col items-center gap-1">
          <Button
            onClick={handleStopPatrol}
            size="sm"
            className="bg-red-600/90 hover:bg-red-500 text-white border border-red-400/40 shadow-lg"
          >
            <Square className="w-4 h-4" />
          </Button>
          <span className="text-xs text-white/70">Stop</span>
        </div>
      </div>

      {/* Side Control Buttons */}
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
        <div className="flex flex-col items-center gap-1">
          <Button
            onClick={handleLeftTurn}
            size="sm"
            className="bg-orange-600/90 hover:bg-orange-500 text-white border border-orange-400/40 shadow-lg"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          <span className="text-xs text-white/70">Turn L</span>
        </div>
      </div>
      
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
        <div className="flex flex-col items-center gap-1">
          <Button
            onClick={handleRightTurn}
            size="sm"
            className="bg-orange-600/90 hover:bg-orange-500 text-white border border-orange-400/40 shadow-lg"
          >
            <RotateCw className="w-4 h-4" />
          </Button>
          <span className="text-xs text-white/70">Turn R</span>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="flex gap-2 text-xs text-white/60">
          <div className="bg-black/50 px-2 py-1 rounded">MOVE</div>
          <div className="bg-black/50 px-2 py-1 rounded">CTRL</div>
          <div className="bg-black/50 px-2 py-1 rounded">NAV</div>
        </div>
      </div>
    </div>
  );
};

export default ControlButtons;


import React from 'react';
import Navbar from '@/components/Navbar';
import VideoStream from '@/components/VideoStream';
import JoystickOverlay from '@/components/JoystickOverlay';
import MiniMap from '@/components/MiniMap';
import CockpitControls from '@/components/CockpitControls';
import { useWebSocket } from '@/hooks/useWebSocket';

const PilotagePage: React.FC = () => {
  const { isConnected } = useWebSocket();

  return (
    <div className="min-h-screen bg-slate-900 relative overflow-hidden">
      <Navbar />
      
      {/* Main video stream - full screen background */}
      <div className="absolute inset-0">
        <VideoStream streamUrl="rtsp://192.168.1.100:554/stream1" />
      </div>

      {/* Connection status overlay */}
      <div className="absolute top-20 left-6 bg-black/50 backdrop-blur-md rounded-lg border border-white/20 px-3 py-2">
        <div className={`inline-flex items-center text-sm font-medium ${
          isConnected 
            ? 'text-green-300' 
            : 'text-red-300'
        }`}>
          <div className={`w-2 h-2 rounded-full mr-2 ${
            isConnected ? 'bg-green-400' : 'bg-red-400'
          }`} />
          ROS2 {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      {/* Mini map - top right */}
      <MiniMap />

      {/* Control buttons - bottom left */}
      <CockpitControls />

      {/* Joystick overlay - bottom center */}
      <JoystickOverlay />

      {/* System info overlay - bottom right */}
      <div className="absolute bottom-6 right-6 bg-black/50 backdrop-blur-md rounded-lg border border-white/20 p-3">
        <div className="text-white/80 text-xs space-y-1">
          <div className="font-medium text-white mb-2">SYSTEM</div>
          <div>/cmd_vel - Movement</div>
          <div>/map - Navigation</div>
          <div>/amcl_pose - Position</div>
        </div>
      </div>
    </div>
  );
};

export default PilotagePage;

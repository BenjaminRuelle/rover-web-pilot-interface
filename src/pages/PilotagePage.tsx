
import React from 'react';
import Navbar from '@/components/Navbar';
import VideoStream from '@/components/VideoStream';
import JoystickOverlay from '@/components/JoystickOverlay';
import MiniMap from '@/components/MiniMap';
import MonitorHub from '@/components/MonitorHub';
import ThermalStream from '@/components/ThermalStream';

const PilotagePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900 relative overflow-hidden">
      <Navbar />
      
      {/* Main video stream - full screen background */}
      <div className="absolute inset-0">
        <VideoStream streamUrl="rtsp://192.168.1.100:554/stream1" />
      </div>

      {/* Mini map - top right */}
      <MiniMap />

      {/* Thermal Stream - always visible, larger size */}
      <ThermalStream />

      {/* Joystick overlay with integrated controls - bottom center */}
      <JoystickOverlay />

      {/* Monitor Hub - bottom right */}
      <MonitorHub />
    </div>
  );
};

export default PilotagePage;

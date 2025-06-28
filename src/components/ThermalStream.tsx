
import React, { useState } from 'react';
import { Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ThermalStream: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [thermalAlarm, setThermalAlarm] = useState(true); // Mock alarm state

  return (
    <>
      {/* Toggle Button */}
      <div className="absolute top-20 left-48 z-10">
        <Button
          onClick={() => setIsVisible(!isVisible)}
          variant="outline"
          size="sm"
          className="bg-black/50 backdrop-blur-md border-white/20 text-white hover:bg-black/70"
        >
          {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          <span className="ml-2">Thermal</span>
        </Button>
      </div>

      {/* Thermal Stream Overlay */}
      {isVisible && (
        <div className="absolute top-32 left-48 bg-black/50 backdrop-blur-md rounded-lg border border-white/20 p-4 w-80 z-10">
          {/* Header with alarm status */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-white text-sm font-medium">THERMAL DETECTION</span>
              {thermalAlarm && (
                <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
              )}
            </div>
            <div className={`text-xs px-2 py-1 rounded ${
              thermalAlarm 
                ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                : 'bg-green-500/20 text-green-300 border border-green-500/30'
            }`}>
              {thermalAlarm ? 'ALARM' : 'NORMAL'}
            </div>
          </div>

          {/* Thermal Image */}
          <div className="relative rounded-lg overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop"
              alt="Thermal Camera Feed"
              className="w-full h-48 object-cover"
            />
            {/* Overlay effect to simulate thermal imaging */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-red-500/20 mix-blend-overlay"></div>
            
            {/* Temperature overlay */}
            <div className="absolute top-2 left-2 bg-black/60 rounded px-2 py-1">
              <span className="text-white text-xs">MAX: 85°C</span>
            </div>
          </div>

          {/* Status info */}
          <div className="mt-3 text-xs text-white/70 space-y-1">
            <div>Camera: IP 192.168.1.101</div>
            <div>Resolution: 640x480</div>
            <div>Threshold: 80°C</div>
          </div>
        </div>
      )}
    </>
  );
};

export default ThermalStream;

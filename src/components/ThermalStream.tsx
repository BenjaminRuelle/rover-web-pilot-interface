
import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

const ThermalStream: React.FC = () => {
  const [thermalAlarm1, setThermalAlarm1] = useState(true); // Mock alarm state for camera 1
  const [thermalAlarm2, setThermalAlarm2] = useState(false); // Mock alarm state for camera 2

  return (
    <div className="absolute top-20 left-6 bg-black/50 backdrop-blur-md rounded-lg border border-white/20 p-4 w-[500px] z-10">
      {/* Header with overall alarm status */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-white text-sm font-medium">THERMAL DETECTION</span>
          {(thermalAlarm1 || thermalAlarm2) && (
            <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
          )}
        </div>
        <div className={`text-xs px-2 py-1 rounded ${
          (thermalAlarm1 || thermalAlarm2)
            ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
            : 'bg-green-500/20 text-green-300 border border-green-500/30'
        }`}>
          {(thermalAlarm1 || thermalAlarm2) ? 'ALARM' : 'NORMAL'}
        </div>
      </div>

      {/* Two thermal cameras side by side */}
      <div className="grid grid-cols-2 gap-3">
        {/* Thermal Camera 1 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-white text-xs font-medium">CAMERA 1</span>
            <div className={`text-xs px-2 py-1 rounded ${
              thermalAlarm1 
                ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                : 'bg-green-500/20 text-green-300 border border-green-500/30'
            }`}>
              {thermalAlarm1 ? 'ALARM' : 'NORMAL'}
            </div>
          </div>
          <div className="relative rounded-lg overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&h=200&fit=crop"
              alt="Thermal Camera 1 Feed"
              className="w-full h-32 object-cover"
            />
            {/* Overlay effect to simulate thermal imaging */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-red-500/20 mix-blend-overlay"></div>
            
            {/* Temperature overlay */}
            <div className="absolute top-1 left-1 bg-black/60 rounded px-1 py-0.5">
              <span className="text-white text-xs">MAX: 85°C</span>
            </div>
          </div>
          <div className="text-xs text-white/70 space-y-0.5">
            <div>IP: 192.168.1.101</div>
            <div>Threshold: 80°C</div>
          </div>
        </div>

        {/* Thermal Camera 2 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-white text-xs font-medium">CAMERA 2</span>
            <div className={`text-xs px-2 py-1 rounded ${
              thermalAlarm2 
                ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                : 'bg-green-500/20 text-green-300 border border-green-500/30'
            }`}>
              {thermalAlarm2 ? 'ALARM' : 'NORMAL'}
            </div>
          </div>
          <div className="relative rounded-lg overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300&h=200&fit=crop"
              alt="Thermal Camera 2 Feed"
              className="w-full h-32 object-cover"
            />
            {/* Overlay effect to simulate thermal imaging */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-green-500/20 to-yellow-500/20 mix-blend-overlay"></div>
            
            {/* Temperature overlay */}
            <div className="absolute top-1 left-1 bg-black/60 rounded px-1 py-0.5">
              <span className="text-white text-xs">MAX: 72°C</span>
            </div>
          </div>
          <div className="text-xs text-white/70 space-y-0.5">
            <div>IP: 192.168.1.103</div>
            <div>Threshold: 80°C</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThermalStream;

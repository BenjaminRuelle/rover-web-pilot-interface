
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Battery, Cpu, Thermometer, Wifi } from 'lucide-react';

const MonitorHub: React.FC = () => {
  // Mock data - in real implementation these would come from WebSocket subscriptions
  const batteryLevel = 75; // percentage
  const robotState = 'Manual'; // Autopilot/Docked/Manual/Lost
  const temperature = 42; // Celsius
  const cpuUsage = 68; // percentage
  const robotName = 'Optimus';
  const robotIP = '192.168.1.100';

  const getStateColor = (state: string) => {
    switch (state) {
      case 'Autopilot': return 'text-green-400';
      case 'Docked': return 'text-blue-400';
      case 'Manual': return 'text-yellow-400';
      case 'Lost': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getBatteryColor = (level: number) => {
    if (level > 50) return 'bg-green-500';
    if (level > 20) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getCpuColor = (usage: number) => {
    if (usage < 50) return 'bg-green-500';
    if (usage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="absolute bottom-6 right-6 bg-black/50 backdrop-blur-md rounded-lg border border-white/20 p-4 min-w-64">
      <div className="text-white/80 text-sm space-y-4">
        {/* Robot Name and IP */}
        <div className="space-y-1 border-b border-white/10 pb-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/60">Robot</span>
            <span className="text-xs font-medium text-white">{robotName}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wifi className="w-3 h-3 text-white/60" />
              <span className="text-xs text-white/60">IP</span>
            </div>
            <span className="text-xs text-white/80">{robotIP}</span>
          </div>
        </div>

        {/* Robot State - moved to top */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/60">State</span>
          <span className={`text-xs font-medium ${getStateColor(robotState)}`}>
            {robotState.toUpperCase()}
          </span>
        </div>
        
        {/* Battery Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Battery className="w-4 h-4 text-white/60" />
              <span className="text-xs">Battery</span>
            </div>
            <span className="text-xs text-white/80">{batteryLevel}%</span>
          </div>
          <div className="relative">
            <Progress value={batteryLevel} className="h-2" />
            <div 
              className={`absolute inset-0 h-2 rounded-full transition-all ${getBatteryColor(batteryLevel)}`}
              style={{ width: `${batteryLevel}%` }}
            />
          </div>
        </div>

        {/* Temperature */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-white/60" />
            <span className="text-xs">Temp</span>
          </div>
          <span className="text-xs text-white/80">{temperature}°C</span>
        </div>

        {/* CPU Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-white/60" />
              <span className="text-xs">CPU</span>
            </div>
            <span className="text-xs text-white/80">{cpuUsage}%</span>
          </div>
          <div className="relative">
            <Progress value={cpuUsage} className="h-2" />
            <div 
              className={`absolute inset-0 h-2 rounded-full transition-all ${getCpuColor(cpuUsage)}`}
              style={{ width: `${cpuUsage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonitorHub;

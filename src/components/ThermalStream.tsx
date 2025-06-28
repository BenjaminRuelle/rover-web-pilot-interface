
import React, { useState } from 'react';
import { AlertTriangle, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const ThermalStream: React.FC = () => {
  const [thermalAlarm1, setThermalAlarm1] = useState(true); // Mock alarm state for front camera
  const [thermalAlarm2, setThermalAlarm2] = useState(false); // Mock alarm state for back camera
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="absolute top-20 left-6 bg-black/50 backdrop-blur-md rounded-lg border border-white/20 p-4 w-[300px] z-10">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full">
          {/* Header with overall alarm status */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-white text-sm font-medium">THERMAL DETECTION</span>
              {(thermalAlarm1 || thermalAlarm2) && (
                <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className={`text-xs px-2 py-1 rounded ${
                (thermalAlarm1 || thermalAlarm2)
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                  : 'bg-green-500/20 text-green-300 border border-green-500/30'
              }`}>
                {(thermalAlarm1 || thermalAlarm2) ? 'ALARM' : 'NORMAL'}
              </div>
              <ChevronDown className={`w-4 h-4 text-white transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          {/* Two thermal cameras stacked vertically */}
          <div className="space-y-4">
            {/* Thermal Camera Front */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white text-xs font-medium">FRONT</span>
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
                  src="/lovable-uploads/b0466e08-3b13-4c7d-a3a1-e8a5b3af9d19.png"
                  alt="Thermal Camera Front Feed"
                  className="w-full h-32 object-cover"
                />
                
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

            {/* Thermal Camera Back */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white text-xs font-medium">BACK</span>
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
                  src="/lovable-uploads/99399008-d3ef-418d-b13c-d16a8ca95df0.png"
                  alt="Thermal Camera Back Feed"
                  className="w-full h-32 object-cover"
                />
                
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
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default ThermalStream;

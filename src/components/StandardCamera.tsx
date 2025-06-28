
import React from 'react';
import { Camera } from 'lucide-react';

const StandardCamera: React.FC = () => {
  return (
    <div className="absolute top-20 right-6 bg-black/50 backdrop-blur-md rounded-lg border border-white/20 p-4 w-96 z-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-white" />
          <span className="text-white text-sm font-medium">STANDARD CAMERA</span>
        </div>
        <div className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-300 border border-green-500/30">
          ACTIVE
        </div>
      </div>

      {/* Camera Image - larger size */}
      <div className="relative rounded-lg overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500&h=400&fit=crop"
          alt="Standard Camera Feed"
          className="w-full h-64 object-cover"
        />
        
        {/* Status overlay */}
        <div className="absolute top-2 left-2 bg-black/60 rounded px-2 py-1">
          <span className="text-white text-xs">LIVE</span>
        </div>
      </div>

      {/* Status info */}
      <div className="mt-3 text-xs text-white/70 space-y-1">
        <div>Camera: IP 192.168.1.102</div>
        <div>Resolution: 1920x1080</div>
        <div>FPS: 30</div>
      </div>
    </div>
  );
};

export default StandardCamera;

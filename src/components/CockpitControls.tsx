
import React from 'react';
import { Button } from '@/components/ui/button';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Anchor, Navigation, Square } from 'lucide-react';

const CockpitControls: React.FC = () => {
  const { publish } = useWebSocket();

  const handleDocking = () => {
    // Publier un message pour initier le docking
    publish('/docking_command', 'std_msgs/msg/String', { data: 'start_docking' });
  };

  const handlePatrol = () => {
    // Publier un message pour démarrer la patrouille
    publish('/patrol_command', 'std_msgs/msg/String', { data: 'start_patrol' });
  };

  const handleStopPatrol = () => {
    // Publier un message pour arrêter la patrouille
    publish('/patrol_command', 'std_msgs/msg/String', { data: 'stop_patrol' });
    // Aussi arrêter le mouvement
    const stopMsg = {
      linear: { x: 0, y: 0, z: 0 },
      angular: { x: 0, y: 0, z: 0 }
    };
    publish('/cmd_vel', 'geometry_msgs/msg/Twist', stopMsg);
  };

  return (
    <div className="absolute bottom-6 left-6 flex flex-col space-y-3">
      <Button
        onClick={handleDocking}
        className="bg-blue-600/80 hover:bg-blue-600 text-white backdrop-blur-md border border-blue-500/30 px-6 py-3"
      >
        <Anchor className="w-5 h-5 mr-2" />
        Docking
      </Button>
      
      <Button
        onClick={handlePatrol}
        className="bg-green-600/80 hover:bg-green-600 text-white backdrop-blur-md border border-green-500/30 px-6 py-3"
      >
        <Navigation className="w-5 h-5 mr-2" />
        Patrol
      </Button>
      
      <Button
        onClick={handleStopPatrol}
        className="bg-red-600/80 hover:bg-red-600 text-white backdrop-blur-md border border-red-500/30 px-6 py-3"
      >
        <Square className="w-5 h-5 mr-2" />
        Stop Patrol
      </Button>
    </div>
  );
};

export default CockpitControls;

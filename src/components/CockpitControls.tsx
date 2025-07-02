
import React from 'react';
import { Button } from '@/components/ui/button';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Anchor, Navigation, Square } from 'lucide-react';

const CockpitControls: React.FC = () => {
  const { callService } = useWebSocket();

  const handleDocking = async () => {
    try {
      await callService('/do_docking', 'std_srvs/srv/Trigger');
      console.log('Docking service called successfully');
    } catch (error) {
      console.error('Failed to call docking service:', error);
    }
  };

  const handlePatrol = async () => {
    try {
      await callService('/do_patrol', 'std_srvs/srv/Trigger');
      console.log('Patrol service called successfully');
    } catch (error) {
      console.error('Failed to call patrol service:', error);
    }
  };

  const handleStopPatrol = async () => {
    try {
      await callService('/stop_patrol', 'std_srvs/srv/Trigger');
      console.log('Stop patrol service called successfully');
    } catch (error) {
      console.error('Failed to call stop patrol service:', error);
    }
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

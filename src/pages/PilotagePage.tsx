
import React from 'react';
import Navbar from '@/components/Navbar';
import VideoStream from '@/components/VideoStream';
import VirtualJoystick from '@/components/VirtualJoystick';
import RobotMap from '@/components/RobotMap';
import { useWebSocket } from '@/hooks/useWebSocket';

const PilotagePage: React.FC = () => {
  const { isConnected } = useWebSocket();

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      
      <div className="p-6">
        {/* Statut de connexion ROS2 */}
        <div className="mb-6">
          <div className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
            isConnected 
              ? 'bg-green-900 text-green-300 border border-green-700' 
              : 'bg-red-900 text-red-300 border border-red-700'
          }`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${
              isConnected ? 'bg-green-400' : 'bg-red-400'
            }`} />
            {isConnected ? 'ROS2 Connecté' : 'ROS2 Déconnecté'}
          </div>
        </div>

        {/* Grille principale */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          
          {/* Flux vidéo - prend 2 colonnes sur xl */}
          <div className="xl:col-span-2">
            <VideoStream streamUrl="rtsp://192.168.1.100:554/stream1" />
          </div>

          {/* Contrôles joystick */}
          <div>
            <VirtualJoystick />
          </div>

          {/* Carte robot - prend toute la largeur sur mobile/tablet, 2 colonnes sur desktop */}
          <div className="lg:col-span-2 xl:col-span-3">
            <RobotMap />
          </div>
        </div>

        {/* Informations système */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <h3 className="text-slate-300 text-sm font-medium mb-2">Topics ROS2</h3>
            <div className="space-y-1 text-xs">
              <div className="text-slate-400">/cmd_vel - Commandes de vitesse</div>
              <div className="text-slate-400">/map - Carte d'occupation</div>
              <div className="text-slate-400">/amcl_pose - Position du robot</div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <h3 className="text-slate-300 text-sm font-medium mb-2">Flux Vidéo</h3>
            <div className="space-y-1 text-xs">
              <div className="text-slate-400">Source: rtsp://192.168.1.100:554/stream1</div>
              <div className="text-slate-400">Résolution: Automatique</div>
              <div className="text-slate-400">Latence: Temps réel</div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <h3 className="text-slate-300 text-sm font-medium mb-2">WebSocket</h3>
            <div className="space-y-1 text-xs">
              <div className="text-slate-400">Adresse: ws://localhost:9090</div>
              <div className="text-slate-400">Protocol: rosbridge_suite</div>
              <div className={`${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                État: {isConnected ? 'Connecté' : 'Déconnecté'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PilotagePage;

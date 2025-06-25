
import React from 'react';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Settings, Activity, Wifi, Camera, Map, Gamepad2 } from 'lucide-react';

const DashboardPage: React.FC = () => {
  const { isConnected } = useWebSocket();

  const systemModules = [
    {
      name: 'Flux Vidéo RTSP',
      icon: Camera,
      status: 'Actif',
      description: 'Caméra IP 192.168.1.100:554',
      color: 'text-blue-400'
    },
    {
      name: 'Contrôle Joystick',
      icon: Gamepad2,
      status: 'Prêt',
      description: 'Topic /cmd_vel configuré',
      color: 'text-green-400'
    },
    {
      name: 'Cartographie',
      icon: Map,
      status: 'En attente',
      description: 'Topics /map et /amcl_pose',
      color: 'text-yellow-400'
    },
    {
      name: 'WebSocket ROS2',
      icon: Wifi,
      status: isConnected ? 'Connecté' : 'Déconnecté',
      description: 'rosbridge_suite ws://localhost:9090',
      color: isConnected ? 'text-green-400' : 'text-red-400'
    }
  ];

  const rosTopics = [
    { name: '/cmd_vel', type: 'geometry_msgs/msg/Twist', status: 'Publication' },
    { name: '/map', type: 'nav_msgs/msg/OccupancyGrid', status: 'Souscription' },
    { name: '/amcl_pose', type: 'geometry_msgs/msg/PoseWithCovarianceStamped', status: 'Souscription' }
  ];

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Tableau de Bord Administrateur
          </h1>
          <p className="text-slate-400">
            Supervision et configuration du système de contrôle robot ROS2
          </p>
        </div>

        {/* Statut général */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {systemModules.map((module, index) => {
            const IconComponent = module.icon;
            return (
              <Card key={index} className="bg-slate-800 border-slate-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <IconComponent className={`w-8 h-8 ${module.color}`} />
                    <div className={`text-xs px-2 py-1 rounded-full ${
                      module.status === 'Actif' || module.status === 'Connecté' || module.status === 'Prêt'
                        ? 'bg-green-900 text-green-300'
                        : module.status === 'En attente'
                        ? 'bg-yellow-900 text-yellow-300'
                        : 'bg-red-900 text-red-300'
                    }`}>
                      {module.status}
                    </div>
                  </div>
                  <h3 className="text-white font-semibold mb-1">{module.name}</h3>
                  <p className="text-slate-400 text-sm">{module.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Configuration ROS2 */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Configuration ROS2
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-slate-300 font-medium mb-3">Topics Configurés</h4>
                <div className="space-y-2">
                  {rosTopics.map((topic, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                      <div>
                        <div className="text-white font-mono text-sm">{topic.name}</div>
                        <div className="text-slate-400 text-xs">{topic.type}</div>
                      </div>
                      <div className={`text-xs px-2 py-1 rounded ${
                        topic.status === 'Publication' 
                          ? 'bg-blue-900 text-blue-300'
                          : 'bg-purple-900 text-purple-300'
                      }`}>
                        {topic.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Monitoring système */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Monitoring Système
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">WebSocket ROS2</span>
                  <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Flux Vidéo RTSP</span>
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Interface Joystick</span>
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Cartographie</span>
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-slate-700 rounded-lg">
                <h5 className="text-slate-300 font-medium mb-2">Informations Système</h5>
                <div className="space-y-1 text-xs text-slate-400">
                  <div>Version Dashboard: 1.0.0</div>
                  <div>ROS2 Distribution: Humble</div>
                  <div>rosbridge_suite: WebSocket</div>
                  <div>Dernière mise à jour: {new Date().toLocaleString('fr-FR')}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Documentation et aide */}
        <Card className="bg-slate-800 border-slate-700 mt-8">
          <CardHeader>
            <CardTitle className="text-white">Configuration et Documentation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
              <div>
                <h4 className="text-slate-300 font-medium mb-2">Configuration Réseau</h4>
                <div className="space-y-1 text-slate-400">
                  <div>• WebSocket: ws://localhost:9090</div>
                  <div>• Flux RTSP: rtsp://192.168.1.100:554/stream1</div>
                  <div>• Interface Web: Port 8080</div>
                </div>
              </div>
              
              <div>
                <h4 className="text-slate-300 font-medium mb-2">Topics ROS2</h4>
                <div className="space-y-1 text-slate-400">
                  <div>• /cmd_vel: Commandes de vitesse</div>
                  <div>• /map: Carte d'occupation</div>
                  <div>• /amcl_pose: Position robot</div>
                </div>
              </div>
              
              <div>
                <h4 className="text-slate-300 font-medium mb-2">Utilisateurs</h4>
                <div className="space-y-1 text-slate-400">
                  <div>• admin: Accès complet</div>
                  <div>• user1: Pilotage uniquement</div>
                  <div>• Authentification locale</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;

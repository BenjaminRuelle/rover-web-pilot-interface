
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, User, MapPin, Workflow } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="absolute top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-md border-b border-white/10 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <h1 className="text-xl font-bold text-white">
            🤖 Robot Control
          </h1>
          
          <div className="flex space-x-2">
            <Button
              variant={location.pathname === '/pilotage' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => navigate('/pilotage')}
              className={location.pathname === '/pilotage' 
                ? "bg-blue-600 text-white hover:bg-blue-700" 
                : "text-white hover:bg-white/10 hover:text-white"
              }
            >
              Control
            </Button>
            
            <Button
              variant={location.pathname === '/patrol' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => navigate('/patrol')}
              className={location.pathname === '/patrol' 
                ? "bg-blue-600 text-white hover:bg-blue-700" 
                : "text-white hover:bg-white/10 hover:text-white"
              }
            >
              <MapPin className="w-4 h-4 mr-2" />
              Patrol
            </Button>

            <Button
              variant={location.pathname === '/scenarios' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => navigate('/scenarios')}
              className={location.pathname === '/scenarios' 
                ? "bg-blue-600 text-white hover:bg-blue-700" 
                : "text-white hover:bg-white/10 hover:text-white"
              }
            >
              <Workflow className="w-4 h-4 mr-2" />
              Scenarios
            </Button>
          </div>
        </div>

        {user && (
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-white/80">
              <User className="w-4 h-4 mr-2" />
              <span className="text-sm">
                {user.username}
              </span>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-white/80 hover:bg-white/10 hover:text-white"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;


import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, User, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-slate-900 border-b border-slate-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <h1 className="text-xl font-bold text-white">
            Dashboard Robot ROS2
          </h1>
          
          {user && (
            <div className="flex space-x-4">
              {user.role === 'admin' && (
                <Link
                  to="/dashboard"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/dashboard')
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <Settings className="w-4 h-4 inline mr-2" />
                  Tableau de bord
                </Link>
              )}
              
              <Link
                to="/pilotage"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/pilotage')
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                🕹️ Pilotage
              </Link>
            </div>
          )}
        </div>

        {user && (
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-slate-300">
              <User className="w-4 h-4 mr-2" />
              <span className="text-sm">
                {user.username} ({user.role})
              </span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="text-slate-300 border-slate-600 hover:bg-slate-700"
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

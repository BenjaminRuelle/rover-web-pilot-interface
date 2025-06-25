
import React from 'react';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles = ['admin', 'user1'] 
}) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user && allowedRoles.includes(user.role)) {
    return <>{children}</>;
  }

  // Si l'utilisateur n'a pas les bonnes permissions, rediriger selon son rôle
  if (user?.role === 'user1') {
    return <Navigate to="/pilotage" replace />;
  }

  return <Navigate to="/dashboard" replace />;
};

export default ProtectedRoute;

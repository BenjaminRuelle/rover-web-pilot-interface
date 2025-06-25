
import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'admin' | 'user1';

export interface User {
  username: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Utilisateurs prédéfinis pour la démo
const USERS = {
  admin: { password: 'admin123', role: 'admin' as UserRole },
  user1: { password: 'user123', role: 'user1' as UserRole }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté
    const savedUser = localStorage.getItem('robot_dashboard_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = (username: string, password: string): boolean => {
    const userConfig = USERS[username as keyof typeof USERS];
    
    if (userConfig && userConfig.password === password) {
      const newUser: User = { username, role: userConfig.role };
      setUser(newUser);
      localStorage.setItem('robot_dashboard_user', JSON.stringify(newUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('robot_dashboard_user');
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

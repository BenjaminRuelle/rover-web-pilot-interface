
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import LoginPage from "@/pages/LoginPage";
import PilotagePage from "@/pages/PilotagePage";
import PatrolPlanningPage from "@/pages/PatrolPlanningPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          isAuthenticated ? (
            <Navigate to="/pilotage" replace />
          ) : (
            <LoginPage />
          )
        } 
      />
      
      <Route 
        path="/pilotage" 
        element={
          <ProtectedRoute allowedRoles={['admin', 'user1']}>
            <PilotagePage />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/patrol" 
        element={
          <ProtectedRoute allowedRoles={['admin', 'user1']}>
            <PatrolPlanningPage />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/" 
        element={
          isAuthenticated ? (
            <Navigate to="/pilotage" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

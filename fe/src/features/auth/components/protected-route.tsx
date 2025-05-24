// src/features/auth/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/auth-hook';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'customer' | 'staff' | 'admin';
}

/**
 * Component for protected routes
 * Redirects to login if user is not authenticated
 * Or to home if user doesn't have required role
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { state } = useAuth();
  const location = useLocation();
  
  if (state.loading) {
    // Show loading spinner while checking authentication
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  if (!state.isAuthenticated) {
    // Redirect to login page with return URL
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }
  
  // Check if user has required role
  if (requiredRole && state.user && state.user.role !== requiredRole) {
    // Redirect to home page if user doesn't have required role
    return <Navigate to="/shop" replace />;
  }
  
  return <>{children}</>;
};

export default ProtectedRoute;

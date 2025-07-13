import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { selectIsAuthenticated, selectIsInitialized, selectIsLoading } from '../store/authSlice';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children, requireAuth = true }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isInitialized = useSelector(selectIsInitialized);
  const isLoading = useSelector(selectIsLoading);
  const location = useLocation();

  // Show loading spinner while checking auth status
  if (!isInitialized || isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <LoadingSpinner text="Checking authentication..." />
      </div>
    );
  }

  // If route requires authentication and user is not authenticated
  if (requireAuth && !isAuthenticated) {
    // Redirect to login with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If route is for non-authenticated users (like login) and user is authenticated
  if (!requireAuth && isAuthenticated) {
    // Redirect to POS dashboard
    return <Navigate to="/pos" replace />;
  }

  // User is authenticated and can access the route
  return children;
};

export default ProtectedRoute;

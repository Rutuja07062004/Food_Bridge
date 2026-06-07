import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    const isAdminRoute = window.location.pathname.startsWith('/admin');
    return <Navigate to={isAdminRoute ? "/admin/login" : "/login"} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect role-violators to landing page
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;

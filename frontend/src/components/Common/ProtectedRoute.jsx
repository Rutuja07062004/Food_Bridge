import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const currentPath = window.location.pathname;

  console.log(`[ProtectedRoute] Path: ${currentPath} | Loading: ${loading} | User: ${user ? `${user.email} (${user.role})` : 'None'}`);

  if (loading) {
    console.log(`[ProtectedRoute] Auth is loading. Showing spinner at: ${currentPath}`);
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    const isAdminRoute = currentPath.startsWith('/admin');
    console.warn(`[ProtectedRoute] No authenticated user. Redirecting to ${isAdminRoute ? '/admin/login' : '/login'}`);
    return <Navigate to={isAdminRoute ? "/admin/login" : "/login"} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    console.warn(`[ProtectedRoute] Role "${user.role}" not authorized for route "${currentPath}" (allowed: ${allowedRoles.join(', ')}). Redirecting to landing page.`);
    return <Navigate to="/" replace />;
  }

  console.log(`[ProtectedRoute] Access granted to "${currentPath}" for user "${user.email}" (${user.role})`);
  return children;
};

export default ProtectedRoute;

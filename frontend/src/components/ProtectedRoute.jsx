import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Wrap a page with <ProtectedRoute role="admin"> ... to require that role's login
export default function ProtectedRoute({ role, redirectTo, children }) {
  const { user, role: currentRole } = useAuth();

  if (!user || currentRole !== role) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}

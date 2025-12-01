import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div>Loading...</div>;

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  if (requiredRole && role !== requiredRole) return <div className="p-6">Acceso denegado: no tienes permisos.</div>;

  return children;
}

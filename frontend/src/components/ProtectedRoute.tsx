import type { ReactElement } from 'react';

import { Navigate } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactElement;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <h1>Carregando...</h1>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
}
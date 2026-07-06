import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../../context/authStore';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { token, adminToken } = useAuthStore();

  if (adminOnly) {
    if (!adminToken) {
      return <Navigate to="/admin/login" replace />;
    }
  } else {
    if (!token) {
      return <Navigate to="/login" replace />;
    }
  }

  return children;
}

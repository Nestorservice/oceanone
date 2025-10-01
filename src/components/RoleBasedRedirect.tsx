import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Loader2 } from 'lucide-react';

const RoleBasedRedirect: React.FC = () => {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-DEFAULT" />
      </div>
    );
  }

  if (!session || !profile) {
    return <Navigate to="/login" replace />;
  }

  if (profile.role === 'Admin' || profile.role === 'Super Admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // For all other roles, redirect to the member dashboard
  return <Navigate to="/member/dashboard" replace />;
};

export default RoleBasedRedirect;

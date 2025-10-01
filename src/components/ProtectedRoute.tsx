import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AdminLayout from '../layouts/AdminLayout';
import { Loader2 } from 'lucide-react';

const ProtectedRoute: React.FC = () => {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return <div className="flex h-screen w-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-brand-DEFAULT" /></div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (profile?.role !== 'Admin' && profile?.role !== 'Super Admin') {
    // If user is logged in but not an admin, send them to their own dashboard
    return <Navigate to="/member/dashboard" replace />;
  }

  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
};

export default ProtectedRoute;

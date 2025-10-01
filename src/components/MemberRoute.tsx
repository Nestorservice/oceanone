import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import MemberLayout from '../layouts/MemberLayout';
import { Loader2 } from 'lucide-react';

const MemberRoute: React.FC = () => {
  const { session, loading } = useAuth();

  if (loading) {
    return <div className="flex h-screen w-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-brand-DEFAULT" /></div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // This route is for any authenticated user, the layout will adapt.
  // More specific role checks can be added here if needed.

  return (
    <MemberLayout>
      <Outlet />
    </MemberLayout>
  );
};

export default MemberRoute;

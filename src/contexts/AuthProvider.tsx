import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile } from '../types/supabase';
import { toast } from 'sonner';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  authLoading: boolean; // Renamed for clarity
  profileLoading: boolean; // Added for better UX
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    // 1. Listen for auth state changes from Supabase
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      // This is now the ONLY thing that blocks the initial render. It's very fast.
      setAuthLoading(false); 
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // 2. A separate effect to fetch the profile when the user changes
  useEffect(() => {
    // Fetch profile if a user exists and is not already being fetched
    if (user) {
      setProfileLoading(true);
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
        .then(({ data, error }) => {
          if (error) {
            toast.error(`Erreur critique: Impossible de charger le profil. ${error.message}`);
            console.error("Erreur lors de la récupération du profil:", error);
            setProfile(null);
          } else {
            setProfile(data);
          }
          setProfileLoading(false);
        });
    } else {
      // Clear profile when user logs out
      setProfile(null);
    }
  }, [user]);


  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    session,
    user,
    profile,
    authLoading,
    profileLoading,
    signOut,
  };

  // Render children as soon as the initial authentication check is complete.
  return <AuthContext.Provider value={value}>{!authLoading && children}</AuthContext.Provider>;
};

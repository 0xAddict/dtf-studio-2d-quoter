import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import {
  signUp,
  signIn,
  signOut,
  getCurrentUser,
  getSession,
  onAuthStateChange,
  SignUpData,
  SignInData,
  AuthUser
} from '../services/supabase/auth';

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  signUp: (data: SignUpData) => Promise<{ data: any; error: any }>;
  signIn: (data: SignInData) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    // Check active session on mount
    getSession()
      .then(({ session, error }) => {
        if (error) {
          console.error('❌ Failed to get session:', error.message);
          console.error('   This usually means Supabase is not configured or unreachable.');
          console.error('   Check: Environment variables, Supabase URL, Network connection');
        }

        setSession(session);
        if (session) {
          getCurrentUser().then(setUser);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('❌ Fatal error initializing auth:', err);
        console.error('   Error details:', {
          message: err.message,
          name: err.name,
          stack: err.stack?.split('\n')[0]
        });
        setLoading(false);
      });

    // Listen for auth changes
    const subscription = onAuthStateChange(async (event, session) => {
      console.log('✅ Auth state changed:', event, session?.user?.email);

      setSession(session);

      if (session) {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const refreshUser = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
  };

  const handleSignUp = async (data: SignUpData) => {
    try {
      const result = await signUp(data);
      if (result.error) {
        console.error('❌ Sign up failed:', result.error.message);
        if (result.error.message?.includes('fetch')) {
          console.error('   Network error - check Supabase configuration');
          console.error('   Verify: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Netlify');
        }
      }
      if (result.data && !result.error) {
        console.log('✅ Sign up successful - verification email sent');
        // User created, but email not verified yet
        // Session will be created after email verification
      }
      return result;
    } catch (err: any) {
      console.error('❌ Fatal sign up error:', err.message);
      return { data: null, error: err };
    }
  };

  const handleSignIn = async (data: SignInData) => {
    try {
      const result = await signIn(data);
      if (result.error) {
        console.error('❌ Sign in failed:', result.error.message);
      }
      if (result.data && !result.error) {
        console.log('✅ Sign in successful');
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        setSession(result.data.session);
      }
      return result;
    } catch (err: any) {
      console.error('❌ Fatal sign in error:', err.message);
      return { data: null, error: err };
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
    setSession(null);
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signUp: handleSignUp,
    signIn: handleSignIn,
    signOut: handleSignOut,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

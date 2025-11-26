import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
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
  signingOut: boolean;
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
  const [signingOut, setSigningOut] = useState(false);

  const formatUser = (supabaseUser: User | null | undefined): AuthUser | null => {
    if (!supabaseUser) return null;

    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: supabaseUser.user_metadata?.name || 'User',
      emailVerified: !!supabaseUser.email_confirmed_at,
    };
  };

  // Initialize auth state
  useEffect(() => {
    const init = async () => {
      try {
        const { session, error } = await getSession();

        if (error) {
          console.error('❌ Failed to get session:', error.message);
          console.error('   This usually means Supabase is not configured or unreachable.');
          console.error('   Check: Environment variables, Supabase URL, Network connection');
        }

        setSession(session);

        // Populate user immediately from persisted session to avoid UI flicker
        const initialUser = formatUser(session?.user);
        if (initialUser) {
          setUser(initialUser);
        }

        if (session) {
          const currentUser = await getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
          }
        }
      } catch (err: any) {
        console.error('❌ Fatal error initializing auth:', err);
        console.error('   Error details:', {
          message: err.message,
          name: err.name,
          stack: err.stack?.split('\n')[0]
        });
      } finally {
        setLoading(false);
      }
    };

    init();

    // Listen for auth changes - this is the source of truth
    const subscription = onAuthStateChange(async (event, session) => {
      console.log('✅ Auth state changed:', event, session?.user?.email);

      // Handle specific events
      if (event === 'SIGNED_OUT') {
        // This is the definitive sign-out event from Supabase
        console.log('🚪 SIGNED_OUT event received - clearing state');
        setUser(null);
        setSession(null);
        setSigningOut(false);
        setLoading(false);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        console.log('🔑 User authenticated, fetching user data...');
        setSession(session);

        // Set immediate user to avoid flicker
        const immediateUser = formatUser(session?.user);
        if (immediateUser) {
          setUser(immediateUser);
        }

        if (session) {
          const currentUser = await getCurrentUser();
          console.log('🔍 Current user result:', currentUser);
          if (currentUser) {
            setUser(currentUser);
          }
        }
        setLoading(false);
      } else {
        // Handle other events (INITIAL_SESSION, etc.)
        setSession(session);

        const immediateUser = formatUser(session?.user);
        if (immediateUser) {
          setUser(immediateUser);
        }

        if (session) {
          const currentUser = await getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const refreshUser = useCallback(async () => {
    // Refresh both session and user data
    const { session: currentSession } = await getSession();
    setSession(currentSession);

    if (currentSession) {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      console.log('✅ User and session refreshed');
    } else {
      setUser(null);
      console.log('⚠️ No session found during refresh');
    }
  }, []);

  const handleSignUp = useCallback(async (data: SignUpData) => {
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
  }, []);

  const handleSignIn = useCallback(async (data: SignInData) => {
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
  }, []);

  const handleSignOut = useCallback(async () => {
    console.log('🔄 Sign out: Instant local clear (best practice)');

    // INSTANT: Clear local state immediately (don't wait for anything)
    setUser(null);
    setSession(null);

    // Call signOut (which clears localStorage instantly and does global in background)
    // This returns immediately without waiting for Supabase server
    try {
      await signOut();
      console.log('✅ Sign out completed instantly');
    } catch (err: any) {
      console.warn('⚠️ Sign out warning (already cleared locally):', err.message);
    }

    // User is now signed out - auth listener will trigger if needed
  }, []);

  const value: AuthContextType = useMemo(() => ({
    user,
    session,
    loading,
    signingOut,
    signUp: handleSignUp,
    signIn: handleSignIn,
    signOut: handleSignOut,
    refreshUser,
  }), [user, session, loading, signingOut, handleSignUp, handleSignIn, handleSignOut, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getSession } from '../services/supabase/auth';

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('🔄 Auth callback triggered');
        console.log('   Full URL:', window.location.href);
        console.log('   Hash:', window.location.hash);

        // Get the URL hash (Supabase puts auth tokens in the hash)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const type = hashParams.get('type');
        const accessToken = hashParams.get('access_token');
        const error = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');

        console.log('   Type:', type);
        console.log('   Has access token:', !!accessToken);
        console.log('   Error:', error);

        if (error) {
          console.error('❌ Verification error:', errorDescription);
          setStatus('error');
          setMessage(errorDescription || 'Verification failed');
          setTimeout(() => navigate('/'), 3000);
          return;
        }

        if (!accessToken) {
          console.warn('⚠️ No access token found in URL');
          setStatus('error');
          setMessage('Invalid verification link');
          setTimeout(() => navigate('/'), 3000);
          return;
        }

        if (type === 'signup' || type === 'recovery' || type === 'email') {
          console.log('✅ Email verification type detected');

          // Give Supabase a moment to process the session
          await new Promise(resolve => setTimeout(resolve, 1500));

          // Verify session was created
          const { session: newSession } = await getSession();
          console.log('   Session established:', !!newSession);
          console.log('   User email:', newSession?.user?.email);
          console.log('   Email verified:', !!newSession?.user?.email_confirmed_at);

          if (!newSession) {
            console.error('❌ Session not created after verification');
            setStatus('error');
            setMessage('Verification succeeded but session failed. Please try signing in manually.');
            setTimeout(() => navigate('/'), 3000);
            return;
          }

          // Refresh the user data in context (this will trigger auth state change)
          await refreshUser();

          setStatus('success');
          setMessage('Email verified successfully! You are now signed in.');

          console.log('✅ User verified and signed in, redirecting to home');

          // Redirect to home after 2 seconds
          setTimeout(() => {
            navigate('/');
          }, 2000);
        } else {
          console.log('⚠️ Unknown verification type:', type);
          // Still try to refresh user in case it's valid
          await refreshUser();
          navigate('/');
        }
      } catch (err: any) {
        console.error('❌ Auth callback error:', err);
        setStatus('error');
        setMessage(err.message || 'Something went wrong');
        setTimeout(() => navigate('/'), 3000);
      }
    };

    handleCallback();
  }, [navigate, refreshUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 max-w-md w-full border border-gray-200 dark:border-slate-700">
        <div className="text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            {status === 'loading' && (
              <div className="p-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
                <Loader2 className="w-12 h-12 text-indigo-600 dark:text-indigo-400 animate-spin" />
              </div>
            )}
            {status === 'success' && (
              <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full">
                <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
              </div>
            )}
            {status === 'error' && (
              <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
              </div>
            )}
          </div>

          {/* Message */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {status === 'loading' && 'Verifying...'}
              {status === 'success' && 'Success!'}
              {status === 'error' && 'Verification Failed'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {message}
            </p>
          </div>

          {/* Progress indicator */}
          {status === 'loading' && (
            <div className="w-full h-1 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 animate-pulse" style={{ width: '70%' }} />
            </div>
          )}

          {(status === 'success' || status === 'error') && (
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Redirecting you back to the app...
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

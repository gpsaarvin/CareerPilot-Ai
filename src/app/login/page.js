'use client';
// ============================================================
// Login Page — Google Sign-In only
// ============================================================
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import BrandLogo from '@/components/BrandLogo';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginWithGoogle } = useAuth();
  const router = useRouter();

  const handleGoogleLogin = async (credential) => {
    setError('');
    setLoading(true);

    try {
      await loginWithGoogle(credential);
      router.push('/dashboard');
    } catch (err) {
      setError(err.message || 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 animate-float-slow">
            <BrandLogo size={56} />
          </div>
          <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
          <p className="app-muted">Sign in securely with your Google account</p>
        </div>

        {/* Form */}
        <div className="app-surface border rounded-2xl p-6 sm:p-8 app-glow">
          {error && (
            <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3 text-sm text-violet-300">
              Live internships and resume features are now protected by Google authentication.
            </div>

            <GoogleSignInButton
              onSuccess={handleGoogleLogin}
              onError={(message) => setError(message)}
            />

            {loading && (
              <div className="flex items-center justify-center gap-2 text-sm app-muted">
                <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                Verifying your Google account...
              </div>
            )}
          </div>

          <p className="text-center text-gray-500 text-sm mt-6">
            New here?{' '}
            <Link href="/signup" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
              Create account with Google
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

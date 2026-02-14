import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface LoginPageProps {
  onSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const { login, loginAsGuest, loading, error } = useAuth();
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestError, setGuestError] = useState('');

  const handleGuestLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuestError('');

    if (!guestName.trim()) {
      setGuestError('Please enter a display name');
      return;
    }

    if (guestName.trim().length < 2 || guestName.trim().length > 50) {
      setGuestError('Display name must be between 2 and 50 characters');
      return;
    }

    if (!/^[a-zA-Z0-9_\s-]+$/.test(guestName.trim())) {
      setGuestError('Display name can only contain letters, numbers, spaces, underscores, and hyphens');
      return;
    }

    try {
      await loginAsGuest(guestName.trim());
      if (onSuccess) onSuccess();
    } catch (err) {
      setGuestError(err instanceof Error ? err.message : 'Failed to create guest account');
    }
  };

  if (showGuestForm) {
    return (
      <div className="w-full h-[100dvh] bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800 p-8 rounded-3xl shadow-2xl border border-gray-700">
          <button
            onClick={() => setShowGuestForm(false)}
            className="mb-4 text-gray-400 hover:text-white transition-colors flex items-center gap-2"
          >
            ← Back
          </button>

          <h2 className="text-3xl font-bold text-white text-center mb-2">
            Play as Guest
          </h2>
          <p className="text-gray-400 text-center mb-6 text-sm">
            Choose a display name to get started
          </p>

          <form onSubmit={handleGuestLogin} className="space-y-4">
            <div>
              <label htmlFor="guestName" className="block text-sm font-medium text-gray-300 mb-2">
                Display Name
              </label>
              <input
                type="text"
                id="guestName"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your name"
                maxLength={50}
                disabled={loading}
              />
            </div>

            {guestError && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-3 text-sm text-red-400">
                {guestError}
              </div>
            )}

            <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-xl p-4 text-sm text-yellow-400">
              <p className="font-semibold mb-1">⚠️ As a guest:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Your stats will be saved temporarily</li>
                <li>You won't appear on the leaderboard</li>
                <li>Guest accounts may be deleted after 30 days of inactivity</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              {loading ? 'Creating Account...' : 'Continue as Guest'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[100dvh] bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 p-8 rounded-3xl shadow-2xl border border-gray-700 relative overflow-hidden">
        {/* Subtle Background Accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl -mr-16 -mt-16 rounded-full"></div>

        <h1 className="text-4xl font-black text-white text-center mb-2 tracking-tight relative z-10">
          BLOCKS 3D
        </h1>
        <p className="text-gray-400 text-center mb-8 relative z-10">
          Sign in to play
        </p>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/50 rounded-xl p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-4 relative z-10">
          <button
            onClick={() => login('google')}
            disabled={loading}
            className="w-full bg-white hover:bg-gray-100 disabled:bg-gray-600 disabled:cursor-not-allowed text-gray-900 font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </button>

          <button
            onClick={() => login('github')}
            disabled={loading}
            className="w-full bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.840 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            Sign in with GitHub
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-800 text-gray-400">or</span>
            </div>
          </div>

          <button
            onClick={() => setShowGuestForm(true)}
            disabled={loading}
            className="w-full bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            Play as Guest
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          By signing in, you agree to use the game respectfully
        </p>
      </div>
    </div>
  );
};

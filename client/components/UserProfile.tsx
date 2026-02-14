import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export const UserProfile: React.FC = () => {
  const { user, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  if (!user) return null;

  const displayName = `${user.displayName}#${user.discriminator}`;
  const providerIcon = user.provider === 'google' ? '🔵' : user.provider === 'github' ? '⚫' : '🎭';
  const providerName = user.provider === 'google' ? 'Google' : user.provider === 'github' ? 'GitHub' : 'Guest';

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-3 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-xl transition-colors"
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.displayName}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
            {user.displayName[0].toUpperCase()}
          </div>
        )}
        <div className="text-left">
          <div className="text-white font-semibold text-sm">{displayName}</div>
          <div className="text-gray-400 text-xs flex items-center gap-1">
            <span>{providerIcon}</span>
            <span>{providerName}</span>
          </div>
        </div>
      </button>

      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName}
                    className="w-12 h-12 rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xl">
                    {user.displayName[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="text-white font-semibold">{displayName}</div>
                  <div className="text-gray-400 text-xs">{providerName} Account</div>
                </div>
              </div>
              {user.email && (
                <div className="text-gray-400 text-xs">{user.email}</div>
              )}
              {user.isGuest && (
                <div className="mt-2 bg-yellow-500/10 border border-yellow-500/50 rounded px-2 py-1 text-xs text-yellow-400">
                  Guest account - temporary
                </div>
              )}
            </div>

            <button
              onClick={() => {
                logout();
                setShowMenu(false);
              }}
              className="w-full px-4 py-3 text-left text-red-400 hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </>
      )}
    </div>
  );
};

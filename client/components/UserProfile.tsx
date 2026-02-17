import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export const UserProfile: React.FC = () => {
  const { user, logout, updateDisplayName } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const displayName = user.customDisplayName || user.displayName;
  const fullDisplayName = `${displayName}#${user.discriminator}`;
  const providerIcon = user.provider === 'google' ? '🔵' : user.provider === 'github' ? '⚫' : '🎭';
  const providerName = user.provider === 'google' ? 'Google' : user.provider === 'github' ? 'GitHub' : 'Guest';

  const handleEditName = () => {
    setNewDisplayName(user.customDisplayName || user.displayName);
    setIsEditingName(true);
    setError(null);
  };

  const handleSaveName = async () => {
    if (!newDisplayName.trim()) {
      setError('Display name cannot be empty');
      return;
    }

    if (newDisplayName.trim().length > 100) {
      setError('Display name cannot exceed 100 characters');
      return;
    }

    setIsUpdating(true);
    setError(null);

    try {
      await updateDisplayName(newDisplayName.trim());
      setIsEditingName(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update display name');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResetName = async () => {
    setIsUpdating(true);
    setError(null);

    try {
      await updateDisplayName(null);
      setIsEditingName(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset display name');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
    setError(null);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-3 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-xl transition-colors"
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={displayName}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
            {displayName[0].toUpperCase()}
          </div>
        )}
        <div className="text-left">
          <div className="text-white font-semibold text-sm">{fullDisplayName}</div>
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
                    alt={displayName}
                    className="w-12 h-12 rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xl">
                    {displayName[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="text-white font-semibold">{fullDisplayName}</div>
                  <div className="text-gray-400 text-xs">{providerName} Account</div>
                </div>
              </div>
              {user.email && (
                <div className="text-gray-400 text-xs mb-2">{user.email}</div>
              )}
              {user.customDisplayName && (
                <div className="text-xs text-gray-400 mb-2">
                  Original: {user.displayName}#{user.discriminator}
                </div>
              )}
              {user.isGuest && (
                <div className="mt-2 bg-yellow-500/10 border border-yellow-500/50 rounded px-2 py-1 text-xs text-yellow-400">
                  Guest account - temporary
                </div>
              )}
            </div>

            {!isEditingName ? (
              <>
                {!user.isGuest && (
                  <button
                    onClick={handleEditName}
                    className="w-full px-4 py-3 text-left text-white hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Edit Display Name
                  </button>
                )}

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
              </>
            ) : (
              <div className="p-4 space-y-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Display Name</label>
                  <input
                    type="text"
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                    placeholder="Enter display name"
                    maxLength={100}
                    disabled={isUpdating}
                  />
                  {error && (
                    <div className="mt-1 text-xs text-red-400">{error}</div>
                  )}
                  <div className="mt-1 text-xs text-gray-500">
                    {newDisplayName.length}/100 characters
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleSaveName}
                    disabled={isUpdating}
                    className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white rounded text-sm transition-colors"
                  >
                    {isUpdating ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={isUpdating}
                    className="flex-1 px-3 py-2 bg-gray-600 hover:bg-gray-500 disabled:opacity-50 text-white rounded text-sm transition-colors"
                  >
                    Cancel
                  </button>
                </div>

                {user.customDisplayName && (
                  <button
                    onClick={handleResetName}
                    disabled={isUpdating}
                    className="w-full px-3 py-2 text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    Reset to original name
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

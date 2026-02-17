import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, AuthState } from '@/types';

const SERVER_URL = (import.meta as any).env?.VITE_SERVER_URL || 'http://localhost:3000';

interface AuthContextType extends AuthState {
  login: (provider: 'google' | 'github') => void;
  loginAsGuest: (displayName: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    loading: true,
    error: null,
  });

  // Store token in localStorage
  const storeToken = useCallback((token: string) => {
    localStorage.setItem('auth_token', token);
    setState(prev => ({ ...prev, token }));
  }, []);

  // Clear token from localStorage
  const clearToken = useCallback(() => {
    localStorage.removeItem('auth_token');
    setState(prev => ({ ...prev, token: null, user: null }));
  }, []);

  // Verify token and get user info
  const verifyToken = useCallback(async (token: string): Promise<User | null> => {
    try {
      const response = await fetch(`${SERVER_URL}/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Token verification failed');
      }

      const data = await response.json();
      return data.user;
    } catch (error) {
      console.error('Token verification error:', error);
      return null;
    }
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      // Listen for OAuth messages from popup
      const handleOAuthMessage = async (event: MessageEvent) => {
        // Verify origin for security
        const expectedOrigin = new URL(SERVER_URL).origin;
        if (event.origin !== expectedOrigin) {
          return;
        }

        if (event.data?.type === 'oauth-success' && event.data?.token) {
          const token = event.data.token;
          storeToken(token);
          
          const user = await verifyToken(token);
          setState({ user, token, loading: false, error: null });
        }
      };

      window.addEventListener('message', handleOAuthMessage);

      // Check URL for OAuth failure (fallback for errors)
      const params = new URLSearchParams(window.location.search);
      const authStatus = params.get('auth');

      if (authStatus === 'failed') {
        // OAuth failed
        const error = params.get('error') || 'Authentication failed';
        setState({ user: null, token: null, loading: false, error });
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      // Check for stored token
      const storedToken = localStorage.getItem('auth_token');
      if (storedToken) {
        const user = await verifyToken(storedToken);
        if (user) {
          setState({ user, token: storedToken, loading: false, error: null });
        } else {
          // Token invalid, clear it
          clearToken();
          setState({ user: null, token: null, loading: false, error: null });
        }
      } else {
        setState({ user: null, token: null, loading: false, error: null });
      }

      // Cleanup
      return () => {
        window.removeEventListener('message', handleOAuthMessage);
      };
    };

    initAuth();
  }, [verifyToken, storeToken, clearToken]);

  // OAuth login - opens popup window
  const login = useCallback((provider: 'google' | 'github') => {
    const width = 500;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    window.open(
      `${SERVER_URL}/auth/${provider}`,
      'oauth',
      `width=${width},height=${height},left=${left},top=${top}`
    );
    
    // The popup will close automatically and send the token via postMessage
    // No need to poll - the message event listener in useEffect handles it
  }, []);

  // Guest login
  const loginAsGuest = useCallback(async (displayName: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(`${SERVER_URL}/auth/guest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ displayName })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create guest account');
      }

      const data = await response.json();
      storeToken(data.token);
      setState({
        user: data.user,
        token: data.token,
        loading: false,
        error: null
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to create guest account'
      }));
      throw error;
    }
  }, [storeToken]);

  // Logout
  const logout = useCallback(() => {
    clearToken();
    setState({ user: null, token: null, loading: false, error: null });
  }, [clearToken]);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    if (!state.token) return;

    const user = await verifyToken(state.token);
    if (user) {
      setState(prev => ({ ...prev, user }));
    } else {
      clearToken();
      setState({ user: null, token: null, loading: false, error: 'Session expired' });
    }
  }, [state.token, verifyToken, clearToken]);

  return (
    <AuthContext.Provider value={{
      ...state,
      login,
      loginAsGuest,
      logout,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

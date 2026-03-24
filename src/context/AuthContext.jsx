'use client';
// ============================================================
// Auth Context — Global authentication state for the app
// ============================================================
import { createContext, useContext, useEffect, useState } from 'react';
import { authAPI } from '@/lib/api';

const AuthContext = createContext(null);

function getInitialAuthState() {
  if (typeof window === 'undefined') {
    return { user: null, token: null };
  }

  const savedToken = localStorage.getItem('careersync_token');
  const savedUser = localStorage.getItem('careersync_user');

  if (!savedToken || !savedUser) {
    return { user: null, token: null };
  }

  try {
    const parsedUser = JSON.parse(savedUser);
    if (!parsedUser?._id || parsedUser._id === 'demo-user') {
      localStorage.removeItem('careersync_token');
      localStorage.removeItem('careersync_user');
      return { user: null, token: null };
    }

    return { user: parsedUser, token: savedToken };
  } catch (error) {
    localStorage.removeItem('careersync_token');
    localStorage.removeItem('careersync_user');
    return { user: null, token: null };
  }
}

export function AuthProvider({ children }) {
  const initial = getInitialAuthState();
  const [user, setUser] = useState(initial.user);
  const [token, setToken] = useState(initial.token);
  const [loading] = useState(false);

  useEffect(() => {
    if (!token) return;

    // Refresh user from API so stale localStorage values (like demo-user) don't persist.
    authAPI.getMe()
      .then((data) => {
        if (!data?.user || data.user._id === 'demo-user') {
          throw new Error('Invalid user profile');
        }
        setUser(data.user);
        localStorage.setItem('careersync_user', JSON.stringify(data.user));
      })
      .catch(() => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('careersync_token');
        localStorage.removeItem('careersync_user');
      });
  }, [token]);

  // Login
  const login = async (email, password) => {
    const data = await authAPI.login({ email, password });
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('careersync_token', data.token);
    localStorage.setItem('careersync_user', JSON.stringify(data.user));
    return data;
  };

  // Google login
  const loginWithGoogle = async (googlePayload) => {
    const body = typeof googlePayload === 'string'
      ? { credential: googlePayload }
      : {
          credential: googlePayload?.credential,
          profile: googlePayload?.profile,
        };

    const data = await authAPI.google(body);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('careersync_token', data.token);
    localStorage.setItem('careersync_user', JSON.stringify(data.user));
    return data;
  };

  // Signup
  const signup = async (name, email, password, skills = []) => {
    const data = await authAPI.signup({ name, email, password, skills });
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('careersync_token', data.token);
    localStorage.setItem('careersync_user', JSON.stringify(data.user));
    return data;
  };

  // Logout
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('careersync_token');
    localStorage.removeItem('careersync_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, loginWithGoogle, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

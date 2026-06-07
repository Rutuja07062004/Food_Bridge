import React, { createContext, useState, useEffect, useContext } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for existing token and restore session
  useEffect(() => {
    const checkAuth = async () => {
      console.log('[AuthContext] Restoring session from token...');
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await authService.getMe();
          if (res.success) {
            console.log('[AuthContext] Session restored successfully for user:', res.user.email);
            setUser(res.user);
          } else {
            console.warn('[AuthContext] Session restoration returned success=false. Clearing token.');
            localStorage.removeItem('token');
          }
        } catch (err) {
          console.error('[AuthContext] Session restoration failed:', err.message);
          localStorage.removeItem('token');
        }
      } else {
        console.log('[AuthContext] No existing token found.');
      }
      console.log('[AuthContext] Setting loading to false (initial session check complete).');
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    console.log('[AuthContext] Login initiated with credentials:', credentials.email);
    setLoading(true);
    setError(null);
    try {
      const res = await authService.login(credentials);
      if (res.success) {
        console.log('[AuthContext] Login successful. User:', res.user.email);
        setUser(res.user);
        setLoading(false);
        return { success: true };
      } else {
        console.warn('[AuthContext] Login failed:', res.message);
        setError(res.message);
        setLoading(false);
        return { success: false, message: res.message };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid credentials or login failed';
      console.error('[AuthContext] Login request failed:', msg);
      setError(msg);
      setLoading(false);
      return { success: false, message: msg };
    }
  };

  const register = async (userData) => {
    console.log('[AuthContext] Registration initiated for email:', userData.email);
    setLoading(true);
    setError(null);
    try {
      const res = await authService.register(userData);
      if (res.success) {
        console.log('[AuthContext] Registration successful. User:', res.user.email);
        setUser(res.user);
        setLoading(false);
        return { success: true };
      } else {
        console.warn('[AuthContext] Registration failed:', res.message);
        setError(res.message);
        setLoading(false);
        return { success: false, message: res.message };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Try again.';
      console.error('[AuthContext] Registration request failed:', msg);
      setError(msg);
      setLoading(false);
      return { success: false, message: msg };
    }
  };

  const logout = () => {
    console.log('[AuthContext] User logged out.');
    authService.logout();
    setUser(null);
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    setUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

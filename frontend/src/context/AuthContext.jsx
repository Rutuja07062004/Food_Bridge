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
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await authService.getMe();
          if (res.success) {
            setUser(res.user);
          } else {
            localStorage.removeItem('token');
          }
        } catch (err) {
          console.error('Session restoration failed:', err.message);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authService.login(credentials);
      if (res.success) {
        setUser(res.user);
        return { success: true };
      } else {
        setError(res.message);
        setLoading(false);
        return { success: false, message: res.message };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid credentials or login failed';
      setError(msg);
      setLoading(false);
      return { success: false, message: msg };
    }
  };

  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authService.register(userData);
      if (res.success) {
        setUser(res.user);
        return { success: true };
      } else {
        setError(res.message);
        setLoading(false);
        return { success: false, message: res.message };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Try again.';
      setError(msg);
      setLoading(false);
      return { success: false, message: msg };
    }
  };

  const logout = () => {
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

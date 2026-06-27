import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [loading, setLoading] = useState(true);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // Apply theme on load and when it changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Set default authorization header
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  }, [token]);

  // Load user profile on mount if token exists
  useEffect(() => {
    const loadProfile = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get(`${API_BASE}/auth/profile`);
        setUser(res.data);
      } catch (err) {
        console.error('Failed to load user profile:', err);
        // Clear expired token
        setToken('');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [token]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const loginUser = async (email, password) => {
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
      setToken(res.data.token);
      setUser(res.data);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Login failed. Please check credentials.'
      };
    }
  };

  const registerUser = async (name, email, password) => {
    try {
      const res = await axios.post(`${API_BASE}/auth/register`, { name, email, password });
      setToken(res.data.token);
      setUser(res.data);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Registration failed.'
      };
    }
  };

  const resetPassword = async (email, password) => {
    try {
      await axios.post(`${API_BASE}/forgot-password`, { email, password });
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Password reset failed.'
      };
    }
  };

  const logout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('token');
  };

  const updateUserProfile = async (updatedData) => {
    try {
      const res = await axios.put(`${API_BASE}/auth/profile`, updatedData);
      setUser(prev => ({ ...prev, ...res.data }));
      return { success: true };
    } catch (err) {
      return { success: false, message: 'Failed to update profile' };
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        token,
        setToken,
        theme,
        toggleTheme,
        loginUser,
        registerUser,
        resetPassword,
        logout,
        updateUserProfile,
        API_BASE,
        loading
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

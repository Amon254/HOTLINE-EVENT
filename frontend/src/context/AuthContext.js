import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/venues';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      authAPI.getMe()
        .then(({ data }) => setUser(data))
        .catch(() => localStorage.clear())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    const { data } = await authAPI.login({ username, password });
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    const { data: me } = await authAPI.getMe();
    setUser(me);
    return me;
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  const register = async (userData) => {
    await authAPI.register(userData);
    return login(userData.username, userData.password);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

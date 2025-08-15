import React, { useState, useEffect, createContext } from 'react';
import { loginUser, registerUser } from '../services/apiService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setIsLoading(false);
  }, []);

  const login = async (username, password) => {
    const data = await loginUser(username, password);
    localStorage.setItem('access_token', data.access_token);
    const userData = { username };
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const register = async (username, email, password) => {
    await registerUser(username, email, password);
    await login(username, password);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
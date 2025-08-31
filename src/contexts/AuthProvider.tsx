import { useState, useEffect, createContext, ReactNode } from 'react';
import { loginUser } from '../services/apiService';
import type { AuthContextType, User } from '../types';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        
        // If we don't have admin status, fetch fresh user data
        if (parsedUser.is_admin === undefined) {
          fetch('http://localhost:8000/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
          .then(response => {
            if (response.ok) {
              return response.json();
            }
            throw new Error('Failed to fetch user data');
          })
          .then(freshUserData => {
            localStorage.setItem('user', JSON.stringify(freshUserData));
            setUser(freshUserData);
          })
          .catch(error => {
            console.error('Failed to refresh user data:', error);
            // Keep the existing user data if refresh fails
          });
        }
      } catch (error) {
        console.error('Failed to parse user data from localStorage:', error);
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const data = await loginUser(username, password);
      localStorage.setItem('access_token', data.access_token);
      
      // Get user details including admin status from the backend
      const userResponse = await fetch('http://localhost:8000/auth/me', {
        headers: {
          'Authorization': `Bearer ${data.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      let userData: User = { username };
      if (userResponse.ok) {
        userData = await userResponse.json();
      }
      
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (_username: string, _email: string, _password: string) => {
    throw new Error('Registration not available - contact administrator');
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
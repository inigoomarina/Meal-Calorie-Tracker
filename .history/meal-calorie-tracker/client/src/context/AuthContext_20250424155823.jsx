import { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Verify token and get user profile
          const userData = await authService.getCurrentUser();
          setUser(userData);
        } catch (error) {
          console.error('Token validation failed:', error);
          // Clear invalid token
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const data = await authService.login(email, password);
      localStorage.setItem('token', data.token);
      setUser(data.user);
      return data.user;
    } catch (error) {
      throw error;
    }
  };

  const register = async (name, email, password) => {
    try {
      const data = await authService.register(name, email, password);
      localStorage.setItem('token', data.token);
      setUser(data.user);
      return data.user;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/'); // Redirect to home or login page after logout
  };

  const isAuthenticated = () => {
    return !!user;
  };

  // Add or update this function to the context
  const updateUser = (updatedUserData) => {
    setUser(currentUser => ({
      ...currentUser,
      ...updatedUserData
    }));
    
    // Update user in localStorage to persist changes
    const token = localStorage.getItem('token');
    if (token) {
      const userData = { ...user, ...updatedUserData };
      localStorage.setItem('user', JSON.stringify(userData));
    }
  };

  // Make sure to include updateUser in the context value
  const contextValue = {
    user,
    login,
    logout,
    register,
    updateUser, // Add this to the context value
    loading
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

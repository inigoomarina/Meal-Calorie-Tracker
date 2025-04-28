import { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

// Create the context
export const AuthContext = createContext();

// Define the provider as a named function component
// but use a consistent export pattern
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initAuth = async () => {
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
  }, [token]);

  const login = async (email, password) => {
    try {
      const data = await authService.login(email, password);
      localStorage.setItem('token', data.token);
      setToken(data.token);
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
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    navigate('/');
  };

  const isAuthenticated = () => {
    return !!token;
  };
  
  const updateUser = async (userData) => {
    try {
      // Update on the server
      const updatedUser = await authService.updateProfile(userData);
      
      // Update local state
      setUser(current => ({
        ...current,
        ...updatedUser,
        calorieGoal: updatedUser.calorieGoal,
        proteinGoal: updatedUser.proteinGoal,
        carbsGoal: updatedUser.carbsGoal,
        fatGoal: updatedUser.fatGoal
      }));
      
      return updatedUser;
    } catch (error) {
      console.error('Failed to update user profile:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading, 
        login, 
        register, 
        logout, 
        isAuthenticated,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

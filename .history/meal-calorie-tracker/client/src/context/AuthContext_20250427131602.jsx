import { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

// Create the context
export const AuthContext = createContext();

// Define the provider component
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
  
  // Function to update user profile data including goals
  const updateUser = async (userData) => {
    try {
      console.log("Updating user with:", userData);
      
      // Update on the server
      const updatedUserData = await authService.updateProfile(userData);
      console.log("Server returned updated user:", updatedUserData);
      
      // Update local state by merging new data
      setUser(current => {
        if (!current) return updatedUserData;
        
        const updated = {
          ...current,
          ...updatedUserData,
          // Explicitly update nutrition goals to ensure they are set
          calorieGoal: updatedUserData.calorieGoal !== undefined 
            ? updatedUserData.calorieGoal 
            : current.calorieGoal,
          proteinGoal: updatedUserData.proteinGoal !== undefined 
            ? updatedUserData.proteinGoal 
            : current.proteinGoal,
          carbsGoal: updatedUserData.carbsGoal !== undefined 
            ? updatedUserData.carbsGoal 
            : current.carbsGoal,
          fatGoal: updatedUserData.fatGoal !== undefined 
            ? updatedUserData.fatGoal 
            : current.fatGoal
        };
        
        console.log("Updated user state:", updated);
        return updated;
      });
      
      return updatedUserData;
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

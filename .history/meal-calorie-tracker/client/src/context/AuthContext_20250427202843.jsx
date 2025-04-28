import { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

// Create the context
export const AuthContext = createContext();

// Define the provider as a named function component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Function to fetch user data
  const fetchUserData = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const userData = await authService.getCurrentUser();
      console.log("User data fetched:", userData);
      setUser(userData);
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Clear invalid token
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Initialize authentication state
  useEffect(() => {
    fetchUserData();
  }, [token]);

  const login = async (email, password) => {
    try {
      setLoading(true);
      const data = await authService.login(email, password);
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (error) {
      console.error("Login error in context:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    try {
      setLoading(true);
      const data = await authService.register(name, email, password);
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (error) {
      console.error("Registration error in context:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    navigate('/');
  };

  const isAuthenticated = () => {
    return !!token && !!user;
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
        updateUser,
        refreshUser: fetchUserData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

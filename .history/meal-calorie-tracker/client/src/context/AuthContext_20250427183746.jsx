import { createContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        console.log("Fetching user data..."); // Debug log
        const userData = await authService.getCurrentUser();
        console.log("User data fetched:", userData); // Debug log
        setUser(userData);
      } catch (error) {
        console.error('Failed to fetch user:', error);
        localStorage.removeItem('token');
        setUser(null);
        navigate('/'); // Redirect to login if token is invalid
      }
    }
    setIsLoading(false);
  }, [navigate]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email, password) => {
    try {
      const data = await authService.login(email, password);
      await fetchUser(); // Fetch user data after login
      return data;
    } catch (error) {
      console.error('Login failed in context:', error);
      throw error;
    }
  };

  const register = async (name, email, password) => {
    try {
      const data = await authService.register(name, email, password);
      // Optionally log in the user automatically after registration
      // await login(email, password); 
      return data;
    } catch (error) {
      console.error('Registration failed in context:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/');
  };

  const isAuthenticated = () => {
    return !!localStorage.getItem('token') && !!user;
  };

  const value = {
    user,
    setUser, // Keep setUser if needed elsewhere, but prefer fetchUser for updates
    isLoading,
    login,
    register,
    logout,
    isAuthenticated,
    fetchUser // Expose fetchUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

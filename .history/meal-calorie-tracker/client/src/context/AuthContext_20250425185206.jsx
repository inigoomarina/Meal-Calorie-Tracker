import { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); // Now this will work because AuthProvider is inside Router

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
  
  // Add the updateUser function to update user profile data
  const updateUser = async (userData) => {
    try {
      // Update on the server
      const updatedUserFromServer = await authService.updateProfile(userData);
      
      // Update local state by merging new data
      // Ensure goals are updated if they are part of the response
      setUser(currentUser => {
        const updated = {
          ...currentUser, 
          ...userData, // Apply optimistic updates from input
          ...updatedUserFromServer // Overwrite with confirmed server data
        };
        console.log("AuthContext: User state updated:", updated);
        return updated;
      });
      
      return updatedUserFromServer;
    } catch (error) {
      console.error('Failed to update user profile:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        token, // Expose token if needed elsewhere, though maybe not directly
        loading, 
        login, 
        register, 
        logout, 
        isAuthenticated,
        updateUser // Ensure updateUser is provided
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

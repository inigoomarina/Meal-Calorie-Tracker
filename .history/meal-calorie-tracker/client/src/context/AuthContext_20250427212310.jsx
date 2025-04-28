import { createContext, useState, useEffect, useCallback, useMemo } from 'react'; // Import useMemo
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUserData = useCallback(async () => {
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
  }, [token]); // Keep token dependency

  useEffect(() => {
    setLoading(true); 
    fetchUserData();
  }, [fetchUserData]);

  const login = useCallback(async (email, password) => {
    try {
      const data = await authService.login(email, password);
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (error) {
      throw error;
    }
  }, [navigate]); // Add navigate if used inside

  const register = useCallback(async (name, email, password) => {
    try {
      const data = await authService.register(name, email, password);
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (error) {
      throw error;
    }
  }, [navigate]); // Add navigate if used inside

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setLoading(false); // Explicitly set loading false on logout
    navigate('/');
  }, [navigate]);

  const isAuthenticated = useCallback(() => {
    return !!token && !!user; // Check both token and user object
  }, [token, user]);
  
  const updateUser = useCallback(async (userData) => {
    if (!token) throw new Error("Not authenticated");
    setLoading(true); // Indicate loading during update
    try {
      const updatedUser = await authService.updateProfile(userData);
      // Optimistically update user state or refetch
      setUser(currentUser => ({ ...currentUser, ...updatedUser })); 
      // Or call fetchUserData() again if backend response is minimal
      console.log("AuthContext: User profile updated successfully.");
      return updatedUser;
    } catch (error) {
      console.error('AuthContext: Failed to update user profile:', error);
      throw error; // Re-throw error for component handling
    } finally {
      setLoading(false);
    }
  }, [token]); // Dependency on token

  // Memoize the context value
  const contextValue = useMemo(() => ({ 
    user, 
    loading, 
    login, 
    register, 
    logout, 
    isAuthenticated,
    updateUser,
    refreshUser: fetchUserData // Provide the memoized fetchUserData
  }), [user, loading, login, register, logout, isAuthenticated, updateUser, fetchUserData]);

  return (
    <AuthContext.Provider value={contextValue}>
      {/* Render children immediately, let consumers handle loading state */}
      {children} 
    </AuthContext.Provider>
  );
}

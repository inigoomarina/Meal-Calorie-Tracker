import { createContext, useState, useEffect, useCallback } from 'react'; // Import useCallback
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

  // Function to fetch user data - Memoized with useCallback
  const fetchUserData = useCallback(async () => {
    console.log("AuthContext: fetchUserData called. Token:", token ? "Exists" : "Missing"); // Log token status
    if (!token) {
      setLoading(false);
      setUser(null); // Ensure user is null if no token
      return;
    }

    // Avoid fetching if already loading
    // setLoading(true); // Set loading true when fetch starts

    try {
      const userData = await authService.getCurrentUser();
      console.log("AuthContext: User data fetched:", userData);
      setUser(userData);
    } catch (error) {
      console.error('AuthContext: Error fetching user data:', error);
      // Clear invalid token
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      // Optional: Redirect to login if token is invalid during fetch
      // navigate('/'); 
    } finally {
      setLoading(false); // Ensure loading is false after attempt
    }
  }, [token]); // Dependency: token

  // Initialize authentication state
  useEffect(() => {
    setLoading(true); // Set loading true when token changes or on initial load
    fetchUserData();
  }, [fetchUserData]); // Run when fetchUserData reference changes (due to token change)

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

  // Memoize the context value to prevent unnecessary re-renders of consumers
  const contextValue = { 
    user, 
    loading, 
    login, 
    register, 
    logout, 
    isAuthenticated,
    updateUser,
    refreshUser: fetchUserData // Provide the memoized function
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {/* Render children only when not loading initially, or always render and let consumers handle loading */}
      {children} 
      {/* Or conditionally: {!loading ? children : <div>Loading Application...</div>} */}
    </AuthContext.Provider>
  );
}

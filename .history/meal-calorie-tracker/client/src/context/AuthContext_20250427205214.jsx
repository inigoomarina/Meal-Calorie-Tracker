import { createContext, useState, useEffect, useCallback } from 'react'; // Import useCallback
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

// Create the context
export const AuthContext = createContext();

// Define the provider
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Wrap fetchUserData in useCallback
  const fetchUserData = useCallback(async () => {
    console.log("AuthContext: fetchUserData called. Token:", token ? "Exists" : "None");
    if (!token) {
      setLoading(false);
      setUser(null); // Ensure user is null if no token
      return;
    }

    // Avoid setting loading to true here if already loading from login/register
    // setLoading(true); 

    try {
      const userData = await authService.getCurrentUser();
      console.log("AuthContext: User data fetched:", userData);
      setUser(userData);
    } catch (error) {
      console.error('AuthContext: Error fetching user data:', error);
      // Clear invalid token and user state
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } finally {
      // Ensure loading is false after attempt, regardless of outcome
      setLoading(false); 
    }
  }, [token]); // Dependency: token

  // Initialize authentication state on mount
  useEffect(() => {
    setLoading(true); // Set loading true initially
    fetchUserData();
  }, [fetchUserData]); // Run when fetchUserData reference changes (due to token change)

  const login = async (email, password) => {
    try {
      setLoading(true);
      const data = await authService.login(email, password);
      localStorage.setItem('token', data.token);
      setToken(data.token); // This will trigger the useEffect above to fetch user data
      // setUser(data.user); // Let useEffect handle setting the user based on the new token
      return data.user; // Return user data from login response for immediate feedback if needed
    } catch (error) {
      console.error("Login error in context:", error);
      setLoading(false); // Ensure loading is false on error
      throw error;
    } 
    // No finally needed as fetchUserData handles setLoading(false)
  };

  const register = async (name, email, password) => {
    try {
      setLoading(true);
      const data = await authService.register(name, email, password);
      localStorage.setItem('token', data.token);
      setToken(data.token); // This triggers useEffect
      // setUser(data.user); // Let useEffect handle setting the user
      return data.user;
    } catch (error) {
      console.error("Registration error in context:", error);
      setLoading(false); // Ensure loading is false on error
      throw error;
    }
  };

  const logout = useCallback(() => { // Wrap logout in useCallback
    console.log("AuthContext: Logging out...");
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    navigate('/'); // Navigate after state updates
  }, [navigate]);

  const isAuthenticated = () => {
    // Check based on token presence and potentially user object validity
    return !!token && !!user; 
  };
  
  const updateUser = async (userData) => {
    try {
      setLoading(true); // Indicate loading during profile update
      const updatedUser = await authService.updateProfile(userData);
      // Update local state directly after successful API call
      setUser(current => ({
        ...current,
        ...updatedUser,
        // Ensure goals are explicitly updated
        calorieGoal: updatedUser.calorieGoal,
        proteinGoal: updatedUser.proteinGoal,
        carbsGoal: updatedUser.carbsGoal,
        fatGoal: updatedUser.fatGoal
      }));
      setLoading(false);
      return updatedUser;
    } catch (error) {
      console.error('Failed to update user profile:', error);
      setLoading(false); // Ensure loading is false on error
      throw error;
    }
  };

  // Provide the stable fetchUserData function as refreshUser
  const contextValue = { 
    user, 
    loading, 
    login, 
    register, 
    logout, 
    isAuthenticated,
    updateUser,
    refreshUser: fetchUserData // Pass the memoized function
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {!loading ? children : <div>Loading Application...</div>} {/* Optionally show loading indicator */}
    </AuthContext.Provider>
  );
}

import { createContext, useState, useEffect, useCallback } from 'react'; // Import useCallback
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import authService from '../services/authService';

// Create the context
export const AuthContext = createContext();

// Define the provider as a named function component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); // Initialize useNavigate

  // Function to fetch user data - Memoized with useCallback
  const fetchUserData = useCallback(async () => {
    console.log("AuthContext: fetchUserData called. Token:", token ? "Exists" : "Missing");
    if (!token) {
      setLoading(false);
      setUser(null);
      return;
    }
    // setLoading(true); // Avoid setting loading true here if already loading from login/register

    try {
      const userData = await authService.getCurrentUser();
      console.log("AuthContext: User data fetched:", userData);
      setUser(userData);
    } catch (error) {
      console.error('AuthContext: Error fetching user data:', error);
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      // navigate('/'); // Optional: Redirect on fetch error
    } finally {
      setLoading(false);
    }
  }, [token]); // Dependency: token

  // Initialize authentication state
  useEffect(() => {
    setLoading(true); // Set loading true when token changes or on initial load
    fetchUserData();
  }, [fetchUserData]); // Run when fetchUserData reference changes (due to token change)

  const login = async (email, password) => {
    try {
      setLoading(true); // Set loading true on login attempt
      const data = await authService.login(email, password);
      localStorage.setItem('token', data.token);
      setToken(data.token); // This triggers the useEffect above to fetch user data
      // setUser(data.user); // Let useEffect handle setting the user
      return data.user;
    } catch (error) {
      console.error("Login error in context:", error);
      setLoading(false); // Ensure loading is false on error
      throw error;
    }
    // No finally needed if fetchUserData handles setLoading(false)
  };

  const register = async (name, email, password) => {
    try {
      setLoading(true); // Set loading true on register attempt
      const data = await authService.register(name, email, password);
      localStorage.setItem('token', data.token);
      setToken(data.token); // This triggers the useEffect above
      // setUser(data.user); // Let useEffect handle setting the user
      return data.user;
    } catch (error) {
      console.error("Registration error in context:", error);
      setLoading(false); // Ensure loading is false on error
      throw error;
    }
  };

  // Wrap logout in useCallback to stabilize its reference if needed elsewhere
  const logout = useCallback(() => {
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

  // Add the updateUser function back
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

  // Memoize the context value
  const contextValue = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated,
    updateUser, // Provide updateUser
    refreshUser: fetchUserData // Provide the memoized fetchUserData as refreshUser
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {/* Render children directly, let consumers handle loading state */}
      {children}
      {/* Or show a global loading indicator: */}
      {/* {loading ? <div>Loading Application...</div> : children} */}
    </AuthContext.Provider>
  );
}

import api from './axios';

const userService = {
  // Get user profile by ID
  getUserProfile: async (userId) => {
    try {
      const response = await api.get(`/users/profile/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },
  
  // Update user settings including nutrition goals
  updateUserSettings: async (userData) => {
    try {
      const response = await api.put('/users/settings', userData);
      return response.data;
    } catch (error) {
      console.error('Error updating user settings:', error);
      throw error;
    }
  },
  
  // Update user profile information
  updateUserProfile: async (userData) => {
    try {
      const response = await api.put('/users/profile', userData);
      return response.data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }
};

export default userService;

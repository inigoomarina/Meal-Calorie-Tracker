import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class AuthService {
  async login(email, password) {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async register(name, email, password) {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, { name, email, password });
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async getCurrentUser() {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error getting current user:', error);
      throw error;
    }
  }

  async updateProfile(userData) {
    try {
      // Ensure all goal fields are included in the request payload
      const payload = {
        name: userData.name, // Include name if it's part of the update form elsewhere
        email: userData.email, // Include email if it's part of the update form elsewhere
        calorieGoal: userData.calorieGoal,
        proteinGoal: userData.proteinGoal,
        carbsGoal: userData.carbsGoal,
        fatGoal: userData.fatGoal,
      };
      // Filter out undefined fields before sending
      Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);
      
      console.log("Updating profile with payload:", payload); // Debug log
      const response = await axiosInstance.put('/auth/profile', payload);
      console.log("Profile update response:", response.data); // Debug log
      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error.response?.data || error.message);
      throw error;
    }
  }

  async updatePassword(currentPassword, newPassword) {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await axios.put(`${API_URL}/auth/password`, 
        { currentPassword, newPassword }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  }
}

export default new AuthService();
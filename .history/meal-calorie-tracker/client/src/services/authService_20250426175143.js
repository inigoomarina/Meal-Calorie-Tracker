import axios from 'axios';
import { API_URL } from '../config';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const authService = {
  register: async (name, email, password) => {
    const response = await axios.post(`${API_URL}/auth/register`, {
      name,
      email,
      password
    });
    return response.data;
  },
  
  login: async (email, password) => {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password
    });
    return response.data;
  },
  
  getCurrentUser: async () => {
    const headers = getAuthHeader();
    const response = await axios.get(`${API_URL}/auth/me`, { headers });
    return response.data;
  },
  
  updateProfile: async (userData) => {
    const headers = getAuthHeader();
    
    // Ensure all numeric goals are sent as numbers
    const data = {
      ...userData,
      calorieGoal: Number(userData.calorieGoal) || undefined,
      proteinGoal: Number(userData.proteinGoal) || undefined, 
      carbsGoal: Number(userData.carbsGoal) || undefined,
      fatGoal: Number(userData.fatGoal) || undefined
    };
    
    // Log what we're sending to help with debugging
    console.log("Sending user profile update:", data);
    
    const response = await axios.put(
      `${API_URL}/auth/profile`, 
      data, 
      { headers }
    );
    
    return response.data;
  },
  
  changePassword: async (oldPassword, newPassword) => {
    const headers = getAuthHeader();
    const response = await axios.post(
      `${API_URL}/auth/change-password`,
      { oldPassword, newPassword },
      { headers }
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
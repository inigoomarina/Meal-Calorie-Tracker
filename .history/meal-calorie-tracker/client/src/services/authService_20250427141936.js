import axiosInstance from './axios';

class AuthService {
  async login(email, password) {
    try {
      const response = await axiosInstance.post('/auth/login', { email, password });
      localStorage.setItem('token', response.data.token);
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async register(name, email, password) {
    try {
      const response = await axiosInstance.post('/auth/register', { name, email, password });
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async getCurrentUser() {
    try {
      const response = await axiosInstance.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error('Error getting current user:', error);
      throw error;
    }
  }

  async updateProfile(userData) {
    try {
      const response = await axiosInstance.put('/auth/profile', userData);
      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  async updatePassword(currentPassword, newPassword) {
    try {
      const response = await axiosInstance.put('/auth/password', 
        { currentPassword, newPassword }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  }
}

export default new AuthService();
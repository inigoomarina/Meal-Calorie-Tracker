import axiosInstance from './axios'; // Import the configured axios instance

const authService = {
  register: async (name, email, password) => {
    // Use axiosInstance and relative path
    const response = await axiosInstance.post('/auth/register', {
      name,
      email,
      password
    });
    return response.data;
  },
  
  login: async (email, password) => {
    // Use axiosInstance and relative path
    const response = await axiosInstance.post('/auth/login', {
      email,
      password
    });
    // Store token upon successful login (handled by axiosInstance interceptor potentially, but good practice here too)
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },
  
  getCurrentUser: async () => {
    // Use axiosInstance, headers are added automatically
    const response = await axiosInstance.get('/auth/me');
    return response.data;
  },
  
  updateProfile: async (userData) => {
    // Use axiosInstance, headers are added automatically
    
    // Ensure all numeric goals are sent as numbers
    const data = {
      ...userData,
      calorieGoal: Number(userData.calorieGoal) || undefined,
      proteinGoal: Number(userData.proteinGoal) || undefined, 
      carbsGoal: Number(userData.carbsGoal) || undefined,
      fatGoal: Number(userData.fatGoal) || undefined
    };
    
    // Log what we're sending to help with debugging
    console.log("Sending user profile update via axiosInstance:", data);
    
    // Use axiosInstance and relative path
    const response = await axiosInstance.put('/auth/profile', data);
    
    return response.data;
  },
  
  // Assuming changePassword endpoint is /auth/password based on routes/authRoutes.js
  changePassword: async (currentPassword, newPassword) => {
    // Use axiosInstance, headers are added automatically
    const response = await axiosInstance.put(
      '/auth/password', // Corrected endpoint based on routes
      { currentPassword, newPassword }
    );
    return response.data;
  }
};

export default authService;
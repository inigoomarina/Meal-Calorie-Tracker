import api from './axios'; // Corrected import path

const mealService = {
  // Get all meals for the logged-in user (optionally filtered by date)
  getUserMeals: async (params = {}) => {
    try {
      // Add specific date filter or date range
      const { date, startDate, endDate, limit = 100, _t } = params;
      const queryParams = new URLSearchParams();
      if (date) queryParams.append('date', date);
      if (startDate) queryParams.append('startDate', startDate); // Add start date param
      if (endDate) queryParams.append('endDate', endDate);     // Add end date param
      if (limit) queryParams.append('limit', limit);
      if (_t) queryParams.append('_t', _t); // Cache buster
      
      console.log(`Fetching meals with params: ${queryParams.toString()}`); // Log params
      
      const response = await api.get(`/meals?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching meals:', error);
      throw error;
    }
  },

  // Get a single meal by ID
  getMealById: async (id) => {
    try {
      const response = await api.get(`/meals/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching meal by ID:', error);
      throw error;
    }
  },

  // Create a new meal
  createMeal: async (mealData) => {
    try {
      const response = await api.post('/meals', mealData);
      return response.data;
    } catch (error) {
      console.error('Error creating meal:', error);
      throw error;
    }
  },

  // Update an existing meal
  updateMeal: async (id, mealData) => {
    try {
      const response = await api.put(`/meals/${id}`, mealData);
      return response.data;
    } catch (error) {
      console.error('Error updating meal:', error);
      throw error;
    }
  },

  // Delete a meal
  deleteMeal: async (id) => {
    try {
      await api.delete(`/meals/${id}`);
      return true;
    } catch (error) {
      console.error('Error deleting meal:', error);
      throw error;
    }
  },
  
  // Search food via backend proxy
  searchFood: async (query) => {
    try {
      const response = await api.get(`/food/search`, { params: { query } });
      return response.data;
    } catch (error) {
      console.error('Error searching food:', error);
      throw error;
    }
  },
  
  // Get food details via backend proxy
  getFoodDetails: async (fdcId) => {
    try {
      const response = await api.get(`/food/${fdcId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching food details:', error);
      throw error;
    }
  },

  // Get daily summary
  getDailySummary: async (date) => {
    try {
      // Add specific date parameter to ensure we only get today's data
      const params = new URLSearchParams();
      if (date) params.append('date', date);
      
      // Add cache buster to avoid stale data
      params.append('_t', new Date().getTime());
      
      const response = await api.get(`/meals/summary?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching calorie summary:', error);
      throw error;
    }
  },

  // Get weekly stats
  getWeeklyStats: async (params = {}) => {
    try {
      // Add cache buster to avoid stale data
      const queryParams = new URLSearchParams(params);
      queryParams.append('_t', new Date().getTime());
      
      const response = await api.get(`/meals/weekly-stats?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching weekly stats:', error);
      throw error;
    }
  },
};

export default mealService;
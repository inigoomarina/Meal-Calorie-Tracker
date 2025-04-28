import api from './axios'; // Corrected import path

const mealService = {
  async createMeal(mealData) {
    try {
      const response = await api.post('/meals', mealData);
      return response.data;
    } catch (error) {
      console.error('Error creating meal:', error);
      throw error;
    }
  },

  async getUserMeals({ date, startDate, endDate, limit = 100, _t }) { // Added startDate, endDate
    try {
      // Add specific date filter or date range
      const params = new URLSearchParams();
      if (date) params.append('date', date);
      if (startDate) params.append('startDate', startDate); // Add start date param
      if (endDate) params.append('endDate', endDate);     // Add end date param
      if (limit) params.append('limit', limit);
      if (_t) params.append('_t', _t); // Cache buster
      
      console.log(`Fetching meals with params: ${params.toString()}`); // Log params
      
      const response = await api.get(`/meals?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching meals:', error);
      throw error;
    }
  },

  async deleteMeal(id) {
    try {
      await api.delete(`/meals/${id}`);
      return true;
    } catch (error) {
      console.error('Error deleting meal:', error);
      throw error;
    }
  },

  async getCalorieSummary(date) {
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

  async getWeeklyStats() {
    try {
      // Add cache buster to avoid stale data
      const params = new URLSearchParams();
      params.append('_t', new Date().getTime());
      
      const response = await api.get(`/meals/weekly-stats?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching weekly stats:', error);
      throw error;
    }
  }
};

export default mealService;
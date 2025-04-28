import api from './axios';

const mealService = {
  // Get all meals for the current user
  getUserMeals: async (filter = {}) => {
    try {
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      const params = { ...filter, _t: timestamp };
      
      const response = await api.get('/meals', { 
        params,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching user meals:', error);
      throw error;
    }
  },

  // Get a specific meal by ID
  getMeal: async (id) => {
    const response = await api.get(`/meals/${id}`);
    return response.data;
  },

  // Create a new meal entry
  createMeal: async (mealData) => {
    const response = await api.post('/meals', mealData);
    return response.data;
  },

  // Update an existing meal
  updateMeal: async (id, mealData) => {
    const response = await api.put(`/meals/${id}`, mealData);
    return response.data;
  },

  // Delete a meal
  deleteMeal: async (id) => {
    const response = await api.delete(`/meals/${id}`);
    return response.data;
  },

  // Search for food in FDC API
  searchFood: async (query) => {
    const response = await api.get(`/meals/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  // Get user's daily calorie summary
  getCalorieSummary: async (date) => {
    try {
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      
      const response = await api.get('/meals/summary', { 
        params: { date, _t: timestamp },
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching calorie summary:', error);
      throw error;
    }
  },

  // Get weekly nutrition data for charts
  getWeeklyStats: async () => {
    try {
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      
      const response = await api.get('/meals/weekly-stats', {
        params: { _t: timestamp },
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching weekly stats:', error);
      throw error;
    }
  }
};

export default mealService;
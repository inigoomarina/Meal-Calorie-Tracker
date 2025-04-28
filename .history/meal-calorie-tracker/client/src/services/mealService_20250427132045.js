import api from './axios';

const mealService = {
  // Get all meals for the current user
  getUserMeals: async (filter = {}) => {
    try {
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      const params = { ...filter, _t: timestamp };
      
      // If a date filter is provided, use it to get only today's meals
      if (params.date) {
        console.log(`Fetching meals for date: ${params.date}`);
      }
      
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
    try {
      const timestamp = new Date().getTime();
      const response = await api.get(`/meals/${id}`, {
        params: { _t: timestamp },
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching meal:', error);
      throw error;
    }
  },

  // Create a new meal entry
  createMeal: async (mealData) => {
    try {
      console.log('Sending meal data to server:', mealData);
      const response = await api.post('/meals', mealData);
      console.log('Server response on creating meal:', response.data);
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
      const response = await api.delete(`/meals/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting meal:', error);
      throw error;
    }
  },

  // Search for food in FDC API
  searchFood: async (query) => {
    try {
      const response = await api.get(`/meals/search?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error('Error searching for food:', error);
      throw error;
    }
  },

  // Get user's daily calorie summary
  getCalorieSummary: async (date) => {
    try {
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      
      if (!date) {
        // Default to today if no date provided
        date = new Date().toISOString().split('T')[0];
      }
      
      console.log(`Getting calorie summary for date: ${date}`);
      
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
  },

  // Get meal history for a date range
  getMealHistory: async (params = {}) => {
    try {
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      
      // If no date range provided, default to the last 30 days
      if (!params.startDate || !params.endDate) {
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        
        params.endDate = today.toISOString().split('T')[0];
        params.startDate = thirtyDaysAgo.toISOString().split('T')[0];
      }
      
      console.log(`Fetching meal history from ${params.startDate} to ${params.endDate}`);
      
      const response = await api.get('/meals/history', { 
        params: { ...params, _t: timestamp },
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      console.log('Meal history data received:', response.data);
      return response.data; 
    } catch (error) {
      console.error('Error fetching meal history:', error);
      throw error;
    }
  }
};

export default mealService;
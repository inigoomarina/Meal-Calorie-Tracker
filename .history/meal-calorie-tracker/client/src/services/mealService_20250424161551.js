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
      // Make a deep copy to avoid modifying the original object
      const formattedData = { ...mealData };
      
      // Ensure nutrition data is properly formatted with numeric values
      formattedData.nutrition = {
        protein: parseFloat(mealData.nutrition?.protein || mealData.protein || 0),
        carbs: parseFloat(mealData.nutrition?.carbs || mealData.carbs || 0),
        fat: parseFloat(mealData.nutrition?.fat || mealData.fat || 0),
        fiber: parseFloat(mealData.nutrition?.fiber || mealData.fiber || 0),
        sugar: parseFloat(mealData.nutrition?.sugar || mealData.sugar || 0)
      };
      
      // Also ensure top-level properties exist for compatibility
      formattedData.protein = parseFloat(mealData.protein || mealData.nutrition?.protein || 0);
      formattedData.carbs = parseFloat(mealData.carbs || mealData.nutrition?.carbs || 0);
      formattedData.fat = parseFloat(mealData.fat || mealData.nutrition?.fat || 0);
      formattedData.fiber = parseFloat(mealData.fiber || mealData.nutrition?.fiber || 0);
      formattedData.sugar = parseFloat(mealData.sugar || mealData.nutrition?.sugar || 0);
      
      console.log('Sending formatted meal data to server:', formattedData);
      const response = await api.post('/meals', formattedData);
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

  // Get calorie summary for a specific date
  getCalorieSummary: async (date) => {
    try {
      const response = await api.get('/meals/summary', { 
        params: { 
          date,
          _t: new Date().getTime() // Cache buster
        },
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      console.log('Calorie summary data received:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching calorie summary:', error);
      throw error;
    }
  },

  // Get weekly stats for charts
  getWeeklyStats: async () => {
    try {
      const timestamp = new Date().getTime();
      const response = await api.get('/meals/weekly-stats', { 
        params: { _t: timestamp },
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      console.log('Weekly stats data received:', response.data);
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
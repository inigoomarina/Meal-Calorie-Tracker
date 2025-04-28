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

  // Create a new meal entry with proper nutrition data formatting
  createMeal: async (mealData) => {
    try {
      // Ensure nutrition data is properly formatted before sending
      const formattedMealData = {
        ...mealData,
        calories: Number(mealData.calories),
        // Add direct properties for backward compatibility
        protein: parseFloat(mealData.protein || mealData.nutrition?.protein || 0),
        carbs: parseFloat(mealData.carbs || mealData.nutrition?.carbs || 0),
        fat: parseFloat(mealData.fat || mealData.nutrition?.fat || 0),
        fiber: parseFloat(mealData.fiber || mealData.nutrition?.fiber || 0),
        sugar: parseFloat(mealData.sugar || mealData.nutrition?.sugar || 0),
        // Structured nutrition object (preferred format)
        nutrition: {
          protein: parseFloat(mealData.nutrition?.protein || mealData.protein || 0),
          carbs: parseFloat(mealData.nutrition?.carbs || mealData.carbs || 0),
          fat: parseFloat(mealData.nutrition?.fat || mealData.fat || 0),
          fiber: parseFloat(mealData.nutrition?.fiber || mealData.fiber || 0),
          sugar: parseFloat(mealData.nutrition?.sugar || mealData.sugar || 0)
        }
      };
      
      console.log('Sending formatted meal data to server:', formattedMealData);
      const response = await api.post('/meals', formattedMealData);
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
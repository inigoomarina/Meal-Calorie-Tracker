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

  // Create a new meal entry
  createMeal: async (mealData) => {
    try {
      // Make sure all nutrition values are numbers
      let formattedData = { ...mealData };
      
      // Ensure nutrition object exists
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
  
  // Get weekly stats for charts
  getWeeklyStats: async () => {
    try {
      const response = await api.get('/meals/weekly-stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching weekly stats:', error);
      throw error;
    }
  },
  
  // Get calorie summary for a specific date
  getCalorieSummary: async (date) => {
    try {
      const response = await api.get(`/meals/calorie-summary`, {
        params: { date }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching calorie summary:', error);
      throw error;
    }
  },
  
  // Delete a meal
  deleteMeal: async (mealId) => {
    try {
      const response = await api.delete(`/meals/${mealId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting meal:', error);
      throw error;
    }
  },
  
  // Get meal history with date range
  getMealHistory: async (dateRange = {}) => {
    try {
      const response = await api.get('/meals/history', {
        params: dateRange
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching meal history:', error);
      throw error;
    }
  }
};

export default mealService;
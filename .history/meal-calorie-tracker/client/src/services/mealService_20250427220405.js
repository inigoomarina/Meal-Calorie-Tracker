import api from './api';

const mealService = {
  // Get all meals for the logged-in user, optionally filtered by date
  getUserMeals: async (filters = {}) => {
    try {
      // Add cache-busting parameter
      filters._t = new Date().getTime();
      console.log("Fetching meals with filters:", filters);
      const response = await api.get('/meals', { params: filters });
      console.log("Meals received:", response.data);
      // Ensure the response is always an array
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching user meals:', error);
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
      // Ensure 'time' field is set to current ISO string if not provided
      const dataToSend = {
        ...mealData,
        time: mealData.time || new Date().toISOString() 
      };
      console.log("Sending meal data to create:", dataToSend);
      const response = await api.post('/meals', dataToSend);
      console.log("Meal created response:", response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating meal:', error.response?.data || error.message);
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
      console.log(`Attempting to delete meal with ID: ${id}`);
      const response = await api.delete(`/meals/${id}`);
      console.log("Meal deleted response:", response.data);
      return response.data;
    } catch (error) {
      console.error('Error deleting meal:', error);
      throw error;
    }
  },
  
  // Get daily calorie summary (if endpoint exists)
  getDailySummary: async () => {
    try {
      const response = await api.get('/meals/summary');
      return response.data;
    } catch (error) {
      console.error('Error fetching daily summary:', error);
      throw error;
    }
  },

  // Get weekly nutrition stats (if endpoint exists)
  getWeeklyStats: async () => {
    try {
      const timestamp = new Date().getTime();
      const response = await api.get('/meals/weekly-stats', {
        params: { _t: timestamp },
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
      });
      console.log("Weekly stats received:", response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching weekly stats:', error);
      // Return default structure on error to prevent crashes
      return { days: [], calories: [], proteins: [], carbs: [], fats: [] };
    }
  },

  // Get aggregated meal history (if endpoint exists and is different from getUserMeals)
  getMealHistory: async (startDate, endDate) => {
     // This might be deprecated if getUserMeals handles date ranges
     // If used, ensure it works correctly or switch to getUserMeals
     console.warn("getMealHistory might be deprecated, consider using getUserMeals with date filters.");
     return mealService.getUserMeals({ startDate, endDate }); // Delegate to getUserMeals
  }
};

export default mealService;
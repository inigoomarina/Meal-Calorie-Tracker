import api from './axios';

const mealService = {
  // Get all meals for the current user
  getUserMeals: async (filter = {}) => {
    const response = await api.get('/meals', { params: filter });
    return response.data;
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

  // Search for food in Edamam API
  searchFood: async (query) => {
    const response = await api.get(`/meals/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  // Get user's daily calorie summary
  getCalorieSummary: async (date) => {
    const response = await api.get('/meals/summary', { 
      params: { date } 
    });
    return response.data;
  },

  // Get weekly nutrition data for charts
  getWeeklyStats: async () => {
    const response = await api.get('/meals/weekly-stats');
    return response.data;
  }
};

export default mealService;
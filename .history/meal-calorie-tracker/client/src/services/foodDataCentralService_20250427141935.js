import axios from 'axios';
import mealService from './mealService';

// Use environment variables for API key with fallback
const API_KEY = import.meta.env.VITE_FDC_API_KEY || 'demo-key';
const BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

const foodDataCentralService = {
  // Search for foods - use server proxy first, fallback to direct API
  searchFoods: async (query) => {
    try {
      // First try to use our server's proxy endpoint
      console.log("Searching foods via backend proxy...");
      const response = await mealService.searchFood(query);
      return response;
    } catch (serverError) {
      console.error('Server proxy search error, trying direct API:', serverError);
      
      try {
        // Fall back to direct API call with proper formatting
        const encodedQuery = encodeURIComponent(query);
        const url = `${BASE_URL}/foods/search?api_key=${API_KEY}&query=${encodedQuery}&pageSize=15`;
        
        const response = await axios.get(url, {
          params: {
            dataType: ['Foundation', 'SR Legacy', 'Branded']
          }
        });
        
        // Process search results for easier consumption
        const foods = response.data.foods.map(food => ({
          fdcId: food.fdcId,
          name: food.description,
          brandName: food.brandName || '',
          dataType: food.dataType,
          nutrients: extractBasicNutrients(food)
        }));
        
        return foods;
      } catch (directApiError) {
        console.error('Direct API food search error:', directApiError);
        throw directApiError;
      }
    }
  },
  
  // Get detailed food information by ID
  getFoodDetails: async (fdcId) => {
    try {
      // First try to get details from our server cache if available
      try {
        const cachedDetails = await mealService.getFoodDetails(fdcId);
        if (cachedDetails) return cachedDetails;
      } catch (cacheError) {
        console.log('No cached food details, trying direct API');
      }
      
      // Fall back to direct API call
      const response = await axios.get(`${BASE_URL}/food/${fdcId}`, {
        params: {
          api_key: API_KEY
        }
      });
      
      // Extract relevant nutrient information
      const foodData = response.data;
      const nutrients = extractDetailedNutrients(foodData);
      
      return {
        fdcId: foodData.fdcId,
        name: foodData.description,
        brandName: foodData.brandName || null,
        ingredients: foodData.ingredients || null,
        servingSize: foodData.servingSize || null,
        servingSizeUnit: foodData.servingSizeUnit || 'g',
        ...nutrients
      };
    } catch (error) {
      console.error('Error fetching food details:', error);
      // Return simplified object with basic structure to prevent further errors
      return {
        fdcId: fdcId,
        name: "Food Details Unavailable",
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0
      };
    }
  },
  
  // Helper function to calculate nutrients based on portion
  calculateNutrients: (food, grams) => {
    if (!food) return null;
    
    const multiplier = grams / 100;
    
    // Support both flattened and nested nutrient structures
    const baseNutrients = food.nutrients || food;
    
    return {
      calories: Math.round((baseNutrients.calories || 0) * multiplier),
      protein: parseFloat(((baseNutrients.protein || 0) * multiplier).toFixed(1)),
      carbs: parseFloat(((baseNutrients.carbs || 0) * multiplier).toFixed(1)),
      fat: parseFloat(((baseNutrients.fat || 0) * multiplier).toFixed(1)),
      fiber: parseFloat(((baseNutrients.fiber || 0) * multiplier).toFixed(1)),
      sugar: parseFloat(((baseNutrients.sugar || 0) * multiplier).toFixed(1))
    };
  }
};

// Helper function to extract basic nutrients from food search response
const extractBasicNutrients = (food) => {
  const nutrients = {};
  
  if (food.foodNutrients) {
    // Map nutrient IDs to names
    const nutrientMap = {
      1003: 'protein',
      1004: 'fat',
      1005: 'carbs',
      1008: 'calories',
      1079: 'fiber',
      2000: 'sugar'
    };
    
    // Extract each nutrient value
    food.foodNutrients.forEach(item => {
      const nutrientName = nutrientMap[item.nutrientId];
      if (nutrientName) {
        nutrients[nutrientName] = item.value || 0;
      }
    });
  }
  
  // Default values for missing nutrients
  const defaultNutrients = {
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
    fiber: 0,
    sugar: 0
  };
  
  return {...defaultNutrients, ...nutrients};
};

// Helper function to extract detailed nutrients from food detail response
const extractDetailedNutrients = (food) => {
  const nutrients = {};
  
  if (food.foodNutrients) {
    // Map nutrient numbers or IDs to names
    const nutrientMap = {
      '203': 'protein',
      '204': 'fat',
      '205': 'carbs',
      '208': 'calories',
      '291': 'fiber',
      '269': 'sugar',
      // Also support numeric IDs
      1003: 'protein',
      1004: 'fat',
      1005: 'carbs',
      1008: 'calories',
      1079: 'fiber',
      2000: 'sugar'
    };
    
    // Extract each nutrient value
    food.foodNutrients.forEach(item => {
      const nutrientNo = item.nutrient?.number;
      const nutrientId = item.nutrientId || item.nutrient?.id;
      
      const nutrientName = nutrientMap[nutrientNo] || nutrientMap[nutrientId];
      
      if (nutrientName) {
        nutrients[nutrientName] = item.amount || 0;
      }
    });
  }
  
  // Default values for missing nutrients
  const defaultNutrients = {
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
    fiber: 0,
    sugar: 0
  };
  
  return {...defaultNutrients, ...nutrients};
};

export default foodDataCentralService;

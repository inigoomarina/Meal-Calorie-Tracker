import axios from 'axios';

const API_KEY = import.meta.env.VITE_FDC_API_KEY || 'demo-key';
const BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

const foodDataCentralService = {
  // Search for foods
  searchFoods: async (query) => {
    try {
      const response = await axios.get(`${BASE_URL}/foods/search`, {
        params: {
          api_key: API_KEY,
          query: query,
          pageSize: 15,
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
    } catch (error) {
      console.error('Food search error:', error);
      throw error;
    }
  },
  
  // Get detailed food information by ID
  getFoodDetails: async (fdcId) => {
    try {
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
      throw error;
    }
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

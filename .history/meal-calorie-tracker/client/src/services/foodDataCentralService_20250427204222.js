import axios from 'axios';

// Use the provided API key
const API_KEY = 'QHEvTbjrioIbYiYZTfa8PZeL3VdfxTzJ1sNfiiqi';
const BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

const foodDataCentralService = {
  // Search for foods with autocomplete functionality
  searchFoods: async (query, pageSize = 15) => {
    if (!query || query.trim().length < 2) return [];

    try {
      console.log("Searching foods with query:", query);
      const response = await axios.get(`${BASE_URL}/foods/search`, {
        params: {
          query,
          pageSize,
          dataType: ['Foundation', 'SR Legacy', 'Branded'].join(','),
          api_key: API_KEY
        }
      });

      console.log("API response status:", response.status);
      
      if (!response.data || !response.data.foods || !Array.isArray(response.data.foods)) {
        console.error('Unexpected API response format:', response.data);
        throw new Error('Invalid response from food database');
      }

      // Map the response to a simpler format
      return response.data.foods.map(food => ({
        fdcId: food.fdcId,
        name: food.description,
        brandName: food.brandName || '',
        calories: extractNutrientValue(food, 'Energy'),
        protein: extractNutrientValue(food, 'Protein'),
        carbs: extractNutrientValue(food, 'Carbohydrate, by difference'),
        fat: extractNutrientValue(food, 'Total lipid (fat)'),
        fiber: extractNutrientValue(food, 'Fiber, total dietary'),
        sugar: extractNutrientValue(food, 'Sugars, total including NLEA')
      }));
    } catch (error) {
      console.error('Error searching foods:', error.response ? error.response.data : error.message);
      throw new Error('Failed to search foods: ' + (error.response ? error.response.data.message : error.message));
    }
  },

  // Get detailed food information by FDC ID
  getFoodDetails: async (fdcId) => {
    try {
      console.log("Getting food details for ID:", fdcId);
      const response = await axios.get(`${BASE_URL}/food/${fdcId}`, {
        params: {
          api_key: API_KEY
        }
      });

      const food = response.data;
      
      // Extract detailed nutrient information
      return {
        fdcId: food.fdcId,
        name: food.description,
        brandName: food.brandName || '',
        calories: extractNutrientValue(food, 'Energy'),
        protein: extractNutrientValue(food, 'Protein'),
        carbs: extractNutrientValue(food, 'Carbohydrate, by difference'),
        fat: extractNutrientValue(food, 'Total lipid (fat)'),
        fiber: extractNutrientValue(food, 'Fiber, total dietary'),
        sugar: extractNutrientValue(food, 'Sugars, total including NLEA')
      };
    } catch (error) {
      console.error('Error fetching food details:', error);
      throw error;
    }
  },
  
  // Calculate nutrition based on food and amount in grams
  calculateNutrients: (food, grams) => {
    if (!food) return null;
    
    // Calculate with proper multiplier based on portion size
    const multiplier = grams / 100; // Nutrients are typically per 100g
    
    console.log("Calculating nutrients with multiplier:", multiplier);
    
    // Calculate all nutrients with proper formatting
    return {
      calories: Math.round((food.calories || 0) * multiplier),
      protein: parseFloat(((food.protein || 0) * multiplier).toFixed(1)),
      carbs: parseFloat(((food.carbs || 0) * multiplier).toFixed(1)),
      fat: parseFloat(((food.fat || 0) * multiplier).toFixed(1)),
      fiber: parseFloat(((food.fiber || 0) * multiplier).toFixed(1)),
      sugar: parseFloat(((food.sugar || 0) * multiplier).toFixed(1))
    };
  }
};

// Helper function to extract nutrient values from food data
function extractNutrientValue(food, nutrientName) {
  if (!food || !food.foodNutrients) return 0;
  
  const nutrient = food.foodNutrients.find(n => 
    n.nutrientName === nutrientName || 
    (n.nutrient && n.nutrient.name === nutrientName)
  );
  
  return nutrient ? (nutrient.value || nutrient.amount || 0) : 0;
}

export default foodDataCentralService;

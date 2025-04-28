import axios from 'axios';

const API_KEY = 'abc123def456ghi789'; // Replace this with your actual API key from the email
const BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

const foodDataCentralService = {
  // Search for foods with autocomplete functionality
  searchFoods: async (query, pageSize = 10) => {
    if (!query || query.trim().length < 2) return [];

    try {
      const response = await axios.get(`${BASE_URL}/foods/search`, {
        params: {
          query,
          pageSize,
          dataType: ['Foundation', 'SR Legacy', 'Branded'],
          api_key: API_KEY
        }
      });

      // Map the response to a simpler format
      return response.data.foods.map(food => ({
        fdcId: food.fdcId,
        name: food.description,
        brandName: food.brandName || '',
        calories: food.foodNutrients.find(n => n.nutrientName === 'Energy')?.value || 0,
        nutrients: {
          protein: food.foodNutrients.find(n => n.nutrientName === 'Protein')?.value || 0,
          carbs: food.foodNutrients.find(n => n.nutrientName === 'Carbohydrate, by difference')?.value || 0,
          fat: food.foodNutrients.find(n => n.nutrientName === 'Total lipid (fat)')?.value || 0,
          fiber: food.foodNutrients.find(n => n.nutrientName === 'Fiber, total dietary')?.value || 0,
          sugar: food.foodNutrients.find(n => n.nutrientName === 'Sugars, total including NLEA')?.value || 0
        },
        servingSize: food.servingSize || 100,
        servingSizeUnit: food.servingSizeUnit || 'g'
      }));
    } catch (error) {
      console.error('Error searching foods:', error);
      throw new Error('Failed to search foods');
    }
  },

  // Get detailed food information by FDC ID
  getFoodDetails: async (fdcId) => {
    try {
      const response = await axios.get(`${BASE_URL}/food/${fdcId}`, {
        params: {
          api_key: API_KEY
        }
      });

      const food = response.data;
      
      // Extract nutrients with more detailed information
      const nutrients = food.foodNutrients.reduce((acc, nutrient) => {
        if (nutrient.nutrient) {
          const { name } = nutrient.nutrient;
          
          // Map common nutrient names to our app's structure
          if (name === 'Energy') acc.calories = nutrient.amount || 0;
          else if (name === 'Protein') acc.protein = nutrient.amount || 0;
          else if (name === 'Total lipid (fat)') acc.fat = nutrient.amount || 0;
          else if (name === 'Carbohydrate, by difference') acc.carbs = nutrient.amount || 0;
          else if (name === 'Fiber, total dietary') acc.fiber = nutrient.amount || 0;
          else if (name === 'Sugars, total including NLEA') acc.sugar = nutrient.amount || 0;
        }
        return acc;
      }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 });

      return {
        fdcId: food.fdcId,
        name: food.description,
        brandName: food.brandName || '',
        nutrients,
        servingSize: food.servingSize || 100,
        servingSizeUnit: food.servingSizeUnit || 'g'
      };
    } catch (error) {
      console.error('Error getting food details:', error);
      throw new Error('Failed to get food details');
    }
  },

  // Calculate nutrients based on the amount in grams
  calculateNutrients: (food, grams) => {
    if (!food || !food.nutrients) return null;
    
    const multiplier = grams / 100; // Nutrients are typically per 100g
    
    return {
      calories: Math.round(food.nutrients.calories * multiplier),
      protein: parseFloat((food.nutrients.protein * multiplier).toFixed(1)),
      carbs: parseFloat((food.nutrients.carbs * multiplier).toFixed(1)),
      fat: parseFloat((food.nutrients.fat * multiplier).toFixed(1)),
      fiber: parseFloat((food.nutrients.fiber * multiplier).toFixed(1)),
      sugar: parseFloat((food.nutrients.sugar * multiplier).toFixed(1))
    };
  }
};

export default foodDataCentralService;

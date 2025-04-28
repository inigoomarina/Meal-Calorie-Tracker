import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import mealService from '../services/mealService';
import foodDataCentralService from '../services/foodDataCentralService';
import debounce from 'lodash.debounce';

const LogMeal = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  const [grams, setGrams] = useState(100);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const navigate = useNavigate();

  // Handle clicks outside of suggestions to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Debounce search to prevent too many API calls
  const debouncedSearch = useCallback(
    debounce(async (query) => {
      if (query.length < 2) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const results = await foodDataCentralService.searchFoods(query);
        setSearchResults(results);
        setShowSuggestions(true);
      } catch (err) {
        console.error('Food search error:', err);
        setError('Failed to search for foods. Please try again.');
      } finally {
        setIsSearching(false);
      }
    }, 500),
    []
  );

  // Handle input change for search query
  const handleSearchInputChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setError('');
    
    if (query.length >= 2) {
      debouncedSearch(query);
    } else {
      setSearchResults([]);
      setShowSuggestions(false);
    }
  };

  // Handle selection of a food item from suggestions
  const handleFoodSelect = async (food) => {
    setSearchQuery(food.name);
    setShowSuggestions(false);
    setIsSearching(true);
    
    try {
      // Get detailed nutrition information
      const detailedFood = await foodDataCentralService.getFoodDetails(food.fdcId);
      setSelectedFood(detailedFood);
      setGrams(100); // Reset to default 100g when selecting a new food
    } catch (err) {
      console.error('Error getting food details:', err);
      setError('Failed to load food details. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Handle gram amount change
  const handleGramChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setGrams(value);
    }
  };

  // Calculate nutrition based on selected food and grams
  const calculateNutrients = () => {
    if (!selectedFood) return null;
    return foodDataCentralService.calculateNutrients(selectedFood, grams);
  };

  // Handle form submission to log the meal
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFood) {
      setError('Please select a food to log');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Use current date and time
      const currentDateTime = new Date().toISOString();
      
      const nutrients = calculateNutrients();
      console.log("Calculated nutrients for meal:", nutrients);
      
      if (!nutrients) {
        throw new Error("Failed to calculate nutrients");
      }
      
      // Make sure all nutrient values are numbers and properly formatted
      const mealData = {
        name: selectedFood.name,
        portion: grams / 100, // Store portion as a multiplier of 100g
        calories: Math.round(nutrients.calories) || 0,
        nutrition: {
          protein: parseFloat(nutrients.protein) || 0,
          carbs: parseFloat(nutrients.carbs) || 0,
          fat: parseFloat(nutrients.fat) || 0,
          fiber: parseFloat(nutrients.fiber) || 0,
          sugar: parseFloat(nutrients.sugar) || 0
        },
        time: currentDateTime,
        foodId: selectedFood.fdcId?.toString() || ""
      };

      console.log("Submitting meal data:", JSON.stringify(mealData, null, 2));
      const savedMeal = await mealService.createMeal(mealData);
      console.log("Meal saved successfully:", savedMeal);
      
      // Navigate to dashboard and trigger refresh
      navigate('/dashboard?refresh=true');
    } catch (err) {
      console.error('Failed to log meal:', err);
      setError('Failed to log meal. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="log-meal-container">
      <h1>Log a Meal</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="food-search-section">
        <div className="form-group search-form">
          <label htmlFor="searchQuery">Search for a food:</label>
          <div className="search-input-container">
            <input
              type="text"
              id="searchQuery"
              value={searchQuery}
              onChange={handleSearchInputChange}
              placeholder="Type at least 2 characters (e.g., ch for chicken)"
              ref={searchInputRef}
              autoComplete="off"
              className="autocomplete-input"
            />
            {isSearching && <div className="search-spinner"></div>}
          </div>

          {/* Autocomplete Suggestions */}
          {showSuggestions && searchResults.length > 0 && (
            <div className="suggestions-dropdown" ref={suggestionsRef}>
              {searchResults.map((food) => (
                <div 
                  key={food.fdcId} 
                  className="suggestion-item"
                  onClick={() => handleFoodSelect(food)}
                >
                  <div className="suggestion-name">{food.name}</div>
                  {food.brandName && <div className="suggestion-brand">{food.brandName}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isSearching && (
        <div className="loading">Fetching food data...</div>
      )}

      {selectedFood && (
        <div className="meal-details-section">
          <h2>Meal Details: {selectedFood.name}</h2>
          {selectedFood.brandName && <p className="brand-name">{selectedFood.brandName}</p>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="grams">Amount (grams)</label>
              <div className="gram-control">
                <input
                  type="range"
                  id="gram-slider"
                  min="5"
                  max="500"
                  step="5"
                  value={grams}
                  onChange={handleGramChange}
                />
                <input
                  type="number"
                  id="grams"
                  value={grams}
                  onChange={handleGramChange}
                  min="5"
                  required
                />
                <span className="gram-unit">g</span>
              </div>
            </div>

            <div className="nutrition-info">
              <h3>Nutrition Information (per {grams}g)</h3>
              <div className="nutrition-grid">
                <div className="nutrition-item">
                  <span className="label">Calories</span>
                  <span className="value">{calculateNutrients()?.calories || 0}</span>
                </div>
                <div className="nutrition-item">
                  <span className="label">Protein</span>
                  <span className="value">{calculateNutrients()?.protein || 0}g</span>
                </div>
                <div className="nutrition-item">
                  <span className="label">Carbs</span>
                  <span className="value">{calculateNutrients()?.carbs || 0}g</span>
                </div>
                <div className="nutrition-item">
                  <span className="label">Fat</span>
                  <span className="value">{calculateNutrients()?.fat || 0}g</span>
                </div>
                <div className="nutrition-item">
                  <span className="label">Fiber</span>
                  <span className="value">{calculateNutrients()?.fiber || 0}g</span>
                </div>
                <div className="nutrition-item">
                  <span className="label">Sugar</span>
                  <span className="value">{calculateNutrients()?.sugar || 0}g</span>
                </div>
              </div>
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Logging...' : 'Log Meal'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default LogMeal;
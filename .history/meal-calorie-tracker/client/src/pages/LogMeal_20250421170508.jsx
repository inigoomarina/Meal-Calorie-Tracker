import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import mealService from '../services/mealService';

const LogMeal = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  const [portion, setPortion] = useState(1);
  const [mealTime, setMealTime] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Set default time to now
  useState(() => {
    const now = new Date();
    const timeString = now.toTimeString().slice(0, 5); // Format: "HH:MM"
    setMealTime(timeString);
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError('');
    setSearchResults([]);

    try {
      const results = await mealService.searchFood(searchQuery);
      setSearchResults(results);
      if (results.length === 0) {
        setError('No foods found. Try another search term.');
      }
    } catch (err) {
      console.error('Food search error:', err);
      setError('Failed to search for foods. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleFoodSelect = (food) => {
    setSelectedFood(food);
    setPortion(1); // Reset portion to 1 when selecting a new food
  };

  const handlePortionChange = (e) => {
    const newPortion = parseFloat(e.target.value);
    if (newPortion > 0) {
      setPortion(newPortion);
    }
  };

  const calculateNutrients = () => {
    if (!selectedFood) return null;

    return {
      calories: Math.round(selectedFood.calories * portion),
      protein: Math.round(selectedFood.nutrients.protein * portion),
      carbs: Math.round(selectedFood.nutrients.carbs * portion),
      fat: Math.round(selectedFood.nutrients.fat * portion),
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFood) {
      setError('Please select a food to log');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Format date and time
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const dateTime = `${today}T${mealTime}:00`;

      const mealData = {
        name: selectedFood.name,
        portion: portion,
        calories: calculateNutrients().calories,
        nutrition: {
          protein: calculateNutrients().protein,
          carbs: calculateNutrients().carbs,
          fat: calculateNutrients().fat,
        },
        time: dateTime,
        foodId: selectedFood.foodId, // Store the food ID for future reference
      };

      await mealService.createMeal(mealData);
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to log meal:', err);
      setError('Failed to log meal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="log-meal-container">
      <h1>Log a Meal</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="food-search-section">
        <form onSubmit={handleSearch} className="search-form">
          <div className="form-group">
            <label htmlFor="searchQuery">Search for a food:</label>
            <div className="search-input-container">
              <input
                type="text"
                id="searchQuery"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g., chicken, apple, rice"
                required
              />
              <button type="submit" className="btn" disabled={isSearching}>
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>
        </form>
        
        {isSearching ? (
          <div className="loading">Searching for foods...</div>
        ) : (
          searchResults.length > 0 && (
            <div className="search-results">
              <h3>Search Results</h3>
              <ul className="food-list">
                {searchResults.map((food) => (
                  <li
                    key={food.foodId}
                    className={`food-item ${selectedFood?.foodId === food.foodId ? 'selected' : ''}`}
                    onClick={() => handleFoodSelect(food)}
                  >
                    <div className="food-details">
                      <h4>{food.name}</h4>
                      <p>{food.calories} calories per serving</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )
        )}
      </div>

      {selectedFood && (
        <div className="meal-details-section">
          <h2>Meal Details</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="foodName">Food</label>
              <input
                type="text"
                id="foodName"
                value={selectedFood.name}
                readOnly
                className="readonly"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="portion">Portion Size</label>
              <input
                type="number"
                id="portion"
                value={portion}
                onChange={handlePortionChange}
                min="0.25"
                step="0.25"
                required
              />
              <span className="portion-unit">serving(s)</span>
            </div>

            <div className="form-group">
              <label htmlFor="mealTime">Time</label>
              <input
                type="time"
                id="mealTime"
                value={mealTime}
                onChange={(e) => setMealTime(e.target.value)}
                required
              />
            </div>

            <div className="nutrition-info">
              <h3>Nutrition Information</h3>
              <div className="nutrition-grid">
                <div className="nutrition-item">
                  <span className="label">Calories</span>
                  <span className="value">{calculateNutrients().calories}</span>
                </div>
                <div className="nutrition-item">
                  <span className="label">Protein</span>
                  <span className="value">{calculateNutrients().protein}g</span>
                </div>
                <div className="nutrition-item">
                  <span className="label">Carbs</span>
                  <span className="value">{calculateNutrients().carbs}g</span>
                </div>
                <div className="nutrition-item">
                  <span className="label">Fat</span>
                  <span className="value">{calculateNutrients().fat}g</span>
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
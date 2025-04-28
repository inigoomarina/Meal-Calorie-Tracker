import { useState, useEffect } from 'react';
import { Modal } from '../components/Modal'; // Create a reusable modal component

const MealHistory = () => {
  const [mealHistory, setMealHistory] = useState([]);
  const [selectedMeal, setSelectedMeal] = useState(null);

  useEffect(() => {
    const fetchMealHistory = async () => {
      try {
        const response = await api.get('/meals/history');
        setMealHistory(response.data);
      } catch (error) {
        console.error('Error fetching meal history:', error);
      }
    };

    fetchMealHistory();
  }, []);

  const openMealDetails = (meal) => {
    setSelectedMeal(meal);
  };

  const closeMealDetails = () => {
    setSelectedMeal(null);
  };

  return (
    <div className="meal-history">
      <h2>Meal History</h2>
      <div className="meal-grid">
        {mealHistory.map((meal) => (
          <div key={meal.date} className="meal-card">
            <h3>{meal.date}</h3>
            <p>Total Calories: {meal.totalCalories} kcal</p>
            <p>
              {meal.totalCalories > meal.calorieGoal
                ? 'Over Goal'
                : 'Under Goal'}
            </p>
            <button onClick={() => openMealDetails(meal)}>View Details</button>
          </div>
        ))}
      </div>
      {selectedMeal && (
        <Modal onClose={closeMealDetails}>
          <h3>Meal Details for {selectedMeal.date}</h3>
          <p>Total Calories: {selectedMeal.totalCalories} kcal</p>
          <p>Protein: {selectedMeal.protein} g</p>
          <p>Carbs: {selectedMeal.carbs} g</p>
          <p>Fat: {selectedMeal.fat} g</p>
        </Modal>
      )}
    </div>
  );
};

export default MealHistory;
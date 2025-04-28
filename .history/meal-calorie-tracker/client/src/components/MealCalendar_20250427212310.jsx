import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import './MealCalendar.css'; // We'll create this CSS file

const MealCalendar = ({ meals, onDeleteMeal }) => {
  const { user } = useContext(AuthContext);
  const calorieGoal = user?.calorieGoal || 2000; // Get goal from context

  // Group meals by date (YYYY-MM-DD)
  const mealsByDate = meals.reduce((acc, meal) => {
    const date = new Date(meal.date || meal.time).toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = { meals: [], totalCalories: 0 };
    }
    acc[date].meals.push(meal);
    acc[date].totalCalories += meal.calories || 0;
    return acc;
  }, {});

  // Sort dates descending (most recent first)
  const sortedDates = Object.keys(mealsByDate).sort((a, b) => new Date(b) - new Date(a));

  const formatDate = (dateString) => {
    const date = new Date(dateString + 'T00:00:00'); // Ensure correct date parsing
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  };

  return (
    <div className="meal-calendar-container">
      {sortedDates.length === 0 && <p>No meals found for the selected period.</p>}
      
      {sortedDates.map(date => {
        const dayData = mealsByDate[date];
        const totalCalories = Math.round(dayData.totalCalories);
        const overUnder = totalCalories - calorieGoal;
        const goalStatus = overUnder > 0 
          ? `Over goal by ${Math.round(overUnder)} cal` 
          : `Under goal by ${Math.round(Math.abs(overUnder))} cal`;
        const statusClass = overUnder > 0 ? 'over-goal' : 'under-goal';

        return (
          <div key={date} className="day-card">
            <div className="day-header">
              <h2>{formatDate(date)}</h2>
              <div className={`day-summary ${statusClass}`}>
                <span>Total: {totalCalories} cal</span>
                <span>({goalStatus})</span>
              </div>
            </div>
            <div className="meals-list">
              {dayData.meals.map(meal => (
                <div key={meal._id} className="meal-item">
                  <span className="meal-name">{meal.name}</span>
                  <span className="meal-calories">{Math.round(meal.calories || 0)} cal</span>
                  <button 
                    onClick={() => onDeleteMeal(meal._id)} 
                    className="btn-delete-meal"
                    title="Delete Meal"
                  >
                    &times; {/* Simple delete icon */}
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MealCalendar;

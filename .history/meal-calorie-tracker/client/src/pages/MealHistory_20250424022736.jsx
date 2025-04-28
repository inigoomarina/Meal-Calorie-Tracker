import React, { useState, useEffect } from 'react';
import mealService from '../services/mealService';
import './MealHistory.css'; // Assuming you'll create a CSS file for styling

// Helper to get date strings in YYYY-MM-DD format
const getISODateString = (date) => {
  return date.toISOString().split('T')[0];
};

const MealHistory = () => {
  const [historyData, setHistoryData] = useState({}); // Store as object: { "YYYY-MM-DD": data }
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Default to the last 7 days
  const today = new Date();
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(today.getDate() - 6); // Inclusive of today

  const [startDate, setStartDate] = useState(getISODateString(oneWeekAgo));
  const [endDate, setEndDate] = useState(getISODateString(today));

  const loadHistoryData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await mealService.getMealHistory(startDate, endDate);
      // Convert array to object if API returns array, otherwise use directly
      if (Array.isArray(data)) {
        const dataObject = data.reduce((acc, day) => {
          acc[day.date] = day;
          return acc;
        }, {});
        setHistoryData(dataObject);
      } else {
        setHistoryData(data || {}); // Ensure it's an object
      }
    } catch (err) {
      console.error('Failed to load meal history:', err);
      setError('Failed to load meal history. Please try again.');
      setHistoryData({}); // Clear data on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistoryData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Load on initial mount

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    loadHistoryData();
  };

  // Get sorted dates from the history data keys
  const sortedDates = Object.keys(historyData).sort((a, b) => new Date(b) - new Date(a));

  return (
    <div className="meal-history-container">
      <h1>Meal History</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleFilterSubmit} className="filter-form history-filter">
        <div className="date-range-container">
          <div className="form-group">
            <label htmlFor="startDate">Start Date</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="endDate">End Date</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
        </div>
        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Load History'}
        </button>
      </form>

      {isLoading ? (
        <div className="loading">Loading history...</div>
      ) : sortedDates.length > 0 ? (
        <div className="history-grid">
          {sortedDates.map(date => {
            const dayData = historyData[date];
            const displayDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { // Adjust for timezone display
              weekday: 'short', month: 'short', day: 'numeric' 
            });
            return (
              <div key={date} className="history-day-card card">
                <h3>{displayDate}</h3>
                <div className="day-summary">
                  <p><strong>Calories:</strong> {Math.round(dayData.calories || 0)} cal</p>
                  <p className="day-macros">
                    <strong>Macros:</strong> 
                    P: {Math.round(dayData.protein || 0)}g • 
                    C: {Math.round(dayData.carbs || 0)}g • 
                    F: {Math.round(dayData.fat || 0)}g
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="no-data">
          <p>No meal history found for the selected date range.</p>
        </div>
      )}
    </div>
  );
};

export default MealHistory;
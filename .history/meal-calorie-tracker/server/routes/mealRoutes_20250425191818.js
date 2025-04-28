const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// Import controller functions
const { 
  getMeals,
  getMeal,
  createMeal,
  updateMeal,
  deleteMeal,
  searchFood,
  getDailySummary,
  getWeeklyStats,
  getMealHistory
} = require('../controllers/mealController');

// All meal routes are protected
router.use(protect);

// Route definitions
router.route('/')
  .get(getMeals)
  .post(createMeal);

router.route('/search')
  .get(searchFood);

router.route('/summary')
  .get(getDailySummary);

router.route('/weekly-stats')
  .get(getWeeklyStats);

router.route('/history')
  .get(getMealHistory);

router.route('/:id')
  .get(getMeal)
  .put(updateMeal)
  .delete(deleteMeal);

module.exports = router;

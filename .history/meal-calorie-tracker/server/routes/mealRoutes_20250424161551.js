const express = require('express');
const { 
  getMeals, 
  getMeal, 
  createMeal, 
  updateMeal, 
  deleteMeal,
  getMealSummary,
  getWeeklyStats
} = require('../controllers/mealController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// Define specialized routes first (before parameterized routes)
router.get('/summary', getMealSummary);
router.get('/weekly-stats', getWeeklyStats);
router.get('/history', getMeals); // If you have a history endpoint

// Define standard CRUD routes
router.route('/')
  .get(getMeals)
  .post(createMeal);

router.route('/:id')
  .get(getMeal)
  .put(updateMeal)
  .delete(deleteMeal);

module.exports = router;

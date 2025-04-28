const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// Import controller functions (to be implemented)
// These will need to be created in a mealController.js file
const { 
  getMeals,
  getMeal,
  createMeal,
  updateMeal,
  deleteMeal
} = require('../controllers/mealController');

// All meal routes are protected
router.use(protect);

// Route definitions
router.route('/')
  .get(getMeals)
  .post(createMeal);

router.route('/:id')
  .get(getMeal)
  .put(updateMeal)
  .delete(deleteMeal);

module.exports = router;

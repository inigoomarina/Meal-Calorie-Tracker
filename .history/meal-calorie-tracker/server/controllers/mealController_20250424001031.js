const Meal = require('../models/Meal');

// @desc    Get all meals for logged in user
// @route   GET /api/meals
// @access  Private
exports.getMeals = async (req, res, next) => {
  try {
    const meals = await Meal.find({ user: req.user.id }).sort({ date: -1 });
    res.status(200).json(meals);
  } catch (err) {
    next(err);
  }
};

// @desc    Get single meal by ID
// @route   GET /api/meals/:id
// @access  Private
exports.getMeal = async (req, res, next) => {
  try {
    const meal = await Meal.findById(req.params.id);
    
    if (!meal) {
      return res.status(404).json({ message: 'Meal not found' });
    }

    // Make sure user owns the meal
    if (meal.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to access this meal' });
    }
    
    res.status(200).json(meal);
  } catch (err) {
    next(err);
  }
};

// @desc    Create a new meal
// @route   POST /api/meals
// @access  Private
exports.createMeal = async (req, res, next) => {
  try {
    req.body.user = req.user.id;
    const meal = await Meal.create(req.body);
    res.status(201).json(meal);
  } catch (err) {
    next(err);
  }
};

// @desc    Update meal
// @route   PUT /api/meals/:id
// @access  Private
exports.updateMeal = async (req, res, next) => {
  try {
    let meal = await Meal.findById(req.params.id);
    
    if (!meal) {
      return res.status(404).json({ message: 'Meal not found' });
    }
    
    // Make sure user owns the meal
    if (meal.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this meal' });
    }
    
    meal = await Meal.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json(meal);
  } catch (err) {
    next(err);
  }
};

// @desc    Delete meal
// @route   DELETE /api/meals/:id
// @access  Private
exports.deleteMeal = async (req, res, next) => {
  try {
    const meal = await Meal.findById(req.params.id);
    
    if (!meal) {
      return res.status(404).json({ message: 'Meal not found' });
    }
    
    // Make sure user owns the meal
    if (meal.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this meal' });
    }
    
    await meal.deleteOne();
    
    res.status(200).json({ message: 'Meal removed' });
  } catch (err) {
    next(err);
  }
};

// @desc    Search for food using USDA FoodData Central API
// @route   GET /api/meals/search
// @access  Private
exports.searchFood = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters long' });
    }

    // Proxy the request to the FoodData Central API
    // In a real implementation, you would use your server-side API key and call directly
    res.status(200).json({ message: 'Use client-side implementation' });
  } catch (err) {
    next(err);
  }
};

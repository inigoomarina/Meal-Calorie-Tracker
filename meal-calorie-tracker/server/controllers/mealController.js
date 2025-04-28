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

// @desc    Get daily calorie and macronutrient summary for a specific date
// @route   GET /api/meals/summary
// @access  Private
exports.getDailySummary = async (req, res, next) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ message: 'Date parameter is required' });
    }
    
    // Create start and end of the specified day
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    // Find all meals for the user on the specified date
    const meals = await Meal.find({
      user: req.user.id,
      date: { $gte: startDate, $lte: endDate }
    });
    
    // Calculate summary totals
    const summary = meals.reduce((totals, meal) => {
      return {
        totalCalories: totals.totalCalories + (meal.calories || 0),
        totalProtein: totals.totalProtein + (meal.protein || 0),
        totalCarbs: totals.totalCarbs + (meal.carbs || 0),
        totalFat: totals.totalFat + (meal.fat || 0)
      };
    }, { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 });
    
    res.status(200).json(summary);
  } catch (err) {
    next(err);
  }
};

// @desc    Get weekly nutrition statistics
// @route   GET /api/meals/weekly-stats
// @access  Private
exports.getWeeklyStats = async (req, res, next) => {
  try {
    // Calculate date 7 days ago from today
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 6); // Get 7 days including today
    weekAgo.setHours(0, 0, 0, 0);
    
    // Find all meals for the user in the past week
    const meals = await Meal.find({
      user: req.user.id,
      date: { $gte: weekAgo, $lte: today }
    }).sort({ date: 1 });
    
    // Initialize data structure for the past 7 days
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dailyData = {};
    
    // Initialize the dailyData object with all days in the past week
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekAgo);
      date.setDate(date.getDate() + i);
      const dayKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      const dayName = dayNames[date.getDay()];
      
      dailyData[dayKey] = {
        dayName,
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      };
    }
    
    // Aggregate meal data by day
    meals.forEach(meal => {
      const mealDate = new Date(meal.date || meal.createdAt);
      const dayKey = mealDate.toISOString().split('T')[0];
      
      if (dailyData[dayKey]) {
        dailyData[dayKey].calories += meal.calories || 0;
        dailyData[dayKey].protein += meal.protein || 0;
        dailyData[dayKey].carbs += meal.carbs || 0;
        dailyData[dayKey].fat += meal.fat || 0;
      }
    });
    
    // Convert to arrays for the frontend
    const result = {
      days: [],
      calories: [],
      proteins: [],
      carbs: [],
      fats: []
    };
    
    Object.keys(dailyData)
      .sort() // Ensure days are in chronological order
      .forEach(dayKey => {
        result.days.push(dailyData[dayKey].dayName);
        result.calories.push(Math.round(dailyData[dayKey].calories));
        result.proteins.push(Math.round(dailyData[dayKey].protein));
        result.carbs.push(Math.round(dailyData[dayKey].carbs));
        result.fats.push(Math.round(dailyData[dayKey].fat));
      });
    
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

// @desc    Get meal history for a date range
// @route   GET /api/meals/history
// @access  Private
exports.getMealHistory = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Both startDate and endDate are required' });
    }
    
    // Create date range
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    // Find all meals within the date range
    const meals = await Meal.find({
      user: req.user.id,
      date: { $gte: start, $lte: end }
    }).sort({ date: -1 });
    
    res.status(200).json(meals);
  } catch (err) {
    next(err);
  }
};

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

// @desc    Get meal summary for a specific date
// @route   GET /api/meals/summary
// @access  Private
exports.getMealSummary = async (req, res, next) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ message: 'Please provide a date' });
    }
    
    // Create date range for the provided date (entire day)
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    // Aggregate meals for the date
    const summary = await Meal.aggregate([
      {
        $match: {
          user: req.user._id,
          time: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalCalories: { $sum: '$calories' },
          totalProtein: { $sum: { $ifNull: ['$nutrition.protein', '$protein', 0] } },
          totalCarbs: { $sum: { $ifNull: ['$nutrition.carbs', '$carbs', 0] } },
          totalFat: { $sum: { $ifNull: ['$nutrition.fat', '$fat', 0] } },
          mealCount: { $sum: 1 }
        }
      }
    ]);
    
    if (summary.length === 0) {
      return res.status(200).json({
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        mealCount: 0
      });
    }
    
    res.status(200).json(summary[0]);
  } catch (err) {
    next(err);
  }
};

// @desc    Get weekly stats for meals
// @route   GET /api/meals/weekly-stats
// @access  Private
exports.getWeeklyStats = async (req, res, next) => {
  try {
    // Get today's date
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    // Get date 7 days ago
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 6);
    weekAgo.setHours(0, 0, 0, 0);
    
    // Find meals within the date range
    const meals = await Meal.find({
      user: req.user._id,
      time: { $gte: weekAgo, $lte: today }
    }).sort('time');
    
    // Process meals to group by day
    const dailyData = {};
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
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
      const mealDate = new Date(meal.time || meal.createdAt);
      const dayKey = mealDate.toISOString().split('T')[0];
      
      if (dailyData[dayKey]) {
        dailyData[dayKey].calories += meal.calories || 0;
        dailyData[dayKey].protein += parseFloat(meal.nutrition?.protein || meal.protein || 0);
        dailyData[dayKey].carbs += parseFloat(meal.nutrition?.carbs || meal.carbs || 0);
        dailyData[dayKey].fat += parseFloat(meal.nutrition?.fat || meal.fat || 0);
      }
    });
    
    // Convert to arrays for chart rendering
    const result = {
      days: [],
      calories: [],
      proteins: [],
      carbs: [],
      fats: []
    };
    
    // Sort by date and populate result arrays
    Object.keys(dailyData).sort().forEach(dayKey => {
      const day = dailyData[dayKey];
      result.days.push(day.dayName);
      result.calories.push(Math.round(day.calories));
      result.proteins.push(parseFloat(day.protein.toFixed(1)));
      result.carbs.push(parseFloat(day.carbs.toFixed(1)));
      result.fats.push(parseFloat(day.fat.toFixed(1)));
    });
    
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

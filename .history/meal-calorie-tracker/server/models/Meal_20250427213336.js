const mongoose = require('mongoose');

const MealSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a meal name'],
      trim: true,
      maxlength: [100, 'Name cannot be more than 100 characters'],
    },
    calories: {
      type: Number,
      required: [true, 'Please add calories'],
      min: [0, 'Calories cannot be negative']
    },
    // 'date' can represent the day the meal belongs to
    date: {
      type: Date,
      default: Date.now,
      required: true
    },
    // 'time' can represent the specific time the meal was logged/eaten
    time: {
      type: Date,
      default: Date.now,
      required: true
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot be more than 500 characters'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
    // Keep individual fields for potential direct queries/indexing
    protein: { type: Number, min: 0 },
    carbs: { type: Number, min: 0 },
    fat: { type: Number, min: 0 },
    fiber: { type: Number, min: 0 },
    sugar: { type: Number, min: 0 },
    // Add the nested nutrition object
    nutrition: {
      protein: { type: Number, min: 0 },
      carbs: { type: Number, min: 0 },
      fat: { type: Number, min: 0 },
      fiber: { type: Number, min: 0 },
      sugar: { type: Number, min: 0 },
    },
    mealType: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner', 'snack', 'other'], // Added 'other'
      default: 'other'
    },
    portion: { // Store the portion multiplier (e.g., 1 for 100g, 1.5 for 150g)
      type: Number,
      default: 1,
      min: 0
    },
    foodId: { // Store the FDC ID if sourced from USDA
      type: String,
      trim: true
    }
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// Ensure 'date' and 'time' are properly indexed if frequently queried
MealSchema.index({ user: 1, date: -1 });
MealSchema.index({ user: 1, time: -1 });


module.exports = mongoose.model('Meal', MealSchema);
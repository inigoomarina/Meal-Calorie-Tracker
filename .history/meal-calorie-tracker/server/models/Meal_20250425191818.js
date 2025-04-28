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
    },
    date: {
      type: Date,
      default: Date.now,
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
    // Optional additional nutrition information
    carbs: {
      type: Number,
    },
    protein: {
      type: Number,
    },
    fat: {
      type: Number,
    },
    mealType: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner', 'snack'],
    },
    // Add time field for more precise tracking
    time: {
      type: Date,
      default: Date.now,
    },
    // Store nutrition data in a structured object as well
    nutrition: {
      protein: Number,
      carbs: Number,
      fat: Number,
      fiber: Number,
      sugar: Number
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Meal', MealSchema);
const mongoose = require('mongoose');

const MealSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Please add a meal name'],
      trim: true,
      maxlength: [100, 'Meal name cannot be more than 100 characters'],
    },
    calories: {
      type: Number,
      required: [true, 'Please add calorie content'],
      min: [0, 'Calories cannot be negative'],
    },
    portion: {
      type: Number,
      required: [true, 'Please specify portion size'],
      default: 1,
      min: [0.1, 'Portion size must be at least 0.1'],
    },
    nutrition: {
      protein: {
        type: Number,
        default: 0,
      },
      carbs: {
        type: Number,
        default: 0,
      },
      fat: {
        type: Number,
        default: 0,
      },
      fiber: {
        type: Number,
        default: 0,
      },
      sugar: {
        type: Number,
        default: 0,
      },
      sodium: {
        type: Number,
        default: 0,
      },
    },
    time: {
      type: Date,
      default: Date.now,
      required: true,
    },
    foodId: {
      type: String, // Store Edamam Food ID for reference
    },
    category: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner', 'snack'],
    },
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot be more than 500 characters'],
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Create a compound index on user and time for efficient queries by date
MealSchema.index({ user: 1, time: -1 });

module.exports = mongoose.model('Meal', MealSchema);
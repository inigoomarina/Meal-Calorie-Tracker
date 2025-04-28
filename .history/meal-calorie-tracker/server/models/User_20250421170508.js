const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true,
      maxlength: [50, 'Name cannot be more than 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password in queries
    },
    calorieGoal: {
      type: Number,
      default: 2000,
    },
    weight: {
      type: Number,
    },
    height: {
      type: Number,
    },
    activityLevel: {
      type: String,
      enum: ['sedentary', 'light', 'moderate', 'active', 'very-active'],
      default: 'moderate',
    },
    goalType: {
      type: String,
      enum: ['lose', 'maintain', 'gain'],
      default: 'maintain',
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Encrypt password using bcrypt
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Calculate daily calorie needs based on user metrics
UserSchema.methods.calculateCalorieNeeds = function () {
  // If we don't have all the necessary data, return the default goal
  if (!this.weight || !this.height) {
    return this.calorieGoal;
  }

  // Harris-Benedict BMR Formula
  const isMale = this.gender === 'male';
  
  // Base Metabolic Rate calculation
  let bmr;
  if (isMale) {
    bmr = 88.362 + (13.397 * this.weight) + (4.799 * this.height) - (5.677 * this.age);
  } else {
    bmr = 447.593 + (9.247 * this.weight) + (3.098 * this.height) - (4.330 * this.age);
  }

  // Activity level multiplier
  const activityMultipliers = {
    'sedentary': 1.2,
    'light': 1.375,
    'moderate': 1.55,
    'active': 1.725,
    'very-active': 1.9
  };
  
  // Total daily energy expenditure
  const tdee = bmr * activityMultipliers[this.activityLevel];

  // Adjust based on goal
  const goalAdjustments = {
    'lose': -500, // 500 calorie deficit for weight loss
    'maintain': 0,
    'gain': 500 // 500 calorie surplus for weight gain
  };

  return Math.round(tdee + goalAdjustments[this.goalType]);
};

module.exports = mongoose.model('User', UserSchema);
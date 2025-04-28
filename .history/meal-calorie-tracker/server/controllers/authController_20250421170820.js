const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password, // Password will be hashed via middleware in the User model
    });

    // Generate JWT token
    const token = user.getSignedJwtToken();

    // Send response with token and user data
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        calorieGoal: user.calorieGoal,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Check for user (explicitly select password field)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = user.getSignedJwtToken();

    // Send response with token and user data
    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        calorieGoal: user.calorieGoal,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getCurrentUser = async (req, res, next) => {
  try {
    // user is already available in req due to the protect middleware
    const user = await User.findById(req.user.id);

    res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      calorieGoal: user.calorieGoal,
      weight: user.weight,
      height: user.height,
      activityLevel: user.activityLevel,
      goalType: user.goalType,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, email, weight, height, activityLevel, goalType, calorieGoal } = req.body;

    // Build update object with only provided fields
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (weight) updateData.weight = weight;
    if (height) updateData.height = height;
    if (activityLevel) updateData.activityLevel = activityLevel;
    if (goalType) updateData.goalType = goalType;
    if (calorieGoal) updateData.calorieGoal = calorieGoal;

    // Update user
    const user = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      calorieGoal: user.calorieGoal,
      weight: user.weight,
      height: user.height,
      activityLevel: user.activityLevel,
      goalType: user.goalType,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update password
// @route   PUT /api/auth/password
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Please provide current and new password' });
    }

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Return success message
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
};
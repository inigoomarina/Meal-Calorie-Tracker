const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({ 
      message: 'Validation Error', 
      errors: errors 
    });
  }
  
  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({ 
      message: `${field.charAt(0).toUpperCase() + field.slice(1)} is already taken` 
    });
  }
  
  // JWT authentication error
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Invalid token' });
  }
  
  // JWT expired error
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Token has expired' });
  }
  
  // Default to 500 server error
  res.status(err.statusCode || 500).json({
    message: err.message || 'Internal Server Error'
  });
};

module.exports = errorHandler;
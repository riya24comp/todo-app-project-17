const jwt = require('jsonwebtoken');
const User = require('../../database/models/User');

/**
 * Middleware to protect routes and verify JWT tokens
 */
const protect = async (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization;

  // 1. Check for Bearer token format in Authorization header
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  // 2. Reject missing tokens
  if (!token) {
    return res.status(401).json({
      message: 'Not authorized, token missing'
    });
  }

  try {
    // 3. Verify JWT signature and expiration
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Fetch the current user from MongoDB by ID from token payload
    // Exclude password_hash to ensure security
    const user = await User.findById(decoded.id).select('-password_hash');

    // 5. Reject if user no longer exists or was deleted
    if (!user) {
      return res.status(401).json({
        message: 'Not authorized, user not found'
      });
    }

    // 6. Attach fresh authenticated user object to the request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Not authorized, token expired'
      });
    }

    return res.status(401).json({
      message: 'Not authorized, invalid token'
    });
  }
};

module.exports = { protect };

/**
 * Middleware to enforce administrator role-based access control (RBAC).
 * Must be preceded by the protect (JWT authentication) middleware.
 */
const admin = (req, res, next) => {
  // Verify that the request has an authenticated user and their verified role is 'admin'
  if (req.user && req.user.role === 'admin') {
    return next();
  }

  // Reject normal users with HTTP 403 Forbidden
  return res.status(403).json({
    message: 'Access denied: Administrator privileges required'
  });
};

module.exports = { admin };

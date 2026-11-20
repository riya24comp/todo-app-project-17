const User = require('../../database/models/User');
const Task = require('../../database/models/Task');

/**
 * @desc    Get all registered users (Admin only)
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
const getAllUsers = async (req, res, next) => {
  try {
    // Retrieve all users strictly excluding password_hash
    const users = await User.find()
      .select('-password_hash')
      .sort({ created_at: -1 });

    return res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all tasks across all users (Admin only)
 * @route   GET /api/admin/tasks
 * @access  Private/Admin
 */
const getAllTasks = async (req, res, next) => {
  try {
    // Retrieve tasks across all users, populating safe owner information
    const tasks = await Task.find()
      .populate('user_id', 'name email role')
      .sort({ created_at: -1 });

    return res.status(200).json(tasks);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getAllTasks
};

const mongoose = require('mongoose');
const Task = require('../models/Task');

const ALLOWED_STATUSES = ['pending', 'in-progress', 'completed'];
const ALLOWED_PRIORITIES = ['low', 'medium', 'high'];

/**
 * @desc    Get all tasks for the authenticated user
 * @route   GET /api/tasks
 * @access  Private
 */
const getTasks = async (req, res, next) => {
  try {
    const query = { user_id: req.user._id };

    // Optional status filter
    if (req.query.status) {
      if (!ALLOWED_STATUSES.includes(req.query.status)) {
        return res.status(400).json({
          message: `Invalid status filter. Allowed values: ${ALLOWED_STATUSES.join(', ')}`
        });
      }
      query.status = req.query.status;
    }

    // Sort by created_at descending (newest first)
    const tasks = await Task.find(query).sort({ created_at: -1 });

    return res.status(200).json(tasks);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single task by ID for the authenticated user
 * @route   GET /api/tasks/:id
 * @access  Private
 */
const getTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid task ID format'
      });
    }

    // Find task scoped strictly to the authenticated user
    const task = await Task.findOne({ _id: id, user_id: req.user._id });

    if (!task) {
      return res.status(404).json({
        message: 'Task not found'
      });
    }

    return res.status(200).json(task);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new task for the authenticated user
 * @route   POST /api/tasks
 * @access  Private
 */
const createTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, due_date } = req.body;

    // 1. Validate required title
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({
        message: 'Title is required'
      });
    }

    // 2. Validate status if provided
    if (status && !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        message: `Invalid status value. Allowed values: ${ALLOWED_STATUSES.join(', ')}`
      });
    }

    // 3. Validate priority if provided
    if (priority && !ALLOWED_PRIORITIES.includes(priority)) {
      return res.status(400).json({
        message: `Invalid priority value. Allowed values: ${ALLOWED_PRIORITIES.join(', ')}`
      });
    }

    // 4. Validate due_date if provided
    let parsedDueDate;
    if (due_date) {
      parsedDueDate = new Date(due_date);
      if (isNaN(parsedDueDate.getTime())) {
        return res.status(400).json({
          message: 'Invalid due date format'
        });
      }
    }

    // 5. Construct task with server-enforced user_id (prevents client spoofing)
    const newTask = await Task.create({
      user_id: req.user._id,
      title: title.trim(),
      description: typeof description === 'string' ? description.trim() : '',
      ...(status && { status }),
      ...(priority && { priority }),
      ...(parsedDueDate && { due_date: parsedDueDate })
    });

    return res.status(201).json(newTask);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update an existing task belonging to the authenticated user
 * @route   PUT /api/tasks/:id
 * @access  Private
 */
const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 1. Validate task ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid task ID format'
      });
    }

    // 2. Find task scoped strictly to the authenticated user
    const task = await Task.findOne({ _id: id, user_id: req.user._id });

    if (!task) {
      return res.status(404).json({
        message: 'Task not found'
      });
    }

    // 3. Validate and apply permitted field updates (prevent mass-assignment)
    if (req.body.title !== undefined) {
      if (typeof req.body.title !== 'string' || req.body.title.trim() === '') {
        return res.status(400).json({
          message: 'Title cannot be empty'
        });
      }
      task.title = req.body.title.trim();
    }

    if (req.body.description !== undefined) {
      task.description = typeof req.body.description === 'string' ? req.body.description.trim() : '';
    }

    if (req.body.status !== undefined) {
      if (!ALLOWED_STATUSES.includes(req.body.status)) {
        return res.status(400).json({
          message: `Invalid status value. Allowed values: ${ALLOWED_STATUSES.join(', ')}`
        });
      }
      task.status = req.body.status;
    }

    if (req.body.priority !== undefined) {
      if (!ALLOWED_PRIORITIES.includes(req.body.priority)) {
        return res.status(400).json({
          message: `Invalid priority value. Allowed values: ${ALLOWED_PRIORITIES.join(', ')}`
        });
      }
      task.priority = req.body.priority;
    }

    if (req.body.due_date !== undefined) {
      if (req.body.due_date === null || req.body.due_date === '') {
        task.due_date = undefined;
      } else {
        const parsedDate = new Date(req.body.due_date);
        if (isNaN(parsedDate.getTime())) {
          return res.status(400).json({
            message: 'Invalid due date format'
          });
        }
        task.due_date = parsedDate;
      }
    }

    // 4. Save and return updated task
    const updatedTask = await task.save();
    return res.status(200).json(updatedTask);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete an existing task belonging to the authenticated user
 * @route   DELETE /api/tasks/:id
 * @access  Private
 */
const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 1. Validate task ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid task ID format'
      });
    }

    // 2. Delete task scoped strictly to the authenticated user
    const deletedTask = await Task.findOneAndDelete({ _id: id, user_id: req.user._id });

    if (!deletedTask) {
      return res.status(404).json({
        message: 'Task not found'
      });
    }

    return res.status(200).json({
      message: 'Task deleted successfully',
      id: deletedTask._id
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask
};

const express = require('express');
const router = express.Router();
const { getAllUsers, getAllTasks } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

// All admin routes require valid JWT authentication AND admin role authorization
router.use(protect, admin);

router.get('/users', getAllUsers);
router.get('/tasks', getAllTasks);

module.exports = router;

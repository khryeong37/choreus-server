// src/routes/tasks.js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const taskController = require('../controllers/taskController');

router.use(auth);

router.get('/', taskController.listTasks);
router.post('/', taskController.createTask);
router.patch('/:id', taskController.updateTask);
router.patch('/:id/toggle', taskController.toggleTask);
router.delete('/:id', taskController.deleteTask);

module.exports = router; // ✅ 반드시 있어야 함

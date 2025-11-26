// src/routes/conditionRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const conditionController = require('../controllers/conditionController');

router.use(auth);

router.get('/', conditionController.listMine);
router.get('/:date', conditionController.getByDate);
router.post('/', conditionController.upsertCondition);
router.delete('/:id', conditionController.deleteCondition);

module.exports = router;

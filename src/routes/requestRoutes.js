// src/routes/requestRoutes.js
const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const auth = require('../middlewares/authMiddleware');

router.get('/', auth, requestController.listRequests);
router.post('/', auth, requestController.createRequest);
router.patch('/:requestId/decision', auth, requestController.handleDecision);

module.exports = router;

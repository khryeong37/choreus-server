// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middlewares/authMiddleware');

// 현재 사용자 조회
router.get('/me', auth, userController.getMe);

// 프로필 / 선호 집안일 수정
router.patch('/me', auth, userController.updateMe);

// 같은 household 구성원 조회
router.get('/household', auth, userController.getHouseholdMembers);

module.exports = router;

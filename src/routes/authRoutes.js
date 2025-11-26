// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// 회원가입
router.post('/signup', authController.signup);

// 로그인
router.post('/login', authController.login);

module.exports = router;

// src/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const {
  createUniqueInviteCode,
  ensureInviteCodeDoc,
} = require('../utils/inviteCode');

// POST /api/auth/signup
exports.signup = async (req, res) => {
  try {
    const {
      email,
      password,
      nickname,
      role,
      color,
      preferredChores = [],
      householdInviteCode,
    } = req.body;

    if (!email || !password || !nickname) {
      return res
        .status(400)
        .json({ message: 'email, password, nickname은 필수입니다.' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: '이미 가입된 이메일입니다.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    let householdIdValue;
    if (householdInviteCode) {
      const normalizedInviteCode = householdInviteCode.trim().toUpperCase();
      const inviter = await User.findOne({ inviteCode: normalizedInviteCode });
      if (!inviter) {
        return res
          .status(400)
          .json({ message: '유효하지 않은 초대코드입니다.' });
      }
      householdIdValue = inviter.householdId;
    }
    const inviteCode = await createUniqueInviteCode();
    const user = await User.create({
      email,
      passwordHash,
      nickname,
      role,
      color,
      preferredChores,
      householdId: householdIdValue,
      inviteCode,
    });

    // 토큰 발급
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(201).json({
      token,
      user: {
        userId: user._id,
        email: user.email,
        nickname: user.nickname,
        role: user.role,
        color: user.color,
        preferredChores: user.preferredChores ?? [],
        householdId: user.householdId,
        inviteCode: user.inviteCode,
      },
    });
  } catch (err) {
    console.error('signup error:', err);
    res.status(500).json({ message: '회원가입 중 오류가 발생했습니다.' });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: 'email과 password를 입력해주세요.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ message: '이메일 또는 비밀번호가 잘못되었습니다.' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res
        .status(401)
        .json({ message: '이메일 또는 비밀번호가 잘못되었습니다.' });
    }

    await ensureInviteCodeDoc(user);

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({
      token,
      user: {
        userId: user._id,
        email: user.email,
        nickname: user.nickname,
        role: user.role,
        color: user.color,
        preferredChores: user.preferredChores ?? [],
        householdId: user.householdId,
        inviteCode: user.inviteCode,
      },
    });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ message: '로그인 중 오류가 발생했습니다.' });
  }
};

// src/controllers/userController.js
const User = require('../models/User');
const { ensureInviteCodeDoc } = require('../utils/inviteCode');

// GET /api/users/me
exports.getMe = async (req, res) => {
  try {
    const userDoc = await User.findById(req.userId);
    if (!userDoc) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }
    await ensureInviteCodeDoc(userDoc);
    const user = userDoc.toObject();

    res.json({
      userId: user._id,
      email: user.email,
      nickname: user.nickname,
      role: user.role,
      color: user.color,
      preferredChores: user.preferredChores ?? [],
      householdId: user.householdId,
      inviteCode: user.inviteCode,
    });
  } catch (err) {
    console.error('getMe error:', err);
    res.status(500).json({ message: '사용자 조회 중 오류가 발생했습니다.' });
  }
};

// PATCH /api/users/me
exports.updateMe = async (req, res) => {
  try {
    const { nickname, color, preferredChores, role } = req.body;

    const update = {};
    if (nickname !== undefined) update.nickname = nickname;
    if (color !== undefined) update.color = color;
    if (preferredChores !== undefined) update.preferredChores = preferredChores;
    if (role !== undefined) update.role = role;

    const userDoc = await User.findByIdAndUpdate(
      req.userId,
      { $set: update },
      { new: true }
    );

    if (!userDoc) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }
    await ensureInviteCodeDoc(userDoc);
    const user = userDoc.toObject();

    res.json({
      userId: user._id,
      email: user.email,
      nickname: user.nickname,
      role: user.role,
      color: user.color,
      preferredChores: user.preferredChores ?? [],
      householdId: user.householdId,
      inviteCode: user.inviteCode,
    });
  } catch (err) {
    console.error('updateMe error:', err);
    res.status(500).json({ message: '프로필 수정 중 오류가 발생했습니다.' });
  }
};

// GET /api/users/household
exports.getHouseholdMembers = async (req, res) => {
  try {
    const me = await User.findById(req.userId).lean();
    if (!me) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }
    const members = await User.find({ householdId: me.householdId }).sort({
      createdAt: 1,
    });
    await Promise.all(members.map((member) => ensureInviteCodeDoc(member)));
    const payload = members.map((member) => ({
      userId: member._id,
      email: member.email,
      nickname: member.nickname,
      role: member.role,
      color: member.color,
      preferredChores: member.preferredChores ?? [],
      householdId: member.householdId,
      inviteCode: member.inviteCode,
    }));
    res.json({ members: payload });
  } catch (err) {
    console.error('getHouseholdMembers error:', err);
    res
      .status(500)
      .json({ message: '가족 구성원 정보를 불러오는 데 실패했습니다.' });
  }
};

// src/utils/inviteCode.js
const User = require('../models/User');

const generateCandidateInviteCode = () =>
  `HOME-${Math.random().toString(36).substring(2, 6).toUpperCase()}${Math.floor(
    100 + Math.random() * 900
  )}`;

const createUniqueInviteCode = async () => {
  let code;
  let exists = true;
  while (exists) {
    code = generateCandidateInviteCode();
    // eslint-disable-next-line no-await-in-loop
    exists = await User.exists({ inviteCode: code });
  }
  return code;
};

const ensureInviteCodeDoc = async (userDoc) => {
  if (!userDoc) {
    return userDoc;
  }
  if (!userDoc.inviteCode) {
    userDoc.inviteCode = await createUniqueInviteCode();
    await userDoc.save();
  }
  return userDoc;
};

module.exports = {
  createUniqueInviteCode,
  ensureInviteCodeDoc,
};

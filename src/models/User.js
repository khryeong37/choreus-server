// src/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    nickname: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: '가족 구성원',
      trim: true,
    },
    householdId: {
      type: String,
      required: true,
      default: () => new mongoose.Types.ObjectId().toString(),
      index: true,
    },
    inviteCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    color: {
      type: String,
      default: '#FF7F50',
    },
    preferredChores: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);

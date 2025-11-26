// src/models/Request.js
const mongoose = require('mongoose');

const approvalSchema = new mongoose.Schema(
  {
    partnerId: { type: String, required: true },
    partnerName: { type: String },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'requester'],
      default: 'pending',
    },
    actedAt: { type: Date },
  },
  { _id: false }
);

const requestSchema = new mongoose.Schema(
  {
    householdId: { type: String, required: true, index: true },
    requesterId: { type: String, required: true },
    requesterName: { type: String, required: true },
    taskId: { type: String },
    taskTitle: { type: String, required: true },
    taskDate: { type: String },
    delta: { type: Number, default: 0 },
    direction: {
      type: String,
      enum: ['increase', 'decrease'],
      default: 'increase',
    },
    approvals: {
      type: [approvalSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Request', requestSchema);

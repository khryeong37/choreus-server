// src/models/Task.js
const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema(
  {
    householdId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    order: { type: Number, default: 1 },
    room: { type: String, default: '' },
    tip: { type: String, default: '' },
    partnerId: { type: String, required: true, index: true },
    repeat: { type: String, default: '없음' },
    endDate: { type: String },
    category: { type: String, default: '' },
    memo: { type: String, default: '' },
    durationId: { type: String, default: '' },
    effortId: { type: String, default: '' },
    points: { type: Number, default: 10 },
    isDone: { type: Boolean, default: false },
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Task', TaskSchema);

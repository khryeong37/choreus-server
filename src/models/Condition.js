// src/models/Condition.js
const mongoose = require('mongoose');

const ConditionSchema = new mongoose.Schema(
  {
    householdId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    morningScore: { type: Number, min: 0, max: 10, default: 5 },
    preChoreScore: { type: Number, min: 0, max: 10, default: 5 },
    morningLabel: { type: String, default: '' },
    preChoreLabel: { type: String, default: '' },
    preChoreDisabled: { type: Boolean, default: false },
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

ConditionSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Condition', ConditionSchema);

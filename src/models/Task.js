// src/models/Task.js
const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    assignee: { type: String, default: 'me' },
    points: { type: Number, default: 10 },
    done: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Task', TaskSchema);

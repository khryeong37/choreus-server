// src/routes/tasks.js
const express = require('express');
const Task = require('../models/Task');
const router = express.Router();

router.get('/', async (req, res) => {
  const list = await Task.find().sort({ createdAt: -1 });
  res.json(list);
});

router.post('/', async (req, res) => {
  const task = await Task.create(req.body);
  res.status(201).json(task);
});

router.patch('/:id/toggle', async (req, res) => {
  const t = await Task.findById(req.params.id);
  if (!t) return res.status(404).json({ error: 'Not Found' });
  t.done = !t.done;
  await t.save();
  res.json(t);
});

router.delete('/:id', async (req, res) => {
  await Task.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

module.exports = router; // ✅ 반드시 있어야 함

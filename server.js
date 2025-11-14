// choreus-server/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
dotenv.config();

const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// 1) DB 연결
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// 2) 헬스
app.get('/health', (req, res) => {
  res.json({ ok: true, route: '/health' });
});

// 3) Task 라우트 마운트
const taskRouter = require('./src/routes/tasks'); // ← 경로 정확!
app.use('/api/tasks', taskRouter);

// (진단용)
app.get('/api/tasks/ping', (req, res) => {
  res.json({ ok: true, route: '/api/tasks/ping' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

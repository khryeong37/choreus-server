// choreus-server/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const app = express();

// ✅ CORS: 한 번만, 라우트 등록 전에
app.use(
  cors({
    origin: [
      'http://localhost:5173', // 로컬 프론트
      'https://choreus-client.vercel.app', // 배포 프론트
    ],
    credentials: true,
  })
);

// 요청 바디 JSON 파싱
app.use(express.json());

// 1) DB 연결
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// 2) 헬스 체크
app.get('/health', (req, res) => {
  res.json({ ok: true, route: '/health' });
});

// 3) Task 라우트 마운트
const taskRouter = require('./src/routes/tasks');
app.use('/api/tasks', taskRouter);

// 4) Auth/User/Request/Condition 라우트 추가
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const requestRoutes = require('./src/routes/requestRoutes');
const conditionRoutes = require('./src/routes/conditionRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/conditions', conditionRoutes);

// 서버 시작
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

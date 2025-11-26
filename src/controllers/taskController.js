// src/controllers/taskController.js
const Task = require('../models/Task');
const User = require('../models/User');

const toClientTask = (doc) => ({
  id: doc._id.toString(),
  title: doc.title,
  date: doc.date,
  order: doc.order,
  room: doc.room,
  tip: doc.tip,
  partnerId: doc.partnerId,
  repeat: doc.repeat,
  endDate: doc.endDate,
  category: doc.category,
  memo: doc.memo,
  durationId: doc.durationId,
  effortId: doc.effortId,
  points: doc.points,
  isDone: doc.isDone,
});

const fetchUserOrThrow = async (userId) => {
  const user = await User.findById(userId).lean();
  if (!user) {
    const error = new Error('사용자를 찾을 수 없습니다.');
    error.status = 404;
    throw error;
  }
  if (!user.householdId) {
    const fallbackId = user._id.toString();
    await User.findByIdAndUpdate(user._id, { householdId: fallbackId });
    return { ...user, householdId: fallbackId };
  }
  return user;
};

const reorderDateTasks = async (householdId, date) => {
  if (!date) return;
  const tasks = await Task.find({ householdId, date }).sort({
    order: 1,
    createdAt: 1,
  });
  await Promise.all(
    tasks.map((task, index) => {
      const nextOrder = index + 1;
      if (task.order === nextOrder) {
        return Promise.resolve();
      }
      task.order = nextOrder;
      return task.save();
    })
  );
};

exports.listTasks = async (req, res) => {
  try {
    const me = await fetchUserOrThrow(req.userId);
    const { startDate, endDate } = req.query;
    const filter = { householdId: me.householdId };
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = startDate;
      if (endDate) filter.date.$lte = endDate;
    }
    const tasks = await Task.find(filter)
      .sort({ date: 1, order: 1, createdAt: 1 })
      .lean();
    res.json({ tasks: tasks.map(toClientTask) });
  } catch (error) {
    console.error('listTasks error:', error);
    res
      .status(error.status || 500)
      .json({ message: error.message || '할 일을 불러오는 데 실패했습니다.' });
  }
};

exports.createTask = async (req, res) => {
  try {
    const me = await fetchUserOrThrow(req.userId);
    const {
      title,
      date,
      partnerId,
      room = '',
      tip = '',
      repeat = '없음',
      endDate,
      category = '',
      memo = '',
      durationId = '',
      effortId = '',
      points = 10,
    } = req.body;

    if (!title || !date || !partnerId) {
      return res
        .status(400)
        .json({ message: 'title, date, partnerId는 필수입니다.' });
    }

    const currentCount = await Task.countDocuments({
      householdId: me.householdId,
      date,
    });

    const task = await Task.create({
      householdId: me.householdId,
      createdBy: me._id.toString(),
      title: title.trim(),
      date,
      order: currentCount + 1,
      room,
      tip,
      partnerId,
      repeat,
      endDate,
      category,
      memo,
      durationId,
      effortId,
      points,
    });

    res.status(201).json(toClientTask(task));
  } catch (error) {
    console.error('createTask error:', error);
    res
      .status(error.status || 500)
      .json({ message: error.message || '할 일을 생성하지 못했습니다.' });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const me = await fetchUserOrThrow(req.userId);
    const { id } = req.params;
    const allowedFields = [
      'title',
      'date',
      'partnerId',
      'room',
      'tip',
      'repeat',
      'endDate',
      'category',
      'memo',
      'durationId',
      'effortId',
      'points',
      'order',
      'isDone',
    ];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const task = await Task.findOne({
      _id: id,
      householdId: me.householdId,
    });
    if (!task) {
      return res.status(404).json({ message: '할 일을 찾을 수 없습니다.' });
    }

    const prevDate = task.date;
    Object.assign(task, updates);

    if (updates.date && updates.date !== prevDate) {
      const nextOrder =
        (await Task.countDocuments({
          householdId: me.householdId,
          date: updates.date,
          _id: { $ne: task._id },
        })) + 1;
      task.order = nextOrder;
    }

    await task.save();
    if (updates.date && updates.date !== prevDate) {
      await reorderDateTasks(me.householdId, prevDate);
      await reorderDateTasks(me.householdId, task.date);
    } else if (updates.order !== undefined) {
      await reorderDateTasks(me.householdId, task.date);
    }

    res.json(toClientTask(task));
  } catch (error) {
    console.error('updateTask error:', error);
    res
      .status(error.status || 500)
      .json({ message: error.message || '할 일을 수정하지 못했습니다.' });
  }
};

exports.toggleTask = async (req, res) => {
  try {
    const me = await fetchUserOrThrow(req.userId);
    const { id } = req.params;
    const task = await Task.findOne({
      _id: id,
      householdId: me.householdId,
    });
    if (!task) {
      return res.status(404).json({ message: '할 일을 찾을 수 없습니다.' });
    }
    task.isDone = !task.isDone;
    await task.save();
    res.json(toClientTask(task));
  } catch (error) {
    console.error('toggleTask error:', error);
    res
      .status(error.status || 500)
      .json({ message: error.message || '상태를 변경하지 못했습니다.' });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const me = await fetchUserOrThrow(req.userId);
    const { id } = req.params;
    const task = await Task.findOneAndDelete({
      _id: id,
      householdId: me.householdId,
    });
    if (!task) {
      return res.status(404).json({ message: '할 일을 찾을 수 없습니다.' });
    }
    await reorderDateTasks(me.householdId, task.date);
    res.json({ ok: true });
  } catch (error) {
    console.error('deleteTask error:', error);
    res
      .status(error.status || 500)
      .json({ message: error.message || '할 일을 삭제하지 못했습니다.' });
  }
};

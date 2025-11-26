// src/controllers/conditionController.js
const Condition = require('../models/Condition');
const User = require('../models/User');

const toClientCondition = (doc) => ({
  id: doc._id.toString(),
  date: doc.date,
  morningScore: doc.morningScore,
  preChoreScore: doc.preChoreScore,
  morningLabel: doc.morningLabel,
  preChoreLabel: doc.preChoreLabel,
  preChoreDisabled: doc.preChoreDisabled,
  note: doc.note,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

exports.listMine = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = { userId: req.userId };
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = startDate;
      if (endDate) filter.date.$lte = endDate;
    }
    const conditions = await Condition.find(filter).sort({ date: -1 }).lean();
    res.json({ conditions: conditions.map(toClientCondition) });
  } catch (error) {
    console.error('listMine condition error:', error);
    res.status(500).json({ message: '컨디션 정보를 불러오지 못했습니다.' });
  }
};

exports.getByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const condition = await Condition.findOne({
      userId: req.userId,
      date,
    }).lean();
    if (!condition) {
      return res.status(404).json({ message: '해당 날짜의 컨디션이 없습니다.' });
    }
    res.json(toClientCondition(condition));
  } catch (error) {
    console.error('getByDate condition error:', error);
    res.status(500).json({ message: '컨디션 정보를 불러오지 못했습니다.' });
  }
};

exports.upsertCondition = async (req, res) => {
  try {
    const {
      date,
      morningScore,
      preChoreScore,
      morningLabel,
      preChoreLabel,
      note,
      preChoreDisabled,
    } = req.body;
    if (!date) {
      return res.status(400).json({ message: 'date는 필수입니다.' });
    }
    const user = await User.findById(req.userId).lean();
    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }
    const payload = {
      householdId: user.householdId,
      userId: req.userId,
      date,
      morningScore: morningScore ?? 5,
      preChoreScore: preChoreDisabled ? null : preChoreScore ?? 5,
      morningLabel: morningLabel ?? '',
      preChoreLabel: preChoreLabel ?? '',
      preChoreDisabled: !!preChoreDisabled,
      note: note ?? '',
    };
    const condition = await Condition.findOneAndUpdate(
      { userId: req.userId, date },
      { $set: payload },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.json(toClientCondition(condition));
  } catch (error) {
    console.error('upsertCondition error:', error);
    res.status(500).json({ message: '컨디션을 저장하지 못했습니다.' });
  }
};

exports.deleteCondition = async (req, res) => {
  try {
    const { id } = req.params;
    const condition = await Condition.findOneAndDelete({
      _id: id,
      userId: req.userId,
    });
    if (!condition) {
      return res.status(404).json({ message: '컨디션 정보를 찾을 수 없습니다.' });
    }
    res.json({ ok: true });
  } catch (error) {
    console.error('deleteCondition error:', error);
    res.status(500).json({ message: '컨디션 정보를 삭제하지 못했습니다.' });
  }
};

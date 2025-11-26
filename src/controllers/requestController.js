// src/controllers/requestController.js
const Request = require('../models/Request');
const User = require('../models/User');
const Task = require('../models/Task');

const toClientRequest = (doc) => {
  const deltaSigned =
    doc.direction === 'decrease' ? -Math.abs(doc.delta || 0) : Math.abs(doc.delta || 0);
  const approvals = {};
  (doc.approvals || []).forEach((approval) => {
    approvals[approval.partnerId] =
      approval.status === 'requester' ? 'requester' : approval.status === 'pending'
      ? null
      : approval.status;
  });
  return {
    id: doc._id.toString(),
    requester: doc.requesterName,
    requesterId: doc.requesterId,
    taskId: doc.taskId,
    taskTitle: doc.taskTitle,
    taskDate: doc.taskDate,
    delta: deltaSigned,
    direction: doc.direction,
    approvals,
    status: doc.status,
  };
};

const buildApprovals = (members, requesterId) =>
  members.map((member) => ({
    partnerId: member._id.toString(),
    partnerName: member.nickname || member.email,
    status: member._id.toString() === requesterId ? 'requester' : 'pending',
  }));

const determineStatus = (approvals) => {
  const relevant = approvals.filter((approval) => approval.status !== 'requester');
  if (relevant.some((approval) => approval.status === 'rejected')) {
    return 'rejected';
  }
  if (relevant.length > 0 && relevant.every((approval) => approval.status === 'approved')) {
    return 'approved';
  }
  if (relevant.length === 0) {
    return 'approved';
  }
  return 'pending';
};

exports.listRequests = async (req, res) => {
  try {
    const me = await User.findById(req.userId).lean();
    if (!me) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }
    const requests = await Request.find({ householdId: me.householdId })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ requests: requests.map(toClientRequest) });
  } catch (error) {
    console.error('listRequests error:', error);
    res.status(500).json({ message: '요청 목록을 불러오는 데 실패했습니다.' });
  }
};

exports.createRequest = async (req, res) => {
  try {
    const { taskId, taskTitle, taskDate, delta, direction } = req.body;
    if (!taskTitle && !taskId) {
      return res
        .status(400)
        .json({ message: 'taskTitle 또는 taskId가 필요합니다.' });
    }
    const me = await User.findById(req.userId).lean();
    if (!me) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }
    let finalTaskTitle = taskTitle;
    let finalTaskDate = taskDate;
    if (taskId) {
      const targetTask = await Task.findOne({
        _id: taskId,
        householdId: me.householdId,
      }).lean();
      if (!targetTask) {
        return res
          .status(404)
          .json({ message: '연결된 할 일을 찾을 수 없습니다.' });
      }
      finalTaskTitle = targetTask.title;
      finalTaskDate = targetTask.date;
    }
    const members = await User.find({ householdId: me.householdId }).lean();
    const approvals = buildApprovals(members, me._id.toString());
    const requestDoc = await Request.create({
      householdId: me.householdId,
      requesterId: me._id.toString(),
      requesterName: me.nickname || me.email,
      taskId,
      taskTitle: finalTaskTitle,
      taskDate: finalTaskDate,
      delta: Math.abs(delta || 0),
      direction: direction === 'decrease' ? 'decrease' : 'increase',
      approvals,
    });
    res.status(201).json(toClientRequest(requestDoc));
  } catch (error) {
    console.error('createRequest error:', error);
    res.status(500).json({ message: '요청을 생성하는 데 실패했습니다.' });
  }
};

exports.handleDecision = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { partnerId, decision } = req.body;
    if (!partnerId || !decision) {
      return res.status(400).json({ message: 'partnerId와 decision이 필요합니다.' });
    }
    const me = await User.findById(req.userId).lean();
    if (!me) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }
    const requestDoc = await Request.findOne({
      _id: requestId,
      householdId: me.householdId,
    });
    if (!requestDoc) {
      return res.status(404).json({ message: '요청을 찾을 수 없습니다.' });
    }
    if (requestDoc.requesterId === partnerId) {
      return res.status(400).json({ message: '요청자는 승인할 수 없습니다.' });
    }
    const approvalEntry = requestDoc.approvals.find(
      (approval) => approval.partnerId === partnerId
    );
    if (!approvalEntry) {
      return res.status(400).json({ message: '승인 대상이 아닙니다.' });
    }
    approvalEntry.status = decision === 'approve' ? 'approved' : 'rejected';
    approvalEntry.actedAt = new Date();
    requestDoc.status = determineStatus(requestDoc.approvals);
    await requestDoc.save();
    let updatedTask = null;
    if (requestDoc.status === 'approved' && requestDoc.taskId) {
      const taskDoc = await Task.findOne({
        _id: requestDoc.taskId,
        householdId: me.householdId,
      });
      if (taskDoc) {
        const signedDelta =
          requestDoc.direction === 'decrease'
            ? -Math.abs(requestDoc.delta || 0)
            : Math.abs(requestDoc.delta || 0);
        taskDoc.points = Math.max(0, (taskDoc.points || 0) + signedDelta);
        await taskDoc.save();
        updatedTask = {
          id: taskDoc._id.toString(),
          date: taskDoc.date,
          points: taskDoc.points,
        };
      }
    }
    const responsePayload = { ...toClientRequest(requestDoc), updatedTask };
    if (requestDoc.status !== 'pending') {
      await Request.deleteOne({ _id: requestDoc._id });
    }
    res.json(responsePayload);
  } catch (error) {
    console.error('handleDecision error:', error);
    res.status(500).json({ message: '요청 상태를 업데이트하지 못했습니다.' });
  }
};

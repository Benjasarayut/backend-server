const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Agent = require('../models/Agent');
const auth = require('../middleware/auth');

router.post('/send', auth, async (req, res) => {
  try {
    const { fromCode, toCode, toTeamId, content, type, priority } = req.body;
    if (!fromCode || !content || !type) return res.status(400).json({ success:false, error:'fromCode, content, type required' });
    if (!['direct','broadcast'].includes(type)) return res.status(400).json({ success:false, error:'type must be direct|broadcast' });
    if (type==='direct' && !toCode) return res.status(400).json({ success:false, error:'toCode required for direct' });
    if (type==='broadcast' && !toTeamId) return res.status(400).json({ success:false, error:'toTeamId required for broadcast' });

    const data = {
      fromCode: fromCode.toUpperCase(),
      content: content.trim(),
      type,
      priority: priority || 'normal',
      timestamp: new Date(),
      isRead: false
    };
    if (type==='direct') data.toCode = toCode.toUpperCase();
    else data.toTeamId = parseInt(toTeamId);

    const msg = await Message.create(data);
    res.json({ success:true, data:{ messageId: msg._id, fromCode: msg.fromCode, type: msg.type, timestamp: msg.timestamp, toCode: msg.toCode, toTeamId: msg.toTeamId } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success:false, error:'Failed to send message' });
  }
});

router.get('/agent/:agentCode', auth, async (req, res) => {
  try {
    const agent = await Agent.findByCode(req.params.agentCode.toUpperCase());
    if (!agent) return res.status(404).json({ success:false, error:'Agent not found' });

    const limit = parseInt(req.query.limit || '50');
    const unreadOnly = req.query.unreadOnly === 'true';

    const query = { $or:[ { toCode: req.params.agentCode.toUpperCase() }, { toTeamId: agent.team_id } ] };
    if (unreadOnly) query.isRead = false;

    const messages = await Message.find(query).sort({ timestamp:-1 }).limit(limit).lean();
    res.json({ success:true, agentCode: req.params.agentCode.toUpperCase(), messages, count: messages.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success:false, error:'Failed to get messages' });
  }
});

router.put('/:messageId/read', auth, async (req, res) => {
  try {
    const msg = await Message.findByIdAndUpdate(req.params.messageId, { isRead:true, readAt:new Date() }, { new:true });
    if (!msg) return res.status(404).json({ success:false, error:'Message not found' });
    res.json({ success:true, data:{ messageId: msg._id, isRead: msg.isRead, readAt: msg.readAt } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success:false, error:'Failed to mark read' });
  }
});

module.exports = router;

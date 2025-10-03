const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const auth = require('../middleware/auth');

// ส่งข้อความ
router.post('/send', auth, async (req, res) => {
  try {
    const { fromCode, toCode, toTeamId, content, type, priority } = req.body;
    if (!fromCode || !content || !type) {
      return res.status(400).json({ success:false, error:'Missing required fields' });
    }
    if (!['direct','broadcast'].includes(type)) {
      return res.status(400).json({ success:false, error:'Invalid type' });
    }
    if (type==='direct' && !toCode) {
      return res.status(400).json({ success:false, error:'toCode is required for direct' });
    }
    if (type==='broadcast' && !toTeamId) {
      return res.status(400).json({ success:false, error:'toTeamId is required for broadcast' });
    }

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

    const message = await Message.create(data);
    res.json({ success:true, data: message });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success:false, error:'Failed to send message' });
  }
});

// ดึงข้อความของ agent
router.get('/agent/:agentCode', auth, async (req, res) => {
  try {
    const { agentCode } = req.params;
    const messages = await Message.find({
      $or: [
        { toCode: agentCode.toUpperCase() },
        { toTeamId: req.user.teamId }
      ]
    }).sort({ timestamp: -1 });

    res.json({ success:true, agentCode:agentCode.toUpperCase(), messages, count:messages.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success:false, error:'Failed to get messages' });
  }
});

// Mark as read
router.put('/:messageId/read', auth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const updated = await Message.findByIdAndUpdate(
      messageId,
      { isRead:true, readAt:new Date() },
      { new:true }
    );
    if (!updated) return res.status(404).json({ success:false, error:'Message not found' });
    res.json({ success:true, data:updated });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success:false, error:'Failed to mark message as read' });
  }
});

module.exports = router;

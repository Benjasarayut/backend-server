const express = require('express');
const router = express.Router();
const Agent = require('../models/Agent');
const Status = require('../models/Status');
const auth = require('../middleware/auth');

router.get('/team/:teamId', auth, async (req, res) => {
  try {
    const agents = await Agent.findByTeam(parseInt(req.params.teamId));
    res.json({ success:true, teamId: parseInt(req.params.teamId), agents, count: agents.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success:false, error:'Failed to get team agents' });
  }
});

router.put('/:agentCode/status', auth, async (req, res) => {
  try {
    const valid = ['Available','Busy','Break','Offline'];
    if (!valid.includes(req.body.status)) return res.status(400).json({ success:false, error:`Invalid status: ${req.body.status}` });

    const agent = await Agent.findByCode(req.params.agentCode.toUpperCase());
    if (!agent) return res.status(404).json({ success:false, error:'Agent not found' });

    const doc = await Status.create({ agentCode: req.params.agentCode.toUpperCase(), status: req.body.status, timestamp:new Date(), teamId: agent.team_id });
    res.json({ success:true, data:{ agentCode: doc.agentCode, status: doc.status, timestamp: doc.timestamp, teamId: doc.teamId } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success:false, error:'Failed to update status' });
  }
});

router.get('/:agentCode/history', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '50');
    const list = await Status.find({ agentCode: req.params.agentCode.toUpperCase() }).sort({ timestamp:-1 }).limit(limit).lean();
    res.json({ success:true, agentCode: req.params.agentCode.toUpperCase(), history:list, count:list.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success:false, error:'Failed to get agent history' });
  }
});

module.exports = router;

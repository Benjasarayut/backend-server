const express = require('express');
const jwt = require('jsonwebtoken');
const Agent = require('../models/Agent');
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-me';

router.post('/login', async (req, res) => {
  try {
    const code = (req.body.agentCode || req.body.supervisorCode || '').toUpperCase();
    if (!code) return res.status(400).json({ success:false, error:'Agent code or Supervisor code is required' });

    const user = await Agent.findByCode(code);
    if (!user) return res.status(401).json({ success:false, error:'Invalid credentials' });

    let teamData = null;
    if (user.role === 'supervisor') {
      teamData = await Agent.findByTeam(user.team_id);
    }

    const token = jwt.sign({ agentCode: user.agent_code, role: user.role, teamId: user.team_id }, JWT_SECRET, { expiresIn:'8h' });

    res.json({
      success:true,
      data:{
        user:{ agentCode:user.agent_code, agentName:user.agent_name, teamId:user.team_id, teamName:user.team_name, role:user.role, email:user.email },
        teamData,
        token
      }
    });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ success:false, error:'Internal server error' });
  }
});

router.post('/logout', (req, res) => res.json({ success:true, message:'Logged out successfully' }));

module.exports = router;

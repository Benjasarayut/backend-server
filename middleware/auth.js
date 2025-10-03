const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-me';

module.exports = function (req, res, next) {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ')) return res.status(401).json({ success:false, error:'No token provided' });
  try {
    const token = h.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { agentCode: decoded.agentCode, role: decoded.role, teamId: decoded.teamId };
    next();
  } catch (e) {
    return res.status(401).json({ success:false, error: e.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token' });
  }
};

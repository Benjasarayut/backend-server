const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const DB_PATH = path.resolve(__dirname, process.env.SQLITE_DB_PATH || '../database/sqlite/wallboard.db');

class Agent {
  static findByCode(agentCode) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(DB_PATH);
      const q = `
        SELECT a.*, t.team_name
        FROM agents a
        LEFT JOIN teams t ON a.team_id = t.team_id
        WHERE a.agent_code = ? AND a.is_active = 1
      `;
      db.get(q, [agentCode.toUpperCase()], (err, row) => {
        db.close();
        if (err) return reject(err);
        resolve(row || null);
      });
    });
  }

  static findByTeam(teamId) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(DB_PATH);
      const q = `
        SELECT agent_code, agent_name, role, email, phone
        FROM agents
        WHERE team_id = ? AND is_active = 1 AND role = 'agent'
        ORDER BY agent_name
      `;
      db.all(q, [teamId], (err, rows) => {
        db.close();
        if (err) return reject(err);
        resolve(rows || []);
      });
    });
  }
}
module.exports = Agent;

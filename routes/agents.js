const express = require('express');

module.exports = (db) => {
  const router = express.Router();

  // ดึง agent ทั้งหมด
  router.get('/', (req, res) => {
    db.all('SELECT * FROM agents ORDER BY id DESC', [], (err, rows) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, data: rows });
    });
  });

  // เพิ่ม agent
  router.post('/', (req, res) => {
    const { name, status } = req.body;
    db.run(
      'INSERT INTO agents (name, status) VALUES (?, ?)',
      [name, status || 'offline'],
      function (err) {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.status(201).json({ success: true, id: this.lastID });
      }
    );
  });

  // อัพเดตสถานะ
  router.put('/:id', (req, res) => {
    const { status } = req.body;
    db.run(
      `UPDATE agents SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [status, req.params.id],
      function (err) {
        if (err) return res.status(500).json({ success: false, error: err.message });
        if (this.changes === 0) return res.status(404).json({ success: false, error: 'Agent not found' });
        res.json({ success: true, updated: this.changes });
      }
    );
  });

  return router;
};

// controllers/visitsController.js
const db = require('../db');

exports.trackUserVisit = (req, res) => {
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  const visitDate = new Date().toISOString().split('T')[0]; // yyyy-mm-dd

  const sql = 'INSERT INTO user_visits (user_id, visit_date) VALUES (?, ?)';

  db.query(sql, [user_id, visitDate], (err, result) => {
    if (err) {
      console.error('DB Error:', err);
      return res.status(500).json({ message: 'Failed to record visit' });
    }

    return res.status(200).json({
      message: 'User visit tracked successfully.',
      visit_id: result.insertId,
    });
  });
};

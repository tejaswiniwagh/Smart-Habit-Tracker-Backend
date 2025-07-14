const db = require('../db');

exports.createHabit = (req, res) => {
  const { name, type, goal_duration } = req.body;
  const user_id = req.user.id;
  const sql = 'INSERT INTO Habits (user_id, name, type, goal_duration) VALUES (?, ?, ?, ?)';
  db.query(sql, [user_id, name, type, goal_duration], (err, result) => {
    if (err) return res.status(500).send(err);
    res.status(201).json({ id: result.insertId });
  });
};

exports.getHabits = (req, res) => {
  db.query('SELECT * FROM Habits WHERE user_id = ?', [req.user.id], (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
};

exports.updateHabit = (req, res) => {
  const { id } = req.params;
  const { name, type, goal_duration } = req.body;
  const sql = 'UPDATE Habits SET name = ?, type = ?, goal_duration = ? WHERE id = ? AND user_id = ?';
  db.query(sql, [name, type, goal_duration, id, req.user.id], (err) => {
    if (err) return res.status(500).send(err);
    res.json({ message: 'Habit updated' });
  });
};

exports.deleteHabit = (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM Habits WHERE id = ? AND user_id = ?';
  db.query(sql, [id, req.user.id], (err) => {
    if (err) return res.status(500).send(err);
    res.json({ message: 'Habit deleted' });
  });
};

exports.trackHabit = (req, res) => {
  const { id } = req.params;
  const sql = 'INSERT INTO HabitTracking (habit_id, date) VALUES (?, CURDATE())';
  db.query(sql, [id], (err) => {
    if (err) return res.status(500).send(err);
    res.json({ message: 'Habit tracked for today' });
  });
};

exports.getHabitStats = (req, res) => {
  const { id } = req.params;
  const sql = 'SELECT COUNT(*) AS streak FROM HabitTracking WHERE habit_id = ?';
  db.query(sql, [id], (err, results) => {
    if (err) return res.status(500).send(err);
    res.json({ streak: results[0].streak });
  });
};

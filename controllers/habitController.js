const db = require('../db');


//Api for create habit
exports.createHabit = (req, res) => {
  const {
    habit_name,
    start_date,
    target_days,
    frequency,
    time_of_day,
    category,
    h_note,
    reminder
  } = req.body;

  const user_id = req.user.id;

  const sql = `
    INSERT INTO Habits (
      user_id,
      habit_name,
      start_date,
      target_days,
      frequency,
      time_of_day,
      category,
      h_note,
      reminder
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [user_id, habit_name, start_date, target_days, frequency, time_of_day, category, h_note, reminder],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ message: 'Habit created successfully', id: result.insertId });
    }
  );
};

//Api for get habits
exports.getHabits = (req, res) => {
  const user_id = req.user.id;
  const sql = 'SELECT * FROM habits WHERE user_id = ?';
  db.query(sql, [user_id], (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.status(200).json(results);
  });
};
//For updating habit
exports.updateHabit = (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;
  const {
    habit_name,
    start_date,
    target_days,
    frequency,
    time_of_day,
    category,
    h_note,
    reminder
  } = req.body;

  const sql = `UPDATE habits SET habit_name=?, start_date=?, target_days=?, frequency=?, time_of_day=?, category=?, h_note=?, reminder=? 
               WHERE id=? AND user_id=?`;
  
  db.query(sql, [habit_name, start_date, target_days, frequency, time_of_day, category, h_note, reminder, id, user_id], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.status(200).json({ message: 'Habit updated successfully' });
  });
};

//Api for deleting habit
exports.deleteHabit = (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  const sql = 'DELETE FROM habits WHERE id = ? AND user_id = ?';
  db.query(sql, [id, user_id], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.status(200).json({ message: 'Habit deleted successfully' });
  });
};

//Get habit by ID
// controllers/habitController.js

exports.getHabitById = (req, res) => {
  console.log("➡️ getHabitById called");
  const habitId = req.params.id;
  console.log('Params:', req.params);
  console.log('Habit ID:', habitId);

  if (!habitId) {
    return res.status(400).json({ message: 'Habit ID is required' });
  }

  const query = 'SELECT * FROM habits WHERE id = ?';
  db.query(query, [habitId], (err, results) => {
    if (err) {
      console.error('❌ DB Error:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (results.length === 0) {
      console.log("⚠️ No habit found for id:", habitId);
      return res.status(404).json({ message: 'Habit not found' });
    }

    console.log("✅ Habit found:", results[0]);
    res.status(200).json(results[0]);
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



// Other methods (update, delete, track, stats)... same as before


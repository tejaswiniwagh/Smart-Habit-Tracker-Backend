  const mysql = require('mysql2');

  const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Yash@2007',  // your MySQL password here if set
    database: 'habit_tracker'
  });

  module.exports = db;

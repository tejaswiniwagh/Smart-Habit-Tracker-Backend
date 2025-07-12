const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Tejaswini@10',  // your MySQL password here if set
  database: 'habit_tracker'
});

module.exports = db;

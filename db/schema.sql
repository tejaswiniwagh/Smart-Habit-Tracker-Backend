CREATE DATABASE IF NOT EXISTS habit_tracker;
USE habit_tracker;

CREATE TABLE IF NOT EXISTS Users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  password_hash VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS Habits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  name VARCHAR(100),
  type ENUM('daily', 'weekly'),
  goal_duration INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Habit_Tracking (
  id INT AUTO_INCREMENT PRIMARY KEY,
  habit_id INT,
  date DATE,
  completed BOOLEAN,
  UNIQUE KEY unique_habit_date (habit_id, date),
  FOREIGN KEY (habit_id) REFERENCES Habits(id) ON DELETE CASCADE
);

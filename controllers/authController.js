const db = require('../db/index'); // ✅ Correct path
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const otpStore = new Map();

// 🔹 SEND OTP API
exports.sendOtp = (req, res) => {
  console.log("✅ sendOtp route hit");
  const { email } = req.body;
  if (!email) return res.status(400).send('Email is required');

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(email, otp); // Store OTP temporarily

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Habit Tracker OTP',
    text: "Your OTP is: ${otp}"
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) return res.status(500).send('Failed to send OTP');
    res.status(200).send('OTP sent successfully');
  });
};

// 🔹 REGISTER USER API
exports.register = async (req, res) => {
  const { username, email, password, otp } = req.body;
  if (!otpStore.has(email) || otpStore.get(email) !== otp) {
    return res.status(400).json({ error: 'Invalid OTP' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const sql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
  db.query(sql, [username, email, hashedPassword], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    otpStore.delete(email); // Remove OTP after success

    const token = jwt.sign({ id: result.insertId }, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });

    res.status(201).json({ message: 'User registered successfully', token });
  });
};

// 🔹 LOGIN API
exports.login = (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).send('Email and password are required');

  const sql = 'SELECT * FROM users WHERE email = ?';
  db.query(sql, [email], async (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(401).send('User not found');

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) return res.status(401).send('Incorrect password');

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });

    res.status(200).json({ message: 'Login successful', token });
  });
};
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const otpStore = new Map();

exports.sendOtp = (req, res) => {
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(email, otp);

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: 'Habit Tracker',
    to: email,
    subject: 'Your OTP',
    text: `Your OTP is: ${otp}`
  };

  transporter.sendMail(mailOptions, (err) => {
    if (err) return res.status(500).send('Failed to send OTP');
    res.status(200).send('OTP sent');
  });
};

exports.register = async (req, res) => {
  const { name, email, nickname, password, otp } = req.body;
  if (otpStore.get(email) !== otp) return res.status(400).json({ error: 'Invalid OTP' });

  const hash = await bcrypt.hash(password, 10);
  const sql = 'INSERT INTO Users (name, email, password_hash) VALUES (?, ?, ?)';
  db.query(sql, [name, email, hash], (err) => {
    if (err) return res.status(500).send(err);
    otpStore.delete(email);
    res.status(201).send('User registered');
  });
};

exports.login = (req, res) => {
  const { email, password } = req.body;
  db.query('SELECT * FROM Users WHERE email = ?', [email], async (err, result) => {
    if (err || result.length === 0) return res.status(401).send('Invalid credentials');
    const valid = await bcrypt.compare(password, result[0].password_hash);
    if (!valid) return res.status(401).send('Invalid password');

    const token = jwt.sign({ id: result[0].id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  });
};

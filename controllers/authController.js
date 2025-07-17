const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const db = require('../db/index');
const jwt = require('jsonwebtoken');

const otpStore = {}; // Temporary memory store for OTP

const JWT_SECRET = process.env.JWT_SECRET;

// ✅ 1. SEND OTP — only requires email now
exports.sendOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[email] = {
    otp,
    createdAt: Date.now() // Optional: For OTP expiration logic
  };

  console.log("✅ OTP generated and stored:", otp);

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your OTP for Smart Habit Tracker',
    text: `Your OTP is: ${otp}`
  };

  console.log("📤 Sending email to:", email);

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("❌ Nodemailer Error:", error);
      return res.status(500).json({ message: 'Failed to send OTP' });
    }
    console.log("✅ Email sent:", info.response);
    return res.json({ message: 'OTP sent to your email' });
  });
};

// ✅ 2. REGISTER — now gets name & password from the client
exports.register = async (req, res) => {
  const { email, otp, name, password } = req.body;

  if (!email || !otp || !name || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const stored = otpStore[email];
  if (!stored) {
    return res.status(400).json({ message: 'OTP expired or not sent' });
  }

  if (stored.otp !== otp) {
    return res.status(401).json({ message: 'Invalid OTP' });
  }

  const password_hash = await bcrypt.hash(password, 10);

  const query = `INSERT INTO Users (name, email, password_hash) VALUES (?, ?, ?)`;
  db.execute(query, [name, email, password_hash], (err, result) => {
    if (err) {
      console.error("❌ MySQL Error:", err);
      return res.status(500).json({ message: 'Database error' });
    }

    delete otpStore[email]; // ✅ Clear OTP

    // ✅ Send Welcome Email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to Smart Habit Tracker 🎯',
      text: `Hi ${name}, your account was successfully created. Let’s start building better habits! 💪`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("❌ Welcome Email Error:", error);
        return res.status(201).json({ message: 'User registered, but welcome email failed to send' });
      }
      console.log("✅ Welcome email sent:", info.response);
      return res.status(201).json({ message: 'User registered successfully and welcome email sent' });
    });
  });
};

// ✅ 3. LOGIN — remains the same
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const query = 'SELECT * FROM Users WHERE email = ?';
  db.execute(query, [email], async (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });

    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // ✅ Generate JWT Token
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '30d',//Added 30 days expiration
      //TESTING: '1h' // For testing, change to '30d' in production
    });

    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token, // ✅ this is what you need in Postman!
    });
  });
};

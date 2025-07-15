const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const db = require('../db/index');

const otpStore = {}; // Temporary memory store for OTP

exports.sendOtp = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    console.log("Missing fields");
    return res.status(400).json({ message: "All fields are required" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedPassword = await bcrypt.hash(password, 10);

  

  otpStore[email] = { otp, name, password_hash: hashedPassword,createdAt: Date.now() };

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


exports.register = (req, res) => {
  const { email, otp } = req.body;

  const stored = otpStore[email];
  if (!stored) {
    return res.status(400).json({ message: 'OTP expired or not sent' });
  }

  if (stored.otp !== otp) {
    return res.status(401).json({ message: 'Invalid OTP' });
  }

  const { name, password_hash } = stored;
  const query = `INSERT INTO Users (name, email, password_hash) VALUES (?, ?, ?)`;

  db.execute(query, [name, email, password_hash], (err, result) => {
    if (err) {
      console.error("❌ MySQL Error:", err);
      return res.status(500).json({ message: 'Database error' });
    }

    delete otpStore[email]; // Clear used OTP after success

    // ✅ Send welcome email
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

    console.log("📤 Sending welcome email to:", email);

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

exports.login = async (req, res) => {
  const { email, password } = req.body;

  // Check if fields are missing
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  // Look for user by email
  const query = `SELECT * FROM Users WHERE email = ?`;
  db.execute(query, [email], async (err, results) => {
    if (err) {
      console.error("❌ MySQL Error:", err);
      return res.status(500).json({ message: 'Database error' });
    }

    // If no user found
    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = results[0];

    // Compare input password with hashed password in DB
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 🟢 Login successful (later you can add JWT here)
    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  });
};


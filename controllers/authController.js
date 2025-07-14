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

  otpStore[email] = { otp, name, password_hash: hashedPassword };
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
  if (!stored) return res.status(400).json({ message: 'OTP expired or not sent' });

  if (stored.otp !== otp) return res.status(401).json({ message: 'Invalid OTP' });

  const { name, password_hash } = stored;
  const query = `INSERT INTO Users (name, email, password_hash) VALUES (?, ?, ?)`;

  db.execute(query, [name, email, password_hash], (err, result) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    delete otpStore[email];
    return res.status(201).json({ message: 'User registered successfully' });
  });
};

exports.login = (req, res) => {
  // You can implement this after register is done
  return res.json({ message: 'Login not implemented yet' });
};

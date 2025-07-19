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

    if (!user.password_hash) {
      return res.status(500).json({ message: 'Password is missing in DB' });
    }

    try {
      const isMatch = await bcrypt.compare(password, user.password_hash);


      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
        expiresIn: '30d',
      });

      return res.status(200).json({
        message: 'Login successful',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        token,
      });
    } catch (error) {
      console.error('❌ Error comparing passwords:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
};
//3 Forgot Password
// ✅ FORGOT PASSWORD — same as sendOtp
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins from now

  // Save OTP + expiry to database
  const updateSql = 'UPDATE Users SET otp = ?, otp_expiry = ? WHERE email = ?';
  db.query(updateSql, [otp, otpExpiry, email], (err, result) => {
    if (err) {
      console.error("DB error while saving OTP:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Send email
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
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
      subject: 'Password Reset OTP - Smart Habit Tracker',
      text: `Your password reset OTP is: ${otp}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("❌ OTP email error:", error);
        return res.status(500).json({ message: "Failed to send OTP" });
      }

      console.log("✅ Forgot Password OTP sent:", otp);
      return res.json({ message: "OTP sent to your email" });
    });
  });
};

//Verify OTP function
exports.verifyOtp = (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required' });
  }

  const sql = 'SELECT * FROM Users WHERE email = ? AND otp = ?';
  db.query(sql, [email, otp], (err, results) => {
    if (err) {
      console.error('DB error:', err);
      return res.status(500).json({ message: 'Server error' });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid OTP or email' });
    }

    const user = results[0];

    const currentTime = new Date();
    const otpExpiryTime = new Date(user.otp_expiry);

    if (currentTime > otpExpiryTime) {
      return res.status(401).json({ message: 'OTP expired' });
    }

    // ✅ You can now allow password reset or generate JWT if needed
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.status(200).json({ message: 'OTP verified successfully', token });
  });
};
// ✅ RESET PASSWORD — now requires email and new password
// This function is called after OTP verification

  exports.resetPassword = async (req, res) => {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ message: "Email and new password are required" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user's password in database
    db.query(
      'UPDATE users SET password = ? WHERE email = ?',
      [hashedPassword, email],
      (err, result) => {
        if (err) {
          console.error("❌ Error updating password:", err);
          return res.status(500).json({ message: "Failed to reset password" });
        }
        
        // ✅ After password is updated, delete the OTP from memory
        delete otpStore[email];

        console.log("✅ Password reset successful");
        return res.json({ message: "Password reset successful. Please login again." });

      
      }
    );
  };




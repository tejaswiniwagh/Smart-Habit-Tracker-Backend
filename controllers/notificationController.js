const nodemailer = require('nodemailer');
require('dotenv').config();

exports.sendHabitReminder = async (req, res) => {
  const { email, habitName } = req.body;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,      // your email
      pass: process.env.EMAIL_PASS       // your password or app password
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `⏰ Reminder: It's time for your habit`,
    html: `<p>Don't forget to complete your habit: <strong>${habitName}
    Reminder: A small step today brings big change tomorrow. Let’s go! 
    
    </strong> 🚀</p>`
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ message: 'Reminder email sent successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send email' });
  }
};

const express = require('express');
const router = express.Router();
const { sendHabitReminder } = require('../controllers/notificationController');

router.post('/send-reminder', sendHabitReminder);

module.exports = router;

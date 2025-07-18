const express = require('express');
const router = express.Router();
const habitController = require('../controllers/habitController');
const verifyToken = require('../middleware/authMiddleware');

router.post('/', verifyToken, habitController.createHabit);
router.get('/', verifyToken, habitController.getHabits);
router.put('/:id', verifyToken, habitController.updateHabit);
router.get('/:id', verifyToken, habitController.getHabitById); // ✅ fixed

router.delete('/:id', verifyToken, habitController.deleteHabit);
router.post('/:id/track', verifyToken, habitController.trackHabit);
router.get('/:id/stats', verifyToken, habitController.getHabitStats);

module.exports = router;

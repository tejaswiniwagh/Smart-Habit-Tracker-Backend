// routes/visits.js
const express = require('express');
const router = express.Router();
const { trackUserVisit } = require('../controllers/visitsController');

router.post('/track', trackUserVisit);

module.exports = router;

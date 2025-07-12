require('dotenv').config();
const express = require('express'); 
const cors = require('cors');
const bodyParser = require('body-parser');
const habitRoutes = require('./routes/habits');
const authRoutes = require('./routes/auth');
const db = require('./db');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use('/api/habits', habitRoutes);
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;

db.connect(err => {
  if (err) {
    console.error('❌ MySQL connection failed:', err.message);
    process.exit(1);
  }
  console.log('✅ MySQL Connected.');
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
});

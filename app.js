require('dotenv').config();
const express = require('express'); 
const cors = require('cors');
const bodyParser = require('body-parser');
const habitRoutes = require('./routes/habits');
const authRoutes = require('./routes/auth');
const db = require('./db/index'); 
const notificationRoutes = require('./routes/notificationRoutes');


const app = express();
//Frontend to backend connectivity 
app.use(cors({
  origin: 'http://localhost:3000',
  //methods: ['GET', 'POST'],
  credentials: true
}));
app.use(bodyParser.json());

//app.use('/api/habits', habitRoutes);
//app.use('/api/auth', authRoutes);

app.use('/habits', habitRoutes);
app.use('/auth', authRoutes);
app.use('/notifications', notificationRoutes);



const PORT = process.env.PORT || 5000;

db.connect(err => {
  if (err) {
    console.error('❌ MySQL connection failed:', err.message);
    process.exit(1);
  }
  console.log('✅ MySQL Connected.');

  app.get('/', (req, res) => {
  res.send('API is running ✅');
});

  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
});

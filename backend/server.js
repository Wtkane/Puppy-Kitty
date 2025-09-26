const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/puppy-kitty', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('🐶 MongoDB connected'))
.catch(err => console.log('❌ MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/calendar', require('./routes/calendar'));
app.use('/api/todos', require('./routes/todos'));
app.use('/api/goals', require('./routes/goals'));
app.use('/api/habits', require('./routes/habits'));
app.use('/api/special-dates', require('./routes/specialDates'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ message: '🐱 Puppy & Kitty backend is running!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

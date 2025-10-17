const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5001',
    'https://puppy-kitty.onrender.com',
    'https://puppy-kitty-frontend.onrender.com',
    'https://puppy-kitty.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
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

// Serve static files from the React app build directory
console.log('Serving static files from:', path.join(__dirname, 'frontend/build'));
console.log('Current directory:', __dirname);
console.log('Directory exists:', require('fs').existsSync(path.join(__dirname, 'frontend/build')));
app.use(express.static(path.join(__dirname, 'frontend/build')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/calendar', require('./routes/calendar'));
app.use('/api/todos', require('./routes/todos'));
app.use('/api/focus', require('./routes/focus'));
app.use('/api/goals', require('./routes/goals'));
app.use('/api/habits', require('./routes/habits'));
app.use('/api/special-dates', require('./routes/specialDates'));
app.use('/api/groups', require('./routes/groups'));

// Catch all handler: send back React's index.html file for client-side routing
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'frontend/build/index.html');
  console.log('Attempting to serve index.html from:', indexPath);
  console.log('Index file exists:', require('fs').existsSync(indexPath));
  res.sendFile(indexPath);
});

// Health check endpoints
app.get('/api/health', (req, res) => {
  res.json({ message: '🐱 Puppy & Kitty backend is running!' });
});

// Health check for deployment platforms (like Render)
app.get('/healthz', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    message: '🐱 Puppy & Kitty backend is running!',
    timestamp: new Date().toISOString()
  });
});

// Root route handler
app.get('/', (req, res) => {
  res.json({ 
    message: '🐶🐱 Welcome to Puppy & Kitty API!',
    version: '1.0.0',
    endpoints: {
      health: '/healthz or /api/health',
      api: '/api/*'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

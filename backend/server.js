const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// On Render, check if we need to run the build
const fs = require('fs');
const { execSync } = require('child_process');

if (!fs.existsSync(path.join(__dirname, 'frontend/build/index.html'))) {
  console.log('🤔 Build files not found, attempting to build frontend...');
  try {
    execSync('npm run build', { cwd: __dirname, stdio: 'inherit' });
    console.log('✅ Frontend successfully built!');
  } catch (error) {
    console.error('❌ Failed to build frontend:', error.message);
  }
}

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

  if (require('fs').existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // Fallback if build doesn't exist yet - serve a message
    console.log('Build files not found, serving fallback');
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Puppy & Kitty</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 50px; height: 50px; animation: spin 2s linear infinite; margin: 0 auto; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          </style>
        </head>
        <body>
          <div class="spinner"></div>
          <h2>🐶🐱 Building Puppy & Kitty...</h2>
          <p>Please refresh in a few moments!</p>
        </body>
      </html>
    `;
    res.send(html);
  }
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

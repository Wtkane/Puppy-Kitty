const express = require('express');
const jwt = require('jsonwebtoken');
const { google } = require('googleapis');
const User = require('../models/User');

const router = express.Router();

// Initialize OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.CLIENT_ORIGIN || 'http://localhost:3000'
);

// Also support multiple origins for OAuth
const getClientOrigin = () => {
  const origin = process.env.CLIENT_ORIGIN || 'http://localhost:3000';
  // If multiple origins are supported, use the first one for OAuth
  return origin;
};

const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/calendar.events'
];

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = new User({ name, email, password });
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'puppykittysecret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        primaryColor: user.primaryColor,
        secondaryColor: user.secondaryColor
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'puppykittysecret',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        primaryColor: user.primaryColor,
        secondaryColor: user.secondaryColor
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'puppykittysecret');
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'puppykittysecret');
    const { name, email } = req.body;

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    user.name = name || user.name;
    user.email = email || user.email;
    await user.save();

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      primaryColor: user.primaryColor,
      secondaryColor: user.secondaryColor,
      createdAt: user.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user color preferences
router.put('/colors', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'puppykittysecret');
    const { primaryColor, secondaryColor } = req.body;

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.primaryColor = primaryColor || user.primaryColor;
    user.secondaryColor = secondaryColor || user.secondaryColor;
    await user.save();

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      primaryColor: user.primaryColor,
      secondaryColor: user.secondaryColor,
      createdAt: user.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Google OAuth routes
router.get('/google', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
  res.redirect(authUrl);
});

router.get('/google/callback', async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ message: 'Authorization code not provided' });
    }

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info from Google
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    // Check if user exists
    let user = await User.findOne({ email: userInfo.email });

    if (!user) {
      // Create new user
      user = new User({
        name: userInfo.name,
        email: userInfo.email,
        googleId: userInfo.id,
        googleAccessToken: tokens.access_token,
        googleRefreshToken: tokens.refresh_token,
        avatar: userInfo.picture
      });
    } else {
      // Update existing user with Google info
      user.googleId = userInfo.id;
      user.googleAccessToken = tokens.access_token;
      user.googleRefreshToken = tokens.refresh_token;
      user.avatar = userInfo.picture;
    }

    await user.save();

    // Generate JWT token
    const jwtToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'puppykittysecret',
      { expiresIn: '7d' }
    );

    // Redirect to frontend with token
    const frontendUrl = process.env.CLIENT_ORIGIN || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/callback?token=${jwtToken}`);
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(500).json({ message: 'Authentication failed', error: error.message });
  }
});

// Google OAuth token exchange (new GIS flow)
router.post('/google/exchange', async (req, res) => {
  try {
    // 1) Basic input + env checks
    const { code } = req.body || {};
    if (!code) return res.status(400).json({ error: 'missing_code' });

    const CID = process.env.GOOGLE_CLIENT_ID;
    const CSECRET = process.env.GOOGLE_CLIENT_SECRET;
    if (!CID || !CSECRET) {
      console.error('Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET');
      return res.status(500).json({ error: 'server_env_missing' });
    }

    // 2) IMPORTANT: In GIS **popup** mode, redirect_uri must be the **origin** (not a path)
    // Docs: for popup mode, token exchange uses the origin that called initCodeClient (e.g., http://localhost:3000).
    // https://developers.google.com/identity/oauth2/web/guides/use-code-model
    const frontendUrl = process.env.CLIENT_ORIGIN || 'http://localhost:3000';
    const params = new URLSearchParams({
      code,
      client_id: CID,
      client_secret: CSECRET,
      redirect_uri: frontendUrl,
      grant_type: 'authorization_code',
    });

    // 3) Do the token exchange manually so we can read Google's error message
    const r = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });

    const text = await r.text();
    if (!r.ok) {
      console.error('Token exchange failed:', r.status, text);
      // Common messages: invalid_grant, redirect_uri_mismatch, bad client type, etc.
      return res.status(400).type('application/json').send(text);
    }

    const tokens = JSON.parse(text);

    // 4) Use tokens with googleapis to fetch profile
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    let user = await User.findOne({ email: userInfo.email });
    if (!user) {
      user = new User({
        name: userInfo.name,
        email: userInfo.email,
        googleId: userInfo.id,
        googleAccessToken: tokens.access_token,
        googleRefreshToken: tokens.refresh_token,
        avatar: userInfo.picture,
      });
    } else {
      user.googleId = userInfo.id;
      user.googleAccessToken = tokens.access_token;
      if (tokens.refresh_token) user.googleRefreshToken = tokens.refresh_token;
      user.avatar = userInfo.picture;
    }
    await user.save();

    const jwtToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'puppykittysecret',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Google authentication successful',
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        primaryColor: user.primaryColor,
        secondaryColor: user.secondaryColor
      },
    });
  } catch (err) {
    console.error('Google OAuth exchange error:', err);
    res.status(500).json({ error: 'server_error' });
  }
});

// Refresh Google token
router.post('/google/refresh', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'puppykittysecret');
    const user = await User.findById(decoded.userId);

    if (!user || !user.googleRefreshToken) {
      return res.status(404).json({ message: 'User or refresh token not found' });
    }

    oauth2Client.setCredentials({
      refresh_token: user.googleRefreshToken
    });

    const { credentials } = await oauth2Client.refreshAccessToken();
    user.googleAccessToken = credentials.access_token;

    if (credentials.refresh_token) {
      user.googleRefreshToken = credentials.refresh_token;
    }

    await user.save();

    res.json({ accessToken: credentials.access_token });
  } catch (error) {
    res.status(500).json({ message: 'Token refresh failed', error: error.message });
  }
});

module.exports = router;

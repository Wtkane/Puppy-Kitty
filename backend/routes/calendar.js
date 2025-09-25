const express = require('express');
const jwt = require('jsonwebtoken');
const { google } = require('googleapis');
const Calendar = require('../models/Calendar');
const User = require('../models/User');

const router = express.Router();

// Middleware to verify token
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'puppykittysecret');
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Get all events
router.get('/', auth, async (req, res) => {
  try {
    const events = await Calendar.find().populate('createdBy', 'name email');
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get events by date range
router.get('/range/:start/:end', auth, async (req, res) => {
  try {
    const { start, end } = req.params;
    const events = await Calendar.find({
      date: {
        $gte: new Date(start),
        $lte: new Date(end)
      }
    }).populate('createdBy', 'name email');

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new event
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, date, startTime, endTime, color, isAllDay } = req.body;

    const event = new Calendar({
      title,
      description,
      date: new Date(date),
      startTime,
      endTime,
      color,
      isAllDay,
      createdBy: req.userId
    });

    await event.save();
    await event.populate('createdBy', 'name email');

    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update event
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Convert date string to Date object if present
    if (updates.date) {
      updates.date = new Date(updates.date);
    }

    const event = await Calendar.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete event
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Calendar.findByIdAndDelete(id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Clear all events for the current user
router.delete('/', auth, async (req, res) => {
  try {
    const result = await Calendar.deleteMany({ createdBy: req.userId });

    res.json({
      message: 'All events cleared successfully',
      deletedCount: result.deleted
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Google Calendar API routes

// Get Google Calendar events
router.get('/google/events', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user || !user.googleAccessToken) {
      return res.status(404).json({ message: 'User or Google access token not found' });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const { data } = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 50,
      singleEvents: true,
      orderBy: 'startTime',
    });

    res.json(data.items);
  } catch (error) {
    console.error('Google Calendar API error:', error);
    res.status(500).json({ message: 'Failed to fetch Google Calendar events', error: error.message });
  }
});

// Create Google Calendar event
router.post('/google/events', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user || !user.googleAccessToken) {
      return res.status(404).json({ message: 'User or Google access token not found' });
    }

    const { summary, description, start, end, location } = req.body;

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const event = {
      summary,
      description,
      location,
      start: {
        dateTime: start,
        timeZone: 'America/New_York',
      },
      end: {
        dateTime: end,
        timeZone: 'America/New_York',
      },
    };

    const { data } = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });

    res.status(201).json(data);
  } catch (error) {
    console.error('Google Calendar API error:', error);
    res.status(500).json({ message: 'Failed to create Google Calendar event', error: error.message });
  }
});

// Sync Google Calendar events to local database
router.post('/google/sync', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user || !user.googleAccessToken) {
      return res.status(404).json({ message: 'User or Google access token not found' });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const { data } = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 100,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const syncedEvents = [];
    const updatedEvents = [];
    const errors = [];

    // Get all existing Google events for this user to check for deletions
    const existingGoogleEvents = await Calendar.find({
      createdBy: req.userId,
      googleEventId: { $exists: true, $ne: null }
    });

    const existingGoogleEventIds = new Set(existingGoogleEvents.map(event => event.googleEventId));

    // Sync events to local database
    for (const event of data.items) {
      try {
        // Skip events without proper timing information
        if (!event.start || (!event.start.dateTime && !event.start.date)) {
          continue;
        }

        const eventData = {
          title: event.summary || 'Untitled Event',
          description: event.description || '',
          date: new Date(event.start.dateTime || event.start.date),
          startTime: event.start.dateTime ? new Date(event.start.dateTime).toTimeString().slice(0, 5) : '',
          endTime: event.end.dateTime ? new Date(event.end.dateTime).toTimeString().slice(0, 5) : '',
          color: '#4285f4',
          isAllDay: !event.start.dateTime,
          createdBy: req.userId,
          googleEventId: event.id
        };

        // Check if event already exists
        const existingEvent = await Calendar.findOne({
          googleEventId: event.id,
          createdBy: req.userId
        });

        if (existingEvent) {
          // Update existing event
          const updatedEvent = await Calendar.findByIdAndUpdate(
            existingEvent._id,
            eventData,
            { new: true, runValidators: true }
          ).populate('createdBy', 'name email');

          updatedEvents.push(updatedEvent);
        } else {
          // Create new event
          const localEvent = new Calendar(eventData);
          await localEvent.save();
          await localEvent.populate('createdBy', 'name email');
          syncedEvents.push(localEvent);
        }

        // Remove from existing set to track which events still exist
        existingGoogleEventIds.delete(event.id);

      } catch (eventError) {
        console.error(`Error syncing event ${event.id}:`, eventError);
        errors.push({ eventId: event.id, error: eventError.message });
      }
    }

    // Remove events that no longer exist in Google Calendar
    const deletedCount = existingGoogleEventIds.size;
    if (deletedCount > 0) {
      await Calendar.deleteMany({
        googleEventId: { $in: Array.from(existingGoogleEventIds) },
        createdBy: req.userId
      });
    }

    const result = {
      message: 'Google Calendar synced successfully',
      newEvents: syncedEvents.length,
      updatedEvents: updatedEvents.length,
      deletedEvents: deletedCount,
      errors: errors.length > 0 ? errors : undefined
    };

    res.json(result);
  } catch (error) {
    console.error('Google Calendar sync error:', error);
    res.status(500).json({ message: 'Failed to sync Google Calendar events', error: error.message });
  }
});

module.exports = router;

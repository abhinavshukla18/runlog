const express = require('express');
const axios = require('axios');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

const CLIENT_ID = process.env.STRAVA_CLIENT_ID;
const CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;
const REDIRECT_URI = process.env.STRAVA_REDIRECT_URI;

// Auth route
app.get('/api/auth', (req, res) => {
  const url = `https://www.strava.com/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=read,activity:read_all`;
  res.redirect(url);
});

// Callback route
app.get('/api/callback', async (req, res) => {
  const { code } = req.query;
  try {
    const response = await axios.post('https://www.strava.com/oauth/token', {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
      grant_type: 'authorization_code'
    });
    const { access_token, refresh_token, athlete } = response.data;
    res.cookie('access_token', access_token, { httpOnly: true, secure: true });
    res.cookie('refresh_token', refresh_token, { httpOnly: true, secure: true });
    res.cookie('athlete', JSON.stringify(athlete), { secure: true });
    res.redirect('/dashboard');
  } catch (err) {
    res.redirect('/?error=auth_failed');
  }
});

// Get athlete
app.get('/api/athlete', async (req, res) => {
  const token = req.cookies.access_token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const response = await axios.get('https://www.strava.com/api/v3/athlete', {
      headers: { Authorization: `Bearer ${token}` }
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch athlete' });
  }
});

// Get activities
app.get('/api/activities', async (req, res) => {
  const token = req.cookies.access_token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  const { page = 1, per_page = 30 } = req.query;
  try {
    const response = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
      headers: { Authorization: `Bearer ${token}` },
      params: { page, per_page }
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// Get single activity
app.get('/api/activities/:id', async (req, res) => {
  const token = req.cookies.access_token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const response = await axios.get(`https://www.strava.com/api/v3/activities/${req.params.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

// Get activity streams (GPS, elevation etc)
app.get('/api/activities/:id/streams', async (req, res) => {
  const token = req.cookies.access_token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const response = await axios.get(`https://www.strava.com/api/v3/activities/${req.params.id}/streams`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { keys: 'latlng,altitude,time,distance,velocity_smooth', key_by_type: true }
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch streams' });
  }
});

// Get athlete stats
app.get('/api/stats', async (req, res) => {
  const token = req.cookies.access_token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const athlete = await axios.get('https://www.strava.com/api/v3/athlete', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const stats = await axios.get(`https://www.strava.com/api/v3/athletes/${athlete.data.id}/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    res.json(stats.data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Logout
app.get('/api/logout', (req, res) => {
  res.clearCookie('access_token');
  res.clearCookie('refresh_token');
  res.clearCookie('athlete');
  res.redirect('/');
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`RunLog running on port ${PORT}`));

module.exports = app;
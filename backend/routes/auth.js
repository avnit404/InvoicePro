const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

const userPayload = (u) => ({ id: u._id, name: u.name, email: u.email, avatar: u.avatar });

// ── Register ──────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'Name, email and password are required.' });
    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: 'Email is already registered.' });

    const user = await User.create({ name, email, password });
    res.status(201).json({ token: signToken(user._id), user: userPayload(user) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Login ─────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required.' });

    const user = await User.findOne({ email });
    if (!user || !user.password)
      return res.status(401).json({ error: 'Invalid email or password.' });

    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password.' });

    res.json({ token: signToken(user._id), user: userPayload(user) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Google OAuth (direct implementation — no passport session state issues) ──
router.get('/google', (req, res) => {
  const params = new URLSearchParams({
    client_id:     process.env.GOOGLE_CLIENT_ID,
    redirect_uri:  process.env.GOOGLE_CALLBACK_URL,
    response_type: 'code',
    scope:         'profile email',
    access_type:   'online',
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

router.get('/google/callback', async (req, res) => {
  const FRONTEND = process.env.FRONTEND_URL || 'http://localhost:3000';
  const { code, error } = req.query;

  if (error || !code) return res.redirect(`${FRONTEND}?auth_error=google_failed`);

  try {
    const { data: tokens } = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id:     process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri:  process.env.GOOGLE_CALLBACK_URL,
      grant_type:    'authorization_code',
    });

    const { data: profile } = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    let user = await User.findOne({ $or: [{ googleId: profile.id }, { email: profile.email }] });
    if (user) {
      if (!user.googleId) { user.googleId = profile.id; await user.save(); }
    } else {
      user = await User.create({
        googleId: profile.id,
        name:     profile.name,
        email:    profile.email,
        avatar:   profile.picture || '',
      });
    }

    res.redirect(`${FRONTEND}?token=${signToken(user._id)}`);
  } catch (e) {
    console.error('Google OAuth error:', e.message);
    res.redirect(`${FRONTEND}?auth_error=google_failed`);
  }
});

// ── Get current user ──────────────────────────────────────────────
router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: userPayload(req.user) });
});

module.exports = router;

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('./models/User');
const invoiceRoutes = require('./routes/invoices');
const authRoutes = require('./routes/auth');

const app = express();

// Allow both production frontend and localhost
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// MongoDB-backed session — persists across Vercel serverless instances
app.use(session({
  secret: process.env.JWT_SECRET || 'secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 10 * 60, // 10 minutes — only needed for OAuth flow
  }),
  cookie: { maxAge: 10 * 60 * 1000 },
}));

app.use(passport.initialize());

// ── Google OAuth Strategy ──────────────────────────────────────────
passport.use(new GoogleStrategy(
  {
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5001/api/auth/google/callback',
  },
  async (_accessToken, _refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      let user = await User.findOne({ $or: [{ googleId: profile.id }, { email }] });
      if (user) {
        if (!user.googleId) { user.googleId = profile.id; await user.save(); }
        return done(null, user);
      }
      user = await User.create({
        googleId: profile.id,
        name:   profile.displayName,
        email,
        avatar: profile.photos?.[0]?.value || '',
      });
      done(null, user);
    } catch (e) {
      done(e, null);
    }
  }
));

// ── MongoDB ────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Atlas connected'))
  .catch((err) => console.error('❌ MongoDB error:', err.message));

// ── Routes ─────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api', invoiceRoutes);

app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── Local dev server (not used on Vercel) ──────────────────────────
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5001;
  const server = app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} busy. Run: lsof -ti :${PORT} | xargs kill -9`);
      process.exit(1);
    } else throw err;
  });
}

// Export for Vercel serverless
module.exports = app;

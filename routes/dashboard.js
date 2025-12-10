const express = require('express');
const router = express.Router();
const { requireLogin } = require('../middleware/auth');
const Session = require('../models/Session');

router.get('/dashboard', requireLogin, async (req, res) => {
  try {
    const liveSessions = await Session.find({ isLive: true })
      .sort({ createdAt: -1 })
      .lean();

    const recentSessions = await Session.find({ isLive: false })
      .sort({ updatedAt: -1 })
      .limit(10)
      .lean();

    res.render('dashboard', {
      username: req.session.username,
      liveSessions,
      recentSessions,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).send('Error loading dashboard');
  }
});

module.exports = router;

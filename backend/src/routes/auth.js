const express = require('express');
const bcrypt = require('bcryptjs');
const { queries } = require('../database');
const { signToken, authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Only these two usernames are allowed - no public registration
const ALLOWED_USERNAMES = ['vinoth', 'ishwarya'];

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Basic input validation
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    if (typeof username !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Invalid input types' });
    }

    const sanitizedUsername = username.trim().toLowerCase();

    // Reject any username not in the allowed list
    if (!ALLOWED_USERNAMES.includes(sanitizedUsername)) {
      return res.status(403).json({ error: 'Access denied. This is a private application.' });
    }

    // Fetch user from DB
    const user = queries.getUserByUsername.get(sanitizedUsername);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Sign JWT
    const token = signToken({
      id: user.id,
      username: user.username,
    });

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me - verify token & return current user
router.get('/me', authenticateToken, (req, res) => {
  const user = queries.getUserById.get(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  return res.json({ user });
});

// Completely block any registration attempt
router.post('/register', (_req, res) => {
  return res.status(403).json({
    error: 'Registration is disabled. This is a private application.',
  });
});

module.exports = router;
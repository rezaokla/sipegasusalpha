const express = require('express');
const router = express.Router();
const UserService = require('../services/UserService');

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan password harus diisi' });
    }

    const user = await UserService.authenticateUser(email, password);
    req.session.user = user;

    res.json({
      message: 'Login berhasil',
      user: user
    });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Gagal logout' });
    }
    res.json({ message: 'Logout berhasil' });
  });
});

// Get current user
router.get('/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Tidak login' });
  }
  res.json({ user: req.session.user });
});

module.exports = router;

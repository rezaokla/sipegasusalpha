const express = require('express');
const router = express.Router();
const UserService = require('../services/UserService');

// Middleware untuk check admin
const checkAdmin = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Akses ditolak. Hanya admin.' });
  }
  next();
};

// Get all users (admin only)
router.get('/', checkAdmin, async (req, res) => {
  try {
    const users = await UserService.getAllUsers();
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user by ID (admin only)
router.get('/:id', checkAdmin, async (req, res) => {
  try {
    const user = await UserService.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new user (admin only)
router.post('/', checkAdmin, async (req, res) => {
  try {
    const { email, nip, name, password, role, department } = req.body;

    // Validasi input
    if (!email || !nip || !name || !password || !role) {
      return res.status(400).json({ error: 'Email, NIP, nama, password, dan role harus diisi' });
    }

    const user = await UserService.createUser(email, nip, name, password, role, department);
    res.status(201).json({ message: 'User berhasil dibuat', user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update user (admin only)
router.put('/:id', checkAdmin, async (req, res) => {
  try {
    const { name, department, role, password } = req.body;
    const user = await UserService.updateUser(req.params.id, {
      name,
      department,
      role,
      password
    });
    res.json({ message: 'User berhasil diupdate', user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete user (admin only)
router.delete('/:id', checkAdmin, async (req, res) => {
  try {
    // Jangan bisa delete diri sendiri
    if (req.params.id === req.session.user.id) {
      return res.status(400).json({ error: 'Tidak bisa menghapus akun sendiri' });
    }
    
    await UserService.deleteUser(req.params.id);
    res.json({ message: 'User berhasil dihapus' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;

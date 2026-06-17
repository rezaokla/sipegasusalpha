const express = require('express');
const router = express.Router();
const LeaveService = require('../services/LeaveService');

// Middleware untuk check login
const checkAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Tidak login' });
  }
  next();
};

// Middleware untuk check admin
const checkAdmin = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Akses ditolak. Hanya admin.' });
  }
  next();
};

// Get leave balance (pegawai)
router.get('/balance', checkAuth, async (req, res) => {
  try {
    const balance = await LeaveService.getLeaveBalance(req.session.user.id);
    res.json({ balance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get my leave requests (pegawai)
router.get('/my-requests', checkAuth, async (req, res) => {
  try {
    const requests = await LeaveService.getLeaveRequestsByPegawai(req.session.user.id);
    res.json({ requests });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create leave request (pegawai)
router.post('/request', checkAuth, async (req, res) => {
  try {
    const { startDate, endDate, type, reason } = req.body;

    // Validasi input
    if (!startDate || !endDate || !type || !reason) {
      return res.status(400).json({ error: 'Semua field harus diisi' });
    }

    const leaveRequest = await LeaveService.createLeaveRequest(
      req.session.user.id,
      req.session.user.name,
      startDate,
      endDate,
      type,
      reason
    );

    res.status(201).json({
      message: 'Pengajuan cuti berhasil dibuat',
      request: leaveRequest
    });
  } catch (error) {
    // Jika reject otomatis, return dengan status yang sesuai
    if (error.message.includes('Pengajuan ditolak')) {
      return res.status(400).json({ error: error.message, rejected: true });
    }
    res.status(400).json({ error: error.message });
  }
});

// Cancel leave request (pegawai)
router.post('/request/:id/cancel', checkAuth, async (req, res) => {
  try {
    const request = await LeaveService.cancelLeaveRequest(req.params.id, req.session.user.id);
    res.json({
      message: 'Pengajuan cuti dibatalkan',
      request
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all leave requests (admin)
router.get('/', checkAdmin, async (req, res) => {
  try {
    const requests = await LeaveService.getAllLeaveRequests();
    res.json({ requests });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get leave request by ID (admin)
router.get('/:id', checkAdmin, async (req, res) => {
  try {
    const request = await LeaveService.getLeaveRequestById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Pengajuan cuti tidak ditemukan' });
    }
    res.json({ request });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve leave request (admin)
router.post('/:id/approve', checkAdmin, async (req, res) => {
  try {
    const request = await LeaveService.approveLeaveRequest(req.params.id);
    res.json({
      message: 'Pengajuan cuti disetujui',
      request
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Reject leave request (admin)
router.post('/:id/reject', checkAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    const request = await LeaveService.rejectLeaveRequest(req.params.id, reason);
    res.json({
      message: 'Pengajuan cuti ditolak',
      request
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;

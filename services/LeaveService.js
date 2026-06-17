const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const LeaveRequest = require('../models/LeaveRequest');
const LeaveBalance = require('../models/LeaveBalance');

const LEAVE_FILE = path.join(__dirname, '../data/leaves.json');
const BALANCE_FILE = path.join(__dirname, '../data/leave-balances.json');

class LeaveService {
  // Initialize data files
  async initializeDataFiles() {
    try {
      await fs.access(LEAVE_FILE);
    } catch {
      const data = { leaves: [] };
      await fs.mkdir(path.dirname(LEAVE_FILE), { recursive: true });
      await fs.writeFile(LEAVE_FILE, JSON.stringify(data, null, 2));
      console.log('✅ Leave file initialized');
    }

    try {
      await fs.access(BALANCE_FILE);
    } catch {
      const data = { balances: [] };
      await fs.mkdir(path.dirname(BALANCE_FILE), { recursive: true });
      await fs.writeFile(BALANCE_FILE, JSON.stringify(data, null, 2));
      console.log('✅ Leave balance file initialized');
    }
  }

  // Get or create leave balance
  async getOrCreateLeaveBalance(pegawaiId, pegawaiName) {
    const data = await fs.readFile(BALANCE_FILE, 'utf8');
    const parsed = JSON.parse(data);
    const currentYear = new Date().getFullYear();

    let balance = parsed.balances.find(b => b.pegawaiId === pegawaiId && b.year === currentYear);

    if (!balance) {
      balance = new LeaveBalance(pegawaiId, pegawaiName, 12, 0, 12, currentYear);
      parsed.balances.push(balance);
      await fs.writeFile(BALANCE_FILE, JSON.stringify(parsed, null, 2));
    }

    return balance;
  }

  // Get leave balance
  async getLeaveBalance(pegawaiId) {
    const data = await fs.readFile(BALANCE_FILE, 'utf8');
    const parsed = JSON.parse(data);
    const currentYear = new Date().getFullYear();

    const balance = parsed.balances.find(b => b.pegawaiId === pegawaiId && b.year === currentYear);
    return balance || null;
  }

  // Create leave request
  async createLeaveRequest(pegawaiId, pegawaiName, startDate, endDate, type, reason) {
    // Validasi tanggal
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      throw new Error('Tanggal mulai tidak boleh lebih besar dari tanggal akhir');
    }

    // Hitung jumlah hari kerja
    const totalDays = LeaveRequest.calculateWorkDays(startDate, endDate);

    if (totalDays === 0) {
      throw new Error('Pengajuan cuti minimal 1 hari kerja');
    }

    // Cek saldo cuti
    const balance = await this.getOrCreateLeaveBalance(pegawaiId, pegawaiName);

    if (!balance.canTakeLeave(totalDays)) {
      // Jika kuota cuti tidak cukup, otomatis reject
      const leaveRequest = new LeaveRequest(
        uuidv4(),
        pegawaiId,
        pegawaiName,
        startDate,
        endDate,
        type,
        reason,
        totalDays,
        'rejected',
        new Date(),
        new Date()
      );

      const data = await fs.readFile(LEAVE_FILE, 'utf8');
      const parsed = JSON.parse(data);
      parsed.leaves.push(leaveRequest);
      await fs.writeFile(LEAVE_FILE, JSON.stringify(parsed, null, 2));

      throw new Error(`Pengajuan ditolak! Sisa cuti Anda: ${balance.remainingLeave} hari kerja, diminta: ${totalDays} hari kerja`);
    }

    // Buat pengajuan baru
    const leaveRequest = new LeaveRequest(
      uuidv4(),
      pegawaiId,
      pegawaiName,
      startDate,
      endDate,
      type,
      reason,
      totalDays,
      'pending'
    );

    const data = await fs.readFile(LEAVE_FILE, 'utf8');
    const parsed = JSON.parse(data);
    parsed.leaves.push(leaveRequest);
    await fs.writeFile(LEAVE_FILE, JSON.stringify(parsed, null, 2));

    return leaveRequest.toJSON();
  }

  // Get all leave requests
  async getAllLeaveRequests() {
    try {
      const data = await fs.readFile(LEAVE_FILE, 'utf8');
      const parsed = JSON.parse(data);
      return parsed.leaves;
    } catch (error) {
      console.error('Error reading leaves:', error);
      return [];
    }
  }

  // Get leave requests by pegawai
  async getLeaveRequestsByPegawai(pegawaiId) {
    const leaves = await this.getAllLeaveRequests();
    return leaves.filter(l => l.pegawaiId === pegawaiId);
  }

  // Get leave request by ID
  async getLeaveRequestById(id) {
    const leaves = await this.getAllLeaveRequests();
    return leaves.find(l => l.id === id);
  }

  // Approve leave request (admin)
  async approveLeaveRequest(id) {
    const data = await fs.readFile(LEAVE_FILE, 'utf8');
    const parsed = JSON.parse(data);

    const index = parsed.leaves.findIndex(l => l.id === id);
    if (index === -1) {
      throw new Error('Pengajuan cuti tidak ditemukan');
    }

    const leave = parsed.leaves[index];

    if (leave.status !== 'pending') {
      throw new Error('Hanya pengajuan dengan status "menunggu" yang bisa disetujui');
    }

    // Update status
    leave.status = 'approved';
    leave.updatedAt = new Date();

    // Update leave balance
    const balanceData = await fs.readFile(BALANCE_FILE, 'utf8');
    const balanceParsed = JSON.parse(balanceData);
    const currentYear = new Date().getFullYear();

    const balance = balanceParsed.balances.find(
      b => b.pegawaiId === leave.pegawaiId && b.year === currentYear
    );

    if (balance) {
      balance.usedLeave += leave.totalDays;
      balance.remainingLeave -= leave.totalDays;
    }

    parsed.leaves[index] = leave;
    await fs.writeFile(LEAVE_FILE, JSON.stringify(parsed, null, 2));
    await fs.writeFile(BALANCE_FILE, JSON.stringify(balanceParsed, null, 2));

    return leave;
  }

  // Reject leave request (admin)
  async rejectLeaveRequest(id, reason = '') {
    const data = await fs.readFile(LEAVE_FILE, 'utf8');
    const parsed = JSON.parse(data);

    const index = parsed.leaves.findIndex(l => l.id === id);
    if (index === -1) {
      throw new Error('Pengajuan cuti tidak ditemukan');
    }

    const leave = parsed.leaves[index];

    if (leave.status !== 'pending') {
      throw new Error('Hanya pengajuan dengan status "menunggu" yang bisa ditolak');
    }

    leave.status = 'rejected';
    leave.rejectionReason = reason;
    leave.updatedAt = new Date();

    parsed.leaves[index] = leave;
    await fs.writeFile(LEAVE_FILE, JSON.stringify(parsed, null, 2));

    return leave;
  }

  // Cancel leave request (pegawai)
  async cancelLeaveRequest(id, pegawaiId) {
    const data = await fs.readFile(LEAVE_FILE, 'utf8');
    const parsed = JSON.parse(data);

    const index = parsed.leaves.findIndex(l => l.id === id);
    if (index === -1) {
      throw new Error('Pengajuan cuti tidak ditemukan');
    }

    const leave = parsed.leaves[index];

    // Cek kepemilikan
    if (leave.pegawaiId !== pegawaiId) {
      throw new Error('Anda tidak bisa membatalkan pengajuan orang lain');
    }

    if (leave.status !== 'pending') {
      throw new Error('Hanya pengajuan dengan status "menunggu" yang bisa dibatalkan');
    }

    // Jika sudah disetujui dan dibatalkan, kembalikan saldo
    if (leave.status === 'approved') {
      const balanceData = await fs.readFile(BALANCE_FILE, 'utf8');
      const balanceParsed = JSON.parse(balanceData);
      const currentYear = new Date().getFullYear();

      const balance = balanceParsed.balances.find(
        b => b.pegawaiId === leave.pegawaiId && b.year === currentYear
      );

      if (balance) {
        balance.usedLeave -= leave.totalDays;
        balance.remainingLeave += leave.totalDays;
      }

      await fs.writeFile(BALANCE_FILE, JSON.stringify(balanceParsed, null, 2));
    }

    leave.status = 'cancelled';
    leave.updatedAt = new Date();

    parsed.leaves[index] = leave;
    await fs.writeFile(LEAVE_FILE, JSON.stringify(parsed, null, 2));

    return leave;
  }
}

module.exports = new LeaveService();

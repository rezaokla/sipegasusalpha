const { v4: uuidv4 } = require('uuid');

class LeaveRequest {
  constructor(id, pegawaiId, pegawaiName, startDate, endDate, type, reason, totalDays, status = 'pending', createdAt = new Date(), updatedAt = new Date()) {
    this.id = id;
    this.pegawaiId = pegawaiId;
    this.pegawaiName = pegawaiName;
    this.startDate = startDate;
    this.endDate = endDate;
    this.type = type; // 'cuti', 'izin'
    this.reason = reason;
    this.totalDays = totalDays;
    this.status = status; // 'pending', 'approved', 'rejected'
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static calculateWorkDays(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    let workDays = 0;

    // Loop melalui setiap hari
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      // 0 = Minggu, 6 = Sabtu
      const dayOfWeek = date.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workDays++;
      }
    }

    return workDays;
  }

  toJSON() {
    return {
      id: this.id,
      pegawaiId: this.pegawaiId,
      pegawaiName: this.pegawaiName,
      startDate: this.startDate,
      endDate: this.endDate,
      type: this.type,
      reason: this.reason,
      totalDays: this.totalDays,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = LeaveRequest;

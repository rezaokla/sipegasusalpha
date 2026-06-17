class LeaveBalance {
  constructor(pegawaiId, pegawaiName, annualLeave = 12, usedLeave = 0, remainingLeave = 12, year = new Date().getFullYear()) {
    this.pegawaiId = pegawaiId;
    this.pegawaiName = pegawaiName;
    this.annualLeave = annualLeave; // 12 hari kerja per tahun
    this.usedLeave = usedLeave;
    this.remainingLeave = remainingLeave;
    this.year = year;
  }

  canTakeLeave(days) {
    return this.remainingLeave >= days;
  }

  useLeave(days) {
    if (!this.canTakeLeave(days)) {
      throw new Error(`Kuota cuti tidak cukup. Sisa cuti: ${this.remainingLeave} hari, Diminta: ${days} hari`);
    }
    this.usedLeave += days;
    this.remainingLeave -= days;
  }

  resetAnnualLeave() {
    this.usedLeave = 0;
    this.remainingLeave = this.annualLeave;
  }

  toJSON() {
    return {
      pegawaiId: this.pegawaiId,
      pegawaiName: this.pegawaiName,
      annualLeave: this.annualLeave,
      usedLeave: this.usedLeave,
      remainingLeave: this.remainingLeave,
      year: this.year
    };
  }
}

module.exports = LeaveBalance;

const bcrypt = require('bcryptjs');

class User {
  constructor(id, email, nip, name, password, role, department = '', createdAt = new Date(), updatedAt = new Date()) {
    this.id = id;
    this.email = email;
    this.nip = nip;
    this.name = name;
    this.password = password;
    this.role = role; // 'admin', 'pegawai', 'pimpinan'
    this.department = department;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  // Hash password sebelum menyimpan
  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 10);
  }

  // Verify password
  async verifyPassword(plainPassword) {
    return await bcrypt.compare(plainPassword, this.password);
  }

  // Convert to JSON (hide password)
  toJSON() {
    const { password, ...rest } = this;
    return rest;
  }
}

module.exports = User;

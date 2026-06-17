const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');

const DATA_FILE = path.join(__dirname, '../data/users.json');

class UserService {
  // Initialize data file jika belum ada
  async initializeDataFile() {
    try {
      await fs.access(DATA_FILE);
    } catch {
      const defaultAdmin = new User(
        uuidv4(),
        'admin@kursus.go.id',
        '001',
        'Admin SDM',
        'admin123',
        'admin',
        'Kepegawaian'
      );
      await defaultAdmin.hashPassword();
      
      const data = {
        users: [defaultAdmin]
      };
      
      await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
      await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
      console.log('✅ Data file initialized with default admin');
    }
  }

  // Read all users
  async getAllUsers() {
    try {
      const data = await fs.readFile(DATA_FILE, 'utf8');
      const { users } = JSON.parse(data);
      return users.map(u => ({
        ...u,
        password: undefined // Jangan kembalikan password
      }));
    } catch (error) {
      console.error('Error reading users:', error);
      return [];
    }
  }

  // Get user by ID
  async getUserById(id) {
    const users = await this.getAllUsers();
    return users.find(u => u.id === id);
  }

  // Get user by email or NIP
  async getUserByEmailOrNip(email, nip) {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    const { users } = JSON.parse(data);
    return users.find(u => u.email === email || u.nip === nip);
  }

  // Create new user
  async createUser(email, nip, name, password, role, department = '') {
    // Validasi duplikat
    const existing = await this.getUserByEmailOrNip(email, nip);
    if (existing) {
      throw new Error('Email atau NIP sudah terdaftar');
    }

    const user = new User(
      uuidv4(),
      email,
      nip,
      name,
      password,
      role,
      department
    );

    await user.hashPassword();

    const data = await fs.readFile(DATA_FILE, 'utf8');
    const parsed = JSON.parse(data);
    parsed.users.push(user);

    await fs.writeFile(DATA_FILE, JSON.stringify(parsed, null, 2));
    return user.toJSON();
  }

  // Update user
  async updateUser(id, updates) {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    const parsed = JSON.parse(data);
    
    const index = parsed.users.findIndex(u => u.id === id);
    if (index === -1) {
      throw new Error('User tidak ditemukan');
    }

    const user = parsed.users[index];
    
    // Update fields yang diizinkan
    if (updates.name) user.name = updates.name;
    if (updates.department) user.department = updates.department;
    if (updates.role) user.role = updates.role;
    if (updates.password) {
      user.password = updates.password;
      user.password = await require('bcryptjs').hash(user.password, 10);
    }
    
    user.updatedAt = new Date();
    parsed.users[index] = user;

    await fs.writeFile(DATA_FILE, JSON.stringify(parsed, null, 2));
    return user.toJSON();
  }

  // Delete user
  async deleteUser(id) {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    const parsed = JSON.parse(data);
    
    const initialLength = parsed.users.length;
    parsed.users = parsed.users.filter(u => u.id !== id);
    
    if (parsed.users.length === initialLength) {
      throw new Error('User tidak ditemukan');
    }

    await fs.writeFile(DATA_FILE, JSON.stringify(parsed, null, 2));
    return { message: 'User berhasil dihapus' };
  }

  // Authenticate user
  async authenticateUser(email, password) {
    const user = await this.getUserByEmailOrNip(email, null);
    if (!user) {
      throw new Error('Email tidak ditemukan');
    }

    const isPasswordValid = await require('bcryptjs').compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Password salah');
    }

    return user.toJSON();
  }
}

module.exports = new UserService();

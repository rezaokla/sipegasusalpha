# Pegawaiku - Sistem Informasi Pegawai

Aplikasi manajemen SDM (Sumber Daya Manusia) untuk mengelola data pegawai, presensi, cuti, dan program kerja.

## 🚀 Fitur

- ✅ Autentikasi user (Admin, Pegawai, Pimpinan)
- ✅ Manajemen user - Admin dapat membuat, edit, hapus akun
- ✅ Dashboard ringkasan
- ✅ Manajemen presensi
- ✅ Manajemen cuti/izin
- ✅ Laporan dan analitik
- ✅ Program & anggaran

## 📋 Prerequisites

- Node.js v14+ 
- npm atau yarn

## 🔧 Instalasi

1. Clone repository
```bash
git clone https://github.com/rezaokla/sipegasusalpha.git
cd sipegasusalpha
```

2. Install dependencies
```bash
npm install
```

3. Setup environment variables
```bash
cp .env.example .env
```

4. Jalankan server
```bash
npm run dev
```

Server akan berjalan di `http://localhost:3000`

## 📝 Default Credentials

**Email**: `admin@kursus.go.id`  
**Password**: `admin123`  
**Role**: Admin SDM

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### User Management (Admin Only)
- `GET /api/users` - Daftar semua user
- `GET /api/users/:id` - Detail user
- `POST /api/users` - Buat user baru
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Hapus user

## 📦 Project Structure

```
├── public/              # Frontend files (HTML, CSS, JS)
├── routes/              # API routes
├── models/              # Data models
├── services/            # Business logic
├── data/                # Data storage
├── server.js            # Entry point
├── package.json         # Dependencies
└── .env                 # Environment variables
```

## 🛠️ Development

Untuk development dengan auto-reload:
```bash
npm run dev
```

Untuk production:
```bash
npm start
```

## 📄 License

ISC

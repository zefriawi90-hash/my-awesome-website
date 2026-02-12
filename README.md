# Private Storage System

Sistem Penyimpanan Pribadi dengan Login dan Pemantauan

## Fitur

- 🔐 **Sistem Login/Register** - Autentikasi aman untuk setiap pengguna
- 📁 **Penyimpanan Data** - Simpan data pribadi dengan kategori
- 👥 **Multi-User** - Mendukung banyak pengguna
- 📊 **Panel Admin** - Pantau semua aktivitas pengguna
- 📝 **Log Login** - Catatan aktivitas login lengkap
- 🌙 **Dark Mode** - Tampilan gelap untuk kenyamanan mata
- 📱 **Responsif** - Tampilan optimal di semua perangkat

## Instalasi

1. Pastikan Node.js sudah terinstal (v14 atau lebih baru)
2. Clone atau download project ini
3. Install dependencies:

```bash
npm install
```

4. Jalankan server:

```bash
npm start
```

5. Buka browser dan akses: http://localhost:3000

## Akun Default

### Admin
- **Username:** admin
- **Password:** admin123

### User Baru
- Daftar akun baru melalui halaman Register

## Struktur Project

```
my-awesome-website/
├── server.js          # Backend server Node.js
├── storage.db         # Database SQLite (auto-generate)
├── package.json       # Dependencies
├── index.html         # Halaman utama
├── css/
│   └── style.css      # Styling
└── js/
    ├── main.js       # Fungsi utama & utilitas
    ├── auth.js       # Sistem autentikasi
    ├── dashboard.js  # Dashboard user
    └── admin.js      # Panel admin
```

## API Endpoints

### Autentikasi
- `POST /api/auth/register` - Registrasi user baru
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Cek status login

### Data User
- `GET /api/data` - Ambil semua data user
- `POST /api/data` - Tambah data baru
- `PUT /api/data/:id` - Update data
- `DELETE /api/data/:id` - Hapus data

### Admin
- `GET /api/admin/stats` - Statistik admin
- `GET /api/admin/users` - Daftar semua user
- `GET /api/admin/logs` - Log login
- `GET /api/admin/user/:id/data` - Lihat data user
- `DELETE /api/admin/user/:id` - Hapus user

## Keamanan

- Password dienkripsi dengan bcrypt
- JWT token untuk autentikasi
- Validasi input di server
- Proteksi route admin

## Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Backend:** Node.js, Express
- **Database:** SQLite (better-sqlite3)
- **Auth:** JWT, bcryptjs

## Lisensi

MIT License

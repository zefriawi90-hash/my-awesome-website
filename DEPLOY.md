# Cara Deploy ke Internet (Semua Wifi)

## Opsi 1: Deploy ke Render.com (Gratis)

### Langkah 1: Upload ke GitHub
1. Buat akun di https://github.com
2. Buat repository baru (misal: "my-awesome-website")
3. Upload semua file dari folder `my-awesome-website` ke GitHub

### Langkah 2: Deploy ke Render
1. Buka https://render.com
2. Login dengan GitHub
3. Klik "New +" → "Blueprint"
4. Connect ke repository GitHub yang sudah dibuat
5. Klik "Apply Blueprint"
6. Tunggu 2-3 menit sampai deploy selesai

### Langkah 3: Akses
- Nanti dapat URL seperti: `https://my-awesome-website.onrender.com`
- Buka di browser HP atau komputer lain
- Login dengan: `admin` / `admin123`

---

## Opsi 2: Pakai Ngrok (cepat, sementara)

```bash
# Install ngrok
npm install -g ngrok

# Jalankan server dulu
cd my-awesome-website
node server.js

# Buka terminal lain, jalankan ngrok
ngrok http 3000
```

Nanti dapat link public yang bisa diakses dari wifi mana saja.

---

## Catatan
- Untuk login dari HP, cukup akses URL yang sudah di-deploy
- Tidak perlu wifi yang sama
- Data akan tersimpan di cloud (Render)

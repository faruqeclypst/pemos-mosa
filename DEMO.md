# Demo Penggunaan Fitur Baru

## 🎯 Demo Fitur Triple-Click Edit Total Poin

### Langkah 1: Buka Admin Dashboard
1. Login sebagai admin
2. Buka tab **Hasil**
3. Pilih sub-tab **Perangkingan**

### Langkah 2: Edit Total Poin
1. Lihat tabel perangkingan kandidat
2. **Klik 3x** pada nilai **Total Poin** kandidat yang ingin diedit
3. Masukkan nilai baru pada prompt (contoh: dari 15 menjadi 20)
4. Klik **OK**

### Langkah 3: Lihat Perubahan Real-time
- ✅ Total poin langsung berubah
- ✅ Grafik bar chart terupdate
- ✅ Grafik pie chart terupdate
- ✅ Perangkingan berubah otomatis
- ✅ Indikator "Last Updated" berubah

---

## 📊 Demo Fitur Export Excel Token

### Langkah 1: Buka Tab Token
1. Pilih tab **Token** di admin dashboard
2. Pilih filter yang diinginkan:
   - **Semua**: Semua token
   - **Guru**: Hanya token guru
   - **Kelas tertentu**: Token siswa kelas tertentu

### Langkah 2: Export ke Excel
1. Klik tombol **"Export Excel"**
2. File CSV akan otomatis terdownload
3. Nama file: `tokens_[filter]_[tanggal].csv`

### Langkah 3: Buka di Excel
1. Buka file CSV di Excel
2. Data akan tersusun dalam kolom:
   - Token | Tipe | Kelas/Guru | Status | Tanggal Dibuat

---

## 🔒 Demo Fitur Transparansi Detail Votes

### Langkah 1: Buka Detail Votes
1. Buka tab **Hasil** → **Detail Votes**
2. Lihat tabel detail semua voting

### Langkah 2: Perhatikan Keamanan
- ❌ **Token TIDAK DITAMPILKAN**
- ✅ Hanya **Tipe Voter** (Siswa/Guru)
- ✅ **Poin** dan **Tanggal** tetap lengkap
- ✅ **Aksi Edit** tetap tersedia untuk admin

### Langkah 3: Edit Nilai Vote (Opsional)
1. Klik tombol **Edit** (ikon pensil)
2. Ubah nilai poin
3. Klik **Update**
4. Perubahan langsung terlihat di semua grafik

---

## 🔄 Demo Auto-Update Grafik

### Langkah 1: Edit Total Poin
1. Gunakan fitur triple-click untuk edit total poin
2. Ubah nilai kandidat tertentu

### Langkah 2: Lihat Update Otomatis
1. **Overview Tab**: Pie chart dan statistik terupdate
2. **Perangkingan Tab**: Tabel ranking terupdate
3. **Grafik Tab**: Bar chart terupdate
4. **Detail Votes Tab**: Data voting tetap konsisten

### Langkah 3: Monitor Perubahan
- Indikator **"Last Updated"** berubah di setiap tab
- Semua grafik konsisten tanpa refresh
- Data real-time dan akurat

---

## 💡 Tips dan Trik

### Untuk Edit Total Poin:
- **Klik 3x** dalam waktu 300ms
- Nilai tidak boleh negatif
- Pastikan ada vote untuk kandidat
- Perubahan langsung terlihat di semua grafik

### Untuk Export Token:
- Filter dulu sesuai kebutuhan
- File CSV kompatibel dengan Excel
- Nama file otomatis sesuai filter dan tanggal

### Untuk Monitoring:
- Gunakan indikator "Last Updated"
- Semua tab akan konsisten
- Tidak perlu refresh halaman

---

## 🚨 Troubleshooting

### Jika Edit Total Poin Gagal:
1. Pastikan ada vote untuk kandidat
2. Nilai tidak boleh negatif
3. Cek koneksi internet
4. Refresh halaman jika perlu

### Jika Export Gagal:
1. Pastikan browser mendukung download
2. Cek popup blocker
3. Coba browser berbeda
4. Pastikan ada token untuk diexport

### Jika Grafik Tidak Update:
1. Tunggu beberapa detik
2. Cek indikator "Last Updated"
3. Refresh halaman jika perlu
4. Pastikan ada perubahan data

---

## 📱 Responsivitas

### Desktop:
- Semua fitur tersedia
- Grafik full-size
- Tabel lengkap dengan semua kolom

### Tablet:
- Grafik responsive
- Tabel dengan scroll horizontal
- Tombol export tetap mudah diakses

### Mobile:
- Grafik mobile-friendly
- Tabel dengan scroll
- Tombol export di bagian bawah

---

## 🔐 Keamanan

### Admin Only:
- Edit total poin hanya untuk admin
- Export token hanya untuk admin
- Edit nilai vote hanya untuk admin

### Data Protection:
- Token tidak ditampilkan di detail votes
- Validasi input untuk mencegah error
- Audit trail untuk semua perubahan

### Access Control:
- Login required untuk semua fitur admin
- Role-based access control
- Session management

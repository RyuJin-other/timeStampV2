# Kebijakan Privasi untuk Time Sync - NTP Clock

**Tanggal Berlaku:** 7 Februari 2026  
**Terakhir Diperbarui:** 7 Februari 2026

## Pendahuluan

Time Sync - NTP Clock ("kami", "milik kami", atau "ekstensi") berkomitmen untuk melindungi privasi Anda. Kebijakan Privasi ini menjelaskan bagaimana ekstensi browser kami menangani data dan hak privasi Anda.

**Pengembang:** A.res.t  
**Halaman Ekstensi:** https://github.com/RyuJin-other/timeStampV2

## Pengumpulan dan Penggunaan Data

### Informasi yang TIDAK Kami Kumpulkan

Time Sync - NTP Clock TIDAK mengumpulkan, menyimpan, mengirimkan, atau membagikan informasi berikut:

- Informasi identitas pribadi (nama, email, alamat, nomor telepon)
- Riwayat atau aktivitas browsing
- Kredensial atau kata sandi pengguna
- Data lokasi di luar yang Anda konfigurasi secara sukarela
- Cookie atau pengenal pelacakan
- Analitik atau statistik penggunaan
- Informasi perangkat atau spesifikasi sistem
- Alamat IP untuk tujuan pelacakan

### Informasi yang Disimpan Secara Lokal

Ekstensi ini menyimpan pengaturan berikut **HANYA SECARA LOKAL di perangkat Anda** menggunakan API penyimpanan lokal browser:

- **Alamat Server NTP:** Server waktu pilihan Anda (misalnya, pool.ntp.org)
- **Interval Auto-Sync:** Frekuensi sinkronisasi otomatis yang Anda pilih (dalam detik)
- **Timestamp Sinkronisasi Terakhir:** Waktu sinkronisasi terakhir yang berhasil
- **Status Auto-Sync:** Apakah sinkronisasi otomatis diaktifkan atau tidak
- **Preferensi Jendela:** Pengaturan tampilan untuk mode jendela terpisah (jika ada)

**Penting:** Data ini:

- Tidak pernah meninggalkan perangkat Anda
- Tidak dikirimkan ke server manapun
- Tidak dapat diakses oleh pengembang
- Dapat dihapus dengan mencopot ekstensi atau menghapus data browser

## Permintaan Jaringan

### Layanan Sinkronisasi Waktu

Ekstensi melakukan permintaan jaringan **HANYA** untuk tujuan mengambil data waktu yang akurat dari layanan waktu terpercaya berikut:

1. **WorldTimeAPI** (worldtimeapi.org)
2. **TimeAPI.io** (timeapi.io)
3. **Google Public NTP** (google.com)
4. **NIST Time Services** (nist.gov)

### Data yang Dikirim dalam Permintaan Jaringan

Saat melakukan sinkronisasi waktu, ekstensi mengirim:

- Header permintaan HTTP/HTTPS standar (diperlukan untuk komunikasi web)
- Tidak ada informasi pribadi
- Tidak ada pengenal pelacakan
- Tidak ada data spesifik pengguna

### Data yang Diterima

Ekstensi menerima:

- Informasi waktu UTC saat ini
- Header respons server (termasuk cap waktu/tanggal)
- Data respons HTTP standar

Semua data yang diterima digunakan hanya untuk menampilkan waktu yang akurat dan tidak disimpan secara permanen.

## Penjelasan Izin

Ekstensi meminta izin berikut, yang digunakan secara eksklusif sebagaimana dijelaskan:

### 1. Izin Storage (Penyimpanan)

- **Tujuan:** Untuk menyimpan preferensi Anda (server NTP, interval sinkronisasi) secara lokal di perangkat Anda
- **Cakupan:** Hanya penyimpanan lokal
- **Akses Data:** Pengaturan yang Anda konfigurasi dalam ekstensi

### 2. Host Permissions (Izin Host)

Ekstensi memerlukan akses ke domain berikut untuk sinkronisasi waktu:

- `https://worldtimeapi.org/*` - Layanan waktu WorldTimeAPI
- `https://timeapi.io/*` - Layanan waktu TimeAPI.io
- `https://www.google.com/*` - Layanan waktu Google
- `https://www.nist.gov/*` - Layanan waktu NIST (National Institute of Standards and Technology)

**Penting:** Izin ini digunakan HANYA untuk mengambil data waktu. Ekstensi tidak:

- Mengakses konten dari situs web lain yang Anda kunjungi
- Memodifikasi halaman web
- Menyisipkan skrip ke situs lain
- Membaca atau memodifikasi data browsing Anda

## Layanan Pihak Ketiga

Ekstensi menggunakan layanan waktu eksternal untuk menyediakan sinkronisasi waktu yang akurat. Layanan tersebut adalah:

- **WorldTimeAPI** - https://worldtimeapi.org
- **TimeAPI.io** - https://timeapi.io
- **Google Public NTP** - Bagian dari layanan publik Google
- **NIST Time Services** - Layanan waktu pemerintah AS

Kami tidak mengontrol layanan pihak ketiga ini dan tidak bertanggung jawab atas praktik privasi mereka. Layanan ini mungkin memiliki kebijakan privasi mereka sendiri.

## Keamanan Data

- Semua permintaan jaringan menggunakan enkripsi HTTPS
- Tidak ada data yang dikirimkan ke server kami (kami tidak mengoperasikan server apapun)
- Pengaturan disimpan menggunakan API penyimpanan aman browser
- Tidak ada alat analitik atau pelacakan pihak ketiga yang digunakan

## Privasi Anak-anak

Time Sync - NTP Clock tidak dengan sengaja mengumpulkan informasi apapun dari siapapun, termasuk anak-anak di bawah usia 13 tahun. Ekstensi tidak memerlukan informasi pribadi apapun untuk berfungsi.

## Hak Privasi Anda

Anda memiliki hak untuk:

- **Akses:** Melihat semua pengaturan yang disimpan secara lokal melalui antarmuka pengaturan ekstensi
- **Hapus:** Menghapus semua data yang disimpan dengan mencopot ekstensi atau menghapus data browser
- **Kontrol:** Mengaktifkan atau menonaktifkan ekstensi kapan saja
- **Opt-out:** Berhenti menggunakan layanan ekstensi dengan menonaktifkan atau mencopot instalasinya

## Perubahan pada Kebijakan Privasi Ini

Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu. Kami akan memberi tahu pengguna tentang perubahan material dengan:

- Memperbarui tanggal "Terakhir Diperbarui" di bagian atas kebijakan ini
- Menyertakan informasi pembaruan dalam pembaruan ekstensi (bila berlaku)

Penggunaan ekstensi yang berkelanjutan setelah perubahan merupakan penerimaan atas kebijakan yang diperbarui.

## Kepatuhan

Ekstensi ini mematuhi:

- Kebijakan Program Pengembang Chrome Web Store
- Prinsip-prinsip General Data Protection Regulation (GDPR)
- Prinsip-prinsip California Consumer Privacy Act (CCPA)
- Children's Online Privacy Protection Act (COPPA)

## Komitmen Transparansi

Kami percaya pada transparansi penuh:

✅ **Tidak ada pengumpulan data** - Kami tidak mengumpulkan data pengguna apapun  
✅ **Tidak ada pelacakan** - Tidak ada analitik, piksel, atau kode pelacakan  
✅ **Tidak ada iklan** - Ekstensi sepenuhnya bebas iklan  
✅ **Tidak ada monetisasi** - Kami tidak menjual data atau menampilkan iklan  
✅ **Open source** - Kode tersedia untuk ditinjau di repositori GitHub kami  
✅ **Penyimpanan lokal saja** - Semua pengaturan tetap di perangkat Anda

## Informasi Kontak

Jika Anda memiliki pertanyaan, kekhawatiran, atau permintaan terkait Kebijakan Privasi ini atau praktik privasi ekstensi, silakan hubungi kami:

- **Email:** testvurn@gmail.com
- **GitHub Issues:** https://github.com/RyuJin-other/timeStampV2/issues
- **Pengembang:** A.res.t

Kami akan menanggapi pertanyaan terkait privasi dalam waktu 30 hari.

## Persetujuan

Dengan menginstal dan menggunakan Time Sync - NTP Clock, Anda mengakui bahwa Anda telah membaca dan memahami Kebijakan Privasi ini dan menyetujui ketentuannya.

---

**Catatan:** Kebijakan privasi ini hanya berlaku untuk ekstensi browser Time Sync - NTP Clock dan tidak berlaku untuk layanan, situs web, atau aplikasi pihak ketiga yang mungkin diakses melalui ekstensi.

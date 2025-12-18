# 🕐 Time Sync Browser Extension

Synchronize your computer time with NTP servers directly from your browser!

## 📦 Files Structure

```
time-sync-extension/
├── manifest.json          # Extension configuration
├── popup.html            # Main popup interface
├── window.html           # Draggable floating window
├── background.js         # Service worker
├── icons/
│   ├── src/icons/clock-24_.png       
└── README.md            # This file
```

## 🚀 Quick Start - Cara 2 (Detached Window)

### Langkah Cepat:
1. Install extension (lihat Installation Guide di bawah)
2. Click icon Time Sync di toolbar
3. Click tombol **"Detach"** di pojok kanan atas
4. Window terpisah terbuka - **Drag title bar** untuk pindahkan!
5. Done! Window sekarang bisa dipindah-pindahkan ke mana saja 🎉

### Controls:
- **Drag title bar** = Pindahkan window
- **⬆ button** = Always on top toggle
- **⬜ button** = Compact mode toggle  
- **✕ button** = Close window

📖 **Detail lengkap:** Lihat `DETACH_WINDOW_GUIDE.md`

---

## 🚀 Installation Guide

### For Chrome/Edge/Brave

1. **Prepare Files**
   - Save `popup.html` dari artifact pertama
   - Save `manifest.json` dari artifact kedua
   - Save `background.js` dari artifact ketiga
   - Create folder `icons/` dan tambahkan icon (atau gunakan placeholder)

2. **Load Extension**
   - Open Chrome and go to: `chrome://extensions/`
   - Enable **Developer mode** (toggle di kanan atas)
   - Click **Load unpacked**
   - Select folder `time-sync-extension/`

3. **Done!**
   - Extension icon akan muncul di toolbar
   - Click icon untuk membuka popup

### For Firefox

1. **Prepare Files** (sama seperti di atas)

2. **Load Extension**
   - Open Firefox and go to: `about:debugging#/runtime/this-firefox`
   - Click **Load Temporary Add-on**
   - Select file `manifest.json` dari folder extension

3. **Note**: Firefox temporary add-on akan hilang setelah browser ditutup. Untuk permanent, perlu sign dan publish ke Mozilla Add-ons.

## 🎨 Creating Icons (Optional)

Jika belum punya icon, buat placeholder sederhana:

**Option 1**: Generate dengan tool online
- Gunakan: https://favicon.io/ atau https://realfavicongenerator.net/
- Upload logo atau buat text-based icon
- Download dalam ukuran 16x16, 48x48, 128x128

**Option 2**: Gunakan emoji sebagai icon
```html
<!-- Buat file HTML sederhana, screenshot, lalu crop -->
<div style="font-size: 100px;">🕐</div>
```

**Option 3**: Skip icons sementara
- Comment out bagian `icons` di manifest.json
- Extension tetap berfungsi, hanya tanpa icon custom

## ✨ Features

- ✅ Real-time clock display (Server & Local PC time)
- ✅ One-click time synchronization
- ✅ Auto-sync with countdown timer
- ✅ **Detachable popup window** - Click "Detach" button to open in separate movable window
- ✅ **Draggable floating window** (window.html) - Can be moved anywhere on screen
- ✅ **Compact mode** - Toggle between normal and compact view
- ✅ Multiple NTP server options (pool.ntp.org, time.google.com, dll)
- ✅ Customizable sync interval
- ✅ Auto-save settings with Chrome Storage API
- ✅ 4-layer fallback system untuk reliability
- ✅ Beautiful, modern UI with gradient title bar

## 🛠️ How to Use

1. **Standard Popup Mode**
   - Click extension icon di toolbar
   - Popup akan muncul seperti biasa
   - Click "Detach" button untuk membuka dalam window terpisah

2. **Floating Window Mode**
   - Open `window.html` untuk draggable floating window
   - **Drag** title bar untuk memindahkan window
   - Click **compact button** untuk toggle compact mode
   - Window bisa dipindah-pindah ke mana saja!

3. **Manual Sync**
   - Click "Sync Now" button
   - Status akan update dengan perbedaan waktu

4. **Auto Sync**
   - Click "Auto Sync" button
   - Timer countdown akan muncul
   - Otomatis sync setiap interval yang ditentukan

5. **Settings**
   - Click "Settings" button
   - Ubah NTP server atau gunakan Quick Select
   - Sesuaikan interval auto-sync (minimal 10 detik)
   - Settings tersimpan otomatis

## 🔧 Troubleshooting

### Extension tidak muncul
- Pastikan Developer Mode aktif
- Reload extension: klik refresh icon di chrome://extensions/

### Sync gagal
- Check koneksi internet
- Coba server NTP lain dari Quick Select
- Extension menggunakan fallback system, minimal akan gunakan "Simulated" mode

### Settings tidak tersimpan
- Pastikan permission `storage` ada di manifest.json
- Check console log: klik kanan extension > Inspect popup

## 📝 Technical Details

**Manifest Version**: 3 (Latest)
**Permissions**: 
- `storage` - untuk menyimpan settings
- Host permissions untuk time API services

**APIs Used**:
1. WorldTimeAPI (primary)
2. TimeAPI.io (secondary)
3. Google HTTP Header (tertiary)
4. Simulated sync (fallback)

## 🎯 Browser Compatibility

| Browser | Status | Notes |
|---------|--------|-------|
| Chrome 88+ | ✅ Full support | Manifest V3 |
| Edge 88+ | ✅ Full support | Chromium-based |
| Brave | ✅ Full support | Chromium-based |
| Firefox 109+ | ✅ Full support | Manifest V3 |
| Opera | ✅ Full support | Chromium-based |

## 🚀 Future Features (Ideas)

- [ ] Notification saat time difference > 1 detik
- [ ] Dark mode toggle
- [ ] Multiple timezone display
- [ ] Sync history log
- [ ] Export/import settings
- [ ] Keyboard shortcuts

## 📄 License

Free to use and modify for personal projects.

## 🤝 Contributing

Suggestions and improvements are welcome!

---

**Made with ❤️ for accurate time synchronization**

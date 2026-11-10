# Development Plan — GIT QUEST

## 1. Strategi

Kembangkan game secara bertahap. Prioritasnya adalah membuktikan satu siklus belajar yang lengkap sebelum menambahkan seluruh level dan aset.

## 2. Tahapan kerja

| Tahap | Aktivitas | Output |
|---|---|---|
| 1. Validasi materi | Cocokkan soal dengan modul Git | Matriks materi |
| 2. Finalisasi GDD | Setujui storyboard, aturan, dan batasan | Dokumen baseline |
| 3. Wireframe | Desain splash, profil, dashboard, materi, tantangan, hasil | Wireframe |
| 4. Visual prototype | Buat palet, tombol, panel, karakter dan satu background | UI kit |
| 5. Core gameplay | Navigasi, data level, validasi soal, feedback | Gameplay dasar |
| 6. Local save | `localStorage`, load save, autosave, reset | Progres lokal |
| 7. Level content | Implementasi materi dan tantangan seluruh level | Level lengkap |
| 8. Export/import | Cadangan progres JSON | Portabilitas manual |
| 9. Testing | Uji fungsi, browser, aksesibilitas, dan akurasi materi | Laporan uji |
| 10. Deployment | Hosting statis atau server lokal sekolah | Versi rilis |

## 3. Prioritas MVP

MVP wajib:
1. Splash screen.
2. Profil lokal sederhana.
3. Dashboard/peta.
4. Satu level lengkap.
5. Minimal dua tipe tantangan.
6. Feedback pembelajaran.
7. Skor dan XP.
8. Penyimpanan dan pemuatan progres dengan LocalStorage.
9. Halaman hasil misi.

Setelah MVP disetujui guru dan siswa uji coba, lanjutkan level lain.

## 4. Struktur folder yang disarankan

```text
git-quest/
├── index.html
├── assets/
│   ├── images/
│   │   ├── characters/
│   │   ├── backgrounds/
│   │   └── icons/
│   ├── audio/
│   └── fonts/
├── css/
│   ├── reset.css
│   ├── variables.css
│   ├── style.css
│   └── responsive.css
├── js/
│   ├── app.js
│   ├── navigation.js
│   ├── game-state.js
│   ├── storage.js
│   ├── scoring.js
│   ├── terminal-simulator.js
│   └── levels/
│       ├── level-vcs.js
│       ├── level-three-zones.js
│       ├── level-cli.js
│       ├── level-commits.js
│       └── level-gitignore.js
├── data/
│   ├── missions.json
│   └── questions.json
├── docs/
│   ├── storyboard.md
│   ├── design.md
│   ├── game_rules.md
│   ├── requirements.md
│   └── development_plan.md
└── README.md
```

Struktur dapat disederhanakan jika proyek masih dikerjakan satu orang, tetapi pemisahan data, penyimpanan, tampilan, dan logika gameplay tetap dianjurkan.

## 5. Rekomendasi implementasi LocalStorage

- Buat modul `storage.js` khusus untuk `saveGame()`, `loadGame()`, `resetGame()`, `exportSave()`, dan `importSave()`.
- Gunakan satu key dengan versi, misalnya `gitQuestSave_v1`.
- Bungkus operasi JSON parse/stringify dengan `try/catch`.
- Periksa ketersediaan LocalStorage sebelum menyimpan.
- Simpan setelah perubahan progres, bukan hanya ketika pemain keluar.
- Validasi struktur file saat impor.
- Jika format save berubah, buat proses migrasi versi atau beri pesan bahwa save lama tidak kompatibel.

## 6. Kriteria penerimaan MVP

- Game dapat dibuka tanpa backend dan database.
- Satu misi dapat dimainkan dari awal sampai hasil.
- Jawaban benar/salah memicu feedback yang sesuai.
- Skor dan XP dihitung sesuai aturan.
- Setelah reload browser, progres masih dapat dimuat pada origin yang sama.
- Tombol reset meminta konfirmasi.
- Kegagalan LocalStorage ditangani dengan pesan yang mudah dipahami.
- Terminal hanya menjalankan simulasi whitelist.
- Materi dan kunci jawaban telah diperiksa guru.
- Tampilan tidak terpotong pada resolusi desktop target.

## 7. Rencana pengujian

### Pengujian fungsional
- Membuat profil baru.
- Memilih profil lama.
- Memulai dan menyelesaikan misi.
- Jawaban benar dan salah.
- Menggunakan petunjuk.
- Mengulang misi.
- Membuka level setelah memenuhi nilai.
- Menyimpan dan memuat progres.
- Mengekspor dan mengimpor save.
- Reset progres.

### Pengujian kompatibilitas
- Chrome dan Edge.
- Ukuran 1366×768 dan 1920×1080.
- Reload halaman dan buka ulang browser.
- Uji penyimpanan pada mode normal dan catat perilaku mode privat.

### Pengujian pembelajaran
- Guru memeriksa kesesuaian materi, kunci, dan penjelasan.
- Siswa uji coba diminta menyelesaikan misi tanpa arahan.
- Catat bagian instruksi yang membingungkan.
- Perbaiki soal yang ambigu dan tingkat kesulitan yang tidak sesuai.

## 8. Risiko

| Risiko | Mitigasi |
|---|---|
| Progres terhapus | Fitur ekspor JSON dan peringatan sebelum reset |
| Progres tidak bisa pindah perangkat otomatis | Jelaskan batasan dan sediakan ekspor/impor |
| Skor dapat dimanipulasi | Gunakan hanya untuk latihan formatif |
| Siswa berbagi komputer | Profil lokal atau ekspor setiap sesi |
| Browser membatasi penyimpanan | Tangani error dan uji pada browser target |
| Terminal disalahgunakan | Simulator whitelist tanpa shell |
| Aset membuat game lambat | Kompres dan gunakan ukuran aset sesuai kebutuhan |

## 9. Pengembangan lanjutan (di luar MVP)

Jika kelak diperlukan leaderboard lintas perangkat, dashboard guru terpusat, login aman, atau rekap nilai sekolah, proyek perlu ditingkatkan dengan backend dan penyimpanan server. Fitur itu tidak termasuk versi tanpa database ini.

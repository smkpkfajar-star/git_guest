# Design — GIT QUEST: The Repository Chronicles

## 1. Arah visual

**Style:** 2D Pixel Art + Modern Cyberpunk UI.  
Visual harus terasa seperti game petualangan teknologi untuk remaja SMK, bukan aplikasi ujian dan bukan game anak usia dini.

Prinsip:
- Ilustrasi pixel art untuk karakter, lingkungan, dan dekorasi.
- UI modern yang rapi agar teks dan instruksi mudah dibaca.
- Glow neon digunakan secukupnya.
- Animasi pendek dan tidak mengganggu fokus.
- Prioritaskan keterbacaan materi dan perintah terminal.

## 2. Design tokens

### Warna

| Token | Hex | Fungsi |
|---|---|---|
| `--bg` | `#111827` | Latar utama |
| `--surface` | `#1F2937` | Kartu/panel |
| `--surface-2` | `#273449` | Panel sekunder |
| `--blue` | `#2563EB` | Tombol utama/navigasi |
| `--purple` | `#A855F7` | Aksen dunia/level |
| `--green` | `#22C55E` | Feedback berhasil |
| `--yellow` | `#EAB308` | XP dan reward |
| `--red` | `#EF4444` | Feedback kesalahan |
| `--text` | `#F9FAFB` | Teks utama |
| `--muted` | `#9CA3AF` | Teks sekunder |

Warna bukan satu-satunya penanda status. Gunakan ikon dan label seperti “Benar”, “Belum tepat”, “Terkunci”, atau “Selesai”.

## 3. Tipografi

- Logo/judul dekoratif: pixel font seperti Press Start 2P, digunakan terbatas.
- Heading dan isi: Inter atau sans-serif sistem.
- Terminal/perintah: JetBrains Mono atau Consolas.
- Isi materi: 16 px atau lebih pada desktop, line-height nyaman.
- Jangan memakai pixel font untuk paragraf panjang.

Font eksternal bersifat opsional. Simpan font lokal atau sediakan fallback agar game tetap dapat berjalan tanpa internet.

## 4. Layout halaman

### Splash
- Logo di tengah.
- Background laboratorium digital.
- Tombol Mulai yang jelas.
- Opsi suara dan aksesibilitas.

### Profil Lokal
- Panel tengah.
- Input nama tampilan.
- Daftar profil lokal yang pernah dibuat.
- Pesan yang menjelaskan bahwa progres disimpan di browser ini.

### Dashboard
- Header: avatar, nama tampilan, level, XP.
- Main: peta level.
- Side panel: progres, achievement, tombol pengaturan.
- Status misi: locked, available, completed.

### Halaman Materi
- Judul dan tujuan belajar.
- Teks ringkas, diagram/ilustrasi, contoh perintah.
- Tombol “Mulai Tantangan”.
- Navigasi kembali yang konsisten.

### Halaman Tantangan
- Header: nama level dan progres tantangan.
- Panel konteks kasus/instruksi.
- Area interaksi: pilihan ganda, matching, urutan, drag-and-drop, atau terminal simulasi.
- Tombol Periksa, Petunjuk, dan Kembali.
- Feedback tampil dekat area jawaban.

### Halaman Hasil
- Skor, XP, akurasi, rank.
- Hal yang sudah dikuasai dan materi yang perlu diulang.
- Tombol ulangi, kembali ke peta, dan ekspor progres.

## 5. Komponen UI

| Komponen | Ketentuan |
|---|---|
| Primary Button | Aksi utama; memiliki hover, focus, disabled |
| Secondary Button | Aksi sekunder |
| Mission Card | Judul, ringkasan, status, reward |
| Progress Bar | Progress misi atau XP |
| Terminal Panel | Terminal simulasi, bukan shell asli |
| File Card | Kartu file/folder untuk puzzle |
| Feedback Panel | Status dan penjelasan jawaban |
| Achievement Badge | Ikon dan label pencapaian |
| Modal | Konfirmasi reset/keluar/impor |
| Toast | Notifikasi singkat setelah penyimpanan |

## 6. Interaksi dan aksesibilitas

- Semua kontrol penting dapat digunakan dengan keyboard.
- Sediakan focus indicator yang jelas.
- Drag-and-drop wajib memiliki alternatif klik/pilih.
- Tombol memiliki ukuran target yang nyaman.
- Berikan teks dan ikon pada feedback, jangan hanya warna.
- Animasi tidak boleh menjadi syarat memahami informasi.
- Sediakan opsi mute dan, bila memungkinkan, pengurangan animasi.
- Gunakan label input yang jelas dan pesan kesalahan yang spesifik.

## 7. Responsive

Target utama: desktop/laptop, resolusi pengujian 1366×768 dan 1920×1080.
- Desktop: panel instruksi dan tantangan berdampingan.
- Tablet: panel bertumpuk.
- Mobile bukan target utama MVP. Jika ditambahkan, terminal dan drag-and-drop perlu desain interaksi sentuh tersendiri.
- Hindari scroll horizontal pada resolusi target.
- **Mode muat layar (desktop/laptop):** tiap adegan harus muat dalam satu layar tanpa scroll halaman (diuji pada viewport 1342×676, 1342×768, dan 1896×988). Konten yang panjang (materi, log terminal) bergulir di dalam panelnya sendiri. Layar sempit (< 961 px) atau sangat pendek (< 600 px) memakai tata letak bertumpuk dengan scroll biasa.

## 8. Aset yang dibutuhkan

- Logo GIT QUEST.
- Sprite pemain, Nara, Bugbyte, Glitch.
- Background splash dan kantor CodeForge.
- Background tiap level.
- Ikon file, folder, terminal, status Git, XP, dan achievement.
- Diagram tiga area Git.
- Ilustrasi Centralized dan Distributed VCS.
- Efek keberhasilan/kesalahan.
- Musik dan efek suara opsional.

Gunakan aset buatan sendiri atau aset dengan lisensi yang memperbolehkan penggunaan. Catat atribusi/lisensi aset. Jangan mengunduh aset berhak cipta tanpa izin.

# GIT QUEST — The Repository Chronicles

Game edukatif untuk belajar **Git** (version control) bagi siswa SMK kelas XI RPL. Pemain menjelajahi dunia ala RPG, membaca materi dari NPC, lalu melawan monster lewat mini-game: kuis, sortir konveyor, simulasi terminal, mengetik cepat, simulator commit, dan keamanan `.gitignore`.

Game ini **aplikasi web statis** (HTML, CSS, JavaScript, `localStorage`). **Tidak perlu internet, instalasi, database, PHP, atau backend.** Semua aset (gambar, audio, font) sudah ada di dalam folder.

---

## 1. Kebutuhan

| Hal | Keterangan |
|---|---|
| Perangkat | **Komputer/laptop atau PID (Panel Interaktif Digital) sekolah.** Jangan di HP: tampilan responsifnya masih kurang. |
| Browser | Chrome, Edge, atau Firefox versi terbaru (disarankan Chrome/Edge). |
| Internet | Tidak diperlukan. |
| Instalasi | Tidak ada. Hanya ekstrak lalu buka. |
| Layar | Layar lebar (komputer, laptop, atau PID). |
| Suara | Opsional. Nyalakan speaker/headset untuk musik dan efek suara. |

---

## 2. Cara menjalankan (untuk yang menerima file RAR)

### Langkah 0 — Ekstrak dulu
Klik kanan file `.rar` → **Extract Here** / **Ekstrak ke folder**. **Jangan membuka `index.html` dari dalam jendela RAR**, karena gambar, suara, dan font tidak akan termuat.

### Cara A — Paling mudah (disarankan)
1. Buka folder hasil ekstrak.
2. Klik dua kali **`Jalankan-Game.bat`**.
3. Browser terbuka otomatis ke `http://localhost:8000/`. Jendela hitam yang muncul jangan ditutup selama bermain (menutupnya = menghentikan game).

> Cara A memakai Python kalau tersedia di komputer. Bila Python tidak ada, file `.bat` otomatis membuka `index.html` langsung di browser (sama seperti Cara B).

### Cara B — Buka langsung
Klik dua kali **`index.html`**. Game terbuka di browser bawaan. Cara ini juga berfungsi karena game tidak memerlukan server.

### Cara C — VS Code (untuk guru/pengembang)
Buka folder di VS Code → klik kanan `index.html` → **Open with Live Server**. Atau jalankan `python -m http.server 8000` di folder ini, lalu buka `http://localhost:8000`.

### Penting: pilih satu cara dan konsisten
Progres tersimpan di browser **per alamat**. Alamat `file://...` (Cara B) dan `http://localhost:8000` (Cara A/C) dianggap berbeda, begitu juga Chrome vs Edge. Jika berganti cara atau browser, progres tidak ikut terbawa. Gunakan **Ekspor progres** untuk memindahkannya (lihat bagian 4).

---

## 3. Cara bermain

1. Di layar awal tekan **Mulai Petualangan**, isi **nama**, pilih dan sesuaikan **karakter** (10 pilihan).
2. Jelajahi dunia dan temui NPC berlabel ungu **MATERI** di tiap peta. **Baca semua materinya** agar portal level terbuka.
3. Masuk portal bernomor. Pada kunjungan pertama ke tiap stage, akan ada **narasi pembuka** (bisa dilewati).
4. Kalahkan monster lewat mini-game stage tersebut. Jawaban benar menyerang monster, jawaban salah membuatmu terkena serangan, tetapi XP tidak berkurang.
5. Kumpulkan XP, naikkan level, dan selesaikan 7 stage hingga **Final Boss** untuk meraih gelar **Repository Guardian**.

Stage yang tersedia:

| Level | Nama | Mini-game |
|---|---|---|
| 1 | Developer Academy | Battle kuis (VCS) |
| 2 | The Three Zones | Sortir konveyor |
| 3 | Setup Station | Simulasi terminal berwaktu |
| 4 | Command Terminal | Fast typing race |
| 5 | Commit Master | Simulator repositori |
| 6 | Security Vault | Security sweep + kartu memori |
| 7 | Final Boss | Boss rush |

### Kontrol

| Aksi | Tombol |
|---|---|
| Bergerak | Panah atau W A S D, atau klik peta untuk berjalan otomatis |
| Berinteraksi (NPC/portal) | Enter atau Spasi |
| Melambai | F |
| Lanjut dialog / narasi | Klik, Enter, Spasi, atau panah kanan |
| Lewati narasi | Esc atau tombol **Lewati** |

Tersedia juga tombol **Panduan** (tutorial 4 halaman) dan **Catatan Misi** di atas peta yang menunjukkan langkah berikutnya.

### Pengaturan (menu **Pengaturan**)
- **Efek suara**: hidup/mati. Klik sekali di halaman agar musik bisa mulai (aturan browser). Tombol **Suara** juga ada di layar awal.
- **Kurangi animasi**: cocok untuk komputer lambat atau yang peka terhadap gerak. Tombol **Animasi** juga ada di layar awal.
- **Mode santai**: waktu mini-game dua kali lebih lama.
- **Mode kontrol dunia**: GUI (panah, klik, tombol) atau CLI (ketik perintah seperti `right 3; interact()`).
- **Ubah karakter**: ganti tampilan karakter kapan saja.

---

## 4. Progres, ekspor, dan impor

- Progres tersimpan **otomatis** di browser (`localStorage`). Tiap profil punya progresnya sendiri.
- **Menghapus data situs/riwayat browser menghapus progres.** Gunakan mode penyamaran (Incognito) = progres hilang saat ditutup.
- **Ekspor progres**: *Pengaturan → Ekspor progres* menghasilkan file JSON. Ini cara siswa mengumpulkan hasil ke guru dan membuat cadangan.
- **Impor progres**: *Pengaturan → Impor progres* memulihkan dari file JSON (menimpa seluruh progres di browser itu).
- **Reset semua progres**: ada di Pengaturan. Ekspor dulu bila perlu.

Catatan untuk laboratorium/PID: tiap komputer menyimpan progresnya sendiri. Bila dipakai bergantian, minta siswa mengekspor progres di akhir sesi.

---

## 5. Masalah umum

| Masalah | Solusi |
|---|---|
| Layar kosong / gambar tidak muncul | File belum diekstrak, atau ada file yang hilang. Ekstrak ulang seluruh folder, lalu buka `index.html` dari folder hasil ekstrak. |
| Tidak ada suara | Pastikan **Suara** menyala (tombol di layar awal atau Pengaturan), volume komputer menyala, dan klik sekali di halaman. |
| Progres hilang | Kemungkinan berganti browser atau cara membuka (lihat "Penting" di atas), memakai mode Incognito, atau data situs terhapus. Impor dari file ekspor bila ada. |
| Game terasa berat/patah-patah | Nyalakan **Kurangi animasi** di Pengaturan, tutup tab lain. |
| `Jalankan-Game.bat` langsung tertutup | Python mungkin tidak terpasang. Pakai Cara B (klik dua kali `index.html`). |
| Peringatan "localStorage tidak tersedia" | Browser memblokir penyimpanan (mis. mode privat). Gunakan jendela biasa atau unduh progres sebagai JSON. |
| Tampilan berantakan di HP | Gunakan komputer atau PID. Versi HP belum dioptimalkan. |

---

## 6. Untuk guru / pengembang

### Deployment
Salin seluruh isi folder (folder `docs/` boleh dihilangkan) ke hosting statis atau server lokal sekolah: GitHub Pages, Netlify, Nginx/Apache. Tidak ada proses build.

### Mengubah isi
- **Materi, soal, dan narasi stage:** `data/missions.js` (field `material`, `challenges`, `story`). Tanda `*kata*` pada narasi akan disorot.
- **Peta, NPC, dan dialog:** `data/areas.js`.
- Materi dan kunci jawaban sebaiknya diperiksa guru sebelum dipakai di kelas.

### Struktur

```text
index.html
Jalankan-Game.bat        peluncur satu klik (Windows)
css/style.css            tampilan (design tokens, pixel art, komponen)
data/missions.js         level, materi, soal, dan narasi stage
data/areas.js            peta, NPC, dan dialog dunia
js/storage.js            simpan/muat/reset/ekspor/impor progres
js/scoring.js            poin, XP, rank, achievement, kondisi kemenangan
js/terminal-simulator.js simulator terminal (whitelist, tanpa shell)
js/chars.js              10 karakter anime, kustomisasi, efek naik level
js/world.js              dunia RPG (peta, gerak, NPC, portal, animasi)
js/minigames.js          mini-game berwaktu tiap stage
js/fx.js                 panorama splash, latar ambien, efek mengetik
js/app.js                alur adegan dan tampilan
assets/                  gambar SVG, audio, font (lisensi di assets/README.md)
docs/                    storyboard, desain, aturan, kebutuhan, rencana
```

Dokumentasi lengkap: [`docs/README.md`](docs/README.md).

---

## 7. Fitur

- 10 karakter anime yang bisa dikustomisasi dan berevolusi seiring level.
- 8 peta (Plaza + satu peta per stage) dengan kamera, minimap, serta NPC baik dan jahat yang menjelaskan materi dan saling mengobrol.
- Penyimpan Materi per peta: materi harus dibaca dulu sebelum portal level terbuka.
- Narasi pembuka stage bergaya visual novel, tampil sekali per profil.
- Splash screen interaktif: teks splash acak yang bisa diklik, tip Git, maskot Bugbyte, tombol Lanjutkan, dan karakter yang kesandung lalu lari kembali ke posisinya.
- Tujuh stage, masing-masing dengan tipe game berbeda; game bisa ditamatkan dengan gelar **Repository Guardian**.
- Mode kontrol GUI atau CLI, mode santai, dan opsi kurangi animasi.

## 8. Batasan

- Data hanya ada di browser dan alamat yang sama; menghapus data situs menghapus progres.
- Profil bersifat lokal, bukan login aman. Skor dapat diubah lewat Developer Tools, jadi cocok untuk latihan formatif, bukan nilai resmi.
- Materi di luar modul (mis. `git restore`, `git push`) hanya sebagai referensi tambahan.
- Belum dioptimalkan untuk HP.

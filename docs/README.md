# GIT QUEST — The Repository Chronicles
## Dokumentasi Proyek Game Edukatif Tanpa Database

**Versi:** 2.0  
**Platform:** Web browser (desktop/laptop)  
**Teknologi:** HTML5, CSS3, JavaScript, LocalStorage  
**Genre:** Educational Adventure, Puzzle, Simulation, RPG ringan  
**Target:** Siswa SMK kelas XI RPL  
**Materi acuan:** Modul Ajar Git dan GitHub yang diberikan pengguna

## Keputusan arsitektur

GIT QUEST versi ini **tidak menggunakan database dan tidak memerlukan backend PHP**. Game dibuat sebagai aplikasi web statis yang berjalan di browser.

- HTML membangun struktur halaman.
- CSS mengatur desain, layout, responsivitas, dan animasi.
- JavaScript mengatur alur game, tantangan, skor, XP, validasi, dan progres.
- `localStorage` menyimpan profil lokal dan progres pada browser/perangkat yang sedang digunakan.

## Batasan penting

1. Data tersimpan pada browser dan origin yang sama. Data tidak otomatis tersinkronisasi ke komputer lain.
2. Menghapus data situs/browser dapat menghapus progres game.
3. `localStorage` bukan database terpusat dan bukan tempat aman untuk menyimpan data sensitif.
4. Sistem profil pada versi ini adalah **profil lokal**, bukan autentikasi akun yang aman.
5. Guru tidak dapat melihat rekap seluruh siswa dari komputer berbeda tanpa mekanisme ekspor/pengumpulan data tambahan.
6. Skor di sisi browser dapat diubah melalui Developer Tools; karena itu skor versi ini cocok untuk latihan/formatif, bukan nilai resmi yang membutuhkan integritas tinggi.
7. Untuk konsistensi, jalankan game melalui server statis lokal (misalnya VS Code Live Server) atau hosting statis. Tidak perlu server aplikasi/backend. Perilaku `localStorage` pada URL `file://` dapat berbeda antar-browser.

## Dokumen proyek

- `storyboard.md` — cerita, adegan, alur, dan level.
- `design.md` — arah visual, design tokens, layout, dan komponen UI.
- `game_rules.md` — aturan permainan, skor, XP, rank, dan syarat kelulusan.
- `requirements.md` — kebutuhan fungsional, nonfungsional, perangkat, dan batasan.
- `development_plan.md` — tahapan, MVP, struktur proyek, dan pengujian.
- `rpg_mode.md` — pembaruan konsep: dunia, portal, dan pertarungan monster.
- `characters.md` — 10 karakter anime, kustomisasi, dan efek naik level.
- `world_maps.md` — peta per stage, NPC baik/jahat, jobdesk, petunjuk arah, obrolan antar-NPC, penanda pemain, mode kontrol GUI/CLI, dan cara menambah peta.
- `stage_games.md` — tipe game berbeda di tiap stage, aturan timer, dan poin mini-game.

## Cara menjalankan (setelah source code tersedia)

1. Ekstrak folder proyek.
2. Buka folder menggunakan VS Code.
3. Jalankan `index.html` menggunakan ekstensi Live Server atau server statis lokal.
4. Game akan terbuka di browser.
5. Progres tersimpan pada browser tersebut.

Tidak perlu memasang PHP, MySQL, Laragon, XAMPP, atau membuat database.

## Acuan materi

Materi inti berasal dari modul:
1. Pengantar Version Control System.
2. Arsitektur Tiga Area Git.
3. Perintah Antarmuka Baris Perintah (CLI) Dasar.
4. Aturan Keamanan Berkas (`.gitignore`).
5. Lembar Ringkasan Perintah CLI (Cheat Sheet).

Cerita, karakter, XP, rank, dan mekanisme game adalah rancangan produk, bukan ketentuan dari modul ajar.

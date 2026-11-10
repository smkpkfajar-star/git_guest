# GIT QUEST — The Repository Chronicles

Game edukatif Git untuk siswa SMK kelas XI RPL. Aplikasi web statis: HTML, CSS, JavaScript, dan `localStorage`. **Tanpa database, PHP, atau backend.**

Dokumentasi lengkap ada di folder [`docs/`](docs/README.md).

## Menjalankan (lokal)

1. Buka folder ini di VS Code.
2. Klik kanan `index.html` → **Open with Live Server** (atau server statis lain, mis. `python -m http.server` di folder ini lalu buka `http://localhost:8000`).
3. Progres tersimpan otomatis di browser tersebut.

Tidak perlu Laragon, XAMPP, PHP, atau MySQL. Disarankan memakai server statis agar origin `localStorage` konsisten (perilaku `file://` bisa berbeda antar-browser).

## Deployment

Salin seluruh isi folder (kecuali `docs/` bila tidak diperlukan) ke hosting statis atau server lokal sekolah, misalnya GitHub Pages, Netlify, atau Nginx/Apache sebagai file statis. Tidak ada proses build.

Catatan untuk laboratorium: tiap komputer menyimpan progresnya sendiri. Untuk mengumpulkan hasil, siswa memakai **Pengaturan → Ekspor progres** (file JSON).

## Struktur

```text
index.html
css/style.css            tampilan (design tokens, pixel art, komponen)
data/missions.js         level, materi, dan soal (terpisah dari logika)
js/storage.js            saveGame, loadGame, resetGame, exportSave, importSave
js/scoring.js            poin, XP, rank, achievement, kondisi kemenangan
js/terminal-simulator.js simulator terminal (whitelist, tanpa shell)
js/chars.js              10 karakter anime, kustomisasi, efek naik level
js/world.js              dunia RPG (peta, gerak, NPC, portal, animasi)
js/minigames.js          mini-game berwaktu tiap stage
js/fx.js                 panorama splash, latar ambien tiap stage, efek mengetik
js/app.js                alur adegan dan tampilan
docs/                    storyboard, design, game rules, requirements, plan
```

## Status

- 10 karakter anime yang bisa dikustomisasi dan berevolusi seiring level (lihat `docs/characters.md`).
- 8 peta (Plaza + satu peta per stage) dengan kamera, minimap, serta NPC baik dan jahat yang menjelaskan materi, punya jobdesk, memberi petunjuk arah, dan saling mengobrol; karakter pemain ditandai "KAMU" (lihat `docs/world_maps.md`).
- Mode RPG: jelajahi dunia, bicara dengan NPC, masuk portal, lalu bertarung dengan monster (lihat `docs/rpg_mode.md`).
- Ketujuh stage dapat dimainkan, masing-masing dengan tipe game berbeda (lihat `docs/stage_games.md`).
- Game dapat ditamatkan: kondisi kemenangan dan gelar Repository Guardian aktif.
- Aset: gambar SVG, audio, dan font sudah tersedia di `assets/` (lihat `assets/README.md` untuk daftar dan lisensi).

## Batasan

- Data hanya ada di browser dan origin yang sama; menghapus data situs menghapus progres.
- Profil bersifat lokal, bukan login aman. Skor dapat diubah lewat Developer Tools, jadi cocok untuk latihan formatif, bukan nilai resmi.
- Materi dan kunci jawaban perlu diperiksa guru sebelum dipakai di kelas.

# Storyboard — GIT QUEST: The Repository Chronicles

## 1. Ringkasan cerita

Pemain menjadi Junior Developer baru di **CodeForge Studio**. Proyek aplikasi sekolah yang sedang dikerjakan tim berada dalam kondisi berantakan: perubahan belum tercatat, file belum dipilih untuk commit, pesan commit tidak jelas, dan file tertentu seharusnya tidak dimasukkan ke repositori.

Mentor **Nara** menugaskan pemain memperbaiki alur kerja proyek dengan mempelajari Git. Robot pendamping **Bugbyte** memberi tips dan menjelaskan status. Gangguan digital bernama **Glitch** menjadi simbol tantangan.

## 2. Tujuan belajar

Setelah bermain, siswa diharapkan dapat:
1. Menjelaskan fungsi Version Control System (VCS).
2. Membedakan Centralized VCS dan Distributed VCS menurut materi modul.
3. Menjelaskan Working Directory, Staging Area, dan Local Repository.
4. Membedakan status Untracked, Modified, Staged, dan Committed.
5. Memilih perintah Git CLI yang sesuai dengan skenario.
6. Memilih prefix Conventional Commits yang sesuai.
7. Membuat aturan `.gitignore` berdasarkan pola yang dipelajari.
8. Mengurutkan alur pengelolaan repositori lokal dalam simulasi.

## 3. Karakter

| Karakter | Peran | Fungsi |
|---|---|---|
| Pemain | Junior Developer | Menjalankan misi |
| Nara | Senior Developer | Mengajar dan memberi umpan balik |
| Bugbyte | Robot pendamping | Menampilkan tips dan status |
| Glitch | Gangguan proyek | Representasi masalah yang harus diselesaikan |

## 4. Alur utama

`Splash → Pilih Profil Lokal → Intro Cerita → Dashboard/Peta → Materi → Tantangan → Feedback → Hasil Misi → Peta → Final Challenge → Hasil Akhir`

Pemain dapat membuat profil lokal sederhana dengan nama tampilan. Profil ini hanya untuk membedakan progres di browser yang sama, bukan akun terverifikasi.

## 5. Storyboard per adegan

### Adegan 1 — Splash Screen
- Visual: logo GIT QUEST pada laboratorium digital pixel art.
- Teks: “GIT QUEST — The Repository Chronicles”.
- Tombol: `Mulai`.
- Aksi: membuka halaman pemilihan profil lokal.

### Adegan 2 — Profil Lokal
- Visual: panel terminal futuristik.
- Input: nama tampilan pemain.
- Tombol: `Buat Profil` dan pilihan profil yang sudah tersimpan.
- Validasi: nama tidak boleh kosong; batasi panjang nama; tampilkan sebagai teks biasa, bukan HTML.
- Catatan: jangan meminta password atau data pribadi karena tidak ada autentikasi server.

### Adegan 3 — Intro Cerita
- Visual: kantor CodeForge Studio dan layar proyek bermasalah.
- Dialog Nara: “Selamat datang di CodeForge. Kita perlu mengelola perubahan proyek dengan rapi. Mari gunakan Git untuk mencatat dan mengelola perubahan.”
- Tombol: `Lanjutkan`.

### Adegan 4 — Dashboard / Peta Misi
- Elemen: profil lokal, level, XP, progress bar, peta wilayah, tombol lanjut, pengaturan suara.
- Setiap node menunjukkan status: terkunci, tersedia, atau selesai.
- Misi berikutnya terbuka setelah syarat misi sebelumnya terpenuhi.
- Progres dibaca dari `localStorage`.

### Adegan 5 — Level 1: Developer Academy (VCS)
- Materi: pengertian VCS, Centralized VCS vs Distributed VCS, alasan Git digunakan.
- Visual: ilustrasi server terpusat dan repositori tersebar.
- Tantangan: mencocokkan karakteristik dengan jenis VCS; memilih manfaat Git pada skenario.
- Feedback: jawaban benar/salah disertai alasan.

### Adegan 6 — Level 2: The Three Zones
- Materi: Working Directory, Staging Area (Index), Local Repository (`.git`).
- Materi status: Untracked, Modified, Staged, Committed.
- Visual: tiga zona/ruangan.
- Tantangan: drag-and-drop kartu aktivitas ke area yang tepat; tersedia alternatif klik agar tidak bergantung pada drag.
- Tantangan urutan: mengurutkan perubahan hingga menjadi commit.

### Adegan 7 — Level 3: Setup Station
- Materi: konfigurasi identitas dan inisialisasi repositori.
- Perintah: `git config --global user.name`, `git config --global user.email`, `git config --list`, `cd nama-folder-proyek`, `git init`.
- Tantangan: memilih urutan dan perintah untuk menyiapkan repositori.
- Terminal: simulator tertutup, bukan terminal komputer sungguhan.

### Adegan 8 — Level 4: Command Terminal
- Materi: `git status`, `git status -s`, `git add nama-file`, `git add .`, `git diff`, `git diff --staged`, `git log --oneline --graph --decorate --all`.
- Tantangan: memilih perintah dari situasi, menyusun perintah dari potongan, serta membaca output terminal simulasi.
- Umpan balik: jelaskan area/status yang diperiksa oleh perintah tersebut.

### Adegan 9 — Level 5: Commit Master
- Materi: `git commit -m` dan Conventional Commits.
- Prefix yang diuji: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`.
- Visual: papan tugas pengembangan.
- Tantangan: membaca perubahan lalu memilih prefix dan membuat pesan commit ringkas yang relevan.

### Adegan 10 — Level 6: Security Vault
- Materi: fungsi `.gitignore`, komentar `#`, slash `/`, akhiran slash `/`, wildcard `*`, `**`, negasi `!`.
- Tantangan: memilih file/folder yang perlu diabaikan dan memasangkan pola dengan maksudnya.
- Contoh pola dari modul: `node_modules/`, `vendor/`, `.env`, `.env.local`, `.env.production`, `config/secrets.json`, `*.log`, `npm-debug.log*`, `yarn-debug.log*`, `.DS_Store`, `Thumbs.db`, `dist/`, `build/`, `*.class`, `*.exe`.
- Feedback membahas fungsi pola sesuai materi.

### Adegan 11 — Final Boss: Repository Guardian
- Skenario: proyek baru perlu dikelola dari awal.
- Pemain menyelesaikan rangkaian simulasi: konfigurasi identitas → `git init` → pemeriksaan status → staging → pemeriksaan diff → commit → pemeriksaan log → menyusun `.gitignore`.
- Tantangan memadukan urutan perintah dan pemahaman status.
- Gelar Repository Guardian diberikan sesuai aturan hasil akhir.

### Adegan 12 — Hasil Akhir
- Visual: kartu hasil dengan skor, XP, rank, akurasi, dan misi selesai.
- Tombol: `Ulangi Misi`, `Lihat Materi`, `Kembali ke Peta`, `Ekspor Progres`.
- Progres otomatis disimpan di browser.
- Sediakan pilihan ekspor file JSON sebagai cadangan dan impor kembali pada browser/perangkat yang sama atau berbeda.

## 6. Pola satu misi

1. Pemain memilih misi.
2. Sistem menunjukkan tujuan belajar.
3. Pemain membaca materi ringkas.
4. Sistem memberi contoh.
5. Pemain mengerjakan tantangan.
6. JavaScript memeriksa jawaban terhadap kunci yang ada di data game.
7. Sistem memberi penjelasan.
8. Skor dan XP diperbarui.
9. Progres disimpan ke `localStorage`.
10. Pemain kembali ke peta atau mengulang latihan.

## 7. Catatan materi di luar cakupan modul

Cheat sheet memuat `git restore [file]`, `git remote add origin [url]`, `git branch -M main`, dan `git push -u origin main`. Perintah tersebut dapat muncul sebagai kartu referensi atau tantangan bonus. Modul tidak menjelaskan tutorial GitHub lengkap, Pull Request, merge conflict, atau CI/CD sebagai praktik terperinci; jangan menjadikannya materi inti tanpa persetujuan guru.

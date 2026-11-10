# Requirements — GIT QUEST Tanpa Database

## 1. Keputusan teknologi

Versi pertama adalah aplikasi web statis. **Tidak menggunakan database, PHP, API backend, atau autentikasi server.**

| Teknologi | Fungsi |
|---|---|
| HTML5 | Struktur halaman |
| CSS3 | Visual, layout, animasi |
| JavaScript | Gameplay, validasi, skor, XP, navigasi |
| `localStorage` | Penyimpanan lokal profil dan progres |
| JSON | Data level/soal dan format ekspor/impor |
| Browser modern | Menjalankan game |

## 2. Kebutuhan fungsional

| ID | Kebutuhan | Prioritas |
|---|---|---|
| FR-01 | Menampilkan splash screen dan menu utama | Must |
| FR-02 | Membuat dan memilih profil lokal | Must |
| FR-03 | Menampilkan dashboard dan peta misi | Must |
| FR-04 | Menampilkan materi pada setiap level | Must |
| FR-05 | Menyediakan kuis pilihan ganda | Must |
| FR-06 | Menyediakan matching/urutkan langkah | Should |
| FR-07 | Menyediakan puzzle drag-and-drop dengan alternatif klik | Should |
| FR-08 | Menyediakan terminal Git simulasi | Must |
| FR-09 | Memvalidasi jawaban dan menampilkan penjelasan | Must |
| FR-10 | Menghitung skor, XP, rank, dan progres | Must |
| FR-11 | Menyimpan progres ke `localStorage` | Must |
| FR-12 | Memuat kembali progres saat game dibuka | Must |
| FR-13 | Mengulang misi | Must |
| FR-14 | Menghapus/reset progres dengan konfirmasi | Must |
| FR-15 | Mengekspor progres ke JSON | Should |
| FR-16 | Mengimpor progres JSON yang valid | Should |
| FR-17 | Menyediakan pengaturan suara | Could |
| FR-18 | Leaderboard lintas siswa/perangkat | Out of scope |
| FR-19 | Dashboard guru terpusat | Out of scope |
| FR-20 | Login akun terverifikasi | Out of scope |

## 3. Kebutuhan nonfungsional

- **Usability:** instruksi sederhana, navigasi konsisten, bahasa sesuai siswa kelas XI.
- **Performance:** aset dioptimalkan; halaman tidak memuat pustaka besar yang tidak diperlukan.
- **Compatibility:** browser modern yang masih didukung.
- **Offline:** setelah semua file aset tersedia secara lokal, gameplay inti tidak membutuhkan koneksi internet. Jalankan melalui server statis lokal agar origin penyimpanan konsisten.
- **Reliability:** simpan progres setelah setiap perubahan penting dan tangani kegagalan penyimpanan.
- **Security:** tidak ada eksekusi command shell; jangan menyimpan data sensitif; hindari memasukkan input pemain ke `innerHTML`.
- **Accessibility:** navigasi keyboard, focus state, label jelas, kontras baik, alternatif drag-and-drop.
- **Maintainability:** data soal dan level dipisahkan dari logika tampilan.
- **Portability:** ekspor/impor JSON memungkinkan pemindahan progres secara manual.

## 4. Perangkat keras

### Minimum yang disarankan
- PC/laptop dengan prosesor dual-core modern.
- RAM 4 GB.
- Resolusi minimal 1366×768.
- Keyboard dan mouse.
- Ruang penyimpanan sekitar 500 MB–1 GB untuk proyek dan aset awal.

## 5. Perangkat lunak

- Windows, Linux, atau macOS.
- VS Code atau editor kode sejenis.
- Chrome, Edge, atau Firefox modern.
- VS Code Live Server atau server statis lokal sederhana.
- Git untuk mengelola source code.
- Figma (opsional) untuk wireframe.
- Aplikasi pixel art (opsional) untuk sprite.

Tidak diperlukan:
- Laragon.
- XAMPP.
- PHP.
- MySQL/MariaDB.
- phpMyAdmin.

## 6. Cara penyimpanan

Gunakan satu key utama, misalnya `gitQuestSave_v1`, berisi:
- versi format save,
- profil lokal,
- XP dan level,
- status penyelesaian misi,
- skor terbaik,
- achievement yang diperoleh,
- pengaturan suara.

Contoh struktur data (ilustrasi):

```json
{
  "saveVersion": 1,
  "profile": {
    "displayName": "Siswa RPL"
  },
  "xp": 120,
  "completedMissions": ["vcs", "three-zones"],
  "bestScores": {
    "vcs": 90
  },
  "settings": {
    "sound": false
  }
}
```

Jangan simpan password, nomor identitas pribadi, atau data sensitif di LocalStorage.

## 7. Batasan LocalStorage

- Data hanya berada pada browser dan origin yang sama.
- Browser berbeda atau perangkat berbeda memiliki penyimpanan yang berbeda.
- Penghapusan site data dapat menghapus progres.
- Mode privat/incognito dapat menghapus data setelah sesi berakhir.
- Kapasitas dibatasi browser dan tidak cocok untuk menyimpan gambar/audio besar.
- Data dapat dibaca atau diubah pengguna melalui Developer Tools.
- Tidak ada sinkronisasi otomatis atau rekap guru terpusat.

## 8. Profil dan penggunaan kelas

Untuk penggunaan beberapa siswa pada satu komputer:
- Sediakan profil lokal sederhana, atau
- Gunakan satu sesi pemain per pergantian siswa dan ekspor progres setelah selesai.

Jangan menyebut profil lokal sebagai login aman. Untuk banyak komputer di laboratorium, setiap komputer menyimpan data sendiri; pengumpulan hasil memerlukan ekspor file JSON manual.

## 9. Terminal simulasi

Terminal game wajib berupa simulator:
- Daftar command yang diterima ditentukan developer.
- Input diparse dan dibandingkan dengan skenario.
- Perintah tidak dikirim ke shell sistem operasi.
- Jangan gunakan `eval`, `exec`, atau `child_process`.
- Tampilkan output simulasi yang konsisten berdasarkan state permainan.

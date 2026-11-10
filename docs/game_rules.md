# Game Rules — GIT QUEST

## 1. Aturan umum

1. Mode belajar mengikuti urutan misi.
2. Setiap misi memiliki tujuan belajar, materi, tantangan, dan kriteria selesai.
3. Pemain dapat mengulang misi.
4. Jawaban yang salah selalu diikuti penjelasan atau petunjuk.
5. XP tidak dikurangi karena kesalahan.
6. Progres disimpan otomatis pada browser lokal.
7. Pemain dapat mengekspor progres menjadi file JSON.
8. Tidak ada akun server; nama pemain hanya profil lokal.

## 2. Sistem poin

Rancangan nilai per tantangan:
- Benar pada percobaan pertama: 100 poin.
- Benar setelah memakai petunjuk: 70 poin.
- Benar setelah percobaan ulang tanpa petunjuk: 50 poin.
- Salah: 0 poin untuk percobaan tersebut.

Untuk soal bertipe selain pilihan tunggal, bobot dan rubrik perlu ditetapkan pada data soal masing-masing.

Rumus:
`Nilai misi = (total poin diperoleh / total poin maksimum) × 100`

Bonus waktu tidak digunakan pada MVP agar siswa fokus pada pemahaman.

Pengecualian terarah: sebagian stage berupa mini-game berwaktu (lihat `stage_games.md`). Waktu hanya menentukan lulus/gagal ronde, bukan menambah poin. Poin ronde mini-game: 100 bila berhasil percobaan pertama tanpa petunjuk dengan akurasi minimal 90%, selain itu 70 (akurasi lebih rendah atau memakai petunjuk) atau 50 (setelah mengulang). Mode santai menggandakan waktu.

## 3. XP

- Menyelesaikan tantangan: 10 XP.
- Menyelesaikan satu misi: bonus 25 XP.
- Menyelesaikan Final Challenge: bonus 50 XP.
- XP tidak berkurang jika jawaban salah.
- XP diberikan satu kali untuk penyelesaian pertama; pengulangan dapat memperbarui nilai terbaik tanpa menggandakan bonus penyelesaian.

## 4. Rank

| Nilai akhir | Rank |
|---|---|
| 90–100 | Repository Guardian |
| 80–89 | Commit Specialist |
| 70–79 | Git Explorer |
| Di bawah 70 | Apprentice Developer |

Rank adalah penghargaan motivasi, bukan otomatis nilai resmi sekolah.

## 5. Kelulusan misi

- Seluruh tantangan wajib harus dijawab.
- Nilai minimal 70 untuk membuka misi berikutnya.
- Nilai di bawah 70 menampilkan rekomendasi mengulang materi.
- Dalam mode latihan, percobaan dapat diulang.
- Ambang kelulusan dapat diubah pada konfigurasi game sebelum dipublikasikan.

## 6. Petunjuk

- Petunjuk pertama mengarahkan pada konsep.
- Petunjuk kedua dapat memberikan contoh serupa.
- Petunjuk mengurangi poin tantangan, bukan XP.
- Petunjuk tidak langsung mengungkap jawaban kecuali pada mode belajar khusus.

## 7. Kemenangan

Game selesai ketika seluruh misi wajib dan Final Challenge telah dikerjakan. Gelar Repository Guardian diberikan jika nilai akhir minimal 90 sesuai tabel rank.

## 8. Penyimpanan dan reset

- Progres disimpan setelah perubahan skor/progres.
- Jika penyimpanan gagal, tampilkan pesan dan tawarkan ekspor/unduh progres.
- Reset progres harus meminta konfirmasi.
- Impor JSON harus divalidasi terhadap format versi game.
- Jangan mengimpor file JSON tanpa memeriksa struktur dan tipe datanya.
- Pemain disarankan mengekspor progres sebelum membersihkan data browser.

## 9. Integritas penilaian

`localStorage` dapat diubah melalui Developer Tools. Karena itu:
- Jangan menganggap skor lokal sebagai bukti penilaian resmi yang anti-manipulasi.
- Gunakan game ini untuk pembelajaran dan latihan formatif.
- Jika dibutuhkan penilaian resmi, audit antarmuka dan pindahkan validasi nilai ke server pada versi masa depan.

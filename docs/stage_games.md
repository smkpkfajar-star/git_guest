# Tipe Game per Stage — GIT QUEST

Setiap stage memiliki tipe game berbeda yang tetap relevan dengan materinya. Stage awal masih berupa
kuis karena materinya konsep dasar; stage berikutnya berupa simulasi praktik atau permainan berwaktu.

| Stage | Tipe game | Materi yang dilatih | Mekanik |
|---|---|---|---|
| 1 Developer Academy | Battle Kuis | VCS, Centralized vs Distributed | Pasangkan dan pilihan ganda |
| 2 The Three Zones | **Sortir Konveyor** (berwaktu) | Tiga area Git, empat status berkas | Kartu meluncur; kirim ke zona yang benar (klik atau tombol 1–4) |
| 3 Setup Station | **Simulasi Terminal Berwaktu** | `git config`, `cd`, `git init`, `git status` | Ketik perintah mengikuti daftar langkah |
| 4 Command Terminal | **Fast Typing Race** | `status`, `add`, `diff`, `log` | Babak Salin (ketik yang tampil), Babak Ingat (hanya petunjuk situasi) |
| 5 Commit Master | **Simulator Repositori** | `git add`, `git commit -m`, Conventional Commits | Stage lalu commit dengan prefix sesuai jenis perubahan |
| 6 Security Vault | **Security Sweep + Kartu Memori** | `.gitignore` dan sintaks polanya | Tandai berkas rahasia/dependensi; pasangkan pola dengan maksudnya |
| 7 Final Boss | **Boss Rush** | Seluruh materi | Typing alur kerja, Security Sweep, Sortir cepat |

## Aturan mini-game berwaktu

- Setiap ronde dimulai dari layar **Mulai!** sehingga waktu tidak berjalan saat siswa membaca instruksi.
- Timer berupa bar yang memerah di 25% terakhir. **Mode santai** (Pengaturan) menggandakan waktu.
- Kesalahan di dalam ronde membuat musuh menyerang (HP pemain turun), tetapi **tidak menambah jumlah percobaan**.
- Ronde **gagal** bila waktu habis atau capaian minimum tidak terpenuhi. Siswa bisa **Coba Lagi**; XP tidak berkurang.
- Ronde berhasil memberi poin tantangan seperti biasa.

### Poin ronde mini-game

Mengikuti `game_rules.md` §2, dengan satu tambahan akurasi (`GQScoring.gamePoints`):

| Kondisi | Poin |
|---|---|
| Berhasil percobaan pertama, tanpa petunjuk, akurasi ≥ 90% | 100 |
| Berhasil percobaan pertama, tanpa petunjuk, akurasi < 90% | 70 |
| Berhasil dengan memakai petunjuk | 70 |
| Berhasil setelah mengulang (tanpa petunjuk) | 50 |

Akurasi dihitung dari jawaban yang benar tanpa kesalahan (mis. kartu benar dibagi seluruh kartu, atau
perintah benar dibagi perintah benar ditambah salah). Waktu **bukan bonus**: ia hanya menentukan lulus
atau gagal ronde, sehingga tetap sejalan dengan "bonus waktu tidak digunakan" pada `game_rules.md`.

### Petunjuk (item Bugbyte)

Tiap mini-game punya petunjuk bergaya sendiri: menyorot zona yang benar, membuka kata/perintah,
menyarankan langkah berikutnya, menyorot satu berkas rahasia, atau mengintip kartu sebentar.
Memakai petunjuk membuat poin ronde menjadi 70, tetapi tidak mengurangi XP.

## Alur kembali ke peta

Setelah menyelesaikan stage, hasil misi **tidak** menyediakan tombol langsung ke stage berikutnya.
Pemain wajib kembali ke peta: portal stage berikutnya terbuka dengan animasi (cincin energi dan
percikan), Nara menampilkan ikon "!", lalu pemain berjalan ke portal tersebut.

## Musik, sinematik, dan karakter

- **Backsound berbeda per adegan**: menu (tenang), peta (ceria), Level 1 (akademi), Level 2 (misterius), Level 3 (techno), Level 4 (balapan), Level 5 (groove), Level 6 (tegang), Final (epik). Perpindahan memakai crossfade; efek suara dramatis untuk masuk stage, FIGHT!, dan peringatan bos.
- **Masuk stage** memutar sinematik: pusaran portal, kilat, bar sinema, judul bertahap, lalu adegan VS pemain lawan monster. Final Boss memakai peringatan merah. Dapat dilewati (klik, Enter, Esc).
- **Karakter interaktif**: pemain memilih warna karakter; di peta klik untuk berjalan otomatis, NPC menyapa dan menoleh, tombol Lambai (F); di arena karakter dan musuh dapat diklik, bicara lewat gelembung, dan Nara bereaksi atas tiap jawaban.
- **Splash bergaya Minecraft**: panorama berparalaks dengan siklus siang-malam, logo balok, teks kuning miring yang berdenyut, dan menu bertekstur.
- **Latar ambien per stage**: bit biner (L1), orb zona (L2), hujan kode (L3), hujan cepat (L4), kartu commit melayang (L5), laser brankas (L6), bara dan petir (Final).

## Animasi

- Peta: partikel data melayang, jalur berdenyut, sapuan cahaya, debu langkah, portal dengan titik energi
  yang mengorbit, NPC bergerak (Bugbyte melayang, Glitch bergetar), efek portal terbuka.
- Stage: latar bintang bergerak, tiap monster punya animasi idle sendiri, serangan menerjang, angka
  damage melayang, partikel saat benar.
- Semua animasi mengikuti pengaturan **Kurangi animasi** dan `prefers-reduced-motion`.

## Berkas terkait

- `js/minigames.js` — mesin sorter, typing, reposim, sweep, memory, terminal berwaktu.
- `data/missions.js` — tipe tantangan, soal, kartu, dan waktu tiap ronde.
- `js/world.js` — animasi peta dan efek portal terbuka.

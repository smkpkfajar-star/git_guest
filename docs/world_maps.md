# Peta Dunia & NPC — GIT QUEST

Dunia terdiri dari **8 peta**: satu **Plaza CodeForge** (hub, 44×26 ubin) dan **satu peta per stage** (36–42 ubin lebar).
Jendela pandang hanya 24×13 ubin, jadi kamera **mengikuti pemain** dan menggulir di dalam peta. Pojok kanan atas ada **minimap**
(kotak putih = area yang terlihat, titik hijau = NPC baik, merah = NPC jahat, kuning = pemain).

| Peta | Level | Materi di NPC-nya |
|---|---|---|
| Plaza CodeForge | — | Pilih gerbang bernomor 1–7 menuju stage |
| Akademi Developer | 1 | VCS, terpusat vs terdistribusi, mengapa Git |
| Kota Tiga Zona | 2 | Working Directory, Staging Area, Repository, status berkas |
| Stasiun Setup | 3 | `git config`, `git init`, folder `.git` |
| Jalur Terminal | 4 | `git status`, `add`, `diff`, `log` |
| Bengkel Commit | 5 | `git commit`, Conventional Commits |
| Brankas Keamanan | 6 | `.gitignore`, berkas rahasia (`.env`) |
| Benteng Merge | Final | Ringkasan semua materi + bos |

## Alur

1. Mulai di Plaza. Masuk **gerbang** bernomor (terkunci sampai level sebelumnya lulus) → dialog → **Masuk Area**.
2. Di dalam peta stage: ajak bicara NPC, lalu masuk **portal level** di ujung peta (tantangan dimulai seperti biasa).
3. **Pintu kuning (panah kiri)** dekat titik awal membawa kembali ke Plaza. Setelah menamatkan level, pemain otomatis
   kembali ke Plaza dan gerbang level berikutnya terbuka dengan animasi.

## NPC baik dan jahat

- **Baik** (nama hijau): guru yang menjelaskan materi sesuai level.
- **Jahat** (nama merah, aura merah, berkedip): menyebarkan kebiasaan buruk ("tidak perlu `git add`", "commit file `.env`"),
  lalu **mengaku dan mengoreksi** di akhir dialog, sehingga tetap mendidik.
- Tanda `!` di atas kepala NPC = belum diajak bicara. Bicara dengan NPC tidak memengaruhi skor, XP, atau rank.

## Menambah / mengubah peta

Semua data ada di `data/areas.js` (ukuran, tema warna, portal, NPC beserta dialog). Jalur dan dekorasi dibuat otomatis oleh
`js/world.js` dengan seed tetap, dan dijamin semua portal serta NPC dapat dijangkau (dicek otomatis). Karakter NPC baru
didefinisikan di `js/chars.js` (`NPCS`, kunci `npc_<nama>`) atau memakai maskot piksel (`bugbyte`, `glitch`, `virus`).

## Latar tiap wilayah

Setiap peta punya tekstur lantai, gaya dinding, dan partikel sendiri (diatur di `data/areas.js` lewat `biome(...)`,
digambar oleh `js/world.js`):

| Peta | Lantai | Partikel |
|---|---|---|
| Plaza | paving batu | percik biru |
| Akademi | karpet bergaris | debu kuning |
| Tiga Zona | panel besar | orb ungu |
| Setup | papan sirkuit | percik hijau |
| Terminal | matriks kode | hujan kode ke bawah |
| Commit | papan kayu bengkel | bara emas |
| Brankas | pelat baja bergaris bahaya | percik merah muda |
| Benteng | batu retak berlava | bara api |

## Warga berkeliaran

Selain guru dan penjahat utama, tiap peta punya 3–5 **warga** (siswa, pelari, guru, bug iseng) yang berjalan pelan di sekitar titik asalnya
(`wander` di `data/areas.js`). Mereka berhenti saat dialog terbuka, melompat dan memercikkan efek saat diajak bicara, mengeluarkan
kilau (baik) atau asap ungu-merah (jahat), serta sesekali berceloteh. Mode **Kurangi animasi** mematikan gerak berkeliaran dan partikel.

## Jobdesk, petunjuk arah, dan obrolan antar-NPC

**Jobdesk.** Tiap NPC punya `job` yang tampil di dialog sebagai baris "Jobdesk: ..." (misalnya "Pustakawan · git log").
Peran khusus ditulis di peta `JOBS` pada `data/areas.js`. NPC tanpa entri di sana otomatis memakai jobdesk umum menurut wilayah
(warga baik) atau "Penyebar Mitos · harus dikoreksi" (NPC jahat).

**Tanya arah.** NPC baik punya tombol **Tanya arah** (NPC jahat tidak). Isinya semua gerbang/portal di peta itu dan 6 NPC baik terdekat.
Jawaban memuat jumlah langkah dan arah (kanan/kiri/atas/bawah) dari posisi pemain, dan peta menampilkan **penanda tujuan** (cincin + panah
kuning selama 20 detik; panah tepi layar bila tujuan di luar tampilan). Mode GUI menambah tombol **Antar aku** (jalan otomatis). Mode CLI
tidak punya tombol itu dan jawabannya memuat perintah siap ketik, misalnya `right 8; up 4`.

**Obrolan antar-NPC.** Data di `GQ_CHATS` (`data/areas.js`), per wilayah berupa `{ a, b, l: [[0|1, 'teks'], ...] }`
(0 = NPC `a` bicara, 1 = NPC `b`). Teks dibuat pendek (maks. sekitar 34 karakter) agar muat di gelembung. Obrolan muncul acak tiap 9–18 detik
untuk pasangan yang berada dalam 18 petak dari pemain. NPC yang punya `wander` berjalan mendekat, mengobrol, lalu pulang ke titik asal.
Pasangan baik–jahat dipakai untuk meluruskan mitos. Obrolan berhenti saat dialog terbuka atau pindah peta, dan tidak jalan pada mode
**Kurangi animasi**. Menambah obrolan: tambahkan entri di `GQ_CHATS[<id peta>]` dengan id NPC yang ada di peta itu.

## Penanda karakter pemain

Karakter pemain diberi label kuning **KAMU** dengan panah melayang di atas kepala, cincin kuning berdenyut di kaki, dan titik berkedip
dengan gelombang di minimap. Pada mode **Kurangi animasi**, denyut dimatikan tetapi label dan titik minimap tetap tampil.

## Mode kontrol: GUI atau CLI

Di **Pengaturan → Mode kontrol dunia**:

- **GUI** (bawaan): panah/WASD, klik peta untuk berjalan otomatis, dan tombol arah di layar.
- **CLI** (menantang): panah, klik peta, dan tombol arah dinonaktifkan; pemain bergerak dengan **mengetik perintah** di kartu *Terminal Kontrol*.

| Perintah | Fungsi |
|---|---|
| `up` `down` `left` `right` (alias `top` `bottom` `atas` `bawah` `kiri` `kanan`) | berjalan; bisa dengan jumlah: `right 3`, `right(3)`, `move("left", 2)` |
| `interact()` / `talk()` | bicara dengan NPC di dekat atau membuka portal yang diinjak |
| `wave()` | melambai |
| `look()` / `where()` | melihat sekitar / menampilkan posisi dan area |
| `help` / `clear` | bantuan / bersihkan log |

Beberapa perintah bisa dirangkai dengan titik koma: `right(4); up(2); interact()`. Jumlah langkah 1–40 per perintah, maksimal 120 per baris.
Panah atas/bawah di kolom input memanggil riwayat perintah. Perintah diurai dengan pola teks (tanpa `eval`). Pilihan tersimpan di `settings.controlMode`.

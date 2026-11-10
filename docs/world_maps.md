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

## Penyimpan materi dan syarat belajar

Tiap stage punya satu NPC **Penyimpan Materi** (`keeper` di `data/areas.js`; jobdesknya "Penyimpan Materi · ..."). Berbicara dengannya
menampilkan tombol **Buka Materi (x/y)** yang membuka perpustakaan: daftar topik yang diambil dari `material` misi stage itu (judul, paragraf,
gambar, contoh perintah). Setiap topik ditandai selesai dengan tombol **Sudah paham**.

| Stage | Penyimpan Materi |
|---|---|
| Akademi | Prof. Versi |
| Tiga Zona | Kak Stage |
| Setup | Satpam Config |
| Terminal | Pustakawan Log |
| Commit | Master Commit |
| Brankas | Penjaga Brankas |
| Benteng | Master Merge |

**Syarat:** selama belum semua topik dibaca, portal Level di stage itu berstatus *belajar* (ikon buku kuning), dialognya memuat pesan
"Belajar dulu!" tanpa tombol Masuk, dan ada tombol **Tunjukkan <NPC>** yang menyalakan penanda arah. Penyimpan materi menampilkan tanda `!`
sampai semua topik dibaca. Setelah lengkap, portal terbuka dan musuh stage bisa dilawan. Level yang sudah selesai tidak terkunci lagi.
Kemajuan baca disimpan per profil (`learned` di save, ikut ekspor/impor). Mode Daftar tetap memakai alur lama: materi ditampilkan penuh
sebelum tantangan.

**Tampilan room master.** Penyimpan Materi dibuat mencolok: aura ungu di kaki, empat bintang mengorbit, label ungu **MATERI** yang naik-turun
di atas kepala (hijau "MATERI OK" bila semua topik sudah dibaca), dan nama berwarna ungu. Di minimap ia berupa berlian ungu besar dengan cincin
berdenyut (hijau bila materi sudah dibaca), berbeda dari titik hijau (guru) dan merah (penjahat). Ia juga **berkeliling bebas** (radius 7 petak
dari titik asal, diatur di `data/areas.js`), jadi cari label MATERI atau titik ungu di minimap. Mode **Kurangi animasi** mematikan aura dan gerak.

## Panduan dan petunjuk untuk siswa

- **Panduan Bermain** (4 halaman: cara bergerak sesuai mode GUI/CLI, arti penanda, alur belajar, dan cara mencari bantuan). Terbuka otomatis saat
  pertama kali profil masuk dunia (`guideSeen` di profil), dan bisa dibuka lagi lewat tombol **Panduan** di bilah atas atau di kartu Petunjuk.
- **Catatan Misi** adalah kartu bergaya game (latar gelap, tepi kuning berdenyut, tulisan besar) di pojok kiri atas peta yang selalu tampil (pengingat misi + panduan cepat). Isinya daftar
  langkah dengan tanda ✓ (selesai), ▶ (sedang dikerjakan), dan • (berikutnya): di Plaza menunjuk gerbang berikutnya; di stage berisi
  *Temui Penyimpan Materi*, *Baca semua materi (x/y)*, *Masuk portal Level dan lawan musuh*, *Kembali ke Plaza*. Baris panduan cepat menyesuaikan
  mode GUI/CLI. Tombol **Tunjukkan** menyalakan penanda arah di peta dan menulis jumlah langkah (mode CLI disertai perintah siap ketik),
  tombol **Panduan** membuka panduan lengkap, dan tombol –/+ menciutkan catatan (pilihan diingat di browser).
- Saat masuk stage yang materinya belum lengkap, muncul toast pengingat mencari Penyimpan Materi. Dialog Nara dan Bugbyte juga menjelaskan
  alur ini dan menyebut tombol Panduan.

**Spanduk nama zona.** Saat masuk sebuah peta, nama zona tampil selama 3 detik di **tengah** layar (bukan di pojok), supaya tidak tertutup minimap
dan catatan misi. Catatan misi memudar sementara selama spanduk tampil.

## Bangunan portal

Setiap gerbang dan portal berupa **gedung 3×3 ubin** yang sesuai namanya, dengan pintu di ubin portal. Gedung **bisa dilewati** dari sisi mana pun, jadi portal tidak harus dimasuki lewat pintu. Pemain di utara gedung tertutup olehnya, dan saat pemain berada di dalam gedung, gedung memudar agar karakter tetap terlihat. Setelah keluar stage, pemain muncul di selatan gerbang. Digambar oleh `drawBuilding` di `js/world.js`:

| Gerbang / portal | Bangunan | Animasi |
|---|---|---|
| AKADEMI (VCS) | gedung sekolah berkolom | bendera berkibar, jendela menyala berkedip |
| Level 1 (di dalam Akademi) | ruang kelas: papan tulis, jam, lampu, meja | tulisan kapur bergulir, jarum jam berputar, lampu berkedip |
| Level 2–7 (di dalam stage lain) | **portal matriks**: bingkai digital berisi hujan kode, bentuk dan warna beda per stage | lihat tabel di bawah |
| 3 ZONA | tiga menara W / S / R | tiap zona menyala bergantian |
| SETUP | bengkel | roda gigi berputar, percik |
| TERMINAL | gedung layar terminal | teks hijau bergulir, kursor berkedip |
| COMMIT | bengkel tempa | cerobong berasap, tungku berkobar |
| BRANKAS | brankas baja | roda putar, lampu alarm, laser pemindai |
| BENTENG | benteng gelap | panji berkibar, mata bos berdenyut, bara lava |
| Pintu keluar | gapura batu | rune kuning berdenyut, kilau naik |

Portal level di dalam stage: Akademi berupa ruang kelas, stage lain berupa portal matriks.

| Stage | Portal matriks | Animasi khas |
|---|---|---|
| Tiga Zona | bingkai ungu, warna berganti kuning/biru/ungu | tiga orb mengorbit |
| Setup | bingkai teal | roda gigi berputar |
| Terminal | bingkai hijau | garis pindai turun-naik |
| Commit | bingkai tungku dengan cerobong | bara api naik |
| Brankas | bingkai garis bahaya, merah muda | laser silang menyapu |
| Benteng | bingkai merah gelap | pusaran kotak berputar dan kilat |

Semuanya berisi hujan kode berkepala terang. Gedung terkunci tampak redup, dan yang sudah selesai diberi lencana centang
hijau. Mode **Kurangi animasi** membuat gedung diam. Saat dihitung, petak gedung dikecualikan dari dekorasi acak dan keterjangkauan tetap
diperiksa otomatis.

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

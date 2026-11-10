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

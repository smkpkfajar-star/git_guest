# Aset GIT QUEST

Seluruh aset gambar dan audio di folder ini **dibuat sendiri untuk proyek ini** (SVG pixel art dan
audio chiptune yang disintesis dari kode), sehingga tidak ada masalah hak cipta. Font berasal dari
proyek open-source berlisensi SIL Open Font License (OFL).

## Isi

| Folder | File | Dipakai di |
|---|---|---|
| `images/characters/` | `player`, `nara`, `bugbyte`, `glitch`, dan 7 monster `enemy-*` (.svg) | Sprite versi gambar; `bugbyte.svg` jadi favicon. Karakter pemain dan NPC digambar dari kode (`js/chars.js`) sehingga bisa diwarnai ulang. |
| `images/backgrounds/` | `splash`, `codeforge-office`, `level-vcs`, `level-three-zones`, `level-setup`, `level-commands`, `level-commit`, `level-gitignore`, `level-final` (.svg) | Latar adegan: splash/dashboard, profil/intro (kantor), dan tiap level (`bg-<id>` di CSS) |
| `images/icons/` | `logo`, `logo-block` (logo balok batu ala Minecraft di splash), `xp`, `achievement`, `lock`, `check`, `cross`, `hint`, `file`, `folder`, `terminal`, `status-untracked/modified/staged/committed` (.svg) | Logo splash, XP, pencapaian, status misi, petunjuk, terminal, kartu status berkas |
| `images/icons/` | `diagram-three-zones`, `diagram-status`, `diagram-vcs` (.svg) | Diagram pada halaman materi |
| `audio/` | `music-title`, `music-world`, `music-vcs`, `music-three-zones`, `music-setup`, `music-commands`, `music-commit`, `music-gitignore`, `music-final` (.wav) | Backsound berbeda untuk menu, peta, dan tiap stage (berpindah dengan crossfade) |
| `audio/` | `sfx-click`, `sfx-correct`, `sfx-wrong`, `sfx-hint`, `sfx-unlock`, `sfx-complete`, `sfx-victory`, `sfx-portal`, `sfx-fight`, `sfx-boss`, `sfx-jump`, `sfx-levelup` (.wav) | Efek suara, termasuk dentuman masuk stage, FIGHT!, dan peringatan bos |
| `fonts/` | `press-start-2p`, `inter` (400, 700), `jetbrains-mono` (.woff2) | Judul pixel, teks isi, terminal |

File yang belum dipakai di tampilan (`file`, `folder`, `cross`, karakter `.svg`) disediakan untuk
pengembangan berikutnya, misalnya Level 4–6.

## Atribusi dan lisensi

| Aset | Sumber | Lisensi |
|---|---|---|
| Gambar SVG (karakter, ikon, logo, latar, diagram) | Dibuat untuk proyek ini | Bebas dipakai dalam proyek |
| Audio WAV (efek dan musik) | Disintesis dari gelombang kotak/segitiga/noise; dibuat untuk proyek ini | Bebas dipakai dalam proyek |
| Press Start 2P | CodeMan38, via paket Fontsource | SIL OFL 1.1 |
| Inter | Rasmus Andersson, via paket Fontsource | SIL OFL 1.1 |
| JetBrains Mono | JetBrains, via paket Fontsource | SIL OFL 1.1 |

Catatan font: OFL mengizinkan dipakai dan didistribusikan bersama proyek, selama nama font tidak
dijual terpisah dan pemberitahuan lisensinya disertakan. Teks lisensi lengkap ada di halaman
masing-masing font pada https://fontsource.org.

## Mengganti aset

Ganti file dengan nama yang sama (ukuran dan rasio boleh berbeda), atau ubah referensinya di
`css/style.css` (latar: `.bg-*`, font: `@font-face`) dan `js/app.js`.
Latar disimpan sebagai SVG 160×90 piksel dan diskalakan penuh layar dengan `image-rendering: pixelated`.

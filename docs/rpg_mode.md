# Mode RPG — GIT QUEST

Pembaruan konsep: game tidak lagi hanya berbentuk kuis berurutan. Pemain menjelajahi dunia, bertemu NPC,
lalu bertarung melawan monster Glitch di tiap level. **Aturan belajar dan penilaian di `game_rules.md`
tidak berubah**; lapisan RPG hanya mengubah cara menyajikannya.

## Alur

`Splash → Profil → Intro → Dunia → (NPC / Portal) → Materi → Pertarungan → Hasil → Dunia`

Mode **Daftar** (kartu misi) tetap tersedia lewat tombol *Mode Daftar* sebagai alternatif aksesibilitas
(keyboard, layar sempit, pemain yang tidak nyaman dengan gerak). Pilihan mode disimpan di save.

## Dunia (overworld)

- Peta ubin 24×13. Gerak: panah/WASD atau tombol arah di layar. Interaksi: Enter/Spasi atau tombol *Aksi*.
- 7 portal bernomor = 7 misi. Status portal: biru (tersedia), hijau bercentang (selesai),
  abu-abu bergembok (terkunci), ungu (segera hadir), merah (Final Boss).
- Berjalan ke NPC untuk bicara: Nara (arahan misi), Bugbyte (tips kontrol), Dev Senior dan Dev Magang
  (tips Git), Glitch (cerita).
- Panel *Misi Aktif* menunjukkan portal yang harus dituju.

## Pertarungan

| Elemen RPG | Pemetaan ke aturan belajar |
|---|---|
| Satu level = satu monster | Satu misi |
| Satu ronde | Satu tantangan |
| Jawaban benar = serangan | Tantangan selesai; poin 100/70/50 sesuai §2 |
| Serangan kritis | Benar pada percobaan pertama tanpa petunjuk (efek visual saja) |
| HP musuh | Sisa tantangan misi (turun rata tiap tantangan selesai) |
| Jawaban salah = musuh menyerang | HP pemain −12 (efek visual saja) |
| Item Petunjuk (Bugbyte) | Petunjuk §6: mengurangi poin, bukan XP |
| Monster dikalahkan | Seluruh tantangan misi dijawab; lulus bila nilai ≥ 70 |

### Aturan penting

- **Tidak ada game over.** Jika HP pemain habis, Nara menyembuhkan pemain (HP kembali 60). Skor dan XP
  tidak berkurang (sejalan dengan "XP tidak dikurangi karena kesalahan", §1 aturan 5).
- HP tidak disimpan di save dan tidak memengaruhi skor, XP, rank, maupun kondisi kemenangan.
- Semua perhitungan tetap di `js/scoring.js`.

## Tipe game per stage

Tiap stage memakai tipe game berbeda (kuis, sortir konveyor, terminal berwaktu, fast typing, simulator repositori, security sweep, boss rush). Rinciannya ada di `stage_games.md`. Setelah selesai, pemain wajib kembali ke peta untuk membuka portal berikutnya.

## Monster

| Level | Monster | Serangan |
|---|---|---|
| 1 | Ghost Server | Single Point Failure |
| 2 | Zone Wraith | Zona Tersesat |
| 3 | Config Imp | Salah Konfigurasi |
| 4 | Status Slime | Output Lengket |
| 5 | Commit Goblin | Pesan Commit Asal |
| 6 | Vault Guardian | Kebocoran Rahasia |
| Final | Glitch Prime | Kekacauan Total |

Sprite: `assets/images/characters/enemy-*.svg`. Data di `data/missions.js` (`enemy`).

## Berkas terkait

- `js/world.js` — peta, gerak, tabrakan, NPC, portal (canvas).
- `js/app.js` — adegan dunia, dialog NPC/portal, arena pertarungan (`buildArena`).
- `css/style.css` — bagian "RPG: dunia & arena pertarungan".

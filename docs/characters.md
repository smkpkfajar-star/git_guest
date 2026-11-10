# Karakter & Naik Level — GIT QUEST

## Gaya visual

Karakter bergaya **anime chibi** (sprite 16×22 piksel + garis tepi otomatis): mata besar berkilau, pipi merona,
rambut berlapis dengan kilau dan bayangan. Semua pakaian **sopan**: lengan panjang, celana atau rok panjang,
dan tersedia karakter berhijab. Sprite dirakit dari bagian-bagian (gaya rambut, pakaian, aksesori, kaki) di `js/chars.js`,
sehingga setiap karakter bisa diwarnai ulang tanpa gambar baru.

Frame animasi: diam (berkedip otomatis), berjalan (dua langkah), dan bicara.

## 10 karakter pilihan

| Karakter | Sifat | Gaya |
|---|---|---|
| Rafi | Pemberani | rambut berdiri, hoodie biru |
| Sari | Cerdas | rambut panjang, blazer dengan pita, rok |
| Dimas | Teliti | rambut miring, kacamata, jaket hijau |
| Nisa | Tenang | **hijab**, jaket krem, rok panjang |
| Kenzo | Gesit | rambut merah berdiri, ikat kepala, jaket gelap |
| Mika | Ceria | rambut kuncir dua, headphone telinga kucing |
| Arga | Tangguh | topi, jaket oranye |
| Luna | Pendiam | rambut bob, seragam dengan pita |
| Bima | Disiplin | kuncir kuda, baju bela diri putih |
| Zara | Penyihir | sanggul, jubah ungu, jepit bintang |

Karakter dipilih setelah membuat profil (layar **Buat Karakter**) dan dapat diubah kapan saja lewat
*Pengaturan → Ubah karakter*.

## Kustomisasi

Warna **rambut/hijab, baju, aksen, kulit, dan mata**: tiap bagian punya palet siap pakai ditambah pemilih warna bebas.
Ada tombol **Acak**. Pilihan disimpan di profil (`profile.char`) dan divalidasi saat impor/muat.

## Efek naik level

Level naik tiap 60 XP (`xpPerLevel`). Efek karakter bertambah dan bersifat kumulatif:

| Level | Gelar | Efek baru |
|---|---|---|
| 1 | Junior Developer | — |
| 2 | Git Apprentice | Aura bercahaya |
| 3 | Commit Knight | Cincin energi di kaki |
| 4 | Branch Ranger | Jubah pelindung |
| 5 | Merge Mage | Orb energi mengorbit |
| 6 | Repo Sage | Petir energi |
| 7+ | Git Grandmaster | Mahkota emas & jejak cahaya |

Saat level naik, layar **LEVEL UP!** menampilkan karakter berevolusi dengan efek baru. Pratinjau semua tingkat efek
tersedia di layar Buat Karakter (tombol Lv1–Lv7). Efek tampil di peta, arena, intro, sinematik, dan HUD, dan mengikuti
pengaturan **Kurangi animasi**.

Level, gelar, dan efek murni kosmetik: tidak memengaruhi skor, XP, rank, maupun kondisi kemenangan.

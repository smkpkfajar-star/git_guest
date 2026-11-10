/* areas.js — data peta dunia GIT QUEST (hanya data, tanpa logika).
   Satu Plaza (hub) + satu peta per stage. Setiap peta punya portal misi, pintu keluar,
   dan NPC: "good" (guru) menjelaskan materi, "evil" (jahat) menyebar kebiasaan buruk lalu mengaku di akhir.
   Peta digambar di js/world.js; jalur antar-titik dan dekorasi dibuat otomatis (seed tetap). */
(function () {
  'use strict';

  var A = {};

  /* ---------- Plaza (hub) ---------- */
  A.plaza = {
    id: 'plaza', name: 'Plaza CodeForge', sub: 'Pusat dunia — pilih gerbang menuju stage', w: 44, h: 26, seed: 11,
    spawn: { x: 4, y: 13 },
    theme: { a: '#1a2332', b: '#1c2638', ln: '#273449', wall: '#0b1220', wallIn: '#111827', edge: '#4c1d95', path: '#2563EB', glow: '#60a5fa', decor: ['server', 'term', 'lamp', 'crystal'], dens: .12 },
    portals: [
      { kind: 'gate', mission: 0, to: 'vcs', x: 6, y: 22, label: 'AKADEMI' },
      { kind: 'gate', mission: 1, to: 'three-zones', x: 16, y: 22, label: '3 ZONA' },
      { kind: 'gate', mission: 2, to: 'setup', x: 26, y: 22, label: 'SETUP' },
      { kind: 'gate', mission: 3, to: 'commands', x: 37, y: 18, label: 'TERMINAL' },
      { kind: 'gate', mission: 4, to: 'commit', x: 38, y: 8, label: 'COMMIT' },
      { kind: 'gate', mission: 5, to: 'gitignore', x: 28, y: 4, label: 'BRANKAS' },
      { kind: 'gate', mission: 6, to: 'final', x: 17, y: 4, label: 'BENTENG' }
    ],
    npcs: [
      { id: 'nara', sprite: 'nara', x: 6, y: 13, name: 'Nara', kind: 'good', say: ['Halo!', 'Semangat ya!', 'Ayo mulai!'] },
      { id: 'bugbyte', sprite: 'bugbyte', x: 8, y: 19, name: 'Bugbyte', kind: 'good', say: ['Bip bip!', 'Aku siaga!', 'Scan... aman!'] },
      { id: 'dev1', sprite: 'dev1', x: 21, y: 16, name: 'Dev Senior', kind: 'good', say: ['Commit dulu!', 'git log, bro.'] },
      { id: 'dev2', sprite: 'dev2', x: 32, y: 13, name: 'Dev Magang', kind: 'good', say: ['Git itu seru!', 'Sudah di-stage?'] },
      { id: 'glitch', sprite: 'glitch', x: 10, y: 6, name: 'Glitch', kind: 'evil', say: ['Hehe...', 'Bug bug bug!', 'Awas aku!'] }
    ]
  };

  /* ---------- Stage 1: Akademi Developer (VCS) ---------- */
  A.vcs = {
    id: 'vcs', name: 'Akademi Developer', sub: 'Level 1 — Version Control System', w: 36, h: 22, seed: 21, ambient: 'vcs',
    spawn: { x: 3, y: 19 },
    theme: { a: '#162033', b: '#18253a', ln: '#24405f', wall: '#0b1220', wallIn: '#10233f', edge: '#2563EB', path: '#38bdf8', glow: '#38bdf8', decor: ['shelf', 'shelf', 'term', 'lamp', 'plant'], dens: .14 },
    portals: [{ kind: 'exit', to: 'plaza', x: 2, y: 19, label: 'PLAZA' }, { kind: 'mission', mission: 0, x: 32, y: 3, label: 'LEVEL 1' }],
    npcs: [
      { id: 'prof', sprite: 'prof', x: 9, y: 16, name: 'Prof. Versi', kind: 'good', say: ['Mari belajar!', 'VCS itu penting.'],
        lines: ['Selamat datang di Akademi Developer! Version Control System (VCS) adalah sistem yang mencatat setiap perubahan berkas dari waktu ke waktu.',
          'Dengan VCS kamu bisa melihat siapa mengubah apa dan kapan, kembali ke versi lama, dan bekerja bersama tanpa saling menimpa pekerjaan.',
          'Portal Level 1 ada di pojok kanan atas. Pelajari materinya dulu, lalu hadapi tantangannya!'] },
      { id: 'copy', sprite: 'copy', x: 17, y: 11, name: 'Si Copy-Paste', kind: 'evil', say: ['Hehehe!', 'Salin saja!'],
        lines: ['Hehehe! Buat apa VCS? Cukup salin foldernya saja: "proyek_final", "proyek_final_v2", "proyek_final_BENERAN"!',
          'Lalu kalau ada bug, kamu bingung versi mana yang benar. Mantap, kan? Hahaha!',
          '(Pengakuan) Itulah kelemahanku. Dengan VCS setiap perubahan tercatat rapi dan bisa dibatalkan. Jangan tiru aku!'] },
      { id: 'sage1', sprite: 'sage', x: 26, y: 8, name: 'Kak Terdistribusi', kind: 'good', say: ['Pilih Git!', 'Salinan lengkap!'],
        lines: ['Ada dua jenis VCS: terpusat (centralized) dan terdistribusi (distributed).',
          'Pada VCS terpusat, riwayat proyek hanya ada di satu server. Pada VCS terdistribusi seperti Git, setiap developer punya salinan penuh riwayat di komputernya.',
          'Karena itu Git tetap bisa dipakai saat offline, dan proyek tetap aman walau server rusak.'] },
      { id: 'serverdown', sprite: 'virus', x: 22, y: 16, name: 'Server Tumbang', kind: 'evil', say: ['Bzzt!', 'Aku mati...'],
        lines: ['Bzzt... Aku server pusat dan aku sedang MATI! Semua developer tidak bisa bekerja!',
          '(Pengakuan) Ini disebut single point of failure pada VCS terpusat. Pada Git, siapa pun yang punya salinan bisa memulihkan proyek.'] }
    ]
  };

  /* ---------- Stage 2: Kota Tiga Zona ---------- */
  A['three-zones'] = {
    id: 'three-zones', name: 'Kota Tiga Zona', sub: 'Level 2 — Working Directory, Staging, Repository', w: 38, h: 22, seed: 32, ambient: 'three-zones',
    spawn: { x: 3, y: 19 },
    theme: { a: '#1a1a35', b: '#1d1d3d', ln: '#33336b', wall: '#0b0b20', wallIn: '#17163a', edge: '#A855F7', path: '#a78bfa', glow: '#a855f7', decor: ['crate', 'crate', 'crystal', 'pillar', 'lamp'], dens: .14 },
    portals: [{ kind: 'exit', to: 'plaza', x: 2, y: 19, label: 'PLAZA' }, { kind: 'mission', mission: 1, x: 34, y: 3, label: 'LEVEL 2' }],
    npcs: [
      { id: 'stage1', sprite: 'sage', x: 10, y: 15, name: 'Kak Stage', kind: 'good', say: ['Tiga zona!', 'add lalu commit.'],
        lines: ['Git punya tiga area: Working Directory (tempat kamu mengedit berkas), Staging Area (daftar perubahan yang siap disimpan), dan Local Repository (riwayat commit).',
          'Alurnya: edit → git add → git commit. Bayangkan keranjang belanja: git add memasukkan barang ke keranjang, git commit membayarnya ke riwayat.'] },
      { id: 'status1', sprite: 'guard', x: 19, y: 8, name: 'Penjaga Status', kind: 'good', say: ['Cek status!', 'Siapa yang berubah?'],
        lines: ['Setiap berkas punya status. Untracked: berkas baru yang belum dilacak Git. Modified: berkas terlacak yang sudah diubah.',
          'Staged: sudah di-add dan siap di-commit. Committed: sudah tersimpan aman di repository. Lihat semuanya dengan git status.'] },
      { id: 'noadd', sprite: 'rogue', x: 26, y: 15, name: 'Si Lupa Add', kind: 'evil', say: ['Langsung commit!', 'Add? Nggak perlu!'],
        lines: ['Hehe! Langsung git commit saja! Tidak perlu git add, kan?',
          '(Pengakuan) Ups... tanpa git add tidak ada perubahan di Staging Area, jadi Git akan menjawab "nothing added to commit". Staging menentukan apa yang masuk ke commit.'] },
      { id: 'bbzone', sprite: 'bugbyte', x: 29, y: 8, name: 'Bugbyte Pemindai', kind: 'good', say: ['Bip! Scan...', 'Status: Staged.'],
        lines: ['Bip! Contoh alur status: berkas baru = Untracked. Setelah git add = Staged. Setelah git commit = Committed. Diubah lagi = Modified.'] }
    ]
  };

  /* ---------- Stage 3: Stasiun Setup ---------- */
  A.setup = {
    id: 'setup', name: 'Stasiun Setup', sub: 'Level 3 — git config & git init', w: 38, h: 22, seed: 43, ambient: 'setup',
    spawn: { x: 3, y: 19 },
    theme: { a: '#0f2a22', b: '#12302a', ln: '#1c5444', wall: '#06130f', wallIn: '#0e2a22', edge: '#22C55E', path: '#34d399', glow: '#22C55E', decor: ['term', 'term', 'server', 'lamp', 'crate'], dens: .14 },
    portals: [{ kind: 'exit', to: 'plaza', x: 2, y: 19, label: 'PLAZA' }, { kind: 'mission', mission: 2, x: 34, y: 3, label: 'LEVEL 3' }],
    npcs: [
      { id: 'config1', sprite: 'guard', x: 9, y: 14, name: 'Satpam Config', kind: 'good', say: ['Kenalkan dirimu!', 'Isi identitas.'],
        lines: ['Sebelum commit, Git perlu tahu siapa kamu. Atur dengan: git config --global user.name "Nama Kamu" dan git config --global user.email "email@contoh.com".',
          'Opsi --global berlaku untuk semua repositori di komputer ini. Tanpa --global, pengaturan hanya berlaku di repositori saat ini.'] },
      { id: 'init1', sprite: 'dev2', x: 18, y: 8, name: 'Kak Init', kind: 'good', say: ['git init!', 'Mulai repositori.'],
        lines: ['git init membuat repositori baru: folder tersembunyi bernama .git dibuat untuk menyimpan seluruh riwayat proyek. Jalankan sekali di folder proyekmu.',
          'Setelah itu, git status akan menunjukkan keadaan repositori. Untuk memeriksa pengaturanmu, pakai git config --list.'] },
      { id: 'anon', sprite: 'glitch', x: 25, y: 14, name: 'Si Anonim', kind: 'evil', say: ['Anonim saja!', 'Hehe...'],
        lines: ['Hehe, identitas? Kosongkan saja! Semua commit-mu jadi anonim dan tidak ada yang tahu siapa pelakunya!',
          '(Pengakuan) Padahal Git menyimpan nama dan email pembuat di setiap commit. Tanpa itu kerja tim jadi kacau. Isi identitasmu dulu!'] },
      { id: 'dotgit', sprite: 'virus', x: 30, y: 9, name: 'Hantu .git', kind: 'evil', say: ['Hapus aku!', 'Buuu!'],
        lines: ['Buuu! Aku folder .git yang tersembunyi. Hapus saja aku, siapa peduli?',
          '(Pengakuan) Jangan! Menghapus .git berarti menghapus seluruh riwayat commit proyekmu. Biarkan ia di tempatnya.'] }
    ]
  };

  /* ---------- Stage 4: Jalur Terminal ---------- */
  A.commands = {
    id: 'commands', name: 'Jalur Terminal', sub: 'Level 4 — status, add, diff, log', w: 40, h: 22, seed: 54, ambient: 'commands',
    spawn: { x: 3, y: 19 },
    theme: { a: '#10261f', b: '#122c24', ln: '#1b4d3d', wall: '#04110d', wallIn: '#0b251d', edge: '#34d399', path: '#4ade80', glow: '#4ade80', decor: ['term', 'server', 'term', 'pillar', 'lamp'], dens: .13 },
    portals: [{ kind: 'exit', to: 'plaza', x: 2, y: 19, label: 'PLAZA' }, { kind: 'mission', mission: 3, x: 36, y: 3, label: 'LEVEL 4' }],
    npcs: [
      { id: 'log1', sprite: 'arch', x: 9, y: 14, name: 'Pustakawan Log', kind: 'good', say: ['Riwayat tercatat.', 'git log!'],
        lines: ['git log menampilkan riwayat commit: hash, penulis, tanggal, dan pesan. Tambahkan --oneline untuk ringkasan satu baris per commit.',
          'Riwayat tersusun dari yang terbaru ke yang terlama.'] },
      { id: 'bbcmd', sprite: 'bugbyte', x: 18, y: 8, name: 'Bugbyte', kind: 'good', say: ['Bip! status.', 'Lihat diff!'],
        lines: ['git status = laporan keadaan berkas. git diff = lihat isi perubahan yang belum di-stage. git diff --staged = lihat perubahan yang sudah di-stage.',
          'Biasakan git status sebelum git add.'] },
      { id: 'add1', sprite: 'dev1', x: 26, y: 14, name: 'Kapten Add', kind: 'good', say: ['git add!', 'Masuk keranjang.'],
        lines: ['git add nama-berkas memasukkan satu berkas ke Staging Area. git add . memasukkan semua perubahan di folder ini.',
          'Sebelum add semuanya, cek dulu dengan git status.'] },
      { id: 'addall', sprite: 'rogue', x: 31, y: 8, name: 'Force Add', kind: 'evil', say: ['Add semuanya!', 'Tanpa cek!'],
        lines: ['Pakai saja git add . terus tanpa melihat apa pun! Siapa peduli isinya?',
          '(Pengakuan) Berisiko: berkas rahasia atau sampah bisa ikut ter-commit. Biasakan git status dan git diff sebelum git add.'] }
    ]
  };

  /* ---------- Stage 5: Bengkel Commit ---------- */
  A.commit = {
    id: 'commit', name: 'Bengkel Commit', sub: 'Level 5 — commit & Conventional Commits', w: 40, h: 22, seed: 65, ambient: 'commit',
    spawn: { x: 3, y: 19 },
    theme: { a: '#2a1f12', b: '#2e2214', ln: '#5a4320', wall: '#120c04', wallIn: '#2a1d0a', edge: '#EAB308', path: '#fbbf24', glow: '#fbbf24', decor: ['crate', 'crate', 'term', 'lamp', 'pillar'], dens: .14 },
    portals: [{ kind: 'exit', to: 'plaza', x: 2, y: 19, label: 'PLAZA' }, { kind: 'mission', mission: 4, x: 36, y: 3, label: 'LEVEL 5' }],
    npcs: [
      { id: 'mcommit', sprite: 'mentor', x: 9, y: 14, name: 'Master Commit', kind: 'good', say: ['Commit rapi!', 'Satu perubahan.'],
        lines: ['Commit adalah potret perubahan proyek. Setelah git add, simpan dengan git commit -m "pesan".',
          'Satu commit sebaiknya berisi satu perubahan yang logis. Jangan campur perbaikan bug dengan fitur baru.'] },
      { id: 'conv', sprite: 'sage', x: 18, y: 8, name: 'Kak Konvensi', kind: 'good', say: ['feat atau fix?', 'Pakai tipe!'],
        lines: ['Conventional Commits memakai format tipe: deskripsi. Contoh: feat: tambah halaman login, fix: perbaiki tombol submit, docs: perbarui README.',
          'Tipe umum: feat (fitur baru), fix (perbaikan bug), docs (dokumentasi), style, refactor, test, dan chore (perawatan).'] },
      { id: 'asal', sprite: 'copy', x: 26, y: 14, name: 'Si Asal-Asalan', kind: 'evil', say: ['update...', 'asdf!'],
        lines: ['Pesan commit cukup "update", "fix lagi", atau "asdf"! Hahaha, hemat waktu!',
          '(Pengakuan) Sebulan kemudian tidak ada yang tahu apa yang berubah. Tulis pesan jelas, misalnya "fix: perbaiki validasi email".'] },
      { id: 'tips5', sprite: 'dev2', x: 31, y: 8, name: 'Dev Magang', kind: 'good', say: ['Sering commit!', 'Kecil tapi jelas.'],
        lines: ['Tips: commit kecil dan sering lebih mudah dilacak daripada satu commit raksasa. Pesannya pun jadi jelas.'] }
    ]
  };

  /* ---------- Stage 6: Brankas Keamanan ---------- */
  A.gitignore = {
    id: 'gitignore', name: 'Brankas Keamanan', sub: 'Level 6 — .gitignore & berkas rahasia', w: 40, h: 22, seed: 76, ambient: 'gitignore',
    spawn: { x: 3, y: 19 },
    theme: { a: '#1f1428', b: '#231630', ln: '#4a2a5e', wall: '#0c0612', wallIn: '#21113a', edge: '#EF4444', path: '#f472b6', glow: '#f472b6', decor: ['vault', 'vault', 'pillar', 'lamp', 'crystal'], dens: .14 },
    portals: [{ kind: 'exit', to: 'plaza', x: 2, y: 19, label: 'PLAZA' }, { kind: 'mission', mission: 5, x: 36, y: 3, label: 'LEVEL 6' }],
    npcs: [
      { id: 'vault1', sprite: 'vault', x: 9, y: 14, name: 'Penjaga Brankas', kind: 'good', say: ['Lindungi rahasia!', '.gitignore!'],
        lines: ['.gitignore berisi daftar berkas atau folder yang tidak boleh dilacak Git, seperti node_modules/, *.log, dan .env.',
          'Pola: *.log = semua berkas berakhiran .log. folder/ = seluruh folder. !penting.log = pengecualian (tetap dilacak).'] },
      { id: 'secret1', sprite: 'arch', x: 18, y: 8, name: 'Kak Rahasia', kind: 'good', say: ['Jaga .env!', 'Kunci itu rahasia.'],
        lines: ['Berkas rahasia seperti .env (password, API key, token) tidak boleh masuk repositori. Sekali ter-commit, ia tetap ada di riwayat meski dihapus.',
          'Taruh .env di .gitignore SEBELUM commit pertama.'] },
      { id: 'thief', sprite: 'leak', x: 26, y: 14, name: 'Pencuri Rahasia', kind: 'evil', say: ['Kuncimu mana?', 'Hehe...'],
        lines: ['Hehe! Commit saja berkas .env-mu ke GitHub publik, nanti API key-mu kupakai!',
          '(Pengakuan) Itulah bahayanya. Masukkan .env ke .gitignore sebelum commit. Kalau sudah bocor, segera ganti kuncinya.'] },
      { id: 'nodemod', sprite: 'virus', x: 31, y: 8, name: 'Si Berat node_modules', kind: 'evil', say: ['Aku berat!', 'Gendong aku!'],
        lines: ['Aku node_modules, ukuranku ratusan MB! Ayo masukkan aku ke repositori!',
          '(Pengakuan) Folder hasil unduhan atau build tidak perlu dilacak: cukup daftar dependensi (package.json). Taruh aku di .gitignore.'] }
    ]
  };

  /* ---------- Stage 7: Benteng Merge (final) ---------- */
  A.final = {
    id: 'final', name: 'Benteng Merge', sub: 'Final Boss — uji semua kemampuanmu', w: 42, h: 24, seed: 87, ambient: 'final',
    spawn: { x: 3, y: 21 },
    theme: { a: '#2a1218', b: '#2e1519', ln: '#5e2330', wall: '#12060a', wallIn: '#2a0d14', edge: '#EF4444', path: '#f87171', glow: '#ef4444', decor: ['pillar', 'pillar', 'crystal', 'lamp', 'vault'], dens: .12 },
    portals: [{ kind: 'exit', to: 'plaza', x: 2, y: 21, label: 'PLAZA' }, { kind: 'mission', mission: 6, x: 38, y: 3, label: 'BOSS' }],
    npcs: [
      { id: 'mmerge', sprite: 'mentor', x: 9, y: 16, name: 'Master Merge', kind: 'good', say: ['Kamu siap?', 'Ingat dasarnya.'],
        lines: ['Selamat datang di Benteng Final! Ringkasan: edit → git add → git commit. Atur identitas dengan git config, mulai repositori dengan git init.',
          'Pantau dengan git status, git diff, dan git log. Lindungi berkas rahasia dengan .gitignore, dan tulis pesan commit yang jelas.'] },
      { id: 'narafinal', sprite: 'nara', x: 18, y: 10, name: 'Nara', kind: 'good', say: ['Semangat!', 'Tenang dan teliti.'],
        lines: ['Bos terakhir menguji ketikan cepat, pemindaian keamanan, dan penyortiran area Git. Tenang dan teliti, ya!',
          'Kalau ragu, ingat alurnya dan jangan terburu-buru memasukkan semua berkas.'] },
      { id: 'lordconf', sprite: 'boss', x: 27, y: 16, name: 'Lord Merge Conflict', kind: 'evil', say: ['Kuhancurkan!', 'Konflik!'],
        lines: ['Muahaha! Aku Lord Merge Conflict! Kuhancurkan commit-mu dengan konflik tak berujung!',
          '(Pengakuan) Konflik muncul saat dua orang mengubah baris yang sama. Penandanya <<<<<<<, =======, >>>>>>>; pilih isi yang benar lalu commit. Itu materi lanjutan, kuasai dasarnya dulu!'] },
      { id: 'glitchf', sprite: 'glitch', x: 32, y: 9, name: 'Glitch', kind: 'evil', say: ['Hehe...', 'Aku menunggu.'],
        lines: ['Hehehe! Kalau kamu lupa add, lupa identitas, atau commit rahasia... aku yang menang!',
          '(Pengakuan) Semua jebakanku sudah kamu pelajari di stage-stage sebelumnya. Kalahkan bos dan buktikan!'] }
    ]
  };

  /* ---------- latar wilayah: tekstur lantai, gaya dinding, partikel ---------- */
  function biome(id, floor, wallStyle, mote) { var t = A[id].theme; t.floor = floor; t.wallStyle = wallStyle; t.mote = mote; }
  biome('plaza', 'paving', 'tech', { c: ['#22d3ee', '#60a5fa'], dir: 1 });
  biome('vcs', 'carpet', 'brick', { c: ['#fde047', '#93c5fd'], dir: 1 });
  biome('three-zones', 'panels', 'tech', { c: ['#a78bfa', '#38bdf8', '#fde047'], dir: 1 });
  biome('setup', 'circuit', 'tech', { c: ['#34d399', '#22d3ee'], dir: 1 });
  biome('commands', 'matrix', 'tech', { c: ['#4ade80', '#22C55E'], dir: -1 });
  biome('commit', 'planks', 'brick', { c: ['#fbbf24', '#f97316'], dir: 1 });
  biome('gitignore', 'hazard', 'tech', { c: ['#f472b6', '#EF4444'], dir: 1 });
  biome('final', 'lava', 'lava', { c: ['#f97316', '#fbbf24', '#ef4444'], dir: 1 });

  /* ---------- warga tambahan: berkeliaran (wander) di sekitar titik awalnya, memberi tips singkat ---------- */
  function crowd(id, list) { list.forEach(function (n) { A[id].npcs.push(n); }); }
  function G(id, sprite, x, y, name, say, lines, w) { return { id: id, sprite: sprite, x: x, y: y, name: name, kind: 'good', say: say, lines: lines, wander: w }; }
  function E(id, sprite, x, y, name, say, lines, w) { return { id: id, sprite: sprite, x: x, y: y, name: name, kind: 'evil', say: say, lines: lines, wander: w }; }
  crowd('plaza', [
    G('w_sinta', 'siswa1', 14, 12, 'Sinta', ['Halo!', 'Aku siswa baru.'], ['Aku baru belajar Git! Katanya tiap stage punya peta sendiri.', 'Ajak bicara guru di tiap peta, nama mereka berwarna hijau.'], 4),
    G('w_aisyah', 'siswa2', 30, 16, 'Aisyah', ['Semangat!', 'Git itu seru.'], ['Tips: lupa perintah? Ketik git help di terminal untuk melihat daftar perintah.'], 4),
    G('w_rian', 'pelari', 20, 9, 'Rian', ['Lari lari!', 'Ayo olahraga!'], ['Aku lari keliling Plaza biar semangat ngoding!', 'Setiap commit kecil itu seperti satu langkah lari: pelan tapi pasti.'], 5),
    G('w_rina', 'ibu', 24, 14, 'Bu Rina', ['Kerjakan berurutan.', 'Belajar yang rajin.'], ['Kerjakan level secara berurutan. Gerbang yang terkunci terbuka setelah nilai level sebelumnya minimal 70.'], 2),
    E('w_bugkecil', 'virus', 34, 6, 'Bug Kecil', ['Hihi!', 'Bzzt!'], ['Hihi, aku bug kecil yang bersembunyi di kodemu!', '(Pengakuan) Dengan git log dan git diff kamu bisa melacak kapan aku mulai muncul. Aku tidak bisa bersembunyi lama!'], 4)
  ]);
  crowd('vcs', [
    G('w_sinta1', 'siswa1', 7, 13, 'Sinta', ['Halo!', 'Seru ya belajar!'], ['Aku suka VCS karena bisa kembali ke versi lama kalau salah edit.'], 3),
    G('w_doni1', 'siswa3', 14, 8, 'Doni', ['Pilih Git!', 'Offline pun bisa.'], ['Di VCS terdistribusi, tiap orang punya salinan lengkap riwayat. Tidak takut server rusak!'], 3),
    E('w_iseng1', 'virus', 24, 12, 'Bug Iseng', ['Hihi!', 'Siapa pelakunya?'], ['Hihi, tanpa riwayat kamu tidak akan tahu siapa yang merusak kode ini!', '(Pengakuan) VCS mencatat siapa, kapan, dan apa yang diubah, jadi sumber masalah mudah dilacak.'], 3)
  ]);
  crowd('three-zones', [
    G('w_aisyah2', 'siswa2', 9, 13, 'Aisyah', ['Tiga rak!', 'Meja, keranjang, arsip.'], ['Bayangkan tiga rak: meja kerja (Working Directory), keranjang (Staging Area), dan lemari arsip (Repository).'], 3),
    G('w_doni2', 'siswa3', 22, 10, 'Doni', ['Cek status!', 'Di zona mana?'], ['git status memberi tahu berkasmu sedang berada di zona yang mana.'], 3),
    E('w_rancu', 'glitch', 32, 14, 'Si Rancu', ['Hehe...', 'Sama saja!'], ['Staging dan commit itu sama saja kan? Hehe!', '(Pengakuan) Beda! Staging = memilih perubahan yang akan disimpan. Commit = menyimpannya permanen ke riwayat.'], 3)
  ]);
  crowd('setup', [
    G('w_sinta3', 'siswa1', 8, 14, 'Sinta', ['Isi dulu!', 'Nama dan email.'], ['Jangan lupa: isi user.name dan user.email dulu sebelum commit pertamamu.'], 3),
    G('w_rian3', 'pelari', 22, 10, 'Rian', ['Salah ketik?', 'Ulangi saja.'], ['Kalau salah ketik identitas, cukup jalankan git config lagi dengan nilai yang benar. Nilai lama akan tertimpa.'], 3),
    E('w_lupa3', 'virus', 30, 14, 'Bug Lupa Folder', ['Bebas!', 'Di mana saja!'], ['git init di folder mana saja, bebas!', '(Pengakuan) Pastikan kamu sudah masuk ke folder proyek (cd nama-folder) sebelum git init, kalau tidak repositori terbentuk di tempat yang salah.'], 3)
  ]);
  crowd('commands', [
    G('w_aisyah4', 'siswa2', 10, 10, 'Aisyah', ['Cek dulu!', 'status, diff.'], ['Sebelum git add, aku selalu cek git status dan git diff supaya tahu apa yang akan masuk.'], 3),
    G('w_doni4', 'siswa3', 23, 15, 'Doni', ['Ringkas!', '--oneline.'], ['git log --oneline itu ringkas dan enak dibaca: satu baris per commit.'], 3),
    E('w_panik4', 'glitch', 34, 16, 'Si Panik', ['Tebak saja!', 'Hehe...'], ['Tidak usah baca log, tebak saja siapa yang mengubah kode!', '(Pengakuan) git log menunjukkan siapa, kapan, dan pesan commit. Jangan menebak, cek riwayatnya.'], 3)
  ]);
  crowd('commit', [
    G('w_sinta5', 'siswa1', 10, 12, 'Sinta', ['Singkat jelas!', 'feat: ...'], ['Pesan commitku selalu pendek tapi jelas, contohnya: feat: tambah tombol login.'], 3),
    G('w_rian5', 'pelari', 24, 16, 'Rian', ['Sering commit!', 'Kecil saja.'], ['Commit kecil dan sering lebih mudah ditinjau dan dibatalkan kalau ada kesalahan.'], 3),
    E('w_raksasa5', 'virus', 33, 12, 'Si Raksasa', ['Satu saja!', 'Praktis!'], ['Satu commit raksasa berisi semua perubahan sebulan! Praktis, kan?', '(Pengakuan) Commit besar sulit ditinjau dan dibatalkan. Pisahkan per perubahan yang logis.'], 3)
  ]);
  crowd('gitignore', [
    G('w_aisyah6', 'siswa2', 10, 12, 'Aisyah', ['Ignore dulu!', 'Di awal proyek.'], ['Aku selalu menulis .gitignore di awal proyek, sebelum commit pertama.'], 3),
    G('w_rina6', 'ibu', 22, 10, 'Bu Rina', ['Ingat polanya.', '*.log !'], ['Contoh pola: *.log mengabaikan semua berkas log, dan build/ mengabaikan seluruh folder build.'], 2),
    E('w_ceroboh6', 'glitch', 33, 16, 'Si Ceroboh', ['Gampang diingat!', 'Hehe...'], ['Tulis saja password di dalam kode, gampang diingat!', '(Pengakuan) Jangan! Simpan rahasia di berkas .env (yang di-ignore), jangan ditulis langsung di kode.'], 3)
  ]);
  crowd('final', [
    G('w_doni7', 'siswa3', 12, 10, 'Doni', ['Fokus!', 'Teliti ya.'], ['Aku sudah latihan untuk bos terakhir. Fokus ke ketepatan, bukan cuma kecepatan!'], 3),
    G('w_rian7', 'pelari', 21, 17, 'Rian', ['Waktu terbatas!', 'Jangan asal klik.'], ['Waktu memang terbatas, tapi jangan asal klik. Poin penuh butuh akurasi yang tinggi.'], 3),
    G('w_rina7', 'ibu', 30, 12, 'Bu Rina', ['Kamu pasti bisa.', 'Semangat!'], ['Kamu sudah sejauh ini. Ingat alurnya: edit, add, commit. Percayalah pada latihanmu.'], 2),
    E('w_bugakhir7', 'virus', 34, 16, 'Bug Terakhir', ['Hehe...', 'Aku lolos!'], ['Hehe, aku bug terakhir yang lolos dari review!', '(Pengakuan) Membaca git diff sebelum commit bisa menangkapku. Teliti itu kuncinya.'], 3)
  ]);

  // efek layar khas tiap wilayah (digambar js/world.js)
  var FX = { plaza: 'lanterns', vcs: 'pages', 'three-zones': 'orbs', setup: 'sparks', commands: 'rain', commit: 'forge', gitignore: 'laser', final: 'storm' };
  Object.keys(FX).forEach(function (id) { A[id].theme.fx = FX[id]; });

  window.GQ_AREAS = A;
  window.GQ_AREA_ORDER = ['plaza', 'vcs', 'three-zones', 'setup', 'commands', 'commit', 'gitignore', 'final'];
})();

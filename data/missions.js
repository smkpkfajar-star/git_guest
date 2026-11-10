/* data/missions.js — level, materi, dan tantangan (dipisahkan dari logika tampilan).
   Dibuat sebagai file .js (bukan .json) agar game tetap berjalan tanpa fetch.

   Tipe tantangan:
     mcq / match / order   -> kuis (dipakai di stage awal)
     sorter                -> sortir konveyor berwaktu
     terminal              -> simulasi terminal berwaktu
     typing                -> fast typing (mode copy / recall)
     reposim               -> simulator repositori (add, commit, prefix)
     sweep                 -> menandai berkas untuk .gitignore
     memory                -> kartu memori pola .gitignore
   Mini-game memakai field `time` (detik; mode santai = 2x). */
window.GQ_MISSIONS = [
  {
    id: 'vcs', no: 1, ready: true, game: 'Battle Kuis',
    enemy: { name: 'Ghost Server', img: 'ghost-server', attack: 'Single Point Failure', intro: 'Ghost Server muncul! Server pusat tua ini menyimpan semua riwayat di satu tempat. Jawab dengan benar untuk menyerangnya!' },
    title: 'Developer Academy',
    summary: 'Pahami Version Control System, Centralized vs Distributed, dan alasan memakai Git.',
    goals: [
      'Menjelaskan fungsi Version Control System (VCS).',
      'Membedakan Centralized VCS dan Distributed VCS.',
      'Menjelaskan alasan Git digunakan.'
    ],
    nara: 'Sebelum menyentuh perintah apa pun, kamu harus paham dulu mengapa tim kita butuh VCS.',
    material: [
      { h: 'Apa itu VCS?', p: ['Version Control System (VCS) adalah sistem yang mencatat dan mengelola perubahan pada berkas dari waktu ke waktu, sehingga kita dapat melihat riwayat dan kembali ke versi sebelumnya.'] },
      { h: 'Centralized vs Distributed', img: 'assets/images/icons/diagram-vcs.svg', alt: 'Diagram: pada Centralized VCS tiga pengembang terhubung ke satu server pusat; pada Distributed VCS setiap pengembang memiliki repositori lengkap sendiri.', p: [
        'Centralized VCS: riwayat perubahan disimpan di satu server pusat. Pengembang mengambil dan mengirim perubahan ke server itu.',
        'Distributed VCS: setiap pengembang memiliki salinan lengkap repositori beserta riwayatnya di komputer masing-masing. Git termasuk jenis ini.'
      ] },
      { h: 'Mengapa Git?', p: ['Karena bersifat terdistribusi, riwayat lengkap ada di komputer lokal. Pengembang dapat mencatat perubahan, melihat riwayat, dan memulihkan versi lama tanpa bergantung penuh pada satu server.'] }
    ],
    challenges: [
      {
        id: 'c1', type: 'match', title: 'Cocokkan Karakteristik',
        prompt: 'Pasangkan setiap karakteristik dengan jenis VCS yang tepat.',
        choices: ['Centralized VCS', 'Distributed VCS'],
        items: [
          { text: 'Riwayat perubahan berada di satu server pusat.', answer: 'Centralized VCS' },
          { text: 'Setiap pengembang memiliki salinan lengkap repositori.', answer: 'Distributed VCS' },
          { text: 'Riwayat lengkap dapat dilihat dari komputer lokal.', answer: 'Distributed VCS' },
          { text: 'Kolaborasi terhambat bila server pusat bermasalah.', answer: 'Centralized VCS' }
        ],
        explain: 'Centralized bergantung pada server pusat; Distributed menyimpan salinan lengkap di setiap pengembang. Git adalah Distributed VCS.',
        hints: ['Tanyakan: di mana riwayat disimpan, di satu tempat atau di setiap komputer?', 'Pada Distributed VCS, setiap pengembang punya salinan lengkap, termasuk riwayatnya.']
      },
      {
        id: 'c2', type: 'mcq', title: 'Fungsi VCS',
        prompt: 'Apa fungsi utama Version Control System?',
        options: [
          'Mempercepat koneksi internet saat mengunduh berkas',
          'Mencatat dan mengelola perubahan berkas dari waktu ke waktu',
          'Mengubah kode program menjadi aplikasi secara otomatis',
          'Menghapus berkas lama agar penyimpanan hemat'
        ],
        answer: 1,
        explain: 'VCS mencatat perubahan sehingga riwayat dapat dilihat dan versi lama dapat dipulihkan.',
        hints: ['Perhatikan kata "version": yang dikelola adalah versi-versi berkas.', 'Pilih jawaban yang menyebut pencatatan perubahan.']
      },
      {
        id: 'c3', type: 'mcq', title: 'Jenis VCS pada Git',
        prompt: 'Git termasuk jenis VCS yang mana?',
        options: ['Centralized VCS', 'Distributed VCS', 'Bukan VCS', 'Local-only backup'],
        answer: 1,
        explain: 'Git adalah Distributed VCS: setiap salinan repositori berisi riwayat lengkap.',
        hints: ['Ingat: di Git, setiap pengembang punya salinan lengkap.', 'Salinan lengkap di banyak tempat = terdistribusi.']
      },
      {
        id: 'c4', type: 'mcq', title: 'Skenario Tim',
        prompt: 'Dua siswa mengedit proyek yang sama, lalu salah satu perubahan ternyata merusak aplikasi. Manfaat Git yang paling membantu di situasi ini adalah…',
        options: [
          'Riwayat perubahan sehingga dapat kembali ke versi yang masih baik',
          'Mengganti bahasa pemrograman proyek',
          'Membuat aplikasi otomatis lebih cepat',
          'Menyembunyikan semua file proyek'
        ],
        answer: 0,
        explain: 'Karena setiap perubahan tercatat, kita dapat menelusuri dan memulihkan versi sebelumnya.',
        hints: ['Cari manfaat yang berkaitan dengan "kembali ke versi sebelumnya".', 'Riwayat perubahan adalah inti VCS.']
      }
    ]
  },

  {
    id: 'three-zones', no: 2, ready: true, game: 'Sortir Konveyor',
    enemy: { name: 'Zone Wraith', img: 'zone-wraith', attack: 'Zona Tersesat', intro: 'Zone Wraith melayang keluar dari tiga zona! Kirim setiap kartu di konveyor ke zona yang tepat sebelum lolos!' },
    title: 'The Three Zones',
    summary: 'Working Directory, Staging Area, Local Repository, serta status Untracked sampai Committed.',
    goals: [
      'Menjelaskan Working Directory, Staging Area, dan Local Repository.',
      'Membedakan status Untracked, Modified, Staged, dan Committed.',
      'Dengan cepat mengenali di area mana sebuah aktivitas Git terjadi.'
    ],
    nara: 'Git punya tiga ruangan. Kali ini kamu bertugas di konveyor: kirim kartu ke zona yang benar secepat mungkin!',
    material: [
      { h: 'Tiga area Git', img: 'assets/images/icons/diagram-three-zones.svg', alt: 'Diagram: Working Directory ke Staging Area dengan git add, lalu ke Local Repository dengan git commit.', p: [
        'Working Directory: folder proyek tempat kamu membuat dan mengedit berkas.',
        'Staging Area (Index): tempat memilih perubahan yang akan dimasukkan ke commit berikutnya.',
        'Local Repository (.git): tempat riwayat commit disimpan di komputer lokal.'
      ], code: ['git add nama-file     # Working Directory -> Staging Area', 'git commit -m "..."  # Staging Area -> Local Repository'] },
      { h: 'Empat status berkas', img: 'assets/images/icons/diagram-status.svg', alt: 'Diagram: berkas Untracked atau Modified menjadi Staged dengan git add, lalu Committed dengan git commit.', p: [
        'Untracked: berkas baru yang belum dipantau Git.',
        'Modified: berkas terlacak yang isinya sudah diubah tetapi belum di-stage.',
        'Staged: perubahan sudah dipilih dengan git add dan siap di-commit.',
        'Committed: perubahan sudah tersimpan di riwayat repositori lokal.'
      ] },
      { h: 'Cara bermain: Sortir Konveyor', p: ['Kartu meluncur di konveyor. Klik tombol zona (atau tekan angka 1–3 / 1–4) untuk mengirim kartu ke zona yang benar. Kartu yang lolos dihitung salah. Selesaikan dengan akurasi cukup sebelum waktu habis!'] }
    ],
    challenges: [
      {
        id: 'c1', type: 'sorter', title: 'Sortir Tiga Area', time: 80, belt: 8, passRatio: 0.75,
        prompt: 'Kirim setiap kartu ke area Git yang tepat.',
        zones: [{ id: 'wd', label: 'Working Directory' }, { id: 'sa', label: 'Staging Area' }, { id: 'lr', label: 'Local Repository' }],
        cards: [
          { text: 'Membuat berkas index.html yang baru', zone: 'wd', why: 'Berkas baru dibuat dan diedit di Working Directory.' },
          { text: 'git add index.html', zone: 'sa', why: 'git add memindahkan perubahan ke Staging Area.' },
          { text: 'Snapshot tersimpan permanen di folder .git', zone: 'lr', why: '.git adalah Local Repository.' },
          { text: 'Mengedit isi style.css', zone: 'wd', why: 'Mengedit berkas terjadi di Working Directory.' },
          { text: 'Memilih perubahan sebelum commit', zone: 'sa', why: 'Staging Area adalah tempat memilih perubahan.' },
          { text: 'git commit -m "pesan"', zone: 'lr', why: 'git commit menyimpan isi Staging Area ke Local Repository.' },
          { text: 'Menambah folder images/ ke proyek', zone: 'wd', why: 'Folder proyek adalah Working Directory.' },
          { text: 'git add .', zone: 'sa', why: 'git add . memasukkan semua perubahan ke Staging Area.' },
          { text: 'git log membaca riwayat dari sini', zone: 'lr', why: 'Riwayat commit tersimpan di Local Repository.' },
          { text: 'Menghapus baris lama di app.js', zone: 'wd', why: 'Perubahan isi berkas dikerjakan di Working Directory.' },
          { text: 'Index: daftar perubahan siap commit', zone: 'sa', why: 'Index adalah nama lain Staging Area.' },
          { text: 'Riwayat commit tersimpan di komputer lokal', zone: 'lr', why: 'Local Repository menyimpan riwayat secara lokal.' }
        ],
        explain: 'Alurnya: edit di Working Directory → git add ke Staging Area → git commit ke Local Repository.',
        hints: ['Hint menyorot zona yang benar untuk kartu saat ini.']
      },
      {
        id: 'c2', type: 'sorter', title: 'Sortir Status Berkas', time: 60, belt: 7, passRatio: 0.75,
        prompt: 'Kirim setiap kartu ke status berkas yang tepat.',
        zones: [{ id: 'un', label: 'Untracked' }, { id: 'mo', label: 'Modified' }, { id: 'st', label: 'Staged' }, { id: 'co', label: 'Committed' }],
        cards: [
          { text: 'logo.png baru, belum dipantau Git', zone: 'un', why: 'Berkas baru yang belum dilacak = Untracked.' },
          { text: 'style.css diedit setelah commit terakhir', zone: 'mo', why: 'Berkas terlacak yang berubah = Modified.' },
          { text: 'Sudah git add, menunggu commit', zone: 'st', why: 'Sudah di Staging Area = Staged.' },
          { text: 'Muncul di hasil git log', zone: 'co', why: 'Muncul di riwayat berarti sudah Committed.' },
          { text: 'Berkas baru belum pernah di-add', zone: 'un', why: 'Belum pernah di-add = Untracked.' },
          { text: 'Isi app.js berubah, belum git add', zone: 'mo', why: 'Berubah tetapi belum di-stage = Modified.' },
          { text: 'Perubahan masuk Staging Area', zone: 'st', why: 'Staging Area berisi berkas Staged.' },
          { text: 'Perubahan aman di riwayat lokal', zone: 'co', why: 'Tersimpan di riwayat lokal = Committed.' }
        ],
        explain: 'Status berkas: Untracked/Modified → Staged (git add) → Committed (git commit).',
        hints: ['Hint menyorot status yang benar untuk kartu saat ini.']
      }
    ]
  },

  {
    id: 'setup', no: 3, ready: true, game: 'Simulasi Terminal Berwaktu',
    enemy: { name: 'Config Imp', img: 'config-imp', attack: 'Salah Konfigurasi', intro: 'Config Imp mengacak pengaturan Git! Ketik perintah yang benar di terminal sebelum waktu habis.' },
    title: 'Setup Station',
    summary: 'Konfigurasi identitas dan inisialisasi repositori lewat terminal simulasi berwaktu.',
    goals: [
      'Mengatur nama dan email pengguna Git.',
      'Memeriksa konfigurasi dan masuk ke folder proyek.',
      'Menginisialisasi repositori dengan git init dan memeriksa statusnya.'
    ],
    nara: 'Terminal di sini hanya simulasi, jadi tenang saja. Tapi waktunya terbatas, jadi ketik dengan cepat dan teliti!',
    material: [
      { h: 'Konfigurasi identitas', p: ['Git mencatat siapa yang membuat commit, jadi atur nama dan email lebih dulu.'], code: ['git config --global user.name "Nama Kamu"', 'git config --global user.email "email@contoh.com"', 'git config --list'] },
      { h: 'Menyiapkan repositori', p: ['Masuk ke folder proyek lalu inisialisasi repositori. Perintah git init membuat folder tersembunyi .git.'], code: ['cd nama-folder-proyek', 'git init', 'git status'] },
      { h: 'Cara bermain: Terminal Berwaktu', p: ['Ikuti daftar langkah di atas terminal. Ketik perintah lalu tekan Enter. Perintah yang salah memberi musuh kesempatan menyerang. Selesaikan semua langkah sebelum waktu habis.'] }
    ],
    challenges: [
      {
        id: 'c1', type: 'terminal', title: 'Atur Identitas', time: 90,
        prompt: 'Atur identitas Git kamu lewat terminal simulasi.',
        taskSteps: [
          'Atur nama: git config --global user.name "Nama Kamu"',
          'Atur email: git config --global user.email "email@contoh.com"',
          'Tampilkan konfigurasi: git config --list'
        ],
        steps: [
          { pattern: /^git config --global user\.name ("[^"]+"|'[^']+'|\S+)$/,
            onMatch: function (m, s) { s.name = m[1].replace(/^["']|["']$/g, ''); return '(tersimpan: user.name)'; },
            hint: 'Format: git config --global user.name "Nama Kamu"' },
          { pattern: /^git config --global user\.email ("[^"]+"|'[^']+'|\S+)$/,
            onMatch: function (m, s) { s.email = m[1].replace(/^["']|["']$/g, ''); return '(tersimpan: user.email)'; },
            hint: 'Format: git config --global user.email "email@contoh.com"' },
          { pattern: /^git config --list$/,
            onMatch: function (m, s) { return 'user.name=' + s.name + '\nuser.email=' + s.email; },
            hint: 'Untuk menampilkan semua konfigurasi, gunakan: git config --list' }
        ],
        explain: 'Identitas tersimpan. Git akan mencantumkan nama dan emailmu pada setiap commit.',
        hints: ['Gunakan Petunjuk untuk melihat format perintah pada langkah yang sedang berjalan.']
      },
      {
        id: 'c2', type: 'terminal', title: 'Siapkan Repositori', time: 75,
        prompt: 'Masuk ke folder proyek, buat repositori, lalu periksa statusnya.',
        taskSteps: [
          'Masuk ke folder proyek-sekolah',
          'Inisialisasi repositori',
          'Periksa status repositori'
        ],
        steps: [
          { pattern: /^cd proyek-sekolah$/,
            onMatch: function (m, s) { s.cwd = 'proyek-sekolah'; return ''; },
            hint: 'Pindah folder dengan: cd proyek-sekolah' },
          { pattern: /^git init$/,
            onMatch: function (m, s) { s.repo = true; return 'Initialized empty Git repository in ~/proyek-sekolah/.git/'; },
            hint: 'Cukup dua kata: git init' },
          { pattern: /^git status$/,
            onMatch: function () { return 'On branch main\n\nNo commits yet\n\nnothing to commit (create/copy files and use "git add" to track)'; },
            hint: 'Perintah untuk melihat status: git status' }
        ],
        explain: 'Repositori siap! git init membuat folder .git, dan git status menunjukkan belum ada commit.',
        hints: ['Gunakan Petunjuk untuk melihat format perintah.']
      }
    ]
  },

  {
    id: 'commands', no: 4, ready: true, game: 'Fast Typing Race',
    enemy: { name: 'Status Slime', img: 'status-slime', attack: 'Output Lengket', intro: 'Status Slime melompat! Kalahkan dengan mengetik perintah Git secepat dan setepat mungkin.' },
    title: 'Command Terminal',
    summary: 'git status, add, diff, dan log lewat balapan mengetik.',
    goals: [
      'Mengetik perintah status, add, diff, dan log dengan tepat.',
      'Membedakan git diff dan git diff --staged.',
      'Memilih perintah yang sesuai dengan situasi.'
    ],
    nara: 'Perintah Git itu seperti jurus. Kalau sudah hafal dan jarimu cepat, kamu bisa bekerja tanpa ragu. Ayo berlatih!',
    material: [
      { h: 'Memeriksa status dan perubahan', p: ['git status menampilkan kondisi berkas. Versi ringkasnya: git status -s. git diff menampilkan perubahan yang belum di-stage, sedangkan git diff --staged menampilkan perubahan yang sudah di-stage.'], code: ['git status', 'git status -s', 'git diff', 'git diff --staged'] },
      { h: 'Menambahkan dan melihat riwayat', p: ['git add nama-file memasukkan satu berkas ke Staging Area; git add . memasukkan semua perubahan. Riwayat commit dapat dilihat dengan git log.'], code: ['git add nama-file', 'git add .', 'git log --oneline --graph --decorate --all'] },
      { h: 'Cara bermain: Fast Typing', p: ['Babak 1 (Salin): ketik perintah yang tampil di layar persis seperti aslinya. Babak 2 (Ingat): hanya tampil petunjuk situasi; ketik perintahnya dari ingatan lalu tekan Enter. Waktu terbatas, akurasi tetap penting!'] }
    ],
    challenges: [
      {
        id: 'c1', type: 'typing', mode: 'copy', title: 'Babak Salin', time: 60, passCount: 5,
        prompt: 'Ketik setiap perintah persis seperti tampilan. Lanjut otomatis bila benar.',
        prompts: [
          { text: 'git status' }, { text: 'git status -s' }, { text: 'git add index.html' },
          { text: 'git add .' }, { text: 'git diff' }, { text: 'git diff --staged' }
        ],
        explain: 'Bagus! Kamu sudah lancar mengetik perintah dasar status, add, dan diff.',
        hints: ['Perhatikan spasi dan tanda hubung ganda (--).']
      },
      {
        id: 'c2', type: 'typing', mode: 'recall', title: 'Babak Ingat', time: 90, passCount: 5,
        prompt: 'Baca situasinya, lalu ketik perintah yang tepat dari ingatan. Tekan Enter untuk mengirim.',
        prompts: [
          { clue: 'Lihat status berkas secara ringkas', text: 'git status -s' },
          { clue: 'Masukkan SEMUA perubahan ke Staging Area', text: 'git add .' },
          { clue: 'Lihat perubahan yang SUDAH di-stage', text: 'git diff --staged' },
          { clue: 'Lihat perubahan yang BELUM di-stage', text: 'git diff' },
          { clue: 'Tampilkan riwayat satu baris dengan grafik cabang', text: 'git log --oneline --graph --decorate --all' },
          { clue: 'Masukkan hanya berkas index.html ke Staging Area', text: 'git add index.html' }
        ],
        explain: 'Mantap! Kamu hafal perintah-perintah penting tanpa melihat contoh.',
        hints: ['Hint pertama membuka kata pertama, hint kedua membuka perintah lengkap.']
      }
    ]
  },

  {
    id: 'commit', no: 5, ready: true, game: 'Simulator Repositori',
    enemy: { name: 'Commit Goblin', img: 'commit-goblin', attack: 'Pesan Commit Asal', intro: 'Commit Goblin mengacaukan riwayat dengan pesan commit asal-asalan! Rapikan repositori dengan commit yang benar.' },
    title: 'Commit Master',
    summary: 'Praktik stage dan commit dengan Conventional Commits di repositori simulasi.',
    goals: [
      'Menggunakan git add lalu git commit -m dalam alur kerja nyata.',
      'Memilih prefix Conventional Commits yang sesuai jenis perubahan.',
      'Menulis pesan commit yang ringkas dan relevan.'
    ],
    nara: 'Commit yang baik itu seperti catatan harian yang rapi. Satu jenis perubahan, satu commit, dengan prefix yang tepat.',
    material: [
      { h: 'Commit dengan pesan', p: ['git commit -m "pesan" menyimpan isi Staging Area ke riwayat. Pesan harus menjelaskan perubahan secara ringkas.'], code: ['git add nama-file', 'git commit -m "feat: tambah halaman login"'] },
      { h: 'Conventional Commits', p: [
        'Format: prefix: deskripsi singkat. Prefix yang dipelajari:',
        'feat = fitur baru • fix = perbaikan bug • docs = dokumentasi • style = format/tampilan kode tanpa ubah logika • refactor = merapikan kode tanpa ubah perilaku • test = pengujian • chore = tugas pemeliharaan.'
      ], code: ['feat: tambah fitur keranjang', 'fix: perbaiki tombol navbar', 'docs: perbarui README'] },
      { h: 'Cara bermain: Simulator Repositori', p: ['Papan tugas menampilkan berkas yang berubah. Di terminal simulasi, stage berkas dengan git add, lalu commit dengan prefix yang sesuai jenis perubahannya. Gunakan git status untuk memeriksa. Satu commit sebaiknya satu jenis perubahan.'] }
    ],
    challenges: [
      {
        id: 'c1', type: 'reposim', title: 'Bersihkan Repositori', time: 150,
        prompt: 'Stage dan commit semua perubahan dengan prefix yang tepat.',
        files: [
          { name: 'login.js', change: 'menambahkan fitur login pengguna', prefix: 'feat' },
          { name: 'navbar.js', change: 'memperbaiki tombol navbar yang tidak bisa diklik', prefix: 'fix' },
          { name: 'README.md', change: 'memperbarui petunjuk instalasi', prefix: 'docs' }
        ],
        explain: 'Setiap jenis perubahan punya commit sendiri dengan prefix yang sesuai. Riwayatmu kini rapi!',
        hints: ['Hint memberi langkah berikutnya yang disarankan.']
      },
      {
        id: 'c2', type: 'reposim', title: 'Sprint Commit', time: 210,
        prompt: 'Lima perubahan masuk sekaligus. Commit satu per satu dengan prefix yang benar.',
        files: [
          { name: 'cart.js', change: 'menambahkan halaman keranjang belanja', prefix: 'feat' },
          { name: 'cart.test.js', change: 'menambah pengujian untuk keranjang', prefix: 'test' },
          { name: 'layout.css', change: 'merapikan indentasi dan format layout', prefix: 'style' },
          { name: 'utils.js', change: 'merapikan fungsi tanpa mengubah perilaku', prefix: 'refactor' },
          { name: 'package.json', change: 'memperbarui versi dependensi', prefix: 'chore' }
        ],
        explain: 'Kamu membedakan feat, test, style, refactor, dan chore dengan tepat. Commit Goblin kehabisan akal!',
        hints: ['Hint memberi langkah berikutnya yang disarankan.']
      }
    ]
  },

  {
    id: 'gitignore', no: 6, ready: true, game: 'Security Sweep + Kartu Memori',
    enemy: { name: 'Vault Guardian', img: 'vault-guardian', attack: 'Kebocoran Rahasia', intro: 'Vault Guardian menjaga brankas yang bocor! Temukan berkas yang tidak boleh masuk repositori, lalu hafalkan pola .gitignore.' },
    title: 'Security Vault',
    summary: 'Pindai berkas rahasia dan pelajari pola .gitignore lewat kartu memori.',
    goals: [
      'Menentukan berkas dan folder yang perlu diabaikan Git.',
      'Mengenali pola .gitignore: komentar #, slash /, wildcard *, dan negasi !.',
      'Memahami mengapa berkas rahasia tidak boleh di-commit.'
    ],
    nara: 'Satu berkas .env yang ter-commit bisa membocorkan kunci rahasia seluruh tim. Brankas ini harus tertutup rapat!',
    material: [
      { h: 'Fungsi .gitignore', p: ['.gitignore berisi daftar pola berkas/folder yang tidak dilacak Git. Gunakan untuk dependensi, berkas rahasia, log, hasil build, dan berkas sistem.'], code: ['node_modules/', 'vendor/', '.env', '.env.local', 'config/secrets.json', '*.log', 'dist/', 'build/', '.DS_Store', 'Thumbs.db'] },
      { h: 'Sintaks pola', p: ['# di awal baris = komentar. Akhiran / = hanya folder. * = wildcard (mis. *.log). ** = cocok di semua kedalaman folder. ! di awal = pengecualian (tetap dilacak).'], code: ['# berkas rahasia', '*.log', '!important.log', 'dist/'] },
      { h: 'Cara bermain', p: ['Babak 1 (Security Sweep): klik berkas yang harus diabaikan (jangan salah tandai berkas penting!), lalu segel brankas. Babak 2 (Kartu Memori): pasangkan pola dengan maksudnya sebelum waktu habis.'] }
    ],
    challenges: [
      {
        id: 'c1', type: 'sweep', title: 'Security Sweep', time: 75,
        prompt: 'Tandai semua berkas/folder yang harus masuk .gitignore. Jangan tandai berkas penting proyek!',
        tiles: [
          { name: 'index.html' }, { name: 'src/' }, { name: 'README.md' }, { name: 'package.json' },
          { name: 'node_modules/', ignore: true, pattern: 'node_modules/', why: 'Dependensi bisa diunduh ulang dan sangat besar.' },
          { name: '.env', ignore: true, pattern: '.env', why: 'Berisi kunci dan kata sandi rahasia.' },
          { name: 'style.css' },
          { name: 'config/secrets.json', ignore: true, pattern: 'config/secrets.json', why: 'Berisi rahasia konfigurasi.' },
          { name: 'app.log', ignore: true, pattern: '*.log', why: 'Berkas log dihasilkan otomatis.' },
          { name: 'images/' }, { name: 'LICENSE' },
          { name: 'dist/', ignore: true, pattern: 'dist/', why: 'Hasil build dibuat ulang dari kode sumber.' },
          { name: '.DS_Store', ignore: true, pattern: '.DS_Store', why: 'Berkas sistem macOS.' },
          { name: 'Thumbs.db', ignore: true, pattern: 'Thumbs.db', why: 'Berkas sistem Windows.' },
          { name: '.gitignore' }, { name: 'vendor/', ignore: true, pattern: 'vendor/', why: 'Dependensi pihak ketiga.' }
        ],
        explain: 'Brankas tersegel! Dependensi, berkas rahasia, log, hasil build, dan berkas sistem sudah aman dari repositori.',
        hints: ['Hint menyorot satu berkas yang belum kamu tandai.']
      },
      {
        id: 'c2', type: 'memory', title: 'Kartu Memori Pola', time: 80,
        prompt: 'Buka dua kartu dan pasangkan pola .gitignore dengan maksudnya.',
        pairs: [
          { a: 'node_modules/', b: 'Folder dependensi' },
          { a: '.env', b: 'Berkas rahasia (kunci & sandi)' },
          { a: '*.log', b: 'Semua berkas berekstensi .log' },
          { a: 'dist/', b: 'Folder hasil build' },
          { a: '!important.log', b: 'Pengecualian: tetap dilacak' },
          { a: '# catatan', b: 'Komentar, tidak diproses' }
        ],
        explain: 'Kamu hafal pola .gitignore: folder, rahasia, wildcard, negasi, dan komentar.',
        hints: ['Hint mengintip semua kartu sebentar.']
      }
    ]
  },

  {
    id: 'final', no: 7, ready: true, final: true, game: 'Boss Rush',
    enemy: { name: 'Glitch Prime', img: 'glitch-prime', attack: 'Kekacauan Total', intro: 'Glitch Prime, pemimpin semua gangguan, muncul! Hadapi tiga ronde: alur kerja Git, pemindaian brankas, dan sortir status!' },
    title: 'Final Boss: Repository Guardian',
    summary: 'Boss rush: ketik alur kerja Git, pindai brankas, dan sortir status berkas.',
    goals: [
      'Menjalankan alur kerja Git lengkap dari konfigurasi sampai melihat riwayat.',
      'Menentukan berkas yang diabaikan dengan tepat.',
      'Mengenali status berkas dengan cepat.'
    ],
    nara: 'Ini ujian terakhirmu. Gabungkan semua yang sudah kamu pelajari. Aku percaya padamu, calon Repository Guardian!',
    material: [
      { h: 'Alur kerja lengkap', p: ['Konfigurasi identitas → git init → git status → git add → git diff --staged → git commit → git log.'], code: ['git config --global user.name "Nama"', 'git init', 'git status', 'git add .', 'git diff --staged', 'git commit -m "feat: ..."', 'git log --oneline'] },
      { h: 'Tiga ronde Boss Rush', p: ['Ronde 1: ketik alur kerja dari ingatan (hanya tampil petunjuk situasi). Ronde 2: Security Sweep dengan lebih banyak berkas. Ronde 3: Sortir status berkas dengan konveyor yang cepat.'] }
    ],
    challenges: [
      {
        id: 'c1', type: 'typing', mode: 'recall', title: 'Ronde 1: Alur Kerja', time: 100, passCount: 6,
        prompt: 'Ketik perintah untuk setiap langkah alur kerja Git. Enter untuk mengirim.',
        prompts: [
          { clue: 'Atur nama pengguna Git (global)', text: 'git config --global user.name "Nama"', re: '^git config --global user\\.name ("[^"]+"|\'[^\']+\'|\\S+)$' },
          { clue: 'Inisialisasi repositori baru', text: 'git init' },
          { clue: 'Periksa status berkas', text: 'git status' },
          { clue: 'Masukkan semua perubahan ke Staging Area', text: 'git add .' },
          { clue: 'Lihat perubahan yang sudah di-stage', text: 'git diff --staged' },
          { clue: 'Commit dengan pesan berformat fitur baru', text: 'git commit -m "feat: tambah fitur"', re: '^git commit -m ("feat: [^"]{3,}"|\'feat: [^\']{3,}\')$' },
          { clue: 'Lihat riwayat commit satu baris', text: 'git log --oneline' }
        ],
        explain: 'Alur kerja Git lengkap berhasil kamu ketik dari ingatan!',
        hints: ['Hint pertama membuka kata pertama, hint kedua membuka perintah lengkap.']
      },
      {
        id: 'c2', type: 'sweep', title: 'Ronde 2: Segel Brankas', time: 60,
        prompt: 'Tandai semua berkas yang harus diabaikan. Salah tandai berkas penting akan menggagalkan segel.',
        tiles: [
          { name: 'index.html' }, { name: 'app.js' }, { name: 'README.md' }, { name: 'package.json' }, { name: 'src/' },
          { name: 'node_modules/', ignore: true, pattern: 'node_modules/', why: 'Dependensi.' },
          { name: '.env', ignore: true, pattern: '.env', why: 'Rahasia.' },
          { name: '.env.production', ignore: true, pattern: '.env.production', why: 'Rahasia produksi.' },
          { name: 'debug.log', ignore: true, pattern: '*.log', why: 'Log.' },
          { name: 'npm-debug.log', ignore: true, pattern: 'npm-debug.log*', why: 'Log npm.' },
          { name: 'build/', ignore: true, pattern: 'build/', why: 'Hasil build.' },
          { name: 'Main.class', ignore: true, pattern: '*.class', why: 'Hasil kompilasi.' },
          { name: 'setup.exe', ignore: true, pattern: '*.exe', why: 'Berkas biner.' },
          { name: '.DS_Store', ignore: true, pattern: '.DS_Store', why: 'Sistem macOS.' },
          { name: 'style.css' }, { name: 'images/' }, { name: 'LICENSE' }, { name: '.gitignore' }, { name: 'docs/' }, { name: 'test/' }
        ],
        explain: 'Brankas aman! Semua berkas sensitif dan hasil build tidak akan ikut ter-commit.',
        hints: ['Hint menyorot satu berkas yang belum kamu tandai.']
      },
      {
        id: 'c3', type: 'sorter', title: 'Ronde 3: Sortir Cepat', time: 45, belt: 5, passRatio: 0.8,
        prompt: 'Sortir status berkas dengan cepat sebelum Glitch Prime lolos!',
        zones: [{ id: 'un', label: 'Untracked' }, { id: 'mo', label: 'Modified' }, { id: 'st', label: 'Staged' }, { id: 'co', label: 'Committed' }],
        cards: [
          { text: 'Berkas baru belum dipantau', zone: 'un', why: 'Berkas baru = Untracked.' },
          { text: 'Sudah git add', zone: 'st', why: 'Sudah di-add = Staged.' },
          { text: 'Muncul di git log', zone: 'co', why: 'Ada di riwayat = Committed.' },
          { text: 'Isi berkas berubah, belum add', zone: 'mo', why: 'Berubah belum di-stage = Modified.' },
          { text: 'Siap di-commit', zone: 'st', why: 'Siap commit = Staged.' },
          { text: 'Belum pernah di-add', zone: 'un', why: 'Belum dilacak = Untracked.' },
          { text: 'Tersimpan di riwayat lokal', zone: 'co', why: 'Tersimpan = Committed.' },
          { text: 'Diedit setelah commit terakhir', zone: 'mo', why: 'Terlacak lalu diedit = Modified.' },
          { text: 'Ada di Staging Area', zone: 'st', why: 'Staging Area = Staged.' },
          { text: 'Berkas baru yang belum di-add', zone: 'un', why: 'Belum di-add = Untracked.' }
        ],
        explain: 'Glitch Prime tumbang! Kamu menguasai status berkas Git dengan sigap.',
        hints: ['Hint menyorot status yang benar untuk kartu saat ini.']
      }
    ]
  }
];

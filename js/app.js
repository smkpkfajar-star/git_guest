/* app.js — alur adegan GIT QUEST:
   Splash → Profil → Intro → Dashboard → Materi → Tantangan → Hasil.
   Semua teks pemain dirender lewat textContent (tanpa innerHTML). */
(function () {
  'use strict';

  var MISSIONS = window.GQ_MISSIONS;
  var Store = window.GQStorage;
  var Score = window.GQScoring;
  var save = Store.loadGame();
  var warnedStorage = false;
  var run = null; // sesi tantangan aktif
  var world = null; // instans dunia (overworld) yang sedang tampil
  var lastPortal = -1;
  var resume = null;          // posisi pemain yang dipulihkan saat dunia dirender ulang (mis. ganti mode kontrol)
  var lastArea = 'plaza';     // peta terakhir yang dikunjungi (dipakai saat kembali ke dunia)
  var pendingUnlock = -1;      // portal yang baru terbuka (dianimasikan saat kembali ke dunia)
  var disposePart = null;      // pembersih timer/listener mini-game aktif
  var cleanups = [];           // pembersih animasi/timer adegan (dijalankan saat berpindah adegan)
  var $app = document.getElementById('app');

  /* ---------- helpers ---------- */
  function h(tag, props) {
    var el = document.createElement(tag);
    props = props || {};
    Object.keys(props).forEach(function (k) {
      var v = props[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k.indexOf('on') === 0) el.addEventListener(k.slice(2), v);
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, v);
    });
    for (var i = 2; i < arguments.length; i++) append(el, arguments[i]);
    return el;
  }
  function append(el, c) {
    if (c === null || c === undefined || c === false) return;
    if (Array.isArray(c)) { c.forEach(function (x) { append(el, x); }); return; }
    el.appendChild(c.nodeType ? c : document.createTextNode(String(c)));
  }
  function btn(label, cls, onclick, extra) {
    return h('button', Object.assign({ type: 'button', class: 'btn ' + cls, onclick: function (e) { sfx('click'); onclick(e); }, text: label }, extra || {}));
  }

  function profile() { return save.profiles[save.activeProfile] || null; }
  /** Tampilan karakter profil (default: Rafi) dan penerapannya ke seluruh game (efek naik seiring level). */
  function charOf(p) { return (p && p.char) ? Object.assign({}, p.char) : window.GQChars.defaults('rafi'); }
  function applyPlayerLook() { var p = profile(); window.GQChars.setPlayer(charOf(p), p ? Score.levelInfo(p.xp).tier : 0); }
  function persist() {
    var ok = Store.saveGame(save);
    if (!ok && !warnedStorage) {
      warnedStorage = true;
      var closeWarn;
      closeWarn = openModal('Progres gagal disimpan', [
        h('p', { text: 'Penyimpanan browser tidak tersedia atau penuh, sehingga progres bisa hilang saat halaman ditutup. Unduh progres sebagai file JSON agar tetap aman.' }),
        h('div', { class: 'row' },
          btn('Unduh progres', 'btn-primary', function () { exportProgress(); }),
          btn('Tutup', 'btn-secondary', function () { closeWarn(); }))
      ]);
    }
    return ok;
  }

  var toastTimer;
  function toast(msg, warn) {
    var t = document.getElementById('toast');
    t.textContent = msg;
    t.className = 'toast show' + (warn ? ' warn' : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.className = 'toast'; }, warn ? 6000 : 2200);
  }

  function applySettings() {
    document.body.classList.toggle('reduce-motion', !!save.settings.reduceMotion);
  }

  /* Audio: efek & musik dari assets/audio. Hanya aktif bila "Suara" dinyalakan. */
  var SFX = {}, tracks = {}, curTrack = null, wantTrack = null, MUSIC_VOL = 0.3;
  function sfx(name) {
    if (!save.settings.sound) return;
    try {
      var a = SFX[name] || (SFX[name] = new Audio('assets/audio/sfx-' + name + '.wav'));
      a.currentTime = 0; a.volume = 0.6;
      var p = a.play(); if (p && p.catch) p.catch(function () { });
    } catch (e) { /* suara opsional */ }
  }
  function trackEl(n) {
    if (!tracks[n]) { var a = new Audio('assets/audio/music-' + n + '.wav'); a.loop = true; a.volume = 0; a.preload = 'auto'; tracks[n] = a; }
    return tracks[n];
  }
  function fade(el, to, ms, pauseAtEnd) {
    clearInterval(el._f); var from = el.volume, t0 = Date.now();
    el._f = setInterval(function () {
      var k = Math.min(1, (Date.now() - t0) / ms); el.volume = Math.max(0, Math.min(1, from + (to - from) * k));
      if (k >= 1) { clearInterval(el._f); if (pauseAtEnd) el.pause(); }
    }, 50);
  }
  function playEl(el) { try { var p = el.play(); if (p && p.catch) p.catch(function () { }); } catch (e) { /* abaikan */ } }
  /** Musik latar berbeda tiap adegan/stage; berpindah dengan crossfade. */
  function syncMusic() {
    try {
      if (!save.settings.sound) { Object.keys(tracks).forEach(function (k) { clearInterval(tracks[k]._f); tracks[k].pause(); }); curTrack = null; return; }
      if (!wantTrack) return;
      if (curTrack === wantTrack) { var cur = trackEl(curTrack); if (cur.paused) { playEl(cur); fade(cur, MUSIC_VOL, 600); } return; }
      var old = curTrack ? tracks[curTrack] : null, ne = trackEl(wantTrack);
      curTrack = wantTrack; ne.volume = 0; playEl(ne); fade(ne, MUSIC_VOL, 1000);
      if (old) fade(old, 0, 800, true);
    } catch (e) { /* musik opsional */ }
  }
  function setTrack(n) { wantTrack = n; syncMusic(); }
  function duckMusic() { if (curTrack && tracks[curTrack]) fade(tracks[curTrack], 0.04, 400); }
  function icon(name, cls) { return h('img', { src: 'assets/images/icons/' + name + '.svg', alt: '', class: 'ico-img' + (cls ? ' ' + cls : '') }); }

  function mount(node, bg) {
    if (world) { world.destroy(); world = null; }
    if (disposePart) { try { disposePart(); } catch (e) { /* abaikan */ } disposePart = null; }
    cleanups.splice(0).forEach(function (f) { try { f(); } catch (e) { /* abaikan */ } });
    if (bg) node.classList.add('bg-' + bg);
    $app.textContent = '';
    $app.appendChild(node);
    $app.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  /* ---------- modal ---------- */
  function openModal(title, bodyNodes, onClose) {
    var root = document.getElementById('modal-root');
    var prev = document.activeElement;
    var back = h('div', { class: 'modal-back' });
    var modal = h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': title }, h('h2', { text: title }), bodyNodes);
    back.appendChild(modal);
    function close() {
      document.removeEventListener('keydown', onKey);
      root.textContent = '';
      if (prev && prev.focus) prev.focus();
      if (onClose) onClose();
    }
    function onKey(e) {
      if (e.key === 'Escape') { close(); return; }
      if (e.key === 'Tab') {
        var f = modal.querySelectorAll('button, input, select, a[href]');
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    back.addEventListener('mousedown', function (e) { if (e.target === back) close(); });
    document.addEventListener('keydown', onKey);
    root.textContent = '';
    root.appendChild(back);
    var focusable = modal.querySelector('button, input');
    if (focusable) focusable.focus();
    return close;
  }

  function confirmModal(title, text, confirmLabel, onConfirm) {
    var close;
    var body = [
      h('p', { text: text }),
      h('div', { class: 'row' },
        btn(confirmLabel, 'btn-danger', function () { close(); onConfirm(); }),
        btn('Batal', 'btn-secondary', function () { close(); }))
    ];
    close = openModal(title, body);
  }

  /* ---------- pengaturan / ekspor / impor / reset ---------- */
  function openSettings() {
    var close;
    var snd = h('input', { type: 'checkbox', id: 'set-sound' });
    snd.checked = !!save.settings.sound;
    snd.addEventListener('change', function () { save.settings.sound = snd.checked; persist(); syncMusic(); sfx('click'); });
    var mot = h('input', { type: 'checkbox', id: 'set-motion' });
    mot.checked = !!save.settings.reduceMotion;
    mot.addEventListener('change', function () { save.settings.reduceMotion = mot.checked; applySettings(); persist(); });

    var relax = h('input', { type: 'checkbox', id: 'set-relax' });
    relax.checked = !!save.settings.relaxTimer;
    relax.addEventListener('change', function () { save.settings.relaxTimer = relax.checked; persist(); });

    var ctl = h('select', { id: 'set-control' }, h('option', { value: 'gui', text: 'GUI: panah, klik, tombol' }), h('option', { value: 'cli', text: 'CLI: ketik perintah (menantang)' }));
    ctl.value = save.settings.controlMode === 'cli' ? 'cli' : 'gui';
    ctl.addEventListener('change', function () {
      save.settings.controlMode = ctl.value === 'cli' ? 'cli' : 'gui'; persist();
      toast(save.settings.controlMode === 'cli' ? 'Mode CLI aktif: ketik perintah untuk bergerak.' : 'Mode GUI aktif.');
      if (world && document.querySelector('.world-canvas')) { resume = { area: world.area(), pos: world.pos() }; go('world'); }
    });

    var file = h('input', { type: 'file', accept: 'application/json,.json', id: 'set-import', style: 'display:none' });
    file.addEventListener('change', function () {
      var f = file.files && file.files[0];
      if (!f) return;
      var reader = new FileReader();
      reader.onload = function () {
        var res = Store.importSave(String(reader.result));
        if (!res.ok) { toast('Impor gagal: ' + res.error, true); return; }
        confirmModal('Impor progres', 'Impor akan MENIMPA seluruh progres di browser ini dengan isi file. Lanjutkan?', 'Ya, impor', function () {
          save = res.data; persist(); applySettings(); close();
          toast('Progres berhasil diimpor.');
          go(save.activeProfile ? home() : 'profile');
        });
      };
      reader.onerror = function () { toast('File tidak dapat dibaca.', true); };
      reader.readAsText(f);
    });

    var body = [
      h('div', { class: 'setting-row' }, h('label', { for: 'set-sound', text: 'Efek suara' }), snd),
      h('div', { class: 'setting-row' }, h('label', { for: 'set-motion', text: 'Kurangi animasi' }), mot),
      h('div', { class: 'setting-row' }, h('label', { for: 'set-control', text: 'Mode kontrol dunia' }), ctl),
      h('p', { class: 'note', text: 'CLI: bergerak dengan mengetik, misalnya right 3; up(2); interact(). Lebih menantang. Berlaku di peta dunia.' }),
      h('div', { class: 'setting-row' }, h('label', { for: 'set-relax', text: 'Mode santai (waktu mini-game 2×)' }), relax),
      h('p', { class: 'note', text: 'Progres tersimpan di browser ini saja. Ekspor ke file JSON sebelum membersihkan data browser atau pindah komputer.' }),
      h('div', { class: 'row', style: 'margin-top:12px' },
        btn('Ekspor progres', 'btn-secondary', exportProgress),
        btn('Impor progres', 'btn-secondary', function () { file.click(); }),
        file),
      profile() ? h('div', { class: 'row', style: 'margin-top:12px' }, btn('Ubah karakter', 'btn-secondary', function () { close(); go('creator', {}); })) : null,
      h('div', { class: 'row', style: 'margin-top:12px' },
        btn('Reset semua progres', 'btn-danger', function () {
          confirmModal('Reset progres', 'Semua profil dan progres di browser ini akan dihapus permanen. Disarankan ekspor dulu. Yakin?', 'Ya, hapus semua', function () {
            save = Store.resetGame(); applySettings(); close(); toast('Progres telah direset.'); go('splash');
          });
        })),
      h('div', { class: 'row', style: 'margin-top:16px' }, btn('Tutup', 'btn-primary', function () { close(); }))
    ];
    close = openModal('Pengaturan', body);
  }

  function exportProgress() {
    var blob = new Blob([Store.exportSave(save)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = h('a', { href: url, download: 'gitquest-progres.json' });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    toast('Progres diekspor ke gitquest-progres.json');
  }

  /* ---------- router ---------- */
  function home() { return save.settings.viewMode === 'list' ? 'dashboard' : 'world'; }
  function setView(mode) { save.settings.viewMode = mode; persist(); go(mode === 'list' ? 'dashboard' : 'world'); }

  function go(scene, arg) {
    var fn = {
      splash: sceneSplash, profile: sceneProfile, intro: sceneIntro, creator: sceneCreator, dashboard: sceneDashboard, world: sceneWorld,
      material: sceneMaterial, challenge: sceneChallenge, result: sceneResult
    }[scene];
    // kembali ke menu utama / pilih profil = mulai bersih: posisi peta pemain sebelumnya tidak terbawa ke profil lain
    if (scene === 'splash' || scene === 'profile') { lastArea = 'plaza'; lastPortal = -1; pendingUnlock = -1; talked = {}; }
    applyPlayerLook();
    fn(arg);
    var mid = scene === 'material' ? MISSIONS[arg].id : ((scene === 'challenge' || scene === 'result') && run ? run.mission.id : null);
    setTrack(mid || { splash: 'title', profile: 'title', creator: 'title', intro: 'title', world: 'world', dashboard: 'world' }[scene]);
  }

  /* ---------- Adegan 1: Splash (bergaya Minecraft) ---------- */
  var SPLASH_TEXTS = ['Commit sekarang!', 'Satu perubahan, satu commit!', 'git init petualangan!', 'Jangan push rahasia!', '100% JavaScript!', 'Sudah di-stage?', 'Awas Glitch!', 'Ketik lebih cepat!', 'Belajar sambil bermain!', 'Cek git status!', 'Banyak monster bug!'];
  function mcBtn(label, onclick, extra) {
    return h('button', Object.assign({ type: 'button', class: 'mc-btn', onclick: function (e) { sfx('click'); onclick(e); }, text: label }, extra || {}));
  }
  function openHowTo() {
    var close;
    close = openModal('Cara Main', [
      h('ul', { class: 'howto' }, [
        'Jelajahi dunia dengan panah/WASD atau klik peta. Enter/Spasi untuk berinteraksi, F untuk melambai.',
        'Masuk portal bernomor untuk memulai stage. Selesaikan, lalu kembali ke peta untuk membuka stage berikutnya.',
        'Tiap stage punya game berbeda: kuis, sortir konveyor, terminal, mengetik cepat, simulator commit, dan sweep keamanan.',
        'Jawaban benar menyerang monster; jawaban salah membuatmu terkena serangan, tetapi XP tidak berkurang.',
        'Petunjuk (Bugbyte) mengurangi poin ronde, bukan XP. Mode santai di Pengaturan menggandakan waktu.'
      ].map(function (t) { return h('li', { text: t }); })),
      h('div', { class: 'row', style: 'margin-top:12px' }, btn('Tutup', 'btn-primary', function () { close(); }))
    ]);
  }
  function sceneSplash() {
    var pano = h('canvas', { class: 'mc-pano', 'aria-hidden': 'true' });
    var splashText = h('span', { class: 'mc-splashtext', 'aria-hidden': 'true', text: SPLASH_TEXTS[Math.floor(Math.random() * SPLASH_TEXTS.length)] });
    var sndBtn, motBtn;
    function upd() {
      sndBtn.textContent = 'Suara: ' + (save.settings.sound ? 'Hidup' : 'Mati');
      motBtn.textContent = 'Animasi: ' + (save.settings.reduceMotion ? 'Kurang' : 'Penuh');
      applySettings();
    }
    sndBtn = mcBtn('', function () { save.settings.sound = !save.settings.sound; persist(); upd(); syncMusic(); });
    motBtn = mcBtn('', function () { save.settings.reduceMotion = !save.settings.reduceMotion; persist(); upd(); });
    mount(h('div', { class: 'scene mc-splash' }, pano, h('div', { class: 'mc-vignette' }),
      h('div', { class: 'mc-center' },
        h('div', { class: 'mc-logo' },
          h('h1', { class: 'sr-only', text: 'GIT QUEST — The Repository Chronicles' }),
          h('img', { class: 'mc-logo-img', src: 'assets/images/icons/logo-block.svg', alt: '' }), splashText),
        h('p', { class: 'mc-sub', text: 'The Repository Chronicles' }),
        h('nav', { class: 'mc-menu', 'aria-label': 'Menu utama' },
          mcBtn('Mulai Petualangan', function () { go('profile'); }, { id: 'start-btn', class: 'mc-btn mc-main' }),
          h('div', { class: 'mc-row' }, mcBtn('Cara Main', openHowTo), mcBtn('Pengaturan', openSettings)),
          h('div', { class: 'mc-row' }, sndBtn, motBtn)),
        h('p', { class: 'mc-hint', text: save.settings.sound ? 'Klik di mana saja untuk memulai musik.' : '' })),
      h('div', { class: 'mc-foot' }, h('span', { text: 'GIT QUEST ' }), h('span', { text: 'Untuk siswa SMK RPL' }))));
    upd();
    var pn = window.GQFX.panorama(pano, { reduce: function () { return !!save.settings.reduceMotion; } });
    cleanups.push(pn.destroy);
    document.getElementById('start-btn').focus();
  }

  /* ---------- Adegan 2: Profil Lokal ---------- */
  function thumbCanvas(p, scale) {
    var cv = window.GQChars.canvas(function () { return charOf(p); }, scale, function () { return Score.levelInfo(p.xp).tier; }, { animate: false });
    return h('span', { class: 'char-slot' }, cv.el);
  }
  function sceneProfile() {
    var ids = Object.keys(save.profiles);
    var input = h('input', { type: 'text', id: 'pname', maxlength: '20', autocomplete: 'off', placeholder: 'mis. Siswa RPL', 'aria-describedby': 'perr' });
    var err = h('p', { class: 'error-msg', id: 'perr', role: 'alert' });

    function create(e) {
      e.preventDefault();
      var name = input.value.replace(/\s+/g, ' ').trim();
      if (!name) { err.textContent = 'Nama tampilan tidak boleh kosong.'; input.focus(); return; }
      if (name.length > 20) { err.textContent = 'Nama maksimal 20 karakter.'; input.focus(); return; }
      var id = 'p' + Date.now().toString(36);
      save.profiles[id] = { displayName: name, xp: 0, completedMissions: [], xpChallenges: [], bestScores: {}, learned: {}, introSeen: false, char: window.GQChars.defaults('rafi') };
      save.activeProfile = id; persist();
      go('creator', { isNew: true });
    }
    function choose(id) { save.activeProfile = id; persist(); go(save.profiles[id].introSeen ? home() : 'intro'); }

    var list = ids.length ? h('ul', { class: 'profile-list', 'aria-label': 'Profil tersimpan' },
      ids.map(function (id) {
        var p = save.profiles[id], lv = Score.levelInfo(p.xp);
        return h('li', null, h('button', { type: 'button', class: 'btn btn-secondary profile-item', onclick: function () { choose(id); } },
          h('span', { class: 'pf-left' }, thumbCanvas(p, 2), h('span', null, h('b', { text: p.displayName }), h('small', { class: 'muted', text: ' ' + lv.title }))),
          h('span', { class: 'muted', text: 'Lv ' + lv.level + ' • ' + p.xp + ' XP' })));
      })) : null;

    mount(h('div', { class: 'center-screen pixel-bg' },
      h('form', { class: 'card panel-term', onsubmit: create, novalidate: true },
        h('h1', { text: 'Profil Pemain' }),
        h('div', { class: 'field' }, h('label', { for: 'pname', text: 'Nama tampilan' }), input),
        err,
        h('div', { class: 'row' },
          h('button', { type: 'submit', class: 'btn btn-primary', text: 'Buat Profil' }),
          btn('Kembali', 'btn-secondary', function () { go('splash'); })),
        ids.length ? h('h2', { style: 'margin-top:16px;font-size:1rem', text: 'Atau lanjutkan profil:' }) : null,
        list,
        h('p', { class: 'note', text: 'Setelah membuat profil, kamu akan memilih dan mengkustomisasi karaktermu. Progres disimpan di browser ini saja; jangan masukkan password atau data pribadi.' }))), 'office');
    ambient('stars');
    input.focus();
  }

  /* ---------- Pembuat karakter: 10 karakter anime + kustomisasi warna + pratinjau efek level ---------- */
  var COLOR_ROWS = [['hair', 'Rambut / hijab'], ['outfit', 'Baju'], ['accent', 'Aksen'], ['skin', 'Kulit'], ['eyes', 'Mata']];
  function sceneCreator(arg) {
    var GC = window.GQChars, p = profile();
    if (!p) { go('profile'); return; }
    var isNew = !!(arg && arg.isNew), draft = charOf(p), previewTier = Math.max(0, Score.levelInfo(p.xp).tier);
    var calm = function () { return !!save.settings.reduceMotion; };
    var prev = GC.canvas(function () { return draft; }, 6, function () { return previewTier; }, { calm: calm });
    var nameEl = h('h2', { class: 'cr-name' }), roleEl = h('p', { class: 'muted cr-role' }), fxEl = h('p', { class: 'cr-fx', 'aria-live': 'polite' });
    var charBtns = [], swatchBtns = {}, tierBtns = [], thumbs = {};

    GC.LIST.forEach(function (c) {
      var th = GC.canvas(function () { return draft.id === c.id ? draft : GC.defaults(c.id); }, 3, null, { animate: false });
      thumbs[c.id] = th;
      charBtns.push(h('button', { type: 'button', class: 'cr-char', role: 'radio', 'data-id': c.id, 'aria-checked': 'false', 'aria-label': c.name + ', ' + c.role, onclick: function () { choose(c.id); } },
        h('span', { class: 'char-slot' }, th.el), h('span', { class: 'cr-cn', text: c.name })));
    });
    var rows = COLOR_ROWS.map(function (row) {
      var key = row[0], pal = GC.PALETTE[key], btns = [];
      var picker = h('input', { type: 'color', class: 'cr-picker', 'aria-label': 'Warna kustom: ' + row[1], value: draft[key], oninput: function (e) { draft[key] = e.target.value; refresh(); } });
      var sw = pal.map(function (col) {
        var b = h('button', { type: 'button', class: 'cr-sw', 'data-key': key, 'data-color': col, 'aria-label': row[1] + ' ' + col, style: 'background:' + col, onclick: function () { draft[key] = col; sfx('click'); refresh(); } });
        btns.push(b); return b;
      });
      swatchBtns[key] = { btns: btns, picker: picker };
      return h('div', { class: 'cr-row' }, h('span', { class: 'cr-lbl', text: row[1] }), h('div', { class: 'cr-sws' }, sw, picker));
    });
    for (var t = 0; t < 7; t++) (function (tier) {
      tierBtns.push(h('button', { type: 'button', class: 'cr-tier', 'aria-pressed': 'false', 'aria-label': 'Pratinjau efek level ' + (tier + 1), text: 'Lv' + (tier + 1), onclick: function () { previewTier = tier; sfx('click'); refresh(); } }));
    })(t);

    function refresh() {
      var d = GC.def(draft.id);
      nameEl.textContent = d.name; roleEl.textContent = d.role + ' • ' + Score.levelInfo(previewTier * Score.CONFIG.xpPerLevel).title;
      fxEl.textContent = previewTier > 0 ? 'Efek level ini: ' + GC.TIER_FX[previewTier] + (previewTier > 1 ? ' (+ efek sebelumnya)' : '') : 'Belum ada efek. Naik level untuk membuka aura dan lainnya!';
      charBtns.forEach(function (b) { var on = b.getAttribute('data-id') === draft.id; b.classList.toggle('on', on); b.setAttribute('aria-checked', on ? 'true' : 'false'); });
      Object.keys(swatchBtns).forEach(function (k) {
        swatchBtns[k].btns.forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-color').toLowerCase() === draft[k].toLowerCase()); });
        swatchBtns[k].picker.value = draft[k];
      });
      tierBtns.forEach(function (b, i) { b.classList.toggle('on', i === previewTier); b.setAttribute('aria-pressed', i === previewTier ? 'true' : 'false'); });
      prev.render(); Object.keys(thumbs).forEach(function (k) { thumbs[k].render(); });
    }
    function choose(id) { draft = GC.defaults(id); sfx('jump'); var el = prev.el.parentNode; el.classList.remove('jump'); void el.offsetWidth; el.classList.add('jump'); refresh(); }
    function randomize() {
      var pick = function (a) { return a[Math.floor(Math.random() * a.length)]; };
      var d = GC.defaults(pick(GC.LIST).id);
      ['hair', 'outfit', 'accent', 'skin', 'eyes'].forEach(function (k) { d[k] = pick(GC.PALETTE[k]); });
      draft = d; sfx('unlock'); refresh();
    }
    function saveChar() {
      p.char = { id: draft.id, hair: draft.hair, outfit: draft.outfit, accent: draft.accent, skin: draft.skin, eyes: draft.eyes };
      persist(); applyPlayerLook(); toast('Karakter disimpan: ' + GC.def(draft.id).name);
      go(isNew ? 'intro' : home());
    }
    var f = 0, walker = setInterval(function () { f = (f + 1) % 4; prev.draw(['walk1', 'idle', 'walk2', 'idle'][f], 1); }, 220);
    cleanups.push(function () { clearInterval(walker); prev.destroy(); Object.keys(thumbs).forEach(function (k) { thumbs[k].destroy(); }); });

    mount(h('div', { class: 'center-screen pixel-bg' },
      h('div', { class: 'card creator' },
        h('h1', { text: isNew ? 'Buat Karakter' : 'Ubah Karakter' }),
        h('div', { class: 'cr-grid' },
          h('div', { class: 'cr-stage' },
            h('button', { type: 'button', class: 'cr-prev', 'aria-label': 'Karaktermu. Klik untuk melompat.', onclick: function () { sfx('jump'); var el = prev.el.parentNode; el.classList.remove('jump'); void el.offsetWidth; el.classList.add('jump'); } },
              h('span', { class: 'char-slot big' }, prev.el)),
            nameEl, roleEl,
            h('p', { class: 'muted cr-cap', text: 'Pratinjau efek naik level:' }),
            h('div', { class: 'cr-tiers', role: 'group', 'aria-label': 'Pratinjau level' }, tierBtns), fxEl),
          h('div', { class: 'cr-side' },
            h('h2', { text: 'Pilih karakter' }), h('div', { class: 'cr-chars', role: 'radiogroup', 'aria-label': 'Pilih karakter' }, charBtns),
            h('h2', { text: 'Warna' }), h('div', { class: 'cr-colors' }, rows))),
        h('div', { class: 'row cr-actions' },
          h('button', { type: 'button', class: 'btn btn-primary', id: 'save-char', text: isNew ? 'Simpan & Mulai' : 'Simpan Karakter', onclick: saveChar }),
          btn('Acak', 'btn-secondary', randomize),
          isNew ? null : btn('Kembali', 'btn-secondary', function () { go(home()); })))), 'office');
    ambient('stars');
    refresh();
    document.getElementById('save-char').focus();
  }

  /* ---------- Adegan 3: Intro Cerita ---------- */
  function sceneIntro() {
    var GW = window.GQWorld, name = profile().displayName;
    var lines = [
      { who: 'Nara', key: 'nara', text: 'Selamat datang di CodeForge! Proyek kita sedang berantakan: perubahan tidak tercatat dan riwayatnya kacau.' },
      { who: 'Nara', key: 'nara', text: 'Kita akan merapikannya dengan Git. Kamu akan menjelajahi dunia, memasuki portal, dan menyelesaikan tantangan.' },
      { who: 'Bugbyte', key: 'bugbyte', text: 'Bip! Aku Bugbyte, robot pendampingmu. Aku siap memberi petunjuk, tapi petunjuk mengurangi poin ronde!' },
      { who: 'Glitch', key: 'glitch', text: 'Hehehe... Proyek ini milikku sekarang! Tidak ada yang bisa merapikannya... bug bug bug!' },
      { who: 'Nara', key: 'nara', text: 'Jangan takut pada Glitch. Siap, ' + name + '? Ayo masuk ke peta!' }
    ];
    var chars = { player: GW.charCanvas('player', 5), nara: GW.charCanvas('nara', 5), bugbyte: GW.charCanvas('bugbyte', 8), glitch: GW.charCanvas('glitch', 8) };
    var wraps = {};
    var stage = h('div', { class: 'intro-stage', 'aria-hidden': 'true' }, ['player', 'nara', 'bugbyte', 'glitch'].map(function (k) {
      wraps[k] = h('button', { type: 'button', tabindex: '-1', class: 'ic ic-' + k, onclick: function () { sfx('jump'); wraps[k].classList.remove('jump'); void wraps[k].offsetWidth; wraps[k].classList.add('jump'); } }, chars[k].el);
      return wraps[k];
    }));
    var speaker = h('div', { class: 'speaker' }), speech = h('div', { class: 'speech', 'aria-live': 'polite' });
    var i = 0, typer = null, next;
    function show() {
      var l = lines[i]; speaker.textContent = l.who;
      Object.keys(wraps).forEach(function (k) { wraps[k].classList.toggle('talk', k === l.key); });
      wraps.glitch.classList.toggle('show', i >= 3); wraps.glitch.classList.toggle('glitching', l.key === 'glitch');
      if (typer) typer.skip();
      typer = window.GQFX.typewriter(speech, l.text, 48);
      next.textContent = i === lines.length - 1 ? 'Ke Peta Misi' : 'Lanjutkan';
    }
    function advance() {
      if (typer && !typer.isDone()) { typer.skip(); return; }
      if (i < lines.length - 1) { i++; show(); return; }
      profile().introSeen = true; persist(); go(home());
    }
    next = btn('Lanjutkan', 'btn-primary', advance, { id: 'intro-next' });
    var tick = 0, idleT = setInterval(function () {
      tick++;
      Object.keys(chars).forEach(function (k) {
        var talking = wraps[k].classList.contains('talk');
        chars[k].draw(talking ? (tick % 2 ? 'walk1' : 'walk2') : (tick % 4 < 2 ? 'idle' : 'walk2'), 1);
      });
    }, 260);
    cleanups.push(function () { clearInterval(idleT); if (typer) typer.skip(); });
    mount(h('div', { class: 'center-screen pixel-bg' },
      h('div', { class: 'card dialog' }, stage, speaker, speech, h('div', { class: 'row' }, next))), 'office');
    ambient('stars');
    show();
    document.getElementById('intro-next').focus();
  }

  /* ---------- Adegan 4: Dashboard / Peta Misi ---------- */
  function missionStatus(i) {
    var p = profile(), m = MISSIONS[i];
    if (!m.ready) return 'soon';
    if (p.completedMissions.indexOf(m.id) !== -1) return 'completed';
    if (i === 0) return 'available';
    var prev = MISSIONS[i - 1];
    return (prev.ready && p.completedMissions.indexOf(prev.id) !== -1) ? 'available' : 'locked';
  }
  var STATUS_LABEL = { locked: 'Terkunci', available: '▶ Tersedia', completed: 'Selesai', soon: 'Segera hadir' };
  var STATUS_ICON = { locked: 'lock', completed: 'check', soon: 'lock' };

  function sceneDashboard() {
    var p = profile();
    if (!p) { go('profile'); return; }
    var lv = Score.levelInfo(p.xp);
    var ready = MISSIONS.filter(function (m) { return m.ready; });
    var doneReady = ready.filter(function (m) { return p.completedMissions.indexOf(m.id) !== -1; }).length;
    var ach = Score.achievements(p, MISSIONS);
    var gs = Score.gameStatus(p, MISSIONS);

    var cards = MISSIONS.map(function (m, i) {
      var st = missionStatus(i);
      var best = p.bestScores[m.id];
      var action = null;
      if (st === 'available' || st === 'completed') {
        action = btn(st === 'completed' ? 'Ulangi Misi' : 'Mulai Misi', st === 'completed' ? 'btn-secondary' : 'btn-primary', function () { cinematic(i, function () { go('material', i); }); });
      }
      return h('article', { class: 'card mission-card ' + (st === 'soon' ? 'locked' : st), 'aria-label': 'Misi ' + m.no + ': ' + m.title },
        h('span', { class: 'mission-no', text: m.final ? 'FINAL' : 'LEVEL ' + m.no }),
        h('h3', { text: m.title }),
        h('p', { class: 'muted', text: m.summary }),
        h('span', { class: 'badge ' + st }, STATUS_ICON[st] ? icon(STATUS_ICON[st]) : null, STATUS_LABEL[st]),
        h('span', { class: 'muted mc-game', text: 'Game: ' + m.game }),
        best !== undefined ? h('span', { class: 'muted', text: 'Nilai terbaik: ' + best }) : null,
        m.ready ? h('span', { class: 'reward', text: 'Hadiah: +10 XP/tantangan, +25 XP bonus' }) : null,
        action);
    });

    mount(h('div', { class: 'pixel-bg scene' }, h('div', { class: 'page' },
      hudBar(p, [btn('Mode Dunia', 'btn-primary', function () { setView('world'); }), btn('Pengaturan', 'btn-secondary', openSettings)]),
      h('div', { class: 'layout-2' },
        h('section', { 'aria-label': 'Peta misi' }, h('h2', { text: 'Peta Misi' }), h('div', { class: 'map' }, cards)),
        h('aside', { class: 'side' },
          h('div', { class: 'card' },
            h('h2', { text: 'Progres' }),
            h('div', { class: 'bar-label' }, h('span', { text: 'Misi tersedia selesai' }), h('span', { text: doneReady + ' / ' + ready.length })),
            h('div', { class: 'bar green', role: 'progressbar', 'aria-label': 'Progres misi', 'aria-valuemin': '0', 'aria-valuemax': String(ready.length), 'aria-valuenow': String(doneReady) },
              h('i', { style: 'width:' + (doneReady / ready.length * 100) + '%' })),
            h('p', { class: 'muted', style: 'margin-top:10px', text: 'Nilai minimal ' + Score.CONFIG.passScore + ' untuk membuka misi berikutnya.' })),
          h('div', { class: 'card' },
            h('h2', { text: 'Kondisi Kemenangan' }),
            h('p', { class: 'muted', text: 'Selesaikan semua misi wajib dan Final Challenge (' + gs.done + ' / ' + gs.total + '). Gelar Repository Guardian diberikan bila nilai akhir minimal 90.' }),
            h('p', null, h('b', { text: 'Nilai akhir: ' + gs.finalScore + ' — ' + (gs.won ? gs.rank : 'belum tamat') }))),
          h('div', { class: 'card' },
            h('h2', { text: 'Pencapaian' }),
            h('ul', { class: 'ach-list' }, ach.map(function (a) {
              return h('li', { class: 'ach ' + (a.on ? 'on' : 'off') },
                h('span', { class: 'ico', 'aria-hidden': 'true' }, icon(a.on ? 'achievement' : 'lock')),
                h('span', { text: a.label + (a.on ? ' (diraih)' : ' (belum)') }));
            }))),
          h('div', { class: 'card' },
            h('p', { class: 'mentor' }, h('span', { class: 'sprite bugbyte', 'aria-hidden': 'true', text: 'B' }),
              h('span', { text: 'Bugbyte: Mulai dari Level 1, ya! Progresmu otomatis tersimpan di browser ini.' }))))))), 'splash');
  }


  /* ---------- HUD pemain (dipakai dunia & daftar misi) ---------- */
  function hudBar(p, buttons) {
    var lv = Score.levelInfo(p.xp);
    return h('header', { class: 'topbar' },
      h('div', { class: 'player' },
        h('div', { class: 'avatar char-av', 'aria-hidden': 'true' }, h('span', { class: 'char-slot' }, window.GQChars.canvas(function () { return charOf(p); }, 2, function () { return Score.levelInfo(p.xp).tier; }, { calm: function () { return !!save.settings.reduceMotion; } }).el)),
        h('div', null, h('h1', { text: p.displayName }), h('span', { class: 'muted', text: lv.title + ' • Level ' + lv.level }))),
      h('div', { class: 'xp-wrap' },
        h('div', { class: 'bar-label' }, h('span', null, icon('xp', 'xp-ico'), 'XP'), h('span', { text: lv.into + ' / ' + lv.per + ' (total ' + p.xp + ')' })),
        h('div', { class: 'bar', role: 'progressbar', 'aria-label': 'XP menuju level berikutnya', 'aria-valuemin': '0', 'aria-valuemax': String(lv.per), 'aria-valuenow': String(lv.into) },
          h('i', { style: 'width:' + (lv.into / lv.per * 100) + '%' }))),
      h('div', { class: 'row' }, buttons));
  }

  /* ---------- Dunia (overworld) ---------- */
  /* Syarat belajar: NPC penyimpan materi tiap stage menyimpan semua topik; portal Level terbuka setelah semuanya dibaca. */
  function topicsOf(i) { return (MISSIONS[i] && MISSIONS[i].material) || []; }
  function learnedList(i) { var p = profile(); return (p.learned && p.learned[MISSIONS[i].id]) || []; }
  function learnedCount(i) { var n = topicsOf(i).length; return learnedList(i).filter(function (k) { return k < n; }).length; }
  function learnedAll(i) { var n = topicsOf(i).length; return !n || missionStatus(i) === 'completed' || learnedCount(i) >= n; }
  function keeperMission(npcId) {
    var ids = Object.keys(window.GQ_AREAS || {});
    for (var k = 0; k < ids.length; k++) if (window.GQ_AREAS[ids[k]].keeper === npcId) return MISSIONS.findIndex(function (m) { return m.id === ids[k]; });
    return -1;
  }
  function keeperName(i) { var A0 = window.GQ_AREAS[MISSIONS[i].id], n = A0 && A0.npcs.filter(function (q) { return q.id === A0.keeper; })[0]; return n ? n.name : 'guru'; }
  /** Perpustakaan materi milik NPC penyimpan: daftar topik, baca, tandai paham. */
  function openLibrary(i) {
    var m = MISSIONS[i], TP = topicsOf(i), close, body = h('div');
    function mark(k) { var p = profile(); p.learned = p.learned || {}; var a = p.learned[m.id] = p.learned[m.id] || []; if (a.indexOf(k) < 0) { a.push(k); persist(); } }
    function list() {
      body.textContent = '';
      var n = learnedCount(i), all = n >= TP.length;
      body.appendChild(h('p', { class: 'muted', text: all ? 'Semua materi sudah kamu pelajari. Portal Level ' + m.no + ' terbuka, saatnya melawan ' + (m.enemy ? m.enemy.name : 'musuh') + '!' : 'Baca semua topik (' + n + '/' + TP.length + ') agar portal Level ' + m.no + ' terbuka.' }));
      body.appendChild(h('div', { class: 'bar green', role: 'progressbar', 'aria-label': 'Materi dibaca', 'aria-valuemin': '0', 'aria-valuemax': String(TP.length), 'aria-valuenow': String(n) }, h('i', { style: 'width:' + (n / TP.length * 100) + '%' })));
      TP.forEach(function (sct, k) {
        var done = learnedList(i).indexOf(k) >= 0;
        body.appendChild(h('div', { class: 'row', style: 'margin:6px 0' }, btn((done ? '✓ ' : '• ') + sct.h, done ? 'btn-secondary' : 'btn-primary', function () { topic(k); })));
      });
      var acts = [];
      if (all && world && world.dests) acts.push(btn('Tunjukkan portal Level', 'btn-primary', function () { var d = world.dests().filter(function (q) { return q.type === 'portal' && q.portal.kind === 'mission'; })[0]; close(); if (d) world.guide(d.x, d.y, 'Portal Level ' + m.no); }));
      acts.push(btn('Tutup', 'btn-secondary', function () { close(); }));
      body.appendChild(h('div', { class: 'row', style: 'margin-top:10px' }, acts));
    }
    function topic(k) {
      var sct = TP[k]; body.textContent = '';
      body.appendChild(h('h3', { text: sct.h }));
      if (sct.img) body.appendChild(h('img', { class: 'material-img', src: sct.img, alt: sct.alt || '' }));
      (sct.p || []).forEach(function (t) { body.appendChild(h('p', { text: t })); });
      if (sct.code) body.appendChild(h('pre', { class: 'code-block', tabindex: '0', 'aria-label': 'Contoh perintah' }, h('code', { text: sct.code.join('\n'), style: 'background:none;padding:0;color:inherit' })));
      body.appendChild(h('div', { class: 'row', style: 'margin-top:10px' },
        btn('Sudah paham', 'btn-primary', function () {
          var was = learnedAll(i); mark(k); sfx('hint');
          if (!was && learnedAll(i)) { toast('Materi lengkap! Portal Level ' + m.no + ' terbuka.'); sfx('unlock'); }
          list();
        }),
        btn('Kembali', 'btn-secondary', list)));
    }
    list();
    close = openModal('Materi: ' + m.title, [body]);
  }

  var NPC_INFO = {
    nara: {
      name: 'Nara', cls: 'nara', lines: function () {
        var p = profile(), idx = firstOpenMission();
        if (p.completedMissions.length === 0) return ['Selamat datang di Plaza CodeForge! Setiap stage punya peta sendiri. Gerbang biru bernomor 1 (AKADEMI) di bagian bawah adalah tujuan pertamamu.', 'Di tiap peta ada guru berlabel ungu MATERI yang menyimpan materi. Baca semuanya dulu agar portal Level terbuka. Nama hijau = guru baik, nama merah = penjahat.', 'Bingung? Lihat kartu Petunjuk di samping peta, atau tekan tombol Panduan di atas. Tanyakan arah ke NPC baik kapan saja!'];
        if (idx >= 0) return ['Kerja bagus! Misi berikutnya: Level ' + MISSIONS[idx].no + ' — ' + MISSIONS[idx].title + '. Gerbang ' + MISSIONS[idx].no + ' di Plaza sudah menyala.'];
        return ['Semua misi yang tersedia sudah kamu tuntaskan. Ulangi misi untuk meraih 100 poin, dan tunggu level berikutnya!'];
      }
    },
    bugbyte: { name: 'Bugbyte', cls: 'bugbyte', lines: function () { return ['Bip! Gerak: panah atau WASD (mode CLI: ketik perintah). Interaksi: Enter atau Spasi. Lupa caranya? Tombol Panduan di atas menjelaskan semuanya.', 'Saat bertarung, jawaban benar menyerang musuh. Bingung? Pakai Petunjuk dan aku akan memindai soalnya. Poin berkurang, XP tidak.']; } },
    dev1: { name: 'Dev Senior', cls: 'player', lines: function () { return ['Dulu aku menyalin folder proyek jadi "final_v2_beneran_fix". Berantakan! Sejak pakai Git, semua versi tercatat rapi di riwayat.']; } },
    dev2: { name: 'Dev Magang', cls: 'nara', lines: function () { return ['Tips: bayangkan Staging Area seperti keranjang belanja. git add memasukkan barang ke keranjang, git commit membayarnya ke riwayat.']; } },
    glitch: {
      name: 'Glitch', cls: 'glitch', lines: function () {
        var p = profile();
        return p.completedMissions.length >= MISSIONS.filter(function (m) { return m.ready; }).length
          ? ['Grr... kamu sudah menamatkan semua yang ada. Tunggu Bos Terakhir di Benteng Merge, kalau berani!']
          : ['Hehehe! Aku Glitch! Proyekmu akan kubuat berantakan... kecuali kamu menyelesaikan semua level.'];
      }
    }
  };
  function firstOpenMission() {
    for (var i = 0; i < MISSIONS.length; i++) if (missionStatus(i) === 'available') return i;
    return -1;
  }

  // NPC dari data/areas.js (peta tiap stage): "good" mengajar, "evil" menyebar kebiasaan buruk lalu mengaku
  var AREAS = window.GQ_AREAS || {};
  var talked = {};   // NPC yang sudah diajak bicara pada sesi ini (menghilangkan tanda "!")
  Object.keys(AREAS).forEach(function (aid) {
    AREAS[aid].npcs.forEach(function (n) {
      if (!NPC_INFO[n.id]) { var ls = n.lines; NPC_INFO[n.id] = { name: n.name, cls: n.kind === 'evil' ? 'glitch' : 'nara', lines: function () { return ls; } }; }
      NPC_INFO[n.id].kind = n.kind; NPC_INFO[n.id].job = n.job || '';
    });
  });
  function portalLabel(pt) { return pt.kind === 'exit' ? 'Pintu keluar ke ' + AREAS[pt.to].name : (pt.kind === 'gate' ? 'Gerbang ' + AREAS[pt.to].name : 'Portal ' + MISSIONS[pt.mission].title); }
  /** Kalimat arah dari posisi pemain ke tujuan (kanan/kiri/atas/bawah, sama dengan perintah mode CLI). */
  function directionText(me, d) {
    var dx = d.x - me.x, dy = d.y - me.y, parts = [], cmd = [];
    if (dx) { parts.push(Math.abs(dx) + ' ke ' + (dx > 0 ? 'kanan' : 'kiri')); cmd.push((dx > 0 ? 'right ' : 'left ') + Math.abs(dx)); }
    if (dy) { parts.push(Math.abs(dy) + ' ke ' + (dy > 0 ? 'bawah' : 'atas')); cmd.push((dy > 0 ? 'down ' : 'up ') + Math.abs(dy)); }
    if (!parts.length) return { text: 'Kamu sudah berdiri di sana!', cmd: '' };
    var tot = Math.abs(dx) + Math.abs(dy);
    return { text: tot <= 2 ? 'Sangat dekat, hanya ' + parts.join(' dan ') + ' langkah.' : 'Sekitar ' + tot + ' langkah: ' + parts.join(', lalu ') + '. Kalau terhalang, putar lewat jalan setapak.', cmd: cmd.join('; ') };
  }
  function talk(id) {
    var info = NPC_INFO[id]; if (!info) return;
    talked[id] = 1;
    var lines = info.lines().slice(), i = 0, close, evil = info.kind === 'evil', canAsk = !evil && world && world.dests, km = evil ? -1 : keeperMission(id);
    if (km >= 0 && !learnedAll(km)) lines.push('Aku menyimpan ' + topicsOf(km).length + ' materi untuk zona ini. Baca semuanya dulu, baru portal Level ' + MISSIONS[km].no + ' terbuka dan kamu boleh melawan ' + (MISSIONS[km].enemy ? MISSIONS[km].enemy.name : 'musuh') + '.');
    var speaker = h('div', { class: 'speaker ' + (evil ? 'evil' : 'good'), text: info.name + (evil ? ' (jahat)' : ' (baik)') });
    var job = info.job ? h('div', { class: 'job', text: 'Jobdesk: ' + info.job }) : null;
    var text = h('div', { class: 'speech' + (evil ? ' evil' : ''), text: lines[0] });
    var acts = h('div', { class: 'row' });
    var next = btn(lines.length > 1 ? 'Lanjut' : 'Tutup', 'btn-primary', function () {
      if (i < lines.length - 1) { i++; text.textContent = lines[i]; if (i === lines.length - 1) next.textContent = 'Tutup'; sfx('click'); }
      else close();
    });
    function menu() {   // daftar tujuan untuk "Tanya arah"
      var me = world.pos(), ds = world.dests().filter(function (d) { return d.type === 'portal' || (d.id !== id && d.kind !== 'evil'); });
      ds.forEach(function (d) { d.dist = Math.abs(d.x - me.x) + Math.abs(d.y - me.y); d.label = d.type === 'portal' ? portalLabel(d.portal) : 'Bertemu ' + d.name; });
      var ports = ds.filter(function (d) { return d.type === 'portal'; }), people = ds.filter(function (d) { return d.type === 'npc'; }).sort(function (a, b) { return a.dist - b.dist; }).slice(0, 6);
      text.textContent = 'Mau ke mana? Pilih tujuanmu dan aku tunjukkan arahnya.';
      acts.textContent = '';
      ports.concat(people).forEach(function (d) { acts.appendChild(btn(d.label, 'btn-secondary', function () { answer(d); })); });
      acts.appendChild(btn('Kembali', 'btn-secondary', function () { text.textContent = lines[i]; setActs(); }));
    }
    function answer(d) {
      var me = world.pos(), dir = directionText(me, d);
      text.textContent = info.name + ': ' + d.label + ' — ' + dir.text + (save.settings.controlMode === 'cli' && dir.cmd ? ' Ketik: ' + dir.cmd + '.' : '') + ' Tandanya kunyalakan di peta!';
      world.guide(d.x, d.y, d.label); sfx('hint');
      acts.textContent = '';
      if (save.settings.controlMode !== 'cli') acts.appendChild(btn('Antar aku', 'btn-primary', function () { close(); world.goTo(d.x, d.y); }));
      acts.appendChild(btn('Tujuan lain', 'btn-secondary', menu));
      acts.appendChild(btn('Tutup', 'btn-secondary', function () { close(); }));
    }
    function setActs() {
      acts.textContent = ''; acts.appendChild(next);
      if (km >= 0 && missionStatus(km) !== 'locked') acts.appendChild(btn('Buka Materi (' + learnedCount(km) + '/' + topicsOf(km).length + ')', 'btn-primary', function () { close(); openLibrary(km); }));
      if (canAsk) acts.appendChild(btn('Tanya arah', 'btn-secondary', menu)); }
    setActs();
    sfx(evil ? 'wrong' : 'hint');
    close = openModal(info.name, [speaker, job, text, acts].filter(Boolean));
  }

  function areaOfMission(i) { var id = MISSIONS[i].id; return AREAS[id] ? id : null; }
  /** Dialog portal: gerbang Plaza (pilih area) atau portal misi di dalam peta stage. */
  function portalDialog(p) {
    var i = p.mission, m = MISSIONS[i], st = missionStatus(i), close, isGate = p.kind === 'gate';
    var body = [h('p', { class: 'muted', text: m.summary }), h('p', null, h('b', { text: 'Tipe game: ' }), m.game || '-', h('br'), h('b', { text: 'Musuh: ' }), m.enemy ? m.enemy.name : '???'), h('span', { class: 'badge ' + st }, STATUS_ICON[st] ? icon(STATUS_ICON[st]) : null, STATUS_LABEL[st])];
    var acts = [];
    if (isGate && (st === 'available' || st === 'completed')) {
      body.unshift(h('p', null, h('b', { text: 'Area: ' }), AREAS[p.to].name));
      acts.push(btn('Masuk Area', 'btn-primary', function () { close(); sfx('portal'); if (world) world.enter(p.to); }));
    } else if (st === 'available' && !learnedAll(i)) {
      body.push(h('p', { class: 'note', text: 'Belajar dulu! Baca semua materi (' + learnedCount(i) + '/' + topicsOf(i).length + ') dari ' + keeperName(i) + ' agar portal ini terbuka dan kamu bisa melawan ' + (m.enemy ? m.enemy.name : 'musuh') + '.' }));
      if (world && world.dests) acts.push(btn('Tunjukkan ' + keeperName(i), 'btn-primary', function () { var A0 = AREAS[m.id], d = world.dests().filter(function (q) { return q.type === 'npc' && A0 && q.id === A0.keeper; })[0]; close(); if (d) world.guide(d.x, d.y, keeperName(i)); }));
    } else if (st === 'available' || st === 'completed') {
      acts.push(btn(st === 'completed' ? 'Masuk lagi' : 'Masuk', 'btn-primary', function () { close(); lastPortal = i; lastArea = areaOfMission(i) || 'plaza'; cinematic(i, function () { go('material', i); }); }));
    } else if (st === 'locked') {
      body.push(h('p', { class: 'note', text: 'Terkunci. Selesaikan Level ' + MISSIONS[i - 1].no + ' dengan nilai minimal ' + Score.CONFIG.passScore + ' untuk membukanya.' }));
    } else {
      body.push(h('p', { class: 'note', text: 'Portal ini belum aktif. Level ini segera hadir.' }));
    }
    acts.push(btn('Batal', 'btn-secondary', function () { close(); }));
    body.push(h('div', { class: 'row', style: 'margin-top:12px' }, acts));
    close = openModal((m.final ? 'Final Boss' : 'Level ' + m.no) + ': ' + m.title, body);
  }

  /* ---------- Mode kontrol CLI (menantang): gerak lewat perintah ketikan ---------- */
  var CLI_DIR = { up: 'up', top: 'up', atas: 'up', north: 'up', down: 'down', bottom: 'down', bawah: 'down', south: 'down', left: 'left', kiri: 'left', west: 'left', right: 'right', kanan: 'right', east: 'right' };
  var CLI_VEC = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  var CLI_HELP = [
    'Perintah gerak: up | down | left | right  (alias: top, bottom, atas, bawah, kiri, kanan)',
    'Contoh: right 3   right(3)   move("left", 2)',
    'Aksi: interact()  talk()  wave()  look()  where()',
    'Rangkai dengan titik koma: right(4); up(2); interact()',
    'Lainnya: help  clear. Panah atas/bawah = riwayat perintah.'
  ];
  /** Urai satu pernyataan tanpa eval; hasil {t,...} atau {err}. */
  function parseCliStmt(src) {
    var m = /^([a-z_]+)\s*(?:\(([^)]*)\)|\s+(.+))?$/i.exec(src.trim());
    if (!m) return { err: 'Tidak dimengerti: ' + src.trim() };
    var name = m[1].toLowerCase(), argStr = (m[2] !== undefined ? m[2] : (m[3] || '')).trim();
    var args = argStr ? argStr.split(/[\s,]+/).map(function (a) { return a.replace(/^["']+|["']+$/g, ''); }).filter(Boolean) : [];
    function count(a) { var n = a === undefined ? 1 : Number(a); return (isInteger(n) && n >= 1 && n <= 40) ? n : 0; }
    function isInteger(n) { return typeof n === 'number' && isFinite(n) && Math.floor(n) === n; }
    if (CLI_DIR[name]) { var n1 = count(args[0]); return n1 ? { t: 'move', dir: CLI_DIR[name], n: n1 } : { err: 'Jumlah langkah harus bilangan bulat 1–40.' }; }
    if (name === 'move' || name === 'go' || name === 'walk' || name === 'jalan') {
      var d = CLI_DIR[(args[0] || '').toLowerCase()]; if (!d) return { err: 'Arah tidak dikenal. Pakai: up, down, left, right.' };
      var n2 = count(args[1]); return n2 ? { t: 'move', dir: d, n: n2 } : { err: 'Jumlah langkah harus bilangan bulat 1–40.' };
    }
    if (/^(interact|talk|bicara|use|enter|masuk)$/.test(name)) return { t: 'act' };
    if (/^(wave|emote|lambai)$/.test(name)) return { t: 'wave' };
    if (/^(where|pos|lokasi)$/.test(name)) return { t: 'where' };
    if (/^(look|scan|lihat)$/.test(name)) return { t: 'look' };
    if (/^(help|bantuan)$/.test(name)) return { t: 'help' };
    if (/^(clear|cls)$/.test(name)) return { t: 'clear' };
    return { err: 'Perintah tidak dikenal: ' + name + '. Ketik help.' };
  }
  function makeCli() {
    var log = h('div', { class: 'cli-log', role: 'log', 'aria-live': 'polite' });
    var input = h('input', { type: 'text', class: 'cli-input', id: 'cli-input', autocomplete: 'off', spellcheck: 'false', 'aria-label': 'Perintah gerak', placeholder: 'right 3; up(2); interact()' });
    var form = h('form', { class: 'cli-form' }, h('span', { class: 'cli-prompt', 'aria-hidden': 'true', text: '>' }), input);
    var hist = [], hi = 0, busy = false, timer = null;
    function say(t, cls) { log.appendChild(h('div', { class: 'cli-line' + (cls ? ' ' + cls : ''), text: t })); while (log.childElementCount > 60) log.removeChild(log.firstChild); log.scrollTop = log.scrollHeight; }
    function modalOn() { var m = document.getElementById('modal-root'); return !!(m && m.childElementCount); }
    cleanups.push(function () { clearInterval(timer); });

    function exec(q) {
      busy = true;
      function next() {
        var c = q.shift();
        if (!c) { busy = false; return; }
        if (c.t === 'move') {
          var done = 0, v = CLI_VEC[c.dir];
          timer = setInterval(function () {
            if (modalOn()) { clearInterval(timer); q.length = 0; busy = false; say('Dialog terbuka, sisa perintah dibatalkan.', 'info'); return; }
            if (done >= c.n) { clearInterval(timer); say('ok: ' + c.dir + ' ' + c.n + ' langkah', 'ok'); next(); return; }
            var moved = world.step(v[0], v[1], true);
            if (!moved) {
              clearInterval(timer); q.length = 0; busy = false;
              say(modalOn() ? 'Bertemu NPC atau portal, dialog dibuka.' : 'Terhalang setelah ' + done + ' langkah (dinding, dekorasi, atau NPC). Sisa perintah dibatalkan.', modalOn() ? 'info' : 'err'); return;
            }
            done++;
          }, 130);
          return;
        }
        var L = world.look();
        if (c.t === 'act') {
          if (!L.portal && !L.npcs.length) say('Tidak ada apa pun untuk diajak berinteraksi. Dekati NPC atau berdiri di portal.', 'err');
          else { say('interact(): ' + (L.portal ? 'membuka portal' : 'bicara dengan ' + L.npcs[0].name), 'ok'); world.interact(); }
        } else if (c.t === 'wave') { world.emote(); say('wave(): melambai!', 'ok'); }
        else if (c.t === 'where') say('Posisi (' + L.x + ', ' + L.y + ') di ' + (AREAS[world.area()] ? AREAS[world.area()].name : world.area()) + '.', 'info');
        else if (c.t === 'look') say(L.portal ? 'Kamu berdiri di portal/pintu. Ketik interact().' : (L.npcs.length ? 'Di dekatmu: ' + L.npcs.map(function (n) { return n.name + (n.kind === 'evil' ? ' (jahat)' : ' (baik)'); }).join(', ') + '. Ketik interact().' : 'Tidak ada NPC atau portal di sekitarmu.'), 'info');
        else if (c.t === 'help') CLI_HELP.forEach(function (l) { say(l, 'info'); });
        else if (c.t === 'clear') log.textContent = '';
        next();
      }
      next();
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var line = input.value.trim(); if (!line) return;
      if (busy) { say('Tunggu perintah sebelumnya selesai.', 'err'); return; }
      hist.push(line); hi = hist.length; input.value = '';
      say('> ' + line, 'cmd');
      var parts = line.split(/[;\n]+/).map(function (x) { return x.trim(); }).filter(Boolean), q = [], total = 0;
      for (var i = 0; i < parts.length; i++) {
        var p = parseCliStmt(parts[i]);
        if (p.err) { say(p.err, 'err'); return; }
        if (p.t === 'move') total += p.n;
        q.push(p);
      }
      if (total > 120) { say('Terlalu panjang: maksimal 120 langkah per baris.', 'err'); return; }
      exec(q);
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowUp') { e.preventDefault(); if (hi > 0) { hi--; input.value = hist[hi]; } }
      else if (e.key === 'ArrowDown') { e.preventDefault(); if (hi < hist.length - 1) { hi++; input.value = hist[hi]; } else { hi = hist.length; input.value = ''; } }
    });
    say('Mode CLI aktif. Ketik "help" untuk daftar perintah.', 'info');
    say('Contoh: right 3', 'info');
    var card = h('div', { class: 'card cli-card' }, h('h2', { text: 'Terminal Kontrol' }), log, form,
      h('p', { class: 'muted', style: 'margin:8px 0 0;font-size:.8rem', text: 'Panah, WASD, klik peta, dan tombol arah dinonaktifkan di mode ini.' }));
    card.addEventListener('click', function () { input.focus({ preventScroll: true }); });
    return { card: card, focus: function () { input.focus({ preventScroll: true }); } };
  }

  /** Panduan bermain bertahap (dibuka otomatis pertama kali, lalu lewat tombol Panduan). */
  function openGuide(onDone) {
    var cli = save.settings.controlMode === 'cli', page = 0, close, body = h('div');
    function sw(c, t) { return h('div', { class: 'legend-row' }, h('span', { class: 'swatch', style: 'background:' + c }), h('span', { text: t })); }
    var pages = [
      { t: 'Cara bergerak', n: [
        h('p', { text: cli ? 'Mode CLI: ketik perintah di kotak Terminal Kontrol, misalnya right 3; up(2); interact(). Ketik help untuk daftar perintah.' : 'Gerakkan karaktermu dengan panah atau WASD. Bisa juga klik tempat tujuan di peta, atau pakai tombol arah di layar.' }),
        h('p', { text: cli ? 'Perintah interact() berbicara dengan NPC di dekatmu atau membuka portal yang kamu injak.' : 'Tekan Enter, Spasi, atau tombol Aksi untuk berbicara dengan NPC di dekatmu atau membuka portal yang kamu injak.' }),
        h('p', { class: 'muted', text: 'Mau kode ketik? Ubah Mode kontrol di Pengaturan.' })] },
      { t: 'Kenali penandanya', n: [h('div', { class: 'legend' },
        sw('#EAB308', 'KAMU (label kuning dan cincin kuning di kaki): karaktermu.'),
        sw('#C084FC', 'MATERI (label ungu, aura ungu, titik ungu di minimap): Penyimpan Materi, guru yang menyimpan materi stage.'),
        sw('#86efac', 'Nama hijau: guru dan warga baik yang menjelaskan materi.'),
        sw('#f87171', 'Nama merah: penjahat yang menyebar kebiasaan buruk, tapi mengaku dan mengoreksi di akhir.'),
        sw('#EF4444', 'Tanda ! di atas kepala: NPC yang belum kamu ajak bicara.'))] },
      { t: 'Alur belajar', n: [h('ol', null,
        h('li', { text: 'Di Plaza, masuk Gerbang bernomor (mulai dari 1 AKADEMI).' }),
        h('li', { text: 'Di dalam stage, cari NPC berlabel ungu MATERI lalu pilih Buka Materi.' }),
        h('li', { text: 'Baca semua topik dan tekan Sudah paham pada tiap topik.' }),
        h('li', { text: 'Portal Level terbuka (ikon buku berubah jadi nomor). Masuk dan lawan musuhnya.' }),
        h('li', { text: 'Menang dengan nilai minimal 70, lalu kembali ke Plaza. Gerbang berikutnya terbuka.' }))] },
      { t: 'Kalau bingung', n: [
        h('p', null, h('b', { text: 'Tanya arah: ' }), document.createTextNode('bicara dengan NPC baik, pilih Tanya arah, lalu pilih tujuan. Penanda kuning muncul di peta.')),
        h('p', null, h('b', { text: 'Kartu Petunjuk: ' }), document.createTextNode('di samping peta selalu menampilkan langkah berikutnya, dengan tombol Tunjukkan.')),
        h('p', null, h('b', { text: 'Nara: ' }), document.createTextNode('pemandu utama di Plaza, siap menjelaskan misi berikutnya.')),
        h('p', { class: 'muted', text: 'Berbicara dengan NPC tidak mengurangi skor atau XP. Buka Panduan ini lagi lewat tombol Panduan.' })] }
    ];
    function show() {
      body.textContent = '';
      var pg = pages[page];
      body.appendChild(h('p', { class: 'guide-step', text: 'Panduan ' + (page + 1) + ' / ' + pages.length + ': ' + pg.t }));
      pg.n.forEach(function (x) { body.appendChild(x); });
      var acts = [];
      if (page > 0) acts.push(btn('Kembali', 'btn-secondary', function () { page--; show(); }));
      acts.push(page < pages.length - 1 ? btn('Lanjut', 'btn-primary', function () { page++; show(); }) : btn('Mengerti, mulai!', 'btn-primary', function () { close(); }));
      body.appendChild(h('div', { class: 'row', style: 'margin-top:12px' }, acts));
    }
    show();
    close = openModal('Panduan Bermain', [body], function () { if (onDone) onDone(); });
  }

  function sceneWorld() {
    var p = profile();
    if (!p) { go('profile'); return; }
    var hint = h('p', { class: 'world-hint', 'aria-live': 'polite' }, 'Jelajahi dunia dengan panah atau WASD.');
    var canvas = h('canvas', { class: 'world-canvas', tabindex: '0', role: 'application', 'aria-label': 'Dunia GIT QUEST. Gerak dengan tombol panah atau WASD. Tekan Enter untuk berinteraksi. Alternatif: gunakan Mode Daftar.' });

    var gs = Score.gameStatus(p, MISSIONS), open = firstOpenMission();
    var locLabel = h('p', { class: 'loc' });
    var quest = h('div', { class: 'card' },
      h('h2', { text: 'Misi Aktif' }),
      open >= 0
        ? [h('p', null, h('b', { text: 'Level ' + MISSIONS[open].no + ': ' + MISSIONS[open].title })), h('p', { class: 'muted', text: 'Game: ' + MISSIONS[open].game + '. Masuk gerbang ' + MISSIONS[open].no + ' di Plaza, bicara dengan NPC, lalu masuk portal level di ujung peta.' })]
        : h('p', { class: 'muted', text: 'Semua misi yang tersedia sudah selesai. Level berikutnya segera hadir.' }),
      h('div', { class: 'bar-label' }, h('span', { text: 'Misi selesai' }), h('span', { text: gs.done + ' / ' + gs.total })),
      h('div', { class: 'bar green', role: 'progressbar', 'aria-label': 'Misi selesai', 'aria-valuemin': '0', 'aria-valuemax': String(gs.total), 'aria-valuenow': String(gs.done) }, h('i', { style: 'width:' + (gs.done / gs.total * 100) + '%' })));
    var where = h('div', { class: 'card' }, h('h2', { text: 'Lokasi' }), locLabel);

    /* Catatan misi: sticky note di atas peta (pengingat langkah + panduan cepat), selalu tampil, bisa diciutkan */
    var tipText = h('p', { class: 'tip-text' }), tipList = h('ul', { class: 'note-list' }), tipNote = h('p', { class: 'tip-note', 'aria-live': 'polite' }), tipTarget = null;
    var isCli0 = save.settings.controlMode === 'cli';
    var quick = h('p', { class: 'note-quick', text: isCli0 ? 'Panduan cepat: ketik right 3; up(2); interact()' : 'Panduan cepat: panah/WASD jalan • Enter/Spasi bicara • klik peta = jalan otomatis' });
    function nextStep() {
      var aid = lastArea, A0 = AREAS[aid]; if (!A0) return { text: '', items: [] };
      if (aid === 'plaza') {
        var idx = firstOpenMission();
        if (idx < 0) return { text: 'Semua misi yang tersedia sudah selesai. Ulangi misi untuk nilai 100, atau tunggu level berikutnya.', items: [{ t: 'Semua misi tersedia selesai', done: true }] };
        var g = A0.portals.filter(function (q) { return q.kind === 'gate' && q.mission === idx; })[0];
        return { text: 'Masuk Gerbang ' + MISSIONS[idx].no + (g ? ' (' + g.label + ')' : '') + ' di Plaza.', items: [{ t: 'Masuk Gerbang ' + MISSIONS[idx].no + (g ? ' (' + g.label + ')' : ''), done: false }, { t: 'Cari penyimpan materi (label ungu)', done: false }, { t: 'Baca materi, lalu lawan musuh', done: false }], target: g ? { x: g.x, y: g.y, label: 'Gerbang ' + MISSIONS[idx].no } : null };
      }
      var mi = MISSIONS.findIndex(function (m) { return m.id === aid; }); if (mi < 0) return { text: '', items: [] };
      var st = missionStatus(mi), ex = A0.portals.filter(function (q) { return q.kind === 'exit'; })[0], kn = keeperName(mi);
      var met = !!talked[A0.keeper] || learnedCount(mi) > 0 || st === 'completed', read = learnedAll(mi), won = st === 'completed';
      var items = [{ t: 'Temui ' + kn + ' (label ungu MATERI)', done: met }, { t: 'Baca semua materi (' + learnedCount(mi) + '/' + topicsOf(mi).length + ')', done: read }, { t: 'Masuk portal Level ' + MISSIONS[mi].no + ', lawan ' + (MISSIONS[mi].enemy ? MISSIONS[mi].enemy.name : 'musuh'), done: won }, { t: 'Kembali ke Plaza (pintu kuning)', done: false }];
      if (won) return { text: 'Level ini selesai. Kembali ke Plaza lewat pintu kuning.', items: items, target: ex ? { x: ex.x, y: ex.y, label: 'Pintu keluar' } : null };
      if (!read) {
        var d = world && world.dests ? world.dests().filter(function (q) { return q.type === 'npc' && q.id === A0.keeper; })[0] : null;
        return { text: 'Cari ' + kn + ' (label ungu MATERI, titik ungu di minimap) dan baca semua materi.', items: items, target: d ? { x: d.x, y: d.y, label: kn } : null };
      }
      var pt = A0.portals.filter(function (q) { return q.kind === 'mission'; })[0];
      return { text: 'Materi lengkap! Masuk portal Level ' + MISSIONS[mi].no + ' di ujung peta.', items: items, target: pt ? { x: pt.x, y: pt.y, label: 'Portal Level ' + MISSIONS[mi].no } : null };
    }
    function refreshTip() {
      var st0 = nextStep(), cur0 = -1; tipText.textContent = st0.text; tipTarget = st0.target || null; showBtn.hidden = !tipTarget;
      tipList.textContent = '';
      st0.items.forEach(function (it, k) { if (!it.done && cur0 < 0) cur0 = k; });
      st0.items.forEach(function (it, k) { tipList.appendChild(h('li', { class: it.done ? 'done' : (k === cur0 ? 'now' : ''), text: (it.done ? '✓ ' : (k === cur0 ? '▶ ' : '• ')) + it.t })); });
    }
    var showBtn = btn('Tunjukkan', 'btn-primary', function () {
      var st1 = nextStep(); if (!st1.target || !world) return;
      world.guide(st1.target.x, st1.target.y, st1.target.label);
      var dr = directionText(world.pos(), st1.target);
      tipNote.textContent = st1.target.label + ': ' + dr.text + (save.settings.controlMode === 'cli' && dr.cmd ? ' Ketik: ' + dr.cmd + '.' : '') + ' Cari penanda kuning di peta.';
      sfx('hint');
    });
    var noteMin = false; try { noteMin = localStorage.getItem('gq_note_min') === '1'; } catch (e) { /* abaikan */ }
    var noteBody = h('div', { class: 'note-body' }, tipText, tipList, quick, h('div', { class: 'row' }, showBtn, btn('Panduan', 'btn-secondary', function () { openGuide(); })), tipNote);
    var noteToggle = h('button', { type: 'button', class: 'note-toggle', 'aria-label': 'Ciutkan atau tampilkan catatan misi' });
    var tips = h('aside', { class: 'mission-note tip-card', 'aria-label': 'Catatan misi' }, h('div', { class: 'note-head' }, h('b', { text: 'CATATAN MISI' }), noteToggle), noteBody);
    function applyNote() { tips.classList.toggle('min', noteMin); noteBody.hidden = noteMin; noteToggle.textContent = noteMin ? '+' : '–'; try { localStorage.setItem('gq_note_min', noteMin ? '1' : '0'); } catch (e) { /* abaikan */ } }
    noteToggle.addEventListener('click', function () { noteMin = !noteMin; applyNote(); });
    applyNote();
    var tipTimer = setInterval(function () { if (document.body.contains(tips)) refreshTip(); }, 700);
    cleanups.push(function () { clearInterval(tipTimer); });

    function padBtn(label, aria) { return h('button', { type: 'button', class: 'btn btn-secondary pad', 'aria-label': aria, text: label }); }
    var up = padBtn('▲', 'Naik'), dn = padBtn('▼', 'Turun'), lf = padBtn('◀', 'Kiri'), rt = padBtn('▶', 'Kanan');
    var act = h('button', { type: 'button', class: 'btn btn-primary pad pad-act', 'aria-label': 'Interaksi', text: 'Aksi' });
    var dpad = h('div', { class: 'dpad' }, h('span'), up, h('span'), lf, act, rt, h('span'), dn, h('span'));

    var isCli = save.settings.controlMode === 'cli', moveWord = isCli ? 'perintah ketikan (mis. right 3)' : 'panah atau WASD';
    var cli = isCli ? makeCli() : null;
    var wrap = h('div', { class: 'pixel-bg scene' }, h('div', { class: 'page page-world' },
      hudBar(p, [btn('Panduan', 'btn-secondary', function () { openGuide(); }), btn('Mode Daftar', 'btn-secondary', function () { setView('list'); }), btn('Pengaturan', 'btn-secondary', openSettings)]),
      h('div', { class: 'world-layout' },
        h('section', { 'aria-label': 'Dunia' }, h('div', { class: 'world-stage' }, canvas, tips), hint),
        h('aside', { class: 'side' }, where, quest,
          isCli ? cli.card : h('div', { class: 'card' }, h('h2', { text: 'Kontrol' }), dpad,
            h('div', { class: 'row', style: 'justify-content:center;margin-top:8px' }, btn('Lambai (F)', 'btn-secondary', function () { if (world) world.emote(); })),
            h('p', { class: 'muted', style: 'margin-top:10px;font-size:.85rem', text: 'Klik peta untuk berjalan otomatis. Keyboard: panah/WASD, Enter/Spasi untuk berinteraksi, F untuk melambai. Pintu kuning (panah kiri) = kembali ke Plaza.' }))))));
    mount(wrap, 'splash');

    var unlockNow = pendingUnlock; pendingUnlock = -1;
    // Setelah menamatkan level pertama kali: kembali ke Plaza (animasi gerbang berikutnya terbuka). Lainnya: ke peta terakhir.
    var startArea = unlockNow >= 0 ? 'plaza' : (AREAS[lastArea] ? lastArea : 'plaza'), spawn = null;
    // pengaman: jangan mulai di peta stage yang belum terbuka untuk profil ini
    var startMi = MISSIONS.findIndex(function (m) { return m.id === startArea; });
    if (startMi >= 0 && ['available', 'completed'].indexOf(missionStatus(startMi)) < 0) { startArea = 'plaza'; lastArea = 'plaza'; lastPortal = -1; }
    if (lastPortal >= 0) {
      var tgt = AREAS[startArea].portals.filter(function (q) { return q.mission === lastPortal && q.kind !== 'exit'; })[0];
      if (tgt) spawn = { x: tgt.x, y: tgt.y > AREAS[startArea].h / 2 ? tgt.y - 1 : tgt.y + 1 };
    }
    if (resume) { startArea = resume.area; spawn = resume.pos; resume = null; }
    function portalName(pt) { return pt.kind === 'exit' ? 'Pintu keluar ke ' + AREAS[pt.to].name : (pt.kind === 'gate' ? 'Gerbang ' + AREAS[pt.to].name : 'Portal ' + MISSIONS[pt.mission].title); }
    world = window.GQWorld.start({
      canvas: canvas, area: startArea, spawn: spawn, finalIndex: MISSIONS.length - 1,
      controls: function () { return save.settings.controlMode === 'cli' ? 'cli' : 'gui'; },
      unlock: unlockNow >= 0 ? unlockNow : null,
      alert: function (id, n) {
        if (id === 'nara') return !talked.nara && (unlockNow >= 0 || profile().completedMissions.length === 0);
        var kmi = keeperMission(id);
        if (kmi >= 0 && missionStatus(kmi) === 'available' && !learnedAll(kmi)) return true;   // penyimpan materi: tanda ! sampai semua topik dibaca
        return !talked[id] && lastArea !== 'plaza' && !!n;
      },
      keeper: function (id) { var k = keeperMission(id); return k < 0 ? 0 : (learnedAll(k) ? 2 : 1); },
      getStatus: function (i, p) { var st = missionStatus(i); return (p && p.kind === 'mission' && st === 'available' && !learnedAll(i)) ? 'study' : st; },
      reduceMotion: function () { return !!save.settings.reduceMotion; },
      onArea: function (A) {
        lastArea = A.id;
        locLabel.textContent = '';
        locLabel.appendChild(h('b', { text: A.name })); locLabel.appendChild(h('br')); locLabel.appendChild(document.createTextNode(A.sub || ''));
        hint.textContent = A.id === 'plaza' ? 'Jelajahi Plaza dengan ' + moveWord + '. Masuk gerbang bernomor untuk membuka peta stage.' : 'Ajak bicara NPC: nama hijau = guru, nama merah = penjahat. Bacalah semua materi dari penyimpan materi (tanda !) agar portal level di ujung peta terbuka.';
        if (A.id !== 'plaza') { sfx('portal'); var smi = MISSIONS.findIndex(function (m) { return m.id === A.id; }); if (smi >= 0 && missionStatus(smi) === 'available' && !learnedAll(smi)) toast('Cari ' + keeperName(smi) + ' (label ungu MATERI) untuk membuka materi.'); }
        if (typeof refreshTip === 'function') refreshTip();
        if (typeof tips !== 'undefined' && tips && !window.GQ_FAST) { tips.classList.add('dim'); setTimeout(function () { tips.classList.remove('dim'); }, 3200); }   // catatan memudar sementara agar nama zona terbaca jelas
      },
      onPortal: function (pt) { portalDialog(pt); },
      onNpc: function (id) { talk(id); },
      onHover: function (info) {
        var base = lastArea === 'plaza' ? 'Jelajahi Plaza dengan ' + moveWord + '.' : 'Jelajahi peta dengan ' + moveWord + '.';
        if (!info) hint.textContent = base;
        else if (info.type === 'portal') hint.textContent = portalName(info.portal) + ' — tekan Enter atau Aksi untuk membuka.';
        else hint.textContent = NPC_INFO[info.id].name + ' ada di dekatmu — tekan Enter atau Aksi untuk bicara.';
      }
    });
    if (window.GQ_FAST) window.__world = world;   // hanya untuk tes otomatis
    refreshTip();
    if (!p.guideSeen && !window.GQ_FAST) setTimeout(function () { if (document.body.contains(tips) && !document.getElementById('modal-root').childElementCount) openGuide(function () { p.guideSeen = true; persist(); }); }, 700);
    if (unlockNow >= 0) setTimeout(function () { toast('Gerbang Level ' + MISSIONS[unlockNow].no + ' terbuka! Masuk lewat Plaza.'); sfx('unlock'); }, 700);
    if (isCli) cli.focus();
    else {
      world.attachPad(up, 0, -1); world.attachPad(dn, 0, 1); world.attachPad(lf, -1, 0); world.attachPad(rt, 1, 0);
      act.addEventListener('click', function () { world.interact(); });
      canvas.focus({ preventScroll: true });
    }
  }

  /* ---------- Arena pertarungan (lapisan RPG; aturan skor tidak berubah) ---------- */
  var HIT_DAMAGE = 12;   // HP pemain berkurang saat jawaban salah (efek permainan saja, XP tidak berkurang)
  var PRAISE = ['Bagus sekali!', 'Tepat!', 'Kamu hebat!', 'Mantap, lanjutkan!'];
  var CHEER = ['Jangan menyerah!', 'Tenang, coba lagi.', 'Periksa materinya lagi ya.', 'Kamu pasti bisa!'];
  var PLAYER_CHEER = ['Siap!', 'Semangat!', 'Ayo!', 'Aku pasti menang!'];
  var ENEMY_TAUNT = ['Hehehe!', 'Coba kalahkan aku!', 'Kamu belum cukup kuat!', 'Hahaha!'];
  function pickOne(a) { return a[Math.floor(Math.random() * a.length)]; }
  function buildArena(m) {
    var en = m.enemy, GW = window.GQWorld;
    var pc = GW.charCanvas('player', 5), nc = GW.charCanvas('nara', 2);
    var pName = h('span', { text: profile().displayName }), eName = h('span', { text: en.name });
    var pHpTxt = h('span'), eHpTxt = h('span');
    var pBar = h('i'), eBar = h('i');
    var pBub = h('div', { class: 'bubble b-player', hidden: true, 'aria-hidden': 'true' }), eBub = h('div', { class: 'bubble b-enemy', hidden: true, 'aria-hidden': 'true' });
    var playerEl = h('div', { class: 'fighter f-player', role: 'button', tabindex: '0', 'aria-label': 'Karaktermu. Klik untuk bersorak.' }, pc.el);
    var enemyEl = h('div', { class: 'fighter f-enemy', role: 'button', tabindex: '0', 'aria-label': 'Musuh: ' + en.name + '. Klik untuk memancingnya.' },
      h('img', { class: 'enemy-img e-' + en.img + (m.final ? ' boss' : ''), src: 'assets/images/characters/enemy-' + en.img + '.svg', alt: '' }));
    var fxLayer = h('div', { class: 'fx', 'aria-hidden': 'true' });
    var logEl = h('p', { class: 'battle-log', 'aria-live': 'polite' });
    function plate(cls, name, txt, bar, color, label) {
      return h('div', { class: 'nameplate ' + cls }, h('div', { class: 'np-top' }, name, txt),
        h('div', { class: 'bar ' + color, role: 'progressbar', 'aria-label': label, 'aria-valuemin': '0', 'aria-valuemax': '100' }, bar));
    }
    var pPlate = plate('np-player', pName, pHpTxt, pBar, 'green', 'HP pemain');
    var ePlate = plate('np-enemy', eName, eHpTxt, eBar, 'red', 'HP musuh');
    var node = h('div', { class: 'arena-wrap' }, h('section', { class: 'arena', 'aria-label': 'Arena pertarungan melawan ' + en.name }, pPlate, ePlate, playerEl, enemyEl, pBub, eBub, fxLayer), logEl);

    var nText = h('p', { class: 'muted mentor-line', 'aria-live': 'polite' });
    var mentor = h('div', { class: 'card mentor-card' }, h('div', { class: 'mentor' }, h('div', { class: 'mentor-char' }, nc.el), h('div', null, h('b', { text: 'Nara' }), nText)));

    function setBars(pHp, eHp) {
      pBar.style.width = pHp + '%'; eBar.style.width = eHp + '%';
      pHpTxt.textContent = ' HP ' + pHp; eHpTxt.textContent = ' HP ' + eHp;
      pPlate.querySelector('.bar').setAttribute('aria-valuenow', String(pHp)); ePlate.querySelector('.bar').setAttribute('aria-valuenow', String(eHp));
    }
    function anim(el, cls, ms) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); setTimeout(function () { el.classList.remove(cls); }, ms); }
    function pop(side, text, cls) {
      var d = h('span', { class: 'dmg on-' + side + ' ' + (cls || ''), text: text });
      fxLayer.appendChild(d); setTimeout(function () { if (d.parentNode) d.remove(); }, 1000);
    }
    function speak(el, text, ms) { el.textContent = text; el.hidden = false; clearTimeout(el._h); el._h = setTimeout(function () { el.hidden = true; }, ms || 1700); }
    var typer = null, narTimer = null;
    function naraSay(text) {
      if (typer) typer.skip();
      typer = window.GQFX.typewriter(nText, text, 60);
      clearInterval(narTimer); var n = 0;
      narTimer = setInterval(function () { n++; nc.draw(n % 2 ? 'walk1' : 'walk2', 1); if (n > 9 || (typer && typer.isDone())) { clearInterval(narTimer); nc.draw('idle', 1); } }, 130);
      anim(mentor.querySelector('.mentor-char'), 'jump', 450);
    }
    function onPlayerClick() { sfx('jump'); anim(playerEl, 'jump', 520); speak(pBub, pickOne(PLAYER_CHEER)); }
    function onEnemyClick() { anim(enemyEl, 'wobble', 520); speak(eBub, pickOne(ENEMY_TAUNT)); }
    function keyAct(fn) { return function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } }; }
    playerEl.addEventListener('click', onPlayerClick); playerEl.addEventListener('keydown', keyAct(onPlayerClick));
    enemyEl.addEventListener('click', onEnemyClick); enemyEl.addEventListener('keydown', keyAct(onEnemyClick));
    var k = 0, idleT = setInterval(function () { k++; pc.draw(k % 2 ? 'walk2' : 'idle', 1); }, 520);

    setBars(run.playerHp, run.enemyHp);
    logEl.textContent = run.idx === 0 ? en.intro : 'Ronde berikutnya! Jawab dengan benar untuk menyerang ' + en.name + '.';

    return {
      node: node, mentor: mentor,
      log: function (t) { logEl.textContent = t; },
      say: naraSay,
      playerStrike: function (crit) {
        var target = Math.max(0, Math.round(100 * (1 - run.results.length / m.challenges.length)));
        var dmg = run.enemyHp - target; run.enemyHp = target;
        anim(playerEl, 'lunge-r', 350); pc.draw('walk1', 1); setTimeout(function () { pc.draw('idle', 1); }, 350);
        speak(pBub, crit ? 'KRITIS!' : pickOne(['Rasakan!', 'Ambil ini!', 'Yaaa!']), 1300);
        naraSay(crit ? 'Sempurna! Itu serangan kritis!' : pickOne(PRAISE));
        setTimeout(function () {
          anim(enemyEl, 'hit', 350); pop('enemy', (crit ? 'KRITIS! ' : '') + '-' + dmg, crit ? 'crit' : '');
          speak(eBub, target === 0 ? 'Aku... kalah...' : pickOne(['Aduh!', 'Argh!', 'Auw!']), 1300);
          setBars(run.playerHp, run.enemyHp);
          if (target === 0) { enemyEl.classList.add('defeated'); logEl.textContent = en.name + ' dikalahkan!'; anim(playerEl, 'jump', 520); }
          else logEl.textContent = (crit ? 'Serangan kritis' : 'Serangan tepat') + '! ' + en.name + ' kehilangan ' + dmg + ' HP.';
        }, 180);
      },
      enemyStrike: function () {
        var hp = run.playerHp - HIT_DAMAGE, fainted = hp <= 0;
        run.playerHp = fainted ? 60 : hp;   // pemain tidak pernah kalah: Nara menyembuhkan (XP & skor tidak terpengaruh)
        anim(enemyEl, 'lunge-l', 350); speak(eBub, en.attack + '!', 1400);
        naraSay(fainted ? 'Aku menyembuhkanmu. Tetap semangat, XP-mu aman!' : pickOne(CHEER));
        setTimeout(function () {
          anim(playerEl, 'hit', 350); pop('player', '-' + HIT_DAMAGE, 'dmg-p'); speak(pBub, 'Aduh!', 1100);
          if (fainted) {
            setBars(0, run.enemyHp);
            logEl.textContent = 'Kamu terjatuh! Nara menyembuhkanmu. XP dan skor tidak berkurang.';
            setTimeout(function () { setBars(run.playerHp, run.enemyHp); }, 900);
          } else {
            setBars(run.playerHp, run.enemyHp);
            logEl.textContent = en.name + ' menyerang dengan ' + en.attack + '! -' + HIT_DAMAGE + ' HP. Periksa lagi jawabanmu.';
          }
        }, 180);
      },
      dispose: function () { clearInterval(idleT); clearInterval(narTimer); if (typer) typer.skip(); }
    };
  }

  /* ---------- Adegan 5-7: Materi ---------- */
  function sceneMaterial(i) {
    var m = MISSIONS[i];
    var secs = m.material.map(function (s) {
      return h('section', { class: 'sec' },
        h('h3', { text: s.h }),
        s.img ? h('img', { class: 'material-img', src: s.img, alt: s.alt || '' }) : null,
        s.p.map(function (t) { return h('p', { text: t }); }),
        s.code ? h('pre', { class: 'code-block', tabindex: '0', 'aria-label': 'Contoh perintah' }, h('code', { text: s.code.join('\n'), style: 'background:none;padding:0;color:inherit' })) : null);
    });
    mount(h('div', { class: 'pixel-bg scene stage' }, h('div', { class: 'page page-reading' },
      h('div', { class: 'mat-layout' },
        h('aside', { class: 'card mat-left' },
          h('div', { class: 'crumbs' }, btn('← Kembali ke Peta', 'btn-secondary', function () { go(home()); })),
          h('span', { class: 'mission-no', text: 'LEVEL ' + m.no }),
          h('h1', { text: m.title }),
          h('div', { class: 'card-2 mentor', style: 'margin:10px 0 12px' },
            h('span', { class: 'char-slot sm' }, window.GQWorld.charCanvas('nara', 2).el),
            h('span', null, h('b', { text: 'Nara: ' }), m.nara)),
          h('h2', { style: 'font-size:1rem', text: 'Tujuan belajar' }),
          h('ul', { class: 'goals' }, m.goals.map(function (g) { return h('li', { text: g }); })),
          h('p', { class: 'muted mat-enemy' }, h('b', { text: 'Tipe game: ' }), m.game, h('br'), h('b', { text: 'Musuh: ' }), m.enemy.name),
          h('div', { class: 'row mat-start' }, btn('Mulai Tantangan', 'btn-primary', function () { fightIntro(m, function () { startMission(i); }); }, { id: 'go-ch' }))),
        h('section', { class: 'card mat-right', 'aria-label': 'Materi ' + m.title, tabindex: '0' }, secs)))), m.id);
    ambient(m.id);
    document.getElementById('go-ch').focus({ preventScroll: true });
  }

  function startMission(i) {
    run = { mi: i, mission: MISSIONS[i], idx: 0, results: [], attempts: 0, hints: 0, solved: false, playerHp: 100, enemyHp: 100 };
    go('challenge');
  }

  /* ---------- Adegan 5-7: Tantangan ---------- */
  function miniEnv(ctx) {
    return { h: h, icon: icon, sfx: sfx, ctx: ctx, relaxed: function () { return !!save.settings.relaxTimer; } };
  }

  var RENDER = {
    mcq: function (ch, ctx) {
      var name = 'mcq-' + run.idx, rows = [], chosen = -1;
      var fs = h('fieldset', null, h('legend', { class: 'q-prompt', text: ch.prompt }),
        ch.options.map(function (o, i) {
          var inp = h('input', { type: 'radio', name: name, value: String(i), onchange: function () { chosen = i; } });
          var row = h('label', { class: 'opt' }, inp, h('span', { text: o }));
          rows.push({ row: row, inp: inp });
          return row;
        }));
      return {
        node: fs,
        check: function () {
          if (chosen < 0) return null;
          rows.forEach(function (r, i) { r.row.classList.remove('ok', 'bad'); if (i === chosen) r.row.classList.add(i === ch.answer ? 'ok' : 'bad'); });
          return chosen === ch.answer;
        },
        lock: function () { rows.forEach(function (r) { r.inp.disabled = true; }); }
      };
    },

    match: function (ch, ctx) {
      var rows = ch.items.map(function (it, i) {
        var sel = h('select', { id: 'm' + i, 'aria-label': it.text },
          h('option', { value: '', text: 'Pilih…' }),
          ch.choices.map(function (c) { return h('option', { value: c, text: c }); }));
        var tag = h('span', { class: 'status-tag' });
        var row = h('div', { class: 'match-row' }, h('label', { for: 'm' + i, class: it.icon ? 'lbl' : '' }, it.icon ? icon(it.icon, 'big') : null, h('span', null, h('span', { text: it.text }), tag)), sel);
        return { it: it, sel: sel, row: row, tag: tag };
      });
      // Drag-and-drop (FR-07): seret kartu ke area. Menu pilihan tetap menjadi alternatif klik/keyboard.
      var zones = null;
      if (ch.dnd) {
        var dragIdx = -1;
        rows.forEach(function (r, i) {
          r.row.setAttribute('draggable', 'true');
          r.row.classList.add('draggable');
          r.row.addEventListener('dragstart', function (e) {
            dragIdx = i;
            if (e.dataTransfer) { e.dataTransfer.setData('text/plain', String(i)); e.dataTransfer.effectAllowed = 'move'; }
          });
        });
        zones = h('div', { class: 'drop-zones', 'aria-label': 'Area tujuan (seret kartu ke sini)' },
          ch.choices.map(function (c) {
            var z = h('div', { class: 'drop-zone', text: c });
            z.addEventListener('dragover', function (e) { e.preventDefault(); z.classList.add('over'); });
            z.addEventListener('dragleave', function () { z.classList.remove('over'); });
            z.addEventListener('drop', function (e) {
              e.preventDefault(); z.classList.remove('over');
              if (dragIdx < 0 || rows[dragIdx].sel.disabled) return;
              rows[dragIdx].sel.value = c;
              rows[dragIdx].row.classList.remove('ok', 'bad');
              rows[dragIdx].tag.className = 'status-tag';
              rows[dragIdx].tag.textContent = '→ ' + c;
              dragIdx = -1;
            });
            return z;
          }));
      }
      rows.forEach(function (r) {
        r.sel.addEventListener('change', function () {
          r.row.classList.remove('ok', 'bad'); r.tag.className = 'status-tag'; r.tag.textContent = '';
        });
      });
      return {
        node: h('div', null, h('p', { class: 'q-prompt', text: ch.prompt }),
          ch.dnd ? h('p', { class: 'muted', text: 'Seret kartu ke area yang tepat, atau gunakan menu pilihan di sebelah kartu.' }) : null,
          zones, rows.map(function (r) { return r.row; })),
        check: function () {
          if (rows.some(function (r) { return !r.sel.value; })) return null;
          var all = true;
          rows.forEach(function (r) {
            var ok = r.sel.value === r.it.answer;
            if (!ok) all = false;
            r.row.classList.remove('ok', 'bad'); r.row.classList.add(ok ? 'ok' : 'bad');
            r.tag.className = 'status-tag ' + (ok ? 'ok' : 'bad');
            r.tag.textContent = ok ? '✔ Benar' : '✖ Belum tepat';
          });
          return all;
        },
        lock: function () { rows.forEach(function (r) { r.sel.disabled = true; }); }
      };
    },

    order: function (ch, ctx) {
      var order = ch.items.map(function (_, i) { return i; });
      do { order.sort(function () { return Math.random() - 0.5; }); }
      while (order.every(function (v, i) { return v === i; }));
      var list = h('div'), locked = false;
      var status = {};

      function draw() {
        list.textContent = '';
        order.forEach(function (orig, pos) {
          var up = btn('▲', 'btn-secondary', function () { move(pos, -1); }, { 'aria-label': 'Naikkan: ' + ch.items[orig] });
          var dn = btn('▼', 'btn-secondary', function () { move(pos, 1); }, { 'aria-label': 'Turunkan: ' + ch.items[orig] });
          if (locked || pos === 0) up.disabled = true;
          if (locked || pos === order.length - 1) dn.disabled = true;
          var cls = status[orig] === undefined ? '' : (status[orig] ? ' ok' : ' bad');
          list.appendChild(h('div', { class: 'order-row' + cls },
            h('span', { class: 'no', text: String(pos + 1) }),
            h('span', { class: 'txt mono', text: ch.items[orig] }),
            status[orig] === undefined ? null : h('span', { class: 'status-tag ' + (status[orig] ? 'ok' : 'bad'), text: status[orig] ? '✔' : '✖' }),
            up, dn));
        });
      }
      function move(pos, d) {
        var t = order[pos]; order[pos] = order[pos + d]; order[pos + d] = t;
        status = {}; draw();
        var btns = list.querySelectorAll('.order-row')[pos + d];
        var target = btns && btns.querySelectorAll('button')[d < 0 ? 0 : 1];
        if (target && !target.disabled) target.focus(); else if (btns) btns.querySelector('button:not(:disabled)') && btns.querySelector('button:not(:disabled)').focus();
      }
      draw();
      return {
        node: h('div', null, h('p', { class: 'q-prompt', text: ch.prompt }), list),
        check: function () {
          var all = true;
          status = {};
          order.forEach(function (orig, pos) { status[orig] = (orig === pos); if (orig !== pos) all = false; });
          draw();
          return all;
        },
        lock: function () { locked = true; draw(); }
      };
    },

    sorter: function (ch, ctx) { return window.GQMini.create('sorter', ch, miniEnv(ctx)); },
    typing: function (ch, ctx) { return window.GQMini.create('typing', ch, miniEnv(ctx)); },
    reposim: function (ch, ctx) { return window.GQMini.create('reposim', ch, miniEnv(ctx)); },
    sweep: function (ch, ctx) { return window.GQMini.create('sweep', ch, miniEnv(ctx)); },
    memory: function (ch, ctx) { return window.GQMini.create('memory', ch, miniEnv(ctx)); },
    terminal: function (ch, ctx) { return window.GQMini.create('terminal', ch, miniEnv(ctx)); }
  };

  function sceneChallenge() {
    var m = run.mission, ch = m.challenges[run.idx];
    run.attempts = 0; run.hints = 0; run.solved = false;
    var arena = buildArena(m);

    var fb = h('div', { class: 'feedback', role: 'status', 'aria-live': 'polite' });
    function showFb(kind, title, text, ico) {
      fb.className = 'feedback ' + kind;
      fb.textContent = '';
      fb.appendChild(h('strong', null, ico ? icon(ico) : null, ico ? ' ' + title : title));
      fb.appendChild(document.createTextNode(text));
    }

    var part, checkBtn, hintBtn, nextBtn;
    var ctx = {
      hit: function () { arena.enemyStrike(); },
      submit: function (correct, quiet, extra) {
        if (run.solved) return;
        run.attempts++;
        if (correct) {
          run.solved = true;
          var pts = (extra && typeof extra.accuracy === 'number')
            ? Score.gamePoints(run.attempts, run.hints, extra.accuracy)
            : Score.challengePoints(run.attempts, run.hints);
          run.results.push({ id: ch.id, title: ch.title, points: pts, attempts: run.attempts, hints: run.hints });
          sfx('correct');
          arena.playerStrike(run.attempts === 1 && run.hints === 0);
          showFb('ok', '✔ Benar! +' + pts + ' poin', ' ' + ch.explain);
          part.lock();
          if (checkBtn) checkBtn.disabled = true;
          hintBtn.disabled = true;
          nextBtn.hidden = false; nextBtn.focus();
        } else {
          arena.enemyStrike();
          if (!quiet) {
            sfx('wrong');
            showFb('bad', '✖ Belum tepat', ' Periksa kembali jawabanmu. Tinjau materi: ' +
              m.material.map(function (s) { return '“' + s.h + '”'; }).join(', ') +
              '. Petunjuk tersedia (poin berkurang, XP tidak).');
          }
        }
      }
    };
    part = RENDER[ch.type](ch, ctx);

    checkBtn = part.noCheck ? null : btn('Periksa', 'btn-primary', function () {
      var r = part.check();
      if (r === null) { showFb('hint', 'Lengkapi dulu', ' Pilih jawaban untuk semua bagian sebelum memeriksa.'); return; }
      ctx.submit(r);
    });
    hintBtn = btn('Petunjuk', 'btn-secondary', function () {
      var text = part.hintText ? part.hintText() : ch.hints[Math.min(run.hints, ch.hints.length - 1)];
      run.hints++;
      sfx('hint');
      arena.log('Bugbyte memindai soalnya… (item Petunjuk dipakai: poin berkurang, XP tidak)');
      arena.say('Bugbyte membantumu. Ingat, petunjuk mengurangi poin ronde.');
      showFb('hint', 'Petunjuk ' + Math.min(run.hints, 2), ' ' + text, 'hint');
    });
    var isLast = run.idx === m.challenges.length - 1;
    nextBtn = btn(isLast ? 'Lihat Hasil' : 'Tantangan Berikutnya', 'btn-primary', function () {
      if (isLast) finishMission(); else { run.idx++; sceneChallenge(); }
    }, { hidden: true });

    var pct = run.idx / m.challenges.length * 100;
    mount(h('div', { class: 'pixel-bg scene stage' }, h('div', { class: 'page' },
      h('header', { class: 'ch-head' },
        h('h1', { text: 'Level ' + m.no + ': ' + m.title + ' — melawan ' + m.enemy.name }),
        h('div', { class: 'ch-progress' },
          h('div', { class: 'bar-label' }, h('span', { text: 'Ronde ' + (run.idx + 1) + ' dari ' + m.challenges.length + ' — ' + ch.title }), h('span', { text: Math.round(pct) + '%' })),
          h('div', { class: 'bar blue', role: 'progressbar', 'aria-label': 'Progres misi', 'aria-valuemin': '0', 'aria-valuemax': String(m.challenges.length), 'aria-valuenow': String(run.idx) },
            h('i', { style: 'width:' + pct + '%' }))),
        btn('Kabur ke Peta', 'btn-secondary', function () {
          if (run.results.length) confirmModal('Kabur dari pertarungan?', 'Progres tantangan misi ini belum disimpan jika kamu kabur sekarang.', 'Kabur', function () { go(home()); });
          else go(home());
        })),
      h('div', { class: 'battle-layout' },
        h('div', { class: 'battle-left' }, arena.node,
          arena.mentor),
        h('section', { class: 'card battle-panel', 'aria-label': 'Area tantangan' },
          h('div', { class: 'q-scroll' }, part.node),
          h('div', { class: 'row actions' }, checkBtn, hintBtn, nextBtn),
          fb)))), m.id);
    disposePart = part.dispose || null;
    cleanups.push(arena.dispose);
    ambient(m.id);
    arena.say(ch.type === 'mcq' || ch.type === 'match' || ch.type === 'order'
      ? 'Baca soal dengan teliti. Jawaban salah tidak mengurangi XP-mu.'
      : 'Tekan Mulai! saat siap. Kesalahan membuat musuh menyerang, tetapi XP-mu aman.');
    if (part.focus) part.focus();
  }

  function finishMission() {
    var p = profile(), lvBefore = Score.levelInfo(p.xp).level;
    var res = Score.applyMissionResult(p, run.mission, run.results);
    persist();
    var lvAfter = Score.levelInfo(p.xp);
    run.levelUp = lvAfter.level > lvBefore ? { from: lvBefore, to: lvAfter.level, tier: lvAfter.tier, title: lvAfter.title } : null;
    applyPlayerLook();
    if (res.firstPass && MISSIONS[run.mi + 1] && MISSIONS[run.mi + 1].ready) pendingUnlock = run.mi + 1;
    run.outcome = res;
    go('result');
  }

  /* ---------- Adegan 12: Hasil ---------- */
  function sceneResult() {
    var m = run.mission, o = run.outcome;
    var firstTry = run.results.filter(function (r) { return r.attempts === 1 && r.hints === 0; }).length;
    var acc = Math.round(firstTry / run.results.length * 100);
    var mastered = run.results.filter(function (r) { return r.points === 100; });
    var review = run.results.filter(function (r) { return r.points < 100; });
    var next = MISSIONS[run.mi + 1];
    var canNext = !!(o.passed && next && next.ready);

    mount(h('div', { class: 'pixel-bg scene' }, h('div', { class: 'page' },
      h('div', { class: 'card result' },
        h('span', { class: 'mission-no', text: 'HASIL LEVEL ' + m.no }),
        h('h1', { text: m.title }),
        h('div', { class: 'pass-tag ' + (o.passed ? 'ok' : 'no'), text: o.passed ? '✔ Misi lulus' + (o.firstPass ? ' — misi berikutnya terbuka!' : '') : '✖ Belum lulus (minimal ' + Score.CONFIG.passScore + ')' }),
        h('div', { class: 'rank', text: o.rank }),
        h('div', { class: 'stats' },
          h('div', { class: 'stat' }, h('b', { text: String(o.score) }), 'Skor'),
          h('div', { class: 'stat' }, h('b', { text: '+' + o.xpGained }), 'XP didapat'),
          h('div', { class: 'stat' }, h('b', { text: acc + '%' }), 'Akurasi')),
        h('div', { class: 'lists' },
          h('div', { class: 'card-2' }, h('b', { text: 'Sudah dikuasai' }),
            mastered.length ? h('ul', null, mastered.map(function (r) { return h('li', { text: r.title }); })) : h('p', { class: 'muted', text: 'Belum ada — coba lagi untuk 100 poin.' })),
          h('div', { class: 'card-2' }, h('b', { text: 'Perlu diulang' }),
            review.length ? h('ul', null, review.map(function (r) { return h('li', { text: r.title + ' (' + r.points + ' poin)' }); })) : h('p', { class: 'muted', text: 'Semua tantangan tuntas sempurna!' }))),
        !o.passed ? h('p', { class: 'muted', text: 'Saran: baca ulang materi, lalu ulangi misi.' }) : null,
        canNext ? h('p', { class: 'note', style: 'margin:6px 0', text: 'Kembali ke peta untuk membuka portal Level ' + next.no + ': ' + next.title + '.' }) : null,
        h('p', { class: 'muted', text: o.passed ? m.enemy.name + ' dikalahkan! Hadiah: ' + o.xpGained + ' XP.' : m.enemy.name + ' kabur dengan sisa tenaga. Pelajari lagi lalu hadapi kembali!' }),
        h('p', { class: 'muted', text: 'Rank adalah penghargaan motivasi, bukan nilai resmi sekolah. XP hanya diberikan sekali per tantangan.' }),
        h('div', { class: 'row', style: 'justify-content:center' },
          btn('Ulangi Misi', 'btn-secondary', function () { startMission(run.mi); }),
          btn('Lihat Materi', 'btn-secondary', function () { go('material', run.mi); }),
          btn('Kembali ke Peta', 'btn-primary', function () { go(home()); }, { id: 'res-map' }),
          btn('Ekspor Progres', 'btn-secondary', exportProgress))))), m.id);
    ambient(m.id);
    if (run.levelUp) { var lu = run.levelUp; run.levelUp = null; window.__lastLevelUp = lu; levelUpOverlay(lu); }
    if (o.passed) sfx(Score.gameStatus(profile(), MISSIONS).won ? 'victory' : (o.firstPass ? 'unlock' : 'complete'));
    document.getElementById('res-map').focus();
  }

  /** Latar partikel bertema di belakang adegan (stage punya tema sendiri). */
  function ambient(theme) {
    var host = $app.firstElementChild; if (!host || !window.GQFX) return;
    var c = h('canvas', { class: 'fx-canvas', 'aria-hidden': 'true' });
    host.classList.add('fx-host'); host.insertBefore(c, host.firstChild);
    var fx = window.GQFX.ambient(c, theme, { reduce: function () { return !!save.settings.reduceMotion; } });
    cleanups.push(fx.destroy);
  }

  /** Sinematik dramatis saat memasuki stage: pusaran portal, kilat, judul, dan adegan VS. */
  function cinematic(i, after) {
    if (window.GQ_FAST) { after(); return; }
    var m = MISSIONS[i], boss = !!m.final, reduce = !!save.settings.reduceMotion;
    var root = document.getElementById('cine-root');
    var pc = window.GQWorld.charCanvas('player', 5); pc.draw('walk1', 1);
    var skip = h('button', { type: 'button', class: 'btn btn-secondary cine-skip', text: 'Lewati ▸' });
    var ov = h('div', { class: 'cine t-' + m.id + (boss ? ' boss' : ''), role: 'dialog', 'aria-label': 'Memasuki ' + m.title },
      h('div', { class: 'cine-vortex' }), h('div', { class: 'cine-flash' }), h('div', { class: 'cine-bar top' }), h('div', { class: 'cine-bar bottom' }),
      boss ? h('div', { class: 'cine-warn', text: '⚠ PERINGATAN ⚠' }) : null,
      h('div', { class: 'cine-title' }, h('span', { class: 'cine-no', text: boss ? 'FINAL BOSS' : 'LEVEL ' + m.no }), h('h2', { text: m.title }), h('p', { class: 'cine-game', text: m.game })),
      h('div', { class: 'cine-vs' }, h('div', { class: 'cine-p' }, pc.el), h('span', { class: 'cine-vsx', text: 'VS' }),
        h('div', { class: 'cine-e' }, h('img', { src: 'assets/images/characters/enemy-' + m.enemy.img + '.svg', alt: '' }), h('p', { class: 'cine-ename', text: m.enemy.name }))),
      skip);
    root.textContent = ''; root.appendChild(ov);
    var done = false, timers = [];
    function finish() {
      if (done) return; done = true; timers.forEach(clearTimeout); document.removeEventListener('keydown', onK);
      ov.classList.add('out'); setTimeout(function () { root.textContent = ''; after(); }, 260);
    }
    function onK(e) { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); finish(); } }
    skip.addEventListener('click', function (e) { e.stopPropagation(); finish(); }); ov.addEventListener('click', finish); document.addEventListener('keydown', onK);
    duckMusic(); sfx(boss ? 'boss' : 'portal');
    if (!reduce) timers.push(setTimeout(function () { sfx('fight'); }, boss ? 2400 : 1750));
    timers.push(setTimeout(finish, reduce ? 900 : (boss ? 4300 : 3300)));
    skip.focus();
  }

  /** Perayaan naik level: karakter "berevolusi" dengan efek tingkat baru. */
  function levelUpOverlay(lu) {
    if (window.GQ_FAST) return;
    var GC = window.GQChars, root = document.getElementById('cine-root'), reduce = !!save.settings.reduceMotion;
    var spec = charOf(profile()), cv = window.GQWorld.charCanvas('player', 7); cv.draw('idle', 1);
    var ok = h('button', { type: 'button', class: 'btn btn-primary', id: 'lvup-ok', text: 'Lanjut' });
    var ov = h('div', { class: 'lvup', role: 'dialog', 'aria-label': 'Naik level' }, h('div', { class: 'lvup-rays' }),
      h('div', { class: 'lvup-box' },
        h('p', { class: 'lvup-title', text: 'LEVEL UP!' }),
        h('div', { class: 'lvup-char' }, cv.el),
        h('p', { class: 'lvup-lv', text: 'Level ' + lu.from + ' → ' + lu.to }),
        h('p', { class: 'lvup-rank', text: lu.title }),
        h('p', { class: 'lvup-fx', text: lu.tier > 0 ? 'Efek baru: ' + GC.TIER_FX[lu.tier] : '' }),
        ok));
    if (!reduce) for (var i = 0; i < 28; i++) {
      var sp = h('i', { class: 'lvup-spark' });
      sp.style.cssText = '--a:' + (i * (360 / 28)) + 'deg;--d:' + (140 + Math.random() * 200) + 'px;--c:' + ['#ffd34d', '#60a5fa', '#f9fafb', '#f472b6'][i % 4] + ';animation-delay:' + (Math.random() * .5 + .7) + 's';
      ov.appendChild(sp);
    }
    GC.setPlayer(spec, Math.max(0, lu.tier - 1));          // tampil dulu dengan efek lama...
    var evolve = setTimeout(function () { GC.setPlayer(spec, lu.tier); ov.classList.add('evolved'); }, reduce ? 200 : 1000);   // ...lalu berevolusi
    root.textContent = ''; root.appendChild(ov); duckMusic(); sfx('levelup');
    function close() { clearTimeout(evolve); document.removeEventListener('keydown', onK); GC.setPlayer(spec, lu.tier); cv.destroy(); root.textContent = ''; setTrack(wantTrack); }
    function onK(e) { if (e.key === 'Escape' || e.key === 'Enter') { e.preventDefault(); close(); } }
    ok.addEventListener('click', close); document.addEventListener('keydown', onK); ok.focus();
  }

  /** Transisi singkat "FIGHT!" saat tantangan dimulai. */
  function fightIntro(m, after) {
    if (window.GQ_FAST) { after(); return; }
    var root = document.getElementById('cine-root');
    var ov = h('div', { class: 'fight t-' + m.id, role: 'status', 'aria-live': 'assertive' }, h('b', { text: 'FIGHT!' }), h('p', { text: 'vs ' + m.enemy.name }));
    root.textContent = ''; root.appendChild(ov); sfx('fight');
    setTimeout(function () { root.textContent = ''; after(); }, save.settings.reduceMotion ? 450 : 1000);
  }

  /* ---------- boot ---------- */
  applySettings();
  if (!Store.isAvailable()) toast('localStorage tidak tersedia: progres tidak akan tersimpan setelah halaman ditutup.', true);
  go('splash');
  document.addEventListener('click', function once() { document.removeEventListener('click', once); if (save.settings.sound) syncMusic(); });
  if (Store.loadIssue) toast(Store.loadIssue, true);
})();

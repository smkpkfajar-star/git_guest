/* chars.js — karakter bergaya anime (chibi) yang dirakit dari bagian-bagian piksel.
   16×22 piksel + garis tepi otomatis. 10 karakter pilihan + NPC, semua dapat diwarnai ulang.
   Efek visual (aura, cincin, jubah, orb, petir, mahkota) bertambah seiring level pemain.
   Pakaian sengaja sopan: lengan dan celana/rok panjang, ada pilihan berhijab. */
(function () {
  'use strict';
  var GW = 16, GH = 22, OUTLINE = '#17142b';

  /* ---------- util warna ---------- */
  function hex2rgb(h) { return [1, 3, 5].map(function (i) { return parseInt(h.slice(i, i + 2), 16); }); }
  function rgb2hex(c) { return '#' + c.map(function (v) { return Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'); }).join(''); }
  function shade(h, f) { return rgb2hex(hex2rgb(h).map(function (v) { return v * f; })); }
  function light(h, f) { return rgb2hex(hex2rgb(h).map(function (v) { return v + (255 - v) * f; })); }
  function mix(a, b, t) { var x = hex2rgb(a), y = hex2rgb(b); return rgb2hex(x.map(function (v, i) { return v + (y[i] - v) * t; })); }
  function rgba(h, a) { var c = hex2rgb(h); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }

  /* ---------- grid ---------- */
  function blank() { var g = []; for (var y = 0; y < GH; y++) { var r = []; for (var x = 0; x < GW; x++) r.push('.'); g.push(r); } return g; }
  function put(g, rows) {   // rows: { barisIndeks: 'string 16 karakter' }
    Object.keys(rows).forEach(function (r) {
      var s = rows[r]; if (s.length !== GW) throw new Error('baris ' + r + ' panjang ' + s.length + ': ' + s);
      for (var c = 0; c < GW; c++) if (s[c] !== '.') g[+r][c] = s[c];
    });
  }
  function span(g, r, c0, c1, ch) { if (r < 0 || r >= GH) return; for (var c = c0; c <= c1; c++) if (c >= 0 && c < GW) g[r][c] = ch; }

  /* ---------- wajah (mata besar ala anime) ---------- */
  var FACE = {
    4: '....ssssssss....', 5: '...ssssssssss...', 6: '..ssssssssssss..',
    7: '..sseeesseeess..', 8: '..sswiissiiwss..', 9: '..ssIiissiiIss..',
    10: '...sbssssssbs...', 11: '....sssmmsss....', 12: '.....ssssss.....', 13: '.......ss.......'
  };
  var FACE_BLINK = { 7: '..ssssssssssss..', 8: '..sseeesseeess..', 9: '..ssssssssssss..' };
  var FACE_TALK = { 11: '....ssmmmmss....', 12: '.....ssmmss.....' };

  /* ---------- pakaian (tertutup, sopan) ---------- */
  var TORSO = {
    hoodie:   { 14: '....oooooooo....', 15: '...ooooaaoooo...', 16: '...ooooaaoooo...', 17: '...oOooooooOo...', 18: '...soooooooos...' },
    uniform:  { 14: '....oouuuuoo....', 15: '...oouuaauuoo...', 16: '...ooouaauooo...', 17: '...oOooooooOo...', 18: '...soooooooos...' },
    jacket:   { 14: '....ooouuooo....', 15: '...oooouuoooo...', 16: '...ooouuuuooo...', 17: '...oOouuuuoOo...', 18: '...soooaaooos...' },
    robe:     { 14: '....oaooooao....', 15: '...ooaooooaoo...', 16: '...oooooooooo...', 17: '...oOooaaooOo...', 18: '...soooooooos...' },
    gi:       { 14: '....oooAAAoo....', 15: '...ooooAAoooo...', 16: '...oooooAooooo..'.slice(0, 16), 17: '...oooooooooo...', 18: '...saaaaaaaas...' }
  };
  function lower(kind, frame) {
    var w1 = frame === 'walk1', w2 = frame === 'walk2';
    if (kind === 'skirt') return {
      19: '...pppppppppp...', 20: '..pppppppppppp..',
      21: w1 ? '...kkk....kkk...' : (w2 ? '.....kkkkkk.....' : '....kkk..kkk....')
    };
    if (kind === 'robe') return {
      19: '...oooooooooo...', 20: '..oooooooooooo..',
      21: w1 ? '..aakk....kkaa..' : (w2 ? '..aaaakkkkaaaa..' : '..aaakk..kkaaa..')
    };
    return {   // celana panjang
      19: '....pppppppp....',
      20: w1 ? '...ppp....ppp...' : (w2 ? '.....pppppp.....' : '....ppp..ppp....'),
      21: w1 ? '...kkk....kkk...' : (w2 ? '.....kkkkkk.....' : '....kkk..kkk....')
    };
  }

  /* ---------- gaya rambut ---------- */
  var HAIR = {
    spiky: { top: [[1, 6, 9], [2, 4, 11], [3, 3, 12], [4, 3, 12]], extras: [[0, 5], [0, 8], [1, 4], [1, 11], [2, 3], [2, 12]], bangs: [2, 1, 2, 1, 1, 1, 1, 2, 1, 2], sides: [[5, 8, 2, 2], [5, 8, 13, 13]] },
    short: { top: [[2, 5, 10], [3, 4, 11], [4, 3, 12]], bangs: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], sides: [[5, 7, 2, 2], [5, 7, 13, 13]] },
    long:  { top: [[2, 5, 10], [3, 4, 11], [4, 3, 12]], bangs: [2, 2, 1, 1, 0, 0, 1, 1, 2, 2], sides: [[5, 16, 1, 2], [5, 16, 13, 14]], back: [[5, 17, 1, 14]] },
    twin:  { top: [[2, 5, 10], [3, 4, 11], [4, 3, 12]], bangs: [1, 2, 1, 1, 1, 1, 1, 1, 2, 1], sides: [[5, 9, 2, 2], [5, 9, 13, 13]],
             back: [[6, 8, 0, 2], [9, 13, 0, 1], [14, 15, 0, 0], [6, 8, 13, 15], [9, 13, 14, 15], [14, 15, 15, 15]], acc: [[7, 1, 'a'], [7, 14, 'a']] },
    bob:   { top: [[2, 5, 10], [3, 4, 11], [4, 3, 12]], bangs: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2], sides: [[5, 11, 1, 2], [5, 11, 13, 14]], back: [[5, 12, 1, 14]] },
    ponytail: { top: [[2, 5, 10], [3, 4, 11], [4, 3, 12]], bangs: [1, 2, 1, 2, 1, 1, 2, 1, 2, 1], sides: [[5, 7, 2, 2], [5, 7, 13, 13]],
             back: [[3, 5, 13, 15], [6, 9, 14, 15], [10, 13, 14, 15]], acc: [[4, 13, 'a']] },
    swept: { top: [[2, 5, 11], [3, 4, 12], [4, 3, 12]], extras: [[1, 7], [1, 8], [1, 9]], bangs: [2, 2, 2, 2, 1, 1, 0, 0, 0, 0], sides: [[5, 8, 2, 2], [5, 7, 13, 13]] },
    bun:   { top: [[2, 5, 10], [3, 4, 11], [4, 3, 12]], extras: [[0, 6], [0, 7], [0, 8], [0, 9], [1, 5], [1, 6], [1, 7], [1, 8], [1, 9], [1, 10]], bangs: [1, 1, 2, 1, 0, 0, 1, 2, 1, 1], sides: [[5, 9, 2, 2], [5, 9, 13, 13]], back: [[5, 12, 2, 13]] },
    hijab: { top: [[2, 5, 10], [3, 3, 12], [4, 2, 13]], bangs: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], sides: [[5, 12, 2, 3], [5, 12, 12, 13]],
             wrap: [[11, 4, 5], [11, 10, 11], [12, 5, 6], [12, 9, 10], [13, 4, 11], [14, 3, 12], [15, 2, 13], [16, 2, 13], [17, 3, 12]] }
  };
  function hairLayers(style) {
    var cfg = HAIR[style] || HAIR.short, F = blank(), B = blank(), i, k;
    cfg.top.forEach(function (t) { span(F, t[0], t[1], t[2], 'h'); });
    (cfg.extras || []).forEach(function (e) { span(F, e[0], e[1], e[1], 'h'); });
    for (i = 0; i < 10; i++) for (k = 0; k < cfg.bangs[i]; k++) span(F, 5 + k, 3 + i, 3 + i, 'h');
    (cfg.sides || []).forEach(function (s) { for (var r = s[0]; r <= s[1]; r++) span(F, r, s[2], s[3], 'h'); });
    (cfg.wrap || []).forEach(function (w) { span(F, w[0], w[1], w[2], 'h'); });
    (cfg.back || []).forEach(function (s) { for (var r = s[0]; r <= s[1]; r++) span(B, r, s[2], s[3], 'h'); });
    // kilau & bayangan rambut
    [[3, 5], [3, 6], [2, 6]].forEach(function (p) { if (F[p[0]][p[1]] === 'h') F[p[0]][p[1]] = 'j'; });
    [[4, 3], [4, 12], [5, 3], [5, 12]].forEach(function (p) { if (F[p[0]][p[1]] === 'h') F[p[0]][p[1]] = 'H'; });
    for (var r2 = 0; r2 < GH; r2++) for (var c2 = 0; c2 < GW; c2++) if (B[r2][c2] === 'h' && (c2 <= 1 || c2 >= 14 || r2 > 12)) B[r2][c2] = 'H';
    (cfg.acc || []).forEach(function (a) { F[a[0]][a[1]] = a[2]; });
    return { front: F, back: B };
  }

  /* ---------- aksesori ---------- */
  var ACC = {
    glasses: { 6: '...gggggggggg...', 7: '...g...gg...g...', 8: '...g........g...', 9: '...g........g...' },
    headband: { 3: '...aaaaaaaaaa...', 4: '..aaaaaaaaaaaa..' },
    headphones: { 0: '...a........a...', 1: '...aa......aa...', 2: '...aaa....aaa...', 3: '..aa........aa..', 4: '..a..........a..', 5: '..a..........a..', 6: '.aa..........aa.', 7: '.aA..........Aa.', 8: '.aA..........Aa.', 9: '.aa..........aa.' },
    cap: { 1: '.....aaaaaa.....', 2: '....aaaaaaaa....', 3: '...aaaaaaaaaa...', 4: '..aaaaaaaaaaaa..', 5: '..aaaaaaaaaaaaaa' },
    bow: { 2: '..........aa.aa.', 3: '...........aaa..' },
    starclip: { 3: '....y...........', 4: '...yyy..........', 5: '....y...........' }
  };
  var CAPE = [
    { 14: '...AAAAAAAAAA...', 15: '..AAAAAAAAAAAA..', 16: '..AAAAAAAAAAAA..', 17: '.AAAAAAAAAAAAAA.', 18: '.AAAAAAAAAAAAAA.', 19: '.AAAAAAAAAAAAAA.', 20: '..AAAAAAAAAAAA..' },
    { 14: '...AAAAAAAAAA...', 15: '..AAAAAAAAAAAA..', 16: '..AAAAAAAAAAAA..', 17: '.AAAAAAAAAAAAAA.', 18: 'AAAAAAAAAAAAAA..', 19: 'AAAAAAAAAAAAAA..', 20: '.AAAAAAAAAAAA...' }
  ];
  var CROWN = { 0: '................', 1: '....y..yy..y....', 2: '....yyyyyyyy....' };

  /* ---------- 10 karakter pilihan (+ 3 NPC) ---------- */
  var CHARS = [
    { id: 'rafi',  name: 'Rafi',  role: 'Pemberani', hair: 'spiky',    outfit: 'hoodie',  lower: 'pants', acc: null,         c: { hair: '#4a3222', outfit: '#2563EB', accent: '#22d3ee', skin: '#f1c9a5', eyes: '#3b82f6' } },
    { id: 'sari',  name: 'Sari',  role: 'Cerdas',    hair: 'long',     outfit: 'uniform', lower: 'skirt', acc: 'bow',        c: { hair: '#7b3f2a', outfit: '#f472b6', accent: '#ef4444', skin: '#fde0c8', eyes: '#a855f7' } },
    { id: 'dimas', name: 'Dimas', role: 'Teliti',    hair: 'swept',    outfit: 'jacket',  lower: 'pants', acc: 'glasses',    c: { hair: '#1f2937', outfit: '#22C55E', accent: '#f9fafb', skin: '#e0ac82', eyes: '#0ea5e9' } },
    { id: 'nisa',  name: 'Nisa',  role: 'Tenang',    hair: 'hijab',    outfit: 'jacket',  lower: 'skirt', acc: null,         c: { hair: '#14b8a6', outfit: '#fde68a', accent: '#f97316', skin: '#f1c9a5', eyes: '#7c3aed' } },
    { id: 'kenzo', name: 'Kenzo', role: 'Gesit',     hair: 'spiky',    outfit: 'jacket',  lower: 'pants', acc: 'headband',   c: { hair: '#b91c1c', outfit: '#1e293b', accent: '#ef4444', skin: '#e0ac82', eyes: '#f59e0b' } },
    { id: 'mika',  name: 'Mika',  role: 'Ceria',     hair: 'twin',     outfit: 'hoodie',  lower: 'pants', acc: 'headphones', c: { hair: '#f472b6', outfit: '#a855f7', accent: '#fde047', skin: '#fde0c8', eyes: '#ec4899' } },
    { id: 'arga',  name: 'Arga',  role: 'Tangguh',   hair: 'short',    outfit: 'jacket',  lower: 'pants', acc: 'cap',        c: { hair: '#92400e', outfit: '#f97316', accent: '#3b82f6', skin: '#c68642', eyes: '#16a34a' } },
    { id: 'luna',  name: 'Luna',  role: 'Pendiam',   hair: 'bob',      outfit: 'uniform', lower: 'skirt', acc: 'bow',        c: { hair: '#312e81', outfit: '#1e3a8a', accent: '#fca5a5', skin: '#f1c9a5', eyes: '#f59e0b' } },
    { id: 'bima',  name: 'Bima',  role: 'Disiplin',  hair: 'ponytail', outfit: 'gi',      lower: 'pants', acc: null,         c: { hair: '#111827', outfit: '#f4f4f8', accent: '#111827', skin: '#e0ac82', eyes: '#ef4444' } },
    { id: 'zara',  name: 'Zara',  role: 'Penyihir',  hair: 'bun',      outfit: 'robe',    lower: 'robe',  acc: 'starclip',   c: { hair: '#e9d5ff', outfit: '#7c3aed', accent: '#fbbf24', skin: '#fde0c8', eyes: '#22d3ee' } }
  ];
  var NPCS = {
    npc_nara: { id: 'npc_nara', name: 'Nara', hair: 'long', outfit: 'uniform', lower: 'pants', acc: 'glasses', c: { hair: '#7c3aed', outfit: '#4c1d95', accent: '#fbbf24', skin: '#fde0c8', eyes: '#a855f7' } },
    npc_dev1: { id: 'npc_dev1', name: 'Dev Senior', hair: 'swept', outfit: 'jacket', lower: 'pants', acc: null, c: { hair: '#111827', outfit: '#EAB308', accent: '#f9fafb', skin: '#c68642', eyes: '#1e293b' } },
    npc_dev2: { id: 'npc_dev2', name: 'Dev Magang', hair: 'bun', outfit: 'hoodie', lower: 'skirt', acc: 'bow', c: { hair: '#f5f5f5', outfit: '#22C55E', accent: '#f472b6', skin: '#f1c9a5', eyes: '#22c55e' } },
    /* guru (baik) */
    npc_prof: { id: 'npc_prof', name: 'Prof. Versi', hair: 'short', outfit: 'robe', lower: 'robe', acc: 'glasses', c: { hair: '#e5e7eb', outfit: '#1d4ed8', accent: '#fde047', skin: '#e0ac82', eyes: '#1e293b' } },
    npc_sage: { id: 'npc_sage', name: 'Kak Sage', hair: 'bob', outfit: 'uniform', lower: 'skirt', acc: 'bow', c: { hair: '#0f766e', outfit: '#0e7490', accent: '#fde047', skin: '#f1c9a5', eyes: '#14b8a6' } },
    npc_guard: { id: 'npc_guard', name: 'Penjaga', hair: 'short', outfit: 'jacket', lower: 'pants', acc: 'cap', c: { hair: '#111827', outfit: '#0ea5e9', accent: '#f9fafb', skin: '#c68642', eyes: '#1e293b' } },
    npc_arch: { id: 'npc_arch', name: 'Pustakawan', hair: 'long', outfit: 'robe', lower: 'robe', acc: 'glasses', c: { hair: '#9ca3af', outfit: '#7c2d12', accent: '#fbbf24', skin: '#f1c9a5', eyes: '#7c3aed' } },
    npc_vault: { id: 'npc_vault', name: 'Penjaga Brankas', hair: 'ponytail', outfit: 'gi', lower: 'pants', acc: 'headband', c: { hair: '#7c2d12', outfit: '#fbbf24', accent: '#7c2d12', skin: '#e0ac82', eyes: '#f59e0b' } },
    npc_mentor: { id: 'npc_mentor', name: 'Master', hair: 'swept', outfit: 'robe', lower: 'robe', acc: null, c: { hair: '#f9fafb', outfit: '#7c3aed', accent: '#fbbf24', skin: '#e0ac82', eyes: '#22d3ee' } },
    /* penjahat (evil): warna gelap, mata merah */
    npc_copy: { id: 'npc_copy', name: 'Si Copy-Paste', hair: 'spiky', outfit: 'hoodie', lower: 'pants', acc: null, c: { hair: '#ef4444', outfit: '#7f1d1d', accent: '#f97316', skin: '#e0ac82', eyes: '#ef4444' } },
    npc_leak: { id: 'npc_leak', name: 'Pencuri Rahasia', hair: 'swept', outfit: 'hoodie', lower: 'pants', acc: 'cap', c: { hair: '#0f172a', outfit: '#111827', accent: '#ef4444', skin: '#8d5524', eyes: '#ef4444' } },
    npc_rogue: { id: 'npc_rogue', name: 'Rogue', hair: 'spiky', outfit: 'jacket', lower: 'pants', acc: 'headband', c: { hair: '#581c87', outfit: '#3b0764', accent: '#ef4444', skin: '#f1c9a5', eyes: '#ef4444' } },
    npc_siswa1: { id: 'npc_siswa1', name: 'Siswa', hair: 'twin', outfit: 'uniform', lower: 'skirt', acc: 'bow', c: { hair: '#fb7185', outfit: '#1e3a8a', accent: '#fde047', skin: '#f1c9a5', eyes: '#ec4899' } },
    npc_siswa2: { id: 'npc_siswa2', name: 'Siswi', hair: 'hijab', outfit: 'uniform', lower: 'skirt', acc: null, c: { hair: '#be185d', outfit: '#f4f4f8', accent: '#fbbf24', skin: '#f1c9a5', eyes: '#7c3aed' } },
    npc_siswa3: { id: 'npc_siswa3', name: 'Siswa', hair: 'short', outfit: 'uniform', lower: 'pants', acc: null, c: { hair: '#111827', outfit: '#f4f4f8', accent: '#1e3a8a', skin: '#c68642', eyes: '#1e293b' } },
    npc_pelari: { id: 'npc_pelari', name: 'Pelari', hair: 'ponytail', outfit: 'jacket', lower: 'pants', acc: 'headband', c: { hair: '#92400e', outfit: '#f97316', accent: '#fde047', skin: '#e0ac82', eyes: '#16a34a' } },
    npc_ibu: { id: 'npc_ibu', name: 'Guru', hair: 'bun', outfit: 'jacket', lower: 'skirt', acc: 'glasses', c: { hair: '#6b7280', outfit: '#7c3aed', accent: '#f9fafb', skin: '#f1c9a5', eyes: '#7c3aed' } },
    npc_boss: { id: 'npc_boss', name: 'Lord Merge Conflict', hair: 'long', outfit: 'robe', lower: 'robe', acc: 'starclip', c: { hair: '#7f1d1d', outfit: '#1f2937', accent: '#ef4444', skin: '#e9d5ff', eyes: '#ef4444' } }
  };
  var BY_ID = {}; CHARS.forEach(function (c) { BY_ID[c.id] = c; }); Object.keys(NPCS).forEach(function (k) { BY_ID[k] = NPCS[k]; });

  var PALETTE = {
    hair: ['#1f2937', '#4a3222', '#92400e', '#b91c1c', '#f472b6', '#7c3aed', '#312e81', '#14b8a6', '#e9d5ff', '#eab308'],
    outfit: ['#2563EB', '#22C55E', '#ef4444', '#f97316', '#a855f7', '#f472b6', '#14b8a6', '#1e293b', '#f4f4f8', '#eab308'],
    accent: ['#22d3ee', '#fde047', '#ef4444', '#f9fafb', '#f97316', '#a3e635', '#c084fc', '#1f2937', '#fb7185', '#fbbf24'],
    skin: ['#fde0c8', '#f1c9a5', '#e0ac82', '#c68642', '#8d5524', '#5c3a21'],
    eyes: ['#3b82f6', '#0ea5e9', '#22c55e', '#a855f7', '#ec4899', '#f59e0b', '#ef4444', '#22d3ee']
  };
  function defaults(id) { var d = BY_ID[id] || CHARS[0]; return { id: d.id, hair: d.c.hair, outfit: d.c.outfit, accent: d.c.accent, skin: d.c.skin, eyes: d.c.eyes }; }
  function def(id) { return BY_ID[id] || CHARS[0]; }

  /* ---------- perakitan sprite ---------- */
  function palette(spec) {
    return {
      s: spec.skin, S: shade(spec.skin, .88), b: mix(spec.skin, '#ff8fa3', .45), e: '#1d1a2e', i: spec.eyes, I: shade(spec.eyes, .6), w: '#ffffff', m: '#b5495b',
      h: spec.hair, H: shade(spec.hair, .74), j: light(spec.hair, .32),
      o: spec.outfit, O: shade(spec.outfit, .76), a: spec.accent, A: shade(spec.accent, .72), u: '#f4f4f8',
      p: shade(spec.outfit, .5), P: shade(spec.outfit, .38), k: '#2b2740', g: '#5b6478', y: '#ffd34d'
    };
  }
  /** Rakit grid karakter: spec = {id,hair,outfit,accent,skin,eyes}. */
  function compose(spec, frame, tier, flutter) {
    var d = def(spec.id), g = blank(), hl = hairLayers(d.hair);
    if (tier >= 3) put(g, CAPE[flutter ? 1 : 0]);
    for (var r = 0; r < GH; r++) for (var c = 0; c < GW; c++) if (hl.back[r][c] !== '.') g[r][c] = hl.back[r][c];
    put(g, lower(d.lower, frame));
    put(g, TORSO[d.outfit] || TORSO.hoodie);
    put(g, FACE);
    if (frame === 'blink') put(g, FACE_BLINK);
    if (frame === 'talk') put(g, FACE_TALK);
    for (r = 0; r < GH; r++) for (c = 0; c < GW; c++) if (hl.front[r][c] !== '.') g[r][c] = hl.front[r][c];
    if (d.acc && ACC[d.acc]) put(g, ACC[d.acc]);
    if (tier >= 6) put(g, CROWN);
    return g;
  }

  var cache = {};
  /** Canvas sprite (18×24 piksel × scale, termasuk garis tepi). */
  function spriteCanvas(spec, scale, frame, tier, flutter) {
    var key = [spec.id, spec.hair, spec.outfit, spec.accent, spec.skin, spec.eyes, scale, frame, tier >= 3 ? 1 : 0, tier >= 6 ? 1 : 0, tier >= 3 ? (flutter ? 1 : 0) : 0].join('|');
    if (cache[key]) return cache[key];
    var g = compose(spec, frame, tier, flutter), P = palette(spec), W = GW + 2, H = GH + 2;
    var cg = []; for (var y = 0; y < H; y++) { cg.push(new Array(W).fill(null)); }
    for (y = 0; y < GH; y++) for (var x = 0; x < GW; x++) if (g[y][x] !== '.') cg[y + 1][x + 1] = P[g[y][x]] || '#ff00ff';
    var out = [];
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) if (!cg[y][x]) {
      if ((y > 0 && cg[y - 1][x]) || (y < H - 1 && cg[y + 1][x]) || (x > 0 && cg[y][x - 1]) || (x < W - 1 && cg[y][x + 1])) out.push([x, y]);
    }
    var cv = document.createElement('canvas'); cv.width = W * scale; cv.height = H * scale;
    var ctx = cv.getContext('2d');
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) if (cg[y][x]) { ctx.fillStyle = cg[y][x]; ctx.fillRect(x * scale, y * scale, scale, scale); }
    ctx.fillStyle = OUTLINE; out.forEach(function (p) { ctx.fillRect(p[0] * scale, p[1] * scale, scale, scale); });
    return (cache[key] = cv);
  }

  /* ---------- efek naik level ---------- */
  var TIER_TITLES = ['Junior Developer', 'Git Apprentice', 'Commit Knight', 'Branch Ranger', 'Merge Mage', 'Repo Sage', 'Git Grandmaster'];
  var TIER_FX = ['', 'Aura bercahaya', 'Cincin energi di kaki', 'Jubah pelindung', 'Orb energi mengorbit', 'Petir energi', 'Mahkota emas & jejak cahaya'];
  function fxBack(ctx, cx, fy, h, tier, t, col) {
    if (tier < 1) return;
    var cy = fy - h * .5, r = h * (.62 + .04 * Math.sin(t / 420));
    var g = ctx.createRadialGradient(cx, cy, r * .15, cx, cy, r * 1.25);
    g.addColorStop(0, rgba(col, tier >= 5 ? .34 : .22)); g.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = g; ctx.fillRect(cx - r * 1.3, cy - r * 1.3, r * 2.6, r * 2.6);
    if (tier >= 2) {
      ctx.strokeStyle = rgba(light(col, .3), .6); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(cx, fy - 2, h * .34 + Math.sin(t / 300) * 2, h * .085, 0, 0, Math.PI * 2); ctx.stroke();
      if (tier >= 5) { ctx.strokeStyle = rgba('#ffd34d', .5); ctx.beginPath(); ctx.ellipse(cx, fy - 2, h * .46 - Math.sin(t / 300) * 2, h * .12, 0, 0, Math.PI * 2); ctx.stroke(); }
    }
  }
  function fxFront(ctx, cx, fy, h, tier, t, col) {
    if (tier < 1) return;
    var n = 3 + tier, k, a, x, y;
    for (k = 0; k < n; k++) {
      a = t / 520 + k * Math.PI * 2 / n; x = cx + Math.cos(a) * h * .4; y = fy - h * .5 + Math.sin(a * 1.4) * h * .4;
      ctx.fillStyle = rgba(light(col, .55), .85); ctx.fillRect(Math.round(x), Math.round(y), 3, 3);
    }
    if (tier >= 4) {
      for (k = 0; k < 3; k++) {
        a = -t / 700 + k * Math.PI * 2 / 3; x = cx + Math.cos(a) * h * .52; y = fy - h * .5 + Math.sin(a) * h * .2 - h * .05;
        ctx.fillStyle = rgba(col, .95); ctx.fillRect(Math.round(x) - 3, Math.round(y) - 3, 7, 7); ctx.fillStyle = '#fff'; ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3);
      }
    }
    if (tier >= 5 && (t % 1500) < 150) {
      var seed = Math.floor(t / 1500), sx = cx + (seed % 2 ? 1 : -1) * h * .3, py = fy - h * .95;
      ctx.strokeStyle = rgba('#ffffff', .9); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sx, py);
      for (k = 1; k <= 5; k++) ctx.lineTo(sx + ((k * 7 + seed * 3) % 11 - 5) * 1.6, py + k * h * .17);
      ctx.stroke();
    }
    if (tier >= 6) {
      for (k = 0; k < 7; k++) {
        x = cx + Math.sin(k * 7.3 + t / 700) * h * .32; y = fy - ((t / 9 + k * 37) % (h * 1.1));
        ctx.fillStyle = rgba('#ffd34d', .75 * (1 - (fy - y) / (h * 1.1))); ctx.fillRect(Math.round(x), Math.round(y), 3, 3);
      }
    }
  }

  /** Gambar karakter di ctx; (x,y) = pojok kiri-atas sprite. Berkedip otomatis saat diam. */
  function draw(ctx, spec, x, y, scale, frame, flip, t, tier) {
    tier = tier || 0; t = t || 0;
    if (frame === 'idle' && t % 3400 < 150) frame = 'blink';
    var s = spriteCanvas(spec, scale, frame || 'idle', tier, Math.floor(t / 260) % 2 === 1);
    if (flip < 0) { ctx.save(); ctx.translate(Math.round(x + s.width), Math.round(y)); ctx.scale(-1, 1); ctx.drawImage(s, 0, 0); ctx.restore(); }
    else ctx.drawImage(s, Math.round(x), Math.round(y));
    return s;
  }

  /**
   * Canvas karakter beranimasi. getSpec()/getTier() dibaca tiap gambar (preview langsung berubah).
   * opts: { animate:false untuk thumbnail, calm():bool untuk mengurangi animasi }
   */
  function canvas(getSpec, scale, getTier, opts) {
    opts = opts || {};
    var pad = scale * 9, W = (GW + 2) * scale, H = (GH + 2) * scale;
    var el = document.createElement('canvas'); el.width = W + pad * 2; el.height = H + pad * 2;
    el.className = 'char-canvas'; el.setAttribute('aria-hidden', 'true'); el.style.margin = '-' + pad + 'px';
    var ctx = el.getContext('2d'); ctx.imageSmoothingEnabled = false;
    var api = { el: el, frame: 'idle', flip: 1 }, timer = null;
    function render() {
      var spec = getSpec(), tier = getTier ? getTier() : 0, t = (opts.calm && opts.calm()) ? 0 : performance.now();
      ctx.clearRect(0, 0, el.width, el.height);
      var cx = el.width / 2, fy = pad + H - scale * 2;
      fxBack(ctx, cx, fy, H, tier, t, spec.accent);
      draw(ctx, spec, pad, pad, scale, api.frame, api.flip, t, tier);
      fxFront(ctx, cx, fy, H, tier, t, spec.accent);
    }
    api.draw = function (frame, flip) { api.frame = frame || 'idle'; api.flip = flip || 1; render(); };
    api.render = render;
    api.destroy = function () { clearInterval(timer); timer = null; };
    render();
    if (opts.animate !== false) timer = setInterval(function () { if (!el.isConnected) { clearInterval(timer); timer = null; return; } render(); }, 90);
    return api;
  }

  /* ---------- state pemain ---------- */
  var player = defaults('rafi'), playerTier = 0;
  window.GQChars = {
    LIST: CHARS, PALETTE: PALETTE, TIER_TITLES: TIER_TITLES, TIER_FX: TIER_FX, BY_ID: BY_ID,
    defaults: defaults, def: def, compose: compose, spriteCanvas: spriteCanvas, draw: draw, canvas: canvas, fxBack: fxBack, fxFront: fxFront,
    GW: GW, GH: GH, shade: shade, light: light, mix: mix,
    setPlayer: function (spec, tier) { player = spec || defaults('rafi'); playerTier = tier || 0; },
    getPlayer: function () { return player; }, getTier: function () { return playerTier; },
    npc: function (key) { return NPCS['npc_' + key] ? defaults('npc_' + key) : null; }
  };
})();

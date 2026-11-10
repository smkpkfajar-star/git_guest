/* world.js — dunia (overworld) GIT QUEST: banyak peta + sprite karakter beranimasi.
   Plaza (hub) + satu peta per stage, kamera mengikuti pemain, minimap, transisi antar-peta,
   NPC baik/jahat, tabrakan, klik-untuk-berjalan. Data peta ada di data/areas.js.
   Hanya menggambar & menggerakkan; semua aturan skor tetap di scoring.js. */
(function () {
  'use strict';

  var T = 32, VW = 24, VH = 13;          // ukuran ubin & jendela pandang (ubin)
  var AREAS = window.GQ_AREAS || {};

  /* ---------- sprite: karakter anime (chars.js) + maskot piksel ---------- */
  var ARTS = {
    bugbyte: ['...y....', '...g....', '.mmmmmm.', 'meemmeem', 'mmpmmpmm', 'mmmmmmmm', '.MMMMMM.', 'g.MMMM.g', '..M..M..'],
    glitch: ['.r..c..r', 'rrrrrrrr', 'rreerree', 'crpprppr', 'rrrrrrrc', 'rRrrmrRr', '.rrrrrr.', 'r.r..r.m'],
    virus: ['.p.pp.p.', 'pppppppp', 'pEkppEkp', 'pppppppp', 'pPpmmpPp', '.pppppp.', 'p.p..p.p']
  };
  var PALS = {
    bugbyte: { m: '#22C55E', M: '#15803d', e: '#f9fafb', p: '#111827', y: '#EAB308', g: '#9CA3AF' },
    glitch: { r: '#EF4444', R: '#991b1b', e: '#f9fafb', p: '#111827', c: '#22d3ee', m: '#A855F7' },
    virus: { p: '#A855F7', P: '#6b21a8', E: '#f9fafb', k: '#111827', m: '#EF4444' }
  };
  function isChar(key) { return key === 'player' || !!window.GQChars.npc(key); }
  function specOf(key) { return key === 'player' ? window.GQChars.getPlayer() : window.GQChars.npc(key); }
  function tierOf(key) { return key === 'player' ? window.GQChars.getTier() : 0; }

  /** Ubah baris kaki maskot agar tampak melangkah (walk1 = terbuka, walk2 = rapat). */
  function artFrame(key, frame) {
    var art = ARTS[key].slice();
    if (frame !== 'walk1' && frame !== 'walk2') return art;
    var r = art.length - 1, cells = [];
    for (var i = 0; i < 8; i++) if (art[r][i] !== '.') cells.push({ i: i, c: art[r][i] });
    var row = ['.', '.', '.', '.', '.', '.', '.', '.'];
    cells.forEach(function (c) {
      var ni = c.i < 4 ? (frame === 'walk1' ? c.i - 1 : c.i + 1) : (frame === 'walk1' ? c.i + 1 : c.i - 1);
      row[Math.max(0, Math.min(7, ni))] = c.c;
    });
    art[r] = row.join('');
    return art;
  }
  var spriteCache = {};
  function sprite(key, scale, frame) {
    var ck = key + '|' + scale + '|' + (frame || 'idle');
    if (spriteCache[ck]) return spriteCache[ck];
    var art = artFrame(key, frame), pal = PALS[key];
    var c = document.createElement('canvas');
    c.width = 8 * scale; c.height = art.length * scale;
    var g = c.getContext('2d');
    art.forEach(function (row, y) { for (var x = 0; x < row.length; x++) { var ch = row[x]; if (ch !== '.') { g.fillStyle = pal[ch]; g.fillRect(x * scale, y * scale, scale, scale); } } });
    return (spriteCache[ck] = c);
  }
  function drawMascot(ctx, key, x, y, scale, frame, flip) {
    var s = sprite(key, scale, frame);
    if (flip < 0) { ctx.save(); ctx.translate(Math.round(x + s.width), Math.round(y)); ctx.scale(-1, 1); ctx.drawImage(s, 0, 0); ctx.restore(); }
    else ctx.drawImage(s, Math.round(x), Math.round(y));
  }
  /** Gambar karakter apa pun (anime atau maskot) di ctx; (x,y) pojok kiri atas. */
  function drawChar(ctx, key, x, y, scale, frame, flip, t) {
    if (isChar(key)) window.GQChars.draw(ctx, specOf(key), x, y, scale, frame, flip, t || 0, tierOf(key));
    else drawMascot(ctx, key, x, y, scale, frame, flip);
  }
  /** Elemen <canvas> karakter beranimasi (arena, intro, profil, sinematik). */
  function charCanvas(key, scale) {
    if (isChar(key)) return window.GQChars.canvas(function () { return specOf(key); }, scale, function () { return tierOf(key); }, { calm: function () { return document.body.classList.contains('reduce-motion'); } });
    var s0 = sprite(key, scale, 'idle'), c = document.createElement('canvas');
    c.width = s0.width; c.height = s0.height; c.className = 'char-canvas'; c.setAttribute('aria-hidden', 'true');
    var g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    var api = { el: c, draw: function (frame, flip) { g.clearRect(0, 0, c.width, c.height); drawMascot(g, key, 0, 0, scale, frame || 'idle', flip || 1); } };
    api.draw('idle', 1);
    return api;
  }

  /* ---------- peta: kompilasi data area menjadi grid ---------- */
  function key(x, y) { return x + ',' + y; }
  function rnd(seed) { return function () { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }
  var D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  var cache = {};
  function compile(id) {
    if (cache[id]) return cache[id];
    var A = AREAS[id], r = rnd(A.seed || 1), th = A.theme;
    var c = { id: id, A: A, W: A.w, H: A.h, th: th, decor: [], blocked: {}, path: {} };
    function wall(x, y) { return x <= 0 || y <= 0 || x >= c.W - 1 || y >= c.H - 1; }
    c.wall = wall;
    var pois = A.portals.concat(A.npcs), sp = A.spawn, mask = {};
    function carve(x0, y0, x1, y1) {
      var x = x0, y = y0;
      while (x !== x1) { c.path[key(x, y)] = 1; x += x < x1 ? 1 : -1; }
      while (y !== y1) { c.path[key(x, y)] = 1; y += y < y1 ? 1 : -1; }
      c.path[key(x1, y1)] = 1;
    }
    pois.forEach(function (p) { if (!p.wander) carve(sp.x, sp.y, p.x, p.y); });
    Object.keys(c.path).forEach(function (k) { var a = k.split(','), px = +a[0], py = +a[1]; for (var dx = -1; dx <= 1; dx++) for (var dy = -1; dy <= 1; dy++) mask[key(px + dx, py + dy)] = 1; });
    pois.forEach(function (p) { for (var dx = -1; dx <= 1; dx++) for (var dy = -1; dy <= 1; dy++) mask[key(p.x + dx, p.y + dy)] = 1; });
    for (var y = 1; y < c.H - 1; y++) for (var x = 1; x < c.W - 1; x++) {
      if (mask[key(x, y)]) continue;
      if (r() < th.dens) { var t = th.decor[Math.floor(r() * th.decor.length)]; c.decor.push({ x: x, y: y, t: t }); c.blocked[key(x, y)] = t; }
    }
    // pastikan semua titik penting terjangkau (hapus dekorasi di sekitarnya bila perlu)
    for (var pass = 0; pass < 4; pass++) {
      var seen = bfsFrom(c, sp.x, sp.y), bad = [];
      A.portals.forEach(function (p) { if (!seen[key(p.x, p.y)]) bad.push(p); });
      A.npcs.forEach(function (n) { if (!D4.some(function (d) { return seen[key(n.x + d[0], n.y + d[1])]; })) bad.push(n); });
      if (!bad.length) break;
      bad.forEach(function (p) {
        c.decor = c.decor.filter(function (d) { var near = Math.abs(d.x - p.x) <= 3 && Math.abs(d.y - p.y) <= 3; if (near) delete c.blocked[key(d.x, d.y)]; return !near; });
      });
    }
    c.base = buildBase(c, r);
    return (cache[id] = c);
  }
  function npcBlockSet(c) { var s = {}; c.A.npcs.forEach(function (n) { s[key(n.x, n.y)] = 1; }); return s; }
  function bfsFrom(c, sx, sy) {
    var nb = npcBlockSet(c), seen = {}, q = [[sx, sy]]; seen[key(sx, sy)] = 1;
    while (q.length) {
      var cur = q.shift();
      for (var i = 0; i < 4; i++) {
        var nx = cur[0] + D4[i][0], ny = cur[1] + D4[i][1], k = key(nx, ny);
        if (seen[k] || c.wall(nx, ny) || c.blocked[k] || nb[k]) continue;
        seen[k] = 1; q.push([nx, ny]);
      }
    }
    return seen;
  }

  /** Pencarian jalur terpendek (BFS) antar-ubin pada area `id` (bawaan: plaza); daftar langkah [dx,dy] atau null. */
  function findPath(sx, sy, tx, ty, id) {
    var c = compile(id || 'plaza');
    if (sx === tx && sy === ty) return [];
    var nb = npcBlockSet(c), prev = {}, q = [[sx, sy]], seen = {}; seen[key(sx, sy)] = 1;
    while (q.length) {
      var cur = q.shift();
      for (var i = 0; i < 4; i++) {
        var nx = cur[0] + D4[i][0], ny = cur[1] + D4[i][1], k = key(nx, ny);
        if (seen[k] || c.wall(nx, ny) || c.blocked[k] || nb[k]) continue;
        seen[k] = 1; prev[k] = [cur[0], cur[1], D4[i][0], D4[i][1]];
        if (nx === tx && ny === ty) {
          var out = [], cc = k;
          while (prev[cc]) { var p = prev[cc]; out.unshift([p[2], p[3]]); cc = key(p[0], p[1]); }
          return out;
        }
        q.push([nx, ny]);
      }
    }
    return null;
  }

  /* ---------- gambar dekorasi ---------- */
  var DECOR = {
    server: function (g, px, py, th, r) {
      g.fillStyle = '#0b1220'; g.fillRect(px + 3, py + 3, 26, 28);
      g.fillStyle = '#4b5563'; g.fillRect(px + 2, py + 1, 26, 28);
      g.fillStyle = '#1f2937'; g.fillRect(px + 4, py + 3, 22, 24);
      for (var i = 0; i < 4; i++) {
        g.fillStyle = '#374151'; g.fillRect(px + 6, py + 5 + i * 6, 18, 4);
        g.fillStyle = r() < .6 ? '#22C55E' : '#EAB308'; g.fillRect(px + 8, py + 6 + i * 6, 2, 2);
        g.fillStyle = '#6b7280'; g.fillRect(px + 14, py + 6 + i * 6, 8, 2);
      }
    },
    term: function (g, px, py) {
      g.fillStyle = '#0b1220'; g.fillRect(px + 3, py + 17, 26, 12);
      g.fillStyle = '#4b5563'; g.fillRect(px + 2, py + 16, 26, 11);
      g.fillStyle = '#374151'; g.fillRect(px + 12, py + 24, 8, 3);
      g.fillStyle = '#374151'; g.fillRect(px + 5, py + 3, 22, 15);
      g.fillStyle = '#052e16'; g.fillRect(px + 7, py + 5, 18, 11);
      g.fillStyle = '#22C55E'; g.fillRect(px + 9, py + 7, 8, 2); g.fillRect(px + 9, py + 11, 12, 2);
    },
    shelf: function (g, px, py, th, r) {
      g.fillStyle = '#0b1220'; g.fillRect(px + 2, py + 3, 28, 28);
      g.fillStyle = '#5b3a1e'; g.fillRect(px + 1, py + 1, 28, 28);
      g.fillStyle = '#3b2412'; g.fillRect(px + 3, py + 3, 24, 24);
      var cols = ['#ef4444', '#3b82f6', '#22C55E', '#EAB308', '#a855f7', '#f97316'];
      for (var row = 0; row < 3; row++) {
        g.fillStyle = '#5b3a1e'; g.fillRect(px + 3, py + 11 + row * 8, 24, 2);
        for (var b = 0; b < 6; b++) { g.fillStyle = cols[Math.floor(r() * cols.length)]; g.fillRect(px + 4 + b * 4, py + 4 + row * 8, 3, 7); }
      }
    },
    crate: function (g, px, py) {
      g.fillStyle = '#0b1220'; g.fillRect(px + 4, py + 6, 26, 24);
      g.fillStyle = '#8a5a2b'; g.fillRect(px + 3, py + 4, 25, 24);
      g.fillStyle = '#a16f3a'; g.fillRect(px + 5, py + 6, 21, 20);
      g.fillStyle = '#6b4220'; g.fillRect(px + 3, py + 14, 25, 3); g.fillRect(px + 14, py + 4, 3, 24);
      g.fillStyle = '#d6b370'; g.fillRect(px + 5, py + 6, 3, 3); g.fillRect(px + 23, py + 6, 3, 3); g.fillRect(px + 5, py + 23, 3, 3); g.fillRect(px + 23, py + 23, 3, 3);
    },
    crystal: function (g, px, py, th) {
      var c = th.glow;
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(px + 7, py + 27, 18, 3);
      g.fillStyle = '#0b1220'; g.fillRect(px + 10, py + 2, 12, 2); g.fillRect(px + 7, py + 5, 18, 2); g.fillRect(px + 7, py + 7, 18, 14);
      g.fillStyle = c; g.fillRect(px + 12, py + 4, 8, 3); g.fillRect(px + 9, py + 7, 14, 6); g.fillRect(px + 11, py + 13, 10, 6); g.fillRect(px + 14, py + 19, 4, 5);
      g.fillStyle = '#ffffff'; g.globalAlpha = .55; g.fillRect(px + 12, py + 8, 3, 6); g.globalAlpha = 1;
    },
    pillar: function (g, px, py, th) {
      g.fillStyle = '#0b1220'; g.fillRect(px + 6, py + 3, 22, 28);
      g.fillStyle = '#6b7280'; g.fillRect(px + 5, py + 2, 22, 5); g.fillRect(px + 5, py + 24, 22, 5);
      g.fillStyle = '#4b5563'; g.fillRect(px + 8, py + 7, 16, 17);
      g.fillStyle = '#9ca3af'; g.fillRect(px + 10, py + 7, 3, 17);
      g.fillStyle = th.glow; g.fillRect(px + 5, py + 2, 22, 2);
    },
    lamp: function (g, px, py, th) {
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(px + 10, py + 28, 12, 3);
      g.fillStyle = '#374151'; g.fillRect(px + 14, py + 10, 4, 19); g.fillRect(px + 11, py + 27, 10, 3);
      g.globalAlpha = .22; g.fillStyle = th.glow; g.fillRect(px + 4, py, 24, 16); g.globalAlpha = 1;
      g.fillStyle = '#0b1220'; g.fillRect(px + 10, py + 3, 12, 9);
      g.fillStyle = th.glow; g.fillRect(px + 11, py + 4, 10, 7);
      g.fillStyle = '#ffffff'; g.fillRect(px + 13, py + 5, 4, 3);
    },
    plant: function (g, px, py) {
      g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(px + 7, py + 28, 18, 3);
      g.fillStyle = '#7c4a21'; g.fillRect(px + 10, py + 21, 12, 9); g.fillStyle = '#9a5d2c'; g.fillRect(px + 10, py + 21, 12, 3);
      g.fillStyle = '#0b1220'; g.fillRect(px + 5, py + 3, 22, 19);
      g.fillStyle = '#15803d'; g.fillRect(px + 6, py + 6, 20, 14); g.fillRect(px + 10, py + 3, 12, 5);
      g.fillStyle = '#22C55E'; g.fillRect(px + 9, py + 8, 6, 5); g.fillRect(px + 17, py + 11, 6, 5);
    },
    vault: function (g, px, py, th) {
      g.fillStyle = '#0b1220'; g.fillRect(px + 3, py + 5, 27, 26);
      g.fillStyle = '#6b7280'; g.fillRect(px + 2, py + 3, 26, 26);
      g.fillStyle = '#374151'; g.fillRect(px + 4, py + 5, 22, 22);
      g.fillStyle = '#111827'; g.fillRect(px + 8, py + 9, 14, 14);
      g.fillStyle = th.glow; g.fillRect(px + 11, py + 12, 8, 8);
      g.fillStyle = '#111827'; g.fillRect(px + 14, py + 15, 2, 2);
      g.fillStyle = '#EAB308'; g.fillRect(px + 22, py + 14, 3, 6);
    }
  };

  /* tekstur lantai tiap wilayah; (px,py) pojok ubin, x/y indeks ubin */
  var FLOORS = {
    plain: function (g, px, py, x, y, th) { g.fillStyle = (x + y) % 2 ? th.a : th.b; g.fillRect(px, py, T, T); g.fillStyle = th.ln; g.fillRect(px, py, T, 1); g.fillRect(px, py, 1, T); },
    paving: function (g, px, py, x, y, th) { g.fillStyle = (x + y) % 2 ? th.a : th.b; g.fillRect(px, py, T, T); g.fillStyle = th.ln; g.fillRect(px, py, T, 1); g.fillRect(px + (y % 2 ? 16 : 0), py, 1, T / 2); g.fillRect(px + (y % 2 ? 0 : 16), py + 16, 1, T / 2); g.fillRect(px, py + 16, T, 1); },
    carpet: function (g, px, py, x, y, th, r) { g.fillStyle = (x % 2) ? th.a : th.b; g.fillRect(px, py, T, T); g.fillStyle = '#2563EB'; g.globalAlpha = .18; g.fillRect(px, py + 14, T, 4); g.globalAlpha = 1; g.fillStyle = th.ln; g.fillRect(px + 2, py + 2, 2, 2); g.fillRect(px + T - 4, py + T - 4, 2, 2); if (r() < .05) { g.fillStyle = '#fde047'; g.fillRect(px + 12, py + 12, 4, 4); } },
    panels: function (g, px, py, x, y, th) { g.fillStyle = ((x >> 1) + (y >> 1)) % 2 ? th.a : th.b; g.fillRect(px, py, T, T); g.fillStyle = th.ln; g.fillRect(px, py, T, 1); g.fillRect(px, py, 1, T); if (x % 2 === 0 && y % 2 === 0) { g.fillRect(px + 2, py + 2, 4, 1); g.fillRect(px + 2, py + 2, 1, 4); } g.fillStyle = 'rgba(255,255,255,.04)'; g.fillRect(px + 1, py + 1, T - 2, 8); },
    circuit: function (g, px, py, x, y, th, r) { g.fillStyle = (x + y) % 2 ? th.a : th.b; g.fillRect(px, py, T, T); g.fillStyle = th.ln; g.fillRect(px, py, T, 1); g.fillRect(px, py, 1, T); var v = r(); g.fillStyle = th.path; g.globalAlpha = .35; if (v < .3) { g.fillRect(px, py + 15, T, 2); g.fillRect(px + 20, py + 15, 2, 10); g.fillRect(px + 17, py + 24, 8, 8); } else if (v < .5) { g.fillRect(px + 15, py, 2, T); g.fillRect(px + 8, py + 8, 7, 2); g.fillRect(px + 5, py + 6, 6, 6); } g.globalAlpha = 1; },
    matrix: function (g, px, py, x, y, th, r) { g.fillStyle = '#04110d'; g.fillRect(px, py, T, T); g.fillStyle = (x + y) % 2 ? th.a : th.b; g.fillRect(px + 1, py + 1, T - 2, T - 2); g.fillStyle = '#22C55E'; for (var i = 0; i < 3; i++) { if (r() < .55) { g.globalAlpha = .2 + r() * .45; g.fillRect(px + 3 + Math.floor(r() * 5) * 5, py + 3 + Math.floor(r() * 5) * 5, 3, 5); } } g.globalAlpha = 1; },
    planks: function (g, px, py, x, y, th, r) { g.fillStyle = y % 2 ? th.a : th.b; g.fillRect(px, py, T, T); g.fillStyle = '#120c04'; g.fillRect(px, py + T - 2, T, 2); g.fillRect(px + ((x * 7 + y * 13) % 3) * 10 + 4, py, 1, T - 2); g.fillStyle = th.ln; g.globalAlpha = .6; g.fillRect(px + 4, py + 8, 18, 1); g.fillRect(px + 8, py + 18, 14, 1); g.globalAlpha = 1; if (r() < .04) { g.fillStyle = '#fbbf24'; g.fillRect(px + 14, py + 14, 3, 3); } },
    hazard: function (g, px, py, x, y, th, r) { g.fillStyle = (x + y) % 2 ? th.a : th.b; g.fillRect(px, py, T, T); g.fillStyle = th.ln; g.fillRect(px, py, T, 1); g.fillRect(px, py, 1, T); for (var i = 0; i < 4; i++) g.fillRect(px + 4 + i * 7, py + 6 + (i % 2) * 10, 5, 2); g.fillStyle = '#6b7280'; g.fillRect(px + 2, py + 2, 2, 2); g.fillRect(px + T - 4, py + T - 4, 2, 2); if (y % 6 === 0) { g.fillStyle = '#EAB308'; g.globalAlpha = .35; g.fillRect(px, py + T - 6, T, 4); g.globalAlpha = 1; g.fillStyle = '#111827'; for (var k = 0; k < 4; k++) g.fillRect(px + k * 8 + 2, py + T - 6, 4, 4); } },
    lava: function (g, px, py, x, y, th, r) { g.fillStyle = (x + y) % 2 ? th.a : th.b; g.fillRect(px, py, T, T); g.fillStyle = th.ln; g.fillRect(px, py, T, 1); g.fillRect(px, py, 1, T); var v = r(); if (v < .22) { g.fillStyle = '#f97316'; g.globalAlpha = .75; g.fillRect(px + 4, py + 12, 10, 2); g.fillRect(px + 12, py + 14, 2, 8); g.fillRect(px + 12, py + 20, 12, 2); g.fillStyle = '#fde047'; g.fillRect(px + 12, py + 20, 5, 2); g.globalAlpha = 1; } }
  };
  function buildBase(c, r) {
    var th = c.th, cv = document.createElement('canvas'); cv.width = c.W * T; cv.height = c.H * T;
    var g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
    for (var y = 0; y < c.H; y++) for (var x = 0; x < c.W; x++) {
      var px = x * T, py = y * T;
      if (c.wall(x, y)) {
        g.fillStyle = th.wall; g.fillRect(px, py, T, T);
        g.fillStyle = th.wallIn; g.fillRect(px + 2, py + 2, T - 4, T - 4);
        g.fillStyle = th.edge; g.fillRect(px, py + T - 3, T, 3);
        if (th.wallStyle === 'brick') { g.fillStyle = th.edge; g.globalAlpha = .35; g.fillRect(px + 2, py + 10, T - 4, 1); g.fillRect(px + 2, py + 20, T - 4, 1); g.fillRect(px + (y % 2 ? 10 : 20), py + 2, 1, 8); g.fillRect(px + (y % 2 ? 22 : 8), py + 11, 1, 9); g.globalAlpha = 1; }
        else if (th.wallStyle === 'lava') { g.fillStyle = '#f97316'; g.globalAlpha = .55; g.fillRect(px + 4, py + T - 8, T - 8, 3); g.globalAlpha = 1; }
        if (r() < .25) { g.fillStyle = r() < .5 ? '#22d3ee' : th.glow; g.fillRect(px + 6 + Math.floor(r() * 16), py + 8 + Math.floor(r() * 10), 3, 3); }
        continue;
      }
      (FLOORS[th.floor] || FLOORS.plain)(g, px, py, x, y, th, r);
      if (r() < .08) { g.fillStyle = th.ln; g.fillRect(px + 6 + Math.floor(r() * 18), py + 6 + Math.floor(r() * 18), 3, 3); }
      if (c.path[key(x, y)]) {
        g.fillStyle = th.wallIn; g.fillRect(px + 1, py + 1, T - 2, T - 2);
        g.fillStyle = th.path; g.globalAlpha = .75;
        g.fillRect(px + 6, py + 15, 6, 2); g.fillRect(px + 20, py + 15, 6, 2);
        g.fillRect(px + 15, py + 6, 2, 6); g.fillRect(px + 15, py + 20, 2, 6);
        g.globalAlpha = 1;
      }
    }
    // alas portal (pelat gelap di bawah gerbang)
    c.A.portals.forEach(function (p) { g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(p.x * T - 2, p.y * T - 2, T + 4, T + 4); });
    c.decor.forEach(function (d) { DECOR[d.t](g, d.x * T, d.y * T, th, r); });
    // minimap statis
    var S = 3, m = document.createElement('canvas'); m.width = c.W * S; m.height = c.H * S;
    var mg = m.getContext('2d');
    mg.fillStyle = '#0b1220'; mg.fillRect(0, 0, m.width, m.height);
    for (var yy = 1; yy < c.H - 1; yy++) for (var xx = 1; xx < c.W - 1; xx++) {
      mg.fillStyle = c.blocked[key(xx, yy)] ? '#4b5563' : (c.path[key(xx, yy)] ? '#334155' : '#1e293b');
      mg.fillRect(xx * S, yy * S, S, S);
    }
    c.mini = m;
    return cv;
  }

  var STATUS_COLOR = { available: '#60a5fa', completed: '#22C55E', locked: '#6B7280', soon: '#A855F7' };
  var PLAYER_SAY = ['Halo!', 'Siap!', 'Ayo!', 'Semangat!'];
  var FONT = '"Press Start 2P", "Courier New", monospace';

  /**
   * start(opts): opts = { canvas, area, spawn:{x,y}, getStatus(missionIdx), onPortal(portal), onNpc(id), onHover(info|null),
   *                       onArea(areaData), reduceMotion(), finalIndex, unlock(missionIdx), alert(id, npc) }
   * Mengembalikan { destroy, step, interact, attachPad, pos, emote, goTo, enter, area }.
   */
  function start(opts) {
    var canvas = opts.canvas, ctx = canvas.getContext('2d');
    canvas.width = VW * T; canvas.height = VH * T; ctx.imageSmoothingEnabled = false;
    var cur = null, npcs = [], pathList = [], motes = [];
    var x = 0, y = 0, rx = 0, ry = 0, face = 1, raf = 0, dead = false, lastKey = 0, lastHover = '';
    var camX = 0, camY = 0, fadeT0 = 0, bannerT0 = 0;
    var timers = [], walkTimer = null, walkPath = null, marker = null, hopT = 0, pSay = null;
    var puffs = [], sparks = [], unlockT0 = 0, unlockPortal = null, fxp = [], bolt = null, nextBolt = 0, flash = 0, vig = null;
    var unlockIdx = (opts.unlock === undefined || opts.unlock === null) ? -1 : opts.unlock;

    function calmNow() { return !!(opts.reduceMotion && opts.reduceMotion()); }
    function modalOpen() {
      var m = document.getElementById('modal-root'), c = document.getElementById('cine-root');
      return !!((m && m.childElementCount) || (c && c.childElementCount));
    }
    function isBlocked(nx, ny) { return cur.wall(nx, ny) || !!cur.blocked[key(nx, ny)]; }
    function portalAt(px, py) { for (var i = 0; i < cur.A.portals.length; i++) { var p = cur.A.portals[i]; if (p.x === px && p.y === py) return p; } return null; }
    function npcAt(px, py) { for (var i = 0; i < npcs.length; i++) if (npcs[i].x === px && npcs[i].y === py) return npcs[i]; return null; }
    function portalStatus(p, t) {
      if (p.kind === 'exit') return 'exit';
      if (p === unlockPortal && (!unlockT0 || t - unlockT0 < 800)) return 'locked';
      return opts.getStatus(p.mission);
    }
    function snapCam() {
      camX = Math.max(0, Math.min(cur.W * T - canvas.width, rx * T + T / 2 - canvas.width / 2));
      camY = Math.max(0, Math.min(cur.H * T - canvas.height, ry * T + T / 2 - canvas.height / 2));
    }

    function load(id) {
      cur = compile(id);
      var t0 = performance.now();
      npcs = cur.A.npcs.map(function (n) { return Object.assign({}, n, { hx: n.x, hy: n.y, rx: n.x, ry: n.y, face: 1, parts: [], nextFx: t0 + Math.random() * 600, nextMove: t0 + 600 + Math.random() * 2500, nextSay: t0 + 4000 + Math.random() * 9000 }); });
      pathList = Object.keys(cur.path).map(function (k) { var a = k.split(','); return { x: +a[0], y: +a[1] }; });
      motes = [];
      var n = Math.round(cur.W * cur.H / 24);
      for (var q = 0; q < n; q++) motes.push({ x: Math.random() * cur.W * T, y: Math.random() * cur.H * T, s: 8 + Math.random() * 16, c: (cur.th.mote ? cur.th.mote.c[Math.floor(Math.random() * cur.th.mote.c.length)] : (Math.random() < .5 ? '#22d3ee' : cur.th.glow)), p: Math.random() * 6 });
      unlockPortal = null; unlockT0 = 0;
      if (unlockIdx >= 0) cur.A.portals.forEach(function (p) { if (p.kind === 'gate' && p.mission === unlockIdx) unlockPortal = p; });
      sparks = []; puffs = []; marker = null; lastHover = ''; initFx();
    }
    function spawnFor(id, from) {
      var c = compile(id);
      if (from) {
        for (var i = 0; i < c.A.portals.length; i++) {
          var p = c.A.portals[i];
          if (p.to !== from) continue;
          var order = p.y > c.H / 2 ? [[0, -1], [-1, 0], [1, 0], [0, 1]] : [[0, 1], [-1, 0], [1, 0], [0, -1]];
          for (var j = 0; j < order.length; j++) {
            var sx = p.x + order[j][0], sy = p.y + order[j][1];
            if (!c.wall(sx, sy) && !c.blocked[key(sx, sy)] && !npcBlockSet(c)[key(sx, sy)] && !c.A.portals.some(function (q) { return q.x === sx && q.y === sy; })) return { x: sx, y: sy };
          }
        }
      }
      return c.A.spawn;
    }
    /** Pindah ke area lain (spawn dekat gerbang asal). Dipakai gerbang Plaza, pintu keluar, dan tes. */
    function enter(id, spawn, quiet) {
      if (!AREAS[id]) return false;
      cancelWalk();
      var from = cur ? cur.id : null;
      load(id);
      var sp = spawn || spawnFor(id, from);
      x = rx = sp.x; y = ry = sp.y;
      snapCam();
      var now = performance.now();
      fadeT0 = quiet ? 0 : now; bannerT0 = quiet ? 0 : now;
      if (opts.onArea) opts.onArea(cur.A);
      hover();
      return true;
    }

    function hover() {
      var info = null, pt = portalAt(x, y);
      if (pt) info = { type: 'portal', portal: pt };
      else {
        D4.some(function (d) { var n = npcAt(x + d[0], y + d[1]); if (n) { info = { type: 'npc', id: n.id }; return true; } return false; });
      }
      var sig = info ? info.type + ':' + (info.id || (info.portal.kind + info.portal.mission + info.portal.to)) : '';
      if (sig !== lastHover) { lastHover = sig; if (opts.onHover) opts.onHover(info); }
    }
    function cancelWalk() { clearInterval(walkTimer); walkTimer = null; walkPath = null; }
    function triggerPortal(p) {
      if (p.kind === 'exit') { enter(p.to); return; }
      if (opts.onPortal) opts.onPortal(p);
    }

    function step(dx, dy, auto) {
      if (dead || modalOpen()) return false;
      if (!auto) cancelWalk();
      if (dx) face = dx < 0 ? -1 : 1;
      var nx = x + dx, ny = y + dy, npc = npcAt(nx, ny);
      if (npc) { hover(); talkTo(npc); return false; }
      if (isBlocked(nx, ny)) return false;
      puffs.push({ x: x * T + T / 2, y: y * T + T - 6, t: performance.now() });
      x = nx; y = ny; hover();
      var p = portalAt(x, y);
      if (p) triggerPortal(p);
      return true;
    }
    function interact() {
      if (dead || modalOpen()) return;
      cancelWalk();
      var p = portalAt(x, y);
      if (p) { triggerPortal(p); return; }
      for (var i = 0; i < 4; i++) { var n = npcAt(x + D4[i][0], y + D4[i][1]); if (n) { talkTo(n); return; } }
    }
    /* ---------- efek wilayah & pencahayaan ---------- */
    function hexA(hex, a) { return 'rgba(' + parseInt(hex.slice(1, 3), 16) + ',' + parseInt(hex.slice(3, 5), 16) + ',' + parseInt(hex.slice(5, 7), 16) + ',' + a + ')'; }
    function initFx() {
      var k = cur.th.fx, i, cw = canvas.width, ch = canvas.height, R = Math.random; fxp = []; bolt = null; flash = 0; nextBolt = performance.now() + 3000 + R() * 4000;
      if (k === 'rain') for (i = 0; i < 30; i++) fxp.push({ x: Math.floor(R() * cw / 8) * 8, y: R() * ch, v: 80 + R() * 150, len: 5 + Math.floor(R() * 8), s: R() });
      else if (k === 'pages') for (i = 0; i < 14; i++) fxp.push({ x: R() * cw, y: R() * ch, v: 14 + R() * 22, ph: R() * 6 });
      else if (k === 'orbs') for (i = 0; i < 3; i++) fxp.push({ c: ['#60a5fa', '#fde047', '#4ade80'][i], ph: i * 2.09 });
      else if (k === 'sparks' || k === 'forge') for (i = 0; i < 34; i++) fxp.push({ x: R() * cw, y: R() * ch, v: 30 + R() * 90, c: k === 'forge' ? (R() < .5 ? '#fbbf24' : '#f97316') : (R() < .5 ? '#22d3ee' : '#4ade80'), ph: R() * 6 });
      else if (k === 'lanterns') for (i = 0; i < 9; i++) fxp.push({ x: R() * cw, y: R() * ch, v: 10 + R() * 16, ph: R() * 6, c: ['#fde047', '#fb923c', '#f9a8d4', '#93c5fd'][i % 4] });
      else if (k === 'storm') for (i = 0; i < 34; i++) fxp.push({ x: R() * cw, y: R() * ch, v: 40 + R() * 80, c: R() < .5 ? '#f97316' : '#fbbf24', ph: R() * 6 });
    }
    function drawVignette() {
      if (!vig) {
        vig = document.createElement('canvas'); vig.width = canvas.width; vig.height = canvas.height;
        var g = vig.getContext('2d'), gr = g.createRadialGradient(vig.width / 2, vig.height / 2, vig.height * .35, vig.width / 2, vig.height / 2, vig.width * .62);
        gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.55)'); g.fillStyle = gr; g.fillRect(0, 0, vig.width, vig.height);
      }
      ctx.drawImage(vig, 0, 0);
    }
    function areaFx(t, now) {
      var k = cur.th.fx, cw = canvas.width, ch = canvas.height, i;
      if (!k) return;
      if (k === 'rain') {
        ctx.font = '8px monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        fxp.forEach(function (p) {
          p.y += p.v * .016; if (p.y - p.len * 9 > ch) { p.y = -10; p.x = Math.floor(Math.random() * cw / 8) * 8; }
          for (var j = 0; j < p.len; j++) { ctx.globalAlpha = (1 - j / p.len) * .55; ctx.fillStyle = j === 0 ? '#d1fae5' : '#22C55E'; ctx.fillText('01gitadd'[(Math.floor(p.s * 8) + j) % 8], p.x, p.y - j * 9); }
        });
      } else if (k === 'pages') {
        fxp.forEach(function (p) {
          p.y += p.v * .016; p.x += p.v * .008 + Math.sin(t / 700 + p.ph) * .3; if (p.y > ch + 10) { p.y = -10; p.x = Math.random() * cw; } if (p.x > cw + 10) p.x = -10;
          var w = 3 + Math.abs(Math.cos(t / 400 + p.ph)) * 7; ctx.globalAlpha = .55; ctx.fillStyle = '#f9fafb'; ctx.fillRect(Math.round(p.x), Math.round(p.y), Math.round(w), 9); ctx.fillStyle = '#93c5fd'; ctx.fillRect(Math.round(p.x) + 1, Math.round(p.y) + 2, Math.max(1, Math.round(w) - 2), 1);
        });
      } else if (k === 'orbs') {
        fxp.forEach(function (p) {
          var a = t / 2400 + p.ph, ox = cw / 2 + Math.cos(a) * cw * .42, oy = ch / 2 + Math.sin(a * 1.3) * ch * .36;
          ctx.globalAlpha = .1; ctx.fillStyle = p.c; ctx.fillRect(ox - 14, oy - 14, 28, 28); ctx.globalAlpha = .25; ctx.fillRect(ox - 8, oy - 8, 16, 16); ctx.globalAlpha = .85; ctx.fillRect(ox - 3, oy - 3, 6, 6);
        });
      } else if (k === 'sparks' || k === 'forge') {
        fxp.forEach(function (p) {
          p.y -= p.v * .016; p.x += Math.sin(t / 300 + p.ph) * .5; if (p.y < -6) { p.y = ch + 6; p.x = Math.random() * cw; }
          ctx.globalAlpha = .4 + .5 * Math.max(0, Math.sin(t / 120 + p.ph)); ctx.fillStyle = p.c; ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2); ctx.globalAlpha *= .4; ctx.fillRect(Math.round(p.x), Math.round(p.y) + 3, 2, 4);
        });
        if (k === 'forge') { ctx.globalAlpha = .05 + .04 * Math.sin(t / 220); ctx.fillStyle = '#f97316'; ctx.fillRect(0, 0, cw, ch); }
      } else if (k === 'lanterns') {
        fxp.forEach(function (p) {
          p.y -= p.v * .016; p.x += Math.sin(t / 900 + p.ph) * .35; if (p.y < -12) { p.y = ch + 12; p.x = Math.random() * cw; }
          ctx.globalAlpha = .16; ctx.fillStyle = p.c; ctx.fillRect(Math.round(p.x) - 7, Math.round(p.y) - 7, 20, 22); ctx.globalAlpha = .9; ctx.fillRect(Math.round(p.x), Math.round(p.y), 6, 8); ctx.fillStyle = '#fff'; ctx.globalAlpha = .6; ctx.fillRect(Math.round(p.x) + 2, Math.round(p.y) + 2, 2, 3);
        });
      } else if (k === 'laser') {
        var ly = ((t / 2800) % 1.5 - .25) * ch;
        ctx.globalAlpha = .12; ctx.fillStyle = '#ef4444'; ctx.fillRect(0, ly - 26, cw, 52); ctx.globalAlpha = .25; ctx.fillRect(0, ly - 8, cw, 16); ctx.globalAlpha = .9; ctx.fillStyle = '#fecaca'; ctx.fillRect(0, ly - 1, cw, 2);
        for (i = 0; i < 12; i++) { ctx.globalAlpha = .35; ctx.fillStyle = '#ef4444'; ctx.fillRect(i * (cw / 12) + ((t / 40) % 8), ly - 4, 3, 8); }
      } else if (k === 'storm') {
        fxp.forEach(function (p) {
          p.y -= p.v * .016; p.x += Math.sin(t / 400 + p.ph) * .7; if (p.y < -6) { p.y = ch + 6; p.x = Math.random() * cw; }
          ctx.globalAlpha = .45 + .45 * Math.max(0, Math.sin(t / 150 + p.ph)); ctx.fillStyle = p.c; ctx.fillRect(Math.round(p.x), Math.round(p.y), 3, 3);
        });
        ctx.globalAlpha = .07 + .05 * Math.sin(t / 500); ctx.fillStyle = '#ef4444'; ctx.fillRect(0, 0, cw, ch);
        if (now > nextBolt) { nextBolt = now + 4500 + Math.random() * 5000; flash = 1; var bx = 60 + Math.random() * (cw - 120), seg = []; for (i = 0; i < 9; i++) { seg.push([bx, i * ch / 8]); bx += (Math.random() - .5) * 46; } bolt = { seg: seg, t0: now }; }
        if (bolt) {
          var be = now - bolt.t0;
          if (be > 260) bolt = null;
          else { ctx.globalAlpha = 1 - be / 260; ctx.strokeStyle = '#f5f3ff'; ctx.lineWidth = 3; ctx.beginPath(); bolt.seg.forEach(function (q, j) { if (j) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); }); ctx.stroke(); ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 1; ctx.stroke(); }
        }
        if (flash > .01) { ctx.globalAlpha = flash * .45; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cw, ch); flash *= .86; }
      }
      ctx.globalAlpha = 1;
    }
    /** Halo lampu berkedip & pilar cahaya di atas portal yang bisa dimasuki (ruang dunia). */
    function drawLights(t) {
      var glow = cur.th.glow, vx0 = camX - 90, vx1 = camX + canvas.width + 90, vy0 = camY - 90, vy1 = camY + canvas.height + 90;
      ctx.globalCompositeOperation = 'lighter';
      cur.decor.forEach(function (d) {
        var cx = d.x * T + 16, cy = d.y * T + 10;
        if (d.t !== 'lamp' || cx < vx0 || cx > vx1 || cy < vy0 || cy > vy1) return;
        var a = .30 + .12 * Math.sin(t / 170 + d.x * 3 + d.y) + (Math.sin(t / 47 + d.x) > .96 ? -.1 : 0);
        var g = ctx.createRadialGradient(cx, cy, 2, cx, cy, 78); g.addColorStop(0, hexA(glow, Math.max(0, a))); g.addColorStop(1, hexA(glow, 0));
        ctx.fillStyle = g; ctx.fillRect(cx - 78, cy - 78, 156, 156);
      });
      ctx.globalCompositeOperation = 'source-over';
      cur.A.portals.forEach(function (p) {
        var st = portalStatus(p, t); if (st !== 'available' && st !== 'exit') return;
        var col = st === 'exit' ? '#EAB308' : (p.mission === opts.finalIndex ? '#EF4444' : '#60a5fa'), cx = p.x * T + T / 2, by = p.y * T + 6;
        if (cx < vx0 || cx > vx1) return;
        var h = st === 'exit' ? 70 : 130, pulse = .75 + .25 * Math.sin(t / 260 + p.x);
        ctx.fillStyle = col;
        for (var i = 0; i < 10; i++) { ctx.globalAlpha = (.26 - i * .024) * pulse; ctx.fillRect(cx - 9 + i * .4, by - (i + 1) * h / 10, 18 - i * .8, h / 10 + 1); }
        for (var j = 0; j < 4; j++) { var yy = by - ((t / 18 + j * 33) % h); ctx.globalAlpha = .8 * (1 - (by - yy) / h); ctx.fillRect(cx - 7 + ((j * 5) % 11), yy, 3, 3); }
        ctx.globalAlpha = 1;
      });
    }
    var GOOD_FX = ['#fde047', '#f9fafb', '#86efac', '#93c5fd'], EVIL_FX = ['#a855f7', '#ef4444', '#6b21a8', '#f97316'];
    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    /** NPC melonjak dan memercikkan efek lalu dialog dibuka. */
    function talkTo(n) {
      n.hopT = performance.now(); n.near = true;
      if (!calmNow()) for (var i = 0; i < 16; i++) { var ang = Math.random() * Math.PI * 2, sp = .8 + Math.random() * 1.6; n.parts.push({ x: n.rx * T + T / 2, y: n.ry * T + T - 30, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - .8, g: .06, life: 1, c: pick(n.kind === 'evil' ? EVIL_FX : GOOD_FX), s: 3 }); }
      if (opts.onNpc) opts.onNpc(n.id);
    }
    /** Warga berkeliaran pelan di sekitar titik asalnya (berhenti saat dialog terbuka). */
    function wander(now) {
      if (window.GQ_FAST || modalOpen() || calmNow()) return;
      npcs.forEach(function (n) {
        if (!n.wander || now < n.nextMove) return;
        n.nextMove = now + 900 + Math.random() * 2800;
        if (Math.random() < .25) return;
        var d = D4[Math.floor(Math.random() * 4)], nx = n.x + d[0], ny = n.y + d[1];
        if (Math.abs(nx - n.hx) > n.wander || Math.abs(ny - n.hy) > n.wander) return;
        if (isBlocked(nx, ny) || portalAt(nx, ny) || npcAt(nx, ny) || (nx === x && ny === y)) return;
        if (d[0]) n.face = d[0];
        n.x = nx; n.y = ny;
      });
    }
    function emote(text) { hopT = performance.now(); pSay = { text: text || PLAYER_SAY[Math.floor(Math.random() * PLAYER_SAY.length)], until: hopT + 1500 }; }

    /** Klik ubin: berjalan otomatis (jalur terpendek). Klik NPC = berjalan ke sebelahnya lalu bicara. */
    function goTo(tx, ty) {
      if (dead || modalOpen()) return false;
      cancelWalk();
      var npc = npcAt(tx, ty), path = null, after = null;
      if (npc) {
        D4.forEach(function (d) {
          var nx = tx + d[0], ny = ty + d[1]; if (isBlocked(nx, ny) || npcAt(nx, ny)) return;
          var p = findPath(x, y, nx, ny, cur.id); if (p && (!path || p.length < path.length)) path = p;
        });
        after = function () { talkTo(npc); };
      } else {
        if (isBlocked(tx, ty)) return false;
        path = findPath(x, y, tx, ty, cur.id);
      }
      if (!path) return false;
      marker = { x: tx, y: ty, t: performance.now() };
      walkPath = path;
      walkTimer = setInterval(function () {
        if (dead || modalOpen() || !walkPath) { cancelWalk(); return; }
        var s = walkPath.shift();
        if (!s) { cancelWalk(); if (after) after(); return; }
        if (!step(s[0], s[1], true)) cancelWalk();
      }, 85);
      return true;
    }
    function onClick(e) {
      if (dead || modalOpen()) return;
      var r = canvas.getBoundingClientRect();
      var wx = camX + (e.clientX - r.left) / r.width * canvas.width, wy = camY + (e.clientY - r.top) / r.height * canvas.height;
      var tx = Math.floor(wx / T), ty = Math.floor(wy / T);
      if (tx < 0 || ty < 0 || tx >= cur.W || ty >= cur.H) return;
      if (tx === x && ty === y) { interact(); return; }
      goTo(tx, ty);
    }
    canvas.addEventListener('click', onClick);

    function onKey(e) {
      if (dead) return;
      var tag = (e.target && e.target.tagName) || '';
      if (/INPUT|SELECT|TEXTAREA/.test(tag) || modalOpen()) return;
      var k = e.key, dx = 0, dy = 0;
      if (k === 'ArrowLeft' || k === 'a' || k === 'A') dx = -1;
      else if (k === 'ArrowRight' || k === 'd' || k === 'D') dx = 1;
      else if (k === 'ArrowUp' || k === 'w' || k === 'W') dy = -1;
      else if (k === 'ArrowDown' || k === 's' || k === 'S') dy = 1;
      else if (k === 'f' || k === 'F') { emote(); return; }
      else if ((k === 'Enter' || k === ' ' || k === 'e' || k === 'E') && (tag !== 'BUTTON')) { e.preventDefault(); if (!e.repeat) interact(); return; }
      else return;
      e.preventDefault();
      var now = Date.now();
      if (e.repeat && now - lastKey < 110) return;
      lastKey = now;
      step(dx, dy);
    }
    document.addEventListener('keydown', onKey);

    function attachPad(el, dx, dy) {
      var holdDelay = 0, holdRepeat = 0, held = false;
      function clear() { clearTimeout(holdDelay); clearInterval(holdRepeat); }
      el.addEventListener('pointerdown', function () {
        held = false; clear();
        holdDelay = setTimeout(function () { held = true; holdRepeat = setInterval(function () { step(dx, dy); }, 130); }, 320);
      });
      ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { el.addEventListener(ev, clear); });
      el.addEventListener('click', function () { if (held) { held = false; return; } step(dx, dy); });
      timers.push(clear);
    }

    /* ---------- gambar ---------- */
    function bubble(text, cx, by) {
      ctx.font = '8px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      var w = Math.ceil(ctx.measureText(text).width) + 14, bx = Math.max(camX + 2, Math.min(camX + canvas.width - w - 2, cx - w / 2));
      ctx.fillStyle = '#0b1220'; ctx.fillRect(bx - 2, by - 20, w + 4, 22);
      ctx.fillStyle = '#F9FAFB'; ctx.fillRect(bx, by - 18, w, 18);
      ctx.fillStyle = '#F9FAFB'; ctx.fillRect(cx - 3, by, 6, 4);
      ctx.fillStyle = '#111827'; ctx.fillText(text, bx + w / 2, by - 8);
    }
    function tag(text, cx, ty, col) {
      ctx.font = '7px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      var w = Math.ceil(ctx.measureText(text).width) + 10;
      ctx.fillStyle = '#0b1220'; ctx.fillRect(cx - w / 2 - 1, ty - 1, w + 2, 15);
      ctx.fillStyle = col; ctx.fillRect(cx - w / 2, ty, w, 13);
      ctx.fillStyle = '#0b1220'; ctx.fillText(text, cx, ty + 7);
    }
    function drawPortal(p, t) {
      var st = portalStatus(p, t), i = p.mission || 0, calm = calmNow();
      var col = st === 'exit' ? '#EAB308' : (STATUS_COLOR[st] || STATUS_COLOR.locked);
      if (p.mission === opts.finalIndex && st === 'available') col = '#EF4444';
      var cx = p.x * T + T / 2, cy = p.y * T + T / 2;
      var pulse = calm ? 0 : Math.sin(t / 380 + i);
      var half = 13 + pulse * 1.5;
      ctx.globalAlpha = st === 'locked' || st === 'soon' ? .75 : 1;
      ctx.fillStyle = '#0b1220'; ctx.fillRect(cx - 15, cy - 15, 30, 30);
      ctx.fillStyle = col; ctx.fillRect(cx - half, cy - half, half * 2, 3); ctx.fillRect(cx - half, cy + half - 3, half * 2, 3);
      ctx.fillRect(cx - half, cy - half, 3, half * 2); ctx.fillRect(cx + half - 3, cy - half, 3, half * 2);
      ctx.globalAlpha = (st === 'available' || st === 'exit' ? .30 + (pulse + 1) * .12 : .18);
      ctx.fillStyle = col; ctx.fillRect(cx - half + 3, cy - half + 3, half * 2 - 6, half * 2 - 6);
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#F9FAFB'; ctx.font = '12px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if (st === 'exit') {   // panah kembali ◀
        ctx.fillStyle = '#F9FAFB';
        for (var a = 0; a < 5; a++) ctx.fillRect(cx - 6 + a * 2, cy - a, 2, a * 2 + 1);
        ctx.fillRect(cx + 4, cy - 1, 5, 3);
      } else if (st === 'completed') {
        ctx.fillStyle = '#22C55E';
        [[-6, 0], [-4, 2], [-2, 4], [0, 2], [2, 0], [4, -2], [6, -4]].forEach(function (d) { ctx.fillRect(cx + d[0] - 1, cy + d[1] - 1, 3, 3); });
      } else if (st === 'locked' || st === 'soon') {
        ctx.fillStyle = '#9CA3AF'; ctx.fillRect(cx - 5, cy - 1, 10, 8); ctx.fillRect(cx - 3, cy - 6, 2, 5); ctx.fillRect(cx + 1, cy - 6, 2, 5); ctx.fillRect(cx - 3, cy - 6, 6, 2);
        ctx.fillStyle = '#111827'; ctx.fillRect(cx - 1, cy + 2, 2, 3);
      } else {
        ctx.fillText(opts.finalIndex === p.mission ? '!' : String(p.mission + 1), cx + 1, cy + 1);
      }
      if ((st === 'available' || st === 'completed' || st === 'exit') && !calm) {
        ctx.fillStyle = col;
        for (var k = 0; k < 4; k++) { var an = t / 650 + k * Math.PI / 2; ctx.fillRect(Math.round(cx + Math.cos(an) * 19) - 1, Math.round(cy + Math.sin(an) * 19) - 1, 3, 3); }
      }
      if (p.label) tag(p.label, cx, p.y * T + T + 2, col);
    }
    var curT = 0;
    function sprH(k) { return isChar(k) ? 48 : 27; }
    function drawSprite(k, tx, ty, flip, bob, frame) {
      var isC = isChar(k), sc = isC ? 2 : 3, w = isC ? 36 : 24, h = sprH(k);
      var px = tx * T + (T - w) / 2, py = ty * T + T - h - 1 - (bob || 0);
      ctx.fillStyle = 'rgba(0,0,0,.35)'; var sh = Math.max(8, T - 12 - (bob || 0)); ctx.fillRect(tx * T + (T - sh) / 2, ty * T + T - 5, sh, 4);
      var tier = tierOf(k), calm = calmNow();
      if (tier && isC) window.GQChars.fxBack(ctx, px + w / 2, ty * T + T - 3, h, tier, calm ? 0 : curT, specOf(k).accent);
      drawChar(ctx, k, px, py, sc, frame, flip, calm ? 0 : curT);
      if (tier && isC) window.GQChars.fxFront(ctx, px + w / 2, ty * T + T - 3, h, tier, calm ? 0 : curT, specOf(k).accent);
    }
    function drawMini(t) {
      var S = 3, m = cur.mini, mx = canvas.width - m.width - 8, my = 8;
      ctx.globalAlpha = .88; ctx.fillStyle = '#0b1220'; ctx.fillRect(mx - 3, my - 3, m.width + 6, m.height + 6);
      ctx.strokeStyle = cur.th.edge; ctx.lineWidth = 2; ctx.strokeRect(mx - 3, my - 3, m.width + 6, m.height + 6);
      ctx.drawImage(m, mx, my);
      cur.A.portals.forEach(function (p) { var st = portalStatus(p, t); ctx.fillStyle = st === 'exit' ? '#EAB308' : (STATUS_COLOR[st] || '#6B7280'); ctx.fillRect(mx + p.x * S - 1, my + p.y * S - 1, S + 2, S + 2); });
      npcs.forEach(function (n) { ctx.fillStyle = n.kind === 'evil' ? '#EF4444' : '#22C55E'; ctx.fillRect(mx + n.x * S, my + n.y * S, S, S); });
      ctx.strokeStyle = 'rgba(249,250,251,.45)'; ctx.lineWidth = 1; ctx.strokeRect(mx + camX / T * S + .5, my + camY / T * S + .5, VW * S, VH * S);
      if (calmNow() || Math.floor(t / 300) % 2) { ctx.fillStyle = '#EAB308'; ctx.fillRect(mx + Math.round(rx) * S - 1, my + Math.round(ry) * S - 1, S + 2, S + 2); }
      ctx.globalAlpha = 1;
    }

    function frame(t) {
      if (dead) return;
      curT = t;
      var calm = calmNow(), now = performance.now();
      rx += (x - rx) * .35; ry += (y - ry) * .35;
      if (Math.abs(x - rx) < .02) rx = x;
      if (Math.abs(y - ry) < .02) ry = y;
      var moving = rx !== x || ry !== y;
      // kamera mengikuti pemain
      var tcx = Math.max(0, Math.min(cur.W * T - canvas.width, rx * T + T / 2 - canvas.width / 2));
      var tcy = Math.max(0, Math.min(cur.H * T - canvas.height, ry * T + T / 2 - canvas.height / 2));
      camX += (tcx - camX) * .2; camY += (tcy - camY) * .2;
      if (Math.abs(tcx - camX) < .5) camX = tcx;
      if (Math.abs(tcy - camY) < .5) camY = tcy;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(-Math.round(camX), -Math.round(camY));
      ctx.drawImage(cur.base, 0, 0);
      if (!calm) {
        pathList.forEach(function (pt) {
          if (pt.x * T < camX - T || pt.x * T > camX + canvas.width || pt.y * T < camY - T || pt.y * T > camY + canvas.height) return;
          ctx.globalAlpha = .06 + .12 * Math.max(0, Math.sin(t / 420 - (pt.x + pt.y) * .55)); ctx.fillStyle = cur.th.glow; ctx.fillRect(pt.x * T + 2, pt.y * T + 2, T - 4, T - 4);
        });
        ctx.globalAlpha = 1;
      }
      if (unlockPortal && !unlockT0) {
        unlockT0 = t;
        for (var b = 0; b < 40; b++) { var ang = Math.random() * Math.PI * 2, sp = 1 + Math.random() * 3; sparks.push({ x: unlockPortal.x * T + T / 2, y: unlockPortal.y * T + T / 2, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: 1, c: Math.random() < .5 ? '#60a5fa' : '#EAB308' }); }
        canvas.classList.add('unlocking'); setTimeout(function () { canvas.classList.remove('unlocking'); }, 700);
      }
      cur.A.portals.forEach(function (p) { drawPortal(p, t); });
      if (marker) {   // penanda tujuan klik
        var ma = 1 - (now - marker.t) / 700;
        if (ma <= 0) marker = null;
        else { ctx.globalAlpha = ma; ctx.strokeStyle = '#EAB308'; ctx.lineWidth = 2; var rr = 6 + (1 - ma) * 8; ctx.strokeRect(marker.x * T + T / 2 - rr, marker.y * T + T / 2 - rr, rr * 2, rr * 2); ctx.globalAlpha = 1; }
      }
      wander(now);
      var list = npcs.map(function (n) {
        n.rx += (n.x - n.rx) * .2; n.ry += (n.y - n.ry) * .2;
        if (Math.abs(n.x - n.rx) < .03) n.rx = n.x;
        if (Math.abs(n.y - n.ry) < .03) n.ry = n.y;
        var nmoving = n.rx !== n.x || n.ry !== n.y, evil = n.kind === 'evil';
        var d = Math.abs(rx - n.rx) + Math.abs(ry - n.ry);
        // sapaan saat pemain mendekat, dan celoteh acak saat pemain berada di sekitar
        if (d <= 2.5 && !n.near) { n.near = true; if (now - (n.lastSay || -99999) > 7000) { n.bub = { text: pick(n.say), until: now + 2400 }; n.lastSay = now; n.hopT = now; } }
        else if (d > 3.6) n.near = false;
        if (now > n.nextSay) { n.nextSay = now + 7000 + Math.random() * 9000; if (d <= 8 && !(n.bub && now < n.bub.until)) n.bub = { text: pick(n.say), until: now + 2200 }; }
        return { y: n.ry, draw: function () {
          var jx = ((n.sprite === 'glitch' || n.sprite === 'virus' || evil) && Math.sin(t / 110 + n.x) > .95) ? (Math.random() < .5 ? -2 : 2) : 0;
          var idle = nmoving ? Math.abs(Math.sin(t / 70)) * 2.5 : ((n.sprite === 'bugbyte') ? Math.round(2 + Math.sin(t / 300)) : ((n.sprite === 'glitch' || n.sprite === 'virus') ? Math.round(Math.abs(Math.sin(t / 250)) * 2) : Math.round(Math.max(0, Math.sin(t / 600 + n.x)) * 1.5)));
          var hop = n.hopT && now - n.hopT < 420 ? Math.sin((now - n.hopT) / 420 * Math.PI) * 10 : 0;
          var fl = (!nmoving && d <= 4) ? (rx < n.rx ? -1 : 1) : n.face;   // diam: menoleh ke pemain; jalan: ke arah gerak
          var fr = calm ? 'idle' : (nmoving ? (Math.floor(t / 120) % 2 ? 'walk1' : 'walk2') : (Math.floor(t / 420 + n.x) % 2 ? 'walk2' : 'idle'));
          if (evil && !calm) {   // aura merah berdenyut di kaki NPC jahat
            ctx.globalAlpha = .18 + .12 * Math.sin(t / 260 + n.x); ctx.fillStyle = '#EF4444'; ctx.fillRect(n.rx * T - 2, n.ry * T + T - 10, T + 4, 9); ctx.globalAlpha = 1;
          }
          drawSprite(n.sprite, n.rx + jx / T, n.ry, fl, (calm ? 0 : idle) + hop, fr);
          var top = n.ry * T + T - sprH(n.sprite) - 6 - (calm ? 0 : idle) - hop, cx = n.rx * T + T / 2;
          // partikel: kilau (baik) atau asap ungu-merah (jahat)
          var onScr = n.rx * T > camX - 60 && n.rx * T < camX + canvas.width + 60 && n.ry * T > camY - 60 && n.ry * T < camY + canvas.height + 60;
          if (!calm && onScr && now > n.nextFx) { n.nextFx = now + (evil ? 240 : 480) + Math.random() * 400; n.parts.push({ x: cx + (Math.random() - .5) * 22, y: top + 10 + Math.random() * 16, vx: (Math.random() - .5) * .3, vy: -(.3 + Math.random() * .4), life: 1, c: pick(evil ? EVIL_FX : GOOD_FX), s: 2 + Math.floor(Math.random() * 2) }); }
          n.parts = n.parts.filter(function (p) {
            p.x += p.vx; p.y += p.vy; if (p.g) p.vy += p.g; p.life -= p.g ? .02 : .016;
            if (p.life <= 0) return false;
            ctx.globalAlpha = Math.min(1, p.life * 1.4); ctx.fillStyle = p.c;
            var px2 = Math.round(p.x), py2 = Math.round(p.y);
            if (!evil && p.s === 3) { ctx.fillRect(px2 - 1, py2, 3, 1); ctx.fillRect(px2, py2 - 1, 1, 3); } else ctx.fillRect(px2, py2, p.s, p.s);
            return true;
          });
          ctx.globalAlpha = 1;
          if (n.bub && now < n.bub.until) bubble(n.bub.text, cx, top);
          else if (opts.alert && opts.alert(n.id, n)) {
            var by = top - (calm ? 0 : Math.round(Math.abs(Math.sin(t / 260)) * 4));
            ctx.fillStyle = evil ? '#EF4444' : '#EAB308'; ctx.fillRect(cx - 7, by - 14, 14, 14); ctx.fillStyle = evil ? '#F9FAFB' : '#111827';
            ctx.font = '10px ' + FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('!', cx + 1, by - 6);
          }
          if (d <= 3.2 && n.name) tag(n.name, cx, n.ry * T + T + 1, evil ? '#f87171' : '#86efac');
        } };
      });
      list.push({ y: ry, draw: function () {
        var hop = hopT && now - hopT < 420 ? Math.sin((now - hopT) / 420 * Math.PI) * 12 : 0;
        var fr = moving ? (Math.floor(t / 110) % 2 ? 'walk1' : 'walk2') : (calm ? 'idle' : (Math.floor(t / 700) % 2 ? 'walk2' : 'idle'));
        if (moving && window.GQChars.getTier() >= 6 && !calm) puffs.push({ x: rx * T + T / 2, y: ry * T + T - 12, t: now, gold: 1 });
        drawSprite('player', rx, ry, face, (moving ? Math.abs(Math.sin(t / 60)) * 3 : 0) + hop, fr);
        if (pSay && now < pSay.until) bubble(pSay.text, rx * T + T / 2, ry * T + T - 48 - 6 - hop);
      } });
      list.sort(function (a, b) { return a.y - b.y; }).forEach(function (o) { o.draw(); });
      if (!calm) drawLights(t);
      if (!calm) {
        ctx.globalAlpha = .05; ctx.fillStyle = '#93c5fd'; ctx.fillRect(((t / 18) % (cur.W * T + 160)) - 80, 0, 50, cur.H * T);
        motes.forEach(function (m) {
          var dir = (cur.th.mote && cur.th.mote.dir) || 1; m.y -= m.s * .016 * dir * (dir < 0 ? 2.5 : 1); m.x += Math.sin(t / 900 + m.p) * .2;
          if (m.y < -4 || m.y > cur.H * T + 8) { m.y = dir < 0 ? -4 : cur.H * T + 4; m.x = Math.random() * cur.W * T; }
          ctx.globalAlpha = .3 + .35 * Math.sin(t / 500 + m.p); ctx.fillStyle = m.c; ctx.fillRect(Math.round(m.x), Math.round(m.y), 3, 3);
        });
        ctx.globalAlpha = 1;
      }
      puffs = puffs.filter(function (p) { var a = 1 - (now - p.t) / 450; if (a <= 0) return false; ctx.globalAlpha = a * .5; ctx.fillStyle = p.gold ? '#ffd34d' : '#9CA3AF'; var sz = 3 + (1 - a) * 5; ctx.fillRect(p.x - sz / 2, p.y - (1 - a) * 6, sz, sz); return true; });
      ctx.globalAlpha = 1;
      if (unlockPortal && unlockT0) {
        var e = t - unlockT0, ucx = unlockPortal.x * T + T / 2, ucy = unlockPortal.y * T + T / 2;
        if (e < 2400) {
          for (var k = 0; k < 3; k++) { var r = (e - 700 - k * 300) / 1000 * 80; if (r > 0 && r < 80) { ctx.globalAlpha = 1 - r / 80; ctx.strokeStyle = '#60a5fa'; ctx.lineWidth = 3; ctx.strokeRect(ucx - r, ucy - r, r * 2, r * 2); } }
          if (e > 700 && e < 900) { ctx.globalAlpha = (900 - e) / 200; ctx.fillStyle = '#F9FAFB'; ctx.fillRect(ucx - 20, ucy - 20, 40, 40); }
          ctx.globalAlpha = 1;
        }
        sparks = sparks.filter(function (sp) { if (e < 700) return true; sp.x += sp.vx; sp.y += sp.vy; sp.life -= .018; if (sp.life <= 0) return false; ctx.globalAlpha = sp.life; ctx.fillStyle = sp.c; ctx.fillRect(Math.round(sp.x), Math.round(sp.y), 3, 3); return true; });
        ctx.globalAlpha = 1;
      }
      ctx.restore();

      // lapisan layar: efek wilayah, vinyet, minimap, spanduk nama area, fade antar-peta
      if (!calm) { areaFx(t, now); drawVignette(); }
      drawMini(t);
      if (bannerT0) {
        var be = now - bannerT0;
        if (be < 3000) {
          var ba = Math.min(1, be / 300, (3000 - be) / 500);
          ctx.globalAlpha = Math.max(0, ba) * .92;
          ctx.fillStyle = '#0b1220'; ctx.fillRect(0, 22, canvas.width - 150, 52);
          ctx.fillStyle = cur.th.glow; ctx.fillRect(0, 22, 6, 52);
          ctx.globalAlpha = Math.max(0, ba);
          ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
          ctx.fillStyle = '#F9FAFB'; ctx.font = '14px ' + FONT; ctx.fillText(cur.A.name, 20, 40);
          ctx.fillStyle = '#9CA3AF'; ctx.font = '8px ' + FONT; ctx.fillText(cur.A.sub || '', 20, 62);
          ctx.globalAlpha = 1;
        }
      }
      if (fadeT0 && !calm) {
        var fa = 1 - (now - fadeT0) / 450;
        if (fa > 0) { ctx.globalAlpha = fa; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.globalAlpha = 1; }
      }
      raf = requestAnimationFrame(frame);
    }

    enter(opts.area || 'plaza', opts.spawn || null, true);
    bannerT0 = performance.now();
    raf = requestAnimationFrame(frame);

    return {
      step: step, interact: interact, attachPad: attachPad, emote: emote, goTo: goTo, enter: enter,
      pos: function () { return { x: x, y: y }; },
      area: function () { return cur.id; },
      destroy: function () {
        dead = true; cancelAnimationFrame(raf); cancelWalk();
        document.removeEventListener('keydown', onKey); canvas.removeEventListener('click', onClick);
        timers.forEach(function (f) { f(); });
      }
    };
  }

  window.GQWorld = {
    start: start, AREAS: AREAS, ORDER: window.GQ_AREA_ORDER || [], PORTALS: (AREAS.plaza ? AREAS.plaza.portals : []), START: (AREAS.plaza ? AREAS.plaza.spawn : { x: 2, y: 6 }),
    NPCS: (AREAS.plaza ? AREAS.plaza.npcs : []), VW: VW, VH: VH, T: T,
    charCanvas: charCanvas, drawChar: drawChar, sprite: sprite, findPath: findPath, compile: compile, spawnFor: function (id, from) { compile(id); return null; }
  };
})();

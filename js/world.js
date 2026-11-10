/* world.js — dunia (overworld) GIT QUEST + sprite karakter beranimasi.
   Peta ubin: gerak (panah/WASD/tombol/klik), tabrakan, NPC yang menyapa, portal.
   Hanya menggambar & menggerakkan; semua aturan skor tetap di scoring.js. */
(function () {
  'use strict';

  var T = 32, W = 24, H = 13;
  var START = { x: 2, y: 6 };
  // Urutan portal = urutan misi (index 0..6)
  var PORTALS = [{ x: 4, y: 10 }, { x: 10, y: 10 }, { x: 16, y: 10 }, { x: 21, y: 7 }, { x: 16, y: 3 }, { x: 10, y: 3 }, { x: 4, y: 3 }];
  var NPCS = [
    { id: 'nara', x: 4, y: 6, sprite: 'nara', say: ['Halo!', 'Semangat ya!', 'Ayo mulai!'] },
    { id: 'bugbyte', x: 5, y: 9, sprite: 'bugbyte', say: ['Bip bip!', 'Aku siaga!', 'Scan... aman!'] },
    { id: 'dev1', x: 12, y: 7, sprite: 'dev1', say: ['Commit dulu!', 'git log, bro.'] },
    { id: 'dev2', x: 19, y: 5, sprite: 'dev2', say: ['Git itu seru!', 'Sudah di-stage?'] },
    { id: 'glitch', x: 6, y: 3, sprite: 'glitch', say: ['Hehe...', 'Bug bug bug!', 'Awas aku!'] }
  ];
  var SERVERS = [[7, 5], [8, 5], [9, 5], [13, 5], [14, 5], [7, 8], [8, 8], [13, 8], [14, 8], [18, 8], [19, 8], [12, 1], [13, 1], [18, 1], [19, 1], [1, 9]];
  var TERMS = [[11, 6], [18, 3], [7, 10], [13, 10], [19, 10], [2, 2], [8, 3]];

  /* ---------- sprite: karakter anime (chars.js) + maskot piksel ---------- */
  var CHAR_KEYS = { player: 1, nara: 1, dev1: 1, dev2: 1 };
  var ARTS = {
    bugbyte: ['...y....', '...g....', '.mmmmmm.', 'meemmeem', 'mmpmmpmm', 'mmmmmmmm', '.MMMMMM.', 'g.MMMM.g', '..M..M..'],
    glitch: ['.r..c..r', 'rrrrrrrr', 'rreerree', 'crpprppr', 'rrrrrrrc', 'rRrrmrRr', '.rrrrrr.', 'r.r..r.m']
  };
  var PALS = {
    bugbyte: { m: '#22C55E', M: '#15803d', e: '#f9fafb', p: '#111827', y: '#EAB308', g: '#9CA3AF' },
    glitch: { r: '#EF4444', R: '#991b1b', e: '#f9fafb', p: '#111827', c: '#22d3ee', m: '#A855F7' }
  };
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
    if (CHAR_KEYS[key]) window.GQChars.draw(ctx, specOf(key), x, y, scale, frame, flip, t || 0, tierOf(key));
    else drawMascot(ctx, key, x, y, scale, frame, flip);
  }
  /** Elemen <canvas> karakter beranimasi (arena, intro, profil, sinematik). */
  function charCanvas(key, scale) {
    if (CHAR_KEYS[key]) return window.GQChars.canvas(function () { return specOf(key); }, scale, function () { return tierOf(key); }, { calm: function () { return document.body.classList.contains('reduce-motion'); } });
    var s0 = sprite(key, scale, 'idle'), c = document.createElement('canvas');
    c.width = s0.width; c.height = s0.height; c.className = 'char-canvas'; c.setAttribute('aria-hidden', 'true');
    var g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    var api = { el: c, draw: function (frame, flip) { g.clearRect(0, 0, c.width, c.height); drawMascot(g, key, 0, 0, scale, frame || 'idle', flip || 1); } };
    api.draw('idle', 1);
    return api;
  }

  /* ---------- peta ---------- */
  function key(x, y) { return x + ',' + y; }
  var blocked = {};
  SERVERS.forEach(function (s) { blocked[key(s[0], s[1])] = 'S'; });
  TERMS.forEach(function (s) { blocked[key(s[0], s[1])] = 'T'; });
  NPCS.forEach(function (n) { blocked[key(n.x, n.y)] = 'N'; });
  var pathTiles = {};
  (function () {
    var x, y;
    for (y = 6; y <= 11; y++) pathTiles[key(2, y)] = 1;
    for (x = 2; x <= 21; x++) pathTiles[key(x, 11)] = 1;
    for (y = 4; y <= 11; y++) pathTiles[key(21, y)] = 1;
    for (x = 3; x <= 21; x++) pathTiles[key(x, 4)] = 1;
  })();
  function isWall(x, y) { return x <= 0 || y <= 0 || x >= W - 1 || y >= H - 1; }
  function isBlocked(x, y) { return isWall(x, y) || !!blocked[key(x, y)]; }
  function portalAt(x, y) { for (var i = 0; i < PORTALS.length; i++) if (PORTALS[i].x === x && PORTALS[i].y === y) return i; return -1; }
  function npcAt(x, y) { for (var i = 0; i < NPCS.length; i++) if (NPCS[i].x === x && NPCS[i].y === y) return NPCS[i]; return null; }

  /** Pencarian jalur terpendek (BFS) antar-ubin; mengembalikan daftar langkah [dx,dy] atau null. */
  function findPath(sx, sy, tx, ty) {
    if (sx === tx && sy === ty) return [];
    var prev = {}, q = [[sx, sy]], seen = {}; seen[key(sx, sy)] = 1;
    var D = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    while (q.length) {
      var cur = q.shift();
      for (var i = 0; i < 4; i++) {
        var nx = cur[0] + D[i][0], ny = cur[1] + D[i][1], k = key(nx, ny);
        if (seen[k] || isBlocked(nx, ny)) continue;
        seen[k] = 1; prev[k] = [cur[0], cur[1], D[i][0], D[i][1]];
        if (nx === tx && ny === ty) {
          var out = [], c = k;
          while (prev[c]) { var p = prev[c]; out.unshift([p[2], p[3]]); c = key(p[0], p[1]); }
          return out;
        }
        q.push([nx, ny]);
      }
    }
    return null;
  }

  function rnd(seed) { return function () { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }

  function buildBase() {
    var c = document.createElement('canvas'); c.width = W * T; c.height = H * T;
    var g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    var r = rnd(7);
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
      var px = x * T, py = y * T;
      var danger = x >= 1 && x <= 7 && y >= 1 && y <= 4;
      if (isWall(x, y)) {
        g.fillStyle = '#0b1220'; g.fillRect(px, py, T, T);
        g.fillStyle = '#111827'; g.fillRect(px + 2, py + 2, T - 4, T - 4);
        g.fillStyle = '#4c1d95'; g.fillRect(px, py + T - 3, T, 3);
        if (r() < .25) { g.fillStyle = r() < .5 ? '#22d3ee' : '#A855F7'; g.fillRect(px + 6 + Math.floor(r() * 16), py + 8 + Math.floor(r() * 10), 3, 3); }
        continue;
      }
      g.fillStyle = danger ? ((x + y) % 2 ? '#2a1530' : '#2d1736') : ((x + y) % 2 ? '#1a2332' : '#1c2638');
      g.fillRect(px, py, T, T);
      g.fillStyle = danger ? '#4a1d3a' : '#273449'; g.fillRect(px, py, T, 1); g.fillRect(px, py, 1, T);
      if (pathTiles[key(x, y)]) {
        g.fillStyle = '#1e293b'; g.fillRect(px + 1, py + 1, T - 2, T - 2);
        g.fillStyle = '#2563EB';
        g.fillRect(px + 6, py + 15, 6, 2); g.fillRect(px + 20, py + 15, 6, 2);
        g.fillRect(px + 15, py + 6, 2, 6); g.fillRect(px + 15, py + 20, 2, 6);
      }
    }
    SERVERS.forEach(function (s) {
      var px = s[0] * T, py = s[1] * T;
      g.fillStyle = '#0b1220'; g.fillRect(px + 3, py + 3, 26, 28);
      g.fillStyle = '#4b5563'; g.fillRect(px + 2, py + 1, 26, 28);
      g.fillStyle = '#1f2937'; g.fillRect(px + 4, py + 3, 22, 24);
      for (var i = 0; i < 4; i++) {
        g.fillStyle = '#374151'; g.fillRect(px + 6, py + 5 + i * 6, 18, 4);
        g.fillStyle = r() < .6 ? '#22C55E' : '#EAB308'; g.fillRect(px + 8, py + 6 + i * 6, 2, 2);
        g.fillStyle = '#6b7280'; g.fillRect(px + 14, py + 6 + i * 6, 8, 2);
      }
    });
    TERMS.forEach(function (s) {
      var px = s[0] * T, py = s[1] * T;
      g.fillStyle = '#0b1220'; g.fillRect(px + 3, py + 17, 26, 12);
      g.fillStyle = '#4b5563'; g.fillRect(px + 2, py + 16, 26, 11);
      g.fillStyle = '#374151'; g.fillRect(px + 12, py + 24, 8, 3);
      g.fillStyle = '#374151'; g.fillRect(px + 5, py + 3, 22, 15);
      g.fillStyle = '#052e16'; g.fillRect(px + 7, py + 5, 18, 11);
      g.fillStyle = '#22C55E'; g.fillRect(px + 9, py + 7, 8, 2); g.fillRect(px + 9, py + 11, 12, 2);
    });
    return c;
  }

  var STATUS_COLOR = { available: '#60a5fa', completed: '#22C55E', locked: '#6B7280', soon: '#A855F7' };
  var PLAYER_SAY = ['Halo!', 'Siap!', 'Ayo!', 'Semangat!'];

  /**
   * start(opts): opts = { canvas, getStatus(i), onPortal(i), onNpc(id), onHover(info|null),
   *                       reduceMotion(), spawn:{x,y}, finalIndex, unlock, alert(id) }
   * Mengembalikan { destroy, step, interact, attachPad, pos, emote, goTo }.
   */
  function start(opts) {
    var canvas = opts.canvas, ctx = canvas.getContext('2d');
    canvas.width = W * T; canvas.height = H * T; ctx.imageSmoothingEnabled = false;
    var base = buildBase();
    var x = (opts.spawn || START).x, y = (opts.spawn || START).y;
    var rx = x, ry = y, face = 1, raf = 0, dead = false, lastKey = 0, lastHover = '';
    var timers = [], walkTimer = null, walkPath = null, marker = null, hopT = 0, pSay = null;
    var motes = [], puffs = [], sparks = [], unlockT0 = 0;
    var unlockIdx = (opts.unlock === undefined || opts.unlock === null) ? -1 : opts.unlock;
    for (var q = 0; q < 28; q++) motes.push({ x: Math.random() * W * T, y: Math.random() * H * T, s: 8 + Math.random() * 16, c: Math.random() < .5 ? '#22d3ee' : '#A855F7', p: Math.random() * 6 });
    var pathList = Object.keys(pathTiles).map(function (k) { var a = k.split(','); return { x: +a[0], y: +a[1] }; });
    function statusOf(i, t) {
      if (i === unlockIdx && (!unlockT0 || t - unlockT0 < 800)) return 'locked';
      return opts.getStatus(i);
    }

    function modalOpen() {
      var m = document.getElementById('modal-root'), c = document.getElementById('cine-root');
      return !!((m && m.childElementCount) || (c && c.childElementCount));
    }
    function hover() {
      var info = null, pi = portalAt(x, y);
      if (pi >= 0) info = { type: 'portal', index: pi };
      else {
        [[1, 0], [-1, 0], [0, 1], [0, -1]].some(function (d) { var n = npcAt(x + d[0], y + d[1]); if (n) { info = { type: 'npc', id: n.id }; return true; } return false; });
      }
      var sig = info ? info.type + ':' + (info.id || info.index) : '';
      if (sig !== lastHover) { lastHover = sig; if (opts.onHover) opts.onHover(info); }
    }
    function cancelWalk() { clearInterval(walkTimer); walkTimer = null; walkPath = null; }

    function step(dx, dy, auto) {
      if (dead || modalOpen()) return false;
      if (!auto) cancelWalk();
      if (dx) face = dx < 0 ? -1 : 1;
      var nx = x + dx, ny = y + dy, npc = npcAt(nx, ny);
      if (npc) { hover(); if (opts.onNpc) opts.onNpc(npc.id); return false; }
      if (isBlocked(nx, ny)) return false;
      puffs.push({ x: x * T + T / 2, y: y * T + T - 6, t: performance.now() });
      x = nx; y = ny; hover();
      var pi = portalAt(x, y);
      if (pi >= 0 && opts.onPortal) opts.onPortal(pi);
      return true;
    }
    function interact() {
      if (dead || modalOpen()) return;
      cancelWalk();
      var pi = portalAt(x, y);
      if (pi >= 0) { if (opts.onPortal) opts.onPortal(pi); return; }
      var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      for (var i = 0; i < dirs.length; i++) { var n = npcAt(x + dirs[i][0], y + dirs[i][1]); if (n) { if (opts.onNpc) opts.onNpc(n.id); return; } }
    }
    function emote(text) { hopT = performance.now(); pSay = { text: text || PLAYER_SAY[Math.floor(Math.random() * PLAYER_SAY.length)], until: hopT + 1500 }; }

    /** Klik ubin: berjalan otomatis (jalur terpendek). Klik NPC = berjalan ke sebelahnya lalu bicara. */
    function goTo(tx, ty) {
      if (dead || modalOpen()) return false;
      cancelWalk();
      var npc = npcAt(tx, ty), path = null, after = null;
      if (npc) {
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
          var nx = tx + d[0], ny = ty + d[1]; if (isBlocked(nx, ny)) return;
          var p = findPath(x, y, nx, ny); if (p && (!path || p.length < path.length)) path = p;
        });
        after = function () { if (opts.onNpc) opts.onNpc(npc.id); };
      } else {
        if (isBlocked(tx, ty)) return false;
        path = findPath(x, y, tx, ty);
      }
      if (!path) return false;
      marker = { x: tx, y: ty, t: performance.now() };
      walkPath = path;
      walkTimer = setInterval(function () {
        if (dead || modalOpen() || !walkPath) { cancelWalk(); return; }
        var s = walkPath.shift();
        if (!s) { cancelWalk(); if (after) after(); return; }
        if (!step(s[0], s[1], true)) cancelWalk();
      }, 105);
      return true;
    }
    function onClick(e) {
      if (dead || modalOpen()) return;
      var r = canvas.getBoundingClientRect();
      var tx = Math.floor((e.clientX - r.left) / r.width * W), ty = Math.floor((e.clientY - r.top) / r.height * H);
      if (tx < 0 || ty < 0 || tx >= W || ty >= H) return;
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
      ctx.font = '8px "Press Start 2P", "Courier New", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      var w = Math.ceil(ctx.measureText(text).width) + 14, bx = Math.max(2, Math.min(W * T - w - 2, cx - w / 2));
      ctx.fillStyle = '#0b1220'; ctx.fillRect(bx - 2, by - 20, w + 4, 22);
      ctx.fillStyle = '#F9FAFB'; ctx.fillRect(bx, by - 18, w, 18);
      ctx.fillStyle = '#F9FAFB'; ctx.fillRect(cx - 3, by, 6, 4);
      ctx.fillStyle = '#111827'; ctx.fillText(text, bx + w / 2, by - 8);
    }
    function drawPortal(i, t) {
      var p = PORTALS[i], st = statusOf(i, t), col = STATUS_COLOR[st] || STATUS_COLOR.locked;
      if (i === opts.finalIndex && st === 'available') col = '#EF4444';
      var cx = p.x * T + T / 2, cy = p.y * T + T / 2;
      var pulse = (opts.reduceMotion && opts.reduceMotion()) ? 0 : Math.sin(t / 380 + i);
      var half = 13 + pulse * 1.5;
      ctx.globalAlpha = st === 'locked' || st === 'soon' ? .75 : 1;
      ctx.fillStyle = '#0b1220'; ctx.fillRect(cx - 15, cy - 15, 30, 30);
      ctx.fillStyle = col; ctx.fillRect(cx - half, cy - half, half * 2, 3); ctx.fillRect(cx - half, cy + half - 3, half * 2, 3);
      ctx.fillRect(cx - half, cy - half, 3, half * 2); ctx.fillRect(cx + half - 3, cy - half, 3, half * 2);
      ctx.globalAlpha = (st === 'available' ? .30 + (pulse + 1) * .12 : .18);
      ctx.fillStyle = col; ctx.fillRect(cx - half + 3, cy - half + 3, half * 2 - 6, half * 2 - 6);
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#F9FAFB'; ctx.font = '12px "Press Start 2P", "Courier New", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if (st === 'completed') {
        ctx.fillStyle = '#22C55E';
        [[-6, 0], [-4, 2], [-2, 4], [0, 2], [2, 0], [4, -2], [6, -4]].forEach(function (d) { ctx.fillRect(cx + d[0] - 1, cy + d[1] - 1, 3, 3); });
      } else if (st === 'locked' || st === 'soon') {
        ctx.fillStyle = '#9CA3AF'; ctx.fillRect(cx - 5, cy - 1, 10, 8); ctx.fillRect(cx - 3, cy - 6, 2, 5); ctx.fillRect(cx + 1, cy - 6, 2, 5); ctx.fillRect(cx - 3, cy - 6, 6, 2);
        ctx.fillStyle = '#111827'; ctx.fillRect(cx - 1, cy + 2, 2, 3);
      } else {
        ctx.fillText(opts.finalIndex === i ? '!' : String(i + 1), cx + 1, cy + 1);
      }
      if ((st === 'available' || st === 'completed') && !(opts.reduceMotion && opts.reduceMotion())) {
        ctx.fillStyle = col;
        for (var k = 0; k < 4; k++) { var a = t / 650 + k * Math.PI / 2; ctx.fillRect(Math.round(cx + Math.cos(a) * 19) - 1, Math.round(cy + Math.sin(a) * 19) - 1, 3, 3); }
      }
    }
    var curT = 0;
    function sprH(key) { return CHAR_KEYS[key] ? 48 : 27; }
    function drawSprite(key, tx, ty, flip, bob, frame) {
      var isC = !!CHAR_KEYS[key], sc = isC ? 2 : 3, w = isC ? 36 : 24, h = sprH(key);
      var px = tx * T + (T - w) / 2, py = ty * T + T - h - 1 - (bob || 0);
      ctx.fillStyle = 'rgba(0,0,0,.35)'; var sh = Math.max(8, T - 12 - (bob || 0)); ctx.fillRect(tx * T + (T - sh) / 2, ty * T + T - 5, sh, 4);
      var tier = tierOf(key), calm = !!(opts.reduceMotion && opts.reduceMotion());
      if (tier && isC) window.GQChars.fxBack(ctx, px + w / 2, ty * T + T - 3, h, tier, calm ? 0 : curT, specOf(key).accent);
      drawChar(ctx, key, px, py, sc, frame, flip, calm ? 0 : curT);
      if (tier && isC) window.GQChars.fxFront(ctx, px + w / 2, ty * T + T - 3, h, tier, calm ? 0 : curT, specOf(key).accent);
    }

    function frame(t) {
      if (dead) return;
      curT = t;
      rx += (x - rx) * .35; ry += (y - ry) * .35;
      if (Math.abs(x - rx) < .02) rx = x;
      if (Math.abs(y - ry) < .02) ry = y;
      var moving = rx !== x || ry !== y;
      var calm = !!(opts.reduceMotion && opts.reduceMotion());
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(base, 0, 0);
      if (!calm) {
        pathList.forEach(function (pt) { ctx.globalAlpha = .06 + .12 * Math.max(0, Math.sin(t / 420 - (pt.x + pt.y) * .55)); ctx.fillStyle = '#60a5fa'; ctx.fillRect(pt.x * T + 2, pt.y * T + 2, T - 4, T - 4); });
        ctx.globalAlpha = 1;
      }
      if (unlockIdx >= 0 && !unlockT0) {
        unlockT0 = t; var up0 = PORTALS[unlockIdx];
        for (var b = 0; b < 40; b++) { var ang = Math.random() * Math.PI * 2, sp = 1 + Math.random() * 3; sparks.push({ x: up0.x * T + T / 2, y: up0.y * T + T / 2, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: 1, c: Math.random() < .5 ? '#60a5fa' : '#EAB308' }); }
        canvas.classList.add('unlocking'); setTimeout(function () { canvas.classList.remove('unlocking'); }, 700);
      }
      for (var i = 0; i < PORTALS.length; i++) drawPortal(i, t);
      if (marker) {   // penanda tujuan klik
        var ma = 1 - (performance.now() - marker.t) / 700;
        if (ma <= 0) marker = null;
        else { ctx.globalAlpha = ma; ctx.strokeStyle = '#EAB308'; ctx.lineWidth = 2; var rr = 6 + (1 - ma) * 8; ctx.strokeRect(marker.x * T + T / 2 - rr, marker.y * T + T / 2 - rr, rr * 2, rr * 2); ctx.globalAlpha = 1; }
      }
      var now = performance.now();
      var list = NPCS.map(function (n) {
        // sapaan saat pemain mendekat
        var d = Math.abs(rx - n.x) + Math.abs(ry - n.y);
        if (d <= 2.5 && !n.near) { n.near = true; if (now - (n.lastSay || -99999) > 7000) { n.bub = { text: n.say[Math.floor(Math.random() * n.say.length)], until: now + 2400 }; n.lastSay = now; n.hopT = now; } }
        else if (d > 3.6) n.near = false;
        return { y: n.y, draw: function () {
          var jx = (n.sprite === 'glitch' && Math.sin(t / 110) > .93) ? (Math.random() < .5 ? -2 : 2) : 0;
          var idle = n.sprite === 'bugbyte' ? Math.round(2 + Math.sin(t / 300)) : (n.sprite === 'glitch' ? Math.round(Math.abs(Math.sin(t / 250)) * 2) : Math.round(Math.max(0, Math.sin(t / 600 + n.x)) * 1.5));
          var hop = n.hopT && now - n.hopT < 420 ? Math.sin((now - n.hopT) / 420 * Math.PI) * 10 : 0;
          var fl = d <= 4 ? (rx < n.x ? -1 : 1) : 1;   // NPC menoleh ke pemain
          var fr = calm ? 'idle' : (Math.floor(t / 420 + n.x) % 2 ? 'walk2' : 'idle');
          drawSprite(n.sprite, n.x + jx / T, n.y, fl, (calm ? 0 : idle) + hop, fr);
          var top = n.y * T + T - sprH(n.sprite) - 6 - (calm ? 0 : idle) - hop, cx = n.x * T + T / 2;
          if (n.bub && now < n.bub.until) bubble(n.bub.text, cx, top);
          else if (opts.alert && opts.alert(n.id)) {
            var by = top - (calm ? 0 : Math.round(Math.abs(Math.sin(t / 260)) * 4));
            ctx.fillStyle = '#EAB308'; ctx.fillRect(cx - 7, by - 14, 14, 14); ctx.fillStyle = '#111827';
            ctx.font = '10px "Press Start 2P", "Courier New", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('!', cx + 1, by - 6);
          }
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
      if (!calm) {
        ctx.globalAlpha = .05; ctx.fillStyle = '#93c5fd'; ctx.fillRect(((t / 18) % (W * T + 160)) - 80, 0, 50, H * T);
        motes.forEach(function (m) {
          m.y -= m.s * .016; m.x += Math.sin(t / 900 + m.p) * .2; if (m.y < -4) { m.y = H * T + 4; m.x = Math.random() * W * T; }
          ctx.globalAlpha = .3 + .35 * Math.sin(t / 500 + m.p); ctx.fillStyle = m.c; ctx.fillRect(Math.round(m.x), Math.round(m.y), 3, 3);
        });
        ctx.globalAlpha = 1;
      }
      puffs = puffs.filter(function (p) { var a = 1 - (now - p.t) / 450; if (a <= 0) return false; ctx.globalAlpha = a * .5; ctx.fillStyle = p.gold ? '#ffd34d' : '#9CA3AF'; var sz = 3 + (1 - a) * 5; ctx.fillRect(p.x - sz / 2, p.y - (1 - a) * 6, sz, sz); return true; });
      ctx.globalAlpha = 1;
      if (unlockIdx >= 0 && unlockT0) {
        var e = t - unlockT0, up = PORTALS[unlockIdx], ucx = up.x * T + T / 2, ucy = up.y * T + T / 2;
        if (e < 2400) {
          for (var k = 0; k < 3; k++) { var r = (e - 700 - k * 300) / 1000 * 80; if (r > 0 && r < 80) { ctx.globalAlpha = 1 - r / 80; ctx.strokeStyle = '#60a5fa'; ctx.lineWidth = 3; ctx.strokeRect(ucx - r, ucy - r, r * 2, r * 2); } }
          if (e > 700 && e < 900) { ctx.globalAlpha = (900 - e) / 200; ctx.fillStyle = '#F9FAFB'; ctx.fillRect(ucx - 20, ucy - 20, 40, 40); }
          ctx.globalAlpha = 1;
        }
        sparks = sparks.filter(function (sp) { if (e < 700) return true; sp.x += sp.vx; sp.y += sp.vy; sp.life -= .018; if (sp.life <= 0) return false; ctx.globalAlpha = sp.life; ctx.fillStyle = sp.c; ctx.fillRect(Math.round(sp.x), Math.round(sp.y), 3, 3); return true; });
        ctx.globalAlpha = 1;
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    hover();

    return {
      step: step, interact: interact, attachPad: attachPad, emote: emote, goTo: goTo,
      pos: function () { return { x: x, y: y }; },
      destroy: function () {
        dead = true; cancelAnimationFrame(raf); cancelWalk();
        document.removeEventListener('keydown', onKey); canvas.removeEventListener('click', onClick);
        timers.forEach(function (f) { f(); });
      }
    };
  }

  window.GQWorld = {
    start: start, PORTALS: PORTALS, START: START, NPCS: NPCS, W: W, H: H, T: T,
    charCanvas: charCanvas, drawChar: drawChar, sprite: sprite, findPath: findPath
  };
})();

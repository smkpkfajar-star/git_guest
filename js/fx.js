/* fx.js — efek visual: latar ambien bertema tiap stage, panorama splash bergaya Minecraft,
   dan efek mengetik. Hanya menggambar di <canvas>; tidak memengaruhi logika game. */
(function () {
  'use strict';

  function loop(fn, fps) {
    var last = 0, raf = 0, dead = false;
    function f(t) {
      if (dead) return;
      raf = requestAnimationFrame(f);
      if (t - last < 1000 / fps) return;
      var dt = Math.min(.1, (t - last) / 1000); last = t; fn(t, dt);
    }
    raf = requestAnimationFrame(f);
    return function () { dead = true; cancelAnimationFrame(raf); };
  }
  function fit(canvas) {
    var p = canvas.parentElement, w = (p && p.clientWidth) || window.innerWidth, h = (p && p.clientHeight) || window.innerHeight;
    canvas.width = w; canvas.height = h; return [w, h];
  }
  function rng(seed) { return function () { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }
  function mixHex(a, b, t) {
    var pa = [1, 3, 5].map(function (i) { return parseInt(a.slice(i, i + 2), 16); }), pb = [1, 3, 5].map(function (i) { return parseInt(b.slice(i, i + 2), 16); });
    return 'rgb(' + pa.map(function (v, i) { return Math.round(v + (pb[i] - v) * t); }).join(',') + ')';
  }
  function mixRGB(a, b, t) { return [0, 1, 2].map(function (i) { return Math.round(a[i] + (b[i] - a[i]) * t); }); }
  function hexRGB(h) { return [1, 3, 5].map(function (i) { return parseInt(h.slice(i, i + 2), 16); }); }
  var rgb = function (c) { return 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')'; };

  /* ===================== LATAR AMBIEN PER STAGE ===================== */
  function ambient(canvas, theme, opts) {
    var ctx = canvas.getContext('2d'), W = 0, H = 0, parts = [], cols = [], flash = 0, bolt = null, nextBolt = 4;
    var rand = Math.random;
    var calm = function () { return !!(opts && opts.reduce && opts.reduce()); };
    var PRE = ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore'];
    var COLORS = ['96,165,250', '168,85,247', '34,197,94', '234,179,8'];

    function init() {
      parts = []; cols = []; var i, n;
      if (theme === 'vcs') { n = Math.round(W / 26); for (i = 0; i < n; i++) parts.push({ x: rand() * W, y: rand() * H, vy: 10 + rand() * 26, ch: rand() < .5 ? '0' : '1', a: .12 + rand() * .3 }); }
      else if (theme === 'three-zones') { parts = [{ c: '37,99,235' }, { c: '234,179,8' }, { c: '34,197,94' }].map(function (o, k) { return { x: W * (.18 + .32 * k), y: H * (.3 + .4 * rand()), r: Math.max(W, H) * .24, ph: k * 2.1, c: o.c }; }); }
      else if (theme === 'setup' || theme === 'commands') { var cw = 18; for (var x = 0; x < W; x += cw) cols.push({ x: x, y: rand() * H, v: (theme === 'commands' ? 190 : 80) + rand() * 90, len: 6 + Math.floor(rand() * 8), seed: rand() }); }
      else if (theme === 'commit') { n = Math.round(W / 100); for (i = 0; i < n; i++) parts.push({ x: rand() * W, y: rand() * H, vx: 14 + rand() * 24, vy: -8 - rand() * 14, t: PRE[Math.floor(rand() * PRE.length)], a: .18 + rand() * .22, c: COLORS[Math.floor(rand() * 4)] }); }
      else if (theme === 'gitignore') { parts = [{ y: 0, v: 70 }, { y: H * .5, v: -55 }, { y: H * .3, v: 95 }]; for (i = 0; i < 40; i++) parts.push({ dust: 1, x: rand() * W, y: rand() * H, vy: -4 - rand() * 8, a: .1 + rand() * .2 }); }
      else if (theme === 'final') { n = Math.round(W / 14); for (i = 0; i < n; i++) parts.push({ x: rand() * W, y: H + rand() * H, vy: 30 + rand() * 70, vx: (rand() - .5) * 20, s: 2 + Math.floor(rand() * 3), c: rand() < .5 ? '239,68,68' : '249,115,22', a: .3 + rand() * .5 }); }
      else { n = Math.round(W * H / 9000); for (i = 0; i < n; i++) parts.push({ x: rand() * W, y: rand() * H, s: rand() < .2 ? 3 : 2, ph: rand() * 6 }); }
    }

    function draw(t, dt, still) {
      ctx.clearRect(0, 0, W, H);
      var i, p;
      if (theme === 'vcs') {
        ctx.font = '12px "JetBrains Mono", Consolas, monospace'; ctx.textBaseline = 'top';
        for (i = 0; i < parts.length; i++) { p = parts[i]; if (!still) { p.y -= p.vy * dt; if (p.y < -14) { p.y = H + 4; p.x = rand() * W; } } ctx.fillStyle = 'rgba(96,165,250,' + p.a + ')'; ctx.fillText(p.ch, p.x, p.y); }
      } else if (theme === 'three-zones') {
        for (i = 0; i < parts.length; i++) {
          p = parts[i]; var px = p.x + Math.sin(t / 2600 + p.ph) * 60, py = p.y + Math.cos(t / 3100 + p.ph) * 40;
          var g = ctx.createRadialGradient(px, py, 0, px, py, p.r); g.addColorStop(0, 'rgba(' + p.c + ',.16)'); g.addColorStop(1, 'rgba(' + p.c + ',0)');
          ctx.fillStyle = g; ctx.fillRect(px - p.r, py - p.r, p.r * 2, p.r * 2);
        }
      } else if (theme === 'setup' || theme === 'commands') {
        ctx.font = '14px "JetBrains Mono", Consolas, monospace'; ctx.textBaseline = 'top';
        var chars = theme === 'commands' ? 'gitaddcommitstatusdifflog-<>$' : '01{}()=>$_;';
        for (i = 0; i < cols.length; i++) {
          var c = cols[i]; if (!still) { c.y += c.v * dt; if (c.y - c.len * 16 > H) { c.y = -rand() * 200; c.v = (theme === 'commands' ? 190 : 80) + rand() * 90; } }
          for (var k = 0; k < c.len; k++) { var yy = c.y - k * 16; if (yy < -16 || yy > H) continue; var ch = chars[Math.floor((c.seed * 997 + k * 13 + Math.floor(t / 180)) % chars.length)]; ctx.fillStyle = k === 0 ? 'rgba(220,255,230,.55)' : 'rgba(' + (theme === 'commands' ? '34,211,238' : '34,197,94') + ',' + (.3 * (1 - k / c.len)) + ')'; ctx.fillText(ch, c.x, yy); }
        }
        if (theme === 'commands' && !still) { for (i = 0; i < 3; i++) { var sy = ((t / 6 + i * 311) % (H + 100)) - 50; ctx.fillStyle = 'rgba(34,211,238,.07)'; ctx.fillRect(0, sy, W, 2); } }
      } else if (theme === 'commit') {
        ctx.font = '11px "JetBrains Mono", Consolas, monospace'; ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
        for (i = 0; i < parts.length; i++) {
          p = parts[i]; if (!still) { p.x += p.vx * dt; p.y += p.vy * dt; if (p.x > W + 60 || p.y < -30) { p.x = -60; p.y = rand() * H + 20; } }
          ctx.fillStyle = 'rgba(' + p.c + ',' + (p.a * .5) + ')'; ctx.fillRect(p.x - 34, p.y - 11, 68, 22); ctx.strokeStyle = 'rgba(' + p.c + ',' + p.a + ')'; ctx.lineWidth = 2; ctx.strokeRect(p.x - 34, p.y - 11, 68, 22);
          ctx.fillStyle = 'rgba(' + p.c + ',' + Math.min(1, p.a * 2.2) + ')'; ctx.fillText(p.t + ':', p.x, p.y);
        }
        ctx.textAlign = 'start';
      } else if (theme === 'gitignore') {
        for (i = 0; i < parts.length; i++) {
          p = parts[i];
          if (p.dust) { if (!still) { p.y += p.vy * dt; if (p.y < -4) { p.y = H + 4; p.x = rand() * W; } } ctx.fillStyle = 'rgba(248,113,113,' + p.a + ')'; ctx.fillRect(p.x, p.y, 2, 2); continue; }
          if (!still) { p.y += p.v * dt; if (p.y > H + 4 || p.y < -4) p.v = -p.v; }
          var lg = ctx.createLinearGradient(0, p.y - 12, 0, p.y + 12); lg.addColorStop(0, 'rgba(239,68,68,0)'); lg.addColorStop(.5, 'rgba(239,68,68,.28)'); lg.addColorStop(1, 'rgba(239,68,68,0)');
          ctx.fillStyle = lg; ctx.fillRect(0, p.y - 12, W, 24); ctx.fillStyle = 'rgba(254,202,202,.35)'; ctx.fillRect(0, p.y, W, 1);
        }
      } else if (theme === 'final') {
        for (i = 0; i < parts.length; i++) { p = parts[i]; if (!still) { p.y -= p.vy * dt; p.x += p.vx * dt; if (p.y < -6) { p.y = H + 6; p.x = rand() * W; } } ctx.fillStyle = 'rgba(' + p.c + ',' + p.a + ')'; ctx.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s); }
        if (!still) {
          nextBolt -= dt; if (nextBolt <= 0) { nextBolt = 3 + rand() * 5; flash = .25; var bx = rand() * W, pts = [[bx, 0]], by = 0; while (by < H * .7) { by += 30 + rand() * 40; bx += (rand() - .5) * 70; pts.push([bx, by]); } bolt = pts; }
          if (flash > 0) { ctx.fillStyle = 'rgba(255,255,255,' + flash + ')'; ctx.fillRect(0, 0, W, H); flash -= dt * .9; if (bolt) { ctx.strokeStyle = 'rgba(216,180,254,' + Math.min(1, flash * 4) + ')'; ctx.lineWidth = 3; ctx.beginPath(); bolt.forEach(function (q, k) { if (k) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); }); ctx.stroke(); } } else bolt = null;
        }
      } else {
        for (i = 0; i < parts.length; i++) { p = parts[i]; ctx.globalAlpha = still ? .6 : .25 + .6 * Math.max(0, Math.sin(t / 700 + p.ph)); ctx.fillStyle = '#F9FAFB'; ctx.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s); }
        ctx.globalAlpha = 1;
      }
    }

    function resize() { var s = fit(canvas); W = s[0]; H = s[1]; init(); draw(0, 0, true); }
    resize();
    window.addEventListener('resize', resize);
    var stop = null;
    if (!calm()) stop = loop(function (t, dt) { if (calm()) return; draw(t, dt, false); }, 30);
    return { destroy: function () { if (stop) stop(); window.removeEventListener('resize', resize); } };
  }

  /* ===================== PANORAMA SPLASH (ala Minecraft) ===================== */
  var DAY = { top: '#5aa9ff', bot: '#cfe8ff', mt: '#7f95bd', hill: '#4a9a3a', hd: '#2f6f2a', grass: '#5fbf3f', dirt: '#7a5a3a', cloud: '#ffffff' };
  var DUSK = { top: '#3a2a7a', bot: '#ffa35a', mt: '#5a4a7a', hill: '#2f5a3a', hd: '#1f3a2a', grass: '#3f8f3f', dirt: '#5a3a2a', cloud: '#ffc9a0' };
  var NIGHT = { top: '#050818', bot: '#1c2250', mt: '#1c2244', hill: '#12302a', hd: '#0a1f1a', grass: '#1f6a3a', dirt: '#3a2a1a', cloud: '#34457a' };
  function smooth(a, b, x) { var t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
  function palette(e) {   // e = ketinggian matahari (-1..1)
    var dw = smooth(.05, .4, e), nw = smooth(.05, .4, -e), dk = Math.max(0, 1 - dw - nw), out = {};
    Object.keys(DAY).forEach(function (k) {
      var a = hexRGB(DAY[k]), b = hexRGB(DUSK[k]), c = hexRGB(NIGHT[k]);
      out[k] = rgb([0, 1, 2].map(function (i) { return Math.round(a[i] * dw + b[i] * dk + c[i] * nw); }));
    });
    return out;
  }

  function panorama(canvas, opts) {
    var ctx = canvas.getContext('2d'), S = 4, bw = 0, bh = 0, len = 0, mt = [], hl = [], trees = [], clouds = [], stars = [], cast = null, flies = [], leaves = [];
    var calm = function () { return !!(opts && opts.reduce && opts.reduce()); };
    var W3 = window.GQWorld;
    function build() {
      var r = rng(5), TAU = Math.PI * 2; len = bw * 3; mt = []; hl = []; trees = []; clouds = []; stars = [];
      for (var i = 0; i < len; i++) {
        mt[i] = Math.round(bh * .4 + Math.sin(TAU * 3 * i / len) * bh * .06 + Math.sin(TAU * 7 * i / len + 2) * bh * .035 + Math.sin(TAU * 19 * i / len) * 1.5);
        hl[i] = Math.round(bh * .6 + Math.sin(TAU * 5 * i / len + 1) * bh * .045 + Math.sin(TAU * 13 * i / len) * 1.5);
      }
      for (i = 0; i < len; i += 8 + Math.floor(r() * 12)) trees.push({ x: i, h: 3 + Math.floor(r() * 3) });
      for (i = 0; i < 8; i++) clouds.push({ x: r() * len, y: Math.floor(bh * (.08 + r() * .24)), w: 8 + Math.floor(r() * 12), sp: .5 + r() * .7 });
      flies = []; leaves = [];
      for (i = 0; i < 26; i++) flies.push({ x: r() * bw, y: bh * (.55 + r() * .35), ph: r() * 6, sp: .4 + r() });
      for (i = 0; i < 16; i++) leaves.push({ x: r() * bw, y: r() * bh, ph: r() * 6, sp: 2 + r() * 3, c: r() < .5 ? '#7bd44a' : '#e0a030' });
      for (i = 0; i < 70; i++) stars.push({ x: Math.floor(r() * bw), y: Math.floor(r() * bh * .5), ph: r() * 6 });
    }
    function setup() {
      var w = canvas.clientWidth || window.innerWidth, h = canvas.clientHeight || window.innerHeight; canvas.width = w; canvas.height = h;
      S = Math.max(3, Math.round(h / 150)); bw = Math.ceil(w / S) + 2; bh = Math.ceil(h / S) + 1; ctx.imageSmoothingEnabled = false; build();
    }
    var t0 = null;
    function draw(t) {
      if (t0 === null) t0 = t; var el = (t - t0) / 1000, still = calm();
      var k = (still ? .08 : (el / 70 + .08)) % 1, a = k * Math.PI * 2, e = Math.sin(a);
      var P = palette(e), w = canvas.width, h = canvas.height;
      for (var y = 0; y < bh; y++) { ctx.fillStyle = mixHex('#000000', '#000000', 0); var f = y / bh; var tp = P.top.match(/\d+/g).map(Number), bt = P.bot.match(/\d+/g).map(Number); ctx.fillStyle = rgb(mixRGB(tp, bt, f)); ctx.fillRect(0, y * S, w, S); }
      // bintang
      var sa = Math.max(0, Math.min(1, -e * 1.8));
      if (sa > .02) stars.forEach(function (s) { ctx.globalAlpha = sa * (.4 + .6 * Math.max(0, Math.sin(el * 1.5 + s.ph))); ctx.fillStyle = '#fff'; ctx.fillRect(s.x * S, s.y * S, S, S); });
      ctx.globalAlpha = 1;
      // matahari & bulan (kotak, seperti Minecraft)
      var sx = w * (.5 + .44 * Math.cos(a - Math.PI / 2 + Math.PI / 2)), sy = h * .62 - h * .55 * Math.sin(a);
      var bs = S * 7;
      if (sy < h * .66) { ctx.fillStyle = '#fff6b0'; ctx.fillRect(sx - bs / 2, sy - bs / 2, bs, bs); ctx.fillStyle = '#ffe14d'; ctx.fillRect(sx - bs / 2 + S, sy - bs / 2 + S, bs - 2 * S, bs - 2 * S); }
      var mx = w * (.5 - .44 * Math.cos(a)), my = h * .62 + h * .55 * Math.sin(a);
      if (my < h * .66 && e < .2) { ctx.fillStyle = '#e8ecf5'; ctx.fillRect(mx - bs / 2, my - bs / 2, bs, bs); ctx.fillStyle = '#b8c0d8'; ctx.fillRect(mx - bs / 2 + S, my - bs / 2 + S * 2, S * 2, S * 2); }
      // awan
      ctx.fillStyle = P.cloud; ctx.globalAlpha = .9;
      clouds.forEach(function (c) { var cx = ((c.x + el * c.sp * 1.2) % (len)) - c.w; var sxp = (cx % len) * S; if (sxp > w + 40 * S) return; ctx.fillRect(sxp, c.y * S, c.w * S, 2 * S); ctx.fillRect(sxp + 2 * S, (c.y - 1) * S, (c.w - 5) * S, S); ctx.fillRect(sxp + S, (c.y + 2) * S, (c.w - 2) * S, S); });
      ctx.globalAlpha = 1;
      if (!still) {
        // bintang jatuh (malam)
        if (sa > .35) { var ph = (el % 5) / .9; if (ph < 1) { var sx0 = w * (.2 + ((Math.floor(el / 5) * 37) % 50) / 100), sy0 = h * .06; for (var tl = 0; tl < 9; tl++) { var pp = Math.max(0, ph - tl * .03); ctx.globalAlpha = (1 - tl / 9) * (1 - ph) * 1.2; ctx.fillStyle = '#fff'; ctx.fillRect(sx0 + pp * w * .35, sy0 + pp * h * .3, S, S); } ctx.globalAlpha = 1; } }
        // burung terbang (siang)
        var da = smooth(.1, .45, e);
        if (da > .05) for (var bi = 0; bi < 4; bi++) { var bx = ((el * (28 + bi * 6) + bi * w * .3) % (w + 80)) - 40, byy = h * (.18 + bi * .05) + Math.sin(el * 2 + bi) * S * 3, up = Math.floor(el * 5 + bi) % 2; ctx.globalAlpha = da * .85; ctx.fillStyle = '#1c2a3a'; ctx.fillRect(bx, byy + (up ? 0 : S), S * 2, S); ctx.fillRect(bx + S * 2, byy + S, S, S); ctx.fillRect(bx + S * 3, byy + (up ? 0 : S), S * 2, S); }
        ctx.globalAlpha = 1;
        // daun berguguran (siang)
        if (da > .05) leaves.forEach(function (lf) { var lx = ((lf.x + el * lf.sp * .6 + Math.sin(el + lf.ph) * 3) % bw + bw) % bw, ly = (lf.y + el * lf.sp) % (bh - 8); ctx.globalAlpha = da * .9; ctx.fillStyle = lf.c; ctx.fillRect(lx * S, ly * S, S, S); }); 
        ctx.globalAlpha = 1;
      }
      var gy = bh - 7;
      // gunung jauh
      var offM = Math.floor(el * 1.4), offH = Math.floor(el * 4);
      for (var x = 0; x < bw; x++) { var im = (x + offM) % len, top = mt[im]; ctx.fillStyle = P.mt; ctx.fillRect(x * S, top * S, S, (gy - top) * S); if ((im % 9) < 2) { ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(x * S, top * S, S, S); } }
      // bukit + pohon
      for (x = 0; x < bw; x++) { var ih = (x + offH) % len, top2 = hl[ih]; ctx.fillStyle = P.hill; ctx.fillRect(x * S, top2 * S, S, (gy - top2) * S); ctx.fillStyle = P.hd; ctx.fillRect(x * S, top2 * S, S, S);
        var hh = ((x + offH) * 2654435761) >>> 0; if (hh % 5 === 0) { var by2 = top2 + 1 + (hh >>> 8) % Math.max(1, gy - top2 - 1); ctx.fillStyle = 'rgba(0,0,0,.14)'; ctx.fillRect(x * S, by2 * S, S, S); } }
      trees.forEach(function (tr) {
        var tx = ((tr.x - offH) % len + len) % len; if (tx >= bw) return; var base = hl[(tx + offH) % len];
        ctx.fillStyle = '#5b3a1e'; ctx.fillRect(tx * S, (base - tr.h) * S, S, tr.h * S);
        ctx.fillStyle = P.hd; ctx.fillRect((tx - 1) * S, (base - tr.h - 3) * S, 3 * S, 3 * S); ctx.fillStyle = P.grass; ctx.fillRect((tx - 1) * S, (base - tr.h - 3) * S, 3 * S, S);
      });
      // tanah (blok rumput + tanah)
      var offG = Math.floor(el * 9);
      for (x = 0; x < bw; x++) {
        ctx.fillStyle = P.grass; ctx.fillRect(x * S, gy * S, S, S);
        for (var yy = gy + 1; yy < bh; yy++) { ctx.fillStyle = P.dirt; ctx.fillRect(x * S, yy * S, S, S); if (((x + offG) * 7 + yy * 13) % 11 === 0) { ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(x * S, yy * S, S, S); } }
        if ((x + offG) % 6 === 0) { ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(x * S, gy * S, S, 1); }
      }
      // karakter berjalan di atas tanah (tiga karakter acak + maskot)
      var GCc = window.GQChars;
      if (W3 && GCc) {
        var cs = Math.max(3, Math.round(S * 1.1)), cm = Math.max(3, Math.round(S * 1.5)), baseY = gy * S, tm = el * 1000;
        var fr = still ? 'idle' : (Math.floor(el * 6) % 2 ? 'walk1' : 'walk2');
        if (!cast) { var all = GCc.LIST.slice().sort(function () { return Math.random() - .5; }); cast = all.slice(0, 3).map(function (c) { return GCc.defaults(c.id); }); }
        var bobf = function (i) { return still ? 0 : Math.abs(Math.sin(el * 8 + i)) * 3; };
        W3.drawChar(ctx, 'glitch', w * .18 + Math.sin(el * 3) * 4, baseY - 8 * cm - bobf(0), cm, fr, 1);
        W3.drawChar(ctx, 'bugbyte', w * .30, baseY - 9 * cm - bobf(1), cm, fr, 1);
        cast.forEach(function (spec, i) { GCc.draw(ctx, spec, w * (.42 + i * .1), baseY - 24 * cs - bobf(i + 2) + cs * 2, cs, fr, 1, tm, 0); });
      }
      glow(t);
    }
    function glow(t) {   // kunang-kunang: malam & senja
      if (calm()) return;
      var el = (t - (t0 || t)) / 1000, e = Math.sin(((el / 70 + .08) % 1) * Math.PI * 2), na = Math.max(0, Math.min(1, .45 - e));
      if (na < .05) return;
      flies.forEach(function (f) {
        var fx = ((f.x + Math.sin(el * f.sp + f.ph) * 6) % bw + bw) % bw, fy = f.y + Math.cos(el * f.sp * 1.3 + f.ph) * 4, a = na * (.35 + .65 * Math.max(0, Math.sin(el * 3 * f.sp + f.ph)));
        ctx.globalAlpha = a * .3; ctx.fillStyle = '#d9ff66'; ctx.fillRect((fx - 1) * S, (fy - 1) * S, S * 3, S * 3);
        ctx.globalAlpha = a; ctx.fillStyle = '#f4ffb0'; ctx.fillRect(fx * S, fy * S, S, S);
      });
      ctx.globalAlpha = 1;
    }
    setup();
    var stop = null; draw(0);
    function onResize() { setup(); draw(performance.now()); }
    window.addEventListener('resize', onResize);
    if (!calm()) stop = loop(function (t) { draw(t); }, 30);
    return { destroy: function () { if (stop) stop(); window.removeEventListener('resize', onResize); } };
  }

  /* ===================== EFEK MENGETIK ===================== */
  function typewriter(el, text, cps, onDone) {
    var i = 0, timer = null, finished = false;
    function finish() { if (finished) return; finished = true; clearInterval(timer); el.textContent = text; if (onDone) onDone(); }
    el.textContent = '';
    if (!cps || window.GQ_FAST) { finish(); return { skip: finish, isDone: function () { return true; } }; }
    timer = setInterval(function () { i++; el.textContent = text.slice(0, i); if (i >= text.length) finish(); }, 1000 / cps);
    return { skip: finish, isDone: function () { return finished; } };
  }

  window.GQFX = { ambient: ambient, panorama: panorama, typewriter: typewriter };
})();

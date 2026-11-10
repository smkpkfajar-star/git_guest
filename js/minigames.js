/* minigames.js — mini-game berwaktu tiap stage:
   sorter (konveyor), typing (fast typing), reposim (simulator repositori),
   sweep (Security Sweep), memory (kartu memori), terminal (terminal berwaktu).

   Kontrak dengan app.js (env):
     env.h, env.icon(name), env.sfx(name), env.relaxed() -> mode santai (waktu 2x)
     env.ctx.hit()                     -> musuh menyerang (tanpa menambah percobaan)
     env.ctx.submit(true,false,{accuracy}) -> ronde selesai
     env.ctx.submit(false,true)        -> ronde gagal (waktu habis / kurang akurat)
   Setiap engine mengembalikan { node, noCheck, hintText, lock, focus, dispose }.
   Tidak ada eval/innerHTML; semua teks lewat textContent. */
(function () {
  'use strict';

  function norm(s) { return String(s).replace(/\s+/g, ' ').trim(); }
  function shuffle(arr, seed) {
    var a = arr.slice(), s = seed || 7;
    for (var i = a.length - 1; i > 0; i--) { s = (s * 1664525 + 1013904223) >>> 0; var j = s % (i + 1); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  /* ---------- kerangka umum: timer, overlay Mulai / Coba Lagi, chip statistik ---------- */
  function frame(env, ch, o) {
    var h = env.h;
    var total = ch.time * (env.relaxed() ? 2 : 1), left = total, timerId = null, running = false, ended = false;
    var barI = h('i');
    var label = h('span', { class: 'mg-time', text: Math.ceil(total) + ' dtk' });
    var chips = h('div', { class: 'mg-chips' });
    var bar = h('div', { class: 'mg-timer', role: 'timer', 'aria-label': 'Sisa waktu' }, barI);
    var head = h('div', { class: 'mg-head' }, bar, label, chips);
    var body = h('div', { class: 'mg-body' });
    var ovTitle = h('h3'), ovText = h('p'), ovBtn = h('button', { type: 'button', class: 'btn btn-primary' });
    var overlay = h('div', { class: 'mg-overlay' }, ovTitle, ovText, ovBtn);
    var area = h('div', { class: 'mg-area' }, body, overlay);
    var node = h('div', { class: 'mg' }, head, area);

    function paint() {
      barI.style.width = Math.max(0, left / total * 100) + '%';
      bar.classList.toggle('low', left / total < 0.25);
      label.textContent = Math.max(0, Math.ceil(left)) + ' dtk' + (env.relaxed() ? ' (santai)' : '');
    }
    function stop() { running = false; clearInterval(timerId); timerId = null; }
    function showOverlay(title, text, btnLabel, fn) {
      ovTitle.textContent = title; ovText.textContent = text; ovBtn.textContent = btnLabel;
      ovBtn.onclick = function () { env.sfx('click'); fn(); };
      overlay.hidden = false; overlay.classList.remove('out');
      setTimeout(function () { try { ovBtn.focus({ preventScroll: true }); } catch (e) { /* abaikan */ } }, 0);
    }
    function begin() {
      overlay.hidden = true; left = total; ended = false; running = true; paint();
      clearInterval(timerId);
      timerId = setInterval(function () {
        if (!running) return;
        left -= 0.1; paint();
        if (left <= 0) { stop(); if (o.onTimeout) o.onTimeout(); }
      }, 100);
      if (o.onStart) o.onStart();
    }
    var api = {
      node: node, body: body, chips: chips,
      isRunning: function () { return running && !ended; },
      start: function () { showOverlay(o.title || 'Siap?', o.intro || '', 'Mulai!', begin); },
      stop: stop,
      timeLeft: function () { return left; },
      fail: function (msg) {
        stop(); ended = true; env.ctx.submit(false, true); env.sfx('wrong');
        showOverlay('Belum berhasil', msg + ' XP tidak berkurang. Coba lagi!', 'Coba Lagi', function () { if (o.reset) o.reset(); begin(); });
      },
      ok: function (accuracy) { stop(); ended = true; node.classList.add('won'); env.ctx.submit(true, false, { accuracy: accuracy }); },
      chip: function (text) { var el = h('span', { class: 'mg-chip', text: text }); chips.appendChild(el); return { el: el, set: function (t) { el.textContent = t; } }; },
      burst: function (x, y, color) {
        for (var i = 0; i < 10; i++) {
          var s = h('span', { class: 'mg-spark' });
          var a = Math.random() * Math.PI * 2, d = 24 + Math.random() * 40;
          s.style.cssText = 'left:' + x + 'px;top:' + y + 'px;background:' + color + ';--dx:' + Math.round(Math.cos(a) * d) + 'px;--dy:' + Math.round(Math.sin(a) * d) + 'px';
          area.appendChild(s);
          (function (el) { setTimeout(function () { if (el.parentNode) el.remove(); }, 750); })(s);
        }
      },
      pop: function (el, cls, ms) { el.classList.add(cls); setTimeout(function () { el.classList.remove(cls); }, ms || 400); },
      dispose: function () { stop(); }
    };
    api.start();
    return api;
  }

  function withPrompt(env, ch, fr, extra) {
    return env.h('div', { class: 'mg-wrap' }, env.h('p', { class: 'q-prompt', text: ch.prompt }), fr.node, extra || null);
  }

  /* ============================== SORTER ============================== */
  function sorter(ch, env) {
    var h = env.h, cards = ch.cards, zones = ch.zones;
    var idx = 0, correct = 0, miss = 0, combo = 0, beltTimer = null;
    var lane = h('div', { class: 'mg-lane', 'aria-live': 'polite' });
    var note = h('p', { class: 'mg-note', 'aria-live': 'polite', text: 'Klik zona yang tepat (atau tekan angka).' });
    var btns = {};
    var zoneRow = h('div', { class: 'mg-zones z' + zones.length }, zones.map(function (z, i) {
      var b = h('button', { type: 'button', class: 'btn mg-zone', 'data-zone': z.id, onclick: function () { route(z.id); } },
        h('span', { class: 'k', text: String(i + 1) }), h('span', { text: z.label }));
      btns[z.id] = b; return b;
    }));
    var fr, cScore, cCombo;
    function zoneLabel(id) { for (var i = 0; i < zones.length; i++) if (zones[i].id === id) return zones[i].label; return ''; }
    function beltMs() { return ch.belt * 1000 * (env.relaxed() ? 2 : 1); }

    function showCard() {
      clearTimeout(beltTimer); lane.textContent = '';
      cScore.set('Benar ' + correct + '/' + cards.length); cCombo.set('Kombo ×' + combo);
      if (idx >= cards.length) { finish(); return; }
      var c = h('div', { class: 'mg-card', style: 'animation-duration:' + (beltMs() / 1000) + 's', role: 'text' }, h('span', { text: cards[idx].text }));
      lane.appendChild(c);
      beltTimer = setTimeout(function () { if (!fr.isRunning()) return; miss++; combo = 0; env.ctx.hit(); env.sfx('wrong'); note.textContent = '✖ Kartu lolos! ' + cards[idx].why; idx++; showCard(); }, beltMs());
    }
    function route(zid) {
      if (!fr.isRunning() || idx >= cards.length) return;
      clearTimeout(beltTimer);
      var c = cards[idx], b = btns[zid], r = b.getBoundingClientRect(), a = lane.parentNode.getBoundingClientRect();
      if (c.zone === zid) {
        correct++; combo++; env.sfx('correct'); fr.pop(b, 'good', 450);
        fr.burst(r.left - a.left + r.width / 2, r.top - a.top, '#22C55E'); note.textContent = '✔ ' + c.why;
      } else {
        miss++; combo = 0; env.ctx.hit(); env.sfx('wrong'); fr.pop(b, 'bad', 450);
        note.textContent = '✖ Seharusnya: ' + zoneLabel(c.zone) + '. ' + c.why;
      }
      idx++; showCard();
    }
    function finish() {
      clearTimeout(beltTimer);
      var need = Math.ceil(cards.length * ch.passRatio);
      if (correct >= need) fr.ok(correct / cards.length);
      else fr.fail('Baru ' + correct + ' dari ' + cards.length + ' kartu benar (butuh minimal ' + need + ').');
    }
    function reset() { idx = 0; correct = 0; miss = 0; combo = 0; note.textContent = 'Klik zona yang tepat (atau tekan angka).'; showCard(); }

    function onKey(e) {
      if (!fr.isRunning()) return;
      var tag = (e.target && e.target.tagName) || ''; if (/INPUT|SELECT|TEXTAREA/.test(tag)) return;
      var n = parseInt(e.key, 10); if (n >= 1 && n <= zones.length) route(zones[n - 1].id);
    }
    document.addEventListener('keydown', onKey);

    fr = frame(env, ch, {
      title: 'Sortir Konveyor', intro: 'Kartu akan meluncur di konveyor. Kirim ke zona yang benar sebelum lolos. Perhatikan kata kunci!',
      onStart: function () { reset(); }, reset: reset,
      onTimeout: function () { finish(); }
    });
    cScore = fr.chip('Benar 0/' + cards.length); cCombo = fr.chip('Kombo ×0');
    fr.body.appendChild(lane); fr.body.appendChild(zoneRow); fr.body.appendChild(note);

    return {
      node: withPrompt(env, ch, fr), noCheck: true,
      hintText: function () { var z = cards[Math.min(idx, cards.length - 1)].zone; if (btns[z]) fr.pop(btns[z], 'pulse', 2600); return 'Zona yang tepat untuk kartu ini disorot. Perhatikan kata kuncinya.'; },
      lock: function () { clearTimeout(beltTimer); Object.keys(btns).forEach(function (k) { btns[k].disabled = true; }); },
      dispose: function () { clearTimeout(beltTimer); document.removeEventListener('keydown', onKey); fr.dispose(); }
    };
  }

  /* ============================== TYPING ============================== */
  function typing(ch, env) {
    var h = env.h, copy = ch.mode === 'copy', P = ch.prompts;
    var idx = 0, done = 0, clean = 0, combo = 0, typo = false, wrongSubmit = false, hintLvl = 0, chars = 0, t0 = 0;
    var input = h('input', { type: 'text', class: 'mg-input', autocomplete: 'off', spellcheck: 'false', autocapitalize: 'off', 'aria-label': 'Ketik perintah Git', disabled: true });
    var clue = h('div', { class: 'mg-clue' }), target = h('div', { class: 'mg-target mono', 'aria-live': 'polite' });
    var skip = h('button', { type: 'button', class: 'btn btn-secondary', text: 'Lewati', onclick: function () { if (fr.isRunning()) { combo = 0; advance(false, true); } } });
    var fr, cProg, cCombo, cWpm;

    function mask(text) { return text.split(' ').map(function (t) { return new Array(t.length + 1).join('_'); }).join(' '); }
    function accepts(raw, p) {
      var v = norm(raw);
      if (p.re) return new RegExp(p.re).test(v);
      return v === p.text;
    }
    function show() {
      typo = false; wrongSubmit = false; hintLvl = 0; input.value = ''; target.textContent = '';
      var p = P[idx];
      cProg.set('Perintah ' + (idx + 1) + '/' + P.length); cCombo.set('Kombo ×' + combo);
      if (copy) {
        clue.textContent = 'Ketik persis seperti ini:';
        Array.prototype.forEach.call(p.text, function (c) { target.appendChild(h('span', { class: 'ch', text: c === ' ' ? ' ' : c })); });
      } else {
        clue.textContent = p.clue; target.textContent = mask(p.text);
      }
      input.focus();
    }
    function wpm() { var mins = (Date.now() - t0) / 60000; cWpm.set(mins > 0.02 ? Math.round(chars / 5 / mins) + ' WPM' : '0 WPM'); }
    function advance(isClean, skipped) {
      if (!skipped) { done++; chars += P[idx].text.length; if (isClean) { clean++; combo++; } else combo = 0; env.sfx('correct'); fr.burst(60, 70, '#22C55E'); }
      idx++; wpm();
      if (idx >= P.length) { finish(); return; }
      show();
    }
    function finish() {
      if (done >= ch.passCount) fr.ok(clean / P.length);
      else fr.fail('Hanya ' + done + ' dari ' + P.length + ' perintah yang benar (butuh minimal ' + ch.passCount + ').');
    }
    function onInput() {
      if (!fr.isRunning() || !copy) return;
      var p = P[idx], val = input.value, spans = target.children, bad = false;
      for (var i = 0; i < spans.length; i++) {
        var c = spans[i], t = p.text[i];
        c.className = 'ch' + (i < val.length ? (val[i] === t ? ' ok' : ' bad') : (i === val.length ? ' cur' : ''));
        if (i < val.length && val[i] !== t) bad = true;
      }
      if (val.length > p.text.length) bad = true;
      if (bad && !typo) { typo = true; combo = 0; env.ctx.hit(); env.sfx('wrong'); fr.pop(input, 'shake', 350); cCombo.set('Kombo ×0'); }
      if (val === p.text) advance(!typo, false);
    }
    function onKey(e) {
      if (e.key !== 'Enter' || copy || !fr.isRunning()) return;
      e.preventDefault();
      var p = P[idx];
      if (accepts(input.value, p)) advance(!wrongSubmit, false);
      else { wrongSubmit = true; combo = 0; env.ctx.hit(); env.sfx('wrong'); fr.pop(input, 'shake', 350); input.select(); cCombo.set('Kombo ×0'); }
    }
    input.addEventListener('input', onInput); input.addEventListener('keydown', onKey);
    function reset() { idx = 0; done = 0; clean = 0; combo = 0; chars = 0; input.disabled = false; t0 = Date.now(); show(); }

    fr = frame(env, ch, {
      title: copy ? 'Fast Typing: Salin' : 'Fast Typing: Ingat',
      intro: copy ? 'Ketik perintah yang tampil persis seperti aslinya. Lanjut otomatis begitu benar.' : 'Hanya situasinya yang tampil. Ketik perintahnya dari ingatan, lalu tekan Enter.',
      onStart: function () { reset(); }, reset: reset,
      onTimeout: function () { if (done >= ch.passCount) fr.ok(clean / P.length); else fr.fail('Waktu habis! Baru ' + done + ' dari ' + P.length + ' perintah benar.'); }
    });
    cProg = fr.chip('Perintah 1/' + P.length); cCombo = fr.chip('Kombo ×0'); cWpm = fr.chip('0 WPM');
    fr.body.appendChild(clue); fr.body.appendChild(target); fr.body.appendChild(h('div', { class: 'row mg-inputrow' }, input, skip));
    if (!copy) fr.body.appendChild(h('p', { class: 'mg-note muted', text: 'Tekan Enter untuk mengirim. Spasi dan tanda hubung harus tepat.' }));

    return {
      node: withPrompt(env, ch, fr), noCheck: true,
      hintText: function () {
        var p = P[Math.min(idx, P.length - 1)]; hintLvl++;
        if (copy) return 'Ketik karakter demi karakter dan perhatikan spasi serta tanda hubung ganda (--).';
        if (hintLvl === 1) { var first = p.text.split(' ')[0]; target.textContent = first + ' ' + mask(p.text.split(' ').slice(1).join(' ')); return 'Perintah diawali dengan "' + first + '".'; }
        target.textContent = p.text; return 'Perintah lengkap: ' + p.text;
      },
      lock: function () { input.disabled = true; },
      focus: function () { /* fokus setelah menekan Mulai */ },
      dispose: function () { fr.dispose(); }
    };
  }

  /* ============================== REPOSIM ============================== */
  function reposim(ch, env) {
    var h = env.h;
    var files = ch.files.map(function (f) { return { name: f.name, change: f.change, prefix: f.prefix, status: 'modified' }; });
    var commits = [], mistakes = 0, counter = 0, fr, cLeft, cMist;
    var board = h('ul', { class: 'rs-board', 'aria-label': 'Papan tugas perubahan' });
    var out = h('div', { class: 'term-out rs-out', role: 'log', 'aria-live': 'polite', tabindex: '0' });
    var input = h('input', { type: 'text', 'aria-label': 'Ketik perintah Git', autocomplete: 'off', spellcheck: 'false', autocapitalize: 'off', disabled: true });
    var promptEl = h('span', { class: 'term-prompt', text: 'proyek $' });

    function line(t, text) { out.appendChild(h('div', { class: 'term-line ' + t, text: text })); out.scrollTop = out.scrollHeight; }
    function drawBoard() {
      board.textContent = '';
      files.forEach(function (f) {
        var label = f.status === 'committed' ? '✔ Committed (' + f.prefix + ')' : (f.status === 'staged' ? 'Staged' : 'Modified');
        board.appendChild(h('li', { class: 'rs-item ' + f.status },
          h('div', null, h('b', { class: 'mono', text: f.name }), h('span', { class: 'rs-chg', text: f.change })),
          h('span', { class: 'rs-chip', text: label })));
      });
      var rest = files.filter(function (f) { return f.status !== 'committed'; }).length;
      cLeft.set('Sisa ' + rest + ' berkas'); cMist.set('Salah ' + mistakes);
    }
    function mistake(msg) { mistakes++; env.ctx.hit(); env.sfx('wrong'); fr.pop(out, 'shake', 350); line('err', msg); cMist.set('Salah ' + mistakes); }
    function hash() { counter++; return (0xa1b2c3 + counter * 7919).toString(16).slice(0, 7); }

    function run(raw) {
      var cmd = norm(raw), m;
      if (!cmd) return;
      line('cmd', 'proyek $ ' + raw);
      if (cmd === 'clear') { out.textContent = ''; return; }
      if (cmd === 'help') { line('info', 'Perintah: git status | git status -s | git add <berkas> | git add . | git commit -m "prefix: pesan" | git log --oneline | clear'); return; }
      if (cmd === 'git status') {
        var st = files.filter(function (f) { return f.status === 'staged'; }), md = files.filter(function (f) { return f.status === 'modified'; });
        if (!st.length && !md.length) { line('out', 'On branch main\nnothing to commit, working tree clean'); return; }
        var t = 'On branch main\n';
        if (st.length) t += '\nChanges to be committed:\n' + st.map(function (f) { return '    modified:   ' + f.name; }).join('\n') + '\n';
        if (md.length) t += '\nChanges not staged for commit:\n' + md.map(function (f) { return '    modified:   ' + f.name; }).join('\n');
        line('out', t); return;
      }
      if (cmd === 'git status -s') {
        var s = files.filter(function (f) { return f.status !== 'committed'; }).map(function (f) { return (f.status === 'staged' ? 'M  ' : ' M ') + f.name; }).join('\n');
        line('out', s || '(bersih)'); return;
      }
      if ((m = /^git add (.+)$/.exec(cmd))) {
        var arg = m[1];
        if (arg === '.') {
          var n = 0; files.forEach(function (f) { if (f.status === 'modified') { f.status = 'staged'; n++; } });
          line('out', n ? '(' + n + ' berkas masuk Staging Area)' : '(tidak ada yang perlu di-stage)');
        } else {
          var f = files.filter(function (x) { return x.name === arg; })[0];
          if (!f) { line('err', "fatal: pathspec '" + arg.slice(0, 40) + "' did not match any files"); return; }
          if (f.status === 'modified') { f.status = 'staged'; line('out', '(' + f.name + ' masuk Staging Area)'); }
          else line('info', f.name + ' sudah ' + (f.status === 'staged' ? 'di Staging Area.' : 'di-commit.'));
        }
        env.sfx('click'); drawBoard(); return;
      }
      if ((m = /^git commit -m (["'])(.*)\1$/.exec(cmd))) {
        var staged = files.filter(function (x) { return x.status === 'staged'; });
        if (!staged.length) { line('info', 'nothing to commit. Gunakan git add dulu untuk memasukkan berkas ke Staging Area.'); return; }
        var msg = m[2], mm = /^(feat|fix|docs|style|refactor|test|chore): (.{3,})$/.exec(msg);
        if (!mm) { mistake('Pesan commit harus berformat "prefix: deskripsi", mis. feat: tambah login.'); return; }
        var prefixes = {}; staged.forEach(function (x) { prefixes[x.prefix] = 1; });
        if (Object.keys(prefixes).length > 1) { mistake('Perubahan berbeda jenis tidak boleh dalam satu commit. Pisahkan per jenis perubahan.'); return; }
        if (staged[0].prefix !== mm[1]) { mistake('Prefix "' + mm[1] + '" tidak cocok dengan jenis perubahan pada ' + staged.map(function (x) { return x.name; }).join(', ') + '.'); return; }
        var hh = hash();
        staged.forEach(function (x) { x.status = 'committed'; });
        commits.push(hh + ' ' + msg);
        line('out', '[main ' + hh + '] ' + msg + '\n ' + staged.length + ' file changed');
        env.sfx('correct'); fr.burst(80, 60, '#22C55E'); drawBoard();
        if (files.every(function (x) { return x.status === 'committed'; })) fr.ok(files.length / (files.length + mistakes));
        return;
      }
      if (cmd === 'git log --oneline') { line('out', commits.length ? commits.slice().reverse().join('\n') : '(belum ada commit)'); return; }
      line('err', 'Perintah tidak dikenali oleh simulator: ' + cmd.slice(0, 50) + '. Ketik "help" untuk daftar perintah.');
    }
    var form = h('form', { class: 'term-form', onsubmit: function (e) {
      e.preventDefault(); if (!fr.isRunning()) return;
      var raw = input.value; input.value = ''; run(raw);
    } }, promptEl, input);

    function reset() {
      files.forEach(function (f) { f.status = 'modified'; }); commits = []; mistakes = 0; counter = 0;
      out.textContent = ''; line('info', 'Repositori simulasi. Ketik "help" untuk daftar perintah.');
      input.disabled = false; drawBoard(); input.focus();
    }
    fr = frame(env, ch, {
      title: 'Simulator Repositori', intro: 'Stage lalu commit setiap perubahan dengan prefix Conventional Commits yang tepat. Satu jenis perubahan per commit!',
      onStart: reset, reset: reset,
      onTimeout: function () { fr.fail('Waktu habis! Masih ada ' + files.filter(function (f) { return f.status !== 'committed'; }).length + ' berkas belum di-commit.'); }
    });
    cLeft = fr.chip('Sisa ' + files.length + ' berkas'); cMist = fr.chip('Salah 0');
    fr.body.appendChild(h('div', { class: 'rs' }, h('div', { class: 'rs-left' }, h('h4', { text: 'Papan Tugas' }), board),
      h('div', { class: 'terminal rs-term' }, h('div', { class: 'term-bar' }, h('span', null, env.icon('terminal'), ' simulator-git'), h('span', { text: 'tanpa shell asli' })), out, form)));
    drawBoard();

    return {
      node: withPrompt(env, ch, fr), noCheck: true,
      hintText: function () {
        var md = files.filter(function (f) { return f.status === 'modified'; })[0], st = files.filter(function (f) { return f.status === 'staged'; });
        if (st.length) return 'Commit berkas ' + st.map(function (x) { return x.name; }).join(', ') + ' dengan prefix "' + st[0].prefix + ':" (' + st[0].change + ').';
        if (md) return 'Langkah berikut: git add ' + md.name + '. Perubahannya: ' + md.change + ' (prefix ' + md.prefix + ').';
        return 'Semua berkas sudah di-commit.';
      },
      lock: function () { input.disabled = true; },
      dispose: function () { fr.dispose(); }
    };
  }

  /* ============================== SWEEP ============================== */
  function sweep(ch, env) {
    var h = env.h, tiles = ch.tiles, flagged = {}, firstAcc = null, fr, cFlag, cWrong;
    var pre = h('pre', { class: 'mg-pre', 'aria-label': 'Pratinjau berkas .gitignore' });
    var note = h('p', { class: 'mg-note', 'aria-live': 'polite', text: 'Klik berkas untuk menandai/melepas tanda.' });
    var els = {};
    var grid = h('div', { class: 'mg-grid' }, tiles.map(function (t) {
      var b = h('button', { type: 'button', class: 'mg-tile', 'data-name': t.name, 'aria-pressed': 'false', onclick: function () { toggle(t); } },
        env.icon(/\/$/.test(t.name) ? 'folder' : 'file', 'big'), h('span', { class: 'mono', text: t.name }), h('i', { class: 'shield', 'aria-hidden': 'true', text: '🛡' }));
      els[t.name] = b; return b;
    }));
    function patterns() {
      var seen = {}, out = ['# .gitignore'];
      tiles.forEach(function (t) { if (flagged[t.name]) { var p = t.pattern || t.name; if (!seen[p]) { seen[p] = 1; out.push(p); } } });
      return out.join('\n');
    }
    function refresh() {
      var n = 0; tiles.forEach(function (t) { var on = !!flagged[t.name]; if (on) n++; els[t.name].setAttribute('aria-pressed', on ? 'true' : 'false'); els[t.name].classList.toggle('on', on); els[t.name].classList.remove('bad'); });
      pre.textContent = patterns(); cFlag.set('Ditandai ' + n);
    }
    function toggle(t) { if (!fr.isRunning()) return; flagged[t.name] = !flagged[t.name]; env.sfx('click'); refresh(); }
    function seal() {
      if (!fr.isRunning()) return;
      var wrong = tiles.filter(function (t) { return flagged[t.name] && !t.ignore; }), missing = tiles.filter(function (t) { return t.ignore && !flagged[t.name]; });
      if (!wrong.length && !missing.length) {
        grid.classList.add('sealed'); env.sfx('unlock');
        var r = grid.getBoundingClientRect(), a = grid.parentNode.getBoundingClientRect(); fr.burst(r.left - a.left + r.width / 2, r.top - a.top + r.height / 2, '#EAB308');
        note.textContent = '🔒 Brankas tersegel! ' + tiles.filter(function (t) { return t.ignore; }).length + ' berkas aman.';
        fr.ok(firstAcc === null ? 1 : firstAcc); return;
      }
      if (firstAcc === null) firstAcc = Math.max(0, 1 - (wrong.length + missing.length) / tiles.length);
      env.ctx.hit(); env.sfx('wrong'); cWrong.set('Salah segel ' + (++wrongSeals));
      wrong.forEach(function (t) { els[t.name].classList.add('bad'); });
      note.textContent = '✖ Belum aman: ' + (missing.length ? missing.length + ' berkas sensitif belum ditandai' : '') + (missing.length && wrong.length ? ' dan ' : '') + (wrong.length ? wrong.length + ' berkas penting salah ditandai (merah): ' + wrong[0].name + ' harus tetap dilacak.' : '.');
    }
    var wrongSeals = 0;
    var sealBtn = h('button', { type: 'button', class: 'btn btn-primary', text: 'Segel Brankas', onclick: seal });
    function reset() { flagged = {}; firstAcc = null; wrongSeals = 0; grid.classList.remove('sealed'); note.textContent = 'Klik berkas untuk menandai/melepas tanda.'; cWrong.set('Salah segel 0'); refresh(); }

    fr = frame(env, ch, {
      title: 'Security Sweep', intro: 'Pindai repositori: tandai berkas dan folder yang tidak boleh masuk Git (rahasia, dependensi, log, hasil build, berkas sistem). Jangan tandai berkas penting!',
      onStart: reset, reset: reset,
      onTimeout: function () { fr.fail('Waktu habis sebelum brankas tersegel.'); }
    });
    cFlag = fr.chip('Ditandai 0'); cWrong = fr.chip('Salah segel 0');
    fr.body.appendChild(h('div', { class: 'sw' }, h('div', { class: 'sw-left' }, grid, note, h('div', { class: 'row' }, sealBtn)),
      h('div', { class: 'sw-right' }, h('h4', { text: '.gitignore (otomatis)' }), pre)));
    refresh();

    return {
      node: withPrompt(env, ch, fr), noCheck: true,
      hintText: function () {
        var t = tiles.filter(function (x) { return x.ignore && !flagged[x.name]; })[0];
        if (!t) return 'Semua berkas sensitif sudah ditandai. Periksa apakah ada berkas penting yang ikut ditandai.';
        fr.pop(els[t.name], 'pulse', 2600); return 'Satu berkas yang belum ditandai disorot. ' + t.why;
      },
      lock: function () { Object.keys(els).forEach(function (k) { els[k].disabled = true; }); sealBtn.disabled = true; },
      dispose: function () { fr.dispose(); }
    };
  }

  /* ============================== MEMORY ============================== */
  function memory(ch, env) {
    var h = env.h, fr, cPairs, cMist, open = [], matched = 0, mistakes = 0, busy = false;
    var deck = [];
    ch.pairs.forEach(function (p, i) { deck.push({ pair: i, text: p.a, mono: true }); deck.push({ pair: i, text: p.b, mono: false }); });
    deck = shuffle(deck, 11);
    var els = [];
    var grid = h('div', { class: 'mg-mem' }, deck.map(function (c, i) {
      var face = h('span', { class: 'face' + (c.mono ? ' mono' : ''), text: c.text }), back = h('span', { class: 'back', text: '?' });
      var b = h('button', { type: 'button', class: 'mg-mcard', 'data-pair': String(c.pair), 'aria-label': 'Kartu tertutup ' + (i + 1), onclick: function () { flip(i); } }, back, face);
      els.push({ b: b, c: c, open: false, done: false }); return b;
    }));
    var note = h('p', { class: 'mg-note', 'aria-live': 'polite', text: 'Buka dua kartu: pasangkan pola dengan maksudnya.' });

    function setOpen(e, on) { e.open = on; e.b.classList.toggle('open', on); e.b.setAttribute('aria-label', on ? e.c.text : 'Kartu tertutup'); }
    function flip(i) {
      var e = els[i];
      if (!fr.isRunning() || busy || e.open || e.done) return;
      setOpen(e, true); open.push(e); env.sfx('click');
      if (open.length < 2) return;
      var a = open[0], b = open[1]; open = [];
      if (a.c.pair === b.c.pair && a.c.text !== b.c.text) {
        a.done = b.done = true; a.b.classList.add('done'); b.b.classList.add('done'); matched++; env.sfx('correct');
        var r = b.b.getBoundingClientRect(), ar = grid.parentNode.getBoundingClientRect(); fr.burst(r.left - ar.left + r.width / 2, r.top - ar.top + r.height / 2, '#22C55E');
        note.textContent = '✔ Cocok: ' + ch.pairs[a.c.pair].a + ' = ' + ch.pairs[a.c.pair].b;
        cPairs.set('Pasang ' + matched + '/' + ch.pairs.length);
        if (matched === ch.pairs.length) fr.ok(matched / (matched + mistakes));
      } else {
        mistakes++; env.ctx.hit(); env.sfx('wrong'); cMist.set('Salah ' + mistakes); busy = true;
        a.b.classList.add('bad'); b.b.classList.add('bad'); note.textContent = '✖ Tidak cocok. Coba ingat posisinya!';
        setTimeout(function () { setOpen(a, false); setOpen(b, false); a.b.classList.remove('bad'); b.b.classList.remove('bad'); busy = false; }, 750);
      }
    }
    function reset() {
      open = []; matched = 0; mistakes = 0; busy = false;
      els.forEach(function (e) { setOpen(e, false); e.done = false; e.b.classList.remove('done', 'bad', 'peek'); });
      cPairs.set('Pasang 0/' + ch.pairs.length); cMist.set('Salah 0'); note.textContent = 'Buka dua kartu: pasangkan pola dengan maksudnya.';
    }
    fr = frame(env, ch, {
      title: 'Kartu Memori', intro: 'Pasangkan pola .gitignore dengan maksudnya. Ingat posisi kartu supaya tidak salah buka!',
      onStart: reset, reset: reset,
      onTimeout: function () { fr.fail('Waktu habis! Baru ' + matched + ' dari ' + ch.pairs.length + ' pasang cocok.'); }
    });
    cPairs = fr.chip('Pasang 0/' + ch.pairs.length); cMist = fr.chip('Salah 0');
    fr.body.appendChild(grid); fr.body.appendChild(note);

    return {
      node: withPrompt(env, ch, fr), noCheck: true,
      hintText: function () {
        els.forEach(function (e) { if (!e.done) e.b.classList.add('peek'); });
        setTimeout(function () { els.forEach(function (e) { e.b.classList.remove('peek'); }); }, 1700);
        return 'Semua kartu diperlihatkan sebentar. Hafalkan posisinya!';
      },
      lock: function () { els.forEach(function (e) { e.b.disabled = true; }); },
      dispose: function () { fr.dispose(); }
    };
  }

  /* ============================== TERMINAL BERWAKTU ============================== */
  function terminal(ch, env) {
    var h = env.h, session, wrong = 0, fr, cStep, cWrong, done = false;
    var out = h('div', { class: 'term-out', role: 'log', 'aria-live': 'polite', tabindex: '0' });
    var promptEl = h('span', { class: 'term-prompt', text: '~ $' });
    var input = h('input', { type: 'text', 'aria-label': 'Ketik perintah Git', autocomplete: 'off', spellcheck: 'false', autocapitalize: 'off', disabled: true });
    var stepsList = h('ol', { class: 'steps-list' });

    function line(t, text) { out.appendChild(h('div', { class: 'term-line ' + t, text: text })); out.scrollTop = out.scrollHeight; }
    function drawSteps() {
      stepsList.textContent = ''; var cur = session.currentStep();
      ch.taskSteps.forEach(function (s, i) { stepsList.appendChild(h('li', { class: i < cur ? 'done' : (i === cur ? 'now' : ''), text: s + (i < cur ? ' ✔' : '') })); });
      cStep.set('Langkah ' + Math.min(cur + 1, ch.taskSteps.length) + '/' + ch.taskSteps.length); cWrong.set('Salah ' + wrong);
    }
    var form = h('form', { class: 'term-form', onsubmit: function (e) {
      e.preventDefault(); if (!fr.isRunning() || done) return;
      var raw = input.value; input.value = ''; if (!raw.trim()) return;
      line('cmd', promptEl.textContent + ' ' + raw);
      var r = session.run(raw);
      if (r.kind === 'clear') { out.textContent = ''; return; }
      r.lines.forEach(function (l) { if (l.text) line(l.t, l.text); });
      promptEl.textContent = session.prompt();
      if (r.kind === 'wrong') { wrong++; env.ctx.hit(); env.sfx('wrong'); fr.pop(out, 'shake', 350); }
      else if (r.kind === 'step') { env.sfx('correct'); fr.burst(60, 40, '#22C55E'); }
      else if (r.kind === 'solved') { done = true; drawSteps(); fr.ok(ch.taskSteps.length / (ch.taskSteps.length + wrong)); return; }
      drawSteps();
    } }, promptEl, input);

    function reset() {
      session = window.GQTerminal.createSession(ch); wrong = 0; done = false; out.textContent = '';
      promptEl.textContent = session.prompt();
      line('info', 'Terminal SIMULASI — bukan terminal komputer sungguhan. Ketik "clear" untuk membersihkan layar.');
      input.disabled = false; drawSteps(); input.focus();
    }
    session = window.GQTerminal.createSession(ch);
    fr = frame(env, ch, {
      title: 'Terminal Berwaktu', intro: 'Ikuti daftar langkah dengan mengetik perintah Git di terminal simulasi sebelum waktu habis.',
      onStart: reset, reset: reset,
      onTimeout: function () { fr.fail('Waktu habis! Langkah selesai: ' + session.currentStep() + ' dari ' + ch.taskSteps.length + '.'); }
    });
    cStep = fr.chip('Langkah 1/' + ch.taskSteps.length); cWrong = fr.chip('Salah 0');
    fr.body.appendChild(stepsList);
    fr.body.appendChild(h('div', { class: 'terminal' }, h('div', { class: 'term-bar' }, h('span', null, env.icon('terminal'), ' simulator-git'), h('span', { text: 'tanpa shell asli' })), out, form));
    drawSteps();

    return {
      node: withPrompt(env, ch, fr), noCheck: true,
      hintText: function () { return session.hint(); },
      lock: function () { input.disabled = true; },
      dispose: function () { fr.dispose(); }
    };
  }

  var ENGINES = { sorter: sorter, typing: typing, reposim: reposim, sweep: sweep, memory: memory, terminal: terminal };
  window.GQMini = {
    has: function (type) { return !!ENGINES[type]; },
    create: function (type, ch, env) { return ENGINES[type](ch, env); }
  };
})();

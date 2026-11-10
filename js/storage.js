/* storage.js — penyimpanan lokal (localStorage). Tanpa database/backend.
   Satu key utama berversi: gitQuestSave_v1. */
(function () {
  'use strict';
  var KEY = 'gitQuestSave_v1';
  var SAVE_VERSION = 1;
  var memoryFallback = null; // dipakai bila localStorage tidak tersedia
  var available = null;

  function isAvailable() {
    if (available !== null) return available;
    try {
      var t = '__gq_test__';
      window.localStorage.setItem(t, '1');
      window.localStorage.removeItem(t);
      available = true;
    } catch (e) { available = false; }
    return available;
  }

  function defaultSave() {
    return { saveVersion: SAVE_VERSION, activeProfile: null, profiles: {}, settings: { sound: true, reduceMotion: false, viewMode: 'world', relaxTimer: false, controlMode: 'gui' } };
  }

  function isObj(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }
  function strArr(a) { return Array.isArray(a) && a.every(function (x) { return typeof x === 'string'; }); }

  var HEX = /^#[0-9a-fA-F]{6}$/;
  function validChar(c) {
    return isObj(c) && typeof c.id === 'string' && /^[a-z_]{3,12}$/.test(c.id) &&
      ['hair', 'outfit', 'accent', 'skin', 'eyes'].every(function (k) { return typeof c[k] === 'string' && HEX.test(c[k]); });
  }
  /** Materi yang sudah dibaca: { idMisi: [indeksTopik, ...] } (opsional pada save lama). */
  function cleanLearned(l) {
    var out = {};
    if (!isObj(l)) return out;
    Object.keys(l).forEach(function (k) {
      if (!/^[a-z0-9_-]{1,40}$/i.test(k) || !Array.isArray(l[k])) return;
      var seen = {}, a = [];
      l[k].forEach(function (n) { if (typeof n === 'number' && n >= 0 && n < 50 && Math.floor(n) === n && !seen[n]) { seen[n] = 1; a.push(n); } });
      out[k] = a;
    });
    return out;
  }
  function validateProfile(p) {
    return isObj(p) && typeof p.displayName === 'string' && p.displayName.length > 0 && p.displayName.length <= 20 &&
      typeof p.xp === 'number' && isFinite(p.xp) && p.xp >= 0 &&
      strArr(p.completedMissions) && strArr(p.xpChallenges) &&
      isObj(p.bestScores) && Object.keys(p.bestScores).every(function (k) {
        return typeof p.bestScores[k] === 'number' && p.bestScores[k] >= 0 && p.bestScores[k] <= 100;
      });
  }

  /** Validasi struktur save. Mengembalikan objek bersih atau null. */
  function validateSave(d) {
    if (!isObj(d) || d.saveVersion !== SAVE_VERSION || !isObj(d.profiles)) return null;
    var out = defaultSave();
    var ids = Object.keys(d.profiles);
    for (var i = 0; i < ids.length; i++) {
      var p = d.profiles[ids[i]];
      if (!/^[a-z0-9_-]{1,40}$/i.test(ids[i]) || !validateProfile(p)) return null;
      out.profiles[ids[i]] = {
        displayName: p.displayName, xp: p.xp,
        completedMissions: p.completedMissions.slice(), xpChallenges: p.xpChallenges.slice(),
        bestScores: Object.assign({}, p.bestScores), introSeen: p.introSeen === true, guideSeen: p.guideSeen === true, learned: cleanLearned(p.learned),
        char: validChar(p.char) ? { id: p.char.id, hair: p.char.hair, outfit: p.char.outfit, accent: p.char.accent, skin: p.char.skin, eyes: p.char.eyes } : null
      };
    }
    out.activeProfile = (typeof d.activeProfile === 'string' && out.profiles[d.activeProfile]) ? d.activeProfile : null;
    if (isObj(d.settings)) {
      out.settings.sound = d.settings.sound === true;
      out.settings.reduceMotion = d.settings.reduceMotion === true;
      out.settings.viewMode = d.settings.viewMode === 'list' ? 'list' : 'world';
      out.settings.relaxTimer = d.settings.relaxTimer === true;
      out.settings.controlMode = d.settings.controlMode === 'cli' ? 'cli' : 'gui';
    }
    return out;
  }

  function loadGame() {
    var raw = null;
    try { raw = isAvailable() ? window.localStorage.getItem(KEY) : null; } catch (e) { raw = null; }
    if (raw === null) return memoryFallback ? validateSave(memoryFallback) || defaultSave() : defaultSave();
    try {
      var parsed = JSON.parse(raw);
      var clean = validateSave(parsed);
      if (!clean) { api.loadIssue = 'Data save lama tidak kompatibel dengan versi game ini, jadi dimulai dari awal. Data lama tidak dihapus sampai kamu menyimpan progres baru.'; return defaultSave(); }
      return clean;
    } catch (e) { api.loadIssue = 'Data save rusak dan tidak dapat dibaca, jadi dimulai dari awal.'; return defaultSave(); }
  }

  /** @returns {boolean} true bila tersimpan di localStorage */
  function saveGame(data) {
    memoryFallback = JSON.parse(JSON.stringify(data));
    if (!isAvailable()) return false;
    try { window.localStorage.setItem(KEY, JSON.stringify(data)); return true; }
    catch (e) { return false; }
  }

  function resetGame() {
    memoryFallback = null;
    try { if (isAvailable()) window.localStorage.removeItem(KEY); } catch (e) { /* abaikan */ }
    return defaultSave();
  }

  function exportSave(data) {
    return JSON.stringify(data, null, 2);
  }

  /** Impor dari teks JSON. Mengembalikan {ok, data?, error?}. */
  function importSave(text) {
    if (typeof text !== 'string' || text.length > 1000000) return { ok: false, error: 'File terlalu besar atau tidak valid.' };
    var parsed;
    try { parsed = JSON.parse(text); } catch (e) { return { ok: false, error: 'File bukan JSON yang valid.' }; }
    var clean = validateSave(parsed);
    if (!clean) return { ok: false, error: 'Struktur atau versi save tidak cocok dengan GIT QUEST.' };
    return { ok: true, data: clean };
  }

  var api = window.GQStorage = {
    loadIssue: null,
    KEY: KEY, SAVE_VERSION: SAVE_VERSION, isAvailable: isAvailable,
    defaultSave: defaultSave, loadGame: loadGame, saveGame: saveGame,
    resetGame: resetGame, exportSave: exportSave, importSave: importSave
  };
})();

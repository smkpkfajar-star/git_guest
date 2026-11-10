/* terminal-simulator.js — SIMULATOR tertutup. Tidak menjalankan shell,
   tanpa eval/exec. Input hanya dicocokkan dengan whitelist skenario. */
(function () {
  'use strict';

  // Perintah yang dikenali simulator (agar umpan balik lebih ramah).
  var KNOWN = [
    /^git\s+(config|init|status|add|commit|diff|log)\b/,
    /^cd\b/, /^ls$/, /^pwd$/
  ];

  function normalize(s) { return String(s).replace(/\s+/g, ' ').trim(); }

  /** Buat sesi simulasi untuk satu tantangan terminal. */
  function createSession(challenge) {
    var state = { cwd: '~', name: '', email: '', step: 0, repo: false };

    function prompt() { return state.cwd + ' $'; }

    /**
     * @returns {{kind:'clear'|'solved'|'step'|'wrong', lines:Array<{t:string,text:string}>, done:boolean}}
     */
    function run(input) {
      var cmd = normalize(input);
      if (!cmd) return { kind: 'noop', lines: [], done: false };
      if (cmd === 'clear') return { kind: 'clear', lines: [], done: false };
      if (cmd === 'pwd') return { kind: 'info', lines: [{ t: 'out', text: state.cwd === '~' ? '/home/siswa' : '/home/siswa/' + state.cwd }], done: false };

      var step = challenge.steps[state.step];
      var m = step.pattern.exec(cmd);
      if (m) {
        var out = step.onMatch(m, state);
        state.step++;
        var done = state.step >= challenge.steps.length;
        return { kind: done ? 'solved' : 'step', lines: out ? [{ t: 'out', text: out }] : [], done: done };
      }
      var known = KNOWN.some(function (re) { return re.test(cmd); });
      return {
        kind: 'wrong', done: false,
        lines: [{ t: 'err', text: known
          ? 'Perintah dikenali, tetapi bukan langkah yang diminta sekarang atau formatnya belum tepat.'
          : 'Perintah tidak dikenali oleh simulator: ' + cmd.slice(0, 60) }]
      };
    }

    return {
      run: run, prompt: prompt,
      currentStep: function () { return state.step; },
      hint: function () { var s = challenge.steps[Math.min(state.step, challenge.steps.length - 1)]; return s.hint; }
    };
  }

  window.GQTerminal = { createSession: createSession };
})();

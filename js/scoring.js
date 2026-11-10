/* scoring.js — aturan poin, XP, rank (docs/game_rules.md) */
(function () {
  'use strict';
  var CONFIG = { passScore: 70, xpPerChallenge: 10, xpMissionBonus: 25, xpFinalBonus: 50, xpPerLevel: 60 };

  /** Poin satu tantangan: 100 percobaan pertama, 70 dengan petunjuk, 50 setelah mengulang. */
  function challengePoints(attempts, hints) {
    if (hints > 0) return 70;
    if (attempts <= 1) return 100;
    return 50;
  }

  /** Mini-game berwaktu: sama seperti challengePoints, tetapi 100 poin hanya bila akurasi >= 90%. */
  function gamePoints(attempts, hints, accuracy) {
    var base = challengePoints(attempts, hints);
    return (base === 100 && accuracy < 0.9) ? 70 : base;
  }

  function missionScore(results) {
    if (!results.length) return 0;
    var total = results.reduce(function (s, r) { return s + r.points; }, 0);
    return Math.round(total / (results.length * 100) * 100);
  }

  function rankFor(score) {
    if (score >= 90) return 'Repository Guardian';
    if (score >= 80) return 'Commit Specialist';
    if (score >= 70) return 'Git Explorer';
    return 'Apprentice Developer';
  }

  /** Terapkan hasil misi ke profil (mutasi). XP hanya untuk penyelesaian pertama. */
  function applyMissionResult(profile, mission, results) {
    var score = missionScore(results);
    var passed = score >= CONFIG.passScore;
    var xpGained = 0;
    results.forEach(function (r) {
      var id = mission.id + ':' + r.id;
      if (profile.xpChallenges.indexOf(id) === -1) {
        profile.xpChallenges.push(id);
        xpGained += CONFIG.xpPerChallenge;
      }
    });
    var firstPass = false;
    if (passed && profile.completedMissions.indexOf(mission.id) === -1) {
      profile.completedMissions.push(mission.id);
      xpGained += mission.final ? CONFIG.xpFinalBonus : CONFIG.xpMissionBonus;
      firstPass = true;
    }
    profile.xp += xpGained;
    var prev = profile.bestScores[mission.id] || 0;
    if (score > prev) profile.bestScores[mission.id] = score;
    return { score: score, passed: passed, xpGained: xpGained, firstPass: firstPass, rank: rankFor(score) };
  }

  var TITLES = ['Junior Developer', 'Git Apprentice', 'Commit Knight', 'Branch Ranger', 'Merge Mage', 'Repo Sage', 'Git Grandmaster'];
  /** Level, gelar, dan tingkat efek karakter (tier 0..6) dari total XP. */
  function levelInfo(xp) {
    var per = CONFIG.xpPerLevel, level = Math.floor(xp / per) + 1;
    return { level: level, into: xp % per, per: per, tier: Math.min(6, level - 1), title: TITLES[Math.min(TITLES.length - 1, level - 1)] };
  }

  /** Kondisi kemenangan (§7): semua misi wajib + Final Challenge selesai.
      Nilai akhir = rata-rata nilai terbaik seluruh misi; Repository Guardian bila >= 90. */
  function gameStatus(profile, missions) {
    var total = missions.length;
    var done = missions.filter(function (m) { return profile.completedMissions.indexOf(m.id) !== -1; }).length;
    var sum = missions.reduce(function (s, m) { return s + (profile.bestScores[m.id] || 0); }, 0);
    var finalScore = total ? Math.round(sum / total) : 0;
    var won = total > 0 && done === total;
    return {
      done: done, total: total, won: won,
      finalScore: finalScore, rank: rankFor(finalScore),
      guardian: won && finalScore >= 90
    };
  }

  /** Achievement diturunkan dari data profil (tanpa disimpan terpisah). */
  function achievements(profile, missions) {
    var ready = missions.filter(function (m) { return m.ready; });
    var doneReady = ready.filter(function (m) { return profile.completedMissions.indexOf(m.id) !== -1; }).length;
    var st = gameStatus(profile, missions);
    var perfect = Object.keys(profile.bestScores).some(function (k) { return profile.bestScores[k] === 100; });
    return [
      { on: profile.completedMissions.length >= 1, icon: '1', label: 'Misi Pertama Selesai' },
      { on: perfect, icon: '★', label: 'Nilai Sempurna (100)' },
      { on: ready.length > 0 && doneReady === ready.length, icon: '✔', label: 'Semua Misi Tersedia Tuntas' },
      { on: st.won, icon: '⚑', label: 'Game Tamat (Final Challenge selesai)' },
      { on: st.guardian, icon: '♛', label: 'Gelar Repository Guardian' }
    ];
  }

  window.GQScoring = {
    CONFIG: CONFIG, challengePoints: challengePoints, gamePoints: gamePoints, missionScore: missionScore,
    rankFor: rankFor, applyMissionResult: applyMissionResult, levelInfo: levelInfo,
    gameStatus: gameStatus, achievements: achievements
  };
})();

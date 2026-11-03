/* 本地存储与学习进度。键名统一前缀 yw4a:，所有读写都 try/catch；
 * localStorage 不可用时退回内存，照样能做题（只是关掉页面就不记得了）。 */
(function (Y) {
  'use strict';

  var PREFIX = 'yw4a:';
  var memory = {};
  var ls = null;
  try {
    ls = window.localStorage;
    ls.setItem(PREFIX + '__t', '1');
    ls.removeItem(PREFIX + '__t');
  } catch (e) { ls = null; }

  var store = Y.store = {
    available: !!ls,
    get: function (key, def) {
      try {
        var raw = ls ? ls.getItem(PREFIX + key) : memory[key];
        if (raw == null) return def;
        return JSON.parse(raw);
      } catch (e) { return def; }
    },
    set: function (key, val) {
      var raw = JSON.stringify(val);
      try {
        if (ls) ls.setItem(PREFIX + key, raw); else memory[key] = raw;
      } catch (e) { memory[key] = raw; }
    },
    remove: function (key) {
      try { if (ls) ls.removeItem(PREFIX + key); } catch (e) { /* 忽略 */ }
      delete memory[key];
    },
    /** 列出本应用的全部键（不含前缀） */
    keys: function () {
      var out = [];
      try {
        if (ls) {
          for (var i = 0; i < ls.length; i++) {
            var k = ls.key(i);
            if (k && k.indexOf(PREFIX) === 0) out.push(k.slice(PREFIX.length));
          }
        }
      } catch (e) { /* 忽略 */ }
      Object.keys(memory).forEach(function (k) { if (out.indexOf(k) < 0) out.push(k); });
      return out;
    },
    clearAll: function () { store.keys().forEach(store.remove); }
  };

  /* ---------- 设置 ---------- */
  var DEFAULT_SETTINGS = { sound: true, speech: true, fontSize: 'normal' };
  Y.settings = {
    get: function () {
      var s = store.get('settings', {});
      var out = {};
      Object.keys(DEFAULT_SETTINGS).forEach(function (k) { out[k] = k in s ? s[k] : DEFAULT_SETTINGS[k]; });
      return out;
    },
    set: function (k, v) {
      var s = Y.settings.get(); s[k] = v; store.set('settings', s);
      if (Y.applySettings) Y.applySettings();
    }
  };

  /* ---------- 进度 ----------
   * progress = {
   *   q:      { 题目id: { r 答对次数, w 答错次数, streak 错题连续答对, wrong 是否在错题本, t 最近时间 } },
   *   stars:  { 岛id: 最高星数 },
   *   best:   { 岛id: 最高正确率(0~100) },
   *   recite: { 诗id: [第1关, 第2关, 第3关] },
   *   known:  { 知识卡id: true },
   *   days:   ['2026-11-03', ...]
   * } */
  function load() {
    var p = store.get('progress', null) || {};
    p.q = p.q || {}; p.stars = p.stars || {}; p.best = p.best || {};
    p.recite = p.recite || {}; p.known = p.known || {}; p.days = p.days || [];
    return p;
  }

  var P = Y.progress = {
    data: function () { return load(); },
    save: function (p) { store.set('progress', p); },

    /** result: 'first' 一次答对 | 'second' 提示后答对 | 'wrong' 答错 */
    record: function (q, result) {
      var p = load();
      var s = p.q[q.id] || { r: 0, w: 0, streak: 0, wrong: false };
      s.t = Date.now();
      if (result === 'first') {
        s.r++;
        if (s.wrong) {
          s.streak++;
          if (s.streak >= 2) { s.wrong = false; s.streak = 0; s.cleared = true; }
        }
      } else {
        if (result === 'second') s.r++;
        s.w++;
        s.wrong = true;
        s.streak = 0;
      }
      p.q[q.id] = s;
      P.markToday(p);
      P.save(p);
      return s;
    },

    stat: function (id) { return load().q[id] || null; },

    wrongIds: function () {
      var q = load().q;
      return Object.keys(q).filter(function (id) { return q[id].wrong; });
    },

    setStars: function (islandId, stars, percent) {
      var p = load();
      if (!(p.stars[islandId] >= stars)) p.stars[islandId] = stars;
      if (!(p.best[islandId] >= percent)) p.best[islandId] = percent;
      P.save(p);
      return p.stars[islandId];
    },
    stars: function (islandId) { return load().stars[islandId] || 0; },

    recite: function (poemId) { return (load().recite[poemId] || [false, false, false]).slice(); },
    setRecite: function (poemId, level, ok) {
      var p = load();
      var r = p.recite[poemId] || [false, false, false];
      r[level - 1] = !!ok;
      p.recite[poemId] = r;
      P.markToday(p);
      P.save(p);
    },

    isKnown: function (id) { return !!load().known[id]; },
    setKnown: function (id, v) {
      var p = load();
      if (v) p.known[id] = true; else delete p.known[id];
      P.save(p);
    },

    markToday: function (p) {
      var d = Y.util.today();
      if (p.days.indexOf(d) < 0) { p.days.push(d); if (p.days.length > 400) p.days.shift(); }
    }
  };
})(window.YuwenIsland);

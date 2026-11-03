/* 学习统计：错题本、每日一练抽题、各岛正确率、连续学习天数、徽章。
 * 全是纯函数（输入进度数据，输出结果），不碰 DOM，测试里也会加载。 */
(function (Y) {
  'use strict';
  var C = function () { return Y.content; };

  /* 可以重复的伪随机：同一天抽到的题目相同 */
  function seeded(seedStr) {
    var x = 2166136261;
    for (var i = 0; i < seedStr.length; i++) { x ^= seedStr.charCodeAt(i); x = Math.imul(x, 16777619); }
    return function () {
      x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
      return ((x >>> 0) % 100000) / 100000;
    };
  }
  function seededShuffle(arr, rnd) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  /** 所有岛（统计用）：8 个单元 + 3 个有题库的专项岛 */
  function islands() {
    var out = (Y.data.islands || []).map(function (i) { return { id: i.id, name: '第' + Y.util.cnNum(i.unit) + '单元 ' + i.name, unit: i.unit }; });
    (Y.data.specials || []).forEach(function (s) { if (s.id !== 'writing') out.push({ id: s.id, name: s.name }); });
    return out;
  }
  function poolOf(isl) {
    return isl.unit ? C().unitPool(isl.unit) : C().pool({ island: isl.id, noTypes: ['selfcheck'] });
  }

  var TYPE_LABEL = {
    single: '单选', multi: '多选', judge: '判断', blank: '填空', input: '填写', order: '排序', match: '连线',
    columns: '分类', segment: '断句', selfcheck: '默写听写', story3: '起因经过结果', tianji: '田忌赛马',
    tagtext: '六要素', annotate: '批注', letter: '书信格式'
  };

  var L = Y.learn = {
    TYPE_LABEL: TYPE_LABEL,
    islands: islands,

    /** 错题本：[{ q, s }]，最近答错的在前 */
    wrongList: function (p) {
      return Object.keys(p.q).filter(function (id) { return p.q[id].wrong; })
        .map(function (id) { return { q: C().byId(id), s: p.q[id] }; })
        .filter(function (x) { return x.q; })
        .sort(function (a, b) { return (b.s.t || 0) - (a.s.t || 0); });
    },

    /** 错题所属的岛（古诗文题算在背诵馆） */
    islandOf: function (q) { return q.island; },

    /** 各岛正确率：答对次数 /（答对 + 答错） */
    islandStats: function (p) {
      return islands().map(function (isl) {
        var r = 0, w = 0, tried = 0;
        poolOf(isl).forEach(function (q) {
          var s = p.q[q.id]; if (!s) return;
          tried++; r += s.r; w += s.w;
        });
        return { id: isl.id, name: isl.name, tried: tried, total: poolOf(isl).length, right: r, wrong: w,
          acc: r + w ? Math.round(r / (r + w) * 100) : null, stars: p.stars[isl.id] || 0 };
      });
    },

    /** 高频错题：答错次数最多的 n 道 */
    topWrong: function (p, n) {
      return Object.keys(p.q).filter(function (id) { return p.q[id].w > 0; })
        .map(function (id) { return { q: C().byId(id), s: p.q[id] }; })
        .filter(function (x) { return x.q; })
        .sort(function (a, b) { return b.s.w - a.s.w || (b.s.t || 0) - (a.s.t || 0); })
        .slice(0, n || 10);
    },

    /**
     * 每日一练：10 题，固定含 2 道古诗文；其余优先错题，再补薄弱单元，最后随机。
     * 同一天结果固定（按日期做随机种子）。
     */
    dailyIds: function (p, dateStr) {
      var rnd = seeded('yw4a-' + dateStr);
      var used = {};
      var out = [];
      function take(list, n) {
        for (var i = 0; i < list.length && n > 0; i++) {
          var q = list[i];
          if (!q || used[q.id] || q.type === 'selfcheck') continue;
          used[q.id] = true; out.push(q.id); n--;
        }
        return n;
      }
      var wrong = L.wrongList(p).map(function (x) { return x.q; });
      var poemPool = C().pool({ island: 'poems', noTypes: ['selfcheck'] });
      // ① 2 道古诗文：先挑古诗文错题，不够再随机
      var left = take(seededShuffle(wrong.filter(function (q) { return q.island === 'poems'; }), rnd), 2);
      take(seededShuffle(poemPool, rnd), left);
      // ② 错题（非古诗文）
      var rest = take(seededShuffle(wrong.filter(function (q) { return q.island !== 'poems'; }), rnd), 8);
      // ③ 薄弱的岛：正确率低的在前，没做过的也算薄弱
      if (rest > 0) {
        var stats = L.islandStats(p).sort(function (a, b) {
          var x = a.acc == null ? -1 : a.acc, y = b.acc == null ? -1 : b.acc;
          return x - y || rnd() - 0.5;
        });
        for (var i = 0; i < stats.length && rest > 0; i++) {
          var isl = islands().filter(function (x) { return x.id === stats[i].id; })[0];
          var pool = seededShuffle(poolOf(isl), rnd);
          // 每个薄弱的岛最多出 3 题，让题目分散一点
          var k = Math.min(3, rest);
          rest -= k - take(pool, k);
        }
      }
      if (rest > 0) take(seededShuffle(C().all(), rnd), rest);
      return out;
    },

    /** 连续学习天数：以今天（或昨天）为结尾往前数 */
    streak: function (days, todayStr) {
      var set = {};
      (days || []).forEach(function (d) { set[d] = true; });
      var d = new Date(todayStr + 'T12:00:00');
      if (!set[todayStr]) d.setDate(d.getDate() - 1);
      var n = 0;
      while (set[Y.util.today(d)]) { n++; d.setDate(d.getDate() - 1); }
      return n;
    },

    /** 某个技能下“答对过”的题数 */
    skillRight: function (p, skills) {
      return C().all().filter(function (q) { return skills.indexOf(q.skill) >= 0 && p.q[q.id] && p.q[q.id].r > 0; }).length;
    },

    /**
     * 徽章。extra: { today, dailyDone: [日期], outlinesDone: 数量 }
     * 返回 [{ id, icon, name, desc, got, cur, total }]
     */
    badges: function (p, extra) {
      extra = extra || {};
      var poems = (Y.data.poems || []).filter(function (x) { return x.kind === 'poem'; });
      var wenyan = (Y.data.poems || []).filter(function (x) { return x.kind === 'wenyan'; });
      function recited(list) { return list.filter(function (x) { return p.recite[x.id] && p.recite[x.id][2]; }).length; }
      var units = (Y.data.islands || []);
      var cleared = Object.keys(p.q).filter(function (id) { return p.q[id].cleared; }).length;
      var three = Object.keys(p.stars).filter(function (k) { return p.stars[k] >= 3; }).length;
      var list = [
        { id: 'poet', icon: '🏯', name: '古诗小达人', desc: '背会全部 6 首古诗（三关全过）', cur: recited(poems), total: poems.length },
        { id: 'wenyan', icon: '📜', name: '文言文小先生', desc: '背会 2 篇文言文（三关全过）', cur: recited(wenyan), total: wenyan.length },
        { id: 'question', icon: '❓', name: '提问高手', desc: '答对 8 道提问分类、筛选问题的题', cur: L.skillRight(p, ['question-classify', 'question-best']), total: 8 },
        { id: 'annotate', icon: '✏️', name: '批注能手', desc: '答对 6 道批注题', cur: L.skillRight(p, ['annotate']), total: 6 },
        { id: 'guide', icon: '🎤', name: '小小讲解员', desc: '答对 4 道小小讲解员的题', cur: L.skillRight(p, ['guide-talk']), total: 4 },
        { id: 'streak3', icon: '🔥', name: '连续学习 3 天', desc: '连续 3 天来语文岛学习', cur: L.streak(p.days, extra.today || Y.util.today()), total: 3 },
        { id: 'letter', icon: '✉️', name: '书信小能手', desc: '答对 6 道书信格式题', cur: L.skillRight(p, ['letter-format']), total: 6 },
        { id: 'star', icon: '🌟', name: '闯关新星', desc: '任意一座岛拿到 3 颗星', cur: Math.min(three, 1), total: 1 },
        { id: 'islands', icon: '🗺️', name: '八岛巡游', desc: '8 个单元岛都至少得 1 颗星', cur: units.filter(function (u) { return p.stars[u.id] >= 1; }).length, total: units.length },
        { id: 'cleaner', icon: '🧹', name: '错题克星', desc: '从错题本里消灭 5 道错题', cur: cleared, total: 5 },
        { id: 'daily', icon: '📅', name: '每日打卡', desc: '完成 5 次每日一练', cur: (extra.dailyDone || []).length, total: 5 },
        { id: 'writer', icon: '📮', name: '习作小作家', desc: '完成 3 份习作提纲', cur: extra.outlinesDone || 0, total: 3 }
      ];
      list.forEach(function (b) { b.cur = Math.min(b.cur, b.total); b.got = b.cur >= b.total; });
      return list;
    },

    /** 导出全部本地数据（键名去掉前缀） */
    exportAll: function () {
      var out = { app: '语文岛', version: Y.version, exportedAt: new Date().toISOString(), data: {} };
      Y.store.keys().forEach(function (k) { out.data[k] = Y.store.get(k, null); });
      return out;
    }
  };
})(window.YuwenIsland);

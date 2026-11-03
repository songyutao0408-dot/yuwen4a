/* 内容汇总：把各数据文件里的题目收拢成题库，提供抽题、找同类题、待核对清单。
 * 不碰 DOM，测试里也会加载。 */
(function (Y) {
  'use strict';
  var U = Y.util;

  var SKILLS = {
    'poem-fill': '诗句填空',
    'poem-order': '诗句排序',
    'poem-author': '作者与朝代',
    'poem-word': '字词解释',
    'poem-meaning': '诗意理解',
    'poem-lesson': '诗中道理',
    'poem-dictation': '默写',
    'wenyan-fill': '文言文填空',
    'wenyan-word': '文言文字词',
    'wenyan-meaning': '文言文意思',
    'wenyan-segment': '文言文断句',
    'wenyan-pause': '朗读停顿',
    'wenyan-order': '文言文排序',
    'wenyan-dictation': '文言文默写'
  };

  var cache = null;

  /** 由诗文原文自动生成：排序题、上下句默写自查卡、整篇默写卡（保证和原文逐字一致） */
  function generated(poem) {
    var out = [];
    var isWy = poem.kind === 'wenyan';
    out.push({
      id: poem.id + '-order', unit: poem.unit, island: 'poems', poemId: poem.id,
      skill: isWy ? 'wenyan-order' : 'poem-order', type: 'order', difficulty: 2,
      prompt: '把《' + poem.title + '》的' + (isWy ? '句子' : '诗句') + '排回正确的顺序。',
      data: {}, answer: poem.lines.slice(),
      hint: isWy ? '想一想故事先发生了什么，后发生了什么。' : '先找出第一句：' + poem.lines[0].charAt(0) + '……',
      explanation: '正确顺序：' + poem.lines.join(''),
      source: 'textbook', generated: true
    });
    if (!isWy) {
      for (var i = 0; i < poem.lines.length; i += 2) {
        out.push({
          id: poem.id + '-dict-' + (i / 2 + 1), unit: poem.unit, island: 'poems', poemId: poem.id,
          skill: 'poem-dictation', type: 'selfcheck', difficulty: 2,
          prompt: '《' + poem.title + '》：上一句是“' + poem.lines[i] + '”，在纸上默写下一句。',
          data: { front: '写出下一句', back: poem.lines[i] + poem.lines[i + 1], poem: true },
          answer: poem.lines[i + 1],
          hint: '', explanation: '下一句是“' + poem.lines[i + 1] + '”。写错的字多看两遍。',
          source: 'textbook', generated: true
        });
      }
    }
    out.push({
      id: poem.id + '-dict-all', unit: poem.unit, island: 'poems', poemId: poem.id,
      skill: isWy ? 'wenyan-dictation' : 'poem-dictation', type: 'selfcheck', difficulty: 3,
      prompt: '在纸上默写《' + poem.title + '》' + (isWy ? '全文' : '全诗') + '（' + poem.dynasty + '·' + poem.author + '）。',
      data: { front: '写完整篇再翻开', back: poem.lines.join('\n'), poem: true },
      answer: poem.lines.join(''),
      hint: '', explanation: '对照原文，看看有没有漏字、错字、标点写错。',
      source: 'textbook', generated: true
    });
    return out;
  }

  function build() {
    var all = [];
    (Y.data.poems || []).forEach(function (p) {
      (p.questions || []).forEach(function (q) {
        if (!q.island) q.island = 'poems';
        if (q.unit == null) q.unit = p.unit;
        if (!q.poemId) q.poemId = p.id;
        all.push(q);
      });
      all = all.concat(generated(p));
    });
    (Y.data.poemExtra || []).forEach(function (q) { if (!q.island) q.island = 'poems'; all.push(q); });
    // 以后各单元、专项岛的题库都挂在 Y.data.banks 上
    Object.keys(Y.data.banks || {}).forEach(function (k) {
      (Y.data.banks[k] || []).forEach(function (q) { if (!q.island) q.island = k; all.push(q); });
    });
    var byId = {};
    all.forEach(function (q) { byId[q.id] = q; });
    return { all: all, byId: byId };
  }

  function db() { if (!cache) cache = build(); return cache; }

  var C = Y.content = {
    reset: function () { cache = null; },
    all: function () { return db().all; },
    byId: function (id) { return db().byId[id] || null; },
    skillLabel: function (s) { return SKILLS[s] || s || '练习'; },
    skills: SKILLS,

    poem: function (id) { return (Y.data.poems || []).filter(function (p) { return p.id === id; })[0] || null; },
    poemTitle: function (id) { var p = C.poem(id); return p ? p.title : ''; },

    /** 抽题池。f: { island, unit, poemId, types: [], noTypes: [] } */
    pool: function (f) {
      f = f || {};
      return db().all.filter(function (q) {
        if (f.island && q.island !== f.island) return false;
        if (f.unit != null && q.unit !== f.unit) return false;
        if (f.poemId && q.poemId !== f.poemId) return false;
        if (f.types && f.types.indexOf(q.type) < 0) return false;
        if (f.noTypes && f.noTypes.indexOf(q.type) >= 0) return false;
        return true;
      });
    },

    /** 找一道同类题（同技能、同岛，优先同一篇），用于“答错两次后再练一道” */
    similar: function (q, used) {
      used = used || {};
      var cands = db().all.filter(function (x) {
        return x.id !== q.id && !used[x.id] && x.skill === q.skill && x.island === q.island &&
          (q.type === 'selfcheck' || x.type !== 'selfcheck');
      });
      if (!cands.length) return null;
      var same = cands.filter(function (x) { return q.poemId && x.poemId === q.poemId; });
      return U.pick(same.length ? same : cands);
    },

    /** 遍历全部数据，列出标了 needsCheck 的条目，给家长页用 */
    collectNeedsCheck: function (root) {
      var out = [];
      var seen = [];
      (function walk(node, path, ctxLabel) {
        if (!node || typeof node !== 'object') return;
        if (seen.indexOf(node) >= 0) return;
        seen.push(node);
        var label = node.title || node.name || node.word || node.prompt || ctxLabel;
        if (node.needsCheck === true) {
          out.push({ path: path, label: label || path, note: node.checkNote || '', id: node.id || null, text: node.text || '' });
        }
        Object.keys(node).forEach(function (k) {
          walk(node[k], path ? path + '.' + k : k, node.title || ctxLabel);
        });
      })(root || Y.data, '', '');
      return out;
    }
  };
})(window.YuwenIsland);

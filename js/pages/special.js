/* 专项岛：✍️ 句子工坊、🔤 字词乐园、📮 习作小助手 */
(function (Y) {
  'use strict';
  var h = Y.h, U = Y.util;

  function hero(isl, extra) {
    var pr = Y.islandProgress(isl.id);
    return h('section.unit-hero', { style: { '--c': isl.color } },
      h('div.unit-hero-main', h('span.unit-no', isl.name), h('p.unit-lessons', isl.desc), extra || null),
      isl.id === 'writing' ? null : h('div.unit-hero-stat', Y.ui.stars(pr.stars, true), h('span', '完成 ' + pr.pct + '%')));
  }

  function startButtons(id, pool) {
    return h('div.action-grid',
      h('a.action.big', { href: '#/quiz/island/' + id + '?mode=test' }, h('span.action-ico', '🏆'), h('b', '闯关测验'), h('small', '15 题，按正确率得星')),
      h('a.action', { href: '#/quiz/island/' + id + '?mode=practice' }, h('span.action-ico', '✏️'), h('b', '练一练'), h('small', '10 题，共 ' + pool.length + ' 题')));
  }

  function topicList(id, topics) {
    return h('div.feature-list', topics.map(function (t) {
      var n = Y.content.pool({ island: id }).filter(function (q) { return q.skill === t.skill; }).length;
      return h('a.feature', { href: '#/quiz/island/' + id + '?mode=practice&skill=' + t.skill },
        h('span.feature-ico', t.icon), h('span.feature-text', h('b', t.label), h('small', t.desc + ' · ' + n + ' 题')), h('span.chev', '›'));
    }));
  }

  /* ---------- 岛首页 ---------- */
  Y.router.add('/island/:id', function (params) {
    var isl = Y.content.special(params.id);
    if (!isl || isl.id === 'poems') return Y.router.go(isl ? '#/poems' : '#/');
    var body = Y.ui.page({ title: isl.name, icon: isl.icon, back: '#/', theme: isl.color, cls: 'special-page' });
    body.appendChild(hero(isl));

    if (isl.id === 'sentences') {
      var pool = Y.content.pool({ island: 'sentences' });
      body.appendChild(startButtons('sentences', pool));
      body.appendChild(h('h2.sec-title', h('span.sec-dot'), '专项练习'));
      body.appendChild(topicList('sentences', Y.data.sentenceTopics));
      body.appendChild(h('p.tip.center', '这里的例句都是练习用的句子，不是课文原文。'));
    } else if (isl.id === 'words') {
      var wpool = Y.content.pool({ island: 'words', noTypes: ['selfcheck'] });
      var dict = Y.content.pool({ island: 'words', types: ['selfcheck'] });
      body.appendChild(startButtons('words', wpool));
      body.appendChild(h('h2.sec-title', h('span.sec-dot'), '专项练习'));
      body.appendChild(topicList('words', Y.data.wordTopics));
      body.appendChild(h('h2.sec-title', h('span.sec-dot'), '课本生字词'));
      if (dict.length) {
        body.appendChild(h('a.feature', { href: '#/quiz/island/words?mode=dictation' },
          h('span.feature-ico', '🎧'), h('span.feature-text', h('b', '听写模式'), h('small', '听朗读，在纸上写，再翻卡自查 · ' + dict.length + ' 个词语')), h('span.chev', '›')));
      } else {
        body.appendChild(h('section.card.building',
          h('div.building-ico', '📷'),
          h('h2', '等待家长补录生字表'),
          h('p.card-text', '课本的识字表、写字表、词语表还没有录入，所以听写模式暂时不能用。'),
          h('p.card-text.small', '家长可以把课本最后几页拍照放进仓库的 textbook-photos/ 文件夹，或者直接编辑 data/words.js 的 lessons（格式见 README.md “补录生字表”一节）。补录后，听写模式会自动出现。')));
      }
    } else if (isl.id === 'writing') {
      body.appendChild(h('p.tip', '不批改作文，只帮你想清楚怎么写：看指导卡 → 生成提纲 → 写完自查。'));
      body.appendChild(h('div.poem-list.writing-list', Y.data.writing.map(function (w) {
        var saved = Y.store.get('outline:' + w.id, null);
        return h('a.poem-card.writing-card', { href: '#/writing/' + w.id },
          h('span.writing-ico', w.icon),
          h('span.poem-card-by', '第' + U.cnNum(w.unit) + '单元'),
          h('span.poem-card-title', w.title),
          saved && saved.done ? h('span.chip.soft', '提纲已完成') : null);
      })));
    }
  });

  /* ---------- 专项岛的练习、闯关、听写 ---------- */
  Y.router.add('/quiz/island/:id', function (params, query) {
    var isl = Y.content.special(params.id);
    if (!isl) return Y.router.go('#/');
    var mode = query.mode || 'practice';
    var f = { island: isl.id };
    if (mode === 'dictation') f.types = ['selfcheck']; else f.noTypes = ['selfcheck'];
    var pool = Y.content.pool(f);
    var skillName = '';
    if (query.skill) {
      pool = pool.filter(function (q) { return q.skill === query.skill; });
      skillName = Y.content.skillLabel(query.skill);
    }
    if (query.ids) pool = query.ids.split(',').map(Y.content.byId).filter(Boolean);
    Y.quiz.run({
      title: isl.name + ' · ' + (skillName || (mode === 'test' ? '闯关' : mode === 'dictation' ? '听写' : '练一练')),
      icon: isl.icon, theme: isl.color, back: '#/island/' + isl.id,
      pool: pool,
      count: query.ids ? pool.length : mode === 'test' && !query.skill ? 15 : 10,
      mode: query.skill || query.ids ? 'practice' : mode,
      islandId: isl.id
    });
  });

  /* ---------- 习作指导卡 ---------- */
  function writingTheme() { return Y.content.special('writing').color; }

  Y.router.add('/writing/:id', function (params) {
    var w = Y.content.writing(params.id);
    if (!w) return Y.router.go('#/island/writing');
    var body = Y.ui.page({ title: w.title, icon: w.icon, back: '#/island/writing', theme: writingTheme(), cls: 'writing-page' });
    function block(title, items, cls) {
      return h('section.card' + (cls ? '.' + cls : ''), h('h3.card-title', title),
        h('ul.kcard-points', items.map(function (t) { return h('li', t); })));
    }
    body.appendChild(block('📋 题目要求', w.require));
    body.appendChild(block('👣 写作步骤', w.steps));
    body.appendChild(h('section.card', h('h3.card-title', '💡 可以写什么'),
      h('div.idea-chips', w.ideas.map(function (t) { return h('span.idea-chip', t); }))));
    body.appendChild(block('🌟 好词好句（参考）', w.phrases, 'phrases'));
    body.appendChild(h('div.action-grid',
      h('a.action.big', { href: '#/writing/' + w.id + '/outline' }, h('span.action-ico', '🧭'), h('b', '提纲生成器'), h('small', '一步一步选一选、填一填')),
      h('a.action', { href: '#/writing/' + w.id + '/check' }, h('span.action-ico', '✅'), h('b', '写完自查'), h('small', w.checklist.length + ' 项')),
      h('a.action', { href: '#/unit/' + w.unit }, h('span.action-ico', '📖'), h('b', '回第' + U.cnNum(w.unit) + '单元'))));
  });

  /* ---------- 提纲生成器 ---------- */
  Y.router.add('/writing/:id/outline', function (params, query) {
    var w = Y.content.writing(params.id);
    if (!w) return Y.router.go('#/island/writing');
    var steps = Y.data.outlines[w.outline];
    var key = 'outline:' + w.id;
    var saved = Y.store.get(key, null) || { answers: {}, done: false };
    var i = parseInt(query.step, 10);
    if (!(i >= 0 && i <= steps.length)) i = saved.done ? steps.length : 0;
    var body = Y.ui.page({ title: w.title + ' · 提纲', icon: '🧭', back: '#/writing/' + w.id, theme: writingTheme(), cls: 'outline-page' });

    function save() { Y.store.set(key, saved); }
    function go(n) { Y.router.go('#/writing/' + w.id + '/outline?step=' + n); }

    if (i >= steps.length) {
      // 汇总成一张提纲卡
      saved.done = true; save();
      body.appendChild(h('section.outline-card',
        h('div.outline-head', h('span.outline-seal', '纲'), h('div', h('h2', w.title), h('small', '我的习作提纲'))),
        h('dl.outline-list', steps.map(function (s) {
          var v = saved.answers[s.key];
          return [h('dt', s.key), h('dd', v ? v : h('span.todo', '（还没填）'))];
        })),
        h('p.outline-foot', '照着提纲写，写完记得自查哦！')));
      body.appendChild(h('p.tip.center', '可以截图保存这张提纲卡。'));
      body.appendChild(h('div.row-btns',
        h('a.btn', { href: '#/writing/' + w.id + '/outline?step=0' }, '重新修改'),
        h('a.btn.primary', { href: '#/writing/' + w.id + '/check' }, '写完自查 →')));
      return;
    }

    var s = steps[i];
    var val = saved.answers[s.key] || '';
    if (!val && s.today) { var d = new Date(); val = d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日'; }
    body.appendChild(h('div.quiz-head', h('div.quiz-count', h('span', '第 ', h('b', String(i + 1)), ' / ' + steps.length + ' 步'), h('span.chip', s.key)), Y.ui.bar(i / steps.length * 100)));
    var field = h(s.long ? 'textarea.text-input.outline-input' : 'input.text-input.outline-input', { 'aria-label': s.ask, placeholder: '可以点下面的建议，也可以自己写' });
    if (!s.long) field.setAttribute('type', 'text');
    field.value = val;
    var chips = h('div.idea-chips', (s.options || []).map(function (opt) {
      var c = h('button.idea-chip.btnish', { type: 'button' }, opt);
      c.addEventListener('click', function () {
        Y.sound.play('tap');
        if (s.multi) {
          var parts = field.value ? field.value.split('、').filter(Boolean) : [];
          var k = parts.indexOf(opt);
          if (k >= 0) parts.splice(k, 1); else parts.push(opt);
          field.value = parts.join('、');
        } else if (/　$/.test(opt)) {
          field.value = opt; field.focus();       // 署名：后面让孩子自己写名字
        } else {
          field.value = opt;
        }
      });
      return c;
    }));
    body.appendChild(h('section.card',
      h('h2.q-prompt', s.ask),
      field,
      s.options && s.options.length ? h('p.tip', s.multi ? '可以选好几个：' : '点一个建议，也可以改一改：') : null,
      chips));
    function store() { saved.answers[s.key] = field.value.trim(); saved.done = false; save(); }
    body.appendChild(h('div.self-eval',
      h('button.btn.wide', { type: 'button', disabled: i === 0, onclick: function () { store(); go(i - 1); } }, '‹ 上一步'),
      h('button.btn.primary.wide', { type: 'button', onclick: function () { store(); go(i + 1); } }, i === steps.length - 1 ? '生成提纲卡' : '下一步 ›')));
  });

  /* ---------- 写完自查清单 ---------- */
  Y.router.add('/writing/:id/check', function (params) {
    var w = Y.content.writing(params.id);
    if (!w) return Y.router.go('#/island/writing');
    var key = 'check:' + w.id;
    var st = Y.store.get(key, {}) || {};
    var body = Y.ui.page({ title: w.title + ' · 自查', icon: '✅', back: '#/writing/' + w.id, theme: writingTheme() });
    var note = h('p.tip.center');
    function refresh() {
      var n = w.checklist.filter(function (_, i) { return st[i]; }).length;
      note.textContent = n === w.checklist.length ? '🎉 全部检查完了，真棒！' : '已经检查了 ' + n + ' / ' + w.checklist.length + ' 项';
    }
    body.appendChild(h('section.card.checklist', w.checklist.map(function (t, i) {
      var b = h('button.check-row' + (st[i] ? '.on' : ''), { type: 'button', role: 'checkbox', 'aria-checked': String(!!st[i]) },
        h('span.check-box', '✓'), h('span', t));
      b.addEventListener('click', function () {
        st[i] = !st[i]; Y.store.set(key, st);
        b.classList.toggle('on', st[i]); b.setAttribute('aria-checked', String(st[i]));
        if (st[i]) Y.sound.play('tap');
        refresh();
      });
      return b;
    })));
    refresh();
    body.appendChild(note);
    body.appendChild(h('div.row-btns', h('button.btn', { type: 'button', onclick: function () { Y.store.set(key, {}); Y.router.resolve(); } }, '清空重查')));
  });
})(window.YuwenIsland);

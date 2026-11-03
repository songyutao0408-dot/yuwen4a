/* 🏯 古诗文背诵馆：馆首页、单篇页（跟读、注释、大意）、渐进遮字背诵、各种练习入口。 */
(function (Y) {
  'use strict';
  var h = Y.h, U = Y.util;
  var THEME = '#9b3b2f';
  var LEVEL_TIPS = ['遮住每句最后一个字', '遮住每句的后一半', '全部遮住，只留每句第一个字'];

  function hall() { return Y.data.specials.filter(function (s) { return s.id === 'poems'; })[0]; }
  function byline(p) { return p.kind === 'wenyan' ? '文言文' : '［' + p.dynasty + '］' + p.author; }
  function unitLabel(p) { return '第' + U.cnNum(p.unit) + '单元'; }

  function reciteSeals(poemId) {
    var r = Y.progress.recite(poemId);
    return h('span.recite-seals', { 'aria-label': '背诵进度：已过 ' + r.filter(Boolean).length + ' 关' },
      ['一', '二', '三'].map(function (t, i) { return h('span.rseal' + (r[i] ? '.on' : ''), t); }));
  }

  /* ---------- 馆首页 ---------- */
  Y.router.add('/poems', function () {
    var isl = hall();
    var body = Y.ui.page({ title: isl.name, icon: isl.icon, back: '#/', theme: THEME, cls: 'poems-page' });
    var pr = Y.islandProgress('poems');
    body.appendChild(h('section.hall-hero',
      h('div.hall-hero-text',
        h('p.hall-lead', '六首古诗，两篇文言文'),
        h('p.hall-sub', '先跟读，再闯三关背诵，最后默写自查。')),
      h('div.hall-hero-stat', Y.ui.stars(pr.stars, true), h('span', '完成 ' + pr.pct + '%'))));

    body.appendChild(h('div.action-grid',
      h('a.action.big', { href: '#/quiz/poems?mode=test' }, h('span.action-ico', '🏆'), h('b', '闯关测验'), h('small', '15 题，按正确率得星')),
      h('a.action', { href: '#/quiz/poems?mode=practice' }, h('span.action-ico', '✏️'), h('b', '练一练'), h('small', '10 题')),
      h('a.action', { href: '#/quiz/poems?mode=dictation' }, h('span.action-ico', '📝'), h('b', '默写自查'), h('small', '纸上写，翻卡对照'))));

    [['poem', '古诗'], ['wenyan', '文言文']].forEach(function (g) {
      body.appendChild(h('h2.sec-title', h('span.sec-dot'), g[1]));
      body.appendChild(h('div.poem-list', Y.data.poems.filter(function (p) { return p.kind === g[0]; }).map(function (p) {
        return h('a.poem-card', { href: '#/poem/' + p.id },
          h('span.poem-card-title.poem-font', p.title),
          h('span.poem-card-by', byline(p) + ' · ' + unitLabel(p)),
          h('span.poem-card-first.poem-font', p.lines[0]),
          reciteSeals(p.id));
      })));
    });
  });

  /* ---------- 诗文正文（跟读高亮用） ---------- */
  function poemText(p) {
    var wrap = h('div.poem-text' + (p.kind === 'wenyan' ? '.prose' : ''));
    var rows = p.lines.map(function (l) { return h('div.poem-line', l); });
    rows.forEach(function (r) { wrap.appendChild(r); });
    return { el: wrap, rows: rows };
  }

  function readAlong(p, text) {
    if (!Y.speech.enabled()) return null;
    var playing = false;
    var btn = h('button.btn.read-btn', { type: 'button', 'aria-pressed': 'false' }, Y.ui.svg('speaker'), h('span', '跟我读'));
    function stop() {
      playing = false; Y.speech.stop();
      text.rows.forEach(function (r) { r.classList.remove('reading'); });
      btn.lastChild.textContent = '跟我读'; btn.setAttribute('aria-pressed', 'false');
    }
    btn.addEventListener('click', function () {
      if (playing) return stop();
      playing = true;
      btn.lastChild.textContent = '停一停'; btn.setAttribute('aria-pressed', 'true');
      var head = p.kind === 'wenyan' ? [p.title] : [p.title + '，' + p.dynasty + '，' + p.author];
      Y.speech.speakLines(head.concat(p.lines), {
        rate: 0.7,
        onLine: function (i) {
          text.rows.forEach(function (r, j) { r.classList.toggle('reading', j === i - 1); });
        },
        onDone: stop
      });
    });
    Y.router.onLeave(stop);
    return btn;
  }

  /* ---------- 单篇页 ---------- */
  Y.router.add('/poem/:id', function (params) {
    var p = Y.content.poem(params.id);
    if (!p) return Y.router.go('#/poems');
    var body = Y.ui.page({ title: p.title, back: '#/poems', theme: THEME, cls: 'poem-page' });
    var text = poemText(p);
    body.appendChild(h('section.poem-sheet',
      h('h2.poem-title.poem-font', p.title),
      h('p.poem-by', byline(p)),
      text.el,
      readAlong(p, text),
      h('span.ink-dot', { 'aria-hidden': 'true' })));

    body.appendChild(h('section.card',
      h('h3.card-title', '📌 字词小注'),
      h('div.note-list', p.notes.map(function (n) {
        return h('div.note', h('b.poem-font', n.word), n.pinyin ? h('span.note-py', n.pinyin) : null, h('span', n.meaning));
      }))));

    body.appendChild(h('section.card',
      h('h3.card-title', p.kind === 'wenyan' ? '💬 译文' : '💬 说说大意'),
      h('p.card-text', p.meaning.text)));

    body.appendChild(h('section.card', p.points.map(function (pt) {
      return h('div.point', h('h3.card-title', '🌟 ' + pt.label), h('p.card-text', pt.text));
    })));

    var r = Y.progress.recite(p.id);
    body.appendChild(h('div.action-grid',
      h('a.action.big', { href: '#/poem/' + p.id + '/recite' }, h('span.action-ico', '🙈'), h('b', '遮字背诵'), h('small', '三关 · ', reciteSeals(p.id))),
      h('a.action', { href: '#/quiz/poems?mode=practice&poem=' + p.id }, h('span.action-ico', '✏️'), h('b', '本篇练一练')),
      h('a.action', { href: '#/quiz/poems?mode=dictation&poem=' + p.id }, h('span.action-ico', '📝'), h('b', '默写自查'))));
    if (r[2]) body.appendChild(h('p.done-note', '🎉 你已经背会这一篇啦！'));
  });

  /* ---------- 渐进遮字背诵 ---------- */
  Y.router.add('/poem/:id/recite', function (params, query) {
    var p = Y.content.poem(params.id);
    if (!p) return Y.router.go('#/poems');
    var r = Y.progress.recite(p.id);
    var level = parseInt(query.level, 10);
    if (!(level >= 1 && level <= 3)) level = r[0] ? (r[1] ? 3 : 2) : 1;
    var body = Y.ui.page({ title: '背诵《' + p.title + '》', back: '#/poem/' + p.id, theme: THEME, cls: 'recite-page' });

    body.appendChild(h('div.level-tabs', { role: 'tablist' }, [1, 2, 3].map(function (lv) {
      return h('a.level-tab' + (lv === level ? '.on' : '') + (r[lv - 1] ? '.passed' : ''),
        { href: '#/poem/' + p.id + '/recite?level=' + lv, role: 'tab', 'aria-selected': String(lv === level) },
        h('b', '第' + U.cnNum(lv) + '关'), r[lv - 1] ? h('small', '已过 ✓') : h('small', ' '));
    })));

    var m = Y.maskRecite(p, level);
    body.appendChild(h('section.poem-sheet',
      h('p.level-tip', LEVEL_TIPS[level - 1]),
      h('h2.poem-title.poem-font', p.title),
      h('p.poem-by', byline(p)),
      m.el,
      h('p.tip.center', '先小声背一遍。想不起来就点一下方块偷看，没关系的。')));

    var actions = h('div.self-eval',
      h('button.btn.good.wide', { type: 'button', onclick: pass }, '😊 背出来了'),
      h('button.btn.soft.wide', { type: 'button', onclick: notYet }, '🤔 还不熟'));
    body.appendChild(actions);
    body.appendChild(h('div.row-btns',
      h('button.btn.small', { type: 'button', onclick: function () { m.revealAll(); } }, '全部显示'),
      h('button.btn.small', { type: 'button', onclick: function () { m.hideAll(); } }, '重新遮上')));

    function pass() {
      Y.progress.setRecite(p.id, level, true);
      Y.sound.play(level === 3 ? 'star' : 'correct');
      Y.ui.stamp('过', document.querySelector('.poem-sheet'));
      var tail = m.peeks() ? '（偷看了 ' + m.peeks() + ' 个字，下次争取少看几个～）' : '一个字都没偷看，真厉害！';
      if (level < 3) {
        Y.ui.modal({
          icon: '🎉', title: '第' + U.cnNum(level) + '关通过！', body: tail,
          buttons: [
            { label: '挑战第' + U.cnNum(level + 1) + '关', cls: 'primary', onclick: function () { Y.router.go('#/poem/' + p.id + '/recite?level=' + (level + 1)); } },
            { label: '先歇一歇', onclick: function () { Y.router.go('#/poem/' + p.id); } }
          ]
        });
      } else {
        Y.ui.modal({
          icon: '🏯', title: '三关全过，你背会《' + p.title + '》啦！', body: '记得在纸上默写一遍，看看有没有写错的字。',
          buttons: [
            { label: '去默写自查', cls: 'primary', onclick: function () { Y.router.go('#/quiz/poems?mode=dictation&poem=' + p.id); } },
            { label: '回到背诵馆', onclick: function () { Y.router.go('#/poems'); } }
          ]
        });
      }
    }
    function notYet() {
      Y.ui.modal({
        icon: '🌱', title: '没关系，多读几遍就熟了', body: Y.speech.enabled() ? '先跟着读两遍，再回来试试吧。' : '先看着原文大声读两遍，再回来试试吧。',
        buttons: [
          { label: '再试一次', cls: 'primary', onclick: function () { m.hideAll(); } },
          { label: Y.speech.enabled() ? '去跟读' : '去看原文', onclick: function () { Y.router.go('#/poem/' + p.id); } }
        ]
      });
    }
  });

  /* ---------- 练习、闯关、默写 ---------- */
  Y.router.add('/quiz/poems', function (params, query) {
    var mode = query.mode || 'practice';
    var poem = query.poem ? Y.content.poem(query.poem) : null;
    var f = { island: 'poems' };
    if (poem) f.poemId = poem.id;
    if (mode === 'dictation') f.types = ['selfcheck']; else f.noTypes = ['selfcheck'];
    var pool = Y.content.pool(f);
    // 指定题目（错题重练、调试用）：#/quiz/poems?ids=mjy-f1,mjy-w1
    if (query.ids) pool = query.ids.split(',').map(Y.content.byId).filter(Boolean);
    var titles = { test: '古诗文闯关', practice: '古诗文练一练', dictation: '默写自查' };
    Y.quiz.run({
      title: (poem ? '《' + poem.title + '》' : '') + (poem && mode !== 'dictation' ? '练一练' : titles[mode]),
      theme: THEME,
      back: poem ? '#/poem/' + poem.id : '#/poems',
      pool: pool,
      count: query.ids ? pool.length : mode === 'test' && !poem ? 15 : mode === 'dictation' ? (poem ? pool.length : 8) : 10,
      mode: poem ? (mode === 'test' ? 'practice' : mode) : mode,
      islandId: 'poems'
    });
  });
})(window.YuwenIsland);

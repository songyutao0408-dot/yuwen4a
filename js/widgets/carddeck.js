/* 知识卡：一次显示一张，左右滑动或点按钮翻卡；每张可以标记“我懂了”。 */
(function (Y) {
  'use strict';
  var h = Y.h;

  function renderCard(c) {
    var body = h('div.kcard-body',
      h('div.kcard-top', h('span.chip', c.tag || '知识'), c.by ? h('span.kcard-by', c.by) : null),
      h('h3.kcard-title' + (c.tag === '古诗' || c.tag === '文言文' ? '.poem-font' : ''), c.title),
      h('ul.kcard-points', c.points.map(function (p) { return h('li', p); })));
    if (c.table) {
      body.appendChild(h('table.kcard-table',
        h('thead', h('tr', h('th', '第几次'), h('th', '时间'), h('th', '地点'), h('th', '感受'))),
        h('tbody', c.table.map(function (r) {
          return h('tr', h('td', '第' + Y.util.cnNum(r.n) + '次'),
            h('td', r.time || h('span.todo', '待补录')), h('td', r.place), h('td', r.feeling || h('span.todo', '待补录')));
        }))));
    }
    if (c.route && c.route.list) {
      body.appendChild(h('div.kcard-route', h('b', '游览路线：'),
        c.route.list.map(function (r, j) { return [j ? h('span.route-arrow', ' → ') : null, h('span.route-stop', r)]; })));
    }
    if (c.poems && c.poems.length) {
      body.appendChild(h('div.row-btns.left', c.poems.map(function (id) {
        var p = Y.content.poem(id);
        return h('a.btn.small', { href: '#/poem/' + id }, '🏯 《' + p.title + '》');
      })));
    }
    if (c.tips && c.tips.length) {
      body.appendChild(h('div.kcard-tips', c.tips.map(function (t) {
        return h('p', /^易错/.test(t) ? h('b', '⚠️ ') : h('b', '💡 '), t.replace(/^易错：/, '易错：'));
      })));
    }
    return body;
  }

  /** 返回 { el } */
  Y.cardDeck = function (cards, opts) {
    opts = opts || {};
    var i = Math.max(0, Math.min(cards.length - 1, opts.start || 0));
    var stage = h('div.kcard', { tabindex: '0', 'aria-roledescription': '知识卡', 'aria-live': 'polite' });
    var dots = h('div.kdots');
    var knowBtn = h('button.btn.know-btn', { type: 'button', 'aria-pressed': 'false' });
    var prev = h('button.btn.small.knav', { type: 'button', 'aria-label': '上一张' }, '‹ 上一张');
    var next = h('button.btn.small.knav', { type: 'button', 'aria-label': '下一张' }, '下一张 ›');
    var count = h('span.kcount');

    function draw(dir) {
      var c = cards[i];
      stage.innerHTML = '';
      stage.className = 'kcard' + (dir ? ' slide-' + dir : '');
      stage.appendChild(renderCard(c));
      var known = Y.progress.isKnown(c.id);
      knowBtn.textContent = known ? '✓ 我懂了' : '我懂了';
      knowBtn.classList.toggle('on', known);
      knowBtn.setAttribute('aria-pressed', String(known));
      dots.innerHTML = '';
      cards.forEach(function (cc, j) {
        dots.appendChild(h('button.kdot' + (j === i ? '.on' : '') + (Y.progress.isKnown(cc.id) ? '.known' : ''),
          { type: 'button', 'aria-label': '第' + (j + 1) + '张', onclick: function () { go(j); } }));
      });
      count.textContent = (i + 1) + ' / ' + cards.length;
      prev.disabled = i === 0;
      next.disabled = i === cards.length - 1;
      opts.onChange && opts.onChange(i);
    }
    function go(j) {
      if (j < 0 || j >= cards.length || j === i) return;
      var dir = j > i ? 'left' : 'right';
      i = j; Y.sound.play('flip'); draw(dir);
    }

    prev.addEventListener('click', function () { go(i - 1); });
    next.addEventListener('click', function () { go(i + 1); });
    knowBtn.addEventListener('click', function () {
      var c = cards[i], v = !Y.progress.isKnown(c.id);
      Y.progress.setKnown(c.id, v);
      if (v) { Y.sound.play('correct'); Y.ui.stamp('懂', stage); }
      draw();
      if (v && i < cards.length - 1) setTimeout(function () { go(i + 1); }, 450);
      opts.onKnow && opts.onKnow();
    });
    stage.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') go(i - 1);
      if (e.key === 'ArrowRight') go(i + 1);
    });

    // 左右滑动：水平位移大于 50px 且明显大于垂直位移
    var sx = null, sy = 0;
    stage.addEventListener('pointerdown', function (e) { sx = e.clientX; sy = e.clientY; });
    stage.addEventListener('pointerup', function (e) {
      if (sx == null) return;
      var dx = e.clientX - sx, dy = e.clientY - sy; sx = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? i + 1 : i - 1);
    });
    stage.addEventListener('pointercancel', function () { sx = null; });

    draw();
    return { el: h('div.kdeck', stage, h('div.knav-row', prev, count, next), dots, knowBtn) };
  };
})(window.YuwenIsland);

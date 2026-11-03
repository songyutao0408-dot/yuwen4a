/* 单元岛页面：📖 知识卡 / ✏️ 练一练 / 🏆 闯关测验，以及本单元的特色互动。
 * 还没做完的单元（data/units 里没有数据）显示“建设中”。 */
(function (Y) {
  'use strict';
  var h = Y.h, U = Y.util;
  var TABS = [['cards', '📖', '知识卡'], ['practice', '✏️', '练一练'], ['test', '🏆', '闯关测验']];

  Y.router.add('/unit/:n', function (params, query) {
    var n = parseInt(params.n, 10);
    var isl = Y.content.unitIsland(n);
    if (!isl) return Y.router.go('#/');
    var u = Y.content.unit(n);
    if (!u) return Y.pages.building(isl, n);

    var tab = TABS.some(function (t) { return t[0] === query.tab; }) ? query.tab : 'cards';
    var body = Y.ui.page({ title: isl.name, icon: isl.icon, back: '#/', theme: isl.color, cls: 'unit-page' });
    var pr = Y.islandProgress(isl.id);

    body.appendChild(h('section.unit-hero', { style: { '--c': isl.color } },
      h('div.unit-hero-main',
        h('span.unit-no', '第' + U.cnNum(n) + '单元'),
        h('p.unit-lessons', isl.lessons)),
      h('div.unit-hero-stat', Y.ui.stars(pr.stars, true), h('span', '完成 ' + pr.pct + '%'))));
    body.appendChild(h('div.element-note', h('b', '语文要素　'), u.element.text));

    var tabBar = h('div.tabs', { role: 'tablist' }, TABS.map(function (t) {
      return h('a.tab' + (t[0] === tab ? '.on' : ''), { href: '#/unit/' + n + '?tab=' + t[0], role: 'tab', 'aria-selected': String(t[0] === tab) },
        h('span', t[1]), h('span', t[2]));
    }));
    body.appendChild(tabBar);
    var panel = h('div.tab-panel', { role: 'tabpanel' });
    body.appendChild(panel);

    var pool = Y.content.unitPool(n);
    if (tab === 'cards') {
      var known = u.cards.filter(function (c) { return Y.progress.isKnown(c.id); }).length;
      var knownNote = h('p.tip.center', '已经懂了 ' + known + ' / ' + u.cards.length + ' 张');
      panel.appendChild(Y.cardDeck(u.cards, {
        onKnow: function () {
          knownNote.textContent = '已经懂了 ' + u.cards.filter(function (c) { return Y.progress.isKnown(c.id); }).length + ' / ' + u.cards.length + ' 张';
        }
      }).el);
      panel.appendChild(knownNote);
      panel.appendChild(h('a.btn.primary.wide', { href: '#/unit/' + n + '?tab=practice' }, '看完了，去练一练 →'));
    } else if (tab === 'practice') {
      panel.appendChild(h('section.card.start-card',
        h('div.start-ico', '✏️'),
        h('h2', '练一练'),
        h('p.card-text', '每轮 10 题，从本单元 ' + pool.length + ' 道题里随机抽。答错了有提示，不扣分。'),
        h('a.btn.primary.wide', { href: '#/quiz/unit/' + n + '?mode=practice' }, '开始练习')));
      panel.appendChild(h('h2.sec-title', h('span.sec-dot'), '本单元特色互动'));
      panel.appendChild(h('div.feature-list', u.featured.map(function (f) {
        return h('a.feature', { href: '#/quiz/unit/' + n + '?mode=practice&ids=' + f.ids.join(',') },
          h('span.feature-ico', f.icon), h('span.feature-text', h('b', f.label), h('small', f.desc)), h('span.chev', '›'));
      })));
    } else {
      var best = Y.progress.data().best[isl.id];
      panel.appendChild(h('section.card.start-card',
        h('div.start-ico', '🏆'),
        h('h2', '闯关测验'),
        h('p.card-text', '每轮 15 题。正确率 ≥60% 得一星，≥80% 两星，全对三星。'),
        h('div.start-best', Y.ui.stars(pr.stars, true), h('small', best != null ? '最好成绩：' + best + '%' : '还没有闯过关')),
        h('a.btn.primary.wide', { href: '#/quiz/unit/' + n + '?mode=test' }, pr.stars ? '再闯一次' : '开始闯关')));
    }
  });

  Y.router.add('/quiz/unit/:n', function (params, query) {
    var n = parseInt(params.n, 10);
    var isl = Y.content.unitIsland(n);
    if (!isl || !Y.content.unit(n)) return Y.router.go('#/unit/' + n);
    var mode = query.mode === 'test' ? 'test' : 'practice';
    var pool = Y.content.unitPool(n);
    if (query.ids) pool = query.ids.split(',').map(Y.content.byId).filter(Boolean);
    Y.quiz.run({
      title: query.ids ? isl.name + ' · 互动' : isl.name + (mode === 'test' ? ' · 闯关' : ' · 练一练'),
      icon: isl.icon, theme: isl.color,
      back: '#/unit/' + n + '?tab=' + mode,
      pool: pool,
      count: query.ids ? pool.length : mode === 'test' ? 15 : 10,
      mode: query.ids ? 'practice' : mode,
      islandId: isl.id
    });
  });
})(window.YuwenIsland);

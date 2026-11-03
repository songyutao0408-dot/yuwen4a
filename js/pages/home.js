/* 首页：语文岛地图。8 个单元岛 + 4 个专项岛，全部默认开放。 */
(function (Y) {
  'use strict';
  var h = Y.h;

  /** 岛的完成度（0~100）：做对过的题 / 题库题数；古诗文馆再和背诵进度各占一半 */
  Y.islandProgress = function (islandId) {
    var pool = Y.content.pool({ island: islandId, noTypes: ['selfcheck'] });
    var qd = Y.progress.data().q;
    var done = pool.filter(function (q) { return qd[q.id] && qd[q.id].r > 0; }).length;
    var pct = pool.length ? done / pool.length * 100 : 0;
    if (islandId === 'poems') {
      var levels = 0, poems = Y.data.poems;
      poems.forEach(function (p) { levels += Y.progress.recite(p.id).filter(Boolean).length; });
      pct = pct / 2 + levels / (poems.length * 3) * 50;
    }
    return { stars: Y.progress.stars(islandId), pct: Math.round(pct) };
  };

  function hello() {
    var hr = new Date().getHours();
    if (hr < 11) return '早上好';
    if (hr < 14) return '中午好';
    if (hr < 18) return '下午好';
    return '晚上好';
  }

  function islandCard(isl, kind, i) {
    var pr = Y.islandProgress(isl.id);
    var href = isl.href || (kind === 'unit' ? '#/unit/' + isl.unit : '#/island/' + isl.id);
    return h('a.island.' + kind + '.shape' + (i % 4), { href: href, style: { '--c': isl.color } },
      h('span.island-ico', { 'aria-hidden': 'true' }, isl.icon),
      kind === 'unit' ? h('span.island-no', '第' + Y.util.cnNum(isl.unit) + '单元') : null,
      h('span.island-name', isl.name),
      kind === 'special' && isl.desc ? h('span.island-desc', isl.desc) : null,
      h('span.island-foot', Y.ui.stars(pr.stars), h('span.island-pct', pr.pct + '%')),
      Y.ui.bar(pr.pct));
  }

  Y.router.add('/', function () {
    var body = Y.ui.page({ nav: 'home', cls: 'home-page' });
    body.appendChild(h('header.home-hero',
      h('div.hero-seal', { 'aria-hidden': 'true' }, h('span', '语文'), h('span', '岛')),
      h('div.hero-text',
        h('p.hero-hello', hello() + '，小岛主！'),
        h('h1.hero-title', '语文岛 · 四年级上册'),
        h('p.hero-sub', '今天想去哪座岛看看？'))));

    body.appendChild(h('h2.sec-title', h('span.sec-dot'), '专项岛'));
    body.appendChild(h('div.island-grid', Y.data.specials.map(function (s, i) { return islandCard(s, 'special', i); })));
    body.appendChild(h('h2.sec-title', h('span.sec-dot'), '单元岛'));
    body.appendChild(h('div.island-grid', Y.data.islands.map(function (s, i) { return islandCard(s, 'unit', i + 1); })));
    body.appendChild(h('p.home-foot', '统编版 2026 秋 · 四年级上册复习'));
  });
})(window.YuwenIsland);

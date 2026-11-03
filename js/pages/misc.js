/* 设置、家长入口，以及还在建设中的页面。 */
(function (Y) {
  'use strict';
  var h = Y.h, U = Y.util;

  /* ---------- 设置 ---------- */
  function toggle(label, desc, key, disabledNote) {
    var on = Y.settings.get()[key];
    var b = h('button.switch' + (on ? '.on' : ''), { type: 'button', role: 'switch', 'aria-checked': String(on), 'aria-label': label },
      h('span.switch-knob'));
    if (disabledNote) { b.disabled = true; b.classList.remove('on'); b.setAttribute('aria-checked', 'false'); }
    b.addEventListener('click', function () {
      var v = !Y.settings.get()[key];
      Y.settings.set(key, v);
      b.classList.toggle('on', v); b.setAttribute('aria-checked', String(v));
      if (key === 'sound' && v) Y.sound.play('correct');
    });
    return h('div.set-row', h('div.set-text', h('b', label), h('small', disabledNote || desc)), b);
  }

  Y.router.add('/settings', function () {
    var body = Y.ui.page({ title: '设置', icon: '⚙️', nav: 'settings' });
    var s = Y.settings.get();
    var sizes = h('div.seg-ctl', { role: 'radiogroup', 'aria-label': '字号' }, [['normal', '标准'], ['large', '大']].map(function (o) {
      var b = h('button.seg-opt' + (s.fontSize === o[0] ? '.on' : ''), { type: 'button', role: 'radio', 'aria-checked': String(s.fontSize === o[0]) }, o[1]);
      b.addEventListener('click', function () {
        Y.settings.set('fontSize', o[0]);
        Array.prototype.forEach.call(sizes.children, function (x) { x.classList.remove('on'); x.setAttribute('aria-checked', 'false'); });
        b.classList.add('on'); b.setAttribute('aria-checked', 'true');
      });
      return b;
    }));
    body.appendChild(h('section.card.settings',
      toggle('音效', '答对、答错时的提示音', 'sound'),
      toggle('朗读', '古诗跟读、听写时朗读', 'speech', Y.speech.supported ? '' : '这个浏览器不支持朗读，换 Safari 或 Chrome 试试'),
      h('div.set-row', h('div.set-text', h('b', '字号'), h('small', '觉得字小就选“大”')), sizes)));
    body.appendChild(h('section.card.settings',
      h('a.set-row.link', { href: '#/parent-gate' }, h('div.set-text', h('b', '👨‍👩‍👧 家长入口'), h('small', '查看学习情况、待核对清单')), h('span.chev', '›'))));
    if (!Y.store.available) body.appendChild(h('p.tip.center', '提示：当前浏览器不能保存进度，关掉页面后记录会清空。'));
    body.appendChild(h('p.home-foot', '语文岛 v' + Y.version + ' · 不联网，不收集任何数据'));
  });

  /* ---------- 家长门槛 ---------- */
  var GATES = [
    { q: '《题西林壁》的作者是谁？', a: '苏轼', o: ['苏轼', '白居易', '王昌龄', '李清照'] },
    { q: '《凉州词》的作者是谁？', a: '王翰', o: ['王翰', '王昌龄', '卢钺', '苏轼'] },
    { q: '《雪梅》是哪个朝代的诗？', a: '宋', o: ['宋', '唐', '汉', '秦'] }
  ];
  Y.router.add('/parent-gate', function () {
    var g = U.pick(GATES);
    var body = Y.ui.page({ title: '家长入口', back: '#/settings' });
    body.appendChild(h('section.card',
      h('p.card-text', '请家长回答一个小问题：'),
      h('h2.q-prompt', g.q),
      h('div.opts.grid', U.shuffle(g.o).map(function (o) {
        return h('button.opt', { type: 'button', onclick: function (e) {
          if (o === g.a) { sessionOk = true; Y.router.go('#/parent'); }
          else { e.currentTarget.classList.add('bad'); e.currentTarget.disabled = true; Y.ui.toast('不对哦，再想想'); }
        } }, o);
      }))));
  });
  var sessionOk = false;

  /* ---------- 家长页（阶段 1：背诵进度 + 待核对清单；完整统计在阶段 5） ---------- */
  Y.router.add('/parent', function () {
    if (!sessionOk) return Y.router.go('#/parent-gate');
    var body = Y.ui.page({ title: '家长页', back: '#/settings' });
    body.appendChild(h('section.card',
      h('h3.card-title', '🏯 背诵进度'),
      h('table.ptable', h('thead', h('tr', h('th', '篇目'), h('th', '一关'), h('th', '二关'), h('th', '三关'))),
        h('tbody', Y.data.poems.map(function (p) {
          var r = Y.progress.recite(p.id);
          return h('tr', h('td', p.title), r.map(function (x) { return h('td', x ? '✓' : '—'); }));
        })))));

    var list = Y.content.collectNeedsCheck();
    body.appendChild(h('section.card',
      h('h3.card-title', '📋 待核对清单（' + list.length + ' 项）'),
      h('p.card-text.small', '这些内容不是直接来自课本，或者知识清单里注明“待核对”。孩子那边正常显示，请您对照课本或老师的讲解检查一遍；核对无误后，在数据文件里把 needsCheck 改成 false 即可。'),
      h('ol.check-list', list.map(function (it) {
        return h('li', h('b', it.label), it.note ? h('small', it.note) : null, h('code', it.path));
      }))));
    body.appendChild(h('p.tip.center', '各单元正确率、高频错题、导出和清空数据，会在后续版本加入。'));
  });

  /* ---------- 建设中的页面 ---------- */
  function building(title, icon, text, back, theme, extra) {
    var body = Y.ui.page({ title: title, icon: icon, back: back, theme: theme, nav: back ? null : extra && extra.nav });
    body.appendChild(h('section.card.building',
      h('div.building-ico', '🚧'),
      h('h2', '这里正在建设中'),
      h('p.card-text', text),
      extra && extra.links ? h('div.row-btns', extra.links) : null,
      h('a.btn.primary', { href: '#/poems' }, '先去古诗文背诵馆')));
    return body;
  }

  Y.router.add('/unit/:n', function (params) {
    var n = parseInt(params.n, 10);
    var isl = Y.data.islands.filter(function (x) { return x.unit === n; })[0];
    if (!isl) return Y.router.go('#/');
    var poems = Y.data.poems.filter(function (p) { return p.unit === n; });
    var body = building(isl.name, isl.icon, '第' + U.cnNum(n) + '单元：' + isl.lessons + '。知识卡、练一练和闯关测验马上就来。', '#/', isl.color,
      { links: poems.map(function (p) { return h('a.btn', { href: '#/poem/' + p.id }, '《' + p.title + '》'); }) });
    if (poems.length) body.querySelector('.building').insertBefore(h('p.card-text', '本单元的古诗文已经可以学了：'), body.querySelector('.row-btns'));
  });

  Y.router.add('/island/:id', function (params) {
    var isl = Y.data.specials.filter(function (x) { return x.id === params.id; })[0];
    if (!isl) return Y.router.go('#/');
    building(isl.name, isl.icon, isl.desc + '，马上就来。', '#/', isl.color);
  });

  [['daily', '每日一练', '📅'], ['wrong', '错题本', '📒'], ['badges', '奖励', '🏅']].forEach(function (x) {
    Y.router.add('/' + x[0], function () {
      var body = Y.ui.page({ title: x[1], icon: x[2], nav: x[0] });
      var extra = x[0] === 'wrong' ? '你答错过的题已经悄悄记下来了（现在有 ' + Y.progress.wrongIds().length + ' 道），重练功能马上就来。' : '马上就来，先去背诵馆闯闯关吧。';
      body.appendChild(h('section.card.building', h('div.building-ico', x[2]), h('h2', x[1] + '正在建设中'), h('p.card-text', extra),
        h('a.btn.primary', { href: '#/poems' }, '去古诗文背诵馆')));
    });
  });
})(window.YuwenIsland);

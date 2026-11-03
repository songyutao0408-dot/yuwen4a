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
          if (o === g.a) { Y.parentOk = true; Y.router.go('#/parent'); }
          else { e.currentTarget.classList.add('bad'); e.currentTarget.disabled = true; Y.ui.toast('不对哦，再想想'); }
        } }, o);
      }))));
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

  /** 还没做完的单元岛（由 js/pages/unit.js 调用） */
  Y.pages = Y.pages || {};
  Y.pages.building = function (isl, n) {
    var poems = Y.data.poems.filter(function (p) { return p.unit === n; });
    var body = building(isl.name, isl.icon, '第' + U.cnNum(n) + '单元：' + isl.lessons + '。知识卡、练一练和闯关测验马上就来。', '#/', isl.color,
      { links: poems.map(function (p) { return h('a.btn', { href: '#/poem/' + p.id }, '《' + p.title + '》'); }) });
    if (poems.length) body.querySelector('.building').insertBefore(h('p.card-text', '本单元的古诗文已经可以学了：'), body.querySelector('.row-btns'));
  };

})(window.YuwenIsland);

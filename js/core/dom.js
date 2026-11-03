/* DOM 小助手与通用界面：页面外壳、提示条、弹窗、星星、进度条。 */
(function (Y) {
  'use strict';

  /** h('div.cls#id', {attrs}, children...) */
  function h(sel, attrs) {
    var m = sel.match(/^([a-z0-9]+)?((?:[.#][\w-]+)*)$/i) || [];
    var el = document.createElement(m[1] || 'div');
    (m[2] || '').replace(/([.#])([\w-]+)/g, function (_, t, n) {
      if (t === '.') el.classList.add(n); else el.id = n;
    });
    var kids = Array.prototype.slice.call(arguments, 2);
    if (attrs && (typeof attrs !== 'object' || attrs.nodeType || Array.isArray(attrs))) {
      kids.unshift(attrs); attrs = null;
    }
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v == null || v === false) return;
        if (k === 'class') el.className += (el.className ? ' ' : '') + v;
        else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else if (k === 'html') el.innerHTML = v;
        else el.setAttribute(k, v === true ? '' : v);
      });
    }
    append(el, kids);
    return el;
  }
  function append(el, kids) {
    kids.forEach(function (c) {
      if (c == null || c === false) return;
      if (Array.isArray(c)) append(el, c);
      else el.appendChild(c.nodeType ? c : document.createTextNode(String(c)));
    });
  }
  Y.h = h;

  var ui = Y.ui = {};

  /** 主区域 */
  ui.main = function () { return document.getElementById('app'); };

  /**
   * 页面外壳：顶部栏（返回、标题）+ 内容区。返回内容区元素。
   * opts: { title, back, theme, icon, nav: true 显示底部导航, cls }
   */
  ui.page = function (opts) {
    var app = ui.main();
    app.innerHTML = '';
    app.className = 'app' + (opts.cls ? ' ' + opts.cls : '') + (opts.nav ? ' has-nav' : '');
    document.documentElement.style.setProperty('--theme', opts.theme || 'var(--seal)');
    var bar = null;
    if (opts.title) {
      bar = h('header.topbar',
        opts.back ? h('a.back', { href: opts.back, 'aria-label': '返回' }, svg('back')) : h('span.back-space'),
        h('h1.topbar-title', opts.icon ? h('span.ico', opts.icon) : null, opts.title),
        opts.right || h('span.back-space')
      );
      app.appendChild(bar);
    }
    var body = h('main.page-body');
    app.appendChild(body);
    if (opts.nav) app.appendChild(ui.nav(opts.nav));
    window.scrollTo(0, 0);
    return body;
  };

  var NAV = [
    { id: 'home', href: '#/', ico: '🗺️', label: '地图' },
    { id: 'daily', href: '#/daily', ico: '📅', label: '每日一练' },
    { id: 'wrong', href: '#/wrong', ico: '📒', label: '错题本' },
    { id: 'badges', href: '#/badges', ico: '🏅', label: '奖励' },
    { id: 'settings', href: '#/settings', ico: '⚙️', label: '设置' }
  ];
  ui.nav = function (active) {
    return h('nav.bottom-nav', NAV.map(function (n) {
      return h('a.nav-item' + (n.id === active ? '.on' : ''), { href: n.href, 'aria-current': n.id === active ? 'page' : null },
        h('span.nav-ico', n.ico), h('span.nav-label', n.label));
    }));
  };

  /** 星星：stars 0~3 */
  ui.stars = function (n, big) {
    var w = h('span.stars' + (big ? '.big' : ''), { 'aria-label': n + ' 颗星' });
    for (var i = 0; i < 3; i++) w.appendChild(h('span.star' + (i < n ? '.on' : ''), i < n ? '★' : '☆'));
    return w;
  };

  ui.bar = function (pct) {
    return h('span.pbar', { role: 'progressbar', 'aria-valuenow': Math.round(pct), 'aria-valuemin': 0, 'aria-valuemax': 100 },
      h('span.pbar-fill', { style: { width: Math.max(0, Math.min(100, pct)) + '%' } }));
  };

  ui.btn = function (label, onclick, cls) {
    return h('button.btn' + (cls ? '.' + cls.split(' ').join('.') : ''), { type: 'button', onclick: onclick }, label);
  };

  var toastTimer;
  ui.toast = function (text) {
    var t = document.getElementById('toast');
    if (!t) { t = h('div#toast.toast', { role: 'status', 'aria-live': 'polite' }); document.body.appendChild(t); }
    t.textContent = text;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2200);
  };

  /** 弹窗。buttons: [{label, cls, onclick}]；点按钮后自动关闭（onclick 返回 false 则不关） */
  ui.modal = function (opts) {
    var wrap = h('div.modal-wrap', { role: 'dialog', 'aria-modal': 'true' });
    var box = h('div.modal',
      opts.icon ? h('div.modal-icon', opts.icon) : null,
      opts.title ? h('h2.modal-title', opts.title) : null,
      opts.body ? (opts.body.nodeType ? opts.body : h('p.modal-text', opts.body)) : null,
      h('div.modal-actions', (opts.buttons || [{ label: '好的' }]).map(function (b) {
        return ui.btn(b.label, function () {
          if (b.onclick && b.onclick() === false) return;
          close();
        }, b.cls || '');
      }))
    );
    wrap.appendChild(box);
    function close() { wrap.remove(); }
    document.body.appendChild(wrap);
    return { close: close, el: box };
  };

  /** 印章式庆祝动画（≤300ms），尊重减少动态效果设置 */
  ui.stamp = function (text, anchor) {
    var s = h('div.stamp-pop', text || '对');
    (anchor || document.body).appendChild(s);
    setTimeout(function () { s.remove(); }, 900);
  };

  /** 内联 SVG 图标 */
  function svg(name) {
    var paths = {
      back: '<path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
      speaker: '<path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 010 7M18.5 6a8.5 8.5 0 010 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
      stop: '<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/>'
    };
    var span = document.createElement('span');
    span.className = 'svg-ico';
    span.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">' + (paths[name] || '') + '</svg>';
    return span;
  }
  ui.svg = svg;
})(window.YuwenIsland);

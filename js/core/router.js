/* 哈希路由：#/poem/mujiangyin?mode=test
 * 路由表示例：Y.router.add('/poem/:id', function (params, query) {...}) */
(function (Y) {
  'use strict';

  var routes = [];
  var cleanups = [];

  function parse(hash) {
    var s = (hash || '').replace(/^#/, '') || '/';
    var qi = s.indexOf('?');
    var path = qi >= 0 ? s.slice(0, qi) : s;
    var query = {};
    if (qi >= 0) {
      s.slice(qi + 1).split('&').forEach(function (kv) {
        if (!kv) return;
        var p = kv.split('=');
        query[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || '');
      });
    }
    return { path: path, query: query };
  }

  var router = Y.router = {
    add: function (pattern, handler) {
      var keys = [];
      var re = new RegExp('^' + pattern.replace(/\/:(\w+)/g, function (_, k) { keys.push(k); return '/([^/]+)'; }) + '/?$');
      routes.push({ re: re, keys: keys, handler: handler });
    },
    /** 页面离开时要做的清理（停止朗读、计时器等） */
    onLeave: function (fn) { cleanups.push(fn); },
    go: function (hash) {
      if (location.hash === hash) router.resolve(); else location.hash = hash;
    },
    current: function () { return parse(location.hash); },
    resolve: function () {
      cleanups.splice(0).forEach(function (fn) { try { fn(); } catch (e) { /* 忽略 */ } });
      var r = parse(location.hash);
      for (var i = 0; i < routes.length; i++) {
        var m = r.path.match(routes[i].re);
        if (m) {
          var params = {};
          routes[i].keys.forEach(function (k, j) { params[k] = decodeURIComponent(m[j + 1]); });
          routes[i].handler(params, r.query);
          return;
        }
      }
      router.go('#/');
    },
    start: function () {
      window.addEventListener('hashchange', router.resolve);
      router.resolve();
    }
  };
})(window.YuwenIsland);

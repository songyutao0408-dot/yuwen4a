/* 语文岛 · Service Worker：把网页全部文件缓存到手机上，没网也能打开。
 * 只在通过 http(s) 访问时注册（直接双击打开、单文件离线版都不用它）。
 * 改了任何文件后，把 VERSION 加一，手机上会自动换成新版本。
 * 用相对路径，所以放在 GitHub Pages 的 /仓库名/ 子路径下也能用。 */
'use strict';
var VERSION = 'yw4a-v1.0.0';
var ASSETS = [
  './',
  'index.html',
  'css/style.css',
  'manifest.webmanifest',
  'icons/icon.svg',
  'icons/icon-180.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'js/core/ns.js',
  'js/core/store.js',
  'js/core/sound.js',
  'js/core/speech.js',
  'js/core/dom.js',
  'js/core/router.js',
  'js/core/grade.js',
  'js/core/qbuild.js',
  'js/widgets/drag.js',
  'js/widgets/sortable.js',
  'js/widgets/columns.js',
  'js/widgets/segment.js',
  'js/widgets/mask-recite.js',
  'js/core/qtypes.js',
  'js/widgets/story3.js',
  'js/widgets/tianji.js',
  'js/widgets/carddeck.js',
  'js/widgets/tagtext.js',
  'js/widgets/annotate.js',
  'js/widgets/letter.js',
  'js/core/quiz.js',
  'data/islands.js',
  'data/poems.js',
  'data/words.js',
  'data/units/u1.js',
  'data/units/u2.js',
  'data/units/u3.js',
  'data/units/u4.js',
  'data/units/u5.js',
  'data/units/u6.js',
  'data/units/u7.js',
  'data/units/u8.js',
  'data/sentences.js',
  'data/writing.js',
  'js/core/content.js',
  'js/core/learn.js',
  'js/pages/home.js',
  'js/pages/poems.js',
  'js/pages/unit.js',
  'js/pages/special.js',
  'js/pages/learn.js',
  'js/pages/misc.js',
  'js/app.js'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf('yw4a-') === 0 && k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

// 先用缓存，缓存里没有再联网；打开页面时没网就返回首页
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(function (hit) {
    if (hit) return hit;
    return fetch(e.request).then(function (res) {
      if (res && res.ok) { var copy = res.clone(); caches.open(VERSION).then(function (c) { c.put(e.request, copy); }); }
      return res;
    }).catch(function () {
      if (e.request.mode === 'navigate') return caches.match('index.html');
    });
  }));
});
